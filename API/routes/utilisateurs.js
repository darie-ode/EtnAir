const express = require('express');
const router = express.Router();
const utilisateurController = require('../controllers/utilisateurController');

// GET /utilisateurs - Récupérer tous les utilisateurs
router.get('/', utilisateurController.getUtilisateurs);

// GET /utilisateurs/:id - Récupérer un utilisateur par ID
router.get('/:id', utilisateurController.getUtilisateurById);

// POST /utilisateurs - Créer un nouvel utilisateur
router.post('/', utilisateurController.addUtilisateur);

// PUT /utilisateurs/:id - Mettre à jour un utilisateur
router.put('/:id', utilisateurController.updateUtilisateur);

// DELETE /utilisateurs/:id - Supprimer un utilisateur
router.delete('/:id', utilisateurController.deleteUtilisateur);

module.exports = router;