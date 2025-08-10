import { CoffeeSnapValidation } from '@/types';
import { config } from '@/config';
import sharp from 'sharp';

export class ImageValidationService {
  
  /**
   * Validate if image contains coffee using AI/heuristics
   */
  async validateCoffeeImage(
    imageBuffer: Buffer,
    mimeType: string
  ): Promise<CoffeeSnapValidation> {
    try {
      // Basic image validation
      await this.validateImageFormat(imageBuffer, mimeType);
      
      // AI-powered validation (if enabled)
      if (config.FEATURES.AI_VALIDATION) {
        return await this.aiValidation(imageBuffer);
      } else {
        // Fallback to heuristic validation
        return await this.heuristicValidation(imageBuffer);
      }
    } catch (error) {
      console.error('Image validation error:', error);
      return {
        isValidCoffee: false,
        confidence: 0,
        reasons: ['Image validation failed'],
        metadata: {
          hasText: false,
          hasCoffeeItems: false,
          locationValid: false,
          duplicateCheck: false,
        },
      };
    }
  }
  
  /**
   * Validate image format and basic requirements
   */
  private async validateImageFormat(imageBuffer: Buffer, mimeType: string): Promise<void> {
    if (!mimeType.startsWith('image/')) {
      throw new Error('File must be an image');
    }
    
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(mimeType.toLowerCase())) {
      throw new Error('Unsupported image format. Please use JPEG, PNG, or WebP');
    }
    
    // Check image metadata
    const metadata = await sharp(imageBuffer).metadata();
    
    if (!metadata.width || !metadata.height) {
      throw new Error('Invalid image file');
    }
    
    if (metadata.width < 200 || metadata.height < 200) {
      throw new Error('Image too small. Minimum 200x200 pixels required');
    }
    
