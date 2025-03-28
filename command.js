var commands = [];

function cmd(info, func) {
  var data = info;
  data.function = func;
  if (!data.dontAddCommandList) data.dontAddCommandList = false;
  if (!info.desc) info.desc = '';
  if (!data.fromMe) data.fromMe = false;
  if (!info.category) data.category = 'misc';
  if (!info.filename) data.filename = "Not Provided";
  commands.push(data);
  return data;
}

// Helper function to reliably extract text from a WhatsApp message object.
function getTextFromMessage(m) {
  let text = "";
  if (m.body) {
    text = m.body;
  } else if (m.text) {
    text = m.text;
  } else if (m.message) {
    if (m.message.conversation) {
      text = m.message.conversation;
    } else if (
      m.message.extendedTextMessage &&
      m.message.extendedTextMessage.text
    ) {
      text = m.message.extendedTextMessage.text;
    }
  }
  return text;
}

// Function to detect regex-based commands
async function checkRegexCommands(conn, m) {
  // Use our helper to reliably extract the message text.
  let text = getTextFromMessage(m);

  for (let command of commands) {
    // For commands meant to respond to replies, ensure a quoted message exists.
    if (command.type === "reply" && !m.quoted) continue;

    if (command.pattern && command.pattern instanceof RegExp) {
      let match = text.match(command.pattern);
      if (match) {
        try {
          await command.function(
            conn,
            m, // Pass m as the mek (so quoted messages are accessible)
            m,
            {
              sender: m.sender,
              reply: (msg) =>
                conn.sendMessage(m.key.remoteJid, { text: msg }, { quoted: m }),
            }
          );
        } catch (e) {
          console.error(`Error in regex command: ${e}`);
        }
      }
    }
  }
}

module.exports = {
  cmd,
  AddCommand: cmd,
  Function: cmd,
  Module: cmd,
  commands,
  checkRegexCommands,
};