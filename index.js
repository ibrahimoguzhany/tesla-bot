const puppeteer = require("puppeteer");
const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const INVENTORY_URL = "https://www.tesla.com/tr_tr/inventory/new/my?arrangeby=plh&range=50";

const bot = new TelegramBot(TELEGRAM_TOKEN);
let sentLinks = [];

async function checkTeslaInventory() {
  console.log("⏱ Kontrol ediliyor...");

  let browser;
  try {
    const browser = await puppeteer.launch({
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox"]
});
    const page = await browser.newPage();
    await page.goto(INVENTORY_URL, { waitUntil: "networkidle2" });

    const vehicles = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("a[data-qa='vehicle-card-link']")).map(link => {
        const title = link.innerText;
        const href = link.href;
        return { title, href };
      });
    });

    const match = vehicles.find(v =>
      v.title.toLowerCase().includes("model y") &&
      !v.title.toLowerCase().includes("long") &&
      !sentLinks.includes(v.href)
    );

    if (match) {
      sentLinks.push(match.href);
      await bot.sendMessage(CHAT_ID, `🚗 *Model Y XP7Y264* bulundu! [Sipariş Ver](${match.href})`, {
        parse_mode: "Markdown"
      });
      console.log("✅ Yeni araç bulundu:", match.href);
    }

  } catch (error) {
    console.error("❌ Hata oluştu:", error.message);
  } finally {
    if (browser) await browser.close();
  }
}

// 🔁 Bu satır eksikse hiçbir şey çalışmaz!
setInterval(checkTeslaInventory, 5000); // 5 saniyede bir
