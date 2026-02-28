import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY ?? "" });

const DELETE_ACCOUNT_SYSTEM_INSTRUCTION = `You are a Canadian Privacy expert. 
Write a formal request for 'Personal Information Disposal' under Section 55 
of the Consumer Privacy Protection Act (CPPA).

Instructions:
- Demand the permanent and irreversible deletion of all personal data
- Mention that under Canadian law, this includes data held by third-party service providers
- Require a confirmation of disposal within 30 days
- Replace [USER_NAME], [USER_EMAIL], [COMPANY_EMAIL] if provided in input JSON
- Get the real-time date and replace [DATE]

Output must be STRICTLY in JSON format:
{
  "subject": "...",
  "body": "..."
}`;

export async function generateDeleteAccountEmail(userInfo: {
  userName?: string;
  userEmail?: string;
  companyName: string;
}): Promise<{ subject: string; body: string }> {
  const response = await ai.models.generateContentStream({
    model: 'gemini-2.0-flash',
    config: {
      systemInstruction: [{ text: DELETE_ACCOUNT_SYSTEM_INSTRUCTION }],
    },
    contents: [{
      role: 'user',
      parts: [{ text: JSON.stringify(userInfo) }],
    }],
  });

  let fullText = '';
  for await (const chunk of response) {
    fullText += chunk.text ?? '';
  }

  return JSON.parse(fullText.replace(/```json|```/g, '').trim());
}