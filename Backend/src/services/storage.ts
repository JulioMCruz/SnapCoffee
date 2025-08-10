import { createHash } from 'crypto';
import { config } from '@/config';
import sharp from 'sharp';

export class StorageService {
  
  /**
   * Upload image to storage (S3 or local filesystem)
   */
  async uploadImage(imageBuffer: Buffer, filePath: string): Promise<string> {
    try {
      // Optimize image before upload
      const optimizedBuffer = await this.optimizeImage(imageBuffer);
      
      if (config.AWS_S3_BUCKET && config.AWS_ACCESS_KEY_ID) {
        return await this.uploadToS3(optimizedBuffer, filePath);
      } else {
        return await this.uploadToLocal(optimizedBuffer, filePath);
      }
    } catch (error) {
      console.error('Image upload error:', error);
      throw new Error('Failed to upload image');
    }
  }
  
  /**
   * Upload to AWS S3
   */
  private async uploadToS3(imageBuffer: Buffer, filePath: string): Promise<string> {
    try {
      // TODO: Implement AWS S3 upload using AWS SDK
      // For now, simulate S3 upload
      const fileName = filePath.split('/').pop();
      const s3Url = `https://${config.AWS_S3_BUCKET}.s3.${config.AWS_REGION}.amazonaws.com/${filePath}`;
      
      console.log('Simulating S3 upload:', s3Url);
      
      // In production, this would be:
      // const s3 = new AWS.S3({
      //   accessKeyId: config.AWS_ACCESS_KEY_ID,
      //   secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
      //   region: config.AWS_REGION,
      // });
      // 
      // const uploadResult = await s3.upload({
      //   Bucket: config.AWS_S3_BUCKET,
      //   Key: filePath,
      //   Body: imageBuffer,
      //   ContentType: 'image/jpeg',
      //   ACL: 'public-read',
      // }).promise();
      // 
      // return uploadResult.Location;
      
      return s3Url;
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new Error('S3 upload failed');
    }
  }
  
  /**
   * Upload to local filesystem (development)
   */
  private async uploadToLocal(imageBuffer: Buffer, filePath: string): Promise<string> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'uploads');
      const fullDir = path.join(uploadsDir, path.dirname(filePath));
      
      await fs.mkdir(fullDir, { recursive: true });
      
      // Write file
      const fullPath = path.join(uploadsDir, filePath);
      await fs.writeFile(fullPath, imageBuffer);
      
      // Return public URL
      const baseUrl = config.APP_URL || `http://localhost:${config.PORT}`;
      return `${baseUrl}/uploads/${filePath}`;
    } catch (error) {
      console.error('Local upload error:', error);
      throw new Error('Local upload failed');
    }
  }
  
  /**
   * Optimize image for storage
   */
  private async optimizeImage(imageBuffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(imageBuffer)
        .resize(800, 800, { 
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ 
          quality: 85,
          mozjpeg: true,
        })
        .toBuffer();
    } catch (error) {
      console.error('Image optimization error:', error);
      // Return original if optimization fails
      return imageBuffer;
    }
  }
  
  /**
   * Generate image hash for duplicate detection
   */
  async generateImageHash(imageBuffer: Buffer): Promise<string> {
    try {
      // Generate SHA-256 hash of image content
      const hash = createHash('sha256');
      hash.update(imageBuffer);
      return hash.digest('hex');
    } catch (error) {
      console.error('Hash generation error:', error);
      return '';
    }
  }
  
  /**
   * Generate thumbnail
   */
  async generateThumbnail(imageBuffer: Buffer, size: number = 200): Promise<Buffer> {
    try {
      return await sharp(imageBuffer)
        .resize(size, size, { 
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 80 })
        .toBuffer();
    } catch (error) {
      console.error('Thumbnail generation error:', error);
      throw new Error('Failed to generate thumbnail');
    }
  }
  
  /**
   * Delete image from storage
   */
  async deleteImage(imageUrl: string): Promise<boolean> {
    try {
      if (imageUrl.includes('s3.amazonaws.com')) {
        return await this.deleteFromS3(imageUrl);
      } else {
        return await this.deleteFromLocal(imageUrl);
      }
    } catch (error) {
      console.error('Image deletion error:', error);
      return false;
    }
  }
  
  /**
   * Delete from S3
   */
  private async deleteFromS3(imageUrl: string): Promise<boolean> {
    try {
      // TODO: Implement S3 deletion
      console.log('Simulating S3 deletion:', imageUrl);
      return true;
    } catch (error) {
      console.error('S3 deletion error:', error);
      return false;
    }
  }
  
  /**
   * Delete from local filesystem
   */
  private async deleteFromLocal(imageUrl: string): Promise<boolean> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      // Extract file path from URL
      const urlPath = new URL(imageUrl).pathname;
      const filePath = path.join(process.cwd(), urlPath);
      
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.error('Local deletion error:', error);
      return false;
    }
  }
  
  /**
   * Get image metadata
   */
  async getImageMetadata(imageBuffer: Buffer): Promise<{
    width: number;
    height: number;
    format: string;
    size: number;
  }> {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      
      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
        size: imageBuffer.length,
      };
    } catch (error) {
      console.error('Metadata extraction error:', error);
      throw new Error('Failed to extract image metadata');
    }
  }
  
  /**
   * Validate image file
   */
  async validateImage(imageBuffer: Buffer): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    
    try {
      const metadata = await sharp(imageBuffer).metadata();
      
      if (!metadata.width || !metadata.height) {
        errors.push('Invalid image format');
      }
      
      if (metadata.width && metadata.width < 200) {
        errors.push('Image width too small (minimum 200px)');
      }
      
      if (metadata.height && metadata.height < 200) {
        errors.push('Image height too small (minimum 200px)');
      }
      
      if (imageBuffer.length > 10 * 1024 * 1024) { // 10MB
        errors.push('Image file too large (maximum 10MB)');
      }
      
      const allowedFormats = ['jpeg', 'jpg', 'png', 'webp'];
      if (metadata.format && !allowedFormats.includes(metadata.format)) {
        errors.push('Unsupported image format (use JPEG, PNG, or WebP)');
      }
      
      return {
        valid: errors.length === 0,
        errors,
      };
    } catch (error) {
      console.error('Image validation error:', error);
      return {
        valid: false,
        errors: ['Failed to process image'],
      };
    }
  }
}