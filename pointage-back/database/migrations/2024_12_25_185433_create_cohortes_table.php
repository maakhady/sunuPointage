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
        Schema::connection('mongodb')->create('cohortes', function (Blueprint $table) {
            $table->id();  // MongoDB génère un ObjectId par défaut
            $table->string('nom');
            $table->integer('promo');
            $table->string('annee_scolaire');
            $table->timestamps();  // Ajoute created_at et updated_at pour MongoDB
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('mongodb')->dropIfExists('cohortes');
    }
};
