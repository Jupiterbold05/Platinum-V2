const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}
global.email = "jadewale71@gmail.com";
global.location = "Lagos, Nigeria";
global.mongodb = process.env.MONGODB_URI || "mongodb+srv://astrofx0011:astro@cluster0.lmwnxdt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
global.allowJids = process.env.ALLOW_JID || "null";
global.blockJids = process.env.BLOCK_JID || "null";
global.DATABASE_URL = process.env.DATABASE_URL || "";
global.timezone = process.env.TZ || process.env.TIME_ZONE || "Africa/Lagos";
global.github = process.env.GITHUB || "https://github.com/Jupiterbold05/Platinum-V1";
global.gurl = process.env.GURL || "https://whatsapp.com/channel/0029VaeW5Tw4yltQOYIO5E2D";
global.website = process.env.GURL || "https://whatsapp.com/channel/0029VaeW5Tw4yltQOYIO5E2D";
global.THUMB_IMAGE = process.env.THUMB_IMAGE || process.env.IMAGE || "https://i.imgur.com/gvdQSvi.jpeg";
global.devs = "2348084644182";
global.sudo = process.env.SUDO || "2349071978357";
global.owner = process.env.OWNER_NUMBER || "2348084644182";
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
