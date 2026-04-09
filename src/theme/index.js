// src/theme/index.js
// ─────────────────────────────────────────────────────────────────────────────
// Global design system — Dark Navy + Cyan premium theme.
// Every screen and component imports colors/fonts/spacing from here.
// Change a value here → changes everywhere in the app.
// ─────────────────────────────────────────────────────────────────────────────

export const COLORS = {
  // ── Primary palette ────────────────────────────────────────────────────────
  navy:        '#0A0E27',   // darkest background — almost black with blue tint
  navyMid:     '#131736',   // card backgrounds
  navyLight:   '#1E2348',   // elevated cards, input backgrounds
  navyBorder:  '#2A3060',   // subtle borders

  cyan:        '#00D4FF',   // primary accent — bright cyan
  cyanDark:    '#00A8CC',   // pressed state / darker cyan
  cyanGlow:    '#00D4FF22', // cyan with low opacity — glow effect

  // ── Verdict colors ─────────────────────────────────────────────────────────
  // Used on the result screen to show safe / caution / avoid
  safe:        '#10B981',   // emerald green
  safeBg:      '#10B98120',
  safeBorder:  '#10B98150',

  caution:     '#F59E0B',   // amber yellow
  cautionBg:   '#F59E0B20',
  cautionBorder:'#F59E0B50',

  avoid:       '#EF4444',   // red
  avoidBg:     '#EF444420',
  avoidBorder: '#EF444450',

  // ── Text ──────────────────────────────────────────────────────────────────
  textPrimary:   '#F1F5F9',  // near-white — main text on dark background
  textSecondary: '#94A3B8',  // muted text — labels, subtitles
  textTertiary:  '#475569',  // very muted — hints, placeholders

  // ── UI ────────────────────────────────────────────────────────────────────
  white:         '#FFFFFF',
  inputBg:       '#1E2348',  // text input background
  placeholder:   '#475569',
  divider:       '#1E2348',
};

// ── Gradient presets — passed to expo-linear-gradient ─────────────────────────
export const GRADIENTS = {
  // Main background gradient — top of screen to bottom
  background: ['#0A0E27', '#0D1233', '#0A0E27'],

  // Cyan accent gradient — used on buttons and highlights
  cyan: ['#00D4FF', '#0099CC'],

  // Card gradient — subtle depth effect on cards
  card: ['#1E2348', '#131736'],

  // Header gradient
  header: ['#131736', '#0A0E27'],

  // Verdict gradients
  safe:    ['#10B98130', '#10B98108'],
  caution: ['#F59E0B30', '#F59E0B08'],
  avoid:   ['#EF444430', '#EF444408'],
};

// ── Typography ────────────────────────────────────────────────────────────────
export const FONTS = {
  h1:    { fontSize: 28, fontWeight: '800', color: COLORS.textPrimary },
  h2:    { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary },
  h3:    { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  h4:    { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
  body:  { fontSize: 15, fontWeight: '400', color: COLORS.textPrimary },
  small: { fontSize: 13, fontWeight: '400', color: COLORS.textSecondary },
  label: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary,
           letterSpacing: 0.8, textTransform: 'uppercase' },
};

// ── Spacing ───────────────────────────────────────────────────────────────────
export const SPACING = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
};

// ── Border radius ─────────────────────────────────────────────────────────────
export const RADIUS = {
  sm: 8, md: 12, lg: 16, xl: 24, full: 999,
};

// ── Shadows (Android uses elevation, iOS uses shadow props) ───────────────────
export const SHADOWS = {
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

// ── Verdict config — maps verdict string to colors, icon, message ─────────────
// Used on ResultScreen to show the right colors and text
export const VERDICT_CONFIG = {
  safe: {
    color:       COLORS.safe,
    bg:          COLORS.safeBg,
    border:      COLORS.safeBorder,
    gradient:    GRADIENTS.safe,
    icon:        'checkmark-circle',
    label:       'SAFE TO EAT',
    message:     'This food is suitable for your medical conditions.',
  },
  caution: {
    color:       COLORS.caution,
    bg:          COLORS.cautionBg,
    border:      COLORS.cautionBorder,
    gradient:    GRADIENTS.caution,
    icon:        'warning',
    label:       'EAT WITH CAUTION',
    message:     'This food has some concerns for your conditions.',
  },
  avoid: {
    color:       COLORS.avoid,
    bg:          COLORS.avoidBg,
    border:      COLORS.avoidBorder,
    gradient:    GRADIENTS.avoid,
    icon:        'close-circle',
    label:       'AVOID THIS FOOD',
    message:     'This food is not recommended for your conditions.',
  },
};