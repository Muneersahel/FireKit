import type { FirekitApi } from "../shared/ipc";

declare global {
  interface Window {
    firekit: FirekitApi;
  }
}

export {};
