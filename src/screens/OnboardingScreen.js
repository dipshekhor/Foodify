// src/screens/OnboardingScreen.js
// ─────────────────────────────────────────────────────────────────────────────
// First screen for new users. Full medical profile setup.
// Design: Dark Navy + Cyan gradient. Bold header. Glowing chips.
//
// On submit → POST /api/profile → save locally → navigate to Home
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons }       from '@expo/vector-icons';
import { COLORS, GRADIENTS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme/index';
import { createProfile }   from '../api/index';
import { saveUserProfile } from '../storage/userStorage';

// Must match FastAPI Pydantic validator exactly
const DISEASES  = ['Diabetes', 'Hypertension', 'Heart Disease', 'Obesity', 'Kidney Disease'];
const ALLERGIES = ['Nut Allergy', 'Gluten Intolerance', 'Lactose Intolerance'];
const GENDERS   = ['Male', 'Female', 'Other'];

export default function OnboardingScreen({ navigation }) {
  const [name,      setName]      = useState('');
  const [age,       setAge]       = useState('');
  const [gender,    setGender]    = useState('');
  const [heightCm,  setHeightCm]  = useState('');
  const [weightKg,  setWeightKg]  = useState('');
  const [diseases,  setDiseases]  = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [step,      setStep]      = useState(1); // 1 = personal info, 2 = medical info

  // Toggle selection in a multi-select list
  const toggle = (item, list, setList) => {
    setList(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  // Validate step 1 before moving to step 2
  const validateStep1 = () => {
    if (!name.trim())                  { Alert.alert('Required', 'Please enter your name.');       return false; }
    if (!age || isNaN(age) || +age<1)  { Alert.alert('Required', 'Please enter a valid age.');     return false; }
    if (!gender)                       { Alert.alert('Required', 'Please select your gender.');    return false; }
    if (!heightCm || isNaN(heightCm))  { Alert.alert('Required', 'Please enter your height.');    return false; }
    if (!weightKg || isNaN(weightKg))  { Alert.alert('Required', 'Please enter your weight.');    return false; }
    return true;
  };

  // Final submit — calls API
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const savedProfile = await createProfile({
        name:      name.trim(),
        age:       parseInt(age, 10),
        gender,
        height_cm: parseFloat(heightCm),
        weight_kg: parseFloat(weightKg),
        diseases,
        allergies,
      });

      await saveUserProfile(savedProfile);
      // Replace so user cannot go back to onboarding with back button
      navigation.replace('Home', { profile: savedProfile });

    } catch (error) {
      Alert.alert('Connection Error',
        'Could not save your profile.\nMake sure the server is running and try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 1: Personal information ───────────────────────────────────────────
  const renderStep1 = () => (
    <View>
      <Text style={styles.stepLabel}>STEP 1 OF 2  ·  PERSONAL INFO</Text>

      {/* Name */}
      <Text style={styles.fieldLabel}>Full Name</Text>
      <View style={styles.inputWrapper}>
        <Ionicons name="person-outline" size={18} color={COLORS.cyan} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="e.g. Ahmed Rahman"
          placeholderTextColor={COLORS.placeholder}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
      </View>

      {/* Age */}
      <Text style={styles.fieldLabel}>Age</Text>
      <View style={styles.inputWrapper}>
        <Ionicons name="calendar-outline" size={18} color={COLORS.cyan} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="e.g. 45"
          placeholderTextColor={COLORS.placeholder}
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
        />
      </View>

      {/* Gender chips */}
      <Text style={styles.fieldLabel}>Gender</Text>
      <View style={styles.chipRow}>
        {GENDERS.map(g => (
          <TouchableOpacity
            key={g}
            style={[styles.chip, gender === g && styles.chipActive]}
            onPress={() => setGender(g)}
          >
            <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>{g}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Height and Weight */}
      <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.fieldLabel}>Height (cm)</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="resize-outline" size={18} color={COLORS.cyan} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="175"
              placeholderTextColor={COLORS.placeholder}
              value={heightCm}
              onChangeText={setHeightCm}
              keyboardType="numeric"
            />
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.fieldLabel}>Weight (kg)</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="barbell-outline" size={18} color={COLORS.cyan} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="80"
              placeholderTextColor={COLORS.placeholder}
              value={weightKg}
              onChangeText={setWeightKg}
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>

      {/* Next button */}
      <TouchableOpacity
        style={styles.nextBtn}
        onPress={() => { if (validateStep1()) setStep(2); }}
        activeOpacity={0.85}
      >
        <LinearGradient colors={GRADIENTS.cyan} style={styles.btnGradient} start={{x:0,y:0}} end={{x:1,y:0}}>
          <Text style={styles.btnText}>Continue</Text>
          <Ionicons name="arrow-forward" size={18} color={COLORS.navy} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  // ── STEP 2: Medical information ────────────────────────────────────────────
  const renderStep2 = () => (
    <View>
      <Text style={styles.stepLabel}>STEP 2 OF 2  ·  MEDICAL INFO</Text>

      {/* Back to step 1 */}
      <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
        <Ionicons name="arrow-back" size={16} color={COLORS.cyan} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      {/* Chronic conditions */}
      <Text style={styles.fieldLabel}>
        Chronic Conditions
        <Text style={styles.optional}>  (tap all that apply)</Text>
      </Text>
      <Text style={styles.fieldHint}>
        Leave empty if you have no chronic conditions.
      </Text>
      <View style={styles.chipRow}>
        {DISEASES.map(d => (
          <TouchableOpacity
            key={d}
            style={[styles.chip, diseases.includes(d) && styles.chipActive]}
            onPress={() => toggle(d, diseases, setDiseases)}
          >
            {diseases.includes(d) &&
              <Ionicons name="checkmark" size={13} color={COLORS.navy} style={{marginRight:4}} />
            }
            <Text style={[styles.chipText, diseases.includes(d) && styles.chipTextActive]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Allergies */}
      <Text style={[styles.fieldLabel, { marginTop: SPACING.lg }]}>
        Food Allergies
        <Text style={styles.optional}>  (tap all that apply)</Text>
      </Text>
      <View style={styles.chipRow}>
        {ALLERGIES.map(a => (
          <TouchableOpacity
            key={a}
            style={[styles.chip, allergies.includes(a) && styles.chipAvoid]}
            onPress={() => toggle(a, allergies, setAllergies)}
          >
            {allergies.includes(a) &&
              <Ionicons name="alert" size={13} color={COLORS.navy} style={{marginRight:4}} />
            }
            <Text style={[styles.chipText, allergies.includes(a) && styles.chipTextActive]}>{a}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Selected summary */}
      {(diseases.length > 0 || allergies.length > 0) && (
        <View style={styles.summaryBox}>
          <Ionicons name="shield-checkmark" size={16} color={COLORS.cyan} />
          <Text style={styles.summaryText}>
            {diseases.length > 0 && `Conditions: ${diseases.join(', ')}`}
            {diseases.length > 0 && allergies.length > 0 && '\n'}
            {allergies.length > 0 && `Allergies: ${allergies.join(', ')}`}
          </Text>
        </View>
      )}

      {/* Submit */}
      <TouchableOpacity
        style={[styles.nextBtn, { marginTop: SPACING.xl }]}
        onPress={handleSubmit}
        disabled={loading}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={loading ? ['#334155','#334155'] : GRADIENTS.cyan}
          style={styles.btnGradient}
          start={{x:0,y:0}} end={{x:1,y:0}}
        >
          {loading
            ? <ActivityIndicator color={COLORS.navy} />
            : <>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.navy} />
                <Text style={styles.btnText}>Save Profile & Start</Text>
              </>
          }
        </LinearGradient>
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        This app provides nutritional guidance only — not medical advice.{'\n'}
        Always consult your healthcare provider for medical decisions.
      </Text>
    </View>
  );

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <LinearGradient colors={GRADIENTS.background} style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Progress bar */}
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: step === 1 ? '50%' : '100%' }]} />
          </View>

          {/* Logo / app name */}
          <View style={styles.logoRow}>
            <View style={styles.logoIcon}>
              <Ionicons name="nutrition" size={28} color={COLORS.cyan} />
            </View>
            <Text style={styles.appName}>FoodSafe</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>
            {step === 1 ? 'Welcome.\nLet\'s set up your profile.' : 'Almost done.\nTell us about your health.'}
          </Text>

          {/* Form */}
          <View style={styles.formCard}>
            {step === 1 ? renderStep1() : renderStep2()}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scroll: {
    padding: SPACING.lg,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 16 : 60,
    paddingBottom: 60,
  },

  // Progress bar at top
  progressBar: {
    height: 3,
    backgroundColor: COLORS.navyBorder,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.cyan,
    borderRadius: RADIUS.full,
  },

  // App logo
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  logoIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.cyanGlow,
    borderWidth: 1,
    borderColor: COLORS.cyan + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    ...FONTS.h3,
    color: COLORS.cyan,
    letterSpacing: 1,
  },

  // Title
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
    lineHeight: 34,
    marginBottom: SPACING.lg,
  },

  // White-ish card holding the form
  formCard: {
    backgroundColor: COLORS.navyMid,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.navyBorder,
    ...SHADOWS.card,
  },

  stepLabel: {
    ...FONTS.label,
    color: COLORS.cyan,
    marginBottom: SPACING.md,
  },

  fieldLabel: {
    ...FONTS.small,
    color: COLORS.textPrimary,
    fontWeight: '600',
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  fieldHint: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginBottom: SPACING.sm,
  },
  optional: {
    fontWeight: '400',
    color: COLORS.textTertiary,
    fontSize: 12,
  },

  // Input field
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.navyBorder,
    paddingHorizontal: SPACING.md,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 15,
    color: COLORS.textPrimary,
  },

  // Chips — multi-select toggles
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.navyBorder,
    backgroundColor: COLORS.navyLight,
  },
  chipActive: {
    // Selected disease chip — cyan
    backgroundColor: COLORS.cyan,
    borderColor: COLORS.cyan,
  },
  chipAvoid: {
    // Selected allergy chip — red (allergies are dangerous)
    backgroundColor: COLORS.avoid,
    borderColor: COLORS.avoid,
  },
  chipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: COLORS.navy,
    fontWeight: '700',
  },

  // Summary box showing selected diseases/allergies
  summaryBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    backgroundColor: COLORS.cyanGlow,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cyan + '30',
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  summaryText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.cyan,
    lineHeight: 20,
  },

  // Buttons
  nextBtn: {
    borderRadius: RADIUS.md,
    marginTop: SPACING.lg,
    overflow: 'hidden',
    ...SHADOWS.button,
  },
  btnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: 16,
    paddingHorizontal: SPACING.lg,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
  },

  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: SPACING.md,
  },
  backText: {
    fontSize: 14,
    color: COLORS.cyan,
    fontWeight: '600',
  },

  disclaimer: {
    fontSize: 11,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: SPACING.lg,
    lineHeight: 17,
  },
});