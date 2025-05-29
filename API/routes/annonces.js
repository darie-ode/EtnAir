const express = require('express');
const router = express.Router();
const annonceController = require('../controllers/annonceController');

// GET /annonces - Récupérer toutes les annonces avec filtres optionnels
router.get('/', annonceController.getAnnonces);

// GET /annonces/:id - Récupérer une annonce par ID
router.get('/:id', annonceController.getAnnonceById);

// POST /annonces - Créer une nouvelle annonce
router.post('/', annonceController.addAnnonce);

// PUT /annonces/:id - Mettre à jour une annonce
router.put('/:id', annonceController.updateAnnonce);

// DELETE /annonces/:id - Supprimer une annonce
router.delete('/:id', annonceController.deleteAnnonce);

module.exports = router;