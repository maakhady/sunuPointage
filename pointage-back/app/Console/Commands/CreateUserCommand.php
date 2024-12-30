<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Utilisateur;
use Illuminate\Support\Facades\Hash;

class CreateUserCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'create:user 
                            {nom : Le nom de l\'utilisateur} 
                            {prenom : Le prénom de l\'utilisateur} 
                            {email : L\'adresse email de l\'utilisateur} 
                            {password : Le mot de passe de l\'utilisateur} 
                            {role : Le rôle de l\'utilisateur (administrateur ou employe)} 
                            {--telephone= : Le numéro de téléphone de l\'utilisateur} 
                            {--matricule= : Le matricule de l\'utilisateur} 
                            {--fonction= : La fonction de l\'utilisateur} 
                            {--cardId= : L\'identifiant de la carte de l\'utilisateur}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Créer un nouvel utilisateur';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        try {
            $data = [
                'nom' => $this->argument('nom'),
                'prenom' => $this->argument('prenom'),
                'email' => $this->argument('email'),
                'password' => Hash::make($this->argument('password')),
                'role' => $this->argument('role'),
                'telephone' => $this->option('telephone'),
                'matricule' => $this->option('matricule'),
                'fonction' => $this->option('fonction'),
                'cardId' => $this->option('cardId'),
                'type' => 'employe', // Par défaut
                'statut' => 'actif', // Par défaut
            ];

            $utilisateur = Utilisateur::create($data);

            $this->info("Utilisateur créé avec succès !");
            $this->info("Nom complet : {$utilisateur->nom} {$utilisateur->prenom}");
            $this->info("Email : {$utilisateur->email}");
            $this->info("Rôle : {$utilisateur->role}");

            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error("Erreur lors de la création de l'utilisateur : " . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
