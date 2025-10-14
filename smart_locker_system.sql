-- MySQL dump 10.13  Distrib 9.4.0, for macos15 (arm64)
--
-- Host: localhost    Database: smart_locker_system
-- ------------------------------------------------------
-- Server version  9.4.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- ------------------------------------------------------
-- Table structure for table `aktion`
-- ------------------------------------------------------

DROP TABLE IF EXISTS `aktion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `aktion` (
  `id` int NOT NULL AUTO_INCREMENT,
  `benutzer_id` int NOT NULL,
  `spind_id` int NOT NULL,
  `aktion_typ` enum('oeffnen','schliessen') NOT NULL,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `auth_methode` enum('RFID','PIN') NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_aktion_benutzer` (`benutzer_id`),
  KEY `fk_aktion_spind` (`spind_id`),
  CONSTRAINT `fk_aktion_benutzer` FOREIGN KEY (`benutzer_id`) REFERENCES `benutzer` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_aktion_spind` FOREIGN KEY (`spind_id`) REFERENCES `spind` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ------------------------------------------------------
-- Table structure for table `benutzer`
-- ------------------------------------------------------

DROP TABLE IF EXISTS `benutzer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `benutzer` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `rfid_code` varchar(100) DEFAULT NULL,
  `pin_code` varchar(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `rfid_code` (`rfid_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ------------------------------------------------------
-- Table structure for table `display`
-- ------------------------------------------------------

DROP TABLE IF EXISTS `display`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `display` (
  `id` int NOT NULL AUTO_INCREMENT,
  `typ` enum('7segment','lcd1602') NOT NULL,
  `inhalt` varchar(255) DEFAULT NULL,
  `spind_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_display_spind` (`spind_id`),
  CONSTRAINT `fk_display_spind` FOREIGN KEY (`spind_id`) REFERENCES `spind` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ------------------------------------------------------
-- Table structure for table `sensor`
-- ------------------------------------------------------

DROP TABLE IF EXISTS `sensor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sensor` (
  `id` int NOT NULL AUTO_INCREMENT,
  `typ` enum('PIR','RFID','PIN') NOT NULL,
  `aktiv` tinyint(1) DEFAULT '0',
  `spind_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_sensor_spind` (`spind_id`),
  CONSTRAINT `fk_sensor_spind` FOREIGN KEY (`spind_id`) REFERENCES `spind` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ------------------------------------------------------
-- Table structure for table `spind`
-- ------------------------------------------------------

DROP TABLE IF EXISTS `spind`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `spind` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nummer` int NOT NULL,
  `status` enum('frei','besetzt','reserviert') DEFAULT 'frei',
  `code` varchar(10) DEFAULT NULL,  -- NEU: PIN-Code
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nummer` (`nummer`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ------------------------------------------------------
-- Table structure for table `cardnumber`
-- ------------------------------------------------------

DROP TABLE IF EXISTS `cardnumber`;
CREATE TABLE cardnumber (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nummer` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cardnumber_nummer` (`nummer`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------
-- Example data
-- ------------------------------------------------------

-- Test-Benutzer
INSERT INTO benutzer (id, username) VALUES 
(101, 'TestUser101'), 
(102, 'TestUser102');

-- Test-Spinde
INSERT INTO spind (id, nummer, status) VALUES
(1, 101, 'frei'),
