import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import appSettings from '@config/settings';

/**
 * Gemini AI Service
 * Handles AI chatbot functionality using Google's Gemini API
 */

interface GeminiError extends Error {
  status?: number;
  statusText?: string;
  errorDetails?: string | Record<string, string | number>;
}

/**
 * Type guard to check if error has expected properties
 */
function isGeminiError(error: Error): error is GeminiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  );
}

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;

  constructor() {
    if (!appSettings.geminiApiKey) {
      console.warn('⚠️ Gemini API key not found. Chatbot will not work properly.');
      return;
    }

    this.genAI = new GoogleGenerativeAI(appSettings.geminiApiKey as string);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro-latest' });
    console.log('🤖 Gemini AI service initialized successfully');
  }

  /**
   * Generate AI response for chat message
   */
  async generateResponse(message: string, context?: string): Promise<string> {
    try {
      if (!this.model) {
        return 'Sorry, the AI service is not available right now. Please check the API key configuration.';
      }

      // Create a prompt with context for better responses
      const prompt = this.createPrompt(message, context);

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return text || "I apologize, but I couldn't generate a response. Please try again.";
    } catch (error) {
      const errorObj = error as Error;
      if (isGeminiError(errorObj)) {
        const geminiError = errorObj as GeminiError;
        console.error('❌ Gemini AI Error Details:', {
          message: geminiError.message,
          status: geminiError.status,
          statusText: geminiError.statusText,
          errorDetails: geminiError.errorDetails,
        });

        if (geminiError.status === 404) {
          return 'The AI service endpoint was not found. Please check the API key configuration.';
        } else if (geminiError.status === 401 || geminiError.status === 403) {
          return 'Authentication failed. Please check if your Gemini API key is valid.';
        } else if (geminiError.status === 429) {
          return 'Rate limit exceeded. Please try again in a moment.';
        }
      } else {
        console.error('❌ Unknown Gemini AI Error:', error);
      }

      return "I'm experiencing some technical difficulties. Please try again in a moment.";
    }
  }

  /**
   * Create a well-structured prompt for the AI
   */
  private createPrompt(message: string, context?: string): string {
    const systemPrompt = `You are a helpful AI assistant integrated into a web application. 
    You should be friendly, concise, and helpful. Keep responses conversational and not too long.
    If asked about technical topics, provide clear and practical advice.`;

    let prompt = systemPrompt;

    if (context) {
      prompt += `\n\nContext: ${context}`;
    }

    prompt += `\n\nUser message: ${message}`;

    return prompt;
  }

  /**
   * Generate a response for specific chat scenarios
   */
  async generateContextualResponse(
    message: string,
    scenario: 'greeting' | 'help' | 'general' | 'technical'
  ): Promise<string> {
    const contexts = {
      greeting: 'The user is greeting you or starting a conversation.',
      help: 'The user is asking for help or assistance with something.',
      general: 'This is a general conversation.',
      technical: 'The user is asking about technical topics or programming.',
    };

    return this.generateResponse(message, contexts[scenario]);
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured(): boolean {
    return !!this.model && !!appSettings.geminiApiKey;
  }

  /**
   * Get service status
   */
  getStatus(): { configured: boolean; message: string } {
    if (this.isConfigured()) {
      return {
        configured: true,
        message: 'Gemini AI service is ready',
      };
    }

    return {
      configured: false,
      message:
        'Gemini API key not configured. Please add GEMINI_API_KEY to your environment variables.',
    };
  }
}

// Export singleton instance
export default new GeminiService();
