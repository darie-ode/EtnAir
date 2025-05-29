const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const JWT_SECRET = process.env.JWT_SECRET || 'votre_secret_jwt_super_securise';

// Connexion utilisateur
exports.login = async (req, res) => {
  const { email, mot_de_passe } = req.body;

  if (!email || !mot_de_passe) {
    return res.status(400).json({ 
      error: 'Email et mot de passe requis.',
      required: ['email', 'mot_de_passe']
    });
  }

  try {
    const result = await pool.query(
      'SELECT id, nom, email, mot_de_passe FROM utilisateur WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Identifiants invalides.' });
    }

    const utilisateur = result.rows[0];

    // Vérification du mot de passe haché
    const motDePasseValide = await bcrypt.compare(mot_de_passe, utilisateur.mot_de_passe);
    if (!motDePasseValide) {
      return res.status(401).json({ error: 'Identifiants invalides.' });
    }

    // Création du token JWT
    const token = jwt.sign(
      { 
        id: utilisateur.id, 
        email: utilisateur.email,
        nom: utilisateur.nom 
      }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );

    // Ne pas renvoyer le mot de passe
    const { mot_de_passe: _, ...utilisateurSafe } = utilisateur;

    res.json({ 
      message: 'Connexion réussie.',
      token, 
      utilisateur: utilisateurSafe,
      expiresIn: '24h'
    });
  } catch (err) {
    console.error('Erreur lors de la connexion:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Inscription utilisateur
exports.register = async (req, res) => {
  const { nom, email, mot_de_passe, photo_url } = req.body;

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

    const utilisateur = result.rows[0];

    // Création du token JWT
    const token = jwt.sign(
      { 
        id: utilisateur.id, 
        email: utilisateur.email,
        nom: utilisateur.nom 
      }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Inscription réussie.',
      token,
      utilisateur,
      expiresIn: '24h'
    });
  } catch (err) {
    console.error('Erreur lors de l\'inscription:', err.message);
    res.status(500).json({ error: 'Erreur lors de l\'inscription.' });
  }
};

// Déconnexion utilisateur (côté client principalement)
exports.logout = async (req, res) => {
  // Dans un vrai système, on pourrait blacklister le token
  // Pour l'instant, on renvoie juste un message de succès
  res.json({ message: 'Déconnexion réussie. Supprimez le token côté client.' });
};