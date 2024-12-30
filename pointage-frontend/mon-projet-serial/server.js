const { SerialPort } = require('serialport');
const axios = require('axios');
const express = require('express');
const app = express();
const port = 3000;

// Configuration du port série
const serialPort = new SerialPort({
  path: '/dev/ttyUSB0', // Chemin du port
  baudRate: 9600
});

// Adresse de l'API Laravel
const laravelAPI = 'http://localhost:8000/api/pointages/pointer';

// Écoute des données reçues de l'Arduino
serialPort.on('data', async function (data) {
  const uid = data.toString().trim(); // Nettoyer l'UID reçu
  console.log('UID reçu de l\'Arduino:', uid);

  try {
    // Requête à l'API Laravel
    const response = await axios.post(laravelAPI, {
      cardId: uid, // Envoi de l'UID au backend Laravel
    });

    console.log('Réponse de l\'API Laravel:', response.data);

    // Répondre à l'Arduino en fonction de la validation
    if (response.data.status) {
      serialPort.write('valid\n'); // Réponse pour carte valide
    } else {
      serialPort.write('invalid\n'); // Réponse pour carte invalide
    }
  } catch (error) {
    // Gestion des erreurs de réponse
    if (error.response && error.response.status === 403) {
      console.log('Accès refusé: Carte non reconnue ou inactive');
      serialPort.write('invalid\n'); // Réponse pour carte non attribuée ou refusée
    } else {
      console.error('Erreur lors de la communication avec l\'API Laravel:', error.message);
      serialPort.write('error\n'); // Réponse pour erreur serveur ou autre
    }
  }
});

// Démarrage d'un serveur Express simple
app.get('/', (req, res) => {
  res.send('Serveur Node.js en fonctionnement');
});

// Lancer le serveur Express
app.listen(port, () => {
  console.log(`Serveur en écoute sur le port ${port}`);
});
