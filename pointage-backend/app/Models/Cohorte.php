<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Cohorte extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom',
        'annee_scolaire',
        'dateCreation',
        'dateMiseAJour'
    ];

    protected $casts = [
        'dateCreation' => 'datetime',
        'dateMiseAJour' => 'datetime'
    ];

    public function utilisateurs()
    {
        return $this->hasMany(Utilisateur::class);
    }
}