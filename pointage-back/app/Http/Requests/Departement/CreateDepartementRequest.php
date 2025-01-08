<?php

namespace App\Http\Requests\Departement;

use Illuminate\Foundation\Http\FormRequest;

class CreateDepartementRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'nom' => 'required|string|max:255|unique:departements,nom',
            // 'Id' => 'required|string|max:255|unique:departements,Id'
        ];
    }

    public function messages()
    {
        return [
            'nom.required' => 'Le nom du département est requis',
            'nom.unique' => 'Ce nom de département existe déjà'
        ];
    }
}