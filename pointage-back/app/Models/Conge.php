<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model; //as Eloquent; // Utilisation de MongoDB pour Laravel
// use Illuminate\Database\Eloquent\Factories\HasFactory;

class Conge extends Model
{
    // use HasFactory;

    protected $connection = 'mongodb';
    protected $collection = 'conges';

    protected $fillable = [
        'user_id',
        'date_debut',
        'date_fin',
        'type_conge',  // congé, maladie, voyage
        'motif',
        'status',      // en attente, validé, refusé
        'validateur_id' // ID du DG qui valide
    ];

    protected $casts = [
        'date_debut' => 'date:Y-m-d',
        'date_fin' => 'date:Y-m-d'
    ];

    // Relation avec l'utilisateur qui demande le congé
    public function utilisateur()
    {
        return $this->belongsTo(Utilisateur::class, 'user_id');
    }

    // Relation avec le validateur (DG)
    public function validateur()
    {
        return $this->belongsTo(Utilisateur::class, 'validateur_id');
    }

    // Scope pour les congés en cours
    public function scopeEnCours($query)
    {
        return $query->where('date_debut', '<=', now())
                    ->where('date_fin', '>=', now())
                    ->where('status', 'validé');
    }

    // Scope pour les congés à venir
    public function scopeAVenir($query)
    {
        return $query->where('date_debut', '>', now());
    }

    // Scope pour les congés par statut
    public function scopeParStatus($query, $status)
    {
        return $query->where('status', $status);
    }
}
