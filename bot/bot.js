const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();
const axios = require("axios");

botToken = process.env.BOT_TOKEN;
const bot = new TelegramBot(botToken, { polling: true });

function sendErrorMessage(chatId) {
  bot.sendMessage(chatId, "Error!");
}

function parseUrl(url) {
  url = url.split("#")[0];
  url = url.split("?")[0];
  url = url.split("/");

  return [url[3], url[4]];
}

function sendMedia(chatId, url) {
  trackData = parseUrl(url);
  const mediaType = trackData[0];
  const mediaName = trackData[1];

  switch (mediaType) {
    case "song":
      sendMusic(chatId, mediaName);
      break;
    case "podcast":
      sendPodcast(chatId, mediaName);
      break;
    case "video":
      sendVideo(chatId, mediaName);
      break;
    default:
      sendErrorMessage(chatId);
  }
}

function sendMusic(chatId, mediaName) {
  const musicEndpoint = "https://host2.rj-mw1.com/media/mp3/mp3-320/";
  const musicFileExtension = ".mp3";

  const musicUrl = musicEndpoint + mediaName + musicFileExtension;
  bot.sendAudio(chatId, musicUrl);
}

function sendPodcast(chatId, mediaName) {
  const podcastFileUnavailable =
    "⚠️ در حال حاضر، به دلیل محدودیت تلگرام، فایل‌های پادکست قابل آپلود نیستند.\n👇🏼 می‌تونید پادکست رو از لینک زیر دریافت کنید:\n\n🔗 ";

  const podcastEndpoint = "https://host2.rj-mw1.com/media/podcast/mp3-320/";
  const podcastFileExtension = ".mp3";

  const podcastUrl = podcastEndpoint + mediaName + podcastFileExtension;
  bot.sendMessage(chatId, podcastFileUnavailable + podcastUrl);
}

function sendVideo(chatId, mediaName) {
  const videoFileUnavailable =
    "⚠️ در حال حاضر، به دلیل محدودیت تلگرام، فایل‌های موزیک ویدیو قابل آپلود نیستند.\n👇🏼 می‌تونید پادکست رو از لینک زیر دریافت کنید:\n\n🔗 ";
  const videoEndpoint = "https://host2.rj-mw1.com/media/music_video/hd/";
  const videoFileExtension = ".mp4";

  const videoUrl = videoEndpoint + mediaName + videoFileExtension;
  bot.sendMessage(chatId, videoFileUnavailable + videoUrl);
}

function followRedirects(url) {
  axios.get(url).catch(error => {console.log(error);}).then(response => {
    return response.request._redirectable._currentUrl;
  })
}

bot.on("message", (msg) => {
  const messageText = msg.text;
  const chatId = msg.chat.id;
  const welcomeMessage = "Welcome! 🌹";
  const wrongInputMessage = "I'm affraid that's a wrong input! 😢";

  if (messageText.startsWith("https://")) {
    sendMedia(chatId, messageText);
  } else {
    switch (messageText) {
      case "/start":
        bot.sendMessage(chatId, welcomeMessage);
        break;
      case "📕 راهنما":
        bot.sendMessage(
          chatId,
          "🔼 برای ارسال لینک آهنگ، پادکست یا ویدیو کافیه داخل اپ یا سایت رادیوجوان آهنگ رو Share کنید، تلگرام رو از لیست اپلیکیشن‌ها انتخاب کنید و اون رو برای ربات بفرستید",
          {
            reply_to_message_id: msg.message_id,
          }
        );
        break
      default:
        bot.sendMessage(chatId, wrongInputMessage);
    }
  }
});

bot.on("polling_error", (err) => {
  console.log(err);
});
