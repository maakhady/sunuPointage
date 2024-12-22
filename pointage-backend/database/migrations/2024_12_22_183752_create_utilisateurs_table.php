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
        Schema::create('utilisateurs', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('prenom');
            $table->string('email')->unique();
            $table->string('motpasse');
            $table->string('telephone')->unique();
            $table->string('photo')->nullable();
            $table->string('cardId')->unique()->nullable();
            $table->string('matricule')->unique();
            $table->enum('type', ['apprenant', 'employe']);
            $table->enum('statut', ['actif', 'inactif'])->default('actif');
            $table->enum('role', ['utilisateur_simple', 'administrateur'])->default('utilisateur_simple');
            $table->foreignId('department_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('cohorte_id')->nullable()->constrained()->onDelete('set null');
            $table->string('fonction',['Dg', 'Developpeur Front','Developpeur Back', 'UX/UI Design', 'RH','Assistant RH', 'Comptable','Assistant Comptable', 'Ref_Dig','Vigile', 'Responsable Communication'])->nullable(); // DG, Vigile, Comptable, RH, etc.
            $table->timestamp('dateCreation')->useCurrent();
            $table->timestamp('dateMiseAJour')->nullable();
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
        Schema::dropIfExists('utilisateurs');
    }
};
