// src/screens/ManualSearchScreen.js
// ─────────────────────────────────────────────────────────────────────────────
// Input Mode 3 — user types a food name.
// Fuzzy matching on the backend handles typos.
//
// Flow:
//   User types food name → taps Check → POST /api/check-food
//   → navigate to Result screen with the verdict data
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, ActivityIndicator,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons }       from '@expo/vector-icons';

import { COLORS, GRADIENTS, SPACING, RADIUS, SHADOWS, FONTS } from '../theme/index';
import { checkFoodByName, getErrorMessage } from '../api/index';

// Quick suggestion chips — common foods users search for
const SUGGESTIONS = [
  'Scrambled Eggs', 'Banana', 'Grilled Chicken', 'White Rice',
  'Whole Wheat Bread', 'Orange Juice', 'Greek Yogurt', 'Almonds',
  'Salmon', 'Oatmeal', 'Apple', 'Cheese',
];

export default function ManualSearchScreen({ navigation, route }) {
  const { userId, profile } = route.params || {};

  const [query,   setQuery]   = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  // ── Search handler ──────────────────────────────────────────────────────────
  const handleSearch = async (foodName) => {
    const searchTerm = foodName || query;

    if (!searchTerm.trim()) {
      Alert.alert('Enter a food', 'Please type a food name to check.');
      return;
    }

    setLoading(true);
    try {
      // POST /api/check-food → returns verdict object
      const result = await checkFoodByName(userId, searchTerm.trim());

      // Navigate to Result screen — pass all data needed to display verdict
      navigation.navigate('Result', {
        result,
        foodName:  result.food_info?.food_item || searchTerm,
        inputMode: 'manual',
        profile,
        userId,
      });

    } catch (error) {
      const status = error.response?.status;
      if (status === 404) {
        Alert.alert(
          'Food Not Found',
          `"${searchTerm}" was not found in our database.\n\nTry a simpler name — for example "chicken" instead of "grilled chicken breast".`
        );
      } else {
        Alert.alert('Error', getErrorMessage(error));
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <LinearGradient colors={GRADIENTS.background} style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Custom header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Search Food</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Search bar */}
          <View style={styles.searchCard}>
            <Text style={styles.searchLabel}>FOOD NAME</Text>
            <View style={styles.searchRow}>
              <View style={styles.inputWrapper}>
                <Ionicons name="search" size={18} color={COLORS.cyan} style={{ marginRight: SPACING.sm }} />
                <TextInput
                  ref={inputRef}
                  style={styles.input}
                  placeholder="e.g. Scrambled Eggs, Banana..."
                  placeholderTextColor={COLORS.placeholder}
                  value={query}
                  onChangeText={setQuery}
                  autoCapitalize="words"
                  returnKeyType="search"
                  onSubmitEditing={() => handleSearch()}
                  autoFocus
                />
                {query.length > 0 && (
                  <TouchableOpacity onPress={() => setQuery('')}>
                    <Ionicons name="close-circle" size={18} color={COLORS.textTertiary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Typo hint */}
            <View style={styles.hintRow}>
              <Ionicons name="information-circle-outline" size={13} color={COLORS.textTertiary} />
              <Text style={styles.hintText}>
                Typos are OK — our system uses smart matching
              </Text>
            </View>
          </View>

          {/* Check button */}
          <TouchableOpacity
            style={styles.checkBtn}
            onPress={() => handleSearch()}
            disabled={loading || !query.trim()}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={loading || !query.trim() ? ['#334155', '#334155'] : GRADIENTS.cyan}
              style={styles.checkBtnGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              {loading
                ? <ActivityIndicator color={COLORS.navy} />
                : <>
                    <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.navy} />
                    <Text style={styles.checkBtnText}>Check This Food</Text>
                  </>
              }
            </LinearGradient>
          </TouchableOpacity>

          {/* Quick suggestions */}
          <Text style={styles.suggestionsLabel}>QUICK SUGGESTIONS</Text>
          <View style={styles.suggestionsGrid}>
            {SUGGESTIONS.map(s => (
              <TouchableOpacity
                key={s}
                style={styles.suggestionChip}
                onPress={() => {
                  setQuery(s);
                  handleSearch(s);
                }}
                disabled={loading}
                activeOpacity={0.75}
              >
                <Ionicons name="fast-food-outline" size={13} color={COLORS.cyan} />
                <Text style={styles.suggestionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Profile reminder */}
          <View style={styles.profileReminder}>
            <Ionicons name="shield-outline" size={14} color={COLORS.cyan} />
            <Text style={styles.profileReminderText}>
              Checking for:{' '}
              <Text style={{ color: COLORS.textPrimary }}>
                {profile?.diseases?.length > 0
                  ? profile.diseases.join(', ')
                  : 'No conditions'}
              </Text>
              {profile?.allergies?.length > 0 &&
                `  ·  Allergies: ${profile.allergies.join(', ')}`
              }
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

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
    paddingBottom: 60,
  },
  searchCard: {
    backgroundColor: COLORS.navyMid,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.navyBorder,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  searchLabel: {
    ...FONTS.label,
    color: COLORS.cyan,
    marginBottom: SPACING.sm,
  },
  searchRow: {
    gap: SPACING.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.navyBorder,
    paddingHorizontal: SPACING.md,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: SPACING.sm,
  },
  hintText: {
    fontSize: 11,
    color: COLORS.textTertiary,
  },
  checkBtn: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginBottom: SPACING.xl,
    ...SHADOWS.button,
  },
  checkBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: 16,
  },
  checkBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
  },
  suggestionsLabel: {
    ...FONTS.label,
    color: COLORS.textTertiary,
    marginBottom: SPACING.sm,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.navyLight,
    borderRadius: RADIUS.full,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.navyBorder,
  },
  suggestionText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  profileReminder: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: COLORS.cyanGlow,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cyan + '30',
    padding: SPACING.md,
  },
  profileReminderText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});