<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // return [
        //     'nom' => 'required|string|max:255',
        //     'prenom' => 'required|string|max:255',
        //     'email' => 'required|email|unique:utilisateurs,email',
        //     'password' => 'required|string|min:8',
        //     'telephone' => 'required|unique:utilisateurs,telephone',
        //     'matricule' => 'required|unique:utilisateurs,matricule',
        //     'type' => 'required|in:apprenant,employe',
        //     'fonction' => 'required_if:type,employe|in:DG,Developpeur Front,Developpeur Back,UX/UI Design,RH,Assistant RH,Comptable,Assistant Comptable,Ref_Dig,Vigile,Responsable Communication',
        //     'cohorte_id' => 'required_if:type,apprenant|exists:cohortes,id',
        //     // 'departement_id' => 'required_if:type,employe|exists:departements,id',
        //     'departement_id' => 'nullable',
        //     'photo' => 'nullable|image|max:2048',
        //     'cardId' => 'nullable|string|unique:utilisateurs,cardId'
        // ];
        return [
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            'email' => 'required|email|unique:utilisateurs,email',
            'password' => [
                'required_if:fonction,DG,vigile',
                'string',
                'min:8',
                'nullable'
            ],
            'telephone' => 'required|unique:utilisateurs,telephone',
            'matricule' => 'required|unique:utilisateurs,matricule',
            'fonction' => 'required_with:department_id|in:DG,Developpeur Front,Developpeur Back,UX/UI Design,RH,Assistant RH,Comptable,Assistant Comptable,Ref_Dig,Vigile,Responsable Communication',
            'adresse' => 'nullable',
            'photo' => 'nullable|image|max:2048',
            'cardId' => 'nullable|string|unique:utilisateurs,cardId',
            // 'role' => 'required|in:administrateur,utilisateur_simple',
            'cohorte_id' => 'required_without:departement_id|exists:mongodb.cohortes,_id',
            'departement_id' => 'required_without:cohorte_id|exists:mongodb.departements,_id'
        ];
    }

    public function messages(): array
    {
        return [
            'nom.required' => 'Le nom est requis',
            'prenom.required' => 'Le prénom est requis',
            'email.required' => 'L\'email est requis',
            'email.email' => 'L\'email n\'est pas valide',
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
            'cohorte_id.required_if' => 'La cohorte est requise pour un apprenant',
            
        ];
    }


}
