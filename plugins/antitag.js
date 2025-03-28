const { cmd } = require('../command');
const { loadSettings, saveSettings } = require('../lib/antitagStorage');

// Load persistent antitag settings.
let antitagSettings = loadSettings();

// Register the antitag command for setting the mode.
cmd(
  {
    pattern: "antitag",
    desc: "Configure antitag mode for bot tag commands: delete, warn, kick, off",
    category: "group",
    filename: __filename,
  },
  async (conn, mek, m, { from, args, reply, isGroup, isBotAdmins }) => {
    try {
      if (!isGroup) return reply("This command can only be used in groups.");
      if (!isBotAdmins) return reply("I'm not admin.");

      if (args.length === 0) {
        const currentMode = antitagSettings[from] || "off";
        return reply(`Current antitag mode is: ${currentMode}`);
      }

      const mode = args[0].toLowerCase();
      if (!["delete", "warn", "kick", "off"].includes(mode)) {
        return reply("Invalid mode. Please choose from: delete, warn, kick, off.");
      }

      antitagSettings[from] = mode;
      saveSettings(antitagSettings);
      return reply(`Antitag mode set to: ${mode}`);
    } catch (e) {
      console.log(e);
      m.reply(`${e}`);
    }
  }
);

// Helper function to determine if a message is an "invisible tag" message
// sent by a bot (using the tag command). The idea is that the message’s
// context (mentionedJid) is non‑empty but the visible text does not show any "@".
function isInvisibleTagMessage(message) {
  if (!message) return false;
  let text = "";
  if (message.conversation) {
    text = message.conversation;
  } else if (message.extendedTextMessage) {
    text = message.extendedTextMessage.text || "";
  } else if (message.imageMessage) {
    text = message.imageMessage.caption || "";
  } else if (message.videoMessage) {
    text = message.videoMessage.caption || "";
  }
  // Get the mentioned IDs from context.
  let mentioned = [];
  if (message.extendedTextMessage) {
    mentioned = message.extendedTextMessage.contextInfo?.mentionedJid || [];
  } else if (message.imageMessage) {
    mentioned = message.imageMessage.contextInfo?.mentionedJid || [];
  } else if (message.videoMessage) {
    mentioned = message.videoMessage.contextInfo?.mentionedJid || [];
  }
  // If there are mentioned IDs but the visible text has no '@', assume it’s a bot tag message.
  return (mentioned.length > 0 && !text.includes('@'));
}

// Handler that processes incoming group messages.
async function handleAntitag(conn, m, { from, sender, groupMetadata }) {
  try {
    const mode = antitagSettings[from];
    if (!mode || mode === "off") return;

    // Only act on messages that appear to be sent via a bot tag command.
    if (!isInvisibleTagMessage(m.message)) return;

    // Optionally, skip processing if the sender is a group admin.
    if (groupMetadata && groupMetadata.participants) {
      const adminIds = groupMetadata.participants.filter(p => p.admin).map(p => p.id);
      if (adminIds.includes(sender)) return;
    }

    // Take action based on the mode.
    if (mode === "delete") {
      await conn.sendMessage(from, { delete: m.key });
    } else if (mode === "warn") {
      await conn.sendMessage(
        from,
        { text: `@${sender.split("@")[0]}, please do not abuse the tag command.`, mentions: [sender] },
        { quoted: m }
      );
      await conn.sendMessage(from, { delete: m.key });
    } else if (mode === "kick") {
      await conn.sendMessage(
        from,
        { text: `@${sender.split("@")[0]}, you are being removed for abusing the tag command.`, mentions: [sender] },
        { quoted: m }
      );
      await conn.sendMessage(from, { delete: m.key });
      await conn.groupParticipantsUpdate(from, [sender], "remove");
    }
  } catch (e) {
    console.log("Error in antitag handler:", e);
  }
}

// Attach the antitag listener to the connection.
function registerAntitag(conn) {
  conn.ev.on('messages.upsert', async (mek) => {
    mek = mek.messages[0];
    if (!mek.message) return;

    const from = mek.key.remoteJid;
    // Only process group messages.
    if (!from.endsWith('@g.us')) return;

    // Determine sender info.
    const sender = mek.key.fromMe
      ? (conn.user.id.split(':')[0] + '@s.whatsapp.net' || conn.user.id)
      : (mek.key.participant || mek.key.remoteJid);

    // Retrieve group metadata.
    let groupMetadata = null;
    try {
      groupMetadata = await conn.groupMetadata(from);
    } catch (error) {
      console.error("Error fetching group metadata in antitag plugin:", error);
    }
    await handleAntitag(conn, mek, { from, sender, groupMetadata });
  });
}

module.exports = { registerAntitag };