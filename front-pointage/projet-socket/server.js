const { SerialPort } = require('serialport');
const axios = require('axios');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const port = 3000;

// Configuration d'axios pour l'API backend
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

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
  path: '/dev/ttyUSB0', // Chemin vers le port USB de l'Arduino
  baudRate: 9600,
});

// Points d'accès de l'API
const ENDPOINTS = {
  pointer: '/pointages/pointer',
  validerPointage: (cardId) => `pointages/cartes/${cardId}/valider`,
  verifyCard: '/utilisateurs/verify-card'
};

// Gestion des connexions Socket.IO
io.on('connection', (socket) => {
  console.log('Client connecté via Socket.IO');

  // Gestion de la déconnexion
  socket.on('disconnect', () => {
    console.log('Client déconnecté');
  });

  // Contrôle manuel de la porte
  socket.on('door-control', (command) => {
    if (command === 'OPEN' || command === 'CLOSE') {
      console.log(`Commande manuelle reçue: ${command}`);
      serialPort.write(`${command}\n`);
      socket.emit('door-status', { status: true, command: command });
    }
  });

  // Validation manuelle des pointages
  socket.on('validate-pointage', async (data) => {
    try {
      const response = await api.post(
        ENDPOINTS.validerPointage(data.cardId),
        {
          vigile_id: data.vigile_id,
          action: data.action
        }
      );
      socket.emit('pointage-validated', response.data);
    } catch (error) {
      socket.emit('pointage-error', {
        message: error.response?.data?.message || 'Erreur de validation'
      });
    }
  });
});

// Middleware de gestion des erreurs
const errorHandler = (error, req, res, next) => {
  console.error('Error:', error);
  res.status(error.response?.status || 500).json({
    status: false,
    message: error.message,
    data: error.response?.data || null
  });
};

// Route pour vérifier une carte
app.get('/verify-card', async (req, res, next) => {
  try {
    const response = await api.get(ENDPOINTS.verifyCard, {
      params: { cardId: req.query.cardId }
    });
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// Gestion des données reçues du lecteur RFID
serialPort.on('data', async (data) => {
  const cardId = data.toString().trim();
  console.log('Card ID reçu:', cardId);

  try {
    // 1. Vérification de la validité de la carte
    const verifyResponse = await api.get(ENDPOINTS.verifyCard, {
      params: { cardId }
    });

    if (!verifyResponse.data.status) {
      serialPort.write('invalid\n');
      io.emit('card-error', { cardId, message: 'Carte non valide' });
      return;
    }

    // 2. Enregistrement du pointage
    const pointageResponse = await api.post(ENDPOINTS.pointer, { cardId });

    if (pointageResponse.data.status) {
      serialPort.write('valid\n');
      io.emit('card-scanned', {
        cardId,
        utilisateur: pointageResponse.data.data.utilisateur,
        pointage: pointageResponse.data.data.pointage
      });

      // Gestion des pointages en attente
      if (pointageResponse.data.data.pointage.estEnAttente) {
        io.emit('pointage-en-attente', {
          cardId,
          pointage: pointageResponse.data.data.pointage
        });
      }
    } else {
      serialPort.write('invalid\n');
      io.emit('card-error', {
        cardId,
        message: pointageResponse.data.message
      });
    }
  } catch (error) {
    console.error('Erreur:', error.message);

    // Gestion des erreurs HTTP
    if (error.response) {
      const errorMessage = error.response.data?.message || 'Erreur système';

      // Gestion spéciale des erreurs 403 (carte non assignée/inactive)
      if (error.response.status === 403) {
        serialPort.write('invalid\n');
        io.emit('card-error', {
          cardId,
          message: errorMessage,
          code: 403
        });
      } else {
        serialPort.write('error\n');
        io.emit('card-error', { cardId, message: errorMessage });
      }
    } else {
      serialPort.write('error\n');
      io.emit('card-error', {
        cardId,
        message: 'Erreur de communication avec le serveur'
      });
    }
  }
});

// Application du middleware d'erreur
app.use(errorHandler);

// Route de test
app.get('/', (req, res) => {
  res.send('Serveur de gestion des pointages en fonctionnement');
});

// Démarrage du serveur
server.listen(port, () => {
  console.log(`Serveur en écoute sur le port ${port}`);
});
