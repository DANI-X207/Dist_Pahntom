#!/bin/bash

echo "👻 [PHANTOM BOT] Demande d'accès au stockage (Acceptez sur l'écran si demandé)..."
termux-setup-storage
sleep 3

echo "👻 [PHANTOM BOT] Copie des fichiers vers le stockage interne sécurisé de Termux..."
cp -r ~/storage/downloads/PhantomTermux ~/PhantomBot

echo "👻 [PHANTOM BOT] Déplacement dans le nouveau dossier..."
cd ~/PhantomBot

echo "👻 [PHANTOM BOT] Mise à jour du système Termux..."
pkg update -y && pkg upgrade -y

echo "👻 [PHANTOM BOT] Installation des dépendances (NodeJS, Python, FFmpeg)..."
pkg install nodejs python ffmpeg -y

echo "👻 [PHANTOM BOT] Installation des modules du Bot..."
npm install

echo "👻 [PHANTOM BOT] Terminé ! Lancement du Bot..."
node index.js
