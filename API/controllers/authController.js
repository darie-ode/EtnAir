require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'secret123';
const JWT_EXPIRATION = '1h'; // ou '7d'

// 🔐 Enregistrement utilisateur
exports.register = async (req, res) => {
  const { nom, email, mot_de_passe, photo_url } = req.body;

  if (!nom || !email || !mot_de_passe || !photo_url) {
    return res.status(400).json({ error: 'Tous les champs sont requis.' });
  }

  try {
    // Vérifie si l’email existe déjà
    const existing = await pool.query('SELECT * FROM utilisateur WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email déjà utilisé.' });
    }

    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

    const result = await pool.query(
      `INSERT INTO utilisateur (nom, email, mot_de_passe, photo_url) VALUES ($1, $2, $3, $4) RETURNING *`,
      [nom, email, hashedPassword, photo_url]
    );

    res.status(201).json({ message: 'Utilisateur enregistré.', utilisateur: result.rows[0] });
  } catch (err) {
    console.error('Erreur lors de l’inscription :', err.message);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// 🔑 Connexion utilisateur
exports.login = async (req, res) => {
  const { email, mot_de_passe } = req.body;

  if (!email || !mot_de_passe) {
    return res.status(400).json({ error: 'Email et mot de passe requis.' });
  }

  try {
    const result = await pool.query('SELECT * FROM utilisateur WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou mot de passe invalide.' });
    }

    const utilisateur = result.rows[0];
    const isMatch = await bcrypt.compare(mot_de_passe, utilisateur.mot_de_passe);

    if (!isMatch) {
      return res.status(401).json({ error: 'Email ou mot de passe invalide.' });
    }

    const token = jwt.sign(
      { id: utilisateur.id, email: utilisateur.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    res.json({ message: 'Connexion réussie.', token });
  } catch (err) {
    console.error('Erreur lors de la connexion :', err.message);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// 🔓 Déconnexion (symbolique avec JWT)
exports.logout = async (req, res) => {
  // Comme JWT est stateless, on ne peut pas "révoquer" un token sans stockage externe.
  res.json({ message: 'Déconnexion réussie (côté client).' });
};
