<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class VerifieVigile
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        // Vérifiez si l'utilisateur est authentifié et a le rôle 'vigile'
        if (Auth::check() && Auth::user()->fonction === 'Vigile') {
            return $next($request); // L'utilisateur est un vigile, continuer la requête
        }

        // Si ce n'est pas un vigile, rediriger ou renvoyer un message d'erreur
        return response()->json([
            'status' => false,
            'message' => 'Accès refusé, vous devez être un vigile pour accéder à cette ressource.'
        ], 403);
    }
}
