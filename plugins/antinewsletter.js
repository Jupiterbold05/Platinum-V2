const config = require("../config");
const { cmd } = require("../command");
const { loadSettings, saveSettings } = require("../lib/antitagStorage");

// Load persistent anti‑newsletter settings.
let antinewsletterSettings = loadSettings();

// Register the anti‑newsletter command.
cmd(
  {
    pattern: "antinewsletter",
    desc: "Configure anti‑newsletter mode: delete, warn, kick, off",
    category: "group",
    filename: __filename,
  },
  async (conn, mek, m, { from, args, reply, isGroup, isBotAdmins }) => {
    try {
      if (!isGroup) return reply("This command can only be used in groups.");
      if (!isBotAdmins) return reply("I'm not admin.");

      if (args.length === 0) {
        const currentMode = antinewsletterSettings[from] || "off";
        return reply(`Current anti‑newsletter mode is: ${currentMode}`);
      }

      const mode = args[0].toLowerCase();
      if (!["delete", "warn", "kick", "off"].includes(mode)) {
        return reply("Invalid mode. Please choose from: delete, warn, kick, off.");
      }

      antinewsletterSettings[from] = mode;
      saveSettings(antinewsletterSettings);
      return reply(`Anti‑newsletter mode set to: ${mode}`);
    } catch (e) {
      console.log(e);
      m.reply(`${e}`);
    }
  }
);

// Helper: Check if the message contains a forwarded newsletter (channel) property.
function containsForwardedNewsletter(message) {
  let contextInfo = null;
  if (message.extendedTextMessage) {
    contextInfo = message.extendedTextMessage.contextInfo;
  } else if (message.imageMessage) {
    contextInfo = message.imageMessage.contextInfo;
  } else if (message.videoMessage) {
    contextInfo = message.videoMessage.contextInfo;
  } else if (message.documentMessage) {
    contextInfo = message.documentMessage.contextInfo;
  }
  return contextInfo && contextInfo.forwardedNewsletterMessageInfo;
}

// Handler: Process anti‑newsletter action on a group message.
async function handleAntiNewsletter(conn, m, { from, sender, groupMetadata }) {
  try {
    const mode = antinewsletterSettings[from];
    if (!mode || mode === "off") return;
    if (!containsForwardedNewsletter(m.message)) return;

    // Optionally, do not process if the sender is a group admin.
    if (groupMetadata && groupMetadata.participants) {
      const adminIds = groupMetadata.participants.filter(p => p.admin).map(p => p.id);
      if (adminIds.includes(sender)) return;
    }

    if (mode === "delete") {
      await conn.sendMessage(from, { delete: m.key });
    } else if (mode === "warn") {
      await conn.sendMessage(
        from,
        { text: `@${sender.split("@")[0]}, sharing forwarded channel messages is not allowed.`, mentions: [sender] },
        { quoted: m }
      );
      await conn.sendMessage(from, { delete: m.key });
    } else if (mode === "kick") {
      await conn.sendMessage(
        from,
        { text: `@${sender.split("@")[0]}, you are being removed for sharing forwarded channel messages.`, mentions: [sender] },
        { quoted: m }
      );
      await conn.sendMessage(from, { delete: m.key });
      await conn.groupParticipantsUpdate(from, [sender], "remove");
    }
  } catch (e) {
    console.log("Error in anti‑newsletter handler:", e);
  }
}

// Function: Attach the anti‑newsletter listener to the connection.
function registerAntiNewsletter(conn) {
  conn.ev.on('messages.upsert', async (mek) => {
    mek = mek.messages[0];
    if (!mek.message) return;

    const from = mek.key.remoteJid;
    // Process only group messages.
    if (!from.endsWith('@g.us')) return;

    const sender = mek.key.fromMe
      ? (conn.user.id.split(':')[0] + '@s.whatsapp.net' || conn.user.id)
      : (mek.key.participant || mek.key.remoteJid);

    let groupMetadata = null;
    try {
      groupMetadata = await conn.groupMetadata(from);
    } catch (error) {
      console.error("Error fetching group metadata in anti‑newsletter plugin:", error);
    }
    await handleAntiNewsletter(conn, mek, { from, sender, groupMetadata });
  });
}

module.exports = { registerAntiNewsletter };