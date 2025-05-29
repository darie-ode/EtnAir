require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
 const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
});

const JWT_SECRET = process.env.JWT_SECRET || 'ton_secret_par_defaut';

// Route POST /login
app.post('/login', async (req, res) => {
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