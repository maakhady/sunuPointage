const { SerialPort } = require('serialport');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// Configuration de l'application Express
const app = express();
const port = 3000; 

// Configuration des middlewares
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:4200',
  methods: ['GET', 'POST']
}));

// Création du serveur HTTP et Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:4200',
    methods: ['GET', 'POST'],
  },
});

// Configuration du port série Arduino
const serialPort = new SerialPort({
  path: '/dev/ttyUSB0',
  baudRate: 9600,
});

// Gestion des connexions Socket.IO
io.on('connection', (socket) => {
  console.log('Client connecté via Socket.IO');

  socket.on('disconnect', () => {
    console.log('Client déconnecté');
  });

  // Réception d'une carte RFID depuis le client
  socket.on('rfid-scan', (cardId) => {
    console.log('Card ID reçu via Socket.IO:', cardId);
    io.emit('card-scanned', { cardId });

    // Informer les clients que le lecteur est prêt pour une nouvelle lecture
    io.emit('reader-ready', { status: true });
  });
});

// Gestion des données reçues du lecteur RFID
serialPort.on('data', (data) => {
  const cardId = data.toString().trim();
  console.log('Card ID reçu:', cardId);

  // Émettre l'ID de la carte aux clients connectés
  io.emit('card-scanned', { cardId });

  // Réinitialisation après chaque lecture
  resetCardReader();
});

// Gestion des erreurs du port série
serialPort.on('error', (err) => {
  console.error('Erreur du port série:', err.message);
});

// Fonction pour réinitialiser le lecteur de carte
function resetCardReader() {
  console.log('Réinitialisation du lecteur de carte...');
  
  // Si nécessaire, envoyez une commande spécifique au lecteur série
  serialPort.write('RESET\n', (err) => {
    if (err) {
      console.error('Erreur lors de la réinitialisation:', err.message);
    } else {
      console.log('Lecteur prêt pour une nouvelle lecture.');
    }
  });
}

// Gestion des erreurs Socket.IO
io.on('error', (err) => {
  console.error('Erreur Socket.IO:', err.message);
});

// Route de test
app.get('/', (req, res) => {
  res.send('Serveur de gestion des pointages en fonctionnement');
});

// Démarrage du serveur
server.listen(port, () => {
  console.log(`Serveur en écoute sur le port ${port}`);
});
