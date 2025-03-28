const { cmd } = require("../command");
const fonts = require("../lib/fonts.js");

cmd(
  {
    pattern: "fancy",
    desc: "Converts provided text to a selected fancy font.\n\nUsage:\n• fancy <number> <text>  - Immediately convert using that font.\n• fancy <text>            - List fonts with sample conversion.",
    category: "search",
    filename: __filename,
  },
  async (conn, mek, m, { args, reply }) => {
    try {
      if (!args || args.length === 0) {
        return reply("Please provide some text. For example: `fancy I am a boy`");
      }
      
      // Check if the first argument is numeric (i.e. a font selection)
      let selection = parseInt(args[0]);
      if (!isNaN(selection)) {
        // Mode 1: The user provided a number.
        if (args.length < 2) {
          return reply("Please provide the text to convert after the font number. E.g. `fancy 2 I am a boy`");
        }
        let text = args.slice(1).join(" ");
        if (selection < 1 || selection > fonts.length) {
          return reply("Selection out of range. Please choose a valid number.");
        }
        let selectedFont = fonts[selection - 1];
        let convertedText = selectedFont.convert(text);
        return reply(convertedText);
      } else {
        // Mode 2: No numeric selection provided, so list all available fonts with sample conversions.
        let text = args.join(" ");
        let fontList = "Select the number for the font you want by using the format: `fancy <number> <text>`\n\n";
        fonts.forEach((font, index) => {
          let sample = font.convert(text);
          fontList += `${index + 1}. ${font.name}: ${sample}\n`;
        });
        return reply(fontList);
      }
    } catch (e) {
      console.log(e);
      return reply(`Error: ${e}`);
    }
  }
);