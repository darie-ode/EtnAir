const pool = require('../config/db');
const bcrypt = require('bcrypt');

// Obtenir tous les utilisateurs
exports.getUtilisateurs = async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nom, email, photo_url, date_creation FROM utilisateur ORDER BY date_creation DESC');
    res.json({
      count: result.rows.length,
      utilisateurs: result.rows
    });
  } catch (err) {
    console.error('Erreur lors de la récupération des utilisateurs:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Obtenir un utilisateur par ID
exports.getUtilisateurById = async (req, res) => {
  const utilisateurId = Number(req.params.id);

  if (isNaN(utilisateurId)) {
    return res.status(400).json({ error: "L'ID fourni est invalide." });
  }

  try {
    const result = await pool.query(
      'SELECT id, nom, email, photo_url, date_creation FROM utilisateur WHERE id = $1',
      [utilisateurId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Ajouter un nouvel utilisateur
exports.addUtilisateur = async (req, res) => {
  const { nom, email, mot_de_passe, photo_url } = req.body;

  // Validation des champs requis
  if (!nom || !email || !mot_de_passe) {
    return res.status(400).json({ 
      error: 'Champs requis manquants.',
      required: ['nom', 'email', 'mot_de_passe']
    });
  }

  // Validation de l'email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Format d\'email invalide.' });
  }

  // Validation du mot de passe
  if (mot_de_passe.length < 6) {
    return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères.' });
  }

  try {
    // Vérifier si l'email existe déjà
    const emailCheck = await pool.query('SELECT id FROM utilisateur WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Cet email est déjà utilisé.' });
    }

    // Hacher le mot de passe
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(mot_de_passe, saltRounds);
    
    const result = await pool.query(
      'INSERT INTO utilisateur (nom, email, mot_de_passe, photo_url, date_creation) VALUES ($1, $2, $3, $4, NOW()) RETURNING id, nom, email, photo_url, date_creation',
      [nom, email, hashedPassword, photo_url || null]
    );

    res.status(201).json({
      message: 'Utilisateur créé avec succès.',
      utilisateur: result.rows[0]
    });
  } catch (err) {
    console.error('Erreur lors de la création de l\'utilisateur:', err.message);
    res.status(500).json({ error: 'Erreur lors de l\'ajout de l\'utilisateur.' });
  }
};

// Mettre à jour un utilisateur
exports.updateUtilisateur = async (req, res) => {
  const utilisateurId = Number(req.params.id);
  const { nom, email, photo_url } = req.body;

  if (isNaN(utilisateurId)) {
    return res.status(400).json({ error: "L'ID fourni est invalide." });
  }

  if (!nom || !email) {
    return res.status(400).json({ 
      error: 'Champs requis manquants.',
      required: ['nom', 'email']
    });
  }

  // Validation de l'email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Format d\'email invalide.' });
  }

  try {
    // Vérifier que l'utilisateur existe
    const userCheck = await pool.query('SELECT id FROM utilisateur WHERE id = $1', [utilisateurId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé.' });
    }

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    const emailCheck = await pool.query('SELECT id FROM utilisateur WHERE email = $1 AND id != $2', [email, utilisateurId]);
    if (emailCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Cet email est déjà utilisé par un autre utilisateur.' });
    }

    const result = await pool.query(
      'UPDATE utilisateur SET nom = $1, email = $2, photo_url = $3 WHERE id = $4 RETURNING id, nom, email, photo_url, date_creation',
      [nom, email, photo_url, utilisateurId]
    );

    res.json({
      message: 'Utilisateur mis à jour avec succès.',
      utilisateur: result.rows[0]
    });
  } catch (err) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', err.message);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// Supprimer un utilisateur
exports.deleteUtilisateur = async (req, res) => {
  const utilisateurId = Number(req.params.id);

  if (isNaN(utilisateurId)) {
    return res.status(400).json({ error: "L'ID fourni est invalide." });
  }

  try {
    const result = await pool.query('DELETE FROM utilisateur WHERE id = $1 RETURNING id, nom, email', [utilisateurId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé.' });
    }

    res.json({
      message: 'Utilisateur supprimé avec succès.',
      utilisateur: result.rows[0]
    });
  } catch (err) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', err.message);
    if (err.code === '23503') { // Violation de contrainte de clé étrangère
      res.status(409).json({ error: 'Impossible de supprimer cet utilisateur car il a des annonces associées.' });
    } else {
      res.status(500).json({ error: 'Erreur serveur.' });
    }
  }
};