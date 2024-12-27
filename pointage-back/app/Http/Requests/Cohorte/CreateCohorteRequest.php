<?php

namespace App\Http\Requests\Cohorte;

use Illuminate\Foundation\Http\FormRequest;

class CreateCohorteRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'nom' => 'required|string|max:255',
            'annee_scolaire' => 'required|string|max:255'
        ];
    }

    public function messages()
    {
        return [
            'nom.required' => 'Le nom de la cohorte est requis',
            'annee_scolaire.required' => 'L\'année scolaire est requise'
        ];
    }
}