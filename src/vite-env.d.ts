/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  readonly VITE_SENTRY_DSN: string;
  readonly VITE_CHANNEL_TALK_PLUGIN_KEY: string;
  readonly VITE_ENABLE_SENTRY: string;
  readonly VITE_EIA_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
