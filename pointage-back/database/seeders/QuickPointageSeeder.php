<?php

// database/seeders/QuickPointageSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Pointage;
use App\Models\Utilisateur;
use Carbon\Carbon;

class QuickPointageSeeder extends Seeder
{
    /**
     * Seeder rapide pour tester immédiatement les graphiques
     */
    public function run(): void
    {
        echo "⚡ Seeder rapide - Création de données de test...\n";

        // Créer des utilisateurs de test simples
        $utilisateurs = $this->creerUtilisateursRapide();
        
        // Générer des pointages pour cette semaine
        $this->genererPointagesRapide($utilisateurs);

        echo "✅ Données de test créées avec succès !\n";
        echo "📊 Testez maintenant votre graphique avec les dates :\n";
        echo "   - Début: " . Carbon::today()->subDays(6)->format('Y-m-d') . "\n";
        echo "   - Fin: " . Carbon::today()->format('Y-m-d') . "\n";
    }

    private function creerUtilisateursRapide()
    {
        $utilisateurs = collect();

        // Générer des numéros de téléphone uniques
        $timestamp = time();
        
        try {
            // Utilisateur 1 - Employé ponctuel
            $user1 = Utilisateur::firstOrCreate(
                ['email' => 'test.employe@quick.com'],
                [
                    'nom' => 'Test',
                    'prenom' => 'Employé',
                    'email' => 'test.employe@quick.com',
                    'password' => bcrypt('password'),
                    'matricule' => 'TEST001_' . $timestamp,
                    'cardId' => 'TESTCARD001_' . $timestamp,
                    'type' => 'employe',
                    'telephone' => '77' . substr($timestamp, -7), // Numéro unique basé sur timestamp
                    'adresse' => 'Dakar Test',
                    'estActif' => true
                ]
            );
            $utilisateurs->push($user1);
            echo "✅ Employé créé: {$user1->telephone}\n";

        } catch (\Exception $e) {
            echo "⚠️  Employé existe déjà, récupération...\n";
            $user1 = Utilisateur::where('email', 'test.employe@quick.com')->first();
            if ($user1) {
                $utilisateurs->push($user1);
            }
        }

        try {
            // Utilisateur 2 - Apprenant retardataire
            $user2 = Utilisateur::firstOrCreate(
                ['email' => 'test.apprenant@quick.com'],
                [
                    'nom' => 'Test',
                    'prenom' => 'Apprenant',
                    'email' => 'test.apprenant@quick.com',
                    'password' => bcrypt('password'),
                    'matricule' => 'TEST002_' . $timestamp,
                    'cardId' => 'TESTCARD002_' . $timestamp,
                    'type' => 'apprenant',
                    'telephone' => '78' . substr($timestamp, -7), // Numéro différent
                    'adresse' => 'Dakar Test',
                    'estActif' => true
                ]
            );
            $utilisateurs->push($user2);
            echo "✅ Apprenant créé: {$user2->telephone}\n";

        } catch (\Exception $e) {
            echo "⚠️  Apprenant existe déjà, récupération...\n";
            $user2 = Utilisateur::where('email', 'test.apprenant@quick.com')->first();
            if ($user2) {
                $utilisateurs->push($user2);
            }
        }

        // Si aucun utilisateur n'a pu être créé, essayer de récupérer des utilisateurs existants
        if ($utilisateurs->isEmpty()) {
            echo "🔍 Recherche d'utilisateurs existants...\n";
            $existingUsers = Utilisateur::where('estActif', true)->limit(2)->get();
            if ($existingUsers->isNotEmpty()) {
                $utilisateurs = $existingUsers;
                echo "✅ Utilisation de {$utilisateurs->count()} utilisateurs existants\n";
            } else {
                throw new \Exception("Aucun utilisateur disponible pour le test. Créez d'abord des utilisateurs.");
            }
        }

        echo "👥 Total: {$utilisateurs->count()} utilisateurs prêts pour les tests\n";
        return $utilisateurs;
    }

