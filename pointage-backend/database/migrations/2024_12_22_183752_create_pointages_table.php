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
        Schema::create('pointages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('utilisateurs');
            $table->foreignId('vigile_id')->nullable()->constrained('utilisateurs');
            $table->date('date');
            $table->boolean('estPresent')->default(false);
            $table->boolean('estRetard')->default(false);
            $table->dateTime('premierPointage');
            $table->dateTime('dernierPointage')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pointages');
    }
};
