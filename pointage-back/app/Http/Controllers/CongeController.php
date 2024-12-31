<?php

namespace App\Http\Controllers;

use App\Models\Conge;
use App\Models\Utilisateur;
use App\Models\Pointage;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Journal;

class CongeController extends Controller
{
/**
     * Créer un log dans le journal
     */
    private function createLog($action, $details = [], $status = 'success')
    {
        Journal::create([
            'user_id' => Auth::id(),
            'action' => $action,
            'details' => $details,
            'ip' => request()->ip(),
            'description' => "Action {$action} effectuée sur un congé",
            'status' => $status
        ]);
    }


    /**
     * Afficher la liste des congés
     */
    public function index()
    {
        $conges = Conge::with(['utilisateur', 'validateur'])
            ->latest()
            ->get();

        $this->createLog('consultation_liste_conges', [
            'nombre_conges' => $conges->count()
        ]);

        return response()->json([
            'success' => true,
            'data' => $conges
        ]);
    }

    /**
     * Enregistrer un nouveau congé
     */
    public function store(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:utilisateurs,_id',
            'date_debut' => 'required|date',
            'date_fin' => 'required|date|after_or_equal:date_debut',
            'type_conge' => 'required|in:congé,maladie,voyage',
            'motif' => 'required|string'
        ]);

        try {
            $utilisateur = Utilisateur::find($request->user_id);
            if (!$utilisateur) {
                $this->createLog('creation_conge', [
                    'user_id' => $request->user_id,
                    'error' => 'Utilisateur non trouvé'
                ], 'error');
                
                return response()->json([
                    'success' => false,
                    'message' => 'Utilisateur non trouvé'
                ], 404);
            }

            $congeExistant = Conge::where('user_id', $request->user_id)
                ->where(function($query) use ($request) {
                    $query->whereBetween('date_debut', [$request->date_debut, $request->date_fin])
                        ->orWhereBetween('date_fin', [$request->date_debut, $request->date_fin]);
                })
                ->where('status', 'validé')
                ->first();

            if ($congeExistant) {
                $this->createLog('creation_conge', [
                    'user_id' => $request->user_id,
                    'error' => 'Congé existant pour cette période'
                ], 'error');
                
                return response()->json([
                    'success' => false,
                    'message' => 'Un congé existe déjà pour cette période'
                ], 422);
            }

            $conge = Conge::create([
                'user_id' => $request->user_id,
                'date_debut' => Carbon::parse($request->date_debut),
                'date_fin' => Carbon::parse($request->date_fin),
                'type_conge' => $request->type_conge,
                'motif' => $request->motif,
                'status' => 'validé',
                'validateur_id' => Auth::id()
            ]);

            $this->desactiverCarte($request->user_id, $request->date_debut, $request->date_fin);
            $this->creerPointagesConge($conge);

            $this->createLog('creation_conge', [
                'conge_id' => $conge->_id,
                'user_id' => $request->user_id,
                'type_conge' => $request->type_conge
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Congé enregistré avec succès',
                'data' => $conge
            ]);

        } catch (\Exception $e) {
            $this->createLog('creation_conge', [
                'error' => $e->getMessage()
            ], 'error');
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'enregistrement du congé: ' . $e->getMessage()
            ], 500);
        }
    }
    /**
     * Afficher les détails d'un congé
     */
    public function show($id)
    {
        try {
            $conge = Conge::with(['utilisateur', 'validateur'])->findOrFail($id);
            
            $this->createLog('consultation_conge', [
                'conge_id' => $id
            ]);

            return response()->json([
                'success' => true,
                'data' => $conge
            ]);
        } catch (\Exception $e) {
            $this->createLog('consultation_conge', [
                'conge_id' => $id,
                'error' => $e->getMessage()
            ], 'error');

            return response()->json([
                'success' => false,
                'message' => 'Congé non trouvé'
            ], 404);
        }
    }

    /**
     * Modifier un congé
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'date_debut' => 'required|date',
            'date_fin' => 'required|date|after_or_equal:date_debut',
            'type_conge' => 'required|in:congé,maladie,voyage',
            'motif' => 'required|string'
        ]);

        try {
            $conge = Conge::findOrFail($id);
            
            $this->activerCarte($conge->user_id);
            $this->supprimerPointagesConge($conge);

            $conge->update([
                'date_debut' => ['$date' => strtotime($request->date_debut) * 1000],
                'date_fin' => ['$date' => strtotime($request->date_fin) * 1000],
                'type_conge' => $request->type_conge,
                'motif' => $request->motif
            ]);

            $this->desactiverCarte($conge->user_id, $request->date_debut, $request->date_fin);
            $this->creerPointagesConge($conge);

            $this->createLog('modification_conge', [
                'conge_id' => $id,
                'type_conge' => $request->type_conge
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Congé modifié avec succès',
                'data' => $conge
            ]);

        } catch (\Exception $e) {
            $this->createLog('modification_conge', [
                'conge_id' => $id,
                'error' => $e->getMessage()
            ], 'error');

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la modification du congé: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Supprimer un congé
     */
    public function destroy($id)
    {
        try {
            $conge = Conge::findOrFail($id);
            
            $this->activerCarte($conge->user_id);
            $this->supprimerPointagesConge($conge);
            
            $conge->delete();

            $this->createLog('suppression_conge', [
                'conge_id' => $id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Congé supprimé avec succès'
            ]);

        } catch (\Exception $e) {
            $this->createLog('suppression_conge', [
                'conge_id' => $id,
                'error' => $e->getMessage()
            ], 'error');

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression du congé: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Désactiver la carte d'un utilisateur pour une période donnée
     */
    private function desactiverCarte($userId, $dateDebut, $dateFin)
    {
        Utilisateur::where('user_id', $userId)
        ->update([
            'status' => 'inactive',
            'date_reactivation' => ['$date' => strtotime($dateFin) * 1000]
        ]);
    }

    /**
     * Réactiver la carte d'un utilisateur
     */
    private function activerCarte($userId)
    {
        Utilisateur::where('user_id', $userId)
            ->update([
                'status' => 'active',
                'date_reactivation' => null
            ]);
    }

    /**
     * Créer les pointages automatiques pour la période de congé
     */
    private function creerPointagesConge(Conge $conge)
    {
        $dateDebut = Carbon::parse($conge->date_debut);
        $dateFin = Carbon::parse($conge->date_fin);

        for($date = $dateDebut; $date->lte($dateFin); $date->addDay()) {
            // Ne pas créer de pointage pour les weekends
            if($date->isWeekday()) {
                // Convertir les timestamps en millisecondes
                $dateMillis = $date->timestamp * 1000;
                $heureArriveeMillis = $date->copy()->setTime(8, 0)->timestamp * 1000;
                $heureDepartMillis = $date->copy()->setTime(17, 0)->timestamp * 1000;
                
                Pointage::create([
                    'user_id' => $conge->user_id,
                    'date' => ['$date' => $dateMillis],
                    'heure_arrivee' => ['$date' => $heureArriveeMillis],
                    'heure_depart' => ['$date' => $heureDepartMillis],
                    'status' => 'present',
                    'type' => 'conge',
                    'conge_id' => $conge->_id
                ]);
            }
        }
    }

    /**
     * Supprimer les pointages automatiques d'un congé
     */
    private function supprimerPointagesConge(Conge $conge)
    {
        Pointage::where('conge_id', $conge->_id)->delete();
    }

    /**
     * Liste des employés actuellement en congé
     */
    public function enConge()
    {
        $conges = Conge::with('utilisateur')
            ->enCours()
            ->get();

        $this->createLog('consultation_conges_en_cours', [
            'nombre_conges' => $conges->count()
        ]);

        return response()->json([
            'success' => true,
            'data' => $conges
        ]);
    }
}