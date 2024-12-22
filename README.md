SunuPointage

Description

SunuPointage est un projet visant à améliorer le système de pointage des employés et des apprenants dans une structure de formation. Le système utilise des cartes RFID pour gérer les accès, enregistrer les présences, suivre les absences et retards, tout en fournissant une interface utilisateur intuitive pour les administrateurs, vigiles et utilisateurs.

Fonctionnalités Clés

Utilisateur Simple (Employé et Apprenant)

Utilisation d'une carte RFID pour :

Pointer leur présence.

Ouvrir la porte automatiquement (se referme après 10 secondes).

Indicateurs visuels et sonores pour confirmer ou refuser l'accès.

Vigile

Connexion via email et mot de passe.

Validation des pointages en vérifiant les informations affichées (photo, nom, prénom, matricule).

Ouverture et fermeture de la porte via l'interface.

Administrateur

Gestion des employés et apprenants :

Ajouter, modifier, supprimer et bloquer des utilisateurs.

Importer des utilisateurs via des fichiers CSV.

Attribution et gestion des cartes RFID.

Consultation et modification des pointages (en cas de congé, maladie, etc.).

Visualisation de l'historique des absences et retards par jour, semaine et mois.

Technologies Utilisées

Frontend : Angular

Backend : Laravel

Base de données : MongoDB (adaptable selon les besoins)

Matériel électronique :

Microcontrôleur (ex : PIC16F877A)

Lecteur RFID

Servomoteur pour contrôler l'ouverture de la porte

LEDs et buzzer pour feedback utilisateur

Outils de développement :

Figma pour les maquettes et prototypes

Trello pour la gestion agile

Prérequis

Node.js et npm installés pour le frontend.

PHP et Composer pour le backend.

Serveur MySQL ou MongoDB configuré.

Matériel RFID et équipement électronique connectés.

Installation

Frontend

cd pointage-frontend
npm install
ng serve

Backend

cd pointage-backend 
composer install
php artisan migrate
php artisan serve

Matériel

Connectez le microcontrôleur au lecteur RFID, aux LEDs, au buzzer et au servomoteur selon le schéma fourni.

Configurez les ports série pour communiquer avec le système backend.

Utilisation

Lancez le frontend et le backend.

Connectez le matériel au système.

Accédez à l'interface utilisateur pour gérer les utilisateurs et superviser les pointages.

Les utilisateurs peuvent pointer en utilisant leur carte RFID.

Fonctionnalités Avancées

Gestion des congés :

Désactivation automatique des cartes RFID pendant les congés.

Réactivation automatique à la fin des congés via un script planifié.

Historique détaillé des pointages avec visualisation graphique.

Livrables

Mindmap du projet.  lien: https://miro.com/welcomeonboard/UkcwUEtRSXdCWmlBcW0rSXkrby92U0hrSFBtV2J6em9nZUtsRzNjd0JaQjRTbjFDOWRWd1RRTGFkaXd1S0RMMGxCOVREZ2xkT1FVRGlZdEd5YVhSSFlrVDdzMzg0K3VJV2JhRUF6em4zYllxaXI2UzBHbklNR0FUdjhMMytqQlohZQ==?share_link_id=125439100865

Maquette et mockups de l'application. lien: https://www.figma.com/proto/THlzSsG5fw9LHwTyUFKLOl/Sunu-Pointage?node-id=10-18&t=7thdpKHWaPCqW4RZ-0&scaling=contain&content-scaling=fixed&page-id=0%3A1&starting-point-node-id=10%3A18&show-proto-sidebar=1

Circuit électronique correctement câblé.

Code source (frontend, backend, microcontrôleur) sur GitHub.

Documentation technique et utilisateur.

Présentation PowerPoint.

Auteurs

Mame Khady Laye Diaw ( makhadypro@gmail.com****************)

Fatou Bintou Sané ( bintousane69@gmail.com********)

Thierno Ngom (**tngom1010@gmail.com **)
