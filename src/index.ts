import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Bot } from 'grammy';
import { verifyTelegramAuth } from './telegram.js';
import { getYandexUserData } from './yandex.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN || '';
const YANDEX_CLIENT_ID = process.env.YANDEX_CLIENT_ID || '';
const YANDEX_CLIENT_SECRET = process.env.YANDEX_CLIENT_SECRET || '';

app.use(cors());
app.use(express.json());

// 1. Status Ping Endpoint for Mobile App Fallback Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', online: true, timestamp: Date.now() });
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

// 3. Yandex OAuth Callback Route
app.post('/api/auth/yandex', async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Missing OAuth authorization code' });
  }

  try {
    const yandexProfile = await getYandexUserData(code, YANDEX_CLIENT_ID, YANDEX_CLIENT_SECRET);
    return res.json({
      success: true,
      authProvider: 'yandex',
      user: yandexProfile,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Yandex login failed' });
  }
});

// 4. Telegram Bot Initialization (if token is provided)
if (BOT_TOKEN) {
  const bot = new Bot(BOT_TOKEN);
  
  bot.command('start', (ctx) => {
    ctx.reply('Привет! Сервер авторизации Render работает штатно. Используйте приложение для входа.');
  });

  bot.start({
    onStart(botInfo) {
      console.log(`Telegram Bot @${botInfo.username} started successfully!`);
    },
  }).catch((err) => {
    console.error('Telegram Bot failed to start polling:', err);
  });
}

app.listen(PORT, () => {
  console.log(`Render Auth Server running on port ${PORT}`);
});
