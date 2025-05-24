<?php

// database/seeders/PointageSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Pointage;
use App\Models\Utilisateur;
use Carbon\Carbon;

class PointageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        echo "🚀 Début du seeding des pointages...\n";

        // Nettoyer les anciens pointages de test (optionnel)
        // Pointage::where('created_at', '>=', Carbon::today()->subDays(30))->delete();

        // Récupérer quelques utilisateurs pour les tests
        $utilisateurs = $this->creerUtilisateursTest();
        
        if ($utilisateurs->isEmpty()) {
            echo "❌ Aucun utilisateur trouvé. Création d'utilisateurs de test...\n";
            $utilisateurs = $this->creerUtilisateursTest();
        }

        echo "👥 Utilisateurs trouvés : " . $utilisateurs->count() . "\n";

        // Générer des pointages pour les 30 derniers jours
        $this->genererPointages($utilisateurs, 30);

        echo "✅ Seeding des pointages terminé !\n";
    }

    /**
     * Créer ou récupérer des utilisateurs de test
     */
    private function creerUtilisateursTest()
    {
        // D'abord, essayer de récupérer les utilisateurs existants
        $utilisateurs = Utilisateur::where('estActif', true)->limit(10)->get();

        // Si pas assez d'utilisateurs, en créer
        if ($utilisateurs->count() < 5) {
            echo "👤 Création d'utilisateurs de test...\n";
            
            $utilisateursTest = [
                [
                    'nom' => 'Diallo',
                    'prenom' => 'Amadou',
                    'email' => 'amadou.diallo@test.com',
                    'matricule' => 'EMP001',
                    'cardId' => 'CARD001',
                    'type' => 'employe'
                ],
                [
                    'nom' => 'Ndiaye',
                    'prenom' => 'Fatou',
                    'email' => 'fatou.ndiaye@test.com',
                    'matricule' => 'EMP002',
                    'cardId' => 'CARD002',
                    'type' => 'employe'
                ],
                [
                    'nom' => 'Sarr',
                    'prenom' => 'Moussa',
                    'email' => 'moussa.sarr@test.com',
                    'matricule' => 'APP001',
                    'cardId' => 'CARD003',
                    'type' => 'apprenant'
                ],
                [
                    'nom' => 'Ba',
                    'prenom' => 'Awa',
                    'email' => 'awa.ba@test.com',
                    'matricule' => 'APP002',
                    'cardId' => 'CARD004',
                    'type' => 'apprenant'
                ],
                [
                    'nom' => 'Fall',
                    'prenom' => 'Ibrahima',
                    'email' => 'ibrahima.fall@test.com',
                    'matricule' => 'APP003',
                    'cardId' => 'CARD005',
                    'type' => 'apprenant'
                ]
            ];

            foreach ($utilisateursTest as $userData) {
                $utilisateur = Utilisateur::firstOrCreate(
                    ['email' => $userData['email']],
                    array_merge($userData, [
                        'password' => bcrypt('password123'),
                        'telephone' => '77' . rand(1000000, 9999999),
                        'adresse' => 'Dakar, Sénégal',
                        'estActif' => true,
                        'created_at' => now(),
                        'updated_at' => now()
                    ])
                );
                $utilisateurs->push($utilisateur);
            }
        }

        return $utilisateurs;
    }

    /**
     * Générer des pointages réalistes
     */
    private function genererPointages($utilisateurs, $nombreJours)
    {
        $pointagesCreated = 0;
        $startDate = Carbon::today()->subDays($nombreJours);

        echo "📅 Génération de pointages du " . $startDate->format('d/m/Y') . " à aujourd'hui\n";

        for ($i = 0; $i < $nombreJours; $i++) {
            $date = $startDate->copy()->addDays($i);
            
            // Ignorer les week-ends (optionnel)
            if ($date->isWeekend()) {
                continue;
            }

            echo "📆 Traitement du " . $date->format('d/m/Y') . "\n";

            foreach ($utilisateurs as $utilisateur) {
                // Probabilités réalistes
                $probabilites = $this->getProbabilites($utilisateur->type);
                
                $scenario = $this->determinerScenario($probabilites);
                
                $pointage = $this->creerPointage($utilisateur, $date, $scenario);
                
                if ($pointage) {
                    $pointagesCreated++;
                }
            }
        }

        echo "✨ {$pointagesCreated} pointages créés avec succès !\n";
    }

    /**
     * Définir les probabilités selon le type d'utilisateur
     */
    private function getProbabilites($type)
    {
        if ($type === 'employe') {
            return [
                'present_ponctuel' => 70,  // 70% présent à l'heure
                'present_retard' => 20,    // 20% en retard
                'absent' => 10             // 10% absent
            ];
        } else { // apprenant
            return [
                'present_ponctuel' => 60,  // 60% présent à l'heure
                'present_retard' => 25,    // 25% en retard
                'absent' => 15             // 15% absent
            ];
        }
    }

    /**
     * Déterminer le scénario selon les probabilités
     */
    private function determinerScenario($probabilites)
    {
        $rand = rand(1, 100);
        
        if ($rand <= $probabilites['present_ponctuel']) {
            return 'present_ponctuel';
        } elseif ($rand <= $probabilites['present_ponctuel'] + $probabilites['present_retard']) {
            return 'present_retard';
        } else {
            return 'absent';
        }
    }

    /**
     * Créer un pointage selon le scénario
     */
    private function creerPointage($utilisateur, $date, $scenario)
    {
        // Vérifier si un pointage existe déjà
        $existant = Pointage::where('user_id', $utilisateur->_id)
            ->whereDate('date', $date)
            ->first();

        if ($existant) {
            return null; // Skip si existe déjà
        }

        $heureDebutTravail = Carbon::parse($date->format('Y-m-d') . ' 08:00:00');
        $heureFinTravail = Carbon::parse($date->format('Y-m-d') . ' 17:00:00');

        $donnees = [
            'user_id' => $utilisateur->_id,
            'cardId' => $utilisateur->cardId,
            'date' => $date,
            'estEnAttente' => false,
            'estRejete' => false,
            'created_at' => now(),
            'updated_at' => now()
        ];

        switch ($scenario) {
            case 'present_ponctuel':
                // Arrivée entre 07:45 et 08:00
                $heureArrivee = $heureDebutTravail->copy()->subMinutes(rand(0, 15));
                // Départ entre 17:00 et 17:30
                $heureDepart = $heureFinTravail->copy()->addMinutes(rand(0, 30));
                
                $donnees = array_merge($donnees, [
                    'estPresent' => true,
                    'estRetard' => false,
                    'premierPointage' => $heureArrivee,
                    'dernierPointage' => $heureDepart
                ]);
                break;

            case 'present_retard':
                // Arrivée entre 08:01 et 09:30
                $minutesRetard = rand(1, 90);
                $heureArrivee = $heureDebutTravail->copy()->addMinutes($minutesRetard);
                // Départ normal ou tardif
                $heureDepart = $heureFinTravail->copy()->addMinutes(rand(0, 60));
                
                $donnees = array_merge($donnees, [
                    'estPresent' => true,
                    'estRetard' => true,
                    'premierPointage' => $heureArrivee,
                    'dernierPointage' => $heureDepart
                ]);
                break;

            case 'absent':
                $donnees = array_merge($donnees, [
                    'estPresent' => false,
                    'estRetard' => false,
                    'premierPointage' => null,
                    'dernierPointage' => null
                ]);
                break;
        }

        return Pointage::create($donnees);
    }
}

// database/seeders/DatabaseSeeder.php (ou créer un seeder séparé)

class TestDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            PointageSeeder::class,
        ]);
    }
}