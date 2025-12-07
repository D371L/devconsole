
import { GoogleGenAI, Type } from "@google/genai";

// Initialize the client
// Note: In a real production build, ensure process.env.API_KEY is defined in your build environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeTaskAndGetSubtasks = async (title: string, description: string): Promise<string[]> => {
  try {
    const prompt = `
      You are a Senior Technical Lead. Analyze the following development task and break it down into 3-5 concrete, technical subtasks.
      
      Task Title: ${title}
      Task Description: ${description}
      
      Return ONLY a JSON array of strings. Example: ["Setup repository", "Configure CI/CD"].
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: {
                type: Type.STRING
            }
        }
      }
    });

    if (response.text) {
        return JSON.parse(response.text) as string[];
    }
    return [];
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return ["Error generating subtasks. System offline."];
  }
};

export const generateAsciiArt = async (title: string): Promise<string> => {
    try {
        const prompt = `Generate a cool, cyberpunk-style ASCII art banner for the text: "${title}". 
        Keep it compact (max 80 chars wide, max 6 lines high). 
        Do not use markdown code blocks in the output, just the raw ASCII string.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || '';
    } catch (error) {
        return `[ ASCII GENERATION FAILED: ${title} ]`;
    }
};

export const chatWithSystem = async (message: string, context: string): Promise<string> => {
    try {
        const prompt = `
        You are "CORE", the AI mainframe of this DevConsole application.
        You speak in a terse, robotic, cyberpunk style.
        
        System Context (Tasks available): ${context}
        
        User Query: ${message}
        
        Answer the user. If they ask about tasks, summarize from context. Keep it under 50 words.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || 'ERR: NO DATA';
    } catch (error) {
        return 'SYSTEM_CRITICAL: CONNECTION_LOST';
    }
};

export const auditCodeSnippet = async (code: string, language: string): Promise<string> => {
    try {
        const prompt = `
        You are a strict Code Auditor AI. Review the following ${language} code snippet.
        
        Code:
        ${code}
        
        Provide a very concise audit (max 3 sentences):
        1. Identify any potential bugs or security risks.
        2. Suggest one optimization.
        3. Rate the code quality (0-100%).
        
        Format as a raw text report, robotic style.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || 'AUDIT_FAILURE: NULL_RESPONSE';
    } catch (error) {
        return 'AUDIT_FAILURE: NETWORK_ERROR';
    }
};
