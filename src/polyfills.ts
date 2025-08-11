import CryptoJS from 'crypto-js';

// Polyfill for Web Crypto API (needed for Keycloak v26+ in development)
if (!globalThis.crypto) {
  globalThis.crypto = {} as Crypto;
}

if (!globalThis.crypto.randomUUID) {
  globalThis.crypto.randomUUID = function(): `${string}-${string}-${string}-${string}-${string}` {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    }) as `${string}-${string}-${string}-${string}-${string}`;
  };
}

// Polyfill for crypto.subtle (needed for PKCE challenge generation)
if (!globalThis.crypto.subtle) {
  Object.defineProperty(globalThis.crypto, 'subtle', {
    value: {
      digest: async function(algorithm: string, data: BufferSource) {
        if (algorithm === 'SHA-256') {
          // Convert BufferSource to string for crypto-js
          const uint8Array = new Uint8Array(data as ArrayBuffer);
          const wordArray = CryptoJS.lib.WordArray.create(uint8Array);
          
          // Use crypto-js for proper SHA-256
          const hash = CryptoJS.SHA256(wordArray);
          
          // Convert back to ArrayBuffer
          const hashBytes = [];
          for (let i = 0; i < hash.words.length; i++) {
            const word = hash.words[i];
            hashBytes.push((word >>> 24) & 0xff);
            hashBytes.push((word >>> 16) & 0xff);
            hashBytes.push((word >>> 8) & 0xff);
            hashBytes.push(word & 0xff);
          }
          
          return new Uint8Array(hashBytes).buffer;
        }
        throw new Error(`Algorithm ${algorithm} not supported in polyfill`);
      }
    } as SubtleCrypto,
    writable: false,
    configurable: true
  });
}

// Ensure getRandomValues is available
if (!globalThis.crypto.getRandomValues) {
  globalThis.crypto.getRandomValues = function<T extends ArrayBufferView | null>(array: T): T {
    if (!array) return array;
    
    const bytes = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
    return array;
  };
}
