<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Appeler vos seeders dans l'ordre
        $this->call([
            QuickPointageSeeder::class,
            // PointageSeeder::class,  // Décommentez si vous voulez plus de données
        ]);

        // Afficher un message de confirmation
        $this->command->info('🎉 Seeding terminé avec succès !');
        $this->command->info('📊 Vous pouvez maintenant tester vos graphiques');
        $this->command->info('📅 Période de test suggérée :');
        $this->command->info('   - Début: ' . now()->subDays(6)->format('Y-m-d'));
        $this->command->info('   - Fin: ' . now()->format('Y-m-d'));

        // Les lignes commentées ci-dessous sont des exemples Laravel par défaut
        // \App\Models\User::factory(10)->create();

        // \App\Models\User::factory()->create([
        //     'name' => 'Test User',
        //     'email' => 'test@example.com',
        // ]);
    }
}