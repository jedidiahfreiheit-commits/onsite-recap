import OpenAI from 'openai';
import { OnsiteVisit, SELLING_OPPORTUNITIES, SellingOpportunity } from '../types';

let openaiClient: OpenAI | null = null;

export function initializeOpenAI(apiKey: string): void {
  openaiClient = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  });
}

export function isOpenAIConfigured(): boolean {
  return openaiClient !== null;
}

export async function transcribeAudio(audioFile: File): Promise<string> {
  if (!openaiClient) {
    throw new Error('OpenAI not configured. Please add your API key.');
  }

  const response = await openaiClient.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
  });

  return response.text;
}

export async function generateSummary(visit: OnsiteVisit): Promise<string> {
  if (!openaiClient) {
    throw new Error('OpenAI not configured. Please add your API key.');
  }

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

  const response = await openaiClient.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'You are a professional Customer Success Manager creating comprehensive visit reports. Write in a clear, concise, and actionable style.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_tokens: 4000,
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content || 'Failed to generate summary.';
}

