import type { TranscriptMessage, Evaluation, RoadmapItem, InterviewType } from '../types';

/**
 * Defines the contract for an AI service.
 * This allows the application to be agnostic of the underlying AI provider.
 */
export interface AIService {
  /**
   * Initializes the chat session with a system prompt.
   * @param goal - The user's career goal.
   * @param types - The selected interview rounds (e.g., 'behavioral', 'technical').
   */
  startInterviewChat: (goal: string, types: InterviewType[]) => void;

  /**
   * Sends the user's message and streams the AI's response.
   * @param message - The user's message to the AI.
   * @returns An async generator that yields chunks of the AI's response text.
   */
  streamNextQuestion: (message: string) => Promise<AsyncGenerator<string>>;
  
  /**
   * Generates a comprehensive evaluation based on the interview transcript.
   * @param transcript - The full interview transcript.
   * @param goal - The user's career goal.
   * @returns A promise that resolves to an Evaluation object.
   */
  generateEvaluation: (transcript: TranscriptMessage[], goal: string) => Promise<Evaluation>;

  /**
   * Generates a personalized learning roadmap.
   * @param level - The user's evaluated skill level ('Beginner', 'Intermediate', 'Advanced').
   * @param goal - The user's career goal.
   * @returns A promise that resolves to an array of roadmap items.
   */
  generateRoadmap: (level: string, goal: string) => Promise<Omit<RoadmapItem, 'id' | 'completed'>[]>;

  /**
   * Analyzes a resume against a job description and returns a score and feedback.
   * @param resume - The text content of the resume.
   * @param jobDescription - The text content of the job description.
   * @returns A promise that resolves to an object containing the score, strengths, and weaknesses.
   */
  scoreResume: (resume: string, jobDescription: string) => Promise<{ score: number; strengths: string; weaknesses: string; }>;
}