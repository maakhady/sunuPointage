<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pointage extends Model
{
    use HasFactory;

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