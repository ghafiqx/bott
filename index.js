const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut);
            console.log('Koneksi terputus, mencoba menghubungkan ulang...', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('Bot berhasil terhubung ke WhatsApp!');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // Contoh respon otomatis pesan masuk
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const sender = msg.key.remoteJid;
        const messageText = msg.message.conversation || msg.message.extendedTextMessage?.text;

        console.log('Pesan diterima:', messageText);

        // Balas pesan jika seseorang mengetik "halo"
        if (messageText && messageText.toLowerCase() === 'halo') {
            await sock.sendMessage(sender, { text: 'Halo juga! Ada yang bisa dibantu?' });
        }
    });
}

connectToWhatsApp();
               
