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
        Schema::connection('mongodb')->create('conges', function (Blueprint $table) {
            $table->id();  // MongoDB génère un ObjectId par défaut
            $table->foreignId('user_id')->nullable(); // Stocke l'ID de l'utilisateur
            $table->foreignId('validateur_id')->nullable(); // Stocke l'ID du validateur (DG)
            $table->dateTime('date_debut');
            $table->dateTime('date_fin');
            $table->enum('type_conge', ['conge', 'maladie', 'voyage']);
            $table->text('motif')->nullable();
            $table->enum('status', ['en_attente', 'valide', 'refuse'])->default('en_attente');
            $table->timestamps();  // Ajoute created_at et updated_at pour MongoDB
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('mongodb')->dropIfExists('conges');
    }
};
