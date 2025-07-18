/// VeriChain Frontend Hash Utilities
/// Using AI canister hash functions for file integrity

import { ChunkHasherOptions } from '../types/utility.types';

export class ChunkHasher {
  private options: ChunkHasherOptions;

  constructor(options: Partial<ChunkHasherOptions> = {}) {
    this.options = {
      chunkSize: options.chunkSize || 1024 * 1024, // 1MB default
      parallel: options.parallel ?? true,
      algorithm: options.algorithm || 'sha256'
    };
  }

  /**
   * Hash file in chunks (mirrors AI canister logic)
   */
  async hashFile(file: File): Promise<{
    fileHash: string;
    chunkHashes: string[];
    totalChunks: number;
  }> {
    const chunks = this.createChunks(file);
    const chunkHashes: string[] = [];

    if (this.options.parallel) {
      // Hash chunks in parallel
      const hashPromises = chunks.map(chunk => this.hashChunk(chunk));
      chunkHashes.push(...await Promise.all(hashPromises));
    } else {
      // Hash chunks sequentially
      for (const chunk of chunks) {
        const hash = await this.hashChunk(chunk);
        chunkHashes.push(hash);
      }
    }

    // Calculate final file hash from all chunk hashes
    const combinedHashes = chunkHashes.join('');
    const fileHash = await this.calculateSHA256(combinedHashes);

    return {
      fileHash,
      chunkHashes,
      totalChunks: chunks.length
    };
  }

  /**
   * Create file chunks
   */
  private createChunks(file: File): Blob[] {
    const chunks: Blob[] = [];
    const { chunkSize } = this.options;
    
    for (let start = 0; start < file.size; start += chunkSize) {
      const end = Math.min(start + chunkSize, file.size);
      chunks.push(file.slice(start, end));
    }
    
    return chunks;
  }

  /**
   * Hash a single chunk
   */
  private async hashChunk(chunk: Blob): Promise<string> {
    const buffer = await chunk.arrayBuffer();
    return this.calculateSHA256(buffer);
  }

  /**
   * Calculate SHA-256 hash
   */
  private async calculateSHA256(data: string | ArrayBuffer): Promise<string> {
    let buffer: ArrayBuffer;
    
    if (typeof data === 'string') {
      const encoder = new TextEncoder();
      const uint8Array = encoder.encode(data);
      buffer = uint8Array.buffer as ArrayBuffer;
    } else {
      buffer = data;
    }

    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

/**
 * Quick hash functions (mirror AI canister)
 */
export const calculateFileHash = async (file: File): Promise<string> => {
  const hasher = new ChunkHasher();
  const result = await hasher.hashFile(file);
  return result.fileHash;
};

/**
 * Hash string data
 */
export const hashString = async (data: string): Promise<string> => {
  const buffer = new TextEncoder().encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Verify file integrity
 */
export const verifyFileIntegrity = async (
  file: File, 
  expectedHash: string
): Promise<boolean> => {
  try {
    const actualHash = await calculateFileHash(file);
    return actualHash === expectedHash;
  } catch (error) {
    console.error('Hash verification failed:', error);
    return false;
  }
};

/**
 * Generate file fingerprint (combination of hash, size, and type)
 */
export const generateFileFingerprint = async (file: File): Promise<string> => {
  const hash = await calculateFileHash(file);
  const metadata = `${file.size}:${file.type}:${file.lastModified}`;
  const metadataHash = await hashString(metadata);
  return `${hash.substring(0, 16)}:${metadataHash.substring(0, 8)}`;
};
