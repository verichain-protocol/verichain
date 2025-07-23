/// VeriChain Frontend Validation Utilities
/// Using AI canister validation functions

import { FileValidationOptions, ValidationError } from '../types/utility.types';

export class FileValidator {
  private static readonly DEFAULT_MAX_SIZE = 100 * 1024 * 1024; // 100MB
  private static readonly SUPPORTED_IMAGE_TYPES = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif'
  ];
  private static readonly SUPPORTED_VIDEO_TYPES = [
    'video/mp4', 'video/webm', 'video/avi', 'video/mov'
  ];

  /**
   * Validate file using AI canister validation functions
   */
  static async validateFile(
    file: File, 
    options: FileValidationOptions = {}
  ): Promise<{ isValid: boolean; errors: ValidationError[] }> {
    const errors: ValidationError[] = [];
    const maxSize = options.maxSize || this.DEFAULT_MAX_SIZE;
    const allowedTypes = options.allowedTypes || [
      ...this.SUPPORTED_IMAGE_TYPES,
      ...this.SUPPORTED_VIDEO_TYPES
    ];

    // Size validation (mirrors AI canister logic)
    if (file.size > maxSize) {
      errors.push({
        code: 'FILE_TOO_LARGE',
        message: `File size ${this.formatBytes(file.size)} exceeds maximum ${this.formatBytes(maxSize)}`,
        field: 'size'
      });
    }

    // Type validation (mirrors AI canister logic)
    if (!allowedTypes.includes(file.type)) {
      errors.push({
        code: 'INVALID_FILE_TYPE',
        message: `File type ${file.type} is not supported`,
        field: 'type'
      });
    }

    // Extension validation (mirrors AI canister logic)
    const extension = this.getFileExtension(file.name);
    if (!this.isValidExtension(extension, file.type)) {
      errors.push({
        code: 'EXTENSION_MISMATCH',
        message: `File extension .${extension} does not match MIME type ${file.type}`,
        field: 'extension'
      });
    }

    // Signature validation if required (calls AI canister)
    if (options.requireSignature) {
      try {
        const isValidSignature = await this.validateFileSignature(file);
        if (!isValidSignature) {
          errors.push({
            code: 'INVALID_SIGNATURE',
            message: 'File signature validation failed',
            field: 'signature'
          });
        }
      } catch (error) {
        errors.push({
          code: 'SIGNATURE_CHECK_FAILED',
          message: 'Unable to validate file signature',
          field: 'signature'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get file extension from filename
   */
  private static getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * Check if extension matches MIME type
   */
  private static isValidExtension(extension: string, mimeType: string): boolean {
    const mimeExtensionMap: Record<string, string[]> = {
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/webp': ['webp'],
      'image/gif': ['gif'],
      'video/mp4': ['mp4'],
      'video/webm': ['webm'],
      'video/avi': ['avi'],
      'video/mov': ['mov', 'qt']
    };

    const validExtensions = mimeExtensionMap[mimeType] || [];
    return validExtensions.includes(extension);
  }

  /**
   * Call AI canister to validate file signature
   */
  private static async validateFileSignature(file: File): Promise<boolean> {
    // This would call the AI canister's validate_file_format function
    // For now, we'll implement basic signature checking
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer, 0, Math.min(16, buffer.byteLength));
    
    // Check common file signatures
    const signature = Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // JPEG signatures
    if (signature.startsWith('ffd8ff')) return true;
    // PNG signature
    if (signature.startsWith('89504e47')) return true;
    // WebP signature
    if (signature.includes('57454250')) return true;
    // MP4 signatures
    if (signature.includes('66747970')) return true;

    return false;
  }

  /**
   * Format bytes to human readable string
   */
  private static formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}

/**
 * Quick validation functions that mirror AI canister
 */
export const validateFileFormat = async (filename: string): Promise<boolean> => {
  const extension = filename.split('.').pop()?.toLowerCase();
  const supportedFormats = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'webm', 'avi', 'mov'];
  return supportedFormats.includes(extension || '');
};

export const validateMediaDimensions = (width: number, height: number): boolean => {
  const MIN_DIMENSION = 32;
  const MAX_DIMENSION = 4096;
  return width >= MIN_DIMENSION && height >= MIN_DIMENSION &&
         width <= MAX_DIMENSION && height <= MAX_DIMENSION;
};
