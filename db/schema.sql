-- Table utilisateur
CREATE TABLE utilisateur (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100),
    email VARCHAR(255) UNIQUE,
    mot_de_passe VARCHAR(255),
    photo_url VARCHAR(255),
    date_creation TIMESTAMP DEFAULT NOW()
);

-- Table annonce
CREATE TABLE annonce (
    id SERIAL PRIMARY KEY,
    titre VARCHAR(255),
    description TEXT,
    prix DECIMAL(10, 2),
    date_publication TIMESTAMP,
    nombre_chambres INTEGER,
    ville VARCHAR(100),
    disponible BOOLEAN,
    date_disponible TIMESTAMP,
    utilisateur_id INTEGER REFERENCES utilisateur (id),
    photo_url VARCHAR(255)
);

-- Table message
CREATE TABLE message (
    id SERIAL PRIMARY KEY,
    expediteur_id INTEGER REFERENCES utilisateur (id),
    destinataire_id INTEGER REFERENCES utilisateur (id),
    contenu TEXT,
    date_envoi TIMESTAMP
);

-- Table reservation
CREATE TABLE reservation (
    id SERIAL PRIMARY KEY,
    utilisateur_id INTEGER REFERENCES utilisateur (id),
    annonce_id INTEGER REFERENCES annonce (id),
    date_reservation TIMESTAMP,
    statut VARCHAR(50)
);

-- Table review
CREATE TABLE review (
    id SERIAL PRIMARY KEY,
    utilisateur_id INTEGER REFERENCES utilisateur (id),
    annonce_id INTEGER REFERENCES annonce (id),
    note INTEGER,
    commentaire TEXT
);