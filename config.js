const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}

module.exports = {
    SESSION_ID: process.env.SESSION_ID || "h0hT0J6Z#_NeJoCmYvBlI9XQmmM_QNEpmTven2Ztr9sE1LdOsJAs",
    ALIVE_IMG: process.env.ALIVE_IMG || "https://files.catbox.moe/gzrefm.jpg",
    ALIVE_MSG: process.env.ALIVE_MSG || "Hey there, I'm alive",
    OWNER_NUMBER: process.env.OWNER_NUMBER || "2348084644182",
    MODE: process.env.MODE || "private",
    VERSION: process.env.VERSION || "1.0.1",
    PREFIX: process.env.PREFIX || ":",
    BOT_NAME: process.env.BOT_NAME || "Pʟᴀᴛɪɴᴜᴍ-V2",
    AUTO_READ_STATUS: process.env.AUTO_READ_STATUS || "false",
    OWNER_NAME: process.env.OWNER_NAME || "eleven00¹",
};