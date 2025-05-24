<?php
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
        
        // 🔧 DÉTECTER LE TYPE DE CONTENU
        $contentType = $this->header('Content-Type', '');
        $isFormData = str_contains($contentType, 'multipart/form-data');
        
        // 🔧 RÈGLES DE BASE
        $rules = [
            'nom' => 'sometimes|string|max:255',
            'prenom' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:utilisateurs,email,' . $userId . ',_id',
            'telephone' => 'sometimes|string|unique:utilisateurs,telephone,' . $userId . ',_id',
            'matricule' => 'sometimes|string|unique:utilisateurs,matricule,' . $userId . ',_id',
            'cardId' => 'nullable|string|unique:utilisateurs,cardId,' . $userId . ',_id',
            'adresse' => 'nullable|string',
            'password' => 'sometimes|nullable|string|min:6',
            'fonction' => [
                'sometimes',
                'in:DG,Developpeur Front,Developpeur Back,UX/UI Design,RH,Assistant RH,Comptable,Assistant Comptable,Ref_Dig,Vigile,Responsable Communication'
            ],
            'departement_id' => 'sometimes|exists:departements,_id',
            'cohorte_id' => 'sometimes|exists:cohortes,_id',
            'statut' => 'sometimes|in:actif,inactif',
            'role' => 'sometimes|in:administrateur,utilisateur_simple',
            'type' => 'sometimes|in:employe,apprenant'
        ];
        
        // 🔧 AJOUTER LA RÈGLE PHOTO SEULEMENT POUR FORMDATA
        if ($isFormData) {
            $rules['photo'] = 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048';
        }
        
        return $rules;
    }

    // 🔧 AJOUTER UNE MÉTHODE POUR DÉBUGGER
    public function prepareForValidation()
    {
        // Log pour debug
        logger('=== REQUEST VALIDATION DEBUG ===');
        logger('Content-Type: ' . $this->header('Content-Type'));
        logger('Method: ' . $this->method());
        logger('Has file photo: ' . ($this->hasFile('photo') ? 'OUI' : 'NON'));
        logger('All input keys: ' . implode(', ', array_keys($this->all())));
        
        if ($this->hasFile('photo')) {
            $photo = $this->file('photo');
            logger('Photo details: ', [
                'name' => $photo->getClientOriginalName(),
                'size' => $photo->getSize(),
                'type' => $photo->getMimeType(),
                'valid' => $photo->isValid()
            ]);
        }
    }

    // 🔧 MESSAGES D'ERREUR PERSONNALISÉS
    public function messages(): array
    {
        return [
            'nom.required' => 'Le nom est requis',
            'prenom.required' => 'Le prénom est requis',
            'email.required' => 'L\'email est requis',
            'email.email' => 'L\'email n\'est pas valide',
            'email.unique' => 'Cet email est déjà utilisé',
            'telephone.unique' => 'Ce numéro de téléphone est déjà utilisé',
            'matricule.unique' => 'Ce matricule est déjà utilisé',
            'photo.image' => 'Le fichier doit être une image',
            'photo.max' => 'La photo ne doit pas dépasser 2MB',
            'photo.mimes' => 'La photo doit être au format jpeg, png, jpg ou gif',
        ];
    }
}