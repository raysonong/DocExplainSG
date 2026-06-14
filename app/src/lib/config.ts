/**
 * Resolves the backend base URL.
 *
 * Priority:
 *   1. EXPO_PUBLIC_API_BASE env var (set this for a deployed backend).
 *   2. The Metro dev server's host with port 8000 — so a phone on the same
 *      Wi-Fi reaches your machine automatically (not `localhost`, which on a
 *      device would mean the phone itself).
 *   3. localhost:8000 fallback (web / simulator).
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEFAULT_PORT = 8000;

function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE;
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  // hostUri looks like "192.168.1.42:8081" in dev.
  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri ? String(hostUri).split(':')[0] : undefined;

  if (host && Platform.OS !== 'web') {
    return `http://${host}:${DEFAULT_PORT}`;
  }
  return `http://localhost:${DEFAULT_PORT}`;
}

export const API_BASE = resolveBaseUrl();
