<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;
use Tymon\JWTAuth\Exceptions\TokenExpiredException;
use Tymon\JWTAuth\Exceptions\TokenInvalidException;

class VerifieVigile
{
    public function handle(Request $request, Closure $next)
    {
        try {
            // Vérifie et récupère l'utilisateur à partir du token JWT
            $user = JWTAuth::parseToken()->authenticate();
            
            // Vérifie si l'utilisateur est un vigile
            if ($user && $user->fonction === 'Vigile') {
                return $next($request);
            }

            return response()->json([
                'status' => false,
                'message' => 'Accès refusé, vous devez être un vigile pour accéder à cette ressource.'
            ], 403);

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
                'message' => 'Token absent'
            ], 401);
        }
    }
}