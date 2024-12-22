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
        
        Schema::create('conges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('utilisateurs');
            $table->foreignId('validateur_id')->nullable()->constrained('utilisateurs');
            $table->dateTime('date_debut');
            $table->dateTime('date_fin');
            $table->enum('type_conge', ['conge', 'maladie', 'voyage']);
            $table->text('motif')->nullable();
            $table->enum('status', ['en_attente', 'valide', 'refuse'])->default('en_attente');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('conges');
    }
};
