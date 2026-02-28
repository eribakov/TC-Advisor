import { GoogleGenAI } from "@google/genai";
import { generateDeleteAccountEmail } from './prompts/deletionEmail';

const genAI = new GoogleGenAI({ apiKey: import.meta.env.GEMINI_API_KEY ?? "" });

export async function scanTerms(pageText: string) {
  const prompt = `
Act as an expert Privacy Auditor and Legal Analyst. Analyze the following Terms and Conditions text for hidden legal traps, privacy concerns, and data exploitation clauses.
Your goal is to extract the legal implications and return them in a strictly structured JSON object.
Task Requirements:
Identify 8 Privacy Risks: Focus on data tracking, AI/machine learning training, broad content licenses, identity usage in advertising, third-party data sharing, and legal waivers (like arbitration or short statutes of limitation).
Assign Severity: Rate each risk as High, Medium, or Low.
Provide Solutions: For every risk, provide a practical way for the user to protect themselves.
Identify the Opt-Out Email: Extract the specific email address the service provides for privacy-related inquiries, data deletion, or opting out of data collection.
Create 'Ghost Mode': Curate 5 actionable "Quick-Win" privacy settings the user should change immediately. For each, provide a title and the exact navigational steps (breadcrumb path) to find that setting in the app or website.
Output Format Requirements:
Return ONLY one JSON object.
No introductory text, no concluding explanation, no markdown formatting other than the JSON itself.
The JSON must follow this exact structure:
code
JSON
{
  "optOutEmail": "string",
  "risks": [
    {
      "risk": "string",
      "description": "string",
      "severity": "High/Medium/Low",
      "solution": "string"
    }
  ],
  "ghostMode": [
    {
      "title": "string",
      "steps": "string"
    }
  ]
} 
  The terms and conditions text to analyze is: ${pageText}
  `;

  const result = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const text = result.text ?? "";
  return JSON.parse(text);
}