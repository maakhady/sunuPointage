<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model; // as Eloquent;
// use Illuminate\Database\Eloquent\Factories\HasFactory;

class Journal extends Model
{
    // use HasFactory;

    protected $connection = 'mongodb';
    protected $collection = 'journals';

    protected $fillable = [
        'user_id',
        'action',         // Ajout pour stocker le type d'action (création, modification, suppression, etc.)
        'details',        // Ajout pour stocker les détails supplémentaires
        'ip',            // Ajout optionnel pour stocker l'IP
        'date_action',   
        'description',
        'status'
    ];

    protected $casts = [
        'date_action' => 'datetime',
        'details' => 'array'     // Important pour stocker les détails en JSON/Array
    ];

    // Relation avec l'utilisateur
    public function utilisateur()
    {
        return $this->belongsTo(Utilisateur::class, 'user_id');
    }

    // Scopes utiles
    public function scopeEntreDates($query, $debut, $fin)
    {
        return $query->whereBetween('date_action', [$debut, $fin]);
    }

    public function scopeParUtilisateur($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeParAction($query, $action)
    {
        return $query->where('action', $action);
    }

    // Scope pour les dernières actions
    public function scopeDerniersLogs($query, $limit = 10)
    {
        return $query->orderBy('date_action', 'desc')->limit($limit);
    }

    // Créer automatiquement la date d'action
    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($journal) {
            if (!isset($journal->date_action)) {
                $journal->date_action = now();
            }
        });
    }
}