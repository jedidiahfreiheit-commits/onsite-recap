import { OnsiteVisit } from '../types';

const STORAGE_KEY = 'onsite-recap-visits';

export function saveVisit(visit: OnsiteVisit): void {
  const visits = getAllVisits();
  const existingIndex = visits.findIndex(v => v.id === visit.id);
  
  if (existingIndex >= 0) {
    visits[existingIndex] = { ...visit, updatedAt: new Date().toISOString() };
  } else {
    visits.push(visit);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(visits));
}

export function getAllVisits(): OnsiteVisit[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function getVisit(id: string): OnsiteVisit | null {
  const visits = getAllVisits();
  return visits.find(v => v.id === id) || null;
}

export function deleteVisit(id: string): void {
  const visits = getAllVisits().filter(v => v.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(visits));
}

export function generateId(): string {
  return `visit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function createEmptyVisit(): OnsiteVisit {
  const id = generateId();
  const now = new Date().toISOString();
  
  return {
    id,
    createdAt: now,
    updatedAt: now,
    customerName: '',
    accountId: '',
    arr: '',
    customerSummary: '',
    contacts: [],
    prompts: [
      { id: generateId(), title: 'Customer Overview', prompt: 'Who is the customer? Describe their business, industry, and how they use your product.', audioFile: null, audioUrl: null, textInput: '', transcription: '' },
      { id: generateId(), title: 'Day Timeline', prompt: 'Walk me through your day from start to finish. What time did you arrive? Who did you meet with and when? How did each meeting go and what was discussed?', audioFile: null, audioUrl: null, textInput: '', transcription: '' },
      { id: generateId(), title: 'Pain Points', prompt: 'What are the pain points of the customer? What challenges are they facing?', audioFile: null, audioUrl: null, textInput: '', transcription: '' },
      { id: generateId(), title: 'Customer Needs', prompt: 'What is the customer needing? What are their goals and desired outcomes?', audioFile: null, audioUrl: null, textInput: '', transcription: '' },
      { id: generateId(), title: 'Sales Opportunities', prompt: 'Select the products below, then explain why these would help this customer.', audioFile: null, audioUrl: null, textInput: '', transcription: '' },
      { id: generateId(), title: 'Next Steps & Timeline', prompt: 'What are next steps and the timeline around those? Who is responsible for what?', audioFile: null, audioUrl: null, textInput: '', transcription: '' },
      { id: generateId(), title: 'Additional Context', prompt: 'Is there anything else important to know about this account? Any observations, concerns, opportunities, or context that would be helpful?', audioFile: null, audioUrl: null, textInput: '', transcription: '' },
    ],
    healthScore: 'green',
    tags: [],
    sellingOpportunities: [],
    actionItems: [],
    followUpDate: '',
    followUpNotes: '',
    attachments: [],
    generatedSummary: '',
  };
}

