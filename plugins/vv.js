const config = require("../config");

const { cmd, commands } = require("../command");

cmd({
    pattern: "vv",
    desc: "Get view once.",
    category: "owner",
    filename: __filename
}, async (conn, mek, m, { isReply, quoted, reply }) => {
    try {
        // Check if the message is a view once message
        if (!m.quoted) return reply("Please reply to a view once message!");

        const qmessage = m.message.extendedTextMessage.contextInfo.quotedMessage;
        
            const mediaMessage = qmessage.imageMessage ||
                                qmessage.videoMessage ||
                                qmessage.audioMessage;
                                
            if (!mediaMessage?.viewOnce) {
              return reply("_Not A VV message")
            }

            try {
            const buff = await m.quoted.getbuff
            const cap = mediaMessage.caption || '';
            
            if (mediaMessage.mimetype.startsWith('image')) {
                  await conn.sendMessage(m.chat, {
                  image: buff,
                 caption: cap
         }); 
            } else if (mediaMessage.mimetype.startsWith('video')) {
              await conn.sendMessage(m.chat, {
                  video: buff,
                 caption: cap
         }); 
            } else if (mediaMessage.mimetype.startsWith('audio')) {
              await conn.sendMessage(m.chat, {
                  audio: buff,
                  ptt: mediaMessage.ptt || false
         }); 
            } else {
              return reply("_*Unkown/Unsupported media*_");
        }
    } catch (error) {
        console.error(error);
        reply(`${error}`)
    }
} catch (e) {
  console.error(e);
        reply(`${e}`);
}
});