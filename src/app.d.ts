/// <reference types="@sveltejs/kit" />
import PocketBase from 'pocketbase';

declare global {
    namespace App {
        interface Locals {
            pb: PocketBase;
        }
    }
}

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly PUBLIC_POCKETBASE_URL: string;
  readonly PUBLIC_OAUTH_REDIRECT_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

export {};
