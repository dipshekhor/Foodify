// src/theme/index.js
// ─────────────────────────────────────────────────────────────────────────────
// Two complete themes: DARK_THEME (navy/cyan) and LIGHT_THEME (warm ivory/teal)
// Consumed via ThemeContext — never import COLORS directly in screens.
// ─────────────────────────────────────────────────────────────────────────────

// ── Shared layout constants (no colors) ───────────────────────────────────────
export const SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const RADIUS  = { sm: 8, md: 12, lg: 16, xl: 24, full: 999 };

// Colors stripped — screens always override with theme color explicitly
export const FONTS = {
  h1:    { fontSize: 28, fontWeight: '800' },
  h2:    { fontSize: 22, fontWeight: '700' },
  h3:    { fontSize: 18, fontWeight: '700' },
  h4:    { fontSize: 16, fontWeight: '600' },
  body:  { fontSize: 15, fontWeight: '400' },
  small: { fontSize: 13, fontWeight: '400' },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' },
};

// Verdict colors — identical in both themes (green / amber / red never change)
const SAFE_COLOR    = '#10B981';
const CAUTION_COLOR = '#F59E0B';
const AVOID_COLOR   = '#EF4444';

export const VERDICT_CONFIG = {
  safe: {
    color: SAFE_COLOR, bg: SAFE_COLOR + '20', border: SAFE_COLOR + '50',
    gradient: [SAFE_COLOR + '30', SAFE_COLOR + '08'],
    icon: 'checkmark-circle', label: 'SAFE TO EAT',
    message: 'This food is suitable for your medical conditions.',
  },
  caution: {
    color: CAUTION_COLOR, bg: CAUTION_COLOR + '20', border: CAUTION_COLOR + '50',
    gradient: [CAUTION_COLOR + '30', CAUTION_COLOR + '08'],
    icon: 'warning', label: 'EAT WITH CAUTION',
    message: 'This food has some concerns for your conditions.',
  },
  avoid: {
    color: AVOID_COLOR, bg: AVOID_COLOR + '20', border: AVOID_COLOR + '50',
    gradient: [AVOID_COLOR + '30', AVOID_COLOR + '08'],
    icon: 'close-circle', label: 'AVOID THIS FOOD',
    message: 'This food is not recommended for your conditions.',
  },
};

// ── Dark theme — Navy + Cyan ───────────────────────────────────────────────────
const DARK_COLORS = {
  navy:          '#0A0E27',
  navyMid:       '#131736',
  navyLight:     '#1E2348',
  navyBorder:    '#2A3060',
  cyan:          '#00D4FF',
  cyanDark:      '#00A8CC',
  cyanGlow:      '#00D4FF22',
  safe:          SAFE_COLOR,    safeBg:  SAFE_COLOR + '20',    safeBorder:  SAFE_COLOR + '50',
  caution:       CAUTION_COLOR, cautionBg: CAUTION_COLOR + '20', cautionBorder: CAUTION_COLOR + '50',
  avoid:         AVOID_COLOR,   avoidBg: AVOID_COLOR + '20',   avoidBorder: AVOID_COLOR + '50',
  textPrimary:   '#F1F5F9',
  textSecondary: '#94A3B8',
  textTertiary:  '#475569',
  white:         '#FFFFFF',
  inputBg:       '#1E2348',
  placeholder:   '#475569',
  divider:       '#1E2348',
  btnDisabled:   '#334155',
};

const DARK_GRADIENTS = {
  background: ['#0A0E27', '#0D1233', '#0A0E27'],
  cyan:       ['#00D4FF', '#0099CC'],
  card:       ['#1E2348', '#131736'],
  header:     ['#131736', '#0A0E27'],
  safe:       [SAFE_COLOR + '30',    SAFE_COLOR + '08'],
  caution:    [CAUTION_COLOR + '30', CAUTION_COLOR + '08'],
  avoid:      [AVOID_COLOR + '30',   AVOID_COLOR + '08'],
};

const DARK_SHADOWS = {
  card: {
    elevation: 8,
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  button: {
    elevation: 6,
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
};

// ── Light theme — Warm Ivory + Teal ───────────────────────────────────────────
const LIGHT_COLORS = {
  navy:          '#FDFAF3',   // page background (warm ivory)
  navyMid:       '#FFFFFF',   // card background
  navyLight:     '#FDF6E3',   // elevated card / chip background
  navyBorder:    '#E8DFC8',   // borders
  cyan:          '#00A8C6',   // primary accent — readable teal on light bg
  cyanDark:      '#007A94',   // pressed accent
  cyanGlow:      '#00A8C615',
  safe:          SAFE_COLOR,    safeBg: SAFE_COLOR + '15',    safeBorder: SAFE_COLOR + '40',
  caution:       CAUTION_COLOR, cautionBg: CAUTION_COLOR + '15', cautionBorder: CAUTION_COLOR + '40',
  avoid:         AVOID_COLOR,   avoidBg: AVOID_COLOR + '15',   avoidBorder: AVOID_COLOR + '40',
  textPrimary:   '#1A1E3A',
  textSecondary: '#4A506A',
  textTertiary:  '#8A90A8',
  white:         '#FFFFFF',
  inputBg:       '#FFF9EE',
  placeholder:   '#A8A090',
  divider:       '#FDF6E3',
  btnDisabled:   '#CBD5E1',
};

const LIGHT_GRADIENTS = {
  background: ['#FDFAF3', '#FAF5E8', '#FDFAF3'],
  cyan:       ['#00A8C6', '#007A94'],
  card:       ['#FFFFFF', '#FDF6E3'],
  header:     ['#FFFFFF', '#FDFAF3'],
  safe:       [SAFE_COLOR + '20',    SAFE_COLOR + '06'],
  caution:    [CAUTION_COLOR + '20', CAUTION_COLOR + '06'],
  avoid:      [AVOID_COLOR + '20',   AVOID_COLOR + '06'],
};

const LIGHT_SHADOWS = {
  card: {
    elevation: 3,
    shadowColor: '#00A8C6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  button: {
    elevation: 4,
    shadowColor: '#00A8C6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
};

// ── Exported theme objects ─────────────────────────────────────────────────────
export const DARK_THEME = {
  COLORS: DARK_COLORS, GRADIENTS: DARK_GRADIENTS, SHADOWS: DARK_SHADOWS,
  FONTS, SPACING, RADIUS, VERDICT_CONFIG,
};

export const LIGHT_THEME = {
  COLORS: LIGHT_COLORS, GRADIENTS: LIGHT_GRADIENTS, SHADOWS: LIGHT_SHADOWS,
  FONTS, SPACING, RADIUS, VERDICT_CONFIG,
};

// ── Legacy dark exports — for any code that hasn't been migrated ───────────────
export const COLORS    = DARK_COLORS;
export const GRADIENTS = DARK_GRADIENTS;
export const SHADOWS   = DARK_SHADOWS;
