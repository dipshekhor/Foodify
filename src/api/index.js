// src/api/index.js
// ─────────────────────────────────────────────────────────────────────────────
// All FastAPI communication lives here.
// ONE place to change the IP — nothing else needs updating.
//
// CHANGE THIS: replace with your laptop's actual WiFi IP address
// Find it: PowerShell → ipconfig → IPv4 Address under Wi-Fi
// ─────────────────────────────────────────────────────────────────────────────

import axios from 'axios';

// !! CHANGE THIS to your laptop IP !!
export const API_BASE_URL = 'http://172.20.10.2:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

const _guessMimeType = (uri = '') => {
  const lower = String(uri).toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.heic')) return 'image/heic';
  if (lower.endsWith('.heif')) return 'image/heif';
  return 'image/jpeg';
};

const _extractErrorDetail = (data) => {
  if (!data) return null;
  if (typeof data === 'string') return data;
  if (typeof data.detail === 'string') return data.detail;
  if (Array.isArray(data.detail)) {
    return data.detail
      .map((item) => {
        if (!item) return '';
        if (typeof item === 'string') return item;
        const loc = Array.isArray(item.loc) ? item.loc.join('.') : '';
        const msg = item.msg || '';
        return loc ? `${loc}: ${msg}` : msg;
      })
      .filter(Boolean)
      .join('\n');
  }
  return null;
};
// ── Auth endpoints — add these to src/api/index.js ───────────────────────────

// Register new account
// data: { email, password, name, age, gender, height_cm, weight_kg, diseases, allergies }
// Returns: { token, user_id, profile }
export const registerUser = async (data) => {
  const res = await api.post('/api/auth/register', data);
  return res.data;
};

// Login with email + password
// Returns: { token, user_id, profile }
export const loginUser = async (email, password) => {
  const res = await api.post('/api/auth/login', { email, password });
  return res.data;
};

// Verify saved token is still valid — call on app open
// Returns profile if valid, throws 401 if expired
export const verifyToken = async (token) => {
  const res = await api.get(`/api/auth/me?token=${token}`);
  return res.data;
};
// ── Health check ──────────────────────────────────────────────────────────────
export const checkServerHealth = async () => {
  const res = await api.get('/health');
  return res.data;
};

// ── Profile ───────────────────────────────────────────────────────────────────
export const createProfile = async (data) => {
  const res = await api.post('/api/profile', data);
  return res.data;
};

export const getProfile = async (userId) => {
  const res = await api.get(`/api/profile/${userId}`);
  return res.data;
};

export const updateProfile = async (userId, data) => {
  const res = await api.put(`/api/profile/${userId}`, data);
  return res.data;
};

// ── Food checks — 3 input modes ───────────────────────────────────────────────

// Mode 3: Manual text input
export const checkFoodByName = async (userId, foodName) => {
  const res = await api.post('/api/check-food', {
    user_id: userId,
    food_name: foodName,
  });
  return res.data;
};

// Mode 1: OCR text (frontend already extracted text)
export const checkFoodByOCR = async (userId, ocrText) => {
  const res = await api.post('/api/analyze-ocr', {
    user_id: userId,
    ocr_text: ocrText,
  });
  return res.data;
};

// Mode 1 (alternative): Send raw image, backend runs Tesseract
export const checkFoodByOCRImage = async (userId, imageUri) => {
  if (!userId) throw new Error('Missing user ID. Please sign in again.');
  if (!imageUri) throw new Error('No image selected for OCR scan.');

  const formData = new FormData();
  formData.append('user_id', String(userId));
  formData.append('file', {
    uri: imageUri,
    type: _guessMimeType(imageUri),
    name: 'scan.jpg',
  });
  const res = await axios.post(
    `${API_BASE_URL}/api/analyze-ocr-image`,
    formData,
    { timeout: 60000 }
  );
  return res.data;
};

