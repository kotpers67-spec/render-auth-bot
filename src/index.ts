import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Bot } from 'grammy';
import { verifyTelegramAuth } from './telegram.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;
const BOT_TOKEN = process.env.BOT_TOKEN || '';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve Web Application Frontend
const publicPath = path.join(__dirname, '..', 'public');
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

// 4. Telegram Bot Initialization
if (BOT_TOKEN) {
  const bot = new Bot(BOT_TOKEN);
  
  bot.command('start', (ctx) => {
    ctx.reply('Привет! Веб-сайт и бот авторизации Render работают 24/7.');
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
