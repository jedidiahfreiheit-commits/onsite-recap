// Google Drive API Integration
// Uses Google's OAuth2 and Drive API v3

const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

// ShipHero Onsite Recap folder
const DRIVE_FOLDER_ID = '1LKBsOj2NeTWtyAcZv8JMMrO48IPFUtW7';

interface GoogleAuth {
  isSignedIn: boolean;
  accessToken: string | null;
}

let googleAuth: GoogleAuth = {
  isSignedIn: false,
  accessToken: null,
};

let gapiLoaded = false;
let gisLoaded = false;
let tokenClient: google.accounts.oauth2.TokenClient | null = null;

declare global {
  interface Window {
    gapi: typeof gapi;
    google: typeof google;
  }
}

export function loadGoogleAPIs(clientId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Load the Google API client library
    const gapiScript = document.createElement('script');
    gapiScript.src = 'https://apis.google.com/js/api.js';
    gapiScript.onload = () => {
      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            discoveryDocs: [DISCOVERY_DOC],
          });
          gapiLoaded = true;
          checkAndResolve();
        } catch (err) {
          reject(err);
        }
      });
    };
    gapiScript.onerror = reject;
    document.body.appendChild(gapiScript);

    // Load the Google Identity Services library
    const gisScript = document.createElement('script');
    gisScript.src = 'https://accounts.google.com/gsi/client';
    gisScript.onload = () => {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: (response: google.accounts.oauth2.TokenResponse) => {
          if (response.access_token) {
            googleAuth = {
              isSignedIn: true,
              accessToken: response.access_token,
            };
          }
        },
      });
      gisLoaded = true;
      checkAndResolve();
    };
    gisScript.onerror = reject;
    document.body.appendChild(gisScript);

    function checkAndResolve() {
      if (gapiLoaded && gisLoaded) {
        resolve();
      }
    }
  });
}

export function isGoogleDriveConfigured(): boolean {
  return gapiLoaded && gisLoaded && tokenClient !== null;
}

export function isSignedIn(): boolean {
  return googleAuth.isSignedIn;
}

export async function signIn(): Promise<void> {
  if (!tokenClient) {
    throw new Error('Google APIs not loaded');
  }

  return new Promise((resolve, reject) => {
    tokenClient!.callback = (response: google.accounts.oauth2.TokenResponse) => {
      if (response.error) {
        reject(new Error(response.error));
        return;
      }
      if (response.access_token) {
        googleAuth = {
          isSignedIn: true,
          accessToken: response.access_token,
        };
        window.gapi.client.setToken({ access_token: response.access_token });
        resolve();
      }
    };
    tokenClient!.requestAccessToken({ prompt: 'consent' });
  });
}

export function signOut(): void {
  if (googleAuth.accessToken) {
    window.google.accounts.oauth2.revoke(googleAuth.accessToken, () => {
      googleAuth = { isSignedIn: false, accessToken: null };
      window.gapi.client.setToken(null);
    });
  }
}

export async function uploadToDrive(
  fileName: string,
  content: string,
  mimeType: string = 'application/pdf'
): Promise<string> {
  if (!googleAuth.isSignedIn) {
    throw new Error('Not signed in to Google Drive');
  }

  const metadata = {
    name: fileName,
    mimeType: mimeType,
    parents: [DRIVE_FOLDER_ID], // Save to ShipHero Onsite Recap folder
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([content], { type: mimeType }));

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${googleAuth.accessToken}`,
    },
    body: form,
  });

  if (!response.ok) {
    throw new Error('Failed to upload to Google Drive');
  }

  const result = await response.json();
  return result.id;
}

export async function uploadPdfToDrive(
  fileName: string,
  pdfBlob: Blob
): Promise<string> {
  if (!googleAuth.isSignedIn) {
    throw new Error('Not signed in to Google Drive');
  }

  const metadata = {
    name: fileName,
    mimeType: 'application/pdf',
    parents: [DRIVE_FOLDER_ID], // Save to ShipHero Onsite Recap folder
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', pdfBlob);

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${googleAuth.accessToken}`,
    },
    body: form,
  });

  if (!response.ok) {
    throw new Error('Failed to upload to Google Drive');
  }

  const result = await response.json();
  return result.id;
}

export function getDriveFileUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`;
}

export function getDriveFolderUrl(): string {
  return `https://drive.google.com/drive/folders/${DRIVE_FOLDER_ID}`;
}

