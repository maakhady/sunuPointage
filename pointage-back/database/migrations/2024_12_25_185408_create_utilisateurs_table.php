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
        // Création de la collection "utilisateurs"
        Schema::connection('mongodb')->create('utilisateurs', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('prenom');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('telephone')->unique();
            $table->string('photo')->nullable();
            $table->string('adresse')->nullable();
            $table->string('cardId')->unique()->nullable();
            $table->string('matricule')->unique();
            $table->enum('type', ['apprenant', 'employe']);
            $table->enum('statut', ['actif', 'inactif'])->default('actif');
            $table->enum('role', ['utilisateur_simple', 'administrateur'])->default('utilisateur_simple');
            $table->foreignId('department_id')->nullable()->constrained('departements')->onDelete('set null');
            $table->foreignId('cohorte_id')->nullable()->constrained('cohortes')->onDelete('set null');
            $table->enum('fonction',['DG', 'Developpeur Front','Developpeur Back', 'UX/UI Design', 'RH','Assistant RH', 'Comptable','Assistant Comptable', 'Ref_Dig','Vigile', 'Responsable Communication'])->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('mongodb')->dropIfExists('utilisateurs');
    }
};
