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
const QRCode = require('qrcode');
require('dotenv').config();

// ── CONFIGURATION RENDER & MONGODB ──────────────────────────────────────
const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://Dani_x:moussoki2007@cluster0.xjg7ncf.mongodb.net/?appName=Cluster0';
const PORT = process.env.PORT || 3000;

let lastQR = null;

// Serveur Express pour éviter le "port timeout" sur Render
const app = express();
app.get('/', (req, res) => res.send('Phantom Bot is alive ! 👻 <br><br> <a href="/qr">Cliquez ici pour voir le QR Code</a>'));

app.get('/qr', async (req, res) => {
    if (!lastQR) {
        return res.send(`
            <html>
                <head><style>body{background:#0a0a0a;color:#00ffcc;display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;text-align:center;padding:20px;}</style></head>
                <body>
                    <div>
                        <h1>Génération du QR Code... 🌀</h1>
                        <p>Si le bot est déjà connecté, ce message est normal.</p>
                        <p>Sinon, attendez 10-15 secondes et actualisez la page.</p>
                        <p style="color:#888; font-size: 14px;"><i>Vérifiez les logs Render si ce message persiste.</i></p>
                    </div>
                </body>
            </html>
        `);
    }
    try {
        const qrImage = await QRCode.toDataURL(lastQR);
        res.send(`
            <html>
                <head>
                    <title>Phantom Bot QR Code</title>
                    <style>
                        body { background: #0a0a0a; color: #00ffcc; font-family: 'Segoe UI', sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                        .card { background: #1a1a1a; padding: 30px; border-radius: 20px; box-shadow: 0 0 30px rgba(0, 255, 204, 0.3); text-align: center; border: 1px solid #00ffcc; max-width: 400px; }
                        img { border: 15px solid white; border-radius: 10px; margin: 25px 0; width: 250px; height: 250px; }
                        h1 { margin: 0; font-size: 28px; text-transform: uppercase; letter-spacing: 3px; text-shadow: 0 0 10px #00ffcc; }
                        p { color: #888; margin: 10px 0; }
                        .status { color: #00ffcc; font-weight: bold; margin-top: 15px; }
                    </style>
                    <script>setTimeout(() => { location.reload(); }, 30000);</script>
                </head>
                <body>
                    <div class="card">
                        <h1>PHANTOM BOT</h1>
                        <p>Scannez ce code pour entrer dans le Ghost Zone</p>
                        <img src="${qrImage}" alt="QR Code" />
                        <div class="status">⚡ STATUT : EN ATTENTE DE CONNEXION...</div>
                        <p style="font-size: 12px; margin-top: 20px;"><i>La page s'actualise automatiquement toutes les 30s</i></p>
                    </div>
                </body>
            </html>
        `);
    } catch (err) {
        res.status(500).send('Erreur lors de la génération du QR Code');
    }
});

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
    const settingsCollection = mongoose.connection.db.collection('settings');
    const { state, saveCreds, init } = useMongoDBAuthState(collection);
    
    // Initialiser les crédentiels et les réglages
    await init();
    await handler.loadSettings(settingsCollection);

    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: P({ level: 'silent' }),
        auth: state,
        browser: ['Phantom Bot', 'Safari', '1.0.0'],
        printQRInTerminal: true,
        generateHighQualityThumbnail: false, // Désactive la génération de miniatures (évite crash GLib)
        syncFullHistory: false
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            lastQR = qr;
            console.clear();
            console.log('');
            console.log('  👻  ╔══════════════════════════════════════╗');
            console.log('  ⚡  ║        P H A N T O M   B O T        ║');
            console.log('  👻  ║     QR Code disponible sur le web    ║');
            console.log(`  ⚡  ║    Lien : http://localhost:${PORT}/qr   ║`);
            console.log('  ⚡  ╚══════════════════════════════════════╝');
            console.log('');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            lastQR = null;
            const code = lastDisconnect?.error?.output?.statusCode;
            if (code !== DisconnectReason.loggedOut) {
                console.log('🌀 Reconnexion au Ghost Zone...');
                startBot();
            } else {
                console.log('💀 Session expirée. La base de données a été réinitialisée.');
            }
        }

        if (connection === 'open') {
            lastQR = null;
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
