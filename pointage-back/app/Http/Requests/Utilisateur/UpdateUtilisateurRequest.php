<?php
// app/Http/Requests/Utilisateur/UpdateUtilisateurRequest.php
namespace App\Http\Requests\Utilisateur;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUtilisateurRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('id');

        return [
            'nom' => 'sometimes|string|max:255',
            'prenom' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:utilisateurs,email,' . $userId,
            'telephone' => 'sometimes|string|unique:utilisateurs,telephone,' . $userId,
            'photo' => 'nullable|image|max:2048',
            'cardId' => 'nullable|string|unique:utilisateurs,cardId,' . $userId,
            'adresse' => 'nullable',
            'matricule' => 'sometimes|string|unique:utilisateurs,matricule,' . $userId,
            'fonction' => [
                'sometimes',
                'in:DG,Developpeur Front,Developpeur Back,UX/UI Design,RH,Assistant RH,Comptable,Assistant Comptable,Ref_Dig,Vigile,Responsable Communication'
            ],
            'department_id' => 'sometimes|exists:departments,id',
            'cohorte_id' => 'sometimes|exists:cohortes,id',
            'statut' => 'sometimes|in:actif,inactif',
            'role' => 'sometimes|in:administrateur,utilisateur_simple',
            'type' => 'sometimes|in:employe,aprenant'
            
        ];
    }
}