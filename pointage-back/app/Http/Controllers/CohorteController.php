<?php
namespace App\Http\Controllers;

use App\Models\Cohorte;
use App\Http\Requests\Cohorte\CreateCohorteRequest;
use App\Http\Requests\Cohorte\UpdateCohorteRequest;
use App\Models\Journal;
use Illuminate\Support\Facades\Auth;

/**
* Gère les opérations CRUD et autres fonctionnalités liées aux cohortes
*/
class CohorteController extends Controller
{
   /**
    * Récupère la liste de toutes les cohortes
    *
    * @return \Illuminate\Http\JsonResponse Liste des cohortes
    */
    public function index()
    {
        try {
            $cohortes = Cohorte::with('apprenants')->get();

            Journal::create([
                'user_id' => Auth::id(),
                'action' => 'consultation_liste_cohortes',
                'details' => [
                    'nombre_resultats' => $cohortes->count(),
                    'timestamp' => now()
                ]
            ]);

            return response()->json([
                'status' => true,
                'data' => $cohortes
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }

   /**
    * Crée une nouvelle cohorte
    *
    * @param CreateCohorteRequest $request Requête validée de création
    * @return \Illuminate\Http\JsonResponse Cohorte créée
    */
    public function store(CreateCohorteRequest $request)
    {
        try {

            if (Cohorte::where('nom', $request->nom)->exists()) {
                return response()->json([
                    'status' => false,
                    'message' => 'Cette cohorte existe déjà'
                ], 422);
            }
            $cohorte = Cohorte::create($request->validated());

            Journal::create([
                'user_id' => Auth::id(),
                'action' => 'creation_cohorte',
                'details' => [
                    'cohorte_id' => $cohorte->id,
                    'nom' => $cohorte->nom,
                    'timestamp' => now()
                ]
            ]);

            return response()->json([
                'status' => true,
                'message' => 'Cohorte créée avec succès',
                'data' => $cohorte
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }

   /**
    * Récupère les détails d'une cohorte spécifique
    *
    * @param string $id Identifiant de la cohorte
    * @return \Illuminate\Http\JsonResponse Détails de la cohorte
    */
    public function show($id)
    {
        try {
            $cohorte = Cohorte::with('apprenants')->find($id);
            if (!$cohorte) {
                throw new \Exception('Cohorte non trouvée', 404);
            }

            Journal::create([
                'user_id' => Auth::id(),
                'action' => 'consultation_cohorte',
                'details' => [
                    'cohorte_id' => $cohorte->id,
                    'timestamp' => now()
                ]
            ]);

            return response()->json([
                'status' => true,
                'data' => $cohorte
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }

   /**
    * Met à jour une cohorte existante
    *
    * @param UpdateCohorteRequest $request Requête validée de mise à jour
    * @param string $id Identifiant de la cohorte
    * @return \Illuminate\Http\JsonResponse Cohorte mise à jour
    */
    public function update(UpdateCohorteRequest $request, $id)
    {
        try {
            $cohorte = Cohorte::find($id);
            if (!$cohorte) {
                throw new \Exception('Cohorte non trouvée', 404);
            }

            $oldData = $cohorte->toArray();
            $cohorte->update($request->validated());

            Journal::create([
                'user_id' => Auth::id(),
                'action' => 'modification_cohorte',
                'details' => [
                    'cohorte_id' => $cohorte->id,
                    'anciennes_donnees' => $oldData,
                    'nouvelles_donnees' => $cohorte->fresh()->toArray(),
                    'timestamp' => now()
                ]
            ]);

            return response()->json([
                'status' => true,
                'message' => 'Cohorte mise à jour avec succès',
                'data' => $cohorte->fresh()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }

   /**
    * Supprime une cohorte
    *
    * @param string $id Identifiant de la cohorte
    * @return \Illuminate\Http\JsonResponse Message de confirmation
    */
    public function destroy($id)
    {
        try {
            $cohorte = Cohorte::find($id);
            if (!$cohorte) {
                throw new \Exception('Cohorte non trouvée', 404);
            }
            if ($cohorte->apprenants()->count() > 0) {
                throw new \Exception('Impossible de supprimer une cohorte qui contient des apprenants', 400);
            }

            $cohorteData = $cohorte->toArray();
            $cohorte->delete();

            Journal::create([
                'user_id' => Auth::id(),
                'action' => 'suppression_cohorte',
                'details' => [
                    'cohorte_id' => $id,
                    'donnees_supprimees' => $cohorteData,
                    'timestamp' => now()
                ]
            ]);

            return response()->json([
                'status' => true,
                'message' => 'Cohorte supprimée avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }


    /**
    * Recupere les apprenants d'une cohorte
    *
    * @param string $id Identifiant de la cohorte
    * @return \Illuminate\Http\JsonResponse Message de confirmation
    */
    public function getApprenantsByCohorte($cohorteId)
    {
        try {
            // Trouver la cohorte par son ID
            $cohorte = Cohorte::with('apprenants')->find($cohorteId);

            // Vérifier si la cohorte existe
            if (!$cohorte) {
                return response()->json(['message' => 'Cohorte non trouvée'], 404);
            }

            // Retourner les apprenants associés
            return response()->json($cohorte->apprenants, 200);
        } catch (\Exception $e) {
            // Gérer les erreurs
            return response()->json(['message' => 'Erreur interne du serveur', 'error' => $e->getMessage()], 500);
        }
    }
}
