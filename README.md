# Render Auth Bot & Fallback Handler

Авторизация через Telegram и Яндекс для Render.com с поддержкой автономного локального входа в мобильных приложениях.

## 🚀 Особенности
- **Telegram Auth**: Валидация подписи HMAC-SHA256 (`/api/auth/telegram`).
- **Яндекс ID OAuth 2.0**: Обмен кодов авторизации на профиль (`/api/auth/yandex`).
- **Offline Fallback**: Эндпоинт `/health` для проверки доступности сервера за 3 секунды. Если Render выключен, мобильное приложение работает штатно с локального диска.
- **Render.com Ready**: Включен файл `render.yaml` для мгновенного развертывания.

## 📱 Android Kotlin Fallback Snippet

```kotlin
import kotlinx.coroutines.withTimeout

suspend fun attemptOnlineAuthWithFallback(
    onlineAuthTask: suspend () -> UserProfile,
    localDiskFallbackTask: suspend () -> UserProfile
): UserProfile {
    return try {
        // Пробуем войти через Render (Telegram/Яндекс) с таймаутом 3 сек
        withTimeout(3000) {
            onlineAuthTask()
        }
    } catch (e: Exception) {
        // Render недоступен или выключен -> Вход штатно с диска ПК/телефона
        localDiskFallbackTask()
    }
}
```

## 🛠️ Запуск локально
```bash
npm install
npm run dev
```
