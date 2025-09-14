import OpenAI from "openai";
import fs from "fs";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface IssueDetectionResult {
  issueType: "pothole" | "garbage" | "streetlight" | "water_leakage" | "road_damage" | "other";
  confidence: number;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  suggestedDepartment: string;
}

export async function analyzeIssueImage(base64Image: string): Promise<IssueDetectionResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are an AI expert in civic issue detection. Analyze images of civic problems and classify them accurately. 
          Respond with JSON in this exact format: {
            "issueType": "pothole|garbage|streetlight|water_leakage|road_damage|other",
            "confidence": number between 0 and 1,
            "description": "detailed description of the issue",
            "severity": "low|medium|high|critical", 
            "suggestedDepartment": "department name that should handle this"
          }`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this civic issue image and classify the problem type, severity, and provide a detailed description."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      issueType: result.issueType || "other",
      confidence: Math.max(0, Math.min(1, result.confidence || 0)),
      description: result.description || "Issue detected in image",
      severity: result.severity || "medium",
      suggestedDepartment: result.suggestedDepartment || "General Services"
    };
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw new Error("Failed to analyze image: " + (error as Error).message);
  }
}

export async function transcribeAudio(audioFilePath: string): Promise<{
  text: string;
  language: string;
}> {
  try {
    const audioReadStream = fs.createReadStream(audioFilePath);

    const transcription = await openai.audio.transcriptions.create({
      file: audioReadStream,
      model: "whisper-1",
      language: "auto", // Auto-detect language
    });

    // Detect language from transcribed text
    const languageDetection = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `Detect the language of the following text. Respond with JSON: {"language": "en|hi|mr", "confidence": number}. Use "en" for English, "hi" for Hindi, "mr" for Marathi.`
        },
        {
          role: "user",
          content: transcription.text
        }
      ],
      response_format: { type: "json_object" },
    });

    const langResult = JSON.parse(languageDetection.choices[0].message.content || '{"language": "en"}');

    return {
      text: transcription.text,
      language: langResult.language || "en"
    };
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw new Error("Failed to transcribe audio: " + (error as Error).message);
  }
}

export async function extractIssueFromText(text: string, language: string = "en"): Promise<{
  issueType: string;
  location?: string;
  description: string;
  priority: string;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `Extract civic issue information from the text. The text may be in English, Hindi, or Marathi.
          Respond with JSON: {
            "issueType": "pothole|garbage|streetlight|water_leakage|road_damage|other",
            "location": "extracted location if mentioned",
            "description": "cleaned up description in English",
            "priority": "low|medium|high|critical"
          }`
        },
        {
          role: "user",
          content: `Language: ${language}\nText: ${text}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      issueType: result.issueType || "other",
      location: result.location,
      description: result.description || text,
      priority: result.priority || "medium"
    };
  } catch (error) {
    console.error("Error extracting issue from text:", error);
    throw new Error("Failed to extract issue information: " + (error as Error).message);
  }
}
