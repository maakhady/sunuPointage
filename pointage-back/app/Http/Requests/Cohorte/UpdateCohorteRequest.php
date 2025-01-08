<?php

namespace App\Http\Requests\Cohorte;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCohorteRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'nom' => 'required|string|max:255|unique:cohorte,nom',
            'promo' => 'required|integer|max:255',
            'annee_scolaire' => 'nullable'
        ];
    }

    public function messages()
    {
        return [
            'nom.required' => 'Le nom de la cohorte est requis',
            'promo.required' => 'La promotion est requise'
        ];
    }
}
