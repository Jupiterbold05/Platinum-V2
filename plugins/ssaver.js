const { cmd } = require("../command");
const { downloadMediaMessage } = require("../lib/msg");

// Define regex pattern for matching the entire message (case-insensitive),
// allowing optional whitespace before and after the keyword.
const regexSend = /^\s*(send|share|snd|give|save|sendme|forward)\s*$/i;

// ✅ Save WhatsApp Status (Manual Command with prefix)
cmd(
  {
    pattern: "save",
    desc: "Save WhatsApp status",
    category: "whatsapp",
    filename: __filename,
  },
  async (conn, mek, m, { sender, reply }) => {
    try {
      if (!m.quoted)
        return reply("*Reply to a WhatsApp status to save it.*");

      const { msg, type } = m.quoted;
      if (!msg || !type)
        return reply("*This message has no content to save.*");

      const mediaTypes = [
        "imageMessage",
        "videoMessage",
        "audioMessage",
        "stickerMessage",
        "documentMessage",
      ];

      if (mediaTypes.includes(type)) {
        const mediaBuffer = await m.quoted.download();
        if (!mediaBuffer) return reply("*Failed to download media.*");
        await conn.sendMessage(
          sender,
          { [type.replace("Message", "")]: mediaBuffer },
          { quoted: mek }
        );
      } else if (type === "conversation" || type === "extendedTextMessage") {
        await conn.sendMessage(
          sender,
          { text: msg.text || msg },
          { quoted: mek }
        );
      }
    } catch (e) {
      console.error("❌ Error while saving status:", e);
    }
  }
);

// ✅ Auto-detect and forward on reply (without a prefix)
// This command triggers when a user replies to a WhatsApp status with one of the keywords.
cmd(
  {
    pattern: regexSend,
    fromMe: false, // Only listens to incoming (non-bot) messages
    type: "reply", // Ensures it triggers only on reply messages
  },
  async (conn, mek, m, { sender, reply }) => {
    try {
      if (!m.quoted)
        return reply("*Reply to a WhatsApp status to forward it.*");

      const { msg, type } = m.quoted;
      if (!msg || !type)
        return reply("*This message has no content to forward.*");

      const mediaTypes = [
        "imageMessage",
        "videoMessage",
        "audioMessage",
        "stickerMessage",
        "documentMessage",
      ];

      if (mediaTypes.includes(type)) {
        const mediaBuffer = await m.quoted.download();
        if (!mediaBuffer) return reply("*Failed to download media.*");
        await conn.sendMessage(
          sender,
          { [type.replace("Message", "")]: mediaBuffer },
          { quoted: mek }
        );
      } else if (type === "conversation" || type === "extendedTextMessage") {
        await conn.sendMessage(
          sender,
          { text: msg.text || msg },
          { quoted: mek }
        );
      }
    } catch (e) {
      console.error("❌ Error while forwarding message:", e);
    }
  }
);