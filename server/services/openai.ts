import OpenAI from "openai";

let openai: OpenAI | null = null;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY ;
if (!OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: OPENAI_API_KEY });
} else {
  console.warn("⚠️  OPENAI_API_KEY not set - AI auto-reply functionality will be disabled");
}

export interface AIResponse {
  content: string;
  confidence: number;
  shouldTransferToHuman: boolean;
}

export async function generateAutoReply(userMessage: string, conversationHistory: string[] = []): Promise<AIResponse> {
  // If OpenAI is not configured, return a fallback response
  if (!openai) {
    console.warn("OpenAI not configured - returning fallback response");
    return {
      content: "Thank you for your message! A support agent will respond shortly.",
      confidence: 0.1,
      shouldTransferToHuman: true,
    };
  }

  try {
    const context = conversationHistory.length > 0 
      ? `Previous messages:\n${conversationHistory.join('\n')}\n\n`
      : '';

    const prompt = `You are a helpful customer support AI assistant. Analyze the user's message and provide an appropriate response.

${context}User message: "${userMessage}"

Respond with JSON in this format:
{
  "content": "Your helpful response to the user",
  "confidence": 0.85,
  "shouldTransferToHuman": false
}

Guidelines:
- Be helpful, friendly, and professional
- For complex issues, account problems, or billing questions, set shouldTransferToHuman to true
- Keep responses concise but informative
- Confidence should be between 0 and 1
- If you're not sure about something, be honest and suggest human assistance`;

    // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a customer support AI assistant. Always respond with valid JSON."
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      content: result.content || "I'm here to help! Could you please provide more details about your issue?",
      confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
      shouldTransferToHuman: Boolean(result.shouldTransferToHuman),
    };
  } catch (error) {
    console.error('Error generating AI response:', error);
    return {
      content: "I'm having trouble processing your request right now. Let me connect you with a human agent who can help you better.",
      confidence: 0.1,
      shouldTransferToHuman: true,
    };
  }
}
