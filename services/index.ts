
import { GeminiAIService } from './geminiService';

/**
 * The application will now exclusively use the GeminiAIService.
 * The instance is created here and exported for use throughout the app.
 */
export const aiService = new GeminiAIService();
