<?php

namespace App\Models;

// use MongoDB\Laravel\Eloquent\Model  ;
use Tymon\JWTAuth\Contracts\JWTSubject;
use MongoDB\Laravel\Auth\User as Authenticatable;


class Utilisateur extends Authenticatable implements JWTSubject 


// class Utilisateur extends Model  implements  JWTSubject  // Change Model par Authenticatable
{
   

    // Définir la collection MongoDB associée au modèle
    protected $connection = 'mongodb';
    protected $collection = 'utilisateurs';

    // Le reste du code reste identique...
    protected $fillable = [
        'nom',
        'prenom',
        'email',
        'password',
        'telephone',
        'photo',
        'cardId',
        'matricule',
        'type',
        'statut',
        'role',
        'departement_id',
        'cohorte_id',
        'fonction',
        'email_verified_at',
        'remember_token',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        
    ];

    // Methode pour récupérer le mot de passe pour l'authentification
    public function getAuthPassword()
    {
        return $this->password;
    }

    // Méthodes nécessaires pour l'authentification JWT
    public function getJWTIdentifier()
    {
        return $this->getKey(); // L'identifiant unique du modèle
    }

    public function getJWTCustomClaims()
    {
        return []; // Personnalise les claims JWT si nécessaire
    }

    // Relations avec le département
    public function departement()
    {
        return $this->belongsTo(Departement::class, 'departement_id');
    }

    // Relation avec Cohorte
    public function cohorte()
    {
        return $this->belongsTo(Cohorte::class, 'cohorte_id');
    }

    // Relation avec les pointages
    public function pointages()
    {
        return $this->hasMany(Pointage::class, 'user_id');
    }

    public function pointagesValides()
    {
        return $this->hasMany(Pointage::class, 'vigile_id');
    }

    // Relation avec les journaux
    public function journaux()
    {
        return $this->hasMany(Journal::class, 'user_id');
    }

    

    // Relation avec les congés
    public function conges()
    {
        return $this->hasMany(Conge::class, 'user_id');
    }

    public function congesValides()
    {
        return $this->hasMany(Conge::class, 'validateur_id');
    }

    // Méthodes pour vérifier les congés
    public function estEnConge()
    {
        return $this->conges()
            ->where('status', 'valide')
            ->where('date_debut', '<=', now())
            ->where('date_fin', '>=', now())
            ->exists();
    }

    public function congeEnCours()
    {
        return $this->conges()
            ->where('status', 'valide')
            ->where('date_debut', '<=', now())
            ->where('date_fin', '>=', now())
            ->first();
    }

    public function historiqueConges()
    {
        return $this->conges()
            ->where('date_fin', '<', now())
            ->orderBy('date_debut', 'desc');
    }

    // Mutateur pour le mot de passe
    // public function setpasswordAttribute($value)
    // {
    //     $this->attributes['password'] = bcrypt($value);
    // }

    // Accesseur pour le nom complet
    public function getNomCompletAttribute()
    {
        return "{$this->nom} {$this->prenom}";
    }

    // Scopes pour des requêtes fréquentes
    public function scopeActif($query)
    {
        return $query->where('statut', 'actif');
    }

    public function scopeParRole($query, $role)
    {
        return $query->where('role', $role);
    }

    public function isAdmin()
    {
        return $this->role === 'administrateur';
    }
}
