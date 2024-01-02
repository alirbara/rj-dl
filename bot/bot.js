const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();
const axios = require("axios");
const mongoose = require("mongoose");
const databaseName = "rjDownloaderDB";
mongoose.connect(`mongodb://127.0.0.1:27017/${databaseName}`);
botToken = process.env.BOT_TOKEN;
const bot = new TelegramBot(botToken, { polling: true });

const ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    _id: ObjectId,
    telegram_id: String,
    telegram_first_name: String,
    telegram_last_name: String,
    telegram_username: String,
    media: [{ type: ObjectId, ref: "Media" }],
  },
  { timestamps: true }
);

const mediaSchema = new Schema(
  {
    _id: ObjectId,
    url: String,
    type: String,
    user: { type: ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
const Media = mongoose.model("Media", mediaSchema);

function detectUrl(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex)
  return matches || []
}

async function checkMember(userId) {
  const channel = "@alireza_devops";
  try {
    let user = await bot.getChatMember(channel, userId);
    return user.status;
  } catch (err) {
    console.log(err);
  }
}

const options = {
  download: "⏬ دانلود",
  guide: "📕 راهنما",
  about: "📼 درباره",
  donate: "💸 حمایت مالی",
};

async function sendKeyboard(userId) {
  const keyboard = [Object.values(options)];
  bot.sendMessage(userId, "⌨️ منوی اصلی 👇", {
    reply_markup: JSON.stringify({
      keyboard: keyboard,
      resize_keyboard: true,
      one_time_keyboard: true,
    }),
  });
}

async function addMedia(user_id, url, type) {
  try {
    let user = await User.findOne({ telegram_id: user_id });
    newMedia = new Media({
      _id: new ObjectId(),
      url: url,
      type: type,
      user: user._id,
    });
    try {
      let media = await newMedia.save();
      user.media.push(media._id);
      user.save();
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
}

async function addUser(msg) {
  const newUser = new User({
    _id: new ObjectId(),
    telegram_id: msg.from.id,
    telegram_first_name: msg.from.first_name,
    telegram_last_name: msg.from.last_name,
    telegram_username: msg.from.username,
  });
  try {
    await newUser.save();
  } catch (err) {
    console.log(err);
  }
}

async function checkUser(msg) {
  try {
    let user = await User.findOne({ telegram_id: msg.from.id });
    if (!user) {
      addUser(msg);
    }
  } catch (err) {
    console.log(err);
  }
}

function sendErrorMessage(userId) {
  bot.sendMessage(userId, "خطایی پیش آمد‼️");
}

function parseUrl(url) {
  url = url.split("#")[0];
  url = url.split("?")[0];
  url = url.split("/");

  return [url[3], url[4]];
}

async function sendMedia(userId, url) {
  trackData = parseUrl(url);
  const mediaType = trackData[0];
  const mediaName = trackData[1];

  addMedia(userId, url, mediaType);

  switch (mediaType) {
    case "song":
      await sendMusic(userId, mediaName);
      break;
    case "podcast":
      await sendPodcast(userId, mediaName);
      break;
    case "video":
      await sendVideo(userId, mediaName);
      break;
    default:
      sendErrorMessage(userId);
  }
  sendKeyboard(userId);
}

async function sendMusic(userId, mediaName) {
  const musicEndpoint = "https://host2.rj-mw1.com/media/mp3/mp3-320/";
  const musicFileExtension = ".mp3";

  const musicUrl = musicEndpoint + mediaName + musicFileExtension;
  bot.sendAudio(userId, musicUrl);
}

async function sendPodcast(userId, mediaName) {
  const podcastFileUnavailable =
    "⚠️ در حال حاضر، به دلیل محدودیت تلگرام، فایل‌های پادکست قابل آپلود نیستند.\n👇🏼 می‌تونید پادکست رو از لینک زیر دریافت کنید:\n\n🔗 ";

  const podcastEndpoint = "https://host2.rj-mw1.com/media/podcast/mp3-320/";
  const podcastFileExtension = ".mp3";

  const podcastUrl = podcastEndpoint + mediaName + podcastFileExtension;
  bot.sendMessage(userId, podcastFileUnavailable + podcastUrl);
}

async function sendVideo(userId, mediaName) {
  const videoFileUnavailable =
    "⚠️ در حال حاضر، به دلیل محدودیت تلگرام، فایل‌های موزیک ویدیو قابل آپلود نیستند.\n👇🏼 می‌تونید پادکست رو از لینک زیر دریافت کنید:\n\n🔗 ";
  const videoEndpoint = "https://host2.rj-mw1.com/media/music_video/hd/";
  const videoFileExtension = ".mp4";

  const videoUrl = videoEndpoint + mediaName + videoFileExtension;
  bot.sendMessage(userId, videoFileUnavailable + videoUrl);
}

function followRedirects(url) {
  url = url.replace("https://");
  axios
    .get(url)
    .catch((error) => {
      console.log(error);
    })
    .then((response) => {
      return response.request._redirectable._currentUrl;
    });
}

async function parseRequest(userId, url) {
  let userStatus = await checkMember(userId);
  if (userStatus == "left") {
    bot.sendMessage(userId, "برای ادامه عضو کانال زیر شوید: 👇", {
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [
            {
              text: "😀 کانال شخصی توسعه دهنده ربات",
              url: "https://t.me/alireza_devops",
            },
          ],
        ],
      }),
    });
  } else if (userStatus == "kicked") {
    bot.sendMessage(
      userId,
      "شما از کانال بن شده‌اید و از اجازه استفاده از این ربات را ندارید. 🤕"
    );
  } else {
    url = (await followRedirects(userId, url)) || url;
    await sendMedia(userId, url);
  }
}

async function parseMessage(msg) {
  const messageText = msg.text || msg.caption;
  const userId = msg.from.id;
  const welcomeMessage = "به ربات دانلود از رادیو جوان خوش آمدید! 😀";
  const wrongInputMessage = "پیامی که ارسال کردید اشتباهه! 😢";

  if (messageText.startsWith("https://")) {
    let url = messageText;
    await parseRequest(userId, url);
  } 
    else if (detectUrl(messageText).length !== 0) {
      detectUrl(messageText).forEach( url => {
        parseRequest(userId, url)
      });
    }
  else {
    switch (messageText) {
      case "/start":
        await bot.sendMessage(userId, welcomeMessage);
        break;
      case options.guide:
        await bot.sendMessage(
          userId,
          "🔼 برای ارسال لینک آهنگ، پادکست یا ویدیو کافیه داخل اپ یا سایت رادیوجوان آهنگ رو Share کنید، تلگرام رو از لیست اپلیکیشن‌ها انتخاب کنید و اون رو برای ربات بفرستید"
        );
        break;
      case options.download:
        await bot.sendMessage(
          userId,
          "لطفاً لینک آهنگ، پادکست یا ویدیویی که می‌خوای رو برام بفرست. 🔗"
        );
        return
      case options.about:
        await bot.sendMessage(
          userId,
          `ساخته شده توسط: @alireza_baratian
        سورس: https://github.com/AlirezaBaratian/rj-dl
        `
        );
        break;
      case options.donate:
        await bot.sendMessage(
          userId,
          `اگه این ربات به دردتون خورده می‌تونید به کیف پول زیر ترون دونیت کنید:
        TAB77BR4b6qPTnqoeBJxaXsoidSZN36mEu
        `
        );
        break;
      default:
        await bot.sendMessage(userId, wrongInputMessage);
    }
    await sendKeyboard(userId);
  }
}

async function followRedirects(userId, url) {
  try {
    let response = await axios.get(url);
    return response.request._redirectable._currentUrl;
  } catch (error) {
    await sendErrorMessage(userId);
  }
}

async function main() {
  bot.on("message", (msg) => {
    checkUser(msg);
    parseMessage(msg);
  });

  bot.on("polling_error", (err) => {
    console.log(err);
  });
}

main();
