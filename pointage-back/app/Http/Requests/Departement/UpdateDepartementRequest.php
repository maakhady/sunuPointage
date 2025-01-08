<?php

namespace App\Http\Requests\Departement;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDepartementRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'nom' => 'required|string|max:255|unique:departements,nom,' . $this->route('id'),
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