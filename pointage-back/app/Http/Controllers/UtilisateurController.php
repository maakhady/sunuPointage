<?php

namespace App\Http\Controllers;

use App\Models\Utilisateur;
use App\Models\Journal;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Http\Requests\Utilisateur\CreateUtilisateurRequest;
use App\Http\Requests\Utilisateur\UpdateUtilisateurRequest;
use App\Http\Requests\Utilisateur\ImportRequest;
use Illuminate\Http\Request;

/**
 * Gère les opérations CRUD et autres fonctionnalités liées aux utilisateurs
 */
class UtilisateurController extends Controller
{
    /**
     * Récupère la liste des utilisateurs avec filtrage optionnel par type
     * @param Request $request Requête HTTP contenant les paramètres de filtrage
     * @return \Illuminate\Http\JsonResponse Liste des utilisateurs filtrée
     */
    public function index(Request $request)
    {
        try {
            $query = Utilisateur::query()
                ->with(['departement', 'cohorte']);

            if ($request->query('type')) {
                $query->where('type', $request->query('type'));
            }

            $utilisateurs = $query->get();

            // Log de consultation de la liste
            Journal::create([
                'user_id' => Auth::id(),
                'action' => 'consultation_liste_utilisateurs',
                'details' => [
                    'type_filtre' => $request->query('type'),
                    'nombre_resultats' => $utilisateurs->count(),
                    'timestamp' => now()
                ]
            ]);

            return response()->json([
                'status' => true,
                'data' => $utilisateurs
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * Crée un nouvel utilisateur
     * @param CreateUtilisateurRequest $request Requête validée de création
     * @return \Illuminate\Http\JsonResponse Utilisateur créé
     */
    public function store(CreateUtilisateurRequest $request)
    {
        try {
            $data = $request->validated();

            if (isset($data['photo']) && $data['photo']) {
                $data['photo'] = $this->uploadPhoto($data['photo']);
            }

            $data['password'] = Hash::make($data['password']);
            unset($data['password']);

            $utilisateur = Utilisateur::create($data);

            // Log de création
            Journal::create([
                'user_id' => Auth::id(),
                'action' => 'creation_utilisateur',
                'details' => [
                    'utilisateur_id' => $utilisateur->id,
                    'timestamp' => now()
                ]
            ]);

            return response()->json([
                'status' => true,
                'message' => 'Utilisateur créé avec succès',
                'data' => $utilisateur
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }
    /**
     * Récupère les détails d'un utilisateur spécifique
     * @param string $id Identifiant de l'utilisateur
     * @return \Illuminate\Http\JsonResponse Détails de l'utilisateur
     */
    public function show($id)
    {
        try {
            $utilisateur = Utilisateur::with(['departement', 'cohorte', 'pointages'])
                ->findOrFail($id);

            return response()->json([
                'status' => true,
                'data' => $utilisateur
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * Met à jour un utilisateur existant
     * @param UpdateUtilisateurRequest $request Requête validée de mise à jour
     * @param string $id Identifiant de l'utilisateur
     * @return \Illuminate\Http\JsonResponse Utilisateur mis à jour
     */
    public function update(UpdateUtilisateurRequest $request, $id)
    {
        try {
            $utilisateur = Utilisateur::findOrFail($id);
            $data = $request->validated();

            if (isset($data['photo']) && $data['photo']) {
                if ($utilisateur->photo) {
                    Storage::delete($utilisateur->photo);
                }
                $data['photo'] = $this->uploadPhoto($data['photo']);
            }

            if (isset($data['password'])) {
                $data['password'] = Hash::make($data['password']);
                unset($data['password']);
            }

            $utilisateur->update($data);

            // Log de mise à jour
            Journal::create([
                'user_id' => Auth::id(),
                'action' => 'modification_utilisateur',
                'details' => [
                    'utilisateur_id' => $utilisateur->id,
                    'modifications' => $data,
                    'timestamp' => now()
                ]
            ]);

            return response()->json([
                'status' => true,
                'message' => 'Utilisateur mis à jour avec succès',
                'data' => $utilisateur->fresh()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * Supprime un utilisateur
     * @param string $id Identifiant de l'utilisateur
     * @return \Illuminate\Http\JsonResponse Message de confirmation
     */
    public function destroy($id)
    {
        try {
            $utilisateur = Utilisateur::findOrFail($id);

            if ($utilisateur->photo) {
                Storage::delete($utilisateur->photo);
            }

            $utilisateur->delete();

            // Log de suppression
            Journal::create([
                'user_id' => Auth::id(),
                'action' => 'suppression_utilisateur',
                'details' => [
                    'utilisateur_id' => $utilisateur->id,
                    'timestamp' => now()
                ]
            ]);

            return response()->json([
                'status' => true,
                'message' => 'Utilisateur supprimé avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }


    /**
     * Importe des utilisateurs depuis un fichier CSV
     * @param ImportRequest $request Requête contenant le fichier CSV
     * @return \Illuminate\Http\JsonResponse Résultat de l'importation
     */
    public function import(ImportRequest $request)
    {
        try {

            
            $importedUsers = [];
            $errors = [];
            
            $csvData = array_map('str_getcsv', file($request->file('file')->getPathname()));
            $headers = array_shift($csvData);

            foreach ($csvData as $row) {
                try {
                    $userData = array_combine($headers, $row);
                    $userData['password'] = Hash::make($userData['password'] ?? 'password123');
                    $user = Utilisateur::create($userData);
                    $importedUsers[] = $user;
                    
                    // Log d'import
                    Journal::create([
                        'user_id' => Auth::id(),
                        'action' => 'import_utilisateur',
                        'details' => [
                            'utilisateur_id' => $user->id,
                            'source' => 'import_csv',
                            'timestamp' => now()
                        ]
                    ]);
                } catch (\Exception $e) {
                    $errors[] = "Ligne {$row[0]}: " . $e->getMessage();
                }
            }

            return response()->json([
                'status' => true,
                'message' => 'Importation réussie',
                'data' => [
                    'imported' => $importedUsers,
                    'errors' => $errors
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }
    /**REVOIR AUSSI CETTE METHODE 
     * Active/Désactive un utilisateur
     * @param string $id Identifiant de l'utilisateur
     * @return \Illuminate\Http\JsonResponse Utilisateur avec statut modifié
     */
    public function updateStatus($id)
{
   try {
       $utilisateur = Utilisateur::findOrFail($id);
       $oldStatus = $utilisateur->statut;
       $utilisateur->statut = $oldStatus === 'actif' ? 'inactif' : 'actif';
       $utilisateur->save();

       Journal::create([
           'user_id' => Auth::id(),
           'action' => 'modification_statut_utilisateur',
           'details' => [
               'utilisateur_id' => $utilisateur->id,
               'ancien_statut' => $oldStatus,
               'nouveau_statut' => $utilisateur->statut,
               'timestamp' => now()
           ]
       ]);

       return response()->json([
           'status' => true, 
           'message' => "Statut modifié",
           'data' => $utilisateur
       ]);
   } catch (\Exception $e) {
       return response()->json(['status' => false, 'message' => $e->getMessage()], 500);
   }
}

    /**
     * Assigne une carte RFID à un utilisateur
     * @param Request $request Requête contenant l'ID de la carte
     * @param string $id Identifiant de l'utilisateur
     * @return \Illuminate\Http\JsonResponse Utilisateur avec carte assignée
     */
    public function assignCard(Request $request, $id)
    {
        try {
            $utilisateur = Utilisateur::findOrFail($id);

            if (Utilisateur::where('cardId', $request->cardId)->exists()) {
                throw new \Exception('Cette carte est déjà assignée à un autre utilisateur', 400);
            }

            $utilisateur->cardId = $request->cardId;
            $utilisateur->save();

            // Log d'assignation de carte
            Journal::create([
                'user_id' => Auth::id(),
                'action' => 'assignation_carte',
                'details' => [
                    'utilisateur_id' => $utilisateur->id,
                    'card_id' => $request->cardId,
                    'timestamp' => now()
                ]
            ]);

            return response()->json([
                'status' => true,
                'message' => 'Carte assignée avec succès',
                'data' => $utilisateur
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * Vérifie la validité d'une carte RFID
     * @param Request $request Requête contenant l'ID de la carte
     * @return \Illuminate\Http\JsonResponse Statut de la carte et informations utilisateur
     */
    public function verifyCard(Request $request)
    {
        try {
            $request->validate(['cardId' => 'required|string']);
            
            $utilisateur = Utilisateur::where('cardId', $request->cardId)
                ->where('statut', 'actif')
                ->with(['departement', 'cohorte'])
                ->firstOrFail();

            Journal::create([
                'user_id' => $utilisateur->id,
                'action' => 'verification_carte',
                'details' => [
                    'cardId' => $request->cardId,
                    'timestamp' => now(),
                    'success' => true
                ]
            ]);
            
            return response()->json([
                'status' => true,
                'message' => 'Carte valide',
                'data' => [
                    'utilisateur' => $utilisateur,
                    'access' => true
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage(),
                'data' => ['access' => false]
            ], $e->getCode() ?: 403);
        }
    }

    /**
     * Récupère le profil de l'utilisateur connecté
     * @return \Illuminate\Http\JsonResponse Profil de l'utilisateur
     */
    public function profile()
    {
        try {
            $utilisateur = Utilisateur::with(['departement', 'cohorte', 'pointages'])
                ->findOrFail(Auth::user()->_id);

            return response()->json([
                'status' => true,
                'data' => $utilisateur
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }

    /**à REVOIR AUCI CETTE METHODE 
     * Met à jour le profil de l'utilisateur connecté
     * @param Request $request Données de mise à jour du profil
     * @return \Illuminate\Http\JsonResponse Profil mis à jour
     */
    // public function updateProfile(UpdateUtilisateurRequest $request)
    // {
    //     try {
    //         $utilisateur = Utilisateur::findOrFail(Auth::user()->_id);
    //         $data = $request->validated();

    //         if (isset($data['photo']) && $data['photo']) {
    //             if ($utilisateur->photo) {
    //                 Storage::delete($utilisateur->photo);
    //             }
    //             $data['photo'] = $this->uploadPhoto($data['photo']);
    //         }

    //         if (isset($data['password'])) {
    //             $data['password'] = Hash::make($data['password']);
    //             unset($data['password']);
    //         }

    //         $utilisateur->update($data);

    //         return response()->json([
    //             'status' => true,
    //             'message' => 'Profil mis à jour avec succès',
    //             'data' => $utilisateur->fresh()
    //         ]);
    //     } catch (\Exception $e) {
    //         return response()->json([
    //             'status' => false,
    //             'message' => $e->getMessage()
    //         ], $e->getCode() ?: 500);
    //     }
    // }

    /**
     * Met à jour le statut de plusieurs utilisateurs en même temps
     * @param Request $request Requête contenant les IDs et le nouveau statut
     * @return \Illuminate\Http\JsonResponse Nombre d'utilisateurs mis à jour
     */
    public function bulkStatusUpdate(Request $request)
    {
        try {
            $request->validate([
                'ids' => 'required|array',
                'ids.*' => 'exists:utilisateurs,_id',
                'statut' => 'required|in:actif,inactif'
            ]);

            $count = Utilisateur::whereIn('_id', $request->ids)
                ->update(['statut' => $request->statut]);

            // Log de mise à jour massive des statuts
            Journal::create([
                'user_id' => Auth::id(),
                'action' => 'mise_a_jour_massive_statuts',
                'details' => [
                    'utilisateurs_ids' => $request->ids,
                    'nouveau_statut' => $request->statut,
                    'nombre_utilisateurs' => $count,
                    'timestamp' => now()
                ]
            ]);

            return response()->json([
                'status' => true,
                'message' => "$count Utilisateurs Inactifs",
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }
    /** REVOIR CETTE METHODE 
     * Supprime plusieurs utilisateurs en même temps
     * @param Request $request Requête contenant les IDs des utilisateurs à supprimer
     * @return \Illuminate\Http\JsonResponse Message de confirmation
     */
    public function bulkDestroy(Request $request)
    {
        try {
            $request->validate([
                'ids' => 'required|array',
                'ids.*' => 'exists:utilisateurs,_id'
            ]);

            // Récupérer les infos des utilisateurs avant suppression pour le log
            $utilisateurs = Utilisateur::whereIn('_id', $request->ids)->get();
            
            // Supprimer les photos si elles existent
            foreach($utilisateurs as $utilisateur) {
                if ($utilisateur->photo) {
                    Storage::delete($utilisateur->photo);
                }
            }

            // Supprimer les utilisateurs
            $deletedCount = Utilisateur::whereIn('_id', $request->ids)->delete();

            // Log de suppression massive
            Journal::create([
                'user_id' => Auth::id(),
                'action' => 'suppression_massive_utilisateurs',
                'details' => [
                    'utilisateurs_ids' => $request->ids,
                    'nombre_supprimes' => $deletedCount,
                    'timestamp' => now()
                ]
            ]);

            return response()->json([
                'status' => true,
                'message' => 'Utilisateurs supprimés avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }
    /**
     * Active/Désactive plusieurs utilisateurs en même temps
     * @param Request $request Requête contenant les IDs des utilisateurs
     * @return \Illuminate\Http\JsonResponse Message de confirmation
     */
    public function bulkToggleStatus(Request $request)
    {
        try {
            $request->validate([
                'ids' => 'required|array',
                'ids.*' => 'exists:utilisateurs,_id'
            ]);

            $utilisateurs = Utilisateur::whereIn('_id', $request->ids)->get();
            $statusChanges = [];
            
            foreach($utilisateurs as $utilisateur) {
                $oldStatus = $utilisateur->statut;
                $utilisateur->statut = $utilisateur->statut === 'actif' ? 'inactif' : 'actif';
                $utilisateur->save();
                
                $statusChanges[] = [
                    'utilisateur_id' => $utilisateur->id,
                    'ancien_statut' => $oldStatus,
                    'nouveau_statut' => $utilisateur->statut
                ];
            }

            // Log des changements de statut en masse
            Journal::create([
                'user_id' => Auth::id(),
                'action' => 'toggle_statut_masse',
                'details' => [
                    'modifications' => $statusChanges,
                    'nombre_utilisateurs' => count($utilisateurs),
                    'timestamp' => now()
                ]
            ]);

            return response()->json([
                'status' => true,
                'message' => 'Statuts modifiés avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }

    /**
     * Méthode utilitaire pour upload de photo
     * @param UploadedFile $photo
     * @return string Chemin de la photo enregistrée
     */
    private function uploadPhoto($photo)
    {
        $filename = Str::random(32) . '.' . $photo->getClientOriginalExtension();
        $path = $photo->storeAs('photos', $filename, 'public');
        return $path;
    }
}