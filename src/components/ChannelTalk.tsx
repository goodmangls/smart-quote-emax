import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

const CHANNEL_TALK_PLUGIN_KEY = import.meta.env.VITE_CHANNEL_TALK_PLUGIN_KEY;

declare global {
  interface Window {
    ChannelIO?: (...args: unknown[]) => void;
    ChannelIOInitialized?: boolean;
  }
}

function bootChannelTalk() {
  if (window.ChannelIO) return;

  const q: unknown[][] = [];
  const ch = function (...args: unknown[]) {
    q.push(args);
  };
  (ch as unknown as Record<string, unknown>).q = q;
  window.ChannelIO = ch;

  const s = document.createElement('script');
  s.type = 'text/javascript';
  s.async = true;
  s.src = 'https://cdn.channel.io/plugin/ch-plugin-web.js';
  const x = document.getElementsByTagName('script')[0];
  x?.parentNode?.insertBefore(s, x);
}

export function ChannelTalk() {
  const { user } = useAuth();
  const { language } = useLanguage();

  useEffect(() => {
    if (!CHANNEL_TALK_PLUGIN_KEY) return;

    bootChannelTalk();

    const channelLang = language === 'ko' ? 'ko' : 'en';

    if (user) {
      window.ChannelIO?.('boot', {
        pluginKey: CHANNEL_TALK_PLUGIN_KEY,
        language: channelLang,
        memberId: String(user.id),
        profile: {
          name: user.name || user.email?.split('@')[0],
          email: user.email,
          company: user.company || undefined,
          role: user.role,
        },
      });
    } else {
      window.ChannelIO?.('boot', {
        pluginKey: CHANNEL_TALK_PLUGIN_KEY,
        language: channelLang,
      });
    }

    return () => {
      window.ChannelIO?.('shutdown');
    };
  }, [user, language]);

  return null;
}
