<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Utilisateur;
use App\Models\Pointage; 
use Carbon\Carbon;

class CreerPointagesParDefaut extends Command
{
    protected $signature = 'pointages:default';
    protected $description = 'Créer les pointages par défaut pour tous les utilisateurs actifs';

    public function handle()
    {
        $today = Carbon::today();
        
        // Récupérer les utilisateurs actifs qui ne sont pas en congé
        $utilisateurs = Utilisateur::where('statut', 'actif')
                                 ->whereNotIn('_id', function($query) {
                                     $query->select('user_id')
                                           ->from('conges')
                                           ->whereDate('date_debut', '<=', now())
                                           ->whereDate('date_fin', '>=', now());
                                 })
                                 ->get();

        // Préparation des pointages par défaut
        $pointagesParDefaut = $utilisateurs->map(function($utilisateur) use ($today) {
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

        // Insertion en masse dans MongoDB
        Pointage::raw()->insertMany($pointagesParDefaut);

        $this->info('Pointages par défaut créés pour ' . count($pointagesParDefaut) . ' utilisateurs');
    }

}
