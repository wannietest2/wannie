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

// ================= SHEET MAP =================
const SHEET_MAP = {
  sm: "h!i sm",
  jyp: "h!i jyp"
};

// ================= FETCH SHEET =================
async function getData(sheetTab) {
  const res = await axios.get(BASE_SHEET + encodeURIComponent(sheetTab));

  const lines = res.data.trim().split("\n");

  return lines
    .map(line =>
      line
        .match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)
        ?.map(c => String(c || "").replace(/"/g, "").trim()) || []
    )
    .filter(r => {
      if (!r || r.length < 4) return false;

      const row = r.join(" ").toLowerCase();

      // 💥 chặn header Time | Artist | Song
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
function renderPage(tab, pages, page) {
  const data = pages[page];

  const text = data
    .map(r => `(${r[1]}) ${r[2]} - **${r[3]}**`)
    .join("\n");

  return new EmbedBuilder()
    .setColor(tab === "sm" ? 0xE204DE : 0x4978FB)
    .setAuthor({
      name: `SUPERSTAR ${tab.toUpperCase()} - Song Length`,
      iconURL:
        tab === "sm"
          ? "attachment://sm.png"
          : "attachment://jyp.png"
    })
    .setTitle("All Songs")
    .setDescription(text)
    .setFooter({ text: `Page ${page + 1}/${pages.length}` });
}

// ================= BUTTON ROW =================
function row(page, pages) {
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
module.exports = async function infoCommand(message) {
  const content = message.content.trim().toLowerCase();
  const args = content.split(/\s+/).slice(1);
  const tab = args[0];

  if (!tab) {
    return message.reply("Format: h!i sm / h!i jyp");
  }

  const sheetTab = SHEET_MAP[tab.toLowerCase()];

  if (!sheetTab) {
    return message.reply("Format: h!i sm / h!i jyp");
  }

  let data = await getData(sheetTab);

// 🔥 remove header + clean
data = data.filter(r =>
  r &&
  r.length >= 4 &&
  r[0].toLowerCase() !== "time"
);

const pages = paginate(data, 10);

  if (pages.length === 0) {
    return message.reply("❌ Sheet trống hoặc sai dữ liệu!");
  }

  let page = 0;

  const logo =
    tab === "sm"
      ? new AttachmentBuilder("./assets/sm.png")
      : new AttachmentBuilder("./assets/jyp.png");

  const msg = await message.reply({
    files: [logo],
    embeds: [renderPage(tab, pages, page)],
    components: [row(page, pages)]
  });

  const collector = msg.createMessageComponentCollector({
    idle: 5 * 60 * 1000
  });

  collector.on("collect", async (i) => {
    if (i.user.id !== message.author.id) {
      return i.reply({
        content: "Không phải bạn dùng nút này 😆",
        ephemeral: true
      });
    }

    if (i.customId === "next") {
      page = (page + 1) % pages.length;
    }

    if (i.customId === "prev") {
      page = (page - 1 + pages.length) % pages.length;
    }

    await i.update({
      embeds: [renderPage(tab, pages, page)],
      components: [row(page, pages)]
    });
  });

  collector.on("end", async () => {
    await msg.edit({ components: [] }).catch(() => {});
  });
};
