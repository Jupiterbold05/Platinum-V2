const yts = require("yt-search");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { cmd } = require("../command");

cmd(
  {
    pattern: "play",
    desc: "Downloads audio from YouTube",
    category: "downloader",
    filename: __filename,
    use: "<search text>",
  },
  async (conn, mek, m, { args, reply }) => {
    try {
      if (!args.length) return reply("*_Give me a search query_*");

      // Search for the video
      let searchResults = await yts(args.join(" "));
      let video = searchResults.all[0];

      if (!video) return reply("*_No results found for your search_*");

      // Send video details
      await conn.sendMessage(m.chat, {
        image: { url: video.thumbnail },
        caption: `\n*🎵 Platinum-V2 Music Downloader 🎵*\n\n*🎧 Title:* ${video.title}\n*🔗 URL:* ${video.url}\n*⏳ Duration:* ${video.timestamp}\n*👀 Views:* ${video.views}\n*📅 Uploaded:* ${video.ago}\n*🎙️ Author:* ${video.author.name}\n\n_🎶 Downloading your music..._`,
      });

      // API to get download link
      const downloadApiUrl = `https://bk9.fun/download/ytmp3?url=${encodeURIComponent(video.url)}`;

      let retries = 3;
      while (retries > 0) {
        try {
          const response = await axios.get(downloadApiUrl);
          const data = response.data;

          if (data.status && data.result.downloadUrl) {
            const audioUrl = data.result.downloadUrl;

            // Download the MP3 file
            const audioStream = await axios({
              url: audioUrl,
              method: "GET",
              responseType: "stream",
            });

            const filePath = path.join(__dirname, `${video.title}.mp3`);
            const fileStream = fs.createWriteStream(filePath);
            audioStream.data.pipe(fileStream);

            await new Promise((resolve, reject) => {
              fileStream.on("finish", resolve);
              fileStream.on("error", reject);
            });

            // Send the audio file
            await conn.sendMessage(
              m.chat,
              {
                audio: { url: filePath },
                fileName: `${video.title}.mp3`,
                mimetype: "audio/mpeg",
              },
              { quoted: mek }
            );

            fs.unlinkSync(filePath); // Delete the file after sending
            return;
          } else {
            await reply("*_Error: Could not download the audio. Please try again later!_*");
            return;
          }
        } catch (error) {
          console.error("Retry Error:", error);
          retries--;
          if (retries === 0) {
            await reply("*_Error: Could not download the audio after multiple attempts. Please try again later!_*");
          }
        }
      }
    } catch (error) {
      console.error("Caught Error:", error);
      return reply("*_Error: File not found!!_*");
    }
  }
);