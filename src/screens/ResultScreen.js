// src/screens/ResultScreen.js
// ─────────────────────────────────────────────────────────────────────────────
// Shows the full food safety verdict.
// Used by all 3 input modes — manual, OCR, and photo.
//
// Sections:
//   1. Verdict banner — big colored card showing safe/caution/avoid + score
//   2. Nutrient breakdown — calories, sodium, fat, sugar, cholesterol
//   3. Warnings list — reasons the food is problematic
//   4. Positive reasons — why the food is good
//   5. ML prediction — what the ML model said separately
//   6. Action buttons — Check Another / Go Home
//
// Data comes from route.params.result — the verdict object from FastAPI
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons }       from '@expo/vector-icons';

import {
  COLORS, GRADIENTS, FONTS, SPACING, RADIUS, SHADOWS, VERDICT_CONFIG,
} from '../theme/index';

export default function ResultScreen({ navigation, route }) {
  const { result, foodName, inputMode, userId, profile } = route.params || {};

  // Get verdict config (colors, icon, label, message) from theme
  const verdict = result?.verdict || 'caution';
  const config  = VERDICT_CONFIG[verdict] || VERDICT_CONFIG.caution;
  const score   = result?.score ?? 0;
  const food    = result?.food_info || {};

  // ── Score ring color ────────────────────────────────────────────────────────
  // Score 0–100 maps to avoid → caution → safe colors
  const scoreColor =
    score >= 70 ? COLORS.safe :
    score >= 40 ? COLORS.caution :
    COLORS.avoid;

  // ── Nutrient row helper ─────────────────────────────────────────────────────
  const NutrientRow = ({ icon, label, value, unit, highlight }) => (
    <View style={[styles.nutrientRow, highlight && styles.nutrientRowHighlight]}>
      <View style={styles.nutrientIcon}>
        <Ionicons name={icon} size={16} color={highlight ? COLORS.avoid : COLORS.cyan} />
      </View>
      <Text style={styles.nutrientLabel}>{label}</Text>
      <Text style={[styles.nutrientValue, highlight && { color: COLORS.avoid }]}>
        {value !== undefined && value !== null ? `${value}${unit}` : 'N/A'}
      </Text>
    </View>
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <LinearGradient colors={GRADIENTS.background} style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />

      {/* Custom header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Food Safety Result</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Main verdict banner ─────────────────────────────────────────── */}
        <LinearGradient
          colors={config.gradient}
          style={[styles.verdictBanner, { borderColor: config.border }]}
        >
          {/* Food name */}
          <Text style={styles.foodName} numberOfLines={2}>
            {foodName || food.food_item || 'Unknown food'}
          </Text>

          {/* Input mode badge */}
          <View style={styles.modeBadge}>
            <Ionicons
              name={inputMode === 'manual' ? 'search' : inputMode === 'ocr' ? 'scan' : 'camera'}
              size={11}
              color={COLORS.textTertiary}
            />
            <Text style={styles.modeBadgeText}>
              {inputMode === 'manual' ? 'Manual search'
               : inputMode === 'ocr' ? 'Ingredient scan'
               : 'Food photo'}
            </Text>
          </View>

          {/* Score ring + verdict icon */}
          <View style={styles.verdictCenter}>
            {/* Score circle */}
            <View style={[styles.scoreRing, { borderColor: config.color }]}>
              <Text style={[styles.scoreNumber, { color: config.color }]}>{score}</Text>
              <Text style={styles.scoreOutOf}>/100</Text>
            </View>

            {/* Verdict icon */}
            <Ionicons name={config.icon} size={52} color={config.color} />
          </View>

          {/* Verdict label */}
          <View style={[styles.verdictLabelBadge, { backgroundColor: config.color + '22', borderColor: config.border }]}>
            <Text style={[styles.verdictLabelText, { color: config.color }]}>
              {config.label}
            </Text>
          </View>

          {/* Verdict message */}
          <Text style={styles.verdictMessage}>{config.message}</Text>
        </LinearGradient>

        {/* ── Warnings (red) ──────────────────────────────────────────────── */}
        {result?.warnings?.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="warning" size={16} color={COLORS.avoid} />
              <Text style={[styles.sectionTitle, { color: COLORS.avoid }]}>
                Concerns ({result.warnings.length})
              </Text>
            </View>
            {result.warnings.map((w, i) => (
              <View key={i} style={styles.warningRow}>
                <View style={styles.warningDot} />
                <Text style={styles.warningText}>{w}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Positive reasons (green) ────────────────────────────────────── */}
        {result?.reasons?.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.safe} />
              <Text style={[styles.sectionTitle, { color: COLORS.safe }]}>
                Positives ({result.reasons.length})
              </Text>
            </View>
            {result.reasons.map((r, i) => (
              <View key={i} style={styles.reasonRow}>
                <Ionicons name="checkmark" size={14} color={COLORS.safe} />
                <Text style={styles.reasonText}>{r}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Nutrient breakdown ──────────────────────────────────────────── */}
        {food && Object.keys(food).length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="bar-chart-outline" size={16} color={COLORS.cyan} />
              <Text style={styles.sectionTitle}>Nutrient Breakdown</Text>
            </View>

            <View style={styles.nutrientCard}>
              <NutrientRow
                icon="flame-outline"
                label="Calories"
                value={food.calories?.toFixed(0)}
                unit=" kcal"
              />
              <NutrientRow
                icon="water-outline"
                label="Sodium"
                value={food.sodium?.toFixed(0)}
                unit=" mg"
                highlight={
                  // Highlight red if hypertension and high sodium
                  profile?.diseases?.includes('Hypertension') && food.sodium > 600
                }
              />
              <NutrientRow
                icon="nutrition-outline"
                label="Sugar"
                value={food.sugar?.toFixed(1)}
                unit=" g"
                highlight={
                  profile?.diseases?.includes('Diabetes') && food.sugar > 10
                }
              />
              <NutrientRow
                icon="restaurant-outline"
                label="Fat"
                value={food.fat?.toFixed(1)}
                unit=" g"
              />
              <NutrientRow
                icon="leaf-outline"
                label="Fiber"
                value={food.fiber?.toFixed(1)}
                unit=" g"
              />
              <NutrientRow
                icon="fitness-outline"
                label="Protein"
                value={food.protein?.toFixed(1)}
                unit=" g"
              />
              <NutrientRow
                icon="cube-outline"
                label="Carbs"
                value={food.carbs?.toFixed(1)}
                unit=" g"
              />
            </View>
          </View>
        )}

        {/* ── ML prediction badge ─────────────────────────────────────────── */}
        {result?.ml_prediction && (
          <View style={styles.mlBadge}>
            <Ionicons name="hardware-chip-outline" size={13} color={COLORS.textTertiary} />
            <Text style={styles.mlText}>
              ML model prediction:{' '}
              <Text style={{ color: getVerdictColor(result.ml_prediction), fontWeight: '700' }}>
                {result.ml_prediction}
              </Text>
            </Text>
          </View>
        )}

        {/* ── Action buttons ──────────────────────────────────────────────── */}
        <View style={styles.actionRow}>
          {/* Check another food */}
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={16} color={COLORS.cyan} />
            <Text style={styles.secondaryBtnText}>Check Another</Text>
          </TouchableOpacity>

          {/* Go home */}
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('Home')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={GRADIENTS.cyan}
              style={styles.primaryBtnGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <Ionicons name="home-outline" size={16} color={COLORS.navy} />
              <Text style={styles.primaryBtnText}>Home</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Medical disclaimer */}
        <Text style={styles.disclaimer}>
          This result is for informational purposes only and does not constitute
          medical advice. Always consult your healthcare provider.
        </Text>

        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </LinearGradient>
  );
}

// Helper — maps verdict string to color
const getVerdictColor = (v) =>
  v === 'safe' ? COLORS.safe : v === 'avoid' ? COLORS.avoid : COLORS.caution;

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: StatusBar.currentHeight + SPACING.sm,
    paddingBottom: SPACING.md,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.navyLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
  },
  scroll: {
    padding: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: 40,
  },

  // Verdict banner
  verdictBanner: {
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  foodName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: SPACING.lg,
  },
  modeBadgeText: {
    fontSize: 11,
    color: COLORS.textTertiary,
  },
  verdictCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    marginBottom: SPACING.md,
  },
  scoreRing: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.full,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.navyMid,
  },
  scoreNumber: {
    fontSize: 24,
    fontWeight: '800',
  },
  scoreOutOf: {
    fontSize: 11,
    color: COLORS.textTertiary,
  },
  verdictLabelBadge: {
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  verdictLabelText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  verdictMessage: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },

  // Sections
  section: {
    backgroundColor: COLORS.navyMid,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.navyBorder,
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.navyBorder,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.cyan,
  },

  // Warnings
  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    paddingVertical: 5,
  },
  warningDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.avoid,
    marginTop: 6,
    flexShrink: 0,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
  },

  // Reasons
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    paddingVertical: 5,
  },
  reasonText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
  },

  // Nutrients
  nutrientCard: {
    gap: 2,
  },
  nutrientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.navyBorder,
  },
  nutrientRowHighlight: {
    backgroundColor: COLORS.avoidBg,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
  },
  nutrientIcon: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.navyLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nutrientLabel: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  nutrientValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  // ML badge
  mlBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.navyLight,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  mlText: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },

  // Action buttons
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.cyan,
    backgroundColor: COLORS.cyanGlow,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.cyan,
  },
  primaryBtn: {
    flex: 1,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    ...SHADOWS.button,
  },
  primaryBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: 14,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
  },

  disclaimer: {
    fontSize: 11,
    color: COLORS.textTertiary,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: SPACING.md,
  },
});