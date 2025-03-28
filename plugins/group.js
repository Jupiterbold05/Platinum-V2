const config = require("../config");
const { cmd, commands } = require("../command");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

// Helper function to convert a stream to a Buffer.
async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

// A small delay function to avoid rate limits.
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Command: add - Adds a person to the group.
cmd(
  {
    pattern: "add",
    desc: "Adds a person to group",
    category: "group",
    filename: __filename,
  },
  async (conn, mek, m, { from, quoted, args, reply, isGroup, isBotAdmins }) => {
    try {
      if (!isGroup) return reply("_This command is for groups_");
      if (!isBotAdmins) return reply("_I'm not admin_");
      if (!args[0] && !quoted) return reply("_Mention user to add_");

      let jid = quoted ? quoted.sender : args[0] + "@s.whatsapp.net";
      await conn.groupParticipantsUpdate(from, [jid], "add");
      return reply(`@${jid.split("@")[0]} added`, { mentions: [jid] });
    } catch (e) {
      console.log(e);
      m.reply(`${e}`);
    }
  }
);

// Command: kick - Kicks a person from the group.
cmd(
  {
    pattern: "kick",
    desc: "Kicks a person from group",
    category: "group",
    filename: __filename,
  },
  async (
    conn,
    mek,
    m,
    { from, quoted, args, reply, isGroup, isBotAdmins, groupMetadata }
  ) => {
    try {
      if (!isGroup) return reply("_This command is for groups_");
      if (!isBotAdmins) return reply("_I'm not admin_");

      let jids = [];
      if (m.mentionedJid && m.mentionedJid.length) {
        jids = m.mentionedJid;
      } else if (quoted) {
        jids = [quoted.sender];
      } else if (args[0]) {
        jids = [args[0] + "@s.whatsapp.net"];
      } else {
        return reply("_Mention user to kick_");
      }

      let kickedNames = [];
      for (const jid of jids) {
        await conn.groupParticipantsUpdate(from, [jid], "remove");
        // Small delay between updates
        await delay(500);
        let participant =
          groupMetadata?.participants?.find((p) => p.id === jid);
        let displayName =
          (participant && participant.name) || jid.split("@")[0];
        kickedNames.push(displayName);
      }
      return reply(`${kickedNames.map((name) => `@${name}`).join(", ")} kicked`, {
        mentions: jids,
      });
    } catch (e) {
      console.log(e);
      m.reply(`${e}`);
    }
  }
);

// Command: promote - Promotes a member to admin.
cmd(
  {
    pattern: "promote",
    desc: "Promotes a member",
    category: "group",
    filename: __filename,
  },
  async (
    conn,
    mek,
    m,
    { from, quoted, args, reply, isGroup, isBotAdmins, groupMetadata }
  ) => {
    try {
      if (!isGroup) return reply("_This command is for groups_");
      if (!isBotAdmins) return reply("_I'm not admin_");

      let jids = [];
      if (m.mentionedJid && m.mentionedJid.length) {
        jids = m.mentionedJid;
      } else if (quoted) {
        jids = [quoted.sender];
      } else if (args[0]) {
        jids = [args[0] + "@s.whatsapp.net"];
      } else {
        return reply("_Mention user to promote_");
      }

      let promotedNames = [];
      for (const jid of jids) {
        await conn.groupParticipantsUpdate(from, [jid], "promote");
        await delay(500);
        let participant =
          groupMetadata?.participants?.find((p) => p.id === jid);
        let displayName =
          (participant && participant.name) || jid.split("@")[0];
        promotedNames.push(displayName);
      }
      return reply(
        `${promotedNames.map((name) => `@${name}`).join(", ")} promoted as admin`,
        { mentions: jids }
      );
    } catch (e) {
      console.log(e);
      m.reply(`${e}`);
    }
  }
);

// Command: demote - Demotes an admin.
cmd(
  {
    pattern: "demote",
    desc: "Demotes a member",
    category: "group",
    filename: __filename,
  },
  async (
    conn,
    mek,
    m,
    { from, quoted, args, reply, isGroup, isBotAdmins, groupMetadata }
  ) => {
    try {
      if (!isGroup) return reply("_This command is for groups_");
      if (!isBotAdmins) return reply("_I'm not admin_");

      let jids = [];
      if (m.mentionedJid && m.mentionedJid.length) {
        jids = m.mentionedJid;
      } else if (quoted) {
        jids = [quoted.sender];
      } else if (args[0]) {
        jids = [args[0] + "@s.whatsapp.net"];
      } else {
        return reply("_Mention user to demote_");
      }

      let demotedNames = [];
      for (const jid of jids) {
        await conn.groupParticipantsUpdate(from, [jid], "demote");
        await delay(500);
        let participant =
          groupMetadata?.participants?.find((p) => p.id === jid);
        let displayName =
          (participant && participant.name) || jid.split("@")[0];
        demotedNames.push(displayName);
      }
      return reply(
        `${demotedNames.map((name) => `@${name}`).join(", ")} demoted from admin`,
        { mentions: jids }
      );
    } catch (e) {
      console.log(e);
      m.reply(`${e}`);
    }
  }
);

// Command: mute - Mutes the group.
cmd(
  {
    pattern: "mute",
    desc: "Mutes the group",
    category: "group",
    filename: __filename,
  },
  async (conn, mek, m, { from, reply, isGroup, isBotAdmins }) => {
    try {
      if (!isGroup) return reply("_This command is for groups_");
      if (!isBotAdmins) return reply("_I'm not admin_");

      await conn.groupSettingUpdate(from, "announcement");
      return reply("_Group has been muted_");
    } catch (e) {
      console.log(e);
      m.reply(`${e}`);
    }
  }
);

// Command: unmute - Unmutes the group.
cmd(
  {
    pattern: "unmute",
    desc: "Unmutes the group",
    category: "group",
    filename: __filename,
  },
  async (conn, mek, m, { from, reply, isGroup, isBotAdmins }) => {
    try {
      if (!isGroup) return reply("_This command is for groups_");
      if (!isBotAdmins) return reply("_I'm not admin_");

      await conn.groupSettingUpdate(from, "not_announcement");
      return reply("_Group has been unmuted_");
    } catch (e) {
      console.log(e);
      m.reply(`${e}`);
    }
  }
);

// Command: gjid - Lists JIDs of all group members.
cmd(
  {
    pattern: "gjid",
    desc: "Gets JIDs of all group members",
    category: "group",
    filename: __filename,
  },
  async (conn, mek, m, { from, reply, isGroup, groupMetadata }) => {
    try {
      if (!isGroup) return reply("_This command is for groups_");

      let participantJids = groupMetadata.participants.map((p) => p.id);
      let str = "╭──〔 *Group JIDs* 〕\n";
      participantJids.forEach((jid) => {
        str += `├ *${jid}*\n`;
      });
      str += `╰──────────────`;
      return reply(str);
    } catch (e) {
      console.log(e);
      m.reply(`${e}`);
    }
  }
);

// Command: tagall - Mentions all users in the group with an optional message.
cmd(
  {
    pattern: "tagall",
    desc: "Mentions all users in the group",
    category: "group",
    filename: __filename,
  },
  async (conn, mek, m, { from, reply, isGroup, groupMetadata, sender, args }) => {
    try {
      if (!isGroup) return reply("🚫 *This command can only be used in groups!*");

      // Ensure only group admins can use this command.
      let admins = groupMetadata.participants.filter((p) => p.admin).map((p) => p.id);
      let isAdmin = admins.includes(sender);
      if (!isAdmin) return reply("⚠️ *Only group admins can use this command!*");

      let mentions = groupMetadata.participants.map((p) => p.id);
      let message = args.length > 0 ? args.slice(1).join(" ") : "✨ *No message provided!* ✨";
      let text = `╭─❏   PLATINUM-V2 BOT   ❏─╮
 ─────────────────────

👤 *Sent by:* @${sender.split("@")[0]}
📢 *Message:* ${message}

🎉 *Summoning the group members:* 🎉
${mentions
  .map((jid, index) => `💥 *[${index + 1}]*  ➜ @${jid.split("@")[0]} ✴️`)
  .join("\n")}

💬 *Stay active and have fun!* 🚀`;

      // Sends as a standalone message.
      return await conn.sendMessage(from, { text, mentions });
    } catch (e) {
      console.log(e);
      return reply(`❌ *Error:* ${e}`);
    }
  }
);

// Command: tag - Mentions all users with a custom message (supports media), replying to the command.
cmd(
  {
    pattern: "tag",
    desc: "Mentions all users with a custom message (and resends media if available)",
    category: "group",
    filename: __filename,
  },
  async (conn, mek, m, { from, args, reply, isGroup, groupMetadata }) => {
    try {
      if (!isGroup) return;

      let messageText = args.join(" ").trim();
      if (messageText.toLowerCase().startsWith("tag")) {
        messageText = messageText.substring(3).trim();
      }

      let mediaMsg = null;
      if (m.quoted) {
        const quoted = m.quoted;
        messageText =
          messageText ||
          quoted.conversation ||
          quoted.extendedTextMessage?.text ||
          quoted.imageMessage?.caption ||
          quoted.videoMessage?.caption ||
          "";
        if (
          quoted.imageMessage ||
          quoted.videoMessage ||
          quoted.audioMessage ||
          quoted.documentMessage ||
          quoted.stickerMessage ||
          quoted.pollCreationMessage
        ) {
          mediaMsg = quoted;
        }
      }
      if (!messageText && !mediaMsg) {
        return reply("_Provide a message to send with mentions_");
      }
      const mentions = groupMetadata.participants.map((p) => p.id);
      if (mediaMsg) {
        let mediaBuffer;
        if (mediaMsg.imageMessage) {
          const stream = await downloadContentFromMessage(mediaMsg.imageMessage, "image");
          mediaBuffer = await streamToBuffer(stream);
          await conn.sendMessage(from, { image: mediaBuffer, caption: messageText, mentions });
        } else if (mediaMsg.videoMessage) {
          const stream = await downloadContentFromMessage(mediaMsg.videoMessage, "video");
          mediaBuffer = await streamToBuffer(stream);
          await conn.sendMessage(from, { video: mediaBuffer, caption: messageText, mentions });
        } else if (mediaMsg.audioMessage) {
          const stream = await downloadContentFromMessage(mediaMsg.audioMessage, "audio");
          mediaBuffer = await streamToBuffer(stream);
          await conn.sendMessage(from, { audio: mediaBuffer, mimetype: mediaMsg.audioMessage.mimetype || "audio/ogg", ptt: true });
        } else if (mediaMsg.documentMessage) {
          const stream = await downloadContentFromMessage(mediaMsg.documentMessage, "document");
          mediaBuffer = await streamToBuffer(stream);
          await conn.sendMessage(from, { document: mediaBuffer, caption: messageText, mentions });
        } else if (mediaMsg.stickerMessage) {
          const stream = await downloadContentFromMessage(mediaMsg.stickerMessage, "sticker");
          mediaBuffer = await streamToBuffer(stream);
          await conn.sendMessage(from, { sticker: mediaBuffer, mentions });
        } else if (mediaMsg.pollCreationMessage) {
          if (messageText) {
            await conn.sendMessage(from, { text: messageText, mentions });
          }
          await conn.copyNForward(from, mediaMsg, true);
        } else {
          await conn.sendMessage(from, { text: messageText, mentions });
        }
      } else {
        await conn.sendMessage(from, { text: messageText, mentions }, { quoted: m });
      }
    } catch (e) {
      console.log(e);
      m.reply(`${e}`);
    }
  }
);

// Command: hidetag - Works like "tag" but sends a standalone message (no reply).
cmd(
  {
    pattern: "hidetag",
    desc: "Mentions all users as a hidden tag without replying",
    category: "group",
    filename: __filename,
  },
  async (conn, mek, m, { from, args, reply, isGroup, groupMetadata }) => {
    try {
      if (!isGroup) return;

      let messageText = args.join(" ").trim();
      if (messageText.toLowerCase().startsWith("hidetag")) {
        messageText = messageText.substring(7).trim();
      }

      let mediaMsg = null;
      if (m.quoted) {
        const quoted = m.quoted;
        messageText =
          messageText ||
          quoted.conversation ||
          quoted.extendedTextMessage?.text ||
          quoted.imageMessage?.caption ||
          quoted.videoMessage?.caption ||
          "";
        if (
          quoted.imageMessage ||
          quoted.videoMessage ||
          quoted.audioMessage ||
          quoted.documentMessage ||
          quoted.stickerMessage ||
          quoted.pollCreationMessage
        ) {
          mediaMsg = quoted;
        }
      }
      if (!messageText && !mediaMsg) {
        return reply("_Provide a message to send with mentions_");
      }
      const mentions = groupMetadata.participants.map((p) => p.id);
      if (mediaMsg) {
        let mediaBuffer;
        if (mediaMsg.imageMessage) {
          const stream = await downloadContentFromMessage(mediaMsg.imageMessage, "image");
          mediaBuffer = await streamToBuffer(stream);
          await conn.sendMessage(from, { image: mediaBuffer, caption: messageText, mentions });
        } else if (mediaMsg.videoMessage) {
          const stream = await downloadContentFromMessage(mediaMsg.videoMessage, "video");
          mediaBuffer = await streamToBuffer(stream);
          await conn.sendMessage(from, { video: mediaBuffer, caption: messageText, mentions });
        } else if (mediaMsg.audioMessage) {
          const stream = await downloadContentFromMessage(mediaMsg.audioMessage, "audio");
          mediaBuffer = await streamToBuffer(stream);
          await conn.sendMessage(from, { audio: mediaBuffer, mimetype: mediaMsg.audioMessage.mimetype || "audio/ogg", ptt: true });
        } else if (mediaMsg.documentMessage) {
          const stream = await downloadContentFromMessage(mediaMsg.documentMessage, "document");
          mediaBuffer = await streamToBuffer(stream);
          await conn.sendMessage(from, { document: mediaBuffer, caption: messageText, mentions });
        } else if (mediaMsg.stickerMessage) {
          const stream = await downloadContentFromMessage(mediaMsg.stickerMessage, "sticker");
          mediaBuffer = await streamToBuffer(stream);
          await conn.sendMessage(from, { sticker: mediaBuffer, mentions });
        } else if (mediaMsg.pollCreationMessage) {
          if (messageText) {
            await conn.sendMessage(from, { text: messageText, mentions });
          }
          await conn.copyNForward(from, mediaMsg, true);
        } else {
          await conn.sendMessage(from, { text: messageText, mentions });
        }
      } else {
        await conn.sendMessage(from, { text: messageText, mentions });
      }
    } catch (e) {
      console.log(e);
      m.reply(`${e}`);
    }
  }
);

// Command: everyone - Tags everyone with a custom message, replying to the quoted message.
cmd(
  {
    pattern: "everyone",
    desc: "Tags everyone to a message (sent as a reply to the quoted message) without listing individual members",
    category: "group",
    filename: __filename,
  },
  async (conn, mek, m, { from, args, reply, isGroup, groupMetadata }) => {
    try {
      if (!isGroup) return reply("_This command is for groups_");
      if (!m.quoted) return reply("_Please reply to a message to tag everyone_");

      let messageText = args.join(" ").trim();
      if (!messageText) {
        return reply("_Please provide a message_");
      }
      const mentions = groupMetadata.participants.map((p) => p.id);
      await conn.sendMessage(from, { text: messageText, mentions }, { quoted: m.quoted });
    } catch (e) {
      console.log(e);
      m.reply(`${e}`);
    }
  }
);

// Command: tagadm - Mentions only group admins.
cmd(
  {
    pattern: "tagadm",
    desc: "Mentions only group admins",
    category: "group",
    filename: __filename,
  },
  async (conn, mek, m, { from, reply, isGroup, groupMetadata }) => {
    try {
      if (!isGroup) return reply("_This command is for groups_");

      const adminParticipants = groupMetadata.participants.filter((p) => p.admin);
      if (!adminParticipants.length) return reply("_No admins found in this group._");

      let text = `👑 *Group Admins:* 👑\n`;
      adminParticipants.forEach((p, index) => {
        text += `${index + 1}. @${p.name ? p.name : p.id.split("@")[0]}\n`;
      });
      await conn.sendMessage(from, { text, mentions: adminParticipants.map((p) => p.id) });
    } catch (e) {
      console.log(e);
      m.reply(`${e}`);
    }
  }
);

// Command: groupinfo - Displays group information.
cmd(
  {
    pattern: "groupinfo",
    desc: "Shows group information",
    category: "group",
    filename: __filename,
  },
  async (conn, mek, m, { from, reply, isGroup, groupMetadata }) => {
    try {
      if (!isGroup) return reply("_This command is for groups_");

      let subject = groupMetadata.subject;
      let description = groupMetadata.desc || "No description provided";
      let totalMembers = groupMetadata.participants.length;
      let totalAdmins = groupMetadata.participants.filter((p) => p.admin).length;

      let infoText = `*Group Info:*\n\n*Subject:* ${subject}\n*Description:* ${description}\n*Total Members:* ${totalMembers}\n*Admins:* ${totalAdmins}`;
      return reply(infoText);
    } catch (e) {
      console.log(e);
      m.reply(`${e}`);
    }
  }
);

// Command: setsubject - Sets a new group subject.
cmd(
  {
    pattern: "setsubject",
    desc: "Sets a new group subject",
    category: "group",
    filename: __filename,
  },
  async (conn, mek, m, { from, args, reply, isGroup, isBotAdmins }) => {
    try {
      if (!isGroup) return reply("_This command is for groups_");
      if (!isBotAdmins) return reply("_I'm not admin_");
      if (args.length === 0) return reply("_Please provide the new subject_");

      let newSubject = args.join(" ");
      await conn.groupUpdateSubject(from, newSubject);
      return reply(`*Group subject updated to:* ${newSubject}`);
    } catch (e) {
      console.log(e);
      m.reply(`${e}`);
    }
  }
);

// Command: setdesc - Sets a new group description.
cmd(
  {
    pattern: "setdesc",
    desc: "Sets a new group description",
    category: "group",
    filename: __filename,
  },
  async (conn, mek, m, { from, args, reply, isGroup, isBotAdmins }) => {
    try {
      if (!isGroup) return reply("_This command is for groups_");
      if (!isBotAdmins) return reply("_I'm not admin_");
      if (args.length === 0) return reply("_Please provide the new description_");

      let newDesc = args.join(" ");
      await conn.groupUpdateDescription(from, newDesc);
      return reply("*Group description updated*");
    } catch (e) {
      console.log(e);
      m.reply(`${e}`);
    }
  }
);

// Command: leave - Makes the bot leave the group after confirmation.
cmd(
  {
    pattern: "leave",
    desc: "Bot leaves the group (requires confirmation)",
    category: "group",
    filename: __filename,
  },
  async (conn, mek, m, { from, args, reply, isGroup }) => {
    try {
      if (!isGroup) return reply("_This command is for groups_");

      // Check for confirmation argument "yes"
      if (args[0] && args[0].toLowerCase() === "yes") {
        await conn.groupLeave(from);
      } else {
        return reply("_Are you sure? Type `leave yes` to confirm leaving the group._");
      }
    } catch (e) {
      console.log(e);
      m.reply(`${e}`);
    }
  }
);

// Command: invite - Retrieves the group invite link.
cmd(
  {
    pattern: "invite",
    desc: "Gets the group invite link",
    category: "group",
    filename: __filename,
  },
  async (conn, mek, m, { from, reply, isGroup, isBotAdmins }) => {
    try {
      if (!isGroup) return reply("_This command is for groups_");
      if (!isBotAdmins) return reply("_I'm not admin_");

      let inviteCode = await conn.groupInviteCode(from);
      let inviteLink = `https://chat.whatsapp.com/${inviteCode}`;
      return reply(`*Group Invite Link:*\n${inviteLink}`);
    } catch (e) {
      console.log(e);
      m.reply(`${e}`);
    }
  }
);

cmd(
  {
    pattern: "setgpp",
    desc: "Sets the group's profile picture",
    category: "group",
    filename: __filename,
  },
  async (conn, mek, m, { from, reply, isGroup, isBotAdmins }) => {
    try {
      if (!isGroup) return reply("🚫 *This command can only be used in groups!*");
      if (!isBotAdmins) return reply("⚠️ *I need to be an admin to change the group icon!*");
      if (!m.quoted || !m.quoted.imageMessage) return reply("📸 *Reply to an image to set it as the group profile picture!*");

      const stream = await downloadContentFromMessage(m.quoted.imageMessage, "image");
      const buffer = await streamToBuffer(stream);
      await conn.updateProfilePicture(from, buffer);
      
      return reply("✅ *Group profile picture updated successfully!*");
    } catch (e) {
      console.log(e);
      reply(`❌ *Error:* ${e}`);
    }
  }
);

cmd(
  {
    pattern: "getgpp",
    desc: "Gets the group's profile picture URL",
    category: "group",
    filename: __filename,
  },
  async (conn, mek, m, { from, reply, isGroup, groupMetadata }) => {
    try {
      if (!isGroup) return reply("🚫 This command is for groups only!");
      // Fetch fresh group metadata
      const metadata = groupMetadata || await conn.groupMetadata(from);
      let ppUrl = metadata.icon;
      if (!ppUrl) return reply("ℹ️ No group profile picture found.");
      return reply(`*Group Profile Picture URL:*\n${ppUrl}`);
    } catch (e) {
      console.log(e);
      m.reply(`${e}`);
    }
  }
);