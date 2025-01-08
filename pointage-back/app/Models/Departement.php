<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model; // as Eloquent; // Utilisation de MongoDB pour Laravel
// use Illuminate\Database\Eloquent\Factories\HasFactory;

class Departement extends Model
{
    // use HasFactory;

    protected $connection = 'mongodb';
    protected $collection = 'departements';

    protected $fillable = [
        'nom',
        
    ];

    

    // Relation avec les utilisateurs
    public function utilisateurs()
    {
        return $this->hasMany(Utilisateur::class);
    }

     // Relation avec les employés
     public function employes()
     {
         return $this->hasMany(Utilisateur::class);
     }

   
   
}
