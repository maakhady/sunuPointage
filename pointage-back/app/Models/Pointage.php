<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model; //as Eloquent; // Utilisation de MongoDB pour Laravel
// use Illuminate\Database\Eloquent\Factories\HasFactory;

class Pointage extends Model
{
    // use HasFactory;

    protected $connection = 'mongodb';
    protected $collection = 'pointages';

    protected $fillable = [
        'user_id',
        'vigile_id',
        'date',
        'estPresent',
        'estRetard',
        'premierPointage',
        'dernierPointage'
    ];

    protected $casts = [
        'date' => 'datetime',
        'premierPointage' => 'datetime',
        'dernierPointage' => 'datetime',
        'estPresent' => 'boolean',
        'estRetard' => 'boolean'
    ];

    // Relation avec l'utilisateur qui pointe
    public function utilisateur()
    {
        return $this->belongsTo(Utilisateur::class, 'user_id');
    }

    // Relation avec le vigile qui valide
    public function vigile()
    {
        return $this->belongsTo(Utilisateur::class, 'vigile_id');
    }
}
