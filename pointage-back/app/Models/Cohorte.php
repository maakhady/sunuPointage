<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model; //as Eloquent; // Utilisation de MongoDB pour Laravel
// use Illuminate\Database\Eloquent\Factories\HasFactory;

class Cohorte extends Model
{
    // use HasFactory;
    
    protected $connection = 'mongodb';

    protected $collection = 'cohortes';

    protected $fillable = [
        'nom',
        'promo',
        'annee_scolaire',
    
    ];

   
   

    // Relation avec les utilisateurs
    public function utilisateurs()
    {
        return $this->hasMany(Utilisateur::class);
    }

    public function apprenants()
{
    return $this->hasMany(Utilisateur::class);
}
}
