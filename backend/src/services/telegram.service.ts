import TelegramBot from "node-telegram-bot-api";

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { polling: false });

export async function sendTelegramNotification(chatId: number, text: string) {
  console.log('chatId', chatId);
  try {
    await bot.sendMessage(chatId, text);
  } catch (err) {
    console.error("Telegram notify error:", err);
  }
}
