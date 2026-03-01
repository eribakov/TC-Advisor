import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY ?? "" });

const OPT_OUT_SYSTEM_INSTRUCTION = `You are a Canadian Privacy Specialist. You will receive a JSON object with 'company_name', 'user_name', and 'flagged_risks'.
Your Task: Generate a formal 'Withdrawal of Consent' email.
Legal Requirements:
Cite PIPEDA Principle 4.3.8, which states individuals may withdraw consent at any time.
Argue that the third-party sharing discovered (mention the specific 'flagged_risks') falls outside the 'Reasonable Expectations' of a Canadian consumer.
Demand that the company stop disclosing personal information to any third-party marketing partners, affiliates, or data brokers.
Request confirmation that the user's profile has been flagged as 'Do Not Share/Sell' in their internal database.
Tone: Professional, assertive, and knowledgeable.
Output: Respond ONLY in JSON with keys: subject and body.`;

export async function generateOptOutEmail(userInfo: {
  userName?: string;
  userEmail?: string;
  companyName: string;
  flaggedRisks: string[];
}): Promise<{ subject: string; body: string }> {
  const response = await ai.models.generateContentStream({
    model: 'gemini-2.0-flash',
    config: {
      systemInstruction: [{ text: OPT_OUT_SYSTEM_INSTRUCTION }],
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
