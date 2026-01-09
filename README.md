# Onsite Recap

An AI-powered Customer Success visit documentation tool. Record, transcribe, and generate comprehensive summaries of your customer onsite visits.

## Features

- **Voice Recording & Transcription**: Record audio directly in the browser or upload audio files. Automatically transcribes using OpenAI Whisper.
- **AI-Generated Summaries**: Generate polished, professional visit summaries using GPT-4.
- **Customer Information**: Track Account ID, ARR, and customer details.
- **Key Contacts**: Document stakeholders you met, including champions.
- **Health Scoring**: Visual indicators for account health (green/yellow/red).
- **Quick Tags**: Tag visits with categories like "Upsell Opportunity", "At Risk", etc.
- **Action Items**: Create tasks with owners and due dates.
- **Follow-up Reminders**: Set follow-up dates with notes.
- **Attachments**: Add photos, documents, and other files.
- **Export Options**: Copy summary, download as PDF, or save to Google Drive.
- **Local Storage**: All visits are saved locally in the browser.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure API Keys

Click the Settings icon in the app to configure:

#### OpenAI API Key (Required)
- Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
- Required for voice transcription and summary generation

#### Google OAuth Client ID (Optional)
For Google Drive integration:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable the Google Drive API
4. Configure OAuth consent screen
5. Create OAuth 2.0 credentials (Web application)
6. Add your domain to authorized JavaScript origins
7. Copy the Client ID

### 3. Run the App

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Usage

1. **Start a New Visit**: Click "New Visit" or start filling in the form.

2. **Add Customer Info**: Enter customer name, account ID, and ARR.

3. **Set Health Score**: Click the health indicator to set account status.

4. **Add Tags**: Select relevant tags for the visit.

5. **Record Contacts**: Add key stakeholders you met. Star champions.

6. **Complete Prompts**: For each section, either:
   - Click the microphone to record audio
   - Upload an audio file
   - Type notes directly

7. **Add Action Items**: Create tasks with owners and due dates.

8. **Set Follow-up**: Add a reminder for your next touchpoint.

9. **Generate Summary**: Click "Generate AI Summary" to create a comprehensive report.

10. **Export**: Copy the summary, download as PDF, or save to Google Drive.

## Technology Stack

- React 18 + TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Framer Motion for animations
- OpenAI API (Whisper + GPT-4)
- Google Drive API
- jsPDF for PDF generation

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## License

MIT

