const axios = require("axios");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder
} = require("discord.js");

const BASE_SHEET =
"https://docs.google.com/spreadsheets/d/1a0F1_GILFiJ495xmXmop_Letym69S73-97xKxcGWYy0/gviz/tq?tqx=out:csv&sheet=";

// ================= ARTIST SHEET MAP =================
// 👉 mỗi artist = 1 sheet riêng
const ARTIST_SHEET_MAP = {
  "red velvet": "rv songs",
  "red velvet - irene & seulgi": "aseul songs",

  "wendy": "wendy songs",
  "irene": "irene songs",
  "joy": "joy songs",
  "seulgi": "seulgi songs",

  "exo": "exo songs",
  "aespa": "aespa songs",
  "shinee": "shinee songs"
};

// ================= FETCH SHEET =================
async function getData(sheetTab) {
  const res = await axios.get(BASE_SHEET + encodeURIComponent(sheetTab));

  return res.data
    .trim()
    .split("\n")
    .map(line =>
      line
        .match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)
        ?.map(c => String(c || "").replace(/"/g, "").trim()) || []
    )
    .filter(r => r && r.length >= 4)
    .filter(r => {
      const row = r.join(" ").toLowerCase();
      return !(row.includes("time") && row.includes("artist"));
    });
}

// ================= PAGINATION =================
function paginate(arr, size) {
  const pages = [];
  for (let i = 0; i < arr.length; i += size) {
    pages.push(arr.slice(i, i + size));
  }
  return pages;
}

// ================= RENDER =================
function renderPage(tab, pages, page, title) {
  const data = pages[page];

  const text = data
    .map(r => `(${r[1]}) ${r[2]} - **${r[3]}**`)
    .join("\n");

  return new EmbedBuilder()
    .setColor(tab === "sm" ? 0xE204DE : 0x4978FB)
    .setAuthor({
      name: `SUPERSTAR ${tab.toUpperCase()} - Song Length`,
      iconURL: tab === "sm"
        ? "attachment://sm.png"
        : "attachment://jyp.png"
    })
    .setTitle(title)
    .setDescription(text)
    .setFooter({ text: `Page ${page + 1}/${pages.length}` });
}

// ================= BUTTON ROW =================
function row() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("prev")
      .setLabel("Previous page")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("next")
      .setLabel("Next page")
      .setStyle(ButtonStyle.Success)
  );
}

// ================= COMMAND =================
module.exports = async function artistCommand(message) {
  const parts = message.content.trim().split(/\s+/);

  const company = parts[1]; // sm / jyp
  const artistInput = parts.slice(2).join(" ").toLowerCase();

  const sheetTab = ARTIST_SHEET_MAP[artistInput];

  if (!sheetTab) {
    return message.reply(`❌ No sheet found for "${artistInput}"`);
  }

  const data = await getData(sheetTab);

  if (!data.length) {
    return message.reply(`❌ Sheet is empty for "${artistInput}"`);
  }

  const pages = paginate(data, 10);
  let page = 0;

  const logo = new AttachmentBuilder(
    company === "sm" ? "./assets/sm.png" : "./assets/jyp.png"
  );

  const msg = await message.reply({
    files: [logo],
    embeds: [renderPage(company, pages, page, artistInput)],
    components: [row()]
  });

  const collector = msg.createMessageComponentCollector({
    idle: 5 * 60 * 1000
  });

  collector.on("collect", async (i) => {
    if (i.user.id !== message.author.id) {
      return i.reply({ content: "Not your button 😆", ephemeral: true });
    }

    if (i.customId === "next") {
      page = (page + 1) % pages.length;
    } else {
      page = (page - 1 + pages.length) % pages.length;
    }

    await i.update({
      embeds: [renderPage(company, pages, page, artistInput)],
      components: [row()]
    });
  });

  collector.on("end", async () => {
    await msg.edit({ components: [] }).catch(() => {});
  });
};
