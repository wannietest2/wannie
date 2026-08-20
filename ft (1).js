const axios = require("axios");
const { EmbedBuilder } = require("discord.js");
const getColor = require("../utils/colors");

const SHEET_URL =
"https://docs.google.com/spreadsheets/d/1a0F1_GILFiJ495xmXmop_Letym69S73-97xKxcGWYy0/gviz/tq?tqx=out:csv&sheet=h!ft";

async function getData() {
  const res = await axios.get(SHEET_URL);

  const raw = res.data
    .trim()
    .split("\n")
    .map(line =>
      line.split(",").map(c =>
        String(c || "")
          .replace(/"/g, "")
          .trim()
          .replace(/,/g, "")
      )
    );

  const maxLen = Math.max(...raw.map(r => r.length));
  const fixed = [];

  for (let i = 0; i < maxLen; i++) {
    fixed.push(raw.map(r => r[i]));
  }

  return fixed;
}

function findRow(data, from, to) {
  return data.find(
    r => Number(r[0]) === Number(from) &&
         Number(r[1]) === Number(to)
  );
}

function format(n) {
  return Number(n).toLocaleString("en-US");
}


function buildEmbed(from, to, z, row, client, message) {
  const mult = Number(z);

  return new EmbedBuilder()
    .setColor(getColor())
    .setTitle(`R99 Cost of Upgrading From R${from} To R${to} For ${z} card(s).`)
    .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
    .addFields(
      {
        name: "Fodder",
        value:
          `C1 - ${format(row[2] * mult)} | ` +
          `B1 - ${format(row[3] * mult)} | ` +
          `A5 - ${format(row[4] * mult)} | ` +
          `S5 - ${format(row[5] * mult)}`
      },
      {
        name: "PUC + Fodder",
        value: `${format(row[6] * mult)} RP`,
        inline: true
      },
      {
        name: "PUC - Fodder",
        value: `${format(row[7] * mult)} RP`,
        inline: true
      },
      {
        name: "Fodder - PUC",
        value: `${format(row[8] * mult)} RP`,
        inline: true
      },
      {
        name: "Neither",
        value: `${format(row[9] * mult)} RP`,
        inline: true
      },
      {
        name: "PUC - Fodder**",
        value: `${format(row[10] * mult)} RP`,
        inline: true
      },
      {
        name: "\u200B",
        value: "Uses fodder from h!cardrec. **Have A1/S1 to do A5/S5"
      }
    )
    .setFooter({
      text: `Requested by ${message.author.username}`,
      iconURL: message.author.displayAvatarURL({ dynamic: true })
    });
}

function diffRows(to, from) {
  const out = [];

  for (let i = 0; i < to.length; i++) {
    out[i] = (Number(to[i]) || 0) - (Number(from[i]) || 0);
  }

  return out;
}

module.exports = async function ftCommand(message, client) {
  const match = message.content
    .trim()
    .match(/^h!ft\s+(\d+)\s+(\d+)(?:\s+(\d+))?$/i);

  if (!match) {
    return message.reply("Format: h!ft <from> <to> <amount>");
  }

  const from = Number(match[1]);
  const to = Number(match[2]);
  const z = match[3] ? Number(match[3]) : 1;

  const data = await getData();

  const direct = findRow(data, from, to);

  if (direct) {
    return message.reply({
      embeds: [buildEmbed(from, to, z, direct, client, message)]
    });
  }

  const rowFrom = findRow(data, 1, from);
  const rowTo = findRow(data, 1, to);

  if (!rowFrom || !rowTo) {
    return message.reply(
`Oops! Có lẽ bot đã bị lỗi, op nhà mình tag <@1094527664875896865> báo ẻm vớiii =<<
Maybe the bot is broken, please contact <@1094527664875896865>`
    );
  }

  const diff = diffRows(rowTo, rowFrom);

  return message.reply({
    embeds: [buildEmbed(from, to, z, diff, client, message)]
  });
};