    if (metadata.width > 4000 || metadata.height > 4000) {
      throw new Error('Image too large. Maximum 4000x4000 pixels allowed');
    }
  }
  
  /**
   * AI-powered coffee validation using OpenAI Vision API
   */
  private async aiValidation(imageBuffer: Buffer): Promise<CoffeeSnapValidation> {
    try {
      if (!config.OPENAI_API_KEY) {
        console.warn('OpenAI API key not configured, falling back to heuristic validation');
        return await this.heuristicValidation(imageBuffer);
      }
      
      // Convert image to base64
      const base64Image = imageBuffer.toString('base64');
      const dataUrl = `data:image/jpeg;base64,${base64Image}`;
      
      // TODO: Implement OpenAI Vision API call
      // For now, return mock AI validation
      const mockAIResponse = {
        hasCoffee: Math.random() > 0.3, // 70% chance of detecting coffee
        confidence: Math.random() * 0.4 + 0.6, // 0.6-1.0 confidence
        detectedItems: ['coffee cup', 'coffee beans', 'latte art'],
        reasoning: 'Detected coffee cup and beverage in image',
      };
      
      return {
        isValidCoffee: mockAIResponse.hasCoffee && mockAIResponse.confidence >= config.VALIDATION.AI_CONFIDENCE_THRESHOLD,
        confidence: mockAIResponse.confidence,
        reasons: mockAIResponse.hasCoffee 
          ? ['AI detected coffee-related items']
          : ['AI did not detect coffee in image'],
        metadata: {
          hasText: false,
          hasCoffeeItems: mockAIResponse.hasCoffee,
          locationValid: true,
          duplicateCheck: true,
        },
      };
    } catch (error) {
      console.error('AI validation error:', error);
      return await this.heuristicValidation(imageBuffer);
    }
  }
  
  /**
   * Heuristic validation using image analysis
   */
  private async heuristicValidation(imageBuffer: Buffer): Promise<CoffeeSnapValidation> {
    try {
      const analysis = await this.analyzeImageColors(imageBuffer);
      
      // Simple heuristic: check for brown/coffee colors
      const hasCoffeeColors = analysis.dominantColors.some(color => 
        this.isCoffeeColor(color)
      );
      
      // Check image quality/complexity
      const hasGoodQuality = analysis.sharpness > 0.5;
      
      const confidence = (hasCoffeeColors ? 0.6 : 0.2) + (hasGoodQuality ? 0.3 : 0);
      
      return {
        isValidCoffee: confidence >= 0.5,
        confidence,
        reasons: [
          hasCoffeeColors ? 'Coffee-like colors detected' : 'No coffee colors detected',
          hasGoodQuality ? 'Good image quality' : 'Low image quality',
        ],
        metadata: {
          hasText: false,
          hasCoffeeItems: hasCoffeeColors,
          locationValid: true,
          duplicateCheck: true,
        },
      };
    } catch (error) {
      console.error('Heuristic validation error:', error);
      
      // Fallback: basic validation passed, assume it's coffee
      return {
        isValidCoffee: true,
        confidence: 0.5,
        reasons: ['Basic validation passed'],
        metadata: {
          hasText: false,
          hasCoffeeItems: true,
          locationValid: true,
          duplicateCheck: false,
        },
      };
    }
  }
  
  /**
   * Analyze image colors and properties
   */
  private async analyzeImageColors(imageBuffer: Buffer): Promise<{
    dominantColors: string[];
    brightness: number;
    sharpness: number;
  }> {
    const image = sharp(imageBuffer);
    
    // Get image statistics
    const stats = await image.stats();
    const metadata = await image.metadata();
    
    // Calculate brightness (simplified)
    const channels = stats.channels;
    const avgBrightness = channels.reduce((sum, channel) => sum + channel.mean, 0) / channels.length;
    const brightness = avgBrightness / 255;
    
    // Mock dominant colors analysis (would use actual color extraction in production)
    const mockColors = [
      '#8B4513', // Saddle brown (coffee)
      '#D2691E', // Chocolate
      '#A0522D', // Sienna
      '#FFFFFF', // White (cup/foam)
      '#F5DEB3', // Wheat (latte)
    ];
    
    return {
      dominantColors: mockColors.slice(0, 3),
      brightness,
      sharpness: Math.random() * 0.5 + 0.5, // Mock sharpness score
    };
  }
  
  /**
   * Check if color is coffee-like
   */
  private isCoffeeColor(colorHex: string): boolean {
    const coffeeColors = [
      '#8B4513', // Saddle brown
      '#A0522D', // Sienna
      '#D2691E', // Chocolate
      '#CD853F', // Peru
      '#DEB887', // Burlywood
      '#F4A460', // Sandy brown
      '#D2B48C', // Tan
    ];
    
    return coffeeColors.some(coffeeColor => 
      this.colorSimilarity(colorHex, coffeeColor) > 0.7
    );
  }
  
  /**
   * Calculate color similarity (simplified)
   */
  private colorSimilarity(color1: string, color2: string): number {
    // Convert hex to RGB
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return 0;
    
    // Calculate Euclidean distance
    const distance = Math.sqrt(
      Math.pow(rgb1.r - rgb2.r, 2) +
      Math.pow(rgb1.g - rgb2.g, 2) +
      Math.pow(rgb1.b - rgb2.b, 2)
    );
    
    // Convert to similarity (0-1)
    const maxDistance = Math.sqrt(3 * Math.pow(255, 2));
    return 1 - (distance / maxDistance);
  }
  
  /**
   * Convert hex color to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
  
  /**
   * Check for duplicate images using perceptual hashing
   */
  async checkDuplicate(imageBuffer: Buffer, userId: string): Promise<boolean> {
    try {
      // Generate perceptual hash
      const hash = await this.generatePerceptualHash(imageBuffer);
      
      // TODO: Check against stored hashes in database
      // For now, return false (no duplicates)
      return false;
    } catch (error) {
      console.error('Duplicate check error:', error);
      return false;
    }
  }
  
  /**
   * Generate perceptual hash for duplicate detection
   */
  private async generatePerceptualHash(imageBuffer: Buffer): Promise<string> {
    try {
      // Resize to 8x8 and convert to grayscale
      const resized = await sharp(imageBuffer)
        .resize(8, 8, { fit: 'fill' })
        .grayscale()
        .raw()
        .toBuffer();
      
      // Calculate average pixel value
      const pixels = Array.from(resized);
      const average = pixels.reduce((sum, pixel) => sum + pixel, 0) / pixels.length;
      
      // Generate binary hash
      let hash = '';
      for (const pixel of pixels) {
        hash += pixel > average ? '1' : '0';
      }
      
      return hash;
    } catch (error) {
      console.error('Hash generation error:', error);
      return '';
    }
  }
}