# Log des Modifications et Restaurations

Ce fichier répertorie toutes les modifications effectuées par l'assistant IA (Antigravity) pour permettre une restauration en cas d'erreur.

## Structure du Log
Chaque entrée contient :
- **Date et Heure**
- **Fichier modifié**
- **Lien vers la sauvegarde** (dans le dossier `backups/`)
- **Description du changement**

---

## Historique des modifications

| Date | Fichier | Sauvegarde | Description |
| :--- | :--- | :--- | :--- |
| 2026-05-07 | N/A | Initialisation | Création du système de log et de sauvegarde. |
| 2026-05-07 | index.js | backups/20260507_index.js | Remplacement du stockage local par MongoDB Atlas pour éviter la perte de session sur Render et ajout d'un serveur Express (port 3000) pour la compatibilité Web Service. |
| 2026-05-07 | package.json | backups/20260507_package.json | Ajout de 'mongoose' (DB) et 'dotenv' (config) pour permettre l'hébergement cloud et la persistance des données. |
| 2026-05-07 | lib/functions.js | backups/20260507_functions.js | Migration vers 'process.env' pour la clé Groq, permettant une configuration sécurisée via le tableau de bord Render. |
| 2026-05-07 | handler.js | backups/20260507_handler.js | Copie de sauvegarde effectuée avant la migration globale du projet vers MongoDB. |
| 2026-05-07 | lib/mongo-auth.js | N/A (Nouveau) | Création d'un module personnalisé pour interfacer Baileys avec MongoDB Atlas (persistance de session). |
| 2026-05-07 | index.js | backups/20260507_index_v2.js | Ajout d'un endpoint web '/qr' pour afficher le QR Code proprement sur une page HTML, facilitant le scan sur Render. |
| 2026-05-07 | package.json | N/A | Ajout du champ 'engines' (Node 20.x) pour forcer une version stable sur Render et éviter les échecs de build v24. |
| 2026-05-07 | handler.js | N/A | Correction de la détection FFmpeg pour supporter Linux (Render) au lieu de chercher uniquement un .exe Windows. |
