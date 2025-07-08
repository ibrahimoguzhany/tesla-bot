require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });
const CHAT_ID = process.env.CHAT_ID;
const CHECK_INTERVAL = 30 * 1000;

const TARGET_URL = 'https://www.tesla.com/tr_tr/inventory/new/my?arrangeby=plh&zip=34340&range=0';

const sentLinks = new Set();

async function checkForVehicles() {
  try {
    const response = await axios.get(TARGET_URL);
    const $ = cheerio.load(response.data);

    $("a[data-qa='vehicle-card-link']").each((_, element) => {
      const title = $(element).text();
      const href = $(element).attr('href');

      // 🔍 Filtre: Model Y içerecek, Long geçmeyecek, daha önce gönderilmemiş olacak
      if (
        href &&
        title.toLowerCase().includes("model y") &&
        !title.toLowerCase().includes("long") &&
        !sentLinks.has(href)
      ) {
        const fullLink = `https://www.tesla.com${href}`;
        sentLinks.add(href);

        bot.sendMessage(
          CHAT_ID,
          `🚗 *Model Y bulundu!*\n[Linke gitmek için tıkla](${fullLink})\n\n*Araç*: ${title}`,
          { parse_mode: "Markdown" }
        );

        console.log("✅ Yeni araç bulundu:", fullLink);
      }
    });

  } catch (error) {
    console.error("❌ Hata:", error.message);
  }
}

setInterval(checkForVehicles, CHECK_INTERVAL);
checkForVehicles();