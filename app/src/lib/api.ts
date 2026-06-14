/** Backend API client. */

import { Platform } from 'react-native';

import type {
  AnalysisResult,
  AppLanguage,
  GenericSummary,
  SelectedFile,
} from '../types';
import { API_BASE } from './config';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Append a picked file to FormData. On native, React Native accepts a
 * `{ uri, name, type }` object; on web we must fetch the uri into a Blob.
 */
async function appendFile(form: FormData, file: SelectedFile): Promise<void> {
  if (Platform.OS === 'web') {
    const blob = await fetch(file.uri).then((r) => r.blob());
    form.append('files', blob, file.name);
  } else {
    form.append('files', {
      uri: file.uri,
      name: file.name,
      type: file.mimeType,
      // RN's FormData file shape isn't in the DOM lib types.
    } as unknown as Blob);
  }
}

/** POST files + language to a backend endpoint and return the parsed JSON. */
async function postDocument<T>(
  path: string,
  files: SelectedFile[],
  language: AppLanguage,
): Promise<T> {
  const form = new FormData();
  for (const file of files) {
    await appendFile(form, file);
  }
  form.append('language', language);

  let resp: Response;
  try {
    resp = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      body: form,
      // Do NOT set Content-Type — the runtime sets the multipart boundary.
    });
  } catch {
    throw new ApiError(
      `Could not reach the server at ${API_BASE}. Check that the backend is running and on the same network.`,
    );
  }

  if (!resp.ok) {
    let detail = `Request failed (${resp.status}).`;
    try {
      const body = await resp.json();
      if (body?.detail) detail = body.detail;
    } catch {
      /* keep generic message */
    }
    throw new ApiError(detail, resp.status);
  }

  return (await resp.json()) as T;
}

export function analyzeDocument(
  files: SelectedFile[],
  language: AppLanguage,
): Promise<AnalysisResult> {
  return postDocument<AnalysisResult>('/api/analyze', files, language);
}

export function summarizeDocument(
  files: SelectedFile[],
  language: AppLanguage,
): Promise<GenericSummary> {
  return postDocument<GenericSummary>('/api/summarize', files, language);
}

export async function askQuestion(
  documentContext: string,
  question: string,
  language: AppLanguage,
): Promise<string> {
  let resp: Response;
  try {
    resp = await fetch(`${API_BASE}/api/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document_context: documentContext,
        question,
        language,
      }),
    });
  } catch {
    throw new ApiError(`Could not reach the server at ${API_BASE}.`);
  }

  if (!resp.ok) {
    let detail = `Request failed (${resp.status}).`;
    try {
      const body = await resp.json();
      if (body?.detail) detail = body.detail;
    } catch {
      /* keep generic message */
    }
    throw new ApiError(detail, resp.status);
  }

  const body = (await resp.json()) as { answer: string };
  return body.answer;
}

export async function checkHealth(): Promise<boolean> {
  try {
    const resp = await fetch(`${API_BASE}/api/health`);
    return resp.ok;
  } catch {
    return false;
  }
}
