
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Attachment, AttachmentType, HealthRiskLevel } from "../types";
import { MODEL_NAME, SYSTEM_INSTRUCTION } from "../constants";

// Helper to safely access environment variables
const getEnv = (key: string): string | undefined => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  return undefined;
};

// Helper to clean base64 string for API usage (removes data URI prefix)
const cleanBase64 = (data: string) => {
  return data.replace(/^data:(.*,)?/, '');
};

export const generateHealthAnalysis = async (
  prompt: string,
  attachments: Attachment[],
  previousHistory: string
): Promise<string> => {
  try {
    const apiKey = getEnv('API_KEY');
    if (!apiKey) {
      throw new Error("API Key not found. Please check your configuration.");
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Prepare parts array
    const parts: any[] = [];

    // Add attachments
    attachments.forEach(att => {
      parts.push({
        inlineData: {
          mimeType: att.mimeType,
          data: cleanBase64(att.data)
        }
      });
    });

    // SECURITY: Wrap prompt in XML tags to separate data from instructions
    // This prevents Prompt Injection attacks.
    const fullPrompt = `
<system_context>
Analyze the following health data based on your system instructions.
${previousHistory ? `PREVIOUS HISTORY CONTEXT:\n${previousHistory}` : ''}
</system_context>

<user_input>
${prompt}
</user_input>
`;
    
    parts.push({ text: fullPrompt });

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        role: 'user',
        parts: parts
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.4, // Lower temperature for more consistent medical-style output
      }
    });

    if (!response.text) {
      throw new Error("No response generated");
    }

    return response.text;

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return `Analysis failed: ${error.message}. Please try again.`;
  }
};

// Helper for structured classification
export const classifyHealthRequest = async (
  prompt: string, 
  attachments: Attachment[]
): Promise<{ analysis_type: string; preliminary_concern: HealthRiskLevel }> => {
  try {
    const apiKey = getEnv('API_KEY');
    if (!apiKey) return { analysis_type: 'Unknown', preliminary_concern: 'Medium' };

    const ai = new GoogleGenAI({ apiKey });

    // We use gemini-2.5-flash for fast, structured classification
    // It's efficient and supports JSON output well.
    const modelName = 'gemini-2.5-flash';

    const parts: any[] = [];
    attachments.forEach(att => {
      parts.push({
        inlineData: {
          mimeType: att.mimeType,
          data: cleanBase64(att.data)
        }
      });
    });

    parts.push({ text: `
      Analyze the input and classify it.
      
      User Input: "${prompt}"
      
      Tasks:
      1. Determine the 'analysis_type'. Options: 'Text Only', 'Image Analysis', 'Audio Analysis', 'Document Review', 'Mixed Multimodal'.
      2. Determine the 'preliminary_concern' based on symptoms described or visible. Options: 'Low', 'Medium', 'High'.
         - Low: Minor symptoms, cold, cosmetic issues.
         - Medium: Persistent pain, fever, concerning visual signs, or ambiguous/unsure situations.
         - High: Severe pain, breathing issues, severe bleeding, chest pain, confusion.
      
      Return JSON. MANDATORY: preliminary_concern MUST be Low, Medium, or High.
    `});

    const response = await ai.models.generateContent({
      model: modelName,
      contents: { role: 'user', parts },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis_type: { type: Type.STRING },
            preliminary_concern: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] }
          },
          required: ["analysis_type", "preliminary_concern"]
        }
      }
    });

    if (response.text) {
      const json = JSON.parse(response.text);
      return {
        analysis_type: json.analysis_type || 'Text Only',
        preliminary_concern: (json.preliminary_concern as HealthRiskLevel) || 'Medium'
      };
    }
    
    return { analysis_type: 'Unknown', preliminary_concern: 'Medium' };
  } catch (e) {
    console.warn("Classification failed", e);
    return { analysis_type: 'Unknown', preliminary_concern: 'Medium' };
  }
};