CREATE DATABASE IF NOT EXISTS hotel_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hotel_db;

CREATE TABLE IF NOT EXISTS clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE,
  telephone VARCHAR(30),
  adresse VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chambres (
  id INT AUTO_INCREMENT PRIMARY KEY,
  numero VARCHAR(10) NOT NULL UNIQUE,
  type ENUM('simple','double','suite') NOT NULL,
  capacite INT NOT NULL,
  prix_nuit DECIMAL(10,2) NOT NULL,
  statut ENUM('disponible','maintenance') DEFAULT 'disponible'
);

CREATE TABLE IF NOT EXISTS reservations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  chambre_id INT NOT NULL,
  date_arrivee DATE NOT NULL,
  date_depart DATE NOT NULL,
  nb_personnes INT DEFAULT 1,
  statut ENUM('confirmee','en_cours','terminee','annulee') DEFAULT 'confirmee',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (chambre_id) REFERENCES chambres(id),
  CHECK (date_depart > date_arrivee)
);

CREATE TABLE IF NOT EXISTS factures (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reservation_id INT NOT NULL UNIQUE,
  montant_total DECIMAL(10,2) NOT NULL,
  date_emission DATE NOT NULL,
  statut_paiement ENUM('en_attente','payee') DEFAULT 'en_attente',
  FOREIGN KEY (reservation_id) REFERENCES reservations(id)
);

CREATE TABLE IF NOT EXISTS utilisateurs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(150) NOT NULL UNIQUE,
  mot_de_passe_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','receptionniste') DEFAULT 'receptionniste'
);
