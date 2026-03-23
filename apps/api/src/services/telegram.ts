import axios from "axios";

export async function notifyTelegramOnFailure(message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    // Chưa cấu hình, bỏ qua để không làm fail test run
    return;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    await axios.post(url, {
      chat_id: chatId,
      text: message,
      parse_mode: "Markdown",
    });
  } catch (err) {
    // Không ném lỗi ra ngoài để tránh làm hỏng luồng thực thi chính
    console.error("Failed to send Telegram notification", err);
  }
}

