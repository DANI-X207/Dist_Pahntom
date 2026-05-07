const {
    default: makeWASocket,
    DisconnectReason,
    fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const P = require('pino');
const qrcode = require('qrcode-terminal');
const handler = require('./handler');
const mongoose = require('mongoose');
const express = require('express');
const useMongoDBAuthState = require('./lib/mongo-auth');
require('dotenv').config();

// ── CONFIGURATION RENDER & MONGODB ──────────────────────────────────────
const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://Dani_x:moussoki2007@cluster0.xjg7ncf.mongodb.net/?appName=Cluster0';
const PORT = process.env.PORT || 3000;

// Serveur Express pour éviter le "port timeout" sur Render
const app = express();
app.get('/', (req, res) => res.send('Phantom Bot is alive ! 👻'));
app.listen(PORT, () => console.log(`🚀 Serveur web actif sur le port ${PORT}`));

// ── Gestion propre des erreurs ───────────────────────────────────────────
process.on('uncaughtException', err => {
    console.error('💥 Erreur non interceptée :', err);
});
process.on('unhandledRejection', err => {
    console.error('💥 Rejet de promesse non intercepté :', err);
});

// Masquer les messages d'erreur liés au décryptage WhatsApp
const originalConsoleError = console.error;
console.error = (...args) => {
    const msg = args.join(' ');
    if (msg.includes('Bad MAC') || msg.includes('decrypt') || msg.includes('Record Overflow')) return;
    originalConsoleError(...args);
};

async function startBot() {
    console.log('🌀 Connexion à MongoDB Atlas...');
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connecté à MongoDB !');
    } catch (err) {
        console.error('❌ Échec de connexion MongoDB :', err);
        process.exit(1);
    }

    const collection = mongoose.connection.db.collection('session');
    const { state, saveCreds, init } = useMongoDBAuthState(collection);
    
    // Initialiser les crédentiels depuis la DB
    await init();

    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: P({ level: 'silent' }),
        auth: state,
        browser: ['Phantom-Bot', 'Chrome', '3.0.0'],
        printQRInTerminal: false
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.clear();
            console.log('');
            console.log('  👻  ╔══════════════════════════════════════╗');
            console.log('  ⚡  ║        P H A N T O M   B O T        ║');
            console.log('  👻  ║     Scanne le QR code ci-dessous     ║');
            console.log('  ⚡  ╚══════════════════════════════════════╝');
            console.log('');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const code = lastDisconnect?.error?.output?.statusCode;
            if (code !== DisconnectReason.loggedOut) {
                console.log('🌀 Reconnexion au Ghost Zone...');
                startBot();
            } else {
                console.log('💀 Session expirée. La base de données a été réinitialisée.');
            }
        }

        if (connection === 'open') {
            console.clear();
            console.log('');
            console.log('  👻  ╔══════════════════════════════════════╗');
            console.log('  ⚡  ║   I\'M GOING GHOST !  PHANTOM BOT    ║');
            console.log('  👻  ║        ✅  Connecté & prêt !         ║');
            console.log('  ⚡  ╚══════════════════════════════════════╝');
            console.log('');
        }
    });

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('messages.upsert', async m => {
        if (m.type !== 'notify') return;
        if (!m.messages || !m.messages[0]) return;
        const msg = m.messages[0];
        if (!msg.message) return;

        console.log(`📨 Message reçu de : ${msg.key.remoteJid}`);
        await handler(sock, m);
    });
}

startBot();
