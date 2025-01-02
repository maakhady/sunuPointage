<?php

namespace App\Http\Controllers;

use App\Models\Utilisateur;
use App\Models\Journal;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller 
{
    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            $request->headers->set('Accept', 'application/json');
            return $next($request);
        });
        $this->middleware('auth:api', ['except' => ['login','cardLogin']]);
    }

    public function login(LoginRequest $request)
    {
        $user = Utilisateur::where('email', $request->email)->first();
        
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'status' => false,
                'message' => 'Email ou mot de passe incorrect'
            ], 401);
        }

        // Générer le token JWT
        $token = JWTAuth::fromUser($user);

        // Log de connexion
        Journal::create([
            'user_id' => $user->_id,
            'action' => 'connexion',
            'details' => [
                'timestamp' => now(),
                'ip' => $request->ip()
            ]
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Connexion réussie',
            'data' => $user,
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => config('jwt.ttl') * 60 // TTL en secondes
        ], 200);
    }
// methode avec verification admin
    public function register(RegisterRequest $request)
    {
    try {
        // Vérifier si l'utilisateur est admin
        $currentUser = JWTAuth::parseToken()->authenticate();
        if(!$currentUser->isAdmin()) {
            return response()->json([
                'status' => false,
                'message' => 'Action non autorisée'
            ], 403);
        }

        // Vérifier l'email
        if (Utilisateur::where('email', $request->email)->exists()) {
            return response()->json([
                'status' => false,
                'message' => 'Cet email est déjà utilisé'
            ], 422);
        }

        $userData = [
            'nom' => $request->nom,
            'prenom' => $request->prenom,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'telephone' => $request->telephone,
            'type' => $request->type,
            'matricule' => $request->matricule,
            'adresse' => $request->adresse,
            'fonction' => $request->fonction,
            'department_id' => $request->department_id,
            'cohorte_id' => $request->cohorte_id,
            'cardId' => $request->cardId,
            'photo' => $request->photo,
            'statut' => 'actif',
            'role' => $request->role,
            'dateCreation' => now(),
            'dateMiseAJour' => now()
        ];

        $newUser = Utilisateur::create($userData);

        Journal::create([
            'user_id' => $newUser->_id,
            'action' => 'creation_compte',
            'details' => [
                'timestamp' => now(),
                'ip' => $request->ip(),
                'created_by' => $currentUser->_id // Ajout de l'id de l'admin créateur
            ]
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Utilisateur créé avec succès',
            'data' => $newUser
        ], 201);

    } catch (\Exception $e) {
        return response()->json([
            'status' => false,
            'message' => 'Erreur lors de la création: ' . $e->getMessage()
        ], 500);
    }
    }

    //Creation avec les conditions de departement et cohorte
    public function creerUser(RegisterRequest $request) {
        try {
            $userData = [
                'nom' => $request->nom,
                'prenom' => $request->prenom,
                'email' => $request->email,
                'telephone' => $request->telephone,
                'matricule' => $request->matricule,
                'adresse' => $request->adresse,
                'type' => $request->departement_id ? 'employe' : 'apprenant',
                'fonction' => $request->departement_id ? $request->fonction : null,
                'departement_id' => $request->departement_id,
                'cohorte_id' => $request->cohorte_id,
                'cardId' => $request->cardId,
                'photo' => $request->photo,
                'statut' => 'actif',
                'role' => $request->role ?? 'utilisateur_simple',
            ];
    
            // Ajouter password uniquement pour vigile et DG
            if (in_array($request->fonction, ['vigile', 'DG'])) {
                if (!$request->password) {
                    return response()->json([
                        'status' => false,
                        'message' => 'Mot de passe requis pour cette fonction'
                    ], 400);
                }
                $userData['password'] = Hash::make($request->password);
            }
    
            $newUser = Utilisateur::create($userData);
            
            Journal::create([
                'user_id' => $newUser->_id,
                'action' => 'creation_compte',
                'details' => [
                    'timestamp' => now(),
                    'ip' => $request->ip(),
                    'created_by' => 'self_registration'
                ]
            ]);
    
            return response()->json([
                'status' => true,
                'message' => 'Utilisateur créé avec succès',
                'data' => $newUser
            ], 201);
    
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Erreur lors de la création: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupère le profil de l'utilisateur connecté
     * @return \Illuminate\Http\JsonResponse Profil de l'utilisateur
     */
    public function me()
    {
       try {
           $user = JWTAuth::parseToken()->authenticate();
           
           if (!$user) {
               return response()->json([
                   'status' => false,
                   'message' => 'Utilisateur non trouvé'
               ], 404);
           }
    
           return response()->json([
               'status' => true,
               'data' => $user
           ], 200);
           
       } catch (\Exception $e) {
           return response()->json([
               'status' => false, 
               'message' => 'Erreur lors de la récupération du profil'
           ], 500);
       }
    }

    public function logout()
    {
        try {
            $user = auth('api')->user();

            // Log de déconnexion
            Journal::create([
                'user_id' => $user->_id,
                'action' => 'deconnexion',
                'details' => [
                    'timestamp' => now(),
                    'ip' => request()->ip()
                ]
            ]);

            auth('api')->logout();

            return response()->json([
                'status' => true,
                'message' => 'Déconnexion réussie'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Erreur lors de la déconnexion'
            ], 500);
        }
    }

    // Méthode pour rafraîchir le token
    public function refresh()
{
    try {
        return response()->json([
            'status' => true,
            'data' => [
                'access_token' => JWTAuth::refresh(),
                'token_type' => 'bearer',
                'expires_in' => config('jwt.ttl') * 60 // TTL en secondes
            ]
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => false,
            'message' => 'Erreur lors du rafraîchissement du token'
        ], 500);
    }
}

// AuthController.php avec carteRfid
    public function cardLogin(Request $request)
    {
    $user = Utilisateur::where('cardId', $request->cardId)
                    ->where('fonction', 'DG')
                    ->where('statut', 'actif')
                    ->where('role', 'administrateur')
                    ->first();

    if (!$user) {
        return response()->json([
            'status' => false,
            'message' => 'Carte non autorisée'
        ], 401);
    }

    // Générer token JWT
    $token = JWTAuth::fromUser($user);

    // Log de connexion
    Journal::create([
        'user_id' => $user->_id,
        'action' => 'connexion_carte',
        'details' => [
            'timestamp' => now(),
            'ip' => $request->ip()
        ]
    ]);

    return response()->json([
        'status' => true, 
        'message' => 'Connexion réussie',
        'data' => $user,
        'access_token' => $token,
        'token_type' => 'bearer',
        'expires_in' => config('jwt.ttl') * 60
    ], 200);
    }

}