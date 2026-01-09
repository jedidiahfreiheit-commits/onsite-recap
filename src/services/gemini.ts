import { GoogleGenerativeAI } from '@google/generative-ai';
import { OnsiteVisit, SELLING_OPPORTUNITIES, SellingOpportunity } from '../types';

let genAI: GoogleGenerativeAI | null = null;

export function initializeGemini(apiKey: string): void {
  genAI = new GoogleGenerativeAI(apiKey);
}

export function isGeminiConfigured(): boolean {
  return genAI !== null;
}

export async function transcribeAudio(audioFile: File): Promise<string> {
  if (!genAI) {
    throw new Error('Gemini not configured. Please add your API key.');
  }

  // Convert audio file to base64
  const arrayBuffer = await audioFile.arrayBuffer();
  const base64Audio = btoa(
    new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
  );

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: audioFile.type || 'audio/webm',
        data: base64Audio,
      },
    },
    { text: 'Please transcribe this audio recording accurately. Only output the transcription, nothing else.' },
  ]);

  const response = await result.response;
  return response.text();
}

export async function generateSummary(visit: OnsiteVisit): Promise<string> {
  if (!genAI) {
    throw new Error('Gemini not configured. Please add your API key.');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

  const promptSections = visit.prompts.map(p => {
    const content = p.transcription || p.textInput;
    return content ? `### ${p.title}\n${content}` : '';
  }).filter(Boolean).join('\n\n');

  const contactsSection = visit.contacts.length > 0
    ? `### Key Contacts Met\n${visit.contacts.map(c => 
        `- **${c.name}** (${c.title})${c.isChampion ? ' ⭐ Champion' : ''}\n  Email: ${c.email} | Phone: ${c.phone}`
      ).join('\n')}`
    : '';

  const actionItemsSection = visit.actionItems.length > 0
    ? `### Action Items\n${visit.actionItems.map(a => 
        `- [ ] ${a.description} (Owner: ${a.owner}, Due: ${a.dueDate})`
      ).join('\n')}`
    : '';

  const sellingOpportunitiesSection = visit.sellingOpportunities && visit.sellingOpportunities.length > 0
    ? `### Selected Products/Services to Sell\n${visit.sellingOpportunities.map((opp: SellingOpportunity) => {
        const info = SELLING_OPPORTUNITIES[opp];
        return `- **${info.label}** - ${info.description}`;
      }).join('\n')}`
    : '';

  const healthLabel = {
    green: '🟢 Healthy',
    yellow: '🟡 Needs Attention',
    red: '🔴 At Risk',
  }[visit.healthScore];

  const prompt = `You are an expert Customer Success Manager. Generate a comprehensive, professional onsite visit summary based on the following information. The summary should be well-structured, actionable, and suitable for sharing with internal stakeholders.

## Customer Information
- **Customer Name:** ${visit.customerName}
- **Account ID:** ${visit.accountId}
- **ARR:** ${visit.arr}
- **Account Health:** ${healthLabel}
- **Tags:** ${visit.tags.join(', ') || 'None'}

## Customer Overview
${visit.customerSummary}

${contactsSection}

## Visit Details
${promptSections}

${sellingOpportunitiesSection}

${actionItemsSection}

## Follow-up
- **Next Follow-up Date:** ${visit.followUpDate || 'Not set'}
- **Notes:** ${visit.followUpNotes || 'None'}

---

Please generate a polished executive summary that:
1. Opens with a brief overview of the customer and visit purpose
2. Includes a chronological timeline of the day's events (formatted as a timeline with times if provided)
3. Highlights key takeaways and insights from each meeting
4. Clearly outlines customer pain points and needs
5. Lists the SPECIFIC products/services we can sell them (from the selected products above: ${visit.sellingOpportunities?.map((opp: SellingOpportunity) => SELLING_OPPORTUNITIES[opp].label).join(', ') || 'None specified'}). For each product, explain WHY it would help this specific customer based on their pain points and needs.
6. **NEXT STEPS SECTION (CRITICAL):** Create a clearly formatted, numbered action plan that includes:
   - WHAT specific action needs to be taken
   - WHO is responsible (owner)
   - WHEN it needs to be done (specific date or timeframe)
   - HOW it relates to the selling opportunities identified
   Make this section prominent and easy to scan.
7. Includes any additional context or observations
8. Ends with an overall assessment and recommendations

Format the output in clean Markdown with clear sections. The NEXT STEPS section should be prominently displayed with clear formatting so it's impossible to miss. Use checkboxes (- [ ]) for each action item.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

