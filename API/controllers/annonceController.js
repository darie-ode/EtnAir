const pool = require('../config/db');

// Obtenir toutes les annonces avec filtres optionnels
exports.getAnnonces = async (req, res) => {
  const { prix, ville, nombre_chambres, disponible, utilisateur_id } = req.query;

  try {
    let query = 'SELECT * FROM annonce';
    const conditions = [];
    const values = [];

    if (prix) {
      const prixNumber = Number(prix);
      if (!isNaN(prixNumber)) {
        values.push(prixNumber);
        conditions.push(`prix <= $${values.length}`);
      }
    }

    if (ville) {
      values.push(ville);
      conditions.push(`ville ILIKE $${values.length}`); // Recherche insensible à la casse
    }

    if (nombre_chambres) {
      const nbChambresNumber = Number(nombre_chambres);
      if (!isNaN(nbChambresNumber)) {
        values.push(nbChambresNumber);
        conditions.push(`nombre_chambres = $${values.length}`);
      }
    }

    if (disponible !== undefined) {
      values.push(disponible === 'true');
      conditions.push(`disponible = $${values.length}`);
    }

    if (utilisateur_id) {
      const userIdNumber = Number(utilisateur_id);
      if (!isNaN(userIdNumber)) {
        values.push(userIdNumber);
        conditions.push(`utilisateur_id = $${values.length}`);
      }
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY date_publication DESC';

    const result = await pool.query(query, values);
    res.json({
      count: result.rows.length,
      annonces: result.rows
    });
  } catch (err) {
    console.error('Erreur lors de la récupération des annonces :', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Obtenir une annonce par ID
exports.getAnnonceById = async (req, res) => {
  const annonceId = Number(req.params.id);

  if (isNaN(annonceId)) {
    return res.status(400).json({ error: "L'ID fourni est invalide." });
  }

  try {
    const result = await pool.query(
      `SELECT a.*, u.nom as nom_utilisateur, u.email as email_utilisateur 
       FROM annonce a 
       JOIN utilisateur u ON a.utilisateur_id = u.id 
       WHERE a.id = $1`,
      [annonceId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Annonce non trouvée." });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Erreur lors de la récupération de l'annonce :", err.message);
    res.status(500).json({ error: "Erreur serveur." });
  }
};

// Créer une nouvelle annonce
exports.addAnnonce = async (req, res) => {
  const {
    titre, description, prix, date_publication, nombre_chambres,
    ville, disponible, date_disponible, utilisateur_id, photo_url
  } = req.body;

  // Validation des champs requis
  if (
    !titre || !description || prix === undefined || !date_publication ||
    nombre_chambres === undefined || !ville || disponible === undefined ||
    !date_disponible || utilisateur_id === undefined
  ) {
    return res.status(400).json({ 
      error: 'Champs requis manquants.',
      required: ['titre', 'description', 'prix', 'date_publication', 'nombre_chambres', 'ville', 'disponible', 'date_disponible', 'utilisateur_id']
    });
  }

  // Validation des types
  if (isNaN(Number(prix)) || isNaN(Number(nombre_chambres)) || isNaN(Number(utilisateur_id))) {
    return res.status(400).json({ error: 'Prix, nombre de chambres et ID utilisateur doivent être des nombres.' });
  }

  try {
    // Vérifier que l'utilisateur existe
    const userCheck = await pool.query('SELECT id FROM utilisateur WHERE id = $1', [utilisateur_id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé.' });
    }

    const result = await pool.query(
      `INSERT INTO annonce 
      (titre, description, prix, date_publication, nombre_chambres, ville, disponible, date_disponible, utilisateur_id, photo_url) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING *`,
      [
        titre, description, Number(prix), date_publication,
        Number(nombre_chambres), ville, disponible === true || disponible === 'true',
        date_disponible, Number(utilisateur_id), photo_url || null
      ]
    );

    res.status(201).json({
      message: 'Annonce créée avec succès.',
      annonce: result.rows[0]
    });
  } catch (err) {
    console.error('Erreur lors de l\'ajout de l\'annonce :', err.message);
    res.status(500).json({ error: 'Erreur lors de l\'ajout de l\'annonce.' });
  }
};

// Mettre à jour une annonce
exports.updateAnnonce = async (req, res) => {
  const annonceId = Number(req.params.id);
  const {
    titre, description, prix, date_publication, nombre_chambres,
    ville, disponible, date_disponible, utilisateur_id, photo_url
  } = req.body;

  if (isNaN(annonceId)) {
    return res.status(400).json({ error: "L'ID fourni est invalide." });
  }

  // Validation des champs requis
  if (
    !titre || !description || prix === undefined || !date_publication ||
    nombre_chambres === undefined || !ville || disponible === undefined ||
    !date_disponible || utilisateur_id === undefined
  ) {
    return res.status(400).json({ 
      error: 'Tous les champs sont requis.',
      required: ['titre', 'description', 'prix', 'date_publication', 'nombre_chambres', 'ville', 'disponible', 'date_disponible', 'utilisateur_id']
    });
  }

  try {
    // Vérifier que l'annonce existe
    const annonceCheck = await pool.query('SELECT id FROM annonce WHERE id = $1', [annonceId]);
    if (annonceCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Annonce non trouvée.' });
    }

    const result = await pool.query(
      `UPDATE annonce SET
        titre = $1,
        description = $2,
        prix = $3,
        date_publication = $4,
        nombre_chambres = $5,
        ville = $6,
        disponible = $7,
        date_disponible = $8,
        utilisateur_id = $9,
        photo_url = $10
      WHERE id = $11
      RETURNING *`,
      [
        titre, description, Number(prix), date_publication, Number(nombre_chambres),
        ville, disponible === true || disponible === 'true',
        date_disponible, Number(utilisateur_id), photo_url, annonceId
      ]
    );

    res.json({ 
      message: 'Annonce mise à jour avec succès.', 
      annonce: result.rows[0] 
    });
  } catch (err) {
    console.error('Erreur lors de la mise à jour de l\'annonce :', err.message);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// Supprimer une annonce
exports.deleteAnnonce = async (req, res) => {
  const annonceId = Number(req.params.id);

  if (isNaN(annonceId)) {
    return res.status(400).json({ error: "L'ID fourni est invalide." });
  }

  try {
    const result = await pool.query('DELETE FROM annonce WHERE id = $1 RETURNING *', [annonceId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Annonce non trouvée.' });
    }

    res.json({ 
      message: 'Annonce supprimée avec succès.',
      annonce: result.rows[0]
    });
  } catch (err) {
    console.error('Erreur lors de la suppression de l\'annonce :', err.message);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};