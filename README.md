# Fitness Ecosystem Pro Web & Telegram Bot

Официальный веб-портал, бот авторизации и центр загрузки релизов мобильных приложений экосистемы Fitness Pro.

## 🚀 Возможности
- **Веб-приложение (PWA)**: Личные кабинеты атлета и тренера, интерактивные графики прогресса (3 шкалы: вес, подходы, повторения), учет веса тела.
- **Telegram Bot (grammY)**: Двухфакторная аутентификация (2FA), быстрая авторизация по одноразовым 5-минутным OTP-кодам, привязка аккаунтов.
- **Динамическая ротация PIN**: 5-минутная смена защитного кода привязки подопечного к тренеру.
- **Раздача релизных APK**: Прямые ссылки на загрузку актуальных мобильных приложений для Android:
  - `/releases/athlete-pro-v1.0.7.apk` (Athlete Pro)
  - `/releases/trainer-pro-v1.0.7.apk` (Trainer Pro)

## ⚙️ Развертывание на Render.com
1. Создайте Web Service на [Render.com](https://render.com).
2. Подключите репозиторий `kotpers67-spec/render-auth-bot`.
3. Укажите параметры:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Добавьте переменную окружения (Environment Variable):
   - `BOT_TOKEN`: токен вашего бота от `@BotFather`
   - `PORT`: `10000` (выставляется автоматически)

## 🛠️ Запуск локально
```bash
npm install
npm start
```
Сервер будет доступен по адресу `http://localhost:3000`.
