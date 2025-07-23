/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly CANISTER_ID_AI_CANISTER: string;
  readonly CANISTER_ID_LOGIC_CANISTER: string;
  readonly CANISTER_ID_FRONTEND: string;
  readonly CANISTER_ID_INTERNET_IDENTITY: string;
  readonly DFX_NETWORK: string;
  readonly NODE_ENV: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
