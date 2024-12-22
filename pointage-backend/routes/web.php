<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;


Route::get('/', function () {
    return view('welcome');
});

Route::get('/test-mongo', function () {
    try {
        DB::connection('mongodb')->command(['ping' => 1]);
        return "MongoDB fonctionne parfaitement !";
    } catch (\Exception $e) {
        return "Erreur de connexion : " . $e->getMessage();
    }
});