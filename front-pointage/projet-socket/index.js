const { SerialPort } = require('serialport');
const axios = require('axios');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const port = 3001;

// Création du serveur HTTP et initialisation de Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:4200', // Permet les connexions depuis Angular
    methods: ['GET', 'POST'],
  },
});

// Configuration du port série avec gestion d'erreur
let serialPort;
try {
  serialPort = new SerialPort({
    path: '/dev/ttyUSB0', // Chemin du port
    baudRate: 9600,
  });

  serialPort.on('error', (err) => {
    console.log('Erreur SerialPort:', err.message);
    // Le serveur continue de fonctionner même sans le port série
  });

  console.log('Port série initialisé avec succès sur index.js');
} catch (error) {
  console.log('Impossible d\'initialiser le port série sur index.js:', error.message);
  // Créer un port série mock pour éviter les erreurs
  serialPort = {
    write: (data) => console.log('Mock SerialPort write:', data),
    on: (event, callback) => {
      console.log('Mock SerialPort event:', event);
      if (event === 'error') {
        // Ne rien faire pour les erreurs sur le mock
        return;
      }
      if (event === 'data') {
        // Simulation de données pour le développement si nécessaire
        // callback(Buffer.from('simulation-data'));
      }
    }
  };
}

// Adresse de l'API Laravel
const laravelAPI = 'http://localhost:8000/api/utilisateurs/card';

// Écoute des connexions client Socket.IO
io.on('connection', (socket) => {
  console.log('Un client est connecté via Socket.IO');

  socket.on('disconnect', () => {
    console.log('Un client s\'est déconnecté');
  });
});

// Écoute des données reçues de l'Arduino avec vérification du port série
if (serialPort.on) {
  serialPort.on('data', async (data) => {
    const uid = data.toString().trim();
    console.log('UID reçu de l\'Arduino:', uid);

    try {
      const response = await axios.post(laravelAPI, { cardId: uid });
      console.log('Réponse de l\'API Laravel:', response.data);

      if (response.data.status) {
        try {
          serialPort.write('valid\n'); // Réponse pour carte valide
        } catch (writeError) {
          console.log('Erreur d\'écriture sur le port série:', writeError.message);
        }
        io.emit('card-scanned', uid); // Émet l'UID aux clients Angular
      } else {
        try {
          serialPort.write('invalid\n'); // Réponse pour carte invalide
        } catch (writeError) {
          console.log('Erreur d\'écriture sur le port série:', writeError.message);
        }
        io.emit('card-error', { uid, message: response.data.message || 'Carte invalide' });
      }
    } catch (error) {
      console.error('Erreur API Laravel:', error.response?.data || error.message);

      // Gestion plus détaillée des erreurs
      let errorMessage = 'Erreur lors du traitement';

      if (error.response) {
        // Si nous avons une réponse d'erreur de l'API
        switch (error.response.status) {
          case 401:
            errorMessage = error.response.data.message || 'Carte non autorisée';
            break;
          case 403:
            errorMessage = error.response.data.message || 'Carte non assignée';
            break;
          case 404:
            errorMessage = error.response.data.message || 'Carte non trouvée';
            break;
          default:
            errorMessage = error.response.data.message || 'Erreur serveur';
        }
      }

      try {
        serialPort.write('invalid\n');
      } catch (writeError) {
        console.log('Erreur d\'écriture sur le port série:', writeError.message);
      }

      io.emit('card-error', {
        uid,
        message: errorMessage
      });
    }
  });
}

// Serveur Express simple pour vérifier le fonctionnement
app.get('/', (req, res) => {
  res.send('Serveur Node.js en fonctionnement');
});

// Démarrage du serveur HTTP
server.listen(port, () => {
  console.log(`Serveur en écoute sur le port ${port}`);
});
