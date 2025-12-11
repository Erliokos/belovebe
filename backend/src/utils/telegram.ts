import crypto from 'crypto';

interface TelegramInitData {
  query_id?: string;
  user?: string;
  auth_date?: string;
  hash?: string;
  [key: string]: string | undefined;
}

/**
 * Валидирует initData от Telegram Web App
 * @param initData - строка initData от Telegram
 * @param botToken - токен бота
 * @returns true если данные валидны
 */
export function validateTelegramInitData(
  initData: string,
  botToken: string
): boolean {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    
    if (!hash) {
      return false;
    }

    // Удаляем hash из параметров для проверки
    urlParams.delete('hash');
    
    // Сортируем параметры по ключу
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Создаем секретный ключ
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    // Вычисляем хеш
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    return calculatedHash === hash;
  } catch (error) {
    console.error('Error validating Telegram initData:', error);
    return false;
  }
}

/**
 * Парсит initData и возвращает объект с данными пользователя
 */
export function parseTelegramInitData(initData: string): {
  user?: {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
    is_bot?: boolean;
    language_code?: string;
  };
  auth_date?: number;
} {
  const urlParams = new URLSearchParams(initData);
  const userParam = urlParams.get('user');
  
  if (!userParam) {
    return {};
  }

  try {
    const user = JSON.parse(userParam);
    const authDate = urlParams.get('auth_date');
    
    return {
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        is_bot: user.is_bot,
        language_code: user.language_code,
      },
      auth_date: authDate ? parseInt(authDate, 10) : undefined,
    };
  } catch (error) {
    console.error('Error parsing Telegram user data:', error);
    return {};
  }
}

