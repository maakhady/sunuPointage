<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::connection('mongodb')->create('pointages', function (Blueprint $table) {
            $table->id();  // MongoDB génère un ObjectId par défaut
            $table->foreignId('user_id')->constrained('utilisateurs');  // Relation avec l'utilisateur
            $table->foreignId('vigile_id')->nullable()->constrained('utilisateurs');  // Relation avec le vigile
            $table->date('date');  // Date du pointage
            $table->boolean('estPresent')->default(false);  // Présence
            $table->boolean('estRetard')->default(false);  // Retard
            $table->dateTime('premierPointage');  // Premier pointage
            $table->dateTime('dernierPointage')->nullable();  // Dernier pointage, peut être nul
            $table->timestamps();  // Gère created_at et updated_at pour MongoDB
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('mongodb')->dropIfExists('pointages');
    }
};
