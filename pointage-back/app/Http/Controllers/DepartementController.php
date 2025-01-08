<?php

namespace App\Http\Controllers;

use App\Models\Departement;
use Illuminate\Http\Request;
use App\Http\Requests\Departement\CreateDepartementRequest;
use App\Http\Requests\Departement\UpdateDepartementRequest;
use App\Models\Journal;
use Illuminate\Support\Facades\Auth;

/**
 * Gère les opérations CRUD et autres fonctionnalités liées aux départements
 */
class DepartementController extends Controller
{
    /**
     * Récupère la liste de tous les départements
     * 
     * @return \Illuminate\Http\JsonResponse Liste des départements
     */
    public function index()
    {
        try {
            $departements = Departement::with('utilisateurs')->get();

            Journal::create([
                'user_id' => Auth::id(),
                'action' => 'consultation_liste_departements',
                'details' => [
                    'nombre_resultats' => $departements->count(),
                    'timestamp' => now()
                ]
            ]);

            return response()->json([
                'status' => true,
                'data' => $departements
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * Crée un nouveau département
     * 
     * @param CreateDepartementRequest $request Requête validée de création
     * @return \Illuminate\Http\JsonResponse Département créé
     */
    public function store(CreateDepartementRequest $request)
    {
        try {
            $departement = Departement::create($request->validated());

            Journal::create([
                'user_id' => Auth::id(),
                'action' => 'creation_departement',
                'details' => [
                    'departement_id' => $departement->id,
                    'nom' => $departement->nom,
                    'timestamp' => now()
                ]
            ]);

            return response()->json([
                'status' => true,
                'message' => 'Département créé avec succès',
                'data' => $departement
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * Récupère les détails d'un département spécifique
     * 
     * @param string $id Identifiant du département
     * @return \Illuminate\Http\JsonResponse Détails du département
     */
    public function show($id)
    {
        try {
            $departement = Departement::with('utilisateurs')->find($id);

            if (!$departement) {
                throw new \Exception('Département non trouvé', 404);
            }

            Journal::create([
                'user_id' => Auth::id(),
                'action' => 'consultation_departement',
                'details' => [
                    'departement_id' => $departement->id,
                    'timestamp' => now()
                ]
            ]);

            return response()->json([
                'status' => true,
                'data' => $departement
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * Met à jour un département existant
     * 
     * @param UpdateDepartementRequest $request Requête validée de mise à jour
     * @param string $id Identifiant du département
     * @return \Illuminate\Http\JsonResponse Département mis à jour
     */
    public function update(UpdateDepartementRequest $request, $id)
    {
        try {
            $departement = Departement::find($id);

            if (!$departement) {
                throw new \Exception('Département non trouvé', 404);
            }

            $oldData = $departement->toArray();
            $departement->update($request->validated());

            Journal::create([
                'user_id' => Auth::id(),
                'action' => 'modification_departement',
                'details' => [
                    'departement_id' => $departement->id,
                    'anciennes_donnees' => $oldData,
                    'nouvelles_donnees' => $departement->fresh()->toArray(),
                    'timestamp' => now()
                ]
            ]);

            return response()->json([
                'status' => true,
                'message' => 'Département mis à jour avec succès',
                'data' => $departement->fresh()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * Supprime un département
     * 
     * @param string $id Identifiant du département
     * @return \Illuminate\Http\JsonResponse Message de confirmation
     */
    public function destroy($id)
    {
        try {
            $departement = Departement::find($id);

            if (!$departement) {
                throw new \Exception('Département non trouvé', 404);
            }

            if ($departement->utilisateurs()->count() > 0) {
                throw new \Exception('Impossible de supprimer un département qui contient des utilisateurs', 400);
            }

            $departementData = $departement->toArray();
            $departement->delete();

            Journal::create([
                'user_id' => Auth::id(),
                'action' => 'suppression_departement',
                'details' => [
                    'departement_id' => $id,
                    'donnees_supprimees' => $departementData,
                    'timestamp' => now()
                ]
            ]);

            return response()->json([
                'status' => true,
                'message' => 'Département supprimé avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }


    /**
     * Recupere les employés d'un département
     * 
     * @param string $id Identifiant du département
     * @return \Illuminate\Http\JsonResponse Message de confirmation
     */
    public function getEmployesByDepartement($departementId)
    {
        try {
            // Trouver le departement par son ID
            $departement = Departement::with('employes')->find($departementId);

            // Vérifier si le departement existe
            if (!$departement) {
                return response()->json(['message' => 'Departement non trouvée'], 404);
            }

            // Retourner les employes associés
            return response()->json($departement->employes, 200);
        } catch (\Exception $e) {
            // Gérer les erreurs
            return response()->json(['message' => 'Erreur interne du serveur', 'error' => $e->getMessage()], 500);
        }
    }
}