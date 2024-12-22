<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Utilisateur extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'nom',
        'prenom',
        'email',
        'motpasse',
        'telephone',
        'photo',
        'cardId',
        'matricule',
        'type',         // apprenant, employe
        'statut',       // actif, inactif
        'department_id',
        'fonction',     // DG, Vigile, Comptable, RH, etc.
        'cohorte_id',
        'role' // utilisateur_simple, administrateur
    ];

    protected $hidden = [
        'motpasse',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'dateCreation' => 'datetime',
        'dateMiseAJour' => 'datetime',
        
    ];

    // Relation avec Department
    public function departement()
    {
        return $this->belongsTo(Departement::class);
    }

    // Relation avec Cohorte
    public function cohorte()
    {
        return $this->belongsTo(Cohorte::class);
    }

    // Relation avec les pointages de l'utilisateur
    public function pointages()
    {
        return $this->hasMany(Pointage::class, 'user_id');
    }

    // Pointages validés par le vigile
    public function pointagesValides()
    {
        return $this->hasMany(Pointage::class, 'vigile_id');
    }

    // Relation avec le journal
    public function journaux()
    {
        return $this->hasMany(Journal::class, 'user_id');
    }

    // Vérifier si l'utilisateur est un administrateur (DG)
    public function isAdmin()
    {
        return $this->fonction === 'DG';
    }

    // Vérifier si l'utilisateur est un vigile
    public function isVigile()
    {
        return $this->fonction === 'Vigile';
    }
    // Ajouter la relation avec les congés
public function conges()
{
    return $this->hasMany(Conge::class, 'user_id');
}

// Pour les congés que l'utilisateur a validés (en tant que DG)
public function congesValides()
{
    return $this->hasMany(Conge::class, 'validateur_id');
}

// Vérifier si l'utilisateur est actuellement en congé
public function estEnConge()
{
    return $this->conges()
        ->where('status', 'valide')
        ->where('date_debut', '<=', now())
        ->where('date_fin', '>=', now())
        ->exists();
}

// Obtenir le congé en cours
public function congeEnCours()
{
    return $this->conges()
        ->where('status', 'valide')
        ->where('date_debut', '<=', now())
        ->where('date_fin', '>=', now())
        ->first();
}

// Obtenir l'historique des congés
public function historiqueConges()
{
    return $this->conges()
        ->where('date_fin', '<', now())
        ->orderBy('date_debut', 'desc');
}
}