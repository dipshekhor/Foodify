// src/storage/userStorage.js
// ─────────────────────────────────────────────────────────────────────────────
// Saves the user profile to the phone's local storage.
// This is the "remember me" system — no login screen needed.
//
// On first open → no data → show Onboarding
// On next opens → data found → skip to Home
// ─────────────────────────────────────────────────────────────────────────────

// src/storage/userStorage.js — replace the whole file with this

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  TOKEN:      'foodapp_token',
  USER_ID:    'foodapp_user_id',
  PROFILE:    'foodapp_profile',
  SAVED_AT:   'foodapp_saved_at',   // timestamp when token was saved
};

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;   // 30 days in milliseconds

// ── Save after register or login ──────────────────────────────────────────────
export const saveSession = async (token, profile) => {
  await AsyncStorage.multiSet([
    [KEYS.TOKEN,    token],
    [KEYS.USER_ID,  String(profile.id)],
    [KEYS.PROFILE,  JSON.stringify(profile)],
    [KEYS.SAVED_AT, String(Date.now())],   // record exact time of login
  ]);
};

// ── Load on app open ──────────────────────────────────────────────────────────
// Returns { token, userId, profile } or null if not logged in / expired
export const loadSession = async () => {
  const values = await AsyncStorage.multiGet(
    [KEYS.TOKEN, KEYS.USER_ID, KEYS.PROFILE, KEYS.SAVED_AT]
  );

  const token   = values[0][1];
  const userId  = values[1][1];
  const profile = values[2][1];
  const savedAt = values[3][1];

  // Not logged in at all
  if (!token || !userId || !profile) return null;

  // ── Auto logout check — has it been more than 30 days? ───────────────────
  const savedTime   = parseInt(savedAt, 10);
  const now         = Date.now();
  const daysPassed  = (now - savedTime) / THIRTY_DAYS_MS;

  if (daysPassed >= 30) {
    // 30 days passed — clear everything and force login
    await clearSession();
    return null;   // App.js will redirect to Login
  }

  return {
    token,
    userId:  parseInt(userId, 10),
    profile: JSON.parse(profile),
    daysLeft: Math.floor(30 - daysPassed),   // optional — show in settings
  };
};

// ── Update local profile after editing ────────────────────────────────────────
export const updateLocalProfile = async (updatedProfile) => {
  await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(updatedProfile));
};

// ── Clear on logout or expiry ─────────────────────────────────────────────────
export const clearSession = async () => {
  await AsyncStorage.multiRemove(Object.values(KEYS));
};