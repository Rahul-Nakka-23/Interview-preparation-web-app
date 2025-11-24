import { GoogleGenAI, Chat, Type } from "@google/genai";
import type { TranscriptMessage, Evaluation, RoadmapItem, InterviewType } from '../types';
import { AIService } from "./aiService";

class GeminiAIService implements AIService {
    private ai: GoogleGenAI;
    private chat: Chat | null = null;

    constructor() {
        const apiKey = process.env.API_KEY;
        if (!apiKey || apiKey === 'PASTE_YOUR_GEMINI_API_KEY_HERE') {
            throw new Error("Please set your Gemini API key in index.html to use the application.");
        }
        this.ai = new GoogleGenAI({ apiKey: apiKey });
    }

    startInterviewChat = (goal: string, types: InterviewType[]) => {
        const interviewRounds = types.join(' and ');
        this.chat = this.ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: `You are a friendly but professional interviewer. Your goal is to conduct a mock interview for a candidate aspiring to be a '${goal}'.
                The interview will cover the following rounds: ${interviewRounds}.
                Ask insightful questions one by one based on these topics.
                If the candidate seems to be struggling with a question, try asking a simpler follow-up question to help them demonstrate their knowledge.
                Start with an introductory question. Keep your questions concise.`
            }
        });
    };

    streamNextQuestion = async (message: string): Promise<AsyncGenerator<string>> => {
        const chatInstance = this.chat;
        async function* streamGenerator() {
            if (!chatInstance) {
                throw new Error("Chat not initialized. Call startInterviewChat first.");
            }
            const stream = await chatInstance.sendMessageStream({ message });
            for await (const chunk of stream) {
                yield chunk.text;
            }
        }
        return streamGenerator();
    };

    generateEvaluation = async (transcript: TranscriptMessage[], goal: string): Promise<Evaluation> => {
        const model = 'gemini-2.5-flash';
        
        // FIX: The `parts` array for a multimodal prompt must contain Part objects, not raw strings.
        // We will collect the image parts first, then prepend the text prompt part.
        const imageParts: { inlineData: { mimeType: string; data: string; } }[] = [];
        let transcriptText = "";

        transcript.forEach(msg => {
            transcriptText += `${msg.speaker}: ${msg.text}\n`;
            if (msg.speaker === 'user' && msg.image) {
                const base64Data = msg.image.split(',')[1];
                if (base64Data) {
                    imageParts.push({
                        inlineData: {
                            mimeType: 'image/jpeg',
                            data: base64Data
                        }
                    });
                     transcriptText += "[Reference image for the user's statement above]\n";
                }
            }
        });

        const prompt = `Based on the following interview transcript for a candidate aspiring to be a '${goal}', and the series of images captured while they were speaking, please evaluate their performance.
        
        Transcript:
        ${transcriptText}
        
        Provide a detailed evaluation based on the candidate's answers.
        - Assess their technical knowledge and problem-solving skills from their verbal answers.
        - Assess their confidence based on both their answers and their facial expressions/body language in the images.
        - Analyze their communication style, including clarity, conciseness, use of filler words, and non-verbal cues from the images (e.g., eye contact, engagement).
        - Finally, assign a level: 'Beginner', 'Intermediate', or 'Advanced'.`;

        const parts = [
            { text: prompt },
            ...imageParts
        ];
        
        const response = await this.ai.models.generateContent({
            model,
            contents: { parts },
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING, description: 'A brief overall summary of the candidate performance, considering verbal and non-verbal cues.' },
                        knowledge: { type: Type.STRING, description: 'Assessment of technical knowledge from verbal answers.' },
                        skills: { type: Type.STRING, description: 'Assessment of problem-solving skills from verbal answers.' },
                        confidence: { type: Type.STRING, description: 'Assessment of confidence, referencing both verbal answers and visual cues from images.' },
                        communication: { type: Type.STRING, description: 'Feedback on communication style, including verbal clarity and non-verbal cues from images.' },
                        level: { type: Type.STRING, description: 'The overall level of the candidate: Beginner, Intermediate, or Advanced.'}
                    },
                    required: ['summary', 'knowledge', 'skills', 'confidence', 'communication', 'level']
                }
            }
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    };

    generateRoadmap = async (level: string, goal: string): Promise<Omit<RoadmapItem, 'id' | 'completed'>[]> => {
        const response = await this.ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `A candidate for a '${goal}' role has been evaluated as '${level}'. Create a comprehensive, personalized learning roadmap for them with 5-7 key steps.
            If the level is 'Beginner', focus on fundamental concepts.
            If 'Intermediate', focus on deepening knowledge and practical skills.
            If 'Advanced', focus on specialized topics, system design, and leadership.

            For each roadmap item, provide the following:
            1.  'title': A concise title for the learning topic.
            2.  'description': A short, clear explanation of the topic and its importance.
            3.  'keyConcepts': An array of 3-5 crucial sub-topics or concepts to master.
            4.  'project': A small, practical project idea to apply the learned skills.
            5.  'resources': An array of 2-3 diverse, high-quality online resources. For each resource, specify a 'title', a 'url', and a 'type' from the following options: 'article', 'video', 'docs', or 'interactive'.`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                            keyConcepts: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING }
                            },
                            project: { type: Type.STRING },
                            resources: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        type: { type: Type.STRING },
                                        title: { type: Type.STRING },
                                        url: { type: Type.STRING }
                                    },
                                    required: ['type', 'title', 'url']
                                }
                            }
                        },
                        required: ['title', 'description', 'keyConcepts', 'project', 'resources']
                    }
                }
            }
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    };

    scoreResume = async (resume: string, jobDescription: string): Promise<{ score: number; strengths: string; weaknesses:string; }> => {
        const response = await this.ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `As an expert hiring manager, analyze the following resume against the job description.
            Provide a score from 0 to 100 indicating how well the resume matches the job description.
            Also, provide a brief summary of the candidate's key strengths and areas for improvement.

            Resume:
            ${resume}

            Job Description:
            ${jobDescription}`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.INTEGER, description: 'A score from 0 to 100 representing the match.' },
                        strengths: { type: Type.STRING, description: "A summary of the candidate's strengths." },
                        weaknesses: { type: Type.STRING, description: 'A summary of areas for improvement.' },
                    },
                    required: ['score', 'strengths', 'weaknesses']
                }
            }
        });

        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        // Ensure score is a number, as AI might occasionally return it as a string.
        if (typeof result.score !== 'number') {
            result.score = parseInt(result.score, 10) || 0;
        }
        return result;
    };
}

export { GeminiAIService };