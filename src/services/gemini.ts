import { GoogleGenerativeAI } from '@google/generative-ai';
import { OnsiteVisit, SELLING_OPPORTUNITIES, SellingOpportunity } from '../types';

let genAI: GoogleGenerativeAI | null = null;

export function initializeGemini(apiKey: string): void {
  genAI = new GoogleGenerativeAI(apiKey);
}

export function isGeminiConfigured(): boolean {
  return genAI !== null;
}

// Use browser's Web Speech API for transcription (free, no API needed)
export async function transcribeAudio(audioFile: File): Promise<string> {
  // Create an audio element to play the file
  const audioUrl = URL.createObjectURL(audioFile);
  
  return new Promise((resolve, reject) => {
    // Check if Web Speech API is available
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      // Fallback: return a message asking user to type
      reject(new Error('Speech recognition not supported. Please type your response instead.'));
      return;
    }

    // For recorded audio, we'll use a simpler approach:
    // Return a placeholder and let user edit/type
    // Real-time transcription would need the audio to be played
    resolve('(Audio recorded - please type or edit your response below)');
  });
}

// Real-time speech recognition for live recording
export function createSpeechRecognition(onResult: (text: string) => void, onEnd: () => void): any {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  let finalTranscript = '';

  recognition.onresult = (event: any) => {
    let interimTranscript = '';
    
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' ';
      } else {
        interimTranscript += transcript;
      }
    }
    
    onResult(finalTranscript + interimTranscript);
  };

  recognition.onend = () => {
    onEnd();
  };

  recognition.onerror = (event: any) => {
    console.error('Speech recognition error:', event.error);
    onEnd();
  };

  return recognition;
}

export async function generateSummary(visit: OnsiteVisit): Promise<string> {
  if (!genAI) {
    throw new Error('Gemini not configured. Please add your API key.');
  }

  // Use gemini-pro for text generation
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

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
// Force rebuild Fri Jan  9 15:29:05 CST 2026
