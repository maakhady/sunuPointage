<?php
// app/Http/Requests/Utilisateur/CreateUtilisateurRequest.php
namespace App\Http\Requests\Utilisateur;

use Illuminate\Foundation\Http\FormRequest;

class CreateUtilisateurRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Seul l'admin peut créer des utilisateurs
        return true;
    }

    public function rules(): array
    {
        return [
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            'email' => 'required|email|unique:utilisateurs,email',
            'password' => 'nullable|required|string|min:8',
            'telephone' => 'required|string|unique:utilisateurs,telephone',
            'photo' => 'nullable|image|max:2048', // 2MB max
            'cardId' => 'nullable|string|unique:utilisateurs,cardId',
            'adresse' => 'nullable',
            'matricule' => 'required|string|unique:utilisateurs,matricule',
            'type' => 'required|in:apprenant,employe',
            'role' => 'required|in:administrateur,utilisateur_simple',
            'fonction' => [
                'required_if:type,employe',
                'in:DG,Developpeur Front,Developpeur Back,UX/UI Design,RH,Assistant RH,Comptable,Assistant Comptable,Ref_Dig,Vigile,Responsable Communication'
            ],
            // 'department_id' => 'required_if:type,employe|exists:departments,id',
            // 'cohorte_id' => 'required_if:type,apprenant|exists:cohortes,id'
            'departement_id' => 'nullable',
            'cohorte_id' => 'nullable',

        ];
    }

    public function messages(): array
    {
        return [
            'nom.required' => 'Le nom est requis',
            'prenom.required' => 'Le prénom est requis',
            'email.required' => 'L\'email est requis',
            'email.email' => 'L\'email doit être valide',
            'email.unique' => 'Cet email est déjà utilisé',
            'password.required' => 'Le mot de passe est requis',
            'password.min' => 'Le mot de passe doit faire au moins 8 caractères',
            'telephone.required' => 'Le téléphone est requis',
            'telephone.unique' => 'Ce numéro de téléphone est déjà utilisé',
            'matricule.required' => 'Le matricule est requis',
            'matricule.unique' => 'Ce matricule est déjà utilisé',
            'type.required' => 'Le type est requis',
            'type.in' => 'Le type doit être soit apprenant soit employe',
            'fonction.required_if' => 'La fonction est requise pour un employé',
            'department_id.required_if' => 'Le département est requis pour un employé',
            'cohorte_id.required_if' => 'La cohorte est requise pour un apprenant'
        ];
    }
}