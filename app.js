require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/utilisateurs', require('./routes/utilisateurs'));
app.use('/annonces', require('./routes/annonces'));
app.use('/auth', require('./routes/auth')); // Nouvelle route pour l'authentification

// Route racine
app.get('/', (req, res) => {
  res.json({ 
    message: 'Bienvenue sur l\'API de Darie',
    version: '1.0.0',
    endpoints: {
      utilisateurs: '/utilisateurs',
      annonces: '/annonces',
      authentification: '/auth/login'
    }
  });
});

// Middleware 404
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route non trouvée.',
    availableRoutes: ['/', '/utilisateurs', '/annonces', '/auth/login']
  });
});

// Middleware global d'erreur
app.use((err, req, res, next) => {
  console.error('Erreur non capturée :', err.message);
  res.status(500).json({ error: 'Erreur serveur inattendue.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur le port ${PORT}`);
  console.log(`📡 API disponible sur http://localhost:${PORT}`);
});