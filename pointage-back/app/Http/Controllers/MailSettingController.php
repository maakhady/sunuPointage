<?php

namespace App\Http\Controllers;

use App\Models\Utilisateur;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class MailSettingController extends Controller
{
    public function sendPasswordResetLink(Request $request)
    {
        try {
            $request->validate([
                'email' => 'required|email'
            ]);

            $user = Utilisateur::where('email', $request->email)->first();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Utilisateur non trouvé'
                ], 404);
            }

            $token = Str::random(60);
            
            $user->update([
                'reset_token' => $token,
                'reset_token_expiry' => now()->addMinutes(5)
            ]);

            // URL du frontend pour la réinitialisation
            $resetLink = env('FRONTEND_URL') . "/reset-password?token=" . $token;

            Mail::send('emails.reset-password', [
                'resetLink' => $resetLink,
                'user' => $user
            ], function($message) use ($user) {
                $message->to($user->email)
                        ->subject('Réinitialisation de votre mot de passe');
            });

            return response()->json([
                'success' => true,
                'message' => 'Email de réinitialisation envoyé avec succès'
            ]);

        } catch (\Exception $e) {
            error_log('Erreur envoi email: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'envoi de l\'email',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function resetPassword(Request $request)
    {
        try {
            $request->validate([
                'token' => 'required',
                'password' => 'required|min:8|confirmed'
            ]);

            $user = Utilisateur::where('reset_token', $request->token)
                ->where('reset_token_expiry', '>', now())
                ->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Token invalide ou expiré'
                ], 400);
            }

            $user->update([
                'password' => bcrypt($request->password),
                'reset_token' => null,
                'reset_token_expiry' => null
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Mot de passe réinitialisé avec succès'
            ]);

        } catch (\Exception $e) {
            error_log('Erreur réinitialisation: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la réinitialisation',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}