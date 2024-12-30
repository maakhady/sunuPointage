<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Utilisateur;
use App\Libraries\PhpSerial; // Importer la bibliothèque PHP-Serial

class ListenToSerial extends Command
{
    protected $signature = 'serial:listen';
    protected $description = 'Écouter les UID envoyés via le port série par le matériel Arduino';

    public function __construct()
    {
        parent::__construct();
    }

    public function handle()
{
    $serial = new PhpSerial();

    $this->info("Tentative de configuration du port série...");
    if (!$serial->deviceSet("/dev/ttyUSB0")) {
        $this->error("Impossible de configurer le port série. Vérifiez le port et les connexions.");
        return;
    }

    $this->info("Configuration réussie. Configuration des paramètres...");
    $serial->confBaudRate(9600);
    $serial->confParity("none");
    $serial->confCharacterLength(8);
    $serial->confStopBits(1);
    $serial->confFlowControl("none");

    $this->info("Tentative d'ouverture du port série...");
    if (!$serial->deviceOpen()) {
        $this->error("Impossible d'ouvrir le port série.");
        return;
    }

    $this->info("Écoute du port série démarrée...");
    while (true) {
        $data = $serial->readPort();
        $data = trim($data);
        if (!empty($data)) {
            $this->info("UID reçu : $data");
            $response = $this->pointerLogic($data);
            $serial->sendMessage($response . "\n");
            $this->info("Réponse envoyée : $response");
        }
        usleep(100000); // Pause de 0.1 seconde
    }

    $serial->deviceClose();
}


    private function pointerLogic($cardId)
    {
        $utilisateur = Utilisateur::where('cardId', $cardId)->where('statut', 'actif')->first();
        if ($utilisateur) {
            $this->info("Utilisateur trouvé : {$utilisateur->nom} {$utilisateur->prenom}");
            return "valid"; // Réponse pour l'Arduino
        } else {
            $this->warn("UID non reconnu ou utilisateur inactif.");
            return "invalid"; // Réponse pour l'Arduino
        }
    }
}