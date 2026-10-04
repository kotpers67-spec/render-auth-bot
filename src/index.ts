import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { Bot } from 'grammy';
import { verifyTelegramAuth } from './telegram.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;
const BOT_TOKEN = process.env.BOT_TOKEN || '';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve Web Application Frontend
const publicPath = path.resolve('public');
app.use(express.static(publicPath));

// 1. Health Status Ping Endpoint for Mobile App Fallback Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', online: true, service: 'web-portal-auth', timestamp: Date.now() });
});

// 2. Telegram Auth Verification Route
app.post('/api/auth/telegram', (req, res) => {
  const { initData } = req.body;
  if (!initData) {
    return res.status(400).json({ error: 'Missing initData' });
  }

  const isValid = verifyTelegramAuth(initData, BOT_TOKEN);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid Telegram HMAC signature' });
  }

  const params = new URLSearchParams(initData);
  const userJson = params.get('user');
  const user = userJson ? JSON.parse(userJson) : null;

  return res.json({
    success: true,
    authProvider: 'telegram',
    user: user || { id: params.get('id'), first_name: params.get('first_name') },
  });
});

// 3. Fallback Route for Single Page Application
app.get('*', (req, res) => {
  const indexPath = path.join(publicPath, 'index.html');
  res.sendFile(indexPath);
});

// In-Memory store for 5-minute dynamic Telegram OTP codes
interface OtpRecord {
  code: string;
  expiresAt: number;
}
const botOtpStore = new Map<string, OtpRecord>();

// 4. Telegram Bot Initialization
if (BOT_TOKEN) {
  const bot = new Bot(BOT_TOKEN);
  
  bot.command('start', (ctx) => {
    const welcomeText = 
      `🏋️ *Fitness Ecosystem Pro*\n` +
      `Официальный сервис авторизации и синхронизации.\n\n` +
      `Доступные команды:\n` +
      `🔑 /code — Получить одноразовый 6-значный код входа (действует 5 минут)\n` +
      `🔗 /link — Инструкция по привязке аккаунта\n` +
      `👥 /owners — Связаться с создателями проекта\n\n` +
      `Каждый код действует строго 300 секунд. Старые коды мгновенно аннулируются.`;
    ctx.reply(welcomeText, { parse_mode: 'Markdown' });
  });

  bot.command('code', (ctx) => {
    const username = (ctx.from?.username || String(ctx.from?.id)).toLowerCase();
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 5 * 60 * 1000;

    botOtpStore.set(username, { code, expiresAt });

    const msg = 
      `🔐 *Ваш одноразовый 6-значный код:*\n\n` +
      `\`${code}\`\n\n` +
      `⏱ Код действует строго *5 минут* (300 сек).\n` +
      `Все предыдущие коды стали недействительными. Никому не сообщайте его.`;
    ctx.reply(msg, { parse_mode: 'Markdown' });
  });

  bot.command('owners', (ctx) => {
    const msg = 
      `👥 *Создатели и владельцы Fitness Ecosystem Pro:*\n\n` +
      `• [@SantiLA213](https://t.me/SantiLA213)\n` +
      `• [@Spirit5449](https://t.me/Spirit5449)\n\n` +
      `Напишите по любым вопросам, техническим предложениям и сотрудничеству.`;
    ctx.reply(msg, { parse_mode: 'Markdown', link_preview_options: { is_disabled: false } });
  });

  bot.command('link', (ctx) => {
    const username = ctx.from?.username ? `@${ctx.from.username}` : 'Ваш аккаунт';
    const msg = 
      `🔗 *Привязка аккаунта к Telegram:*\n\n` +
      `1. Войдите в свой профиль на сайте или в мобильном приложении.\n` +
      `2. В блоке «TELEGRAM И БЕЗОПАСНОСТЬ» нажмите кнопку *Привязать Telegram*.\n` +
      `3. Укажите ваш логин: ${username}\n` +
      `4. Введите 6-значный код из команды /code для подтверждения.\n` +
      `После привязки вы сможете активировать 2FA защиту для всех входов!`;
    ctx.reply(msg, { parse_mode: 'Markdown' });
  });

  bot.start({
    onStart(botInfo) {
      console.log(`Telegram Bot @${botInfo.username} started successfully!`);
    },
  }).catch((err) => {
    console.error('Telegram Bot polling error:', err);
  });
} else {
  console.warn('BOT_TOKEN is missing! Set BOT_TOKEN in Render Environment Variables.');
}

app.listen(PORT, () => {
  console.log(`Web App & Telegram Auth Server running on port ${PORT}`);
});
