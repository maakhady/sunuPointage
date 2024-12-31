<?php

namespace App\Http\Controllers;

use App\Models\Pointage;
use App\Models\Utilisateur;
use App\Models\Journal;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

class PointageController extends Controller
{
    /**
     * Créer un log dans le journal
     */
    private function createLog($action, $details = [], $status = 'success')
    {
        Journal::create([
            'user_id' => Auth::id(),
            'action' => $action,
            'details' => $details,
            'ip' => request()->ip(),
            'description' => "Action {$action} effectuée sur un pointage",
            'status' => $status
        ]);
    }

    /**
     * Configuration des middlewares pour sécuriser les routes
     */

    public function __construct()
    {
        $this->middleware('jwt.verifie.vigile')->only(['validerPointage']);
        $this->middleware('jwt.admin')->only(['modifierPointage', 'genererAbsences']);
    }

    /**
     * Gestion du pointage utilisateur via badge
     * Vérifie la carte, crée ou met à jour le pointage
     * @param Request $request Contient le cardId
     * @return JsonResponse
     */

    public function pointer(Request $request)
    {
        // Validation du cardId
        $validator = Validator::make($request->all(), [
            'cardId' => 'required|string'
        ]);

        if ($validator->fails()) {
            $this->createLog('pointage_echec', [
                'cardId' => $request->cardId,
                'error' => 'CardId requis'
            ], 'error');

            return response()->json([
                'status' => false,
                'message' => 'CardId requis'
            ], 400);
        }

        // Recherche utilisateur actif avec cette carte
        $utilisateur = Utilisateur::where('cardId', $request->cardId)
            ->where('statut', 'actif')
            ->first();

        // Vérification existence utilisateur
        if (!$utilisateur) {
            $this->createLog('pointage_echec', [
                'cardId' => $request->cardId,
                'error' => 'Carte non reconnue ou inactive'
            ], 'error');

            return response()->json([
                'status' => false,
                'message' => 'Accès refusé: Carte non reconnue ou inactive'
            ], 403);
        }
        // Vérification si l'utilisateur est en congé
        if ($utilisateur->estEnConge()) {
            $this->createLog('pointage_echec', [
                'user_id' => $utilisateur->_id,
                'error' => 'Utilisateur en congé'
            ], 'error');

            return response()->json([
                'status' => false,
                'message' => 'Utilisateur en congé'
            ], 403);
        }
        // Initialisation des variables de temps
        $now = Carbon::now();
        $today = Carbon::today();
        $heureDebutJournee = Carbon::today()->setHour(8)->setMinute(30);

            // Recherche pointage existant pour aujourd'hui
        $pointage = Pointage::where('user_id', $utilisateur->_id)
            ->whereDate('date', $today)
            ->first();

        if ($pointage) {
        // Mise à jour du pointage existant en attente
            $updateData = [
                'estPresent' => false, // Reste faux jusqu'à validation
                'estEnAttente' => true  // Nouveau champ pour indiquer l'attente de validation
            ];

            if (!$pointage->premierPointage) {
                $updateData['premierPointage_temp'] = $now;  // Stockage temporaire premier pointage
                $updateData['estRetard_temp'] = $now->greaterThan($heureDebutJournee);
            } else {
                $updateData['dernierPointage_temp'] = $now;  // Stockage temporaire dernier pointage
            }

            $pointage->update($updateData);
        } else {
            // Création nouveau pointage en attente
            $pointage = Pointage::create([
                'user_id' => $utilisateur->_id,
                'date' => $today,
                'premierPointage_temp' => $now,
                'estRetard_temp' => $now->greaterThan($heureDebutJournee),
                'estPresent' => false,  // Reste faux jusqu'à validation
                'estEnAttente' => true  // En attente de validation
            ]);
        }
//logg
        $this->createLog('pointage_enregistre', [
            'user_id' => $utilisateur->_id,
            'pointage_id' => $pointage->_id,
            'type' => $pointage->premierPointage ? 'sortie' : 'entree'
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Pointage en attente de validation',
            'data' => [
                'utilisateur' => $utilisateur,
                'pointage' => $pointage
            ]
        ]);
    }

    /**
     * Génère les pointages "absent" par défaut pour tous les utilisateurs
     * Utilisé chaque matin pour initialiser les pointages
     * @return JsonResponse
     */
    public function genererAbsences()
    {
        try {
            $today = Carbon::today();
             // Récupération utilisateurs actifs non en congé
            $utilisateurs = Utilisateur::where('statut', 'actif')
                ->whereNotIn('_id', function($query) {
                    $query->select('user_id')
                          ->from('conges')
                          ->whereDate('date_debut', '<=', now())
                          ->whereDate('date_fin', '>=', now());
                })
                ->get();
                 // Préparation des données pour insertion massive
            $absences = $utilisateurs->map(function($utilisateur) use ($today) {
                return [
                    'user_id' => $utilisateur->_id,
                    'date' => $today,
                    'estPresent' => false,
                    'estRetard' => false,
                    'premierPointage' => null,
                    'dernierPointage' => null,
                    'created_at' => now(),
                    'updated_at' => now()
                ];
            })->toArray();
        // Insertion massive dans MongoDB
            Pointage::raw()->insertMany($absences);

            $this->createLog('generation_absences', [
                'date' => $today->format('Y-m-d'),
                'nombre_utilisateurs' => count($absences)
            ]);

            return response()->json([
                'status' => true,
                'message' => 'Pointages par défaut générés pour ' . count($absences) . ' utilisateurs'
            ]);
        } catch (\Exception $e) {
            $this->createLog('generation_absences', [
                'error' => $e->getMessage()
            ], 'error');

            throw $e;
        }
    }


    /**
     * Validation ou rejet d'un pointage par un vigile
     * @param Request $request
     * @param string $id ID du pointage
     * @return JsonResponse
     */

    public function validerPointage(Request $request, $id)
    {
        $pointage = Pointage::find($id);
    
        if (!$pointage || !$pointage->estEnAttente) {
            $this->createLog('validation_pointage_echec', [
                'pointage_id' => $id,
                'error' => 'Pointage non trouvé ou déjà traité'
            ], 'error');

            return response()->json([
                'status' => false,
                'message' => 'Pointage non trouvé ou déjà traité'
            ], 404);
        }
    
        $validated = $request->validate([
            'vigile_id' => 'required|exists:utilisateurs,_id',
            'action' => 'required|in:valider,rejeter',
        ]);
    
        if ($validated['action'] === 'valider') {
            // Validation du pointage
            $updateData = [
                'vigile_id' => $validated['vigile_id'],
                'estPresent' => true,
                'estEnAttente' => false,
                // Conversion des données temporaires en données définitives
                'premierPointage' => $pointage->premierPointage_temp ?? $pointage->premierPointage,
                'dernierPointage' => $pointage->dernierPointage_temp ?? $pointage->dernierPointage,
                'estRetard' => $pointage->estRetard_temp ?? $pointage->estRetard
            ];
        } else {
            // Rejet du pointage
            $updateData = [
                'estEnAttente' => false,
                'estRejete' => true,
                'vigile_id' => $validated['vigile_id']
            ];
        }
    
        $pointage->update($updateData);

        $this->createLog('validation_pointage', [
            'pointage_id' => $id,
            'action' => $validated['action'],
            'vigile_id' => $validated['vigile_id']
        ]);
    
        return response()->json([
            'status' => true,
            'message' => $validated['action'] === 'valider' ? 'Pointage validé' : 'Pointage rejeté',
            'data' => $pointage
        ]);
    }

    /**
     * Modification d'un pointage par un administrateur
     * @param Request $request
     * @param string $id ID du pointage
     * @return JsonResponse
     */

    public function modifierPointage(Request $request, $id)
    {
        $pointage = Pointage::find($id);

        if (!$pointage) {
            $this->createLog('modification_pointage_echec', [
                'pointage_id' => $id,
                'error' => 'Pointage non trouvé'
            ], 'error');

            return response()->json([
                'status' => false,
                'message' => 'Pointage non trouvé'
            ], 404);
        }

        $validated = $request->validate([
            'premierPointage' => 'nullable|date',
            'dernierPointage' => 'nullable|date',
            'estPresent' => 'nullable|boolean',
            'estRetard' => 'nullable|boolean',
        ]);

        $oldData = $pointage->toArray();
        $pointage->update($validated);

        $this->createLog('modification_pointage', [
            'pointage_id' => $id,
            'modifications' => array_diff_assoc($validated, $oldData)
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Pointage modifié avec succès',
            'data' => $pointage
        ]);
    }

    /**
     * Liste des pointages avec filtres optionnels
     * @param Request $request
     * @return JsonResponse
     */

    public function index(Request $request)
    {
        $query = Pointage::query();
        // Filtre par date
        if ($date = $request->input('date')) {
            $query->whereDate('date', Carbon::parse($date));
        }

            // Filtre par utilisateur
        if ($userId = $request->input('user_id')) {
            $query->where('user_id', $userId);
        }

        // Pagination des résultats
        $pointages = $query->with(['utilisateur', 'vigile'])
                          ->paginate($request->input('per_page', 15));

        $this->createLog('consultation_pointages', [
            'filtres' => [
                'date' => $date,
                'user_id' => $userId
            ],
            'nombre_resultats' => $pointages->total()
        ]);

        return response()->json([
            'status' => true,
            'data' => $pointages
        ]);
    }

        /**
     * Récupérer l'historique des pointages avec filtres
     * @param Request $request
     * @return JsonResponse
     */

    public function historique(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'debut' => 'required|date',
            'fin' => 'required|date|after_or_equal:debut',
            'user_id' => 'sometimes|exists:utilisateurs,_id',
            'type' => 'sometimes|in:retard,absence'
        ]);

        if ($validator->fails()) {
            $this->createLog('historique_pointages_echec', [
                'erreurs' => $validator->errors()->toArray()
            ], 'error');

            return response()->json([
                'status' => false,
                'message' => $validator->errors()
            ], 400);
        }

        $query = Pointage::whereBetween('date', [
            Carbon::parse($request->debut),
            Carbon::parse($request->fin)
        ]);

              // Filtre par utilisateur  
        if ($request->user_id) {
            $query->where('user_id', $request->user_id);
        }
       // Filtre par type
        if ($request->type === 'retard') {
            $query->where('estRetard', true);
        } elseif ($request->type === 'absence') {
            $query->where('estPresent', false);
        }

        $pointages = $query->with(['utilisateur'])
                        ->orderBy('date', 'desc')
                        ->paginate($request->input('per_page', 15));

        $this->createLog('historique_pointages', [
            'filtres' => [
                'debut' => $request->debut,
                'fin' => $request->fin,
                'user_id' => $request->user_id,
                'type' => $request->type
            ],
            'nombre_resultats' => $pointages->total()
        ]);

        return response()->json([
            'status' => true,
            'data' => $pointages
        ]);
    }


        /**
     * Filtrage des présences des apprenants et employés
     * @param Request $request
     * @return JsonResponse
     */
    public function filtrerPresences(Request $request)
    {
        // Validation des paramètres de filtrage
        $validated = $request->validate([
            'date_debut' => 'required|date',
            'date_fin' => 'required|date|after_or_equal:date_debut',
            'cohorte_id' => 'sometimes|exists:cohortes,_id',
            'departement_id' => 'sometimes|exists:departements,_id',
            'statut_presence' => 'sometimes|in:present,absent,retard',
            'type' => 'sometimes|in:apprenant,employe'
        ]);

            // Requête de base avec jointures
        $query = Pointage::with(['utilisateur' => function($query) use ($validated) {
            // Filtrage par type si spécifié
            if (isset($validated['type'])) {
                $query->where('type', $validated['type']);
            }
            // Filtrage par département si spécifié
            if (isset($validated['departement_id'])) {
                $query->where('departement_id', $validated['departement_id']);
            }
        }]);
         // Filtrage par plage de dates
        $query->whereBetween('date', [
            Carbon::parse($validated['date_debut']),
            Carbon::parse($validated['date_fin'])
        ]);

        // Filtrage par cohorte 
        if (isset($validated['cohorte_id'])) {
            $query->whereHas('utilisateur', function($q) use ($validated) {
                $q->where('cohorte_id', $validated['cohorte_id']);
            });
        }

        // Filtrage par statut de présence
        if (isset($validated['statut_presence'])) {
            switch ($validated['statut_presence']) {
                case 'present':
                    $query->where('estPresent', true);
                    break;
                case 'absent':
                    $query->where('estPresent', false);
                    break;
                case 'retard':
                    $query->where('estRetard', true);
                    break;
            }
        }

        // Pagination et résultats
        $resultats = $query->paginate($request->input('par_page', 15));

        // Calcul des statistiques
        $total_utilisateurs = $resultats->total();
        $presents = 0;
        $absents = 0;
        $retards = 0;

        foreach ($resultats as $pointage) {
            if ($pointage->estPresent) {
                $presents++;
            } else {
                $absents++;
            }
            if ($pointage->estRetard) {
                $retards++;
            }
        }

        $statistiques = [
            'total_utilisateurs' => $total_utilisateurs,
            'presents' => $presents,
            'absents' => $absents,
            'retards' => $retards,
            'pourcentage_presence' => round(($presents / $total_utilisateurs) * 100, 2)
        ];

        $this->createLog('filtrage_presences', [
            'filtres' => $validated,
            'statistiques' => $statistiques,
            'nombre_resultats' => $total_utilisateurs
        ]);

        return response()->json([
            'status' => true,
            'data' => $resultats,
            'statistiques' => $statistiques
        ]);
    }


    /**
     * Récupération des présences selon les critères de filtrage
     * @param Request $request
     * @return JsonResponse
     */
    public function recupererPresences(Request $request)
    {
        // Validation des paramètres de filtrage
        $validated = $request->validate([
            'date' => 'required|date',
            'periode' => 'required|in:journee,semaine,mois',
            'cohorte_id' => 'sometimes|exists:cohortes,_id',
            'departement_id' => 'sometimes|exists:departements,_id',
            'statut_presence' => 'sometimes|in:present,absent,retard',
            'type' => 'sometimes|in:apprenant,employe'
        ]);

        $query = Pointage::with(['utilisateur' => function($query) use ($validated) {
            // Filtrage par type si spécifié
            if (isset($validated['type'])) {
                $query->where('type', $validated['type']);
            }
            // Filtrage par département si spécifié
            if (isset($validated['departement_id'])) {
                $query->where('departement_id', $validated['departement_id']);
            }
        }]);

        // Filtrage par date et période
        switch ($validated['periode']) {
            case 'journee':
                $query->whereDate('date', $validated['date']);
                break;
            case 'semaine':
                $startDate = Carbon::parse($validated['date'])->startOfWeek();
                $endDate = Carbon::parse($validated['date'])->endOfWeek();
                $query->whereBetween('date', [$startDate, $endDate]);
                break;
            case 'mois':
                $startDate = Carbon::parse($validated['date'])->startOfMonth();
                $endDate = Carbon::parse($validated['date'])->endOfMonth();
                $query->whereBetween('date', [$startDate, $endDate]);
                break;
        }

         // Filtrage par cohorte
        if (isset($validated['cohorte_id'])) {
            $query->whereHas('utilisateur', function($q) use ($validated) {
                $q->where('cohorte_id', $validated['cohorte_id']);
            });
        }
        // Filtrage par statut de présence
        if (isset($validated['statut_presence'])) {
            switch ($validated['statut_presence']) {
                case 'present':
                    $query->where('estPresent', true);
                    break;
                case 'absent':
                    $query->where('estPresent', false);
                    break;
                case 'retard':
                    $query->where('estRetard', true);
                    break;
            }
        }

        // Pagination et résultats
        $resultats = $query->paginate($request->input('par_page', 15));

        // Calcul des statistiques
        $total_utilisateurs = $resultats->total();
        $presents = 0;
        $absents = 0;
        $retards = 0;

        foreach ($resultats as $pointage) {
            if ($pointage->estPresent) {
                $presents++;
            } else {
                $absents++;
            }
            if ($pointage->estRetard) {
                $retards++;
            }
        }

        $statistiques = [
            'total_utilisateurs' => $total_utilisateurs,
            'presents' => $presents,
            'absents' => $absents,
            'retards' => $retards,
            'pourcentage_presence' => round(($presents / $total_utilisateurs) * 100, 2)
        ];

        $this->createLog('recuperation_presences', [
            'filtres' => $validated,
            'statistiques' => $statistiques,
            'nombre_resultats' => $total_utilisateurs
        ]);

        return response()->json([
            'status' => true,
            'data' => $resultats,
            'statistiques' => $statistiques
        ]);
    }
}