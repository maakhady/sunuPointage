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
        Schema::connection('mongodb')->create('departements', function (Blueprint $table) {
            $table->id();  // L'ID dans MongoDB est un ObjectId par défaut
            $table->string('nom');
            // $table->string('Id');
            $table->timestamps();  // Ajoute created_at et updated_at
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('mongodb')->dropIfExists('departements');
    }
};
