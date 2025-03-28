const { cmd } = require('../command');

cmd({
    pattern: "invite",
    desc: "Get group invite link.",
    category: "group",
    filename: __filename
}, async (conn, mek, m, { isGroup, isBotAdmins, from, reply }) => {
    try {
        if (!isGroup) return reply("*This command can only be used in groups!*");
        if (!isBotAdmins) return reply("*I'm not an admin, so I can't generate an invite link!*");

        const groupInviteCode = await conn.groupInviteCode(from);
        const inviteLink = `https://chat.whatsapp.com/${groupInviteCode}`;

        return conn.sendMessage(from, {
            text: `*Here is the group invite link.I love you viane ❤️❤️❤️:*\n${inviteLink}`,
            linkPreview: true
        }, { quoted: mek });

    } catch (error) {
        console.error(error);
        return reply("*Error fetching the invite link. Please try again later!*");
    }
});

cmd({
    pattern: "revoke",
    desc: "Revoke and reset group invite link.",
    category: "group",
    filename: __filename
}, async (conn, mek, m, { isGroup, isBotAdmins, from, reply }) => {
    try {
        if (!isGroup) return reply("*This command can only be used in groups!*");
        if (!isBotAdmins) return reply("*I'm not an admin, so I can't reset the group invite link!*");

        await conn.groupRevokeInvite(from);
        return reply("*The group invite link has been successfully revoked and reset!*");
    } catch (error) {
        console.error(error);
        return reply("*Error revoking the invite link. Please try again later!*");
    }
});