    private function genererPointagesRapide($utilisateurs)
    {
        $pointagesCount = 0;

        // Générer pour les 7 derniers jours
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            
            // Ignorer le weekend
            if ($date->isWeekend()) {
                continue;
            }

            foreach ($utilisateurs as $index => $utilisateur) {
                // Pattern différent selon l'utilisateur
                if ($index === 0) {
                    // Employé - mostly ponctuel
                    $scenario = $this->getScenarioEmploye($i);
                } else {
                    // Apprenant - plus de retards
                    $scenario = $this->getScenarioApprenant($i);
                }

                Pointage::create([
                    'user_id' => $utilisateur->_id,
                    'cardId' => $utilisateur->cardId,
                    'date' => $date,
                    'estPresent' => $scenario['estPresent'],
                    'estRetard' => $scenario['estRetard'],
                    'premierPointage' => $scenario['premierPointage'],
                    'dernierPointage' => $scenario['dernierPointage'],
                    'estEnAttente' => false,
                    'estRejete' => false
                ]);

                $pointagesCount++;
                echo "📝 Pointage créé: {$utilisateur->prenom} - " . $date->format('d/m') . " - " . ($scenario['estRetard'] ? 'RETARD' : ($scenario['estPresent'] ? 'PRÉSENT' : 'ABSENT')) . "\n";
            }
        }

        echo "📊 Total: {$pointagesCount} pointages créés\n";
    }

    private function getScenarioEmploye($dayIndex)
    {
        $date = Carbon::today()->subDays($dayIndex);
        $scenarios = [
            // Lundi - Présent à l'heure
            6 => ['estPresent' => true, 'estRetard' => false],
            // Mardi - Petit retard
            5 => ['estPresent' => true, 'estRetard' => true],
            // Mercredi - Présent à l'heure
            4 => ['estPresent' => true, 'estRetard' => false],
            // Jeudi - Présent à l'heure
            3 => ['estPresent' => true, 'estRetard' => false],
            // Vendredi - Absent
            2 => ['estPresent' => false, 'estRetard' => false],
            // Samedi/Dimanche ignorés
            1 => ['estPresent' => true, 'estRetard' => false],
            0 => ['estPresent' => true, 'estRetard' => true],
        ];

        $scenario = $scenarios[$dayIndex] ?? ['estPresent' => true, 'estRetard' => false];

        if ($scenario['estPresent']) {
            $heureBase = Carbon::parse($date->format('Y-m-d') . ' 08:00:00');
            $scenario['premierPointage'] = $scenario['estRetard'] 
                ? $heureBase->addMinutes(rand(5, 45))  // Retard de 5-45 min
                : $heureBase->subMinutes(rand(0, 15)); // Avance ou pile à l'heure
            
            $scenario['dernierPointage'] = Carbon::parse($date->format('Y-m-d') . ' 17:' . rand(0, 30) . ':00');
        } else {
            $scenario['premierPointage'] = null;
            $scenario['dernierPointage'] = null;
        }

        return $scenario;
    }

    private function getScenarioApprenant($dayIndex)
    {
        $date = Carbon::today()->subDays($dayIndex);
        $scenarios = [
            // Plus de retards pour l'apprenant
            6 => ['estPresent' => true, 'estRetard' => true],   // Lundi retard
            5 => ['estPresent' => true, 'estRetard' => false],  // Mardi OK
            4 => ['estPresent' => true, 'estRetard' => true],   // Mercredi retard
            3 => ['estPresent' => false, 'estRetard' => false], // Jeudi absent
            2 => ['estPresent' => true, 'estRetard' => true],   // Vendredi retard
            1 => ['estPresent' => true, 'estRetard' => false],
            0 => ['estPresent' => false, 'estRetard' => false], // Aujourd'hui absent
        ];

        $scenario = $scenarios[$dayIndex] ?? ['estPresent' => true, 'estRetard' => true];

        if ($scenario['estPresent']) {
            $heureBase = Carbon::parse($date->format('Y-m-d') . ' 08:00:00');
            $scenario['premierPointage'] = $scenario['estRetard'] 
                ? $heureBase->addMinutes(rand(10, 60))  // Retard plus important
                : $heureBase->subMinutes(rand(0, 10));
            
            $scenario['dernierPointage'] = Carbon::parse($date->format('Y-m-d') . ' 17:' . rand(0, 45) . ':00');
        } else {
            $scenario['premierPointage'] = null;
            $scenario['dernierPointage'] = null;
        }

        return $scenario;
    }
}