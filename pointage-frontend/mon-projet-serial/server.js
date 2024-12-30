const { SerialPort } = require('serialport'); // Utilise la déstructuration
const axios = require('axios'); // Pour les requêtes HTTP vers Laravel
const express = require('express');
const app = express();
const port = 3000;

// Configuration du port série
const serialPort = new SerialPort({
  path: '/dev/ttyUSB0', // Chemin du port
  baudRate: 9600
});

// Adresse de votre API Laravel
const laravelAPI = 'http://localhost:8000/api/pointages/pointer';

// Cette fonction écoute les données du port série
serialPort.on('data', async function(data) {
  const uid = data.toString().trim(); // Enlever les espaces inutiles autour de l'UID
  console.log('UID reçu de l\'Arduino:', uid);

  try {
    // Envoyer une requête POST à l'API Laravel avec l'UID
    const response = await axios.post(laravelAPI, {
      cardId: uid // UID envoyé au backend Laravel
    });

    console.log('Réponse de l\'API Laravel:', response.data);

    // Réponse envoyée à l'Arduino en fonction de l'état
    if (response.data.status) {
      serialPort.write('valid\n'); // Réponse pour accès validé
    } else {
      serialPort.write('invalid\n'); // Réponse pour accès refusé
    }
  } catch (error) {
    console.error('Erreur lors de la communication avec l\'API Laravel:', error.message);
    serialPort.write('error\n'); // Réponse pour erreur serveur
  }
});

// Démarre un serveur Express simple
app.get('/', (req, res) => {
  res.send('Serveur Node.js en fonctionnement');
});

// Démarrage du serveur Express
app.listen(port, () => {
  console.log(`Serveur en écoute sur le port ${port}`);
});
