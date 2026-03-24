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
