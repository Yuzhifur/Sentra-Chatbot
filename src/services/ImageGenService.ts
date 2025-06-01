// src/services/ImageGenService.ts
import { initializeApp } from "firebase/app";
import { getAI, getImagenModel, GoogleAIBackend, ImagenAspectRatio, ImagenImageFormat } from "firebase/ai";

export interface CharacterData {
  name: string;
  age?: number;
  gender?: string;
  species?: string;
  characterDescription: string;
  temperament: string;
  appearance?: string;
  outfit?: string;
  job?: string;
  residence?: string;
  specialAbility?: string;
}

export class ImageGenService {
  private static ai: any = null;
  private static imagenModel: any = null;

  /**
   * Initialize the Firebase AI Logic service
   */
  private static async initializeAI() {
    if (this.ai && this.imagenModel) {
      return;
    }

    try {
      // Get Firebase app instance (assuming it's already initialized)
      const firebaseApp = (await import('../index')).default || initializeApp();

      // Initialize the Gemini Developer API backend service
      this.ai = getAI(firebaseApp, { backend: new GoogleAIBackend() });

      // Create ImagenModel instance with configuration optimized for avatars
      this.imagenModel = getImagenModel(this.ai, {
        model: "imagen-3.0-generate-002",
        generationConfig: {
          numberOfImages: 1,
          imageFormat: ImagenImageFormat.png(), // PNG for quality
        }
      });
    } catch (error) {
      console.error("Error initializing Firebase AI Logic:", error);
      throw new Error("Failed to initialize AI service for avatar generation");
    }
  }

  /**
   * Check if minimum required fields are filled for avatar generation
   */
  static validateMinimumFields(characterData: CharacterData): boolean {
    return !!(
      characterData.name?.trim() &&
      characterData.characterDescription?.trim() &&
      characterData.temperament?.trim()
    );
  }

  /**
   * Build a descriptive prompt for avatar generation based on character data
   */
  private static buildAvatarPrompt(characterData: CharacterData): string {
    const parts = [];

    // Core description
    parts.push(`A high-quality, impressive photo taken for ${characterData.name} used as a profile picture`);

    // Physical attributes
    if (characterData.age) {
      parts.push(`aged ${characterData.age}`);
    }

    if (characterData.gender) {
      parts.push(`${characterData.gender.toLowerCase()}`);
    }

    if (characterData.species && characterData.species.toLowerCase() !== 'human') {
      parts.push(`${characterData.species.toLowerCase()}`);
    }

    // Character description
    if (characterData.characterDescription) {
      parts.push(`described as: ${characterData.characterDescription}`);
    }

    // Personality/temperament
    if (characterData.temperament) {
      parts.push(`with ${characterData.temperament.toLowerCase()} personality`);
    }

    // Appearance details
    if (characterData.appearance) {
      parts.push(`appearance: ${characterData.appearance}`);
    }

    // Outfit/clothing
    if (characterData.outfit) {
      parts.push(`wearing ${characterData.outfit}`);
    }

    // Professional context
    if (characterData.job) {
      parts.push(`working as ${characterData.job}`);
    }

    // Special abilities (fantasy elements)
    if (characterData.specialAbility) {
      parts.push(`with special ability: ${characterData.specialAbility}`);
    }

    const prompt = parts.join(', ') + '. Anime style, studio ghibli, used as avatar/profile picture, high quality, detailed and creative background.';

    console.log('Generated avatar prompt:', prompt);
    return prompt;
  }

  /**
   * Convert base64 image data to File object
   */
  private static base64ToFile(base64Data: string, filename: string, mimeType: string): File {
    try {
      // Remove data URL prefix if present
      const base64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');

      // Convert base64 to bytes
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);

      // Create File object
      return new File([byteArray], filename, { type: mimeType });
    } catch (error) {
      console.error('Error converting base64 to file:', error);
      throw new Error('Failed to process generated avatar image');
    }
  }

  /**
   * Generate avatar for character
   */
  static async generateAvatar(characterData: CharacterData): Promise<File> {
    try {
      // Validate minimum required fields
      if (!this.validateMinimumFields(characterData)) {
        throw new Error('Please fill in at least the character name, description, and temperament before generating an avatar.');
      }

      // Initialize AI service if not already done
      await this.initializeAI();

      // Build prompt
      const prompt = this.buildAvatarPrompt(characterData);

      // Generate image
      console.log('Generating avatar with ImageGen...');
      const response = await this.imagenModel.generateImages(prompt);

      // Handle filtered content
      if (response.filteredReason) {
        console.warn('Avatar generation was filtered:', response.filteredReason);
        throw new Error('Avatar generation was blocked due to content filters. Please try adjusting your character description.');
      }

      // Check if we got images
      if (!response.images || response.images.length === 0) {
        throw new Error('No avatar was generated. Please try again or adjust your character description.');
      }

      const generatedImage = response.images[0];

      // Convert base64 to File
      const filename = `${characterData.name.replace(/[^a-zA-Z0-9]/g, '_')}_avatar.png`;
      const avatarFile = this.base64ToFile(
        generatedImage.bytesBase64Encoded,
        filename,
        generatedImage.mimeType
      );

      console.log('Avatar generated successfully:', filename);
      return avatarFile;

    } catch (error) {
      console.error('Error generating avatar:', error);

      // Provide user-friendly error messages
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('Failed to generate avatar. Please check your internet connection and try again.');
      }
    }
  }

  /**
   * Get a hint about avatar generation quality based on filled fields
   */
  static getGenerationHint(characterData: CharacterData): string {
    const filledFields = [
      characterData.name,
      characterData.characterDescription,
      characterData.temperament,
      characterData.appearance,
      characterData.outfit,
      characterData.gender,
      characterData.age,
      characterData.species,
      characterData.job,
      characterData.specialAbility
    ].filter(field => field && field.toString().trim()).length;

    if (filledFields < 3) {
      return "Fill in more character details for better avatar generation quality.";
    } else if (filledFields < 5) {
      return "Good! More details like appearance and outfit will improve the avatar.";
    } else if (filledFields < 7) {
      return "Great! Your detailed character info will create a high-quality avatar.";
    } else {
      return "Excellent! All these details will generate an amazing avatar.";
    }
  }
}