# Guide de Déploiement sur Render 🚀

Ce guide vous explique étape par étape comment héberger votre bot sur Render.com en utilisant MongoDB Atlas pour que votre session reste connectée.

## 1. Préparation du Code
Le bot est déjà configuré pour :
- Utiliser un port dynamique (`process.env.PORT`).
- Se connecter à MongoDB via une variable d'environnement.
- Garder la session vivante grâce à MongoDB.

## 2. Pousser le code sur GitHub
Render se connecte à votre compte GitHub pour déployer automatiquement.
1. Créez un nouveau dépôt sur GitHub (ex: `phantom-bot`).
2. Dans votre dossier local, initialisez Git et envoyez votre code.

## 3. Création du Service sur Render
1. Allez sur [Render.com](https://render.com).
2. Cliquez sur **New +** > **Web Service**.
3. Sélectionnez votre dépôt GitHub.
4. Paramètres :
   - **Runtime** : `Node`
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`

## 4. Variables d'Environnement
Dans l'onglet **Environment** sur Render, ajoutez :
- `MONGODB_URI` : *(Copiez le contenu de votre fichier clauster.txt)*
- `GROQ_API_KEY` : *(Copiez le contenu de votre fichier api.txt)*

## 5. Connexion initiale
Surveillez les **Logs** sur Render. Quand le QR Code apparaît, scannez-le. Une fois la session enregistrée dans MongoDB, le bot sera autonome.
