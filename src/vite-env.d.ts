/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_XAPI_ENABLED: string
  readonly VITE_XAPI_ENDPOINT: string
  readonly VITE_XAPI_STATEMENTS_PATH: string
  readonly VITE_XAPI_AUTH_TYPE: string
  readonly VITE_XAPI_USERNAME: string
  readonly VITE_XAPI_PASSWORD: string
  readonly VITE_XAPI_TOKEN: string
  readonly VITE_XAPI_ACTOR_HOMEPAGE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