// Mode 1 (bilingual): Send raw nutrition-facts photo, backend runs two-tier OCR
// (Google Cloud Vision → Tesseract fallback) and returns the medical-rules verdict.
export const checkFoodByNutritionImage = async (userId, imageUri) => {
  if (!userId) throw new Error('Missing user ID. Please sign in again.');
  if (!imageUri) throw new Error('No image selected for nutrition scan.');

  const formData = new FormData();
  formData.append('user_id', String(userId));
  formData.append('file', {
    uri: imageUri,
    type: _guessMimeType(imageUri),
    name: 'nutrition.jpg',
  });
  const res = await axios.post(
    `${API_BASE_URL}/api/analyze-nutrition-image`,
    formData,
    { timeout: 60000 }
  );
  return res.data;
};

// Mode 2: Image model prediction from teammate
export const checkFoodByImagePrediction = async (userId, foodLabel, confidence) => {
  const res = await api.post('/api/analyze-image', {
    user_id:    userId,
    food_label: foodLabel,
    confidence,
  });
  return res.data;
};

// Photo -> local teammate image model endpoint
// Returns: { food_label, confidence, raw_food_label }
export const predictFoodFromPhoto = async (imageUri) => {
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    type: _guessMimeType(imageUri),
    name: 'food.jpg',
  });

  const res = await axios.post(
    `${API_BASE_URL}/api/image-model/predict`,
    formData,
    { timeout: 30000 }
  );

  return res.data;
};

// ── History ───────────────────────────────────────────────────────────────────
export const getFoodHistory = async (userId, limit = 20) => {
  const res = await api.get(`/api/history/${userId}?limit=${limit}`);
  return res.data;
};

export const getFoodCheckDetail = async (userId, checkId) => {
  const res = await api.get(`/api/history/${userId}/${checkId}`);
  return res.data;
};

export const deleteFoodCheck = async (checkId) => {
  const res = await api.delete(`/api/history/${checkId}`);
  return res.data;
};

// ── Blog ──────────────────────────────────────────────────────────────────────
// Token is read fresh per call so it always reflects the current session.
const _getAuthHeader = async () => {
  const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
  const token = await AsyncStorage.getItem('foodapp_token');
  return { Authorization: `Bearer ${token}` };
};

export const getBlogPosts = async () => {
  const res = await api.get('/api/blog/posts');
  return res.data;
};

export const createBlogPost = async ({ title, body }) => {
  const headers = await _getAuthHeader();
  const res = await api.post('/api/blog/posts', { title, body }, { headers });
  return res.data;
};

export const getBlogPost = async (postId) => {
  const res = await api.get(`/api/blog/posts/${postId}`);
  return res.data;
};

export const createBlogAnswer = async (postId, body) => {
  const headers = await _getAuthHeader();
  const res = await api.post(`/api/blog/posts/${postId}/answers`, { body }, { headers });
  return res.data;
};

export const deleteBlogPost = async (postId) => {
  const headers = await _getAuthHeader();
  await api.delete(`/api/blog/posts/${postId}`, { headers });
};

export const deleteBlogAnswer = async (answerId) => {
  const headers = await _getAuthHeader();
  await api.delete(`/api/blog/answers/${answerId}`, { headers });
};

// ── Error message helper ──────────────────────────────────────────────────────
// Call this in catch blocks to get a clean string for Alert.alert()
export const getErrorMessage = (error) => {
  if (error.response) {
    const { status, data } = error.response;
    if (status === 404) return data?.detail || 'Not found.';
    if (status === 422) {
      return _extractErrorDetail(data) || 'Invalid input. Please check your entries.';
    }
    if (status === 400) return data?.detail || 'Bad request.';
    if (status === 503) return 'Server is starting up. Try again in a moment.';
    return _extractErrorDetail(data) || `Server error (${status})`;
  }
  if (error.request) {
    return `Cannot reach server.\n\nCheck:\n• Docker is running\n• Phone & laptop on same WiFi\n• IP in api/index.js is ${API_BASE_URL}`;
  }
  return error.message || 'Something went wrong.';
};