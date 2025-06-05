require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require('../config/db'); // Utiliser la config centralisée

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'ton_secret_par_defaut';

// Route POST /login
router.post('/login', async (req, res) => {
    const { email, mot_de_passe } = req.body;

    if (!email || !mot_de_passe) {
        return res.status(400).json({ error: 'Email et mot de passe requis.' });
    }

    try {
        const result = await pool.query(
            'SELECT * FROM utilisateur WHERE email = $1',
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

        const token = jwt.sign({ id: utilisateur.id }, JWT_SECRET, { expiresIn: '1h' });

        res.json({ token, utilisateur });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;