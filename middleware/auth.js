const express = require('express');
const router = express.Router();
const authController = require('../API/controllers/authController');

// POST /auth/login - Connexion utilisateur
router.post('/login', authController.login);

// POST /auth/register - Inscription utilisateur
router.post('/register', authController.register);

// POST /auth/logout - Déconnexion utilisateur
router.post('/logout', authController.logout);

module.exports = router;