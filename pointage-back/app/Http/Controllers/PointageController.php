<?php

namespace App\Http\Controllers;

use App\Models\Pointage;
use App\Models\Utilisateur;
use App\Models\Journal;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

use Illuminate\Http\JsonResponse;


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
                'cardId' => $request->cardId, // Ajout du cardId
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
                'cardId' => $request->cardId, // Ajout du cardId
                'date' => $today,
                'premierPointage_temp' => $now,
                'estRetard_temp' => $now->greaterThan($heureDebutJournee),
                'estPresent' => false,  // Reste faux jusqu'à validation
                'estEnAttente' => true  // En attente de validation
            ]);
        }

        // Log
        $this->createLog('pointage_enregistre', [
            'user_id' => $utilisateur->_id,
            'pointage_id' => $pointage->_id,
            'cardId' => $request->cardId, // Ajout du cardId dans le log
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
     * Validation ou rejet d'un pointage par un vigile
     * @param Request $request
     * @param string $id ID du pointage
     * @return JsonResponse
     */

     public function validerPointage(Request $request, $cardId)
     {
         // Recherche du pointage le plus récent en attente pour ce cardId
         $pointage = Pointage::where('cardId', $cardId)
             ->where('estEnAttente', true)
             ->orderBy('created_at', 'desc')
             ->first();

         if (!$pointage) {
             $this->createLog('validation_pointage_echec', [
                 'cardId' => $cardId,
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
             'cardId' => $cardId,
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


    //  public function index(Request $request)
    //  {
    //      $query = Pointage::query();

    //      // Filtre par date
    //      if ($date = $request->input('date')) {
    //          $query->whereDate('date', Carbon::parse($date));
    //      }

    //      // Filtre par utilisateur
    //      if ($userId = $request->input('user_id')) {
    //          $query->where('user_id', $userId);
    //      }

    //      // Récupération des résultats sans pagination
    //      $pointages = $query->with(['user', 'vigile'])->get();

    //      $this->createLog('consultation_pointages', [
    //          'filtres' => [
    //              'date' => $date,
    //              'user_id' => $userId
    //          ],
    //          'nombre_resultats' => $pointages->count()
    //      ]);

    //      return response()->json([
    //          'status' => true,
    //          'data' => $pointages
    //      ]);

    //     }

    public function index(Request $request)
{
    try {
        $query = Pointage::query();

        // Filtre par date si fournie
        if ($date = $request->input('date')) {
            $query->whereDate('date', Carbon::parse($date));
        }

        // Filtre par utilisateur si fourni
        if ($userId = $request->input('user_id')) {
            $query->where('user_id', $userId);
        }

        // Récupération des pointages avec les relations
        $pointages = $query->with(['user' => function($query) {
                $query->select('_id', 'nom', 'prenom', 'matricule', 'cardId','type','telephone');
            },
            'vigile' => function($query) {
                $query->select('_id', 'nom', 'prenom');
            }])
            ->where('estPresent', true)
            ->whereNotNull('vigile_id')
            ->orderBy('date', 'desc')
            ->get();

        // Statistiques
        $statistiques = [
            'total_pointages' => $pointages->count(),
            'total_present' => $pointages->where('estPresent', true)->count(),
            'total_retard' => $pointages->where('estRetard', true)->count()
        ];

        $this->createLog('consultation_pointages', [
            'filtres' => [
                'date' => $date,
                'user_id' => $userId
            ],
            'statistiques' => $statistiques,
            'nombre_resultats' => $pointages->count()
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Récupération des pointages réussie',
            'data' => $pointages,
            'statistiques' => $statistiques
        ]);

    } catch (\Exception $e) {
        $this->createLog('erreur_consultation_pointages', [
            'message' => $e->getMessage()
        ], 'error');

        return response()->json([
            'status' => false,
            'message' => 'Erreur lors de la récupération des pointages',
            'error' => $e->getMessage()
        ], 500);
    }
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


    // filtrer

    public function recupererPresences(Request $request)
    {
        try {
            // Validation unifiée des paramètres
            $validated = $request->validate([
                'date' => 'required_without:date_debut|date',
                'date_debut' => 'required_without:date|date',
                'date_fin' => 'required_with:date_debut|date|after_or_equal:date_debut',
                'periode' => 'required_without:date_debut|in:journee,semaine,mois',
                'cohorte_id' => 'sometimes|exists:cohortes,_id',
                'departement_id' => 'sometimes|exists:departements,_id',
                'statut_presence' => 'sometimes|in:present,absent,retard',
                'type' => 'sometimes|in:apprenant,employe',
                'per_page' => 'sometimes|integer|min:1'
            ]);

            // Construction de la requête de base
            $query = Pointage::with([
                'user' => function($query) {
                    $query->select('_id', 'nom', 'prenom', 'matricule', 'cardId', 'type', 'departement_id', 'cohorte_id');
                },
                'vigile' => function($query) {
                    $query->select('_id', 'nom', 'prenom');
                }
            ]);

            // Filtrage par type et département
            if (isset($validated['type']) || isset($validated['departement_id'])) {
                $query->whereHas('user', function($q) use ($validated) {
                    if (isset($validated['type'])) {
                        $q->where('type', $validated['type']);
                    }
                    if (isset($validated['departement_id'])) {
                        $q->where('departement_id', $validated['departement_id']);
                    }
                });
            }

            // Gestion des dates
            if (isset($validated['date_debut']) && isset($validated['date_fin'])) {
                // Mode plage de dates
                $query->whereBetween('date', [
                    Carbon::parse($validated['date_debut']),
                    Carbon::parse($validated['date_fin'])
                ]);
            } else {
                // Mode période
                $date = Carbon::parse($validated['date']);
                switch ($validated['periode']) {
                    case 'journee':
                        $query->whereDate('date', $date);
                        break;
                    case 'semaine':
                        $query->whereBetween('date', [
                            $date->copy()->startOfWeek(),
                            $date->copy()->endOfWeek()
                        ]);
                        break;
                    case 'mois':
                        $query->whereBetween('date', [
                            $date->copy()->startOfMonth(),
                            $date->copy()->endOfMonth()
                        ]);
                        break;
                }
            }

            // Filtrage par cohorte
            if (isset($validated['cohorte_id'])) {
                $query->whereHas('user', function($q) use ($validated) {
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

            // Récupération des résultats avec pagination optionnelle
            $perPage = $validated['per_page'] ?? null;
            $resultats = $perPage ?
                $query->orderBy('date', 'desc')->paginate($perPage) :
                $query->orderBy('date', 'desc')->get();

            // Calcul des statistiques
            $total = $resultats instanceof \Illuminate\Pagination\LengthAwarePaginator ?
                $resultats->total() : $resultats->count();

            $statistiques = [
                'total_pointages' => $total,
                'total_present' => $resultats->where('estPresent', true)->count(),
                'total_retard' => $resultats->where('estRetard', true)->count(),
                'total_absent' => $resultats->where('estPresent', false)->count(),
                'pourcentage_presence' => $total > 0 ?
                    round(($resultats->where('estPresent', true)->count() / $total) * 100, 2) : 0
            ];

            // Log de l'opération
            $this->createLog('recuperation_presences', [
                'filtres' => $validated,
                'statistiques' => $statistiques,
                'nombre_resultats' => $total
            ]);

            return response()->json([
                'status' => true,
                'message' => 'Récupération des présences réussie',
                'data' => $resultats,
                'statistiques' => $statistiques
            ]);

        } catch (\Exception $e) {
            $this->createLog('erreur_recuperation_presences', [
                'message' => $e->getMessage()
            ], 'error');

            return response()->json([
                'status' => false,
                'message' => 'Erreur lors de la récupération des présences',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    /**
 * Récupérer les pointages du jour
 * @return JsonResponse
 */
public function getPointagesJour()
{
    $today = Carbon::today();

    $pointages = Pointage::whereDate('date', $today)
        ->with(['utilisateur', 'vigile'])
        ->get();

    $this->createLog('consultation_pointages_jour', [
        'date' => $today->format('Y-m-d'),
        'nombre_resultats' => $pointages->count()
    ]);

    return response()->json([
        'status' => true,
        'data' => $pointages
    ]);
}


public function getUtilisateursPointes(Request $request)
{
   try {
       $query = Pointage::where([
           'date' => Carbon::today()->startOfDay(),
           'estPresent' => true,
           'vigile_id' => ['$ne' => null]
       ]);

       $pointages = $query->with(['utilisateur'])->get();

       error_log("Debug pointages: " . json_encode([
           'date' => Carbon::today()->format('Y-m-d'),
           'count' => $pointages->count(),
           'resultats' => $pointages->toArray()
       ]));

       return response()->json([
           'status' => true,
           'data' => $pointages
       ]);

   } catch (\Exception $e) {
       error_log("Erreur pointages: " . $e->getMessage() . "\n" .
                "File: " . $e->getFile() . "\n" .
                "Line: " . $e->getLine() . "\n" .
                "Trace: " . $e->getTraceAsString());

       return response()->json([
           'status' => false,
           'message' => 'Erreur lors de la récupération des pointages',
           'error' => $e->getMessage()
       ], 500);
   }
}



/**
     * Enregistre les absences pour la journée
     */
    public function enregistrerAbsences(Request $request)
    {
        try {
            $date = $request->input('date', Carbon::today()->format('Y-m-d'));

            $resultats = Pointage::enregistrerAbsences($date);

            return response()->json([
                'status' => true,
                'message' => 'Traitement des absences terminé',
                'data' => $resultats
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Erreur lors de l\'enregistrement des absences',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Vérifie l'absence d'un utilisateur
     */
    public function verifierAbsence(Request $request)
    {
        try {
            $userId = $request->input('user_id');
            $date = $request->input('date', Carbon::today()->format('Y-m-d'));

            $estAbsent = Pointage::etaitAbsent($userId, $date);

            return response()->json([
                'status' => true,
                'estAbsent' => $estAbsent
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Erreur lors de la vérification de l\'absence',
                'error' => $e->getMessage()
            ], 500);
        }
    }



  /**
 * Données pour graphique des présences par jour (VERSION MONGODB)
 * @param Request $request
 * @return JsonResponse
 */
public function graphiquePresencesParJour(Request $request)
{
    try {
        $validator = Validator::make($request->all(), [
            'debut' => 'required|date',
            'fin' => 'required|date|after_or_equal:debut',
            'cohorte_id' => 'sometimes|string',
            'departement_id' => 'sometimes|string',
            'type' => 'sometimes|in:apprenant,employe'
        ]);

        if ($validator->fails()) {
            \Log::error('Validation échouée pour graphique présences jour', [
                'errors' => $validator->errors()->toArray()
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 400);
        }

        $debut = Carbon::parse($request->debut)->startOfDay();
        $fin = Carbon::parse($request->fin)->endOfDay();

        \Log::info('Début requête graphique présences MongoDB', [
            'debut' => $debut->toISOString(),
            'fin' => $fin->toISOString(),
            'filters' => $request->all()
        ]);

        // Construction de la requête de base pour MongoDB
        $query = Pointage::whereBetween('date', [$debut, $fin]);

        // Application des filtres avec relations MongoDB
        if ($request->cohorte_id || $request->departement_id || $request->type) {
            $query->whereHas('utilisateur', function($q) use ($request) {
                if ($request->cohorte_id) {
                    $q->where('cohorte_id', $request->cohorte_id);
                }
                if ($request->departement_id) {
                    $q->where('departement_id', $request->departement_id);
                }
                if ($request->type) {
                    $q->where('type', $request->type);
                }
            });
        }

        // Récupérer tous les pointages dans la période
        $pointages = $query->orderBy('date', 'asc')->get();

        \Log::info('Pointages récupérés', [
            'count' => $pointages->count()
        ]);

        // Grouper les données par jour (traitement en PHP car MongoDB ne supporte pas SELECT complexe)
        $groupedData = [];
        
        foreach ($pointages as $pointage) {
            $jour = Carbon::parse($pointage->date)->format('Y-m-d');
            
            if (!isset($groupedData[$jour])) {
                $groupedData[$jour] = [
                    'jour' => $jour,
                    'total_pointages' => 0,
                    'presents' => 0,
                    'retards' => 0,
                    'absents' => 0
                ];
            }
            
            $groupedData[$jour]['total_pointages']++;
            
            // Comptage selon les conditions
            if ($pointage->estPresent && !$pointage->estRetard) {
                $groupedData[$jour]['presents']++;
            } elseif ($pointage->estRetard) {
                $groupedData[$jour]['retards']++;
            } elseif (!$pointage->estPresent) {
                $groupedData[$jour]['absents']++;
            }
        }

        // Trier par date
        ksort($groupedData);

        // Formater les données pour le graphique
        $labels = [];
        $dataPresents = [];
        $dataRetards = [];
        $dataAbsents = [];

        foreach ($groupedData as $donnee) {
            $labels[] = Carbon::parse($donnee['jour'])->format('d/m/Y');
            $dataPresents[] = $donnee['presents'];
            $dataRetards[] = $donnee['retards'];
            $dataAbsents[] = $donnee['absents'];
        }

        // Si aucune donnée, retourner un graphique vide
        if (empty($labels)) {
            return response()->json([
                'status' => true,
                'message' => 'Aucune donnée disponible pour la période sélectionnée',
                'data' => [
                    'labels' => [],
                    'datasets' => [
                        [
                            'label' => 'Présents',
                            'data' => [],
                            'backgroundColor' => 'rgba(34, 197, 94, 0.8)',
                            'borderColor' => 'rgba(34, 197, 94, 1)',
                            'borderWidth' => 2
                        ],
                        [
                            'label' => 'En retard',
                            'data' => [],
                            'backgroundColor' => 'rgba(251, 146, 60, 0.8)',
                            'borderColor' => 'rgba(251, 146, 60, 1)',
                            'borderWidth' => 2
                        ],
                        [
                            'label' => 'Absents',
                            'data' => [],
                            'backgroundColor' => 'rgba(239, 68, 68, 0.8)',
                            'borderColor' => 'rgba(239, 68, 68, 1)',
                            'borderWidth' => 2
                        ]
                    ]
                ]
            ]);
        }

        \Log::info('Données formatées pour graphique', [
            'labels_count' => count($labels),
            'sample_data' => [
                'labels' => array_slice($labels, 0, 3),
                'presents' => array_slice($dataPresents, 0, 3),
                'retards' => array_slice($dataRetards, 0, 3),
                'absents' => array_slice($dataAbsents, 0, 3)
            ]
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Données du graphique récupérées avec succès',
            'data' => [
                'labels' => $labels,
                'datasets' => [
                    [
                        'label' => 'Présents',
                        'data' => $dataPresents,
                        'backgroundColor' => 'rgba(34, 197, 94, 0.8)',
                        'borderColor' => 'rgba(34, 197, 94, 1)',
                        'borderWidth' => 2
                    ],
                    [
                        'label' => 'En retard',
                        'data' => $dataRetards,
                        'backgroundColor' => 'rgba(251, 146, 60, 0.8)',
                        'borderColor' => 'rgba(251, 146, 60, 1)',
                        'borderWidth' => 2
                    ],
                    [
                        'label' => 'Absents',
                        'data' => $dataAbsents,
                        'backgroundColor' => 'rgba(239, 68, 68, 0.8)',
                        'borderColor' => 'rgba(239, 68, 68, 1)',
                        'borderWidth' => 2
                    ]
                ]
            ],
            'summary' => [
                'total_jours' => count($labels),
                'total_presents' => array_sum($dataPresents),
                'total_retards' => array_sum($dataRetards),
                'total_absents' => array_sum($dataAbsents)
            ]
        ]);

    } catch (\Exception $e) {
        \Log::error('Erreur graphique présences jour MongoDB', [
            'message' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
            'request' => $request->all()
        ]);

        return response()->json([
            'status' => false,
            'message' => 'Erreur lors de la récupération des données du graphique',
            'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne du serveur'
        ], 500);
    }
}

/**
 * Version simple pour tester MongoDB
 * @param Request $request
 * @return JsonResponse
 */
public function graphiquePresencesJourSimple(Request $request)
{
    try {
        $validator = Validator::make($request->all(), [
            'debut' => 'required|date',
            'fin' => 'required|date|after_or_equal:debut'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 400);
        }

        $debut = Carbon::parse($request->debut)->startOfDay();
        $fin = Carbon::parse($request->fin)->endOfDay();

        \Log::info('Test simple MongoDB', [
            'debut' => $debut->toISOString(),
            'fin' => $fin->toISOString()
        ]);

        // Test simple : récupérer tous les pointages
        $pointages = Pointage::whereBetween('date', [$debut, $fin])
            ->orderBy('date', 'asc')
            ->get();

        \Log::info('Pointages trouvés', [
            'count' => $pointages->count(),
            'sample' => $pointages->first()
        ]);

        // Grouper par jour
        $groupedData = [];
        
        foreach ($pointages as $pointage) {
            $jour = Carbon::parse($pointage->date)->format('Y-m-d');
            
            if (!isset($groupedData[$jour])) {
                $groupedData[$jour] = [
                    'presents' => 0,
                    'retards' => 0,
                    'absents' => 0
                ];
            }
            
            if ($pointage->estPresent && !$pointage->estRetard) {
                $groupedData[$jour]['presents']++;
            } elseif ($pointage->estRetard) {
                $groupedData[$jour]['retards']++;
            } else {
                $groupedData[$jour]['absents']++;
            }
        }

        // Créer les données pour le graphique
        $labels = [];
        $dataPresents = [];
        $dataRetards = [];
        $dataAbsents = [];

        foreach ($groupedData as $jour => $donnee) {
            $labels[] = Carbon::parse($jour)->format('d/m/Y');
            $dataPresents[] = $donnee['presents'];
            $dataRetards[] = $donnee['retards'];
            $dataAbsents[] = $donnee['absents'];
        }

        return response()->json([
            'status' => true,
            'message' => 'Test simple réussi',
            'data' => [
                'labels' => $labels,
                'datasets' => [
                    [
                        'label' => 'Présents',
                        'data' => $dataPresents,
                        'backgroundColor' => 'rgba(34, 197, 94, 0.8)',
                        'borderColor' => 'rgba(34, 197, 94, 1)',
                        'borderWidth' => 2
                    ],
                    [
                        'label' => 'En retard',
                        'data' => $dataRetards,
                        'backgroundColor' => 'rgba(251, 146, 60, 0.8)',
                        'borderColor' => 'rgba(251, 146, 60, 1)',
                        'borderWidth' => 2
                    ],
                    [
                        'label' => 'Absents',
                        'data' => $dataAbsents,
                        'backgroundColor' => 'rgba(239, 68, 68, 0.8)',
                        'borderColor' => 'rgba(239, 68, 68, 1)',
                        'borderWidth' => 2
                    ]
                ]
            ],
            'debug' => [
                'total_pointages' => $pointages->count(),
                'grouped_days' => count($groupedData),
                'sample_pointage' => $pointages->first()
            ]
        ]);

    } catch (\Exception $e) {
        \Log::error('Erreur test simple MongoDB', [
            'message' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);

        return response()->json([
            'status' => false,
            'message' => 'Erreur serveur',
            'error' => $e->getMessage()
        ], 500);
    }
}

/**
 * Graphique présence globale pour MongoDB
 * @param Request $request
 * @return JsonResponse
 */
public function graphiquePresenceGlobale(Request $request)
{
    try {
        $validator = Validator::make($request->all(), [
            'debut' => 'required|date',
            'fin' => 'required|date|after_or_equal:debut',
            'cohorte_id' => 'sometimes|string',
            'departement_id' => 'sometimes|string',
            'type' => 'sometimes|in:apprenant,employe'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 400);
        }

        $debut = Carbon::parse($request->debut)->startOfDay();
        $fin = Carbon::parse($request->fin)->endOfDay();

        $query = Pointage::whereBetween('date', [$debut, $fin]);

        // Application des filtres
        if ($request->cohorte_id || $request->departement_id || $request->type) {
            $query->whereHas('utilisateur', function($q) use ($request) {
                if ($request->cohorte_id) {
                    $q->where('cohorte_id', $request->cohorte_id);
                }
                if ($request->departement_id) {
                    $q->where('departement_id', $request->departement_id);
                }
                if ($request->type) {
                    $q->where('type', $request->type);
                }
            });
        }

        $pointages = $query->get();

        // Calcul des statistiques
        $total = $pointages->count();
        $presents_ponctuel = $pointages->where('estPresent', true)->where('estRetard', false)->count();
        $retards = $pointages->where('estRetard', true)->count();
        $absents = $pointages->where('estPresent', false)->count();

        return response()->json([
            'status' => true,
            'message' => 'Statistiques globales récupérées avec succès',
            'data' => [
                'labels' => ['Présents à l\'heure', 'En retard', 'Absents'],
                'datasets' => [
                    [
                        'data' => [$presents_ponctuel, $retards, $absents],
                        'backgroundColor' => [
                            'rgba(34, 197, 94, 0.8)',   // Vert pour présents
                            'rgba(251, 146, 60, 0.8)',  // Orange pour retards
                            'rgba(239, 68, 68, 0.8)'    // Rouge pour absents
                        ],
                        'borderColor' => [
                            'rgba(34, 197, 94, 1)',
                            'rgba(251, 146, 60, 1)',
                            'rgba(239, 68, 68, 1)'
                        ],
                        'borderWidth' => 2
                    ]
                ]
            ],
            'stats' => [
                'total' => $total,
                'presents_ponctuel' => $presents_ponctuel,
                'retards' => $retards,
                'absents' => $absents,
                'pourcentage_presence' => $total > 0 ? 
                    round((($presents_ponctuel + $retards) / $total) * 100, 2) : 0,
                'pourcentage_ponctualite' => $total > 0 ? 
                    round(($presents_ponctuel / $total) * 100, 2) : 0
            ]
        ]);

    } catch (\Exception $e) {
        \Log::error('Erreur graphique présence globale MongoDB', [
            'message' => $e->getMessage()
        ]);

        return response()->json([
            'status' => false,
            'message' => 'Erreur lors de la récupération des statistiques globales',
            'error' => $e->getMessage()
        ], 500);
    }
}
}
