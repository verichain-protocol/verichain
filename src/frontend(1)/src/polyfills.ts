/**
 * Global polyfills for browser compatibility
 */

// Ensure global is available
if (typeof globalThis !== 'undefined') {
  (globalThis as any).global = globalThis;
} else if (typeof window !== 'undefined') {
  (window as any).global = window;
} else if (typeof self !== 'undefined') {
  (self as any).global = self;
}

// Buffer polyfill for IC agent
if (typeof Buffer === 'undefined') {
  (globalThis as any).Buffer = {
    from: (data: any, encoding?: string) => new Uint8Array(data),
    isBuffer: (obj: any) => false,
  };
}

export {};
