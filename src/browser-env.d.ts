
declare module 'react-dom/client' {
  import type { ReactNode } from 'react';

  interface Root {
    render(children: ReactNode): void;
    unmount(): void;
  }

  interface ReactDOMClient {
    createRoot(container: Element | DocumentFragment): Root;
  }

  export function createRoot(container: Element | DocumentFragment): Root;
  const ReactDOM: ReactDOMClient;
  export default ReactDOM;
}

declare global {
  interface ImportMetaEnv {
    readonly VITE_NEXT_SSR?: boolean;
    readonly VITE_SUPABASE_URL?: string;
    readonly VITE_SUPABASE_ANON_KEY?: string;
    readonly VITE_SITE_URL?: string;
    readonly VITE_ADMIN_EMAIL?: string;
    readonly VITE_ADMIN_LOGIN_EMAIL?: string;
    readonly VITE_EMAILJS_PUBLIC_KEY?: string;
    readonly VITE_EMAILJS_SERVICE_ID?: string;
    readonly VITE_EMAILJS_TEMPLATE_ADMIN?: string;
    readonly VITE_EMAILJS_TEMPLATE_WELCOME?: string;
  }
  interface ImportMeta { readonly env: ImportMetaEnv }
  interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
  }

  interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
  }

  interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
  }

  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
    readonly message: string;
  }

  interface SpeechRecognition extends EventTarget {
    lang: string;
    interimResults: boolean;
    maxAlternatives: number;
    onstart: ((this: SpeechRecognition, ev: Event) => unknown) | null;
    onend: ((this: SpeechRecognition, ev: Event) => unknown) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => unknown) | null;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => unknown) | null;
    start(): void;
    stop(): void;
    abort(): void;
  }

  interface Window {
    SpeechRecognition?: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition?: {
      new (): SpeechRecognition;
    };
  }
}

export {};
