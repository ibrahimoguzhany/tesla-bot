require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });
const CHAT_ID = process.env.CHAT_ID;
const CHECK_INTERVAL = 30 * 1000; // 30 saniye

const TARGET_URL = 'https://www.tesla.com/tr_tr/inventory/new/my?arrangeby=plh&zip=34340&range=0';

const sentLinks = new Set();

async function checkForVehicles() {
  console.log("🔄 Kontrol ediliyor:", new Date().toLocaleTimeString());

  try {
    const { data: html } = await axios.get(TARGET_URL, { timeout: 10000 }); // timeout eklendi
    const $ = cheerio.load(html);

    $('a').each((_, el) => {
      const href = $(el).attr('href');
      const text = $(el).text();

      if (
        href &&
        href.includes('/inventory/new/my') &&
        !sentLinks.has(href) &&
        text.includes('Model Y') &&
        text.includes('Long Range')
      ) {
        sentLinks.add(href);
        const fullLink = `https://www.tesla.com${href}`;

        bot.sendMessage(
          CHAT_ID,
          `🚗 *Model Y Long Range bulundu!* [Sipariş Ver](${fullLink})`,
          { parse_mode: "Markdown" }
        );

        console.log("✅ Yeni araç bulundu:", fullLink);
      }
    });
  } catch (err) {
    console.error("❌ Hata:", err.message);
  }
}

setInterval(checkForVehicles, CHECK_INTERVAL);
checkForVehicles();