export interface Contact {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  isChampion: boolean;
}

export interface ActionItem {
  id: string;
  description: string;
  owner: string;
  dueDate: string;
  completed: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
}

export type HealthScore = 'green' | 'yellow' | 'red';

export type Tag = 
  | 'upsell-opportunity'
  | 'at-risk'
  | 'champion-identified'
  | 'technical-issues'
  | 'expansion-potential'
  | 'renewal-concern'
  | 'product-feedback'
  | 'training-needed';

export type SellingOpportunity = 
  | 'podhero'
  | 'pick-to-light'
  | 'receive-to-light'
  | 'ai-picking'
  | 'pack-to-light'
  | 'make-com'
  | 'consultation'
  | 'netsuite'
  | 'sps';

export const SELLING_OPPORTUNITIES: Record<SellingOpportunity, { label: string; description: string }> = {
  'podhero': { label: 'PODHero', description: 'Print on demand fulfillment' },
  'pick-to-light': { label: 'Pick-to-Light', description: 'Visual picking assistance' },
  'receive-to-light': { label: 'Receive-to-Light', description: 'Visual receiving assistance' },
  'ai-picking': { label: 'AI Picking', description: 'AI-powered pick optimization' },
  'pack-to-light': { label: 'Pack-to-Light', description: 'Visual packing assistance' },
  'make-com': { label: 'Make.com', description: 'Workflow automation integration' },
  'consultation': { label: 'Consultation', description: 'Professional services' },
  'netsuite': { label: 'NetSuite', description: 'NetSuite integration' },
  'sps': { label: 'SPS', description: 'SPS Commerce integration' },
};

export interface PromptData {
  id: string;
  title: string;
  prompt: string;
  audioFile: File | null;
  audioUrl: string | null;
  textInput: string;
  transcription: string;
}

export interface OnsiteVisit {
  id: string;
  createdAt: string;
  updatedAt: string;
  
  // Customer Summary
  customerName: string;
  accountId: string;
  arr: string;
  customerSummary: string;
  
  // Contacts
  contacts: Contact[];
  
  // Prompts
  prompts: PromptData[];
  
  // Health & Tags
  healthScore: HealthScore;
  tags: Tag[];
  
  // Selling Opportunities
  sellingOpportunities: SellingOpportunity[];
  
  // Action Items
  actionItems: ActionItem[];
  
  // Follow-up
  followUpDate: string;
  followUpNotes: string;
  
  // Attachments
  attachments: Attachment[];
  
  // Generated Summary
  generatedSummary: string;
  
  // Google Drive
  driveFileId?: string;
}

export const DEFAULT_PROMPTS: Omit<PromptData, 'id'>[] = [
  {
    title: 'Customer Overview',
    prompt: 'Who is the customer? Describe their business, industry, and how they use your product.',
    audioFile: null,
    audioUrl: null,
    textInput: '',
    transcription: '',
  },
  {
    title: 'Day Timeline',
    prompt: 'Walk me through your day from start to finish. What time did you arrive? Who did you meet with and when? How did each meeting go and what was discussed?',
    audioFile: null,
    audioUrl: null,
    textInput: '',
    transcription: '',
  },
  {
    title: 'Pain Points',
    prompt: 'What are the pain points of the customer? What challenges are they facing?',
    audioFile: null,
    audioUrl: null,
    textInput: '',
    transcription: '',
  },
  {
    title: 'Customer Needs',
    prompt: 'What is the customer needing? What are their goals and desired outcomes?',
    audioFile: null,
    audioUrl: null,
    textInput: '',
    transcription: '',
  },
  {
    title: 'Sales Opportunities',
    prompt: 'Select the products below, then explain why these would help this customer.',
    audioFile: null,
    audioUrl: null,
    textInput: '',
    transcription: '',
  },
  {
    title: 'Next Steps & Timeline',
    prompt: 'What are next steps and the timeline around those? Who is responsible for what?',
    audioFile: null,
    audioUrl: null,
    textInput: '',
    transcription: '',
  },
  {
    title: 'Additional Context',
    prompt: 'Is there anything else important to know about this account? Any observations, concerns, opportunities, or context that would be helpful?',
    audioFile: null,
    audioUrl: null,
    textInput: '',
    transcription: '',
  },
];

export const TAG_LABELS: Record<Tag, string> = {
  'upsell-opportunity': 'Upsell Opportunity',
  'at-risk': 'At Risk',
  'champion-identified': 'Champion Identified',
  'technical-issues': 'Technical Issues',
  'expansion-potential': 'Expansion Potential',
  'renewal-concern': 'Renewal Concern',
  'product-feedback': 'Product Feedback',
  'training-needed': 'Training Needed',
};

