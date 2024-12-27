<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use MongoDB\Laravel\Schema\Blueprint as MongoBlueprint;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::connection('mongodb')->create('journals', function (MongoBlueprint $collection) {
            // L'ID MongoDB est géré automatiquement
            $collection->string('user_id');  // ID de l'utilisateur qui fait l'action
            $collection->string('action');   // Type d'action (création, modification, etc.)
            $collection->dateTime('date_action'); // Date de l'action
            $collection->string('ip')->nullable(); // Adresse IP
            
            // Champ details pour stocker les informations supplémentaires
            $collection->object('details')->nullable(); // Stockage flexible pour les détails
            
            // Champs optionnels pour compatibilité
            $collection->string('description')->nullable();
            $collection->string('status')->nullable();
            
            // Timestamps standards
            $collection->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('mongodb')->dropIfExists('journals');
    }
};