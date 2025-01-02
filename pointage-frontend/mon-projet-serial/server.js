const { SerialPort } = require('serialport');
const axios = require('axios');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const port = 3000;

// Création du serveur HTTP et initialisation de Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:4200', // Permet les connexions depuis Angular
    methods: ['GET', 'POST'],
  },
});

// Configuration du port série
const serialPort = new SerialPort({
  path: '/dev/ttyUSB0', // Chemin du port
  baudRate: 9600,
});

// Adresse de l'API Laravel
const laravelAPI = 'http://localhost:8000/api/pointages/pointer';

// Écoute des connexions client Socket.IO
io.on('connection', (socket) => {
  console.log('Un client est connecté via Socket.IO');

  socket.on('disconnect', () => {
    console.log('Un client s\'est déconnecté');
  });
});

// Écoute des données reçues de l'Arduino
serialPort.on('data', async (data) => {
  const uid = data.toString().trim();
  console.log('UID reçu de l\'Arduino:', uid);

  try {
    const response = await axios.post(laravelAPI, { cardId: uid });
    console.log('Réponse de l\'API Laravel:', response.data);

    if (response.data.status) {
      serialPort.write('valid\n'); // Réponse pour carte valide
      io.emit('card-scanned', uid); // Émet l'UID aux clients Angular
    } else {
      serialPort.write('invalid\n'); // Réponse pour carte invalide
      io.emit('card-error', { uid, message: 'Carte invalide' });
    }
  } catch (error) {
    console.error('Erreur API Laravel:', error.message);
    serialPort.write('error\n');
    io.emit('card-error', { uid, message: 'Erreur lors du traitement' });
  }
});

// Serveur Express simple pour vérifier le fonctionnement
app.get('/', (req, res) => {
  res.send('Serveur Node.js en fonctionnement');
});

// Démarrage du serveur HTTP
server.listen(port, () => {
  console.log(`Serveur en écoute sur le port ${port}`);
});









// const { SerialPort } = require('serialport');
// const axios = require('axios');
// const express = require('express');
// const cors = require('cors'); // Import de CORS

// const app = express();
// const port = 3000;

// // Middleware CORS pour autoriser les connexions venant d'Angular
// app.use(cors({
//   origin: 'http://localhost:4200', // Autorise uniquement Angular à se connecter
//   methods: ['GET', 'POST'],
//   allowedHeaders: ['Content-Type']
// }));

// // Configuration du port série
// const serialPort = new SerialPort({
//   path: '/dev/ttyUSB0', // Chemin du port (vérifier sur votre machine)
//   baudRate: 9600
// });

// // Adresse de l'API Laravel
// const laravelAPI = 'http://localhost:8000/api/pointages/pointer';

// // Écoute des données reçues de l'Arduino
// serialPort.on('data', async function (data) {
//   const uid = data.toString().trim(); // Nettoyer l'UID reçu
//   console.log('UID reçu de l\'Arduino:', uid);

//   try {
//     // Requête à l'API Laravel
//     const response = await axios.post(laravelAPI, {
//       cardId: uid, // Envoi de l'UID au backend Laravel
//     });

//     console.log('Réponse de l\'API Laravel:', response.data);

//     // Répondre à l'Arduino en fonction de la validation
//     if (response.data.status) {
//       serialPort.write('valid\n'); // Réponse pour carte valide
//     } else {
//       serialPort.write('invalid\n'); // Réponse pour carte invalide
//     }
//   } catch (error) {
//     // Gestion des erreurs de réponse
//     if (error.response && error.response.status === 403) {
//       console.log('Accès refusé: Carte non reconnue ou inactive');
//       serialPort.write('invalid\n'); // Réponse pour carte non attribuée ou refusée
//     } else {
//       console.error('Erreur lors de la communication avec l\'API Laravel:', error.message);
//       serialPort.write('error\n'); // Réponse pour erreur serveur ou autre
//     }
//   }
// });

// // Démarrage d'un serveur Express simple
// app.get('/', (req, res) => {
//   res.send('Serveur Node.js en fonctionnement');
// });

// // Lancer le serveur Express
// app.listen(port, () => {
//   console.log(`Serveur en écoute sur le port ${port}`);
// });
