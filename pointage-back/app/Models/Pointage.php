<?php

namespace App\Models;

use Carbon\Carbon;

use MongoDB\Laravel\Eloquent\Model; //as Eloquent; // Utilisation de MongoDB pour Laravel
// use Illuminate\Database\Eloquent\Factories\HasFactory;

class Pointage extends Model
{
    // use HasFactory;

    protected $connection = 'mongodb';
    protected $collection = 'pointages';

    protected $fillable = [
        'user_id',
        'cardId',
        'vigile_id',
        'date',
        'estPresent',
        'estRetard',
        'premierPointage',
        'dernierPointage',
        'estEnAttente',
        'estRejete',
        'premierPointage_temp',
        'dernierPointage_temp',
        'estRetard_temp'
    ];

    protected $casts = [
        'date' => 'datetime',
        'premierPointage' => 'datetime',
        'dernierPointage' => 'datetime',
        'premierPointage_temp' => 'datetime',
        'dernierPointage_temp' => 'datetime',
        'estPresent' => 'boolean',
        'estRetard' => 'boolean',
        'estRetard_temp' => 'boolean',
        'estEnAttente' => 'boolean',
        'estRejete' => 'boolean'
    ];

    // Relation avec l'utilisateur qui pointe
    public function utilisateur()
    {
        return $this->belongsTo(Utilisateur::class, 'user_id','_id')
                    ->where('cardId', $this->cardId);
    }

    public function user()
    {
        return $this->belongsTo(Utilisateur::class, 'user_id','_id');
    }


    // Relation avec le vigile qui valide
    public function vigile()
    {
        return $this->belongsTo(Utilisateur::class, 'vigile_id','_id');
    }

    // Nouvelles méthodes pour la gestion des absences
    public static function enregistrerAbsences($date = null)
    {
        // Si aucune date n'est fournie, utiliser la date d'aujourd'hui
        $date = $date ? Carbon::parse($date) : Carbon::today();

        // Récupérer tous les utilisateurs actifs
        $utilisateurs = Utilisateur::where('estActif', true)->get();

        $resultats = [
            'success' => [],
            'errors' => []
        ];

        foreach ($utilisateurs as $utilisateur) {
            try {
                // Vérifier si un pointage existe déjà pour cet utilisateur à cette date
                $pointageExistant = self::where('user_id', $utilisateur->_id)
                    ->where('date', $date->format('Y-m-d'))
                    ->first();

                if (!$pointageExistant) {
                    // Créer un nouveau pointage marqué comme absent
                    self::create([
                        'user_id' => $utilisateur->_id,
                        'cardId' => $utilisateur->cardId,
                        'date' => $date,
                        'estPresent' => false,
                        'estRetard' => false,
                        'estEnAttente' => false,
                        'estRejete' => false
                    ]);

                    $resultats['success'][] = [
                        'matricule' => $utilisateur->matricule,
                        'message' => 'Absence enregistrée'
                    ];
                }
            } catch (\Exception $e) {
                $resultats['errors'][] = [
                    'matricule' => $utilisateur->matricule,
                    'message' => $e->getMessage()
                ];
            }
        }

        return $resultats;
    }

    public static function etaitAbsent($userId, $date = null)
    {
        $date = $date ? Carbon::parse($date) : Carbon::today();

        return self::where('user_id', $userId)
            ->where('date', $date->format('Y-m-d'))
            ->where('estPresent', false)
            ->exists();
    }

}

