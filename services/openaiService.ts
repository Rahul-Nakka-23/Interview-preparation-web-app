
import type { TranscriptMessage, Evaluation, RoadmapItem, InterviewType } from '../types';
import { AIService } from "./aiService";

type OpenAIMessage = {
    role: 'user' | 'assistant' | 'system';
    content: string;
};

class OpenAIAIService implements AIService {
    private apiKey: string;
    private readonly apiUrl = "https://api.openai.com/v1/chat/completions";
    private readonly model = "gpt-4o";
    private messageHistory: OpenAIMessage[] = [];

    constructor() {
        const apiKeyVal = process.env.OPENAI_API_KEY;
        if (!apiKeyVal) {
            throw new Error("OPENAI_API_KEY environment variable not set. Please set it to use the OpenAI service.");
        }
        this.apiKey = apiKeyVal;
    }

    startInterviewChat = (goal: string, types: InterviewType[]) => {
        const interviewRounds = types.join(' and ');
        const systemPrompt = `You are a friendly but professional interviewer. Your goal is to conduct a mock interview for a candidate aspiring to be a '${goal}'.
        The interview will cover the following rounds: ${interviewRounds}.
        Ask insightful questions one by one based on these topics.
        If the candidate seems to be struggling with a question, try asking a simpler follow-up question to help them demonstrate their knowledge.
        Start with an introductory question. Keep your questions concise.`;
        this.messageHistory = [{ role: 'system', content: systemPrompt }];
    };

    streamNextQuestion = async (message: string): Promise<AsyncGenerator<string>> => {
        const self = this;
        async function* streamGenerator() {
            if (self.messageHistory.length === 0) {
                throw new Error("Chat not initialized. Call startInterviewChat first.");
            }

            self.messageHistory.push({ role: 'user', content: message });

            const response = await fetch(self.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${self.apiKey}`
                },
                body: JSON.stringify({
                    model: self.model,
                    messages: self.messageHistory,
                    stream: true,
                }),
            });

            if (!response.ok || !response.body) {
                throw new Error('Failed to get streaming response from OpenAI');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let fullResponse = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.substring(6);
                        if (data.trim() === '[DONE]') {
                            break;
                        }
                        try {
                            const json = JSON.parse(data);
                            const content = json.choices[0]?.delta?.content;
                            if (content) {
                                yield content;
                                fullResponse += content;
                            }
                        } catch (error) {
                            console.error('Error parsing OpenAI stream data:', error);
                        }
                    }
                }
            }
            self.messageHistory.push({ role: 'assistant', content: fullResponse });
        }
        return streamGenerator();
    };

    private getJsonResponse = async (messages: OpenAIMessage[]) => {
        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: this.model,
                messages,
                response_format: { type: "json_object" },
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`OpenAI API Error: ${response.statusText} - ${errorBody}`);
        }

        const data = await response.json();
        const jsonText = data.choices[0].message.content;
        return JSON.parse(jsonText);
    }

    generateEvaluation = (transcript: TranscriptMessage[], goal: string): Promise<Evaluation> => {
        const transcriptText = transcript.map(m => `${m.speaker}: ${m.text}`).join('\n');
        const systemPrompt = "You are an expert interview evaluator. Your response must be a valid JSON object only, with no additional text or explanations.";
        const userPrompt = `Based on the following interview transcript for a candidate aspiring to be a '${goal}', please evaluate their performance.
        
            Transcript:
            ${transcriptText}
            
            Return a JSON object with the following keys:
            - "summary": A brief overall summary of the candidate performance.
            - "knowledge": Assessment of technical knowledge.
            - "skills": Assessment of problem-solving skills.
            - "confidence": Assessment of confidence inferred from the answers.
            - "communication": Feedback on communication style, including clarity, filler words, and overall fluency.
            - "level": The overall level of the candidate: 'Beginner', 'Intermediate', or 'Advanced'.`;
        
        return this.getJsonResponse([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ]);
    };

    generateRoadmap = (level: string, goal: string): Promise<Omit<RoadmapItem, 'id' | 'completed'>[]> => {
        const systemPrompt = "You are an expert career coach. Your response must be a valid JSON array of objects only, with no additional text or explanations."
        const userPrompt = `A candidate for a '${goal}' role has been evaluated as '${level}'. Create a comprehensive, personalized learning roadmap for them with 5-7 key steps.
            If the level is 'Beginner', focus on fundamental concepts.
            If 'Intermediate', focus on deepening knowledge and practical skills.
            If 'Advanced', focus on specialized topics, system design, and leadership.

            Return a JSON array where each object represents a roadmap item and has the following structure:
            - "title": A concise title for the learning topic.
            - "description": A short, clear explanation of the topic and its importance.
            - "keyConcepts": An array of 3-5 crucial sub-topics or concepts to master.
            - "project": A small, practical project idea to apply the learned skills.
            - "resources": An array of 2-3 diverse, high-quality online resources. Each resource object should have a "title", a "url", and a "type" from the following options: 'article', 'video', 'docs', or 'interactive'.`;
        
        return this.getJsonResponse([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ]);
    };

    scoreResume = (resume: string, jobDescription: string): Promise<{ score: number; strengths: string; weaknesses: string; }> => {
        const systemPrompt = "You are an expert hiring manager. Your response must be a valid JSON object only, with no additional text or explanations.";
        const userPrompt = `Analyze the following resume against the job description. Provide a score out of 100 representing the match, a summary of strengths, and a summary of weaknesses.
        
        Resume:
        ${resume}
        
        Job Description:
        ${jobDescription}
        
        Return a JSON object with the following keys:
        - "score": A number between 0 and 100.
        - "strengths": A string summarizing the candidate's strengths based on the job description.
        - "weaknesses": A string summarizing areas for improvement or missing qualifications.`;

        return this.getJsonResponse([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ]);
    };
}

export { OpenAIAIService };