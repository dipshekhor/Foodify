// src/screens/ManualSearchScreen.js
import React, { useState, useRef, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, ActivityIndicator,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons }       from '@expo/vector-icons';

import { SPACING, RADIUS, FONTS } from '../theme/index';
import { useTheme }               from '../context/ThemeContext';
import { checkFoodByName, getErrorMessage } from '../api/index';
import { FOOD_LIST } from '../data/foodList';

export default function ManualSearchScreen({ navigation, route }) {
  const { theme, isDark } = useTheme();
  const { COLORS, GRADIENTS, SHADOWS } = theme;

  const { userId, profile } = route.params || {};
  const [query,   setQuery]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef(null);

  const filteredSuggestions = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const matched = FOOD_LIST.filter(s => s.toLowerCase().includes(q));
    matched.sort((a, b) => {
      const aStarts = a.toLowerCase().startsWith(q);
      const bStarts = b.toLowerCase().startsWith(q);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.localeCompare(b);
    });
    return matched.slice(0, 12);
  }, [query]);

  const styles = useMemo(() => makeStyles({ COLORS, SHADOWS }), [COLORS]);

  const handleSearch = async (foodName) => {
    const searchTerm = foodName || query;
    if (!searchTerm.trim()) { Alert.alert('Enter a food', 'Please type a food name to check.'); return; }
    setLoading(true);
    try {
      const result = await checkFoodByName(userId, searchTerm.trim());
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
        Alert.alert('Food Not Found', `"${searchTerm}" was not found in our database.\n\nTry a simpler name — for example "chicken" instead of "grilled chicken breast".`);
      } else {
        Alert.alert('Error', getErrorMessage(error));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={GRADIENTS.background} style={{ flex: 1 }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={COLORS.navy} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Search Food</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.searchCard}>
            <Text style={styles.searchLabel}>FOOD NAME</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="search" size={18} color={COLORS.cyan} style={{ marginRight: SPACING.sm }} />
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder="e.g. Scrambled Eggs, Banana..."
                placeholderTextColor={COLORS.placeholder}
                value={query}
                onChangeText={(text) => { setQuery(text); setShowDropdown(true); }}
                autoCapitalize="words"
                returnKeyType="search"
                onSubmitEditing={() => { setShowDropdown(false); handleSearch(); }}
                autoFocus
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => { setQuery(''); setShowDropdown(false); }}>
                  <Ionicons name="close-circle" size={18} color={COLORS.textTertiary} />
                </TouchableOpacity>
              )}
            </View>

            {showDropdown && filteredSuggestions.length > 0 && (
              <View style={styles.dropdown}>
                {filteredSuggestions.map(s => (
                  <TouchableOpacity
                    key={s}
                    style={styles.dropdownItem}
                    onPress={() => { setQuery(s); setShowDropdown(false); handleSearch(s); }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="search-outline" size={13} color={COLORS.cyan} style={{ marginRight: 8 }} />
                    <Text style={styles.dropdownText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.hintRow}>
              <Ionicons name="information-circle-outline" size={13} color={COLORS.textTertiary} />
              <Text style={styles.hintText}>Typos are OK — our system uses smart matching</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.checkBtn}
            onPress={() => handleSearch()}
            disabled={loading || !query.trim()}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={loading || !query.trim() ? [COLORS.btnDisabled, COLORS.btnDisabled] : GRADIENTS.cyan}
              style={styles.checkBtnGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              {loading
                ? <ActivityIndicator color={COLORS.navy} />
                : <><Ionicons name="shield-checkmark-outline" size={20} color={COLORS.navy} /><Text style={styles.checkBtnText}>Check This Food</Text></>
              }
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.suggestionsLabel}>QUICK SUGGESTIONS</Text>
          <View style={styles.suggestionsGrid}>
            {[
              'Scrambled Eggs', 'Banana', 'Grilled Chicken Salad', 'Brown Rice',
              'Whole Wheat Toast', 'Orange Juice', 'Greek Yogurt', 'Almonds',
              'Grilled Salmon', 'Oatmeal', 'Apple', 'Avocado Toast',
            ].map(s => (
              <TouchableOpacity
                key={s} style={styles.suggestionChip}
                onPress={() => { setQuery(s); setShowDropdown(false); handleSearch(s); }}
                disabled={loading} activeOpacity={0.75}
              >
                <Ionicons name="fast-food-outline" size={13} color={COLORS.cyan} />
                <Text style={styles.suggestionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.profileReminder}>
            <Ionicons name="shield-outline" size={14} color={COLORS.cyan} />
            <Text style={styles.profileReminderText}>
              Checking for:{' '}
              <Text style={{ color: COLORS.textPrimary }}>
                {profile?.diseases?.length > 0 ? profile.diseases.join(', ') : 'No conditions'}
              </Text>
              {profile?.allergies?.length > 0 && `  ·  Allergies: ${profile.allergies.join(', ')}`}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const makeStyles = ({ COLORS, SHADOWS }) => StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: StatusBar.currentHeight + SPACING.sm,
    paddingBottom: SPACING.md,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.navyLight, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { ...FONTS.h4, color: COLORS.textPrimary },
  scroll: { padding: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: 60 },
  searchCard: {
    backgroundColor: COLORS.navyMid, borderRadius: RADIUS.lg, padding: SPACING.md,
    borderWidth: 1, borderColor: COLORS.navyBorder, marginBottom: SPACING.md, ...SHADOWS.card,
  },
  searchLabel: { ...FONTS.label, color: COLORS.cyan, marginBottom: SPACING.sm },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.inputBg, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.navyBorder, paddingHorizontal: SPACING.md,
  },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: COLORS.textPrimary },
  dropdown: {
    backgroundColor: COLORS.navyLight,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cyan + '40',
    marginTop: SPACING.xs,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.navyBorder,
  },
  dropdownText: { fontSize: 14, color: COLORS.textPrimary },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: SPACING.sm },
  hintText: { fontSize: 11, color: COLORS.textTertiary },
  checkBtn: { borderRadius: RADIUS.md, overflow: 'hidden', marginBottom: SPACING.xl, ...SHADOWS.button },
  checkBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: 16 },
  checkBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.navy },
  suggestionsLabel: { ...FONTS.label, color: COLORS.textTertiary, marginBottom: SPACING.sm },
  suggestionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg },
  suggestionChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.navyLight, borderRadius: RADIUS.full,
    paddingVertical: 8, paddingHorizontal: 12,
    borderWidth: 1, borderColor: COLORS.navyBorder,
  },
  suggestionText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  profileReminder: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: COLORS.cyanGlow, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.cyan + '30', padding: SPACING.md,
  },
  profileReminderText: { flex: 1, fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
});
