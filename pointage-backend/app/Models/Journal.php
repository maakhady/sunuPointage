<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Journal extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'date',
        'date_action',
        'motif',
        'status',
        'description'
    ];

    protected $casts = [
        'date' => 'datetime',
        'date_action' => 'datetime'
    ];

    // Relation avec l'utilisateur
    public function utilisateur()
    {
        return $this->belongsTo(Utilisateur::class, 'user_id');
    }

    // Rechercher par plage de dates
    public function scopeEntreDates($query, $debut, $fin)
    {
        return $query->whereBetween('date', [$debut, $fin]);
    }

    // Rechercher par utilisateur
    public function scopeParUtilisateur($query, $userId)
    {
        return $query->where('user_id', $userId);
    }
}