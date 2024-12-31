<?php

// use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
//     return $request->user();
// });


use App\Http\Controllers\CohorteController;

Route::middleware('jwt.admin')->group(function () {
    Route::group(['prefix' => 'cohortes'], function () {
        Route::get('/', [CohorteController::class, 'index']); 
        Route::post('/', [CohorteController::class, 'store']);  
        Route::get('/{id}', [CohorteController::class, 'show']); 
        Route::put('/{id}', [CohorteController::class, 'update']);
        Route::delete('/{id}', [CohorteController::class, 'destroy']);
    });
});


//authetification 

use App\Http\Controllers\AuthController;
Route::post('register', [AuthController::class, 'register']);


Route::prefix('utilisateurs')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('card', [AuthController::class, 'cardLogin']);


    Route::middleware('jwt.admin')->group(function () {
        Route::get('me/{id}', [AuthController::class, 'me']);
        // Route::post('register', [AuthController::class, 'register']);
        Route::post('creerUser', [AuthController::class, 'creerUser']);


    });
    Route::post('logout', [AuthController::class, 'logout']);
    
});



///UTilisateurs
use App\Http\Controllers\UtilisateurController;

Route::get('/utilisateurs/verify-card', [UtilisateurController::class, 'verifyCard']);

Route::middleware('jwt.admin')->group(function () {
    Route::get('/utilisateurs', [UtilisateurController::class, 'index']);
    Route::post('/utilisateurs', [UtilisateurController::class, 'store']);
    Route::get('/utilisateurs/{id}', [UtilisateurController::class, 'show']);
    Route::put('/utilisateurs/{id}', [UtilisateurController::class, 'update']);
    Route::delete('/utilisateurs/{id}', [UtilisateurController::class, 'destroy']);
    Route::post('/utilisateurs/import', [UtilisateurController::class, 'import']);
    Route::put('/utilisateurs/status/{id}', [UtilisateurController::class, 'updateStatus']);
    Route::post('/utilisateurs/{id}/assign-card', [UtilisateurController::class, 'assignCard']);
    // Route::get('/utilisateurs/verify-card', [UtilisateurController::class, 'verifyCard']);
    Route::get('/utilisateurs/profile', [UtilisateurController::class, 'profile']);
    // Route::put('/utilisateurs/profile', [UtilisateurController::class, 'updateProfile']);
    Route::post('/utilisateurs/bulk-status-update', [UtilisateurController::class, 'bulkStatusUpdate']);
    Route::delete('/utilisateurs/bulk-destroy', [UtilisateurController::class, 'bulkDestroy']);
    Route::post('/utilisateurs/bulk-toggle-status', [UtilisateurController::class, 'bulkToggleStatus']);
});

//Departement ok
 use App\Http\Controllers\DepartementController;

Route::middleware('jwt.admin')->group(function () {
    Route::get('/departements', [DepartementController::class, 'index']);
    Route::post('/departements', [DepartementController::class, 'store']);
    Route::get('/departements/{id}', [DepartementController::class, 'show']);
    Route::put('/departements/{id}', [DepartementController::class, 'update']); 
    Route::delete('/departements/{id}', [DepartementController::class, 'destroy']);
 });

 use App\Http\Controllers\PointageController;

// Routes Pointage
Route::prefix('pointages')->group(function () {
    // Route publique pour pointer
    Route::post('/pointer', [PointageController::class, 'pointer']);
    
    // Routes communes Vigile et Admin
    Route::middleware('jwt.vigile.admin')->group(function () {
        Route::get('/', [PointageController::class, 'index']);
        Route::get('/historique', [PointageController::class, 'historique']);
    });

    // Routes spécifiques Vigile
    Route::middleware('jwt.verifie.vigile')->group(function () {
        Route::put('/{id}/valider', [PointageController::class, 'validerPointage']);
    });
    
    // Routes spécifiques Admin
    Route::middleware('jwt.admin')->group(function () {
        Route::post('/generer-absences', [PointageController::class, 'genererAbsences']);
        Route::put('/{id}', [PointageController::class, 'modifierPointage']);
        Route::get('/presences/filtrer', [PointageController::class, 'filtrerPresences']);
        Route::get('/presences/recuperer', [PointageController::class, 'recupererPresences']);
    });
});


//oubli mot de passe 
use App\Http\Controllers\MailSettingController;

Route::post('/forgot-password', [MailSettingController::class, 'sendPasswordResetLink']);
Route::post('/reset-password', [MailSettingController::class, 'resetPassword']); //tester 



use App\Http\Controllers\CongeController;

Route::middleware(['jwt.admin'])->group(function () {
    Route::prefix('conges')->group(function () {
        // Liste des congés
        Route::get('/', [CongeController::class, 'index']);       
        // Détails d'un congé
        Route::get('/{id}', [CongeController::class, 'show']);  
        // Liste des employés en congé
        Route::get('/en-cours', [CongeController::class, 'enConge']);
        // Créer un nouveau congé
        Route::post('/', [CongeController::class, 'store']);
        // Modifier un congé
        Route::put('/{id}', [CongeController::class, 'update']);
        // Supprimer un congé
        Route::delete('/{id}', [CongeController::class, 'destroy']);
        });
    });
