const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const P = require('pino');
const qrcode = require('qrcode-terminal');
const handler = require('./handler');

// ── Gestion propre des erreurs pour éviter les crashs complets ───────────
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
    // ── CONNEXION LOCALE ─────────────────────────────────────────────────
    const { state, saveCreds } = await useMultiFileAuthState('session');
    const { version }          = await fetchLatestBaileysVersion();

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
                console.log('💀 Session expirée. Supprime le dossier /session et relance le bot.');
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
        // Traiter uniquement les nouveaux messages entrants (pas l'historique)
        if (m.type !== 'notify') return;
        // Ignorer les messages sans contenu
        if (!m.messages || !m.messages[0]) return;
        // Ignorer les messages envoyés par le bot lui-même
        // (sauf les messages à soi-même pour le .save)
        const msg = m.messages[0];
        if (!msg.message) return;
        // On commente cette ligne pour permettre au bot de lire les commandes envoyées par vous-même (le propriétaire)
        // if (msg.key.fromMe && msg.key.remoteJid !== sock.user.id.split(':')[0] + '@s.whatsapp.net') return;

        console.log(`📨 Message reçu de : ${msg.key.remoteJid}`);
        await handler(sock, m);
    });
}

startBot();
