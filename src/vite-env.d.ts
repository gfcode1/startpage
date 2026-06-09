/// <reference types="vite/client" />

declare module '*.css' {
  const content: string
  export default content
}

declare module '*.json' {
  const value: unknown
  export default value
}

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
