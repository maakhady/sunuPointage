// Dépendances nécessaires
const { SerialPort } = require('serialport');
const axios = require('axios');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// Configuration de l'application Express
const app = express();
const port = 3000;

// État du mode d'assignation
let assignmentMode = {
  active: false,
  userId: null
};

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
    credentials: true  // Ajoutez cette ligne

  },
});

// Configuration du port série Arduino
const serialPort = new SerialPort({
  path: '/dev/ttyUSB0',
  baudRate: 9600,
});

// Points d'accès de l'API
const ENDPOINTS = {
  pointer: '/pointages/pointer',
  validerPointage: (cardId) => `pointages/cartes/${cardId}/valider`,
  verifyCard: '/utilisateurs/verify-card',
  assignCard: (userId) => `/utilisateurs/${userId}/assign-card`
};

// Gestion des connexions Socket.IO
io.on('connection', (socket) => {
  console.log('Client connecté via Socket.IO');

  socket.on('disconnect', () => {
    console.log('Client déconnecté');
  });

  // Gestion du mode d'assignation
  socket.on('start-assignment-mode', (userId) => {
    assignmentMode.active = true;
    assignmentMode.userId = userId;
    console.log('Mode assignation activé pour userId:', userId);
  });

  socket.on('end-assignment-mode', () => {
    assignmentMode.active = false;
    assignmentMode.userId = null;
    console.log('Mode assignation désactivé');
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

  // Assignation de carte via Socket.IO
  socket.on('assign-card', async (data) => {
    try {
      const response = await api.post(
        ENDPOINTS.assignCard(data.userId),
        { cardId: data.cardId }
      );

      socket.emit('card-assigned', {
        status: true,
        message: 'Carte assignée avec succès',
        data: response.data
      });

      io.emit('card-assignment-update', {
        userId: data.userId,
        cardId: data.cardId,
        timestamp: new Date()
      });
    } catch (error) {
      socket.emit('card-assignment-error', {
        status: false,
        message: error.response?.data?.message || 'Erreur lors de l\'assignation de la carte',
        error: error.response?.data
      });
    }
  });

  // Réception d'une carte RFID
  socket.on('rfid-scan', async (cardId) => {
    if (assignmentMode.active) {
      // En mode assignation, émettre directement l'ID de la carte
      socket.emit('card-scanned', { cardId });
      return;
    }

    // Mode normal (pointage)
    try {
      const verifyResponse = await api.get(ENDPOINTS.verifyCard, {
        params: { cardId }
      });

      if (!verifyResponse.data.status) {
        socket.emit('card-error', { cardId, message: 'Carte non valide' });
        return;
      }

      const pointageResponse = await api.post(ENDPOINTS.pointer, { cardId });

      if (pointageResponse.data.status) {
        socket.emit('card-scanned', {
          cardId,
          utilisateur: pointageResponse.data.data.utilisateur,
          pointage: pointageResponse.data.data.pointage
        });

        if (pointageResponse.data.data.pointage.estEnAttente) {
          socket.emit('pointage-en-attente', {
            cardId,
            pointage: pointageResponse.data.data.pointage
          });
        }
      } else {
        socket.emit('card-error', {
          cardId,
          message: pointageResponse.data.message
        });
      }
    } catch (error) {
      socket.emit('card-error', {
        cardId,
        message: error.response?.data?.message || 'Erreur système'
      });
    }
  });
});

// Routes Express

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

// Route pour assigner une carte
app.post('/utilisateurs/:id/assign-card', async (req, res, next) => {
  try {
    const response = await api.post(
      ENDPOINTS.assignCard(req.params.id),
      { cardId: req.body.cardId }
    );

    io.emit('card-assignment-update', {
      userId: req.params.id,
      cardId: req.body.cardId,
      timestamp: new Date()
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

  // Vérifier si nous sommes en mode assignation
  if (assignmentMode.active && assignmentMode.userId) {
    try {
      // Tentative d'assignation directe sans vérification
      const response = await api.post(
        ENDPOINTS.assignCard(assignmentMode.userId),
        { cardId }
      );

      serialPort.write('valid\n');
      io.emit('card-scanned', { cardId });
      io.emit('card-assigned', {
        status: true,
        message: 'Carte assignée avec succès',
        data: response.data
      });

      // Réinitialiser le mode assignation
      assignmentMode.active = false;
      assignmentMode.userId = null;

    } catch (error) {
      serialPort.write('error\n');
      io.emit('card-assignment-error', {
        status: false,
        message: error.response?.data?.message || 'Erreur lors de l\'assignation de la carte',
        error: error.response?.data
      });
    }
    return;
  }

  // Mode normal (pointage)
  try {
    const verifyResponse = await api.get(ENDPOINTS.verifyCard, {
      params: { cardId }
    });

    if (!verifyResponse.data.status) {
      serialPort.write('invalid\n');
      io.emit('card-error', { cardId, message: 'Carte non valide' });
      return;
    }

    const pointageResponse = await api.post(ENDPOINTS.pointer, { cardId });

    if (pointageResponse.data.status) {
      serialPort.write('valid\n');
      io.emit('card-scanned', {
        cardId,
        utilisateur: pointageResponse.data.data.utilisateur,
        pointage: pointageResponse.data.data.pointage
      });

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
    if (error.response) {
      const errorMessage = error.response.data?.message || 'Erreur système';
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

// Middleware de gestion des erreurs
const errorHandler = (error, req, res, next) => {
  console.error('Error:', error);
  res.status(error.response?.status || 500).json({
    status: false,
    message: error.message,
    data: error.response?.data || null
  });
};

app.use(errorHandler);

// Route de test
app.get('/', (req, res) => {
  res.send('Serveur de gestion des pointages en fonctionnement');
});

// Démarrage du serveur
server.listen(port, () => {
  console.log(`Serveur en écoute sur le port ${port}`);
});
