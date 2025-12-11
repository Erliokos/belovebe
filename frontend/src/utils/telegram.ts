// Обертка для Telegram Web App API
// Использует глобальный объект window.Telegram.WebApp

interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  initData: any
  openLink: (url: string) => void;
  [key: string]: any;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

// Получаем WebApp из глобального объекта или создаем заглушку
const getWebApp = (): TelegramWebApp => {

  if (import.meta.env.VITE_APP_ENV === 'dev') {    
    return {
      ready: () => { },
      expand: () => { },
      initData: import.meta.env.VITE_INITDATA,
      openLink: (url: string) => {
        window.open(url, '_blank');
      },
    };
  }

  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {    
    return window.Telegram.WebApp;
  }
  
  // Заглушка для development
  return {
    ready: () => {},
    expand: () => {},
    initData: import.meta.env.VITE_INITDATA,
    openLink: (url: string) => {
      window.open(url, '_blank');
    },
  };
};

// Экспортируем WebApp объект
const WebApp = getWebApp();

export default WebApp;

