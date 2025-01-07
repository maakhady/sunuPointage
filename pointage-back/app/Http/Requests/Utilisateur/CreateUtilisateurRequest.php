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

    // public function rules(): array
    // {
    //     return [
    //         'nom' => 'required|string|max:255',
    //         'prenom' => 'required|string|max:255',
    //         'email' => 'required|email|unique:utilisateurs,email',
    //         'password' => 'nullable|string|min:8',
    //         'telephone' => 'required|string|unique:utilisateurs,telephone',
    //         'photo' => 'nullable|image|max:2048', // 2MB max
    //         'cardId' => 'nullable|string|unique:utilisateurs,cardId',
    //         'adresse' => 'nullable',
    //         'matricule' => 'required|string|unique:utilisateurs,matricule',
    //         'type' => 'nullable|in:apprenant,employe',
    //         'role' => 'required|in:administrateur,utilisateur_simple',
    //         'fonction' =>  'required|string|max:50',
    //         //  [
    //         //     'required_if:type,employe',
    //         //     'in:DG,Developpeur Front,Developpeur Back,UX/UI Design,RH,Assistant RH,Comptable,Assistant Comptable,Ref_Dig,Vigile,Responsable Communication'
    //         // ],
    //         // 'department_id' => 'required_if:type,employe|exists:departments,id',
    //         // 'cohorte_id' => 'required_if:type,apprenant|exists:cohortes,id'
    //         'departement_id' => 'nullable',
    //         'cohorte_id' => 'nullable',

    //     ];
    // }

    // public function messages(): array
    // {
    //     return [
    //         'nom.required' => 'Le nom est requis',
    //         'prenom.required' => 'Le prénom est requis',
    //         'email.required' => 'L\'email est requis',
    //         'email.email' => 'L\'email doit être valide',
    //         'email.unique' => 'Cet email est déjà utilisé',
    //         'password.required' => 'Le mot de passe est requis',
    //         'password.min' => 'Le mot de passe doit faire au moins 8 caractères',
    //         'telephone.required' => 'Le téléphone est requis',
    //         'telephone.unique' => 'Ce numéro de téléphone est déjà utilisé',
    //         'matricule.required' => 'Le matricule est requis',
    //         'matricule.unique' => 'Ce matricule est déjà utilisé',
    //         'type.required' => 'Le type est requis',
    //         'type.in' => 'Le type doit être soit apprenant soit employe',
    //         'fonction.required_if' => 'La fonction est requise pour un employé',
    //         'department_id.required_if' => 'Le département est requis pour un employé',
    //         'cohorte_id.required_if' => 'La cohorte est requise pour un apprenant'
    //     ];
    // }




    public function rules(): array
    {
        $rules = [
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            'email' => 'required|email|unique:utilisateurs,email',
            'telephone' => 'required|string|unique:utilisateurs,telephone',
            'adresse' => 'required|string',
            'photo' => 'nullable|image|max:2048',
            'cardId' => 'nullable|string|unique:utilisateurs,cardId',
            'matricule' => 'required|string|unique:utilisateurs,matricule'
        ];

        if ($this->has('cohorte_id')) {
            return array_merge($rules, [
                'cohorte_id' => 'required|exists:cohortes,_id',
                'departement_id' => 'prohibited',
                'fonction' => 'prohibited',
                'password' => 'prohibited',
                'role' => 'prohibited'
            ]);
        }

        if ($this->has('departement_id')) {
            $baseRules = array_merge($rules, [
                'departement_id' => 'required|exists:departements,_id',
                'cohorte_id' => 'prohibited',
                'fonction' => 'required|string|max:255',
                'role' => 'required|in:vigile,administrateur,utilisateur_simple'
            ]);

            if (in_array($this->input('role'), ['vigile', 'administrateur'])) {
                $baseRules['password'] = 'required|string|min:8';
            } else {
                $baseRules['password'] = 'prohibited';
            }

            return $baseRules;
        }

        return array_merge($rules, [
            'cohorte_id' => 'required_without:departement_id',
            'departement_id' => 'required_without:cohorte_id'
        ]);
    }

    public function messages(): array
    {
        return [
            'nom.required' => 'Le nom est requis',
            'nom.string' => 'Le nom doit être une chaîne de caractères',
            'nom.max' => 'Le nom ne peut pas dépasser 255 caractères',
            
            'prenom.required' => 'Le prénom est requis',
            'prenom.string' => 'Le prénom doit être une chaîne de caractères',
            'prenom.max' => 'Le prénom ne peut pas dépasser 255 caractères',
            
            'email.required' => "L'email est requis",
            'email.email' => "L'email doit être une adresse email valide",
            'email.unique' => 'Cet email est déjà utilisé',
            
            'telephone.required' => 'Le numéro de téléphone est requis',
            'telephone.unique' => 'Ce numéro de téléphone est déjà utilisé',
            
            'adresse.required' => "L'adresse est requise",
            'adresse.string' => "L'adresse doit être une chaîne de caractères",
            
            'photo.image' => 'Le fichier doit être une image',
            'photo.max' => "L'image ne doit pas dépasser 2Mo",
            
            'cardId.unique' => 'Cette carte ID est déjà utilisée',
            'cardId.string' => 'La carte ID doit être une chaîne de caractères',
            
            'matricule.required' => 'Le matricule est requis',
            'matricule.unique' => 'Ce matricule est déjà utilisé',
            'matricule.string' => 'Le matricule doit être une chaîne de caractères',
            
            'password.required' => 'Le mot de passe est requis pour les vigiles et administrateurs',
            'password.min' => 'Le mot de passe doit faire au moins 8 caractères',
            'password.prohibited' => 'Le mot de passe ne doit pas être défini pour ce type d\'utilisateur',
            
            'cohorte_id.required' => 'La cohorte est requise pour un apprenant',
            'cohorte_id.exists' => "Cette cohorte n'existe pas",
            'cohorte_id.prohibited' => 'La cohorte ne doit pas être définie pour un employé',
            
            'departement_id.required' => 'Le département est requis pour un employé',
            'departement_id.exists' => "Ce département n'existe pas",
            'departement_id.prohibited' => 'Le département ne doit pas être défini pour un apprenant',
            
            'fonction.required' => 'La fonction est requise pour un employé',
            'fonction.prohibited' => 'La fonction ne doit pas être définie pour un apprenant',
            'fonction.string' => 'La fonction doit être une chaîne de caractères',
            'fonction.max' => 'La fonction ne peut pas dépasser 255 caractères',
            
            'role.required' => 'Le rôle est requis pour un employé',
            'role.in' => 'Le rôle doit être vigile, administrateur ou utilisateur_simple',
            'role.prohibited' => 'Le rôle ne doit pas être défini pour un apprenant',
        ];
    }

}