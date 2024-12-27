<?php

namespace App\Http\Middleware;

use Closure;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\TokenExpiredException;
use Tymon\JWTAuth\Exceptions\TokenInvalidException;
use Tymon\JWTAuth\Exceptions\JWTException;

class CheckVigileuAdmin
{
   public function handle($request, Closure $next)
   {
       try {
           $token = $request->bearerToken();
           if(!$token) {
               return response()->json([
                   'status' => false,
                   'message' => 'Token requis'
               ], 401);
           }

           $user = JWTAuth::parseToken()->authenticate();
           if(!$user) {
               return response()->json([
                   'status' => false, 
                   'message' => 'Utilisateur non trouvé'
               ], 401);
           }

           // Vérification admin ou vigile
           if(!$user->isAdmin() && $user->fonction !== 'vigile') {
               return response()->json([
                   'status' => false,
                   'message' => 'Accès réservé aux administrateurs et vigiles'
               ], 403);
           }

           return $next($request);

       } catch (TokenExpiredException $e) {
           return response()->json([
               'status' => false,
               'message' => 'Token expiré'
           ], 401);
       } catch (TokenInvalidException $e) {
           return response()->json([
               'status' => false,
               'message' => 'Token invalide'
           ], 401);
       } catch (JWTException $e) {
           return response()->json([
               'status' => false,
               'message' => 'Erreur de token'
           ], 401);
       }
   }
}