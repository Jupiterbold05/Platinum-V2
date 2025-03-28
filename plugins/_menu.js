const config = require('../config');
const { cmd, commands } = require('../command');
const { formatBytes, getLocalBuffer, runtime } = require('../lib/functions');
const { platform, totalmem, freemem } = require('os');
const { join } = require('path');

cmd({
    pattern: "menu",
    desc: "Show all commands",
    category: "main",
    filename: __filename
},
async (conn, mek, m, { from, pushname, reply }) => {
    try {
        let botName = config.BOT_INFO ? config.BOT_INFO.split(';')[1] || 'Platinum-V2' : 'Platinum-V2';
        let dateTime = new Date().toLocaleString();

        let menuText = `╭─❏ *${botName}* ❏\n` +
            `│ User: ${pushname}\n` +
            `│ Mode: ${config.MODE}\n` +
            `│ Uptime: ${runtime(process.uptime())}\n` +
            `│ Date/Time: ${dateTime}\n` +
            `│ Platform: ${platform()}\n` +
            `│ Memory: ${formatBytes(totalmem() - freemem())}\n` +
            `│ Plugins: ${commands.length}\n` +
            `│ Version: ${config.VERSION}\n` +
            `╰──────────────❏\n`;

        const categorized = {};

        commands.forEach(cmd => {
            if (!cmd.pattern || cmd.dontAddCommandList) return;
            const commandName = cmd.pattern;
            const category = cmd.category?.toLowerCase() || 'misc';

            if (!categorized[category]) categorized[category] = [];
            categorized[category].push(commandName);
        });

        Object.keys(categorized).forEach(category => {
            menuText += `\n╭── ❏ *${category.toUpperCase()}* ❏\n`;
            categorized[category].forEach(cmd => {
                menuText += `│ ⨠ ${cmd}\n`;
            });
            menuText += `╰──────────────❏\n`;
        });

        const image = await getLocalBuffer(join(process.cwd(), './media/thumb.jpg'));

        await conn.sendMessage(from, {
            image: image,
            caption: menuText,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363331568912110@newsletter',
                    newsletterName: 'PLATINUM-V2 UPDATES',
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

    } catch (error) {
        console.error(error);
        reply('An error occurred while generating the menu.');
    }
});