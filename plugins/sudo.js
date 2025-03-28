const fs = require('fs');
const path = require('path');
const sudoFile = path.join(__dirname, '../lib/sudo.json');
const { cmd } = require('../command');

// Ensure lib/sudo.json exists
if (!fs.existsSync(sudoFile)) fs.writeFileSync(sudoFile, JSON.stringify({}, null, 2));

// Utility function to load the sudo list
const loadSudo = () => {
  try {
    return JSON.parse(fs.readFileSync(sudoFile, 'utf8'));
  } catch (e) {
    console.error("Error reading sudo file:", e);
    return {};
  }
};

// Utility function to save the sudo list
const saveSudo = (data) => fs.writeFileSync(sudoFile, JSON.stringify(data, null, 2));

// Command: setsudo
cmd({
  pattern: "setsudo",
  desc: "Grant sudo access to a user (Mention or reply).",
  category: "admin",
  filename: __filename
}, async (conn, mek, m, { isOwner, reply, mentionedJid, quoted }) => {
  if (!isOwner) return reply("❌ Only the bot owner can set sudo users.");

  // Extract the user JID from mention or quoted message
  let userJid = (Array.isArray(mentionedJid) && mentionedJid.length > 0)
    ? mentionedJid[0]
    : (quoted && quoted.sender ? quoted.sender : null);

  if (!userJid) return reply("⚠️ Please mention a user or reply to their message to grant sudo access.");

  // Store only the number part (e.g. "2348084644182")
  let userNumber = userJid.split("@")[0];

  let sudoList = loadSudo();
  if (sudoList[userNumber]) return reply("✅ User already has sudo access.");

  sudoList[userNumber] = true;
  saveSudo(sudoList);
  reply(`✅ @${userNumber} has been granted sudo access.`, { mentions: [userJid] });
});

// Command: delsudo
cmd({
  pattern: "delsudo",
  desc: "Remove sudo access from a user (Mention or reply).",
  category: "admin",
  filename: __filename
}, async (conn, mek, m, { isOwner, reply, mentionedJid, quoted }) => {
  if (!isOwner) return reply("❌ Only the bot owner can remove sudo users.");

  // Extract the user JID from mention or quoted message
  let userJid = (Array.isArray(mentionedJid) && mentionedJid.length > 0)
    ? mentionedJid[0]
    : (quoted && quoted.sender ? quoted.sender : null);

  if (!userJid) return reply("⚠️ Please mention a user or reply to their message to remove sudo access.");

  // Use the number portion
  let userNumber = userJid.split("@")[0];

  let sudoList = loadSudo();
  if (!sudoList[userNumber]) return reply("⚠️ User does not have sudo access.");

  delete sudoList[userNumber];
  saveSudo(sudoList);
  reply(`❌ @${userNumber} has been removed from sudo users.`, { mentions: [userJid] });
});

// Command: getsudo
cmd({
  pattern: "getsudo",
  desc: "Display the list of sudo users.",
  category: "admin",
  filename: __filename
}, async (conn, mek, m, { isOwner, reply }) => {
  if (!isOwner) return reply("❌ Only the bot owner can view sudo users.");

  let sudoList = loadSudo();
  const sudoNumbers = Object.keys(sudoList);
  if (sudoNumbers.length === 0) return reply("⚠️ No sudo users have been set.");

  let list = "👑 *Sudo Users:*\n";
  sudoNumbers.forEach((num, index) => {
    list += `\n${index + 1}. @${num}`;
  });
  // Convert numbers back to full JIDs for mentions
  let mentions = sudoNumbers.map(num => num + "@s.whatsapp.net");
  reply(list, { mentions });
});