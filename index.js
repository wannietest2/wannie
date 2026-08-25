require("dotenv").config();

const {
  Client,
  GatewayIntentBits
} = require("discord.js");

const {
  joinVoiceChannel,
  VoiceConnectionStatus,
  entersState
} = require("@discordjs/voice");

// ================= COMMANDS =================
const cardrecCommand = require("./commands/cardrec");
const ftCommand = require("./commands/ft");
const infoCommand = require("./commands/info");
const artistCommand = require("./commands/artist");
const birthdayCommand = require("./commands/birthday");

// ================= VOICE 247 =================
const VOICE_CHANNEL_ID = "1528276072012058775";

// ================= DAILY BOX REMINDER =================
const BOX_CHANNEL_ID = "1528260968096858323";

let lastBoxReminderDate = null;

// ================= ARTIST ALIAS =================
const ARTIST_ALIAS = {
  rv: "red velvet",
  rvv: "red velvet",
  redvelvet: "red velvet",

  aseul: "red velvet - irene & seulgi",
  seulrene: "red velvet - irene & seulgi",

  wendy: "wendy",
  irene: "irene",
  joy: "joy",
  seulgi: "seulgi",

  exo: "exo",
  exo8: "exo",

  ae: "aespa",
  aespa: "aespa",

  gg: "girls' generation",
  snsd: "girls' generation",

  shinee: "shinee"
};

// ================= COOLDOWN =================
const cooldown = new Map();
const cooldownMsg = new Map();
const COOLDOWN_TIME = 3000;

// ================= CLIENT =================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ================= VOICE 247 =================
async function connectTo247Voice() {
  try {
    const channel = await client.channels.fetch(VOICE_CHANNEL_ID);

    if (!channel) {
      console.log("❌ Không tìm thấy voice channel!");
      return;
    }

    if (!channel.isVoiceBased()) {
      console.log("❌ ID này không phải voice channel!");
      return;
    }

    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
      selfDeaf: true,
      selfMute: true
    });

    console.log(`🎙️ Wannie đã vào voice: ${channel.name}`);

    await entersState(
      connection,
      VoiceConnectionStatus.Ready,
      30_000
    );

    console.log("✅ Voice 247 đã kết nối!");

    connection.on(
      VoiceConnectionStatus.Disconnected,
      async () => {
        console.log(
          "⚠️ Wannie bị disconnect khỏi voice, đang reconnect..."
        );

        try {
          await Promise.race([
            entersState(
              connection,
              VoiceConnectionStatus.Signalling,
              5_000
            ),
            entersState(
              connection,
              VoiceConnectionStatus.Connecting,
              5_000
            )
          ]);

          console.log("🔄 Đang reconnect voice...");
        } catch {
          console.log("❌ Reconnect thất bại, đang join lại...");

          try {
            connection.destroy();
          } catch {}

          setTimeout(() => {
            connectTo247Voice();
          }, 5_000);
        }
      }
    );

  } catch (error) {
    console.error("❌ Lỗi Voice 247:", error);

    setTimeout(() => {
      connectTo247Voice();
    }, 10_000);
  }
}

// ================= DAILY BOX REMINDER FUNCTION =================
async function sendDailyBoxReminder() {
  try {
    const now = new Date();

    const vietnamTime = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).formatToParts(now);

    const get = (type) =>
      vietnamTime.find(part => part.type === type)?.value;

    const date = `${get("year")}-${get("month")}-${get("day")}`;
    const hour = get("hour");
    const minute = get("minute");

    // Chỉ gửi đúng 22:00 giờ Việt Nam
    if (hour !== "22" || minute !== "00") return;

    // Không gửi 2 lần trong cùng một ngày
    if (lastBoxReminderDate === date) return;

    const channel = await client.channels.fetch(BOX_CHANNEL_ID);

    if (!channel || !channel.isTextBased()) {
      console.log("❌ Không tìm thấy channel reminder box!");
      return;
    }

    await channel.send({
      content:
        "@everyone loa loa loa Hó ơi vô mở bõ với lụm kim cương bên ssm nè <a:wendyyy:1540231057079537706> ",

      allowedMentions: {
        parse: ["everyone"]
      }
    });

    lastBoxReminderDate = date;

    console.log(`🎁 Đã gửi reminder mở box ngày ${date}`);

  } catch (error) {
    console.error("❌ Lỗi Daily Box Reminder:", error);
  }
}

// ================= COOLDOWN FUNCTION =================
function checkCooldown(userId, message) {
  const now = Date.now();

  if (cooldown.has(userId)) {
    const expire = cooldown.get(userId) + COOLDOWN_TIME;

    if (now < expire) {
      if (!cooldownMsg.has(userId)) {
        cooldownMsg.set(userId, true);

        message.reply(
          "Oiii từ từ thuiii Wannie cần một ít thời gian để xử lýyy <a:airenecutie:1518173056475070548> Be patient!"
        ).then(msg => {
          setTimeout(() => msg.delete().catch(() => {}), 3000);
        });

        setTimeout(() => {
          cooldownMsg.delete(userId);
        }, COOLDOWN_TIME);
      }

      return true;
    }
  }

  cooldown.set(userId, now);

  setTimeout(() => {
    cooldown.delete(userId);
  }, COOLDOWN_TIME);

  return false;
}

// ================= MESSAGE CREATE =================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // 👇 TAG BOT
  if (message.mentions.has(client.user)) {
    return message.reply(
      "hửmm, mọi người gọi Wannie có chuyện gì théee <a:wannierunback:1517887316562149597>"
    );
  }

  // 👇 bỏ qua tin nhắn thường
  if (!message.content.toLowerCase().startsWith("h!")) {
    return;
  }

  // 🔥 COOLDOWN
  if (checkCooldown(message.author.id, message)) return;

  // 👇 CARDREC
  if (message.content.toLowerCase() === "h!cardrec") {
    return cardrecCommand(message);
  }

  // 👇 WANNIE HPBD
  if (message.content.toLowerCase().startsWith("h!wanniehpbd")) {
    return birthdayCommand(message);
  }

  // 👇 FT
  if (message.content.startsWith("h!ft")) {
    return ftCommand(message, client);
  }

  // 👇 ARTIST ROUTE
  if (
    message.content.toLowerCase().startsWith("h!sm ") ||
    message.content.toLowerCase().startsWith("h!jyp ")
  ) {
    const parts = message.content.trim().split(/\s+/);

    const company = parts[0].replace("h!", "").toLowerCase();
    const artistRaw = parts.slice(1).join(" ").toLowerCase();

    const artist = ARTIST_ALIAS[artistRaw] || artistRaw;

    message.content = `h!i ${company} ${artist}`;

    return artistCommand(message);
  }

  // 👇 INFO
  if (message.content.startsWith("h!i")) {
    return infoCommand(message);
  }
});

// ================= BOT READY =================
client.once("ready", async () => {
  console.log(`🤖 ${client.user.tag} đã online!`);

  // Tự động vào phòng voice 247
  await connectTo247Voice();

  // Kiểm tra reminder mỗi phút
  setInterval(sendDailyBoxReminder, 60 * 1000);

  // Kiểm tra ngay khi bot online
  await sendDailyBoxReminder();
});

// ================= LOGIN =================
client.login(process.env.TOKEN);
