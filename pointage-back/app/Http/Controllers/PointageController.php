<?php

namespace App\Http\Controllers;

use App\Models\Pointage;
use App\Models\Utilisateur;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PointageController extends Controller
{
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
            return response()->json([
                'status' => false,
                'message' => 'Accès refusé: Carte non reconnue ou inactive'
            ], 403);
        }

        // Vérification si l'utilisateur est en congé
        if ($utilisateur->estEnConge()) {
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
            // Mise à jour du pointage existant
            $updateData = [
                'estPresent' => true
            ];

            // Si premier pointage pas encore enregistré
            if (!$pointage->premierPointage) {
                $updateData['premierPointage'] = $now;
                $updateData['estRetard'] = $now->greaterThan($heureDebutJournee);
            } else {
                // Sinon c'est un pointage de sortie
                $updateData['dernierPointage'] = $now;
            }

            $pointage->update($updateData);
        } else {
            // Création nouveau pointage
            $pointage = Pointage::create([
                'user_id' => $utilisateur->_id,
                'date' => $today,
                'premierPointage' => $now,
                'estRetard' => $now->greaterThan($heureDebutJournee),
                'estPresent' => true
            ]);
        }

        return response()->json([
            'status' => true,
            'message' => $pointage->dernierPointage ? 'Dernier pointage mis à jour' : 'Premier pointage enregistré',
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

        return response()->json([
            'status' => true,
            'message' => 'Pointages par défaut générés pour ' . count($absences) . ' utilisateurs'
        ]);
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

        if (!$pointage) {
            return response()->json([
                'status' => false,
                'message' => 'Pointage non trouvé'
            ], 404);
        }

        $validated = $request->validate([
            'vigile_id' => 'required|exists:utilisateurs,_id',
            'action' => 'required|in:valider,rejeter',
        ]);

        $updateData = [
            'vigile_id' => $validated['action'] === 'valider' ? $validated['vigile_id'] : null,
            'estPresent' => $validated['action'] === 'valider'
        ];

        $pointage->update($updateData);

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

        $pointage->update($validated);

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

    return response()->json([
        'status' => true,
        'data' => $pointages
    ]);
}
}