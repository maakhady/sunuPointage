<?php
// app/Http/Requests/Utilisateur/ImportRequest.php
namespace App\Http\Requests\Utilisateur;

use Illuminate\Foundation\Http\FormRequest;

class ImportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }    

    public function rules(): array
    {
        return [
            'file' => 'required|file|mimes:csv,txt|max:2048'
        ];
    }

    public function messages(): array
    {
        return [
            'file.required' => 'Le fichier est requis',
            'file.mimes' => 'Le fichier doit être au format CSV',
            'file.max' => 'Le fichier ne doit pas dépasser 2MB'
        ];
    }
}