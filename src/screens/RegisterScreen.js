// src/screens/RegisterScreen.js
import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons }       from '@expo/vector-icons';

import { SPACING, RADIUS, FONTS } from '../theme/index';
import { useTheme }    from '../context/ThemeContext';
import { registerUser } from '../api/index';
import { saveSession }  from '../storage/userStorage';

const DISEASES  = ['Diabetes', 'Hypertension', 'Heart Disease', 'Obesity', 'Kidney Disease'];
const ALLERGIES = ['Nut Allergy', 'Gluten Intolerance', 'Lactose Intolerance'];
const GENDERS   = ['Male', 'Female', 'Other'];

export default function RegisterScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const { COLORS, GRADIENTS, SHADOWS } = theme;

  const [step, setStep] = useState(1);

  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw,    setShowPw]    = useState(false);

  const [name,          setName]          = useState('');
  const [age,           setAge]           = useState('');
  const [gender,        setGender]        = useState('');
  const [heightCm,      setHeightCm]      = useState('');
  const [weightKg,      setWeightKg]      = useState('');
  const [activityLevel, setActivityLevel] = useState('');
  const [dietaryPref,   setDietaryPref]   = useState('');

  const [diseases,  setDiseases]  = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [loading,   setLoading]   = useState(false);

  const styles = useMemo(() => makeStyles({ COLORS, GRADIENTS, SHADOWS }), [COLORS]);

  const toggle = (item, list, setList) => {
    setList(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  const validateStep1 = () => {
    if (!email.trim() || !email.includes('@')) { Alert.alert('Invalid Email', 'Please enter a valid email address.'); return false; }
    if (password.length < 6) { Alert.alert('Weak Password', 'Password must be at least 6 characters.'); return false; }
    if (password !== confirmPw) { Alert.alert('Password Mismatch', 'Passwords do not match.'); return false; }
    return true;
  };

  const validateStep2 = () => {
    if (!name.trim())                  { Alert.alert('Required', 'Please enter your name.');    return false; }
    if (!age || isNaN(age) || +age < 1){ Alert.alert('Required', 'Please enter a valid age.');  return false; }
    if (!gender)                       { Alert.alert('Required', 'Please select your gender.'); return false; }
    if (!heightCm || isNaN(heightCm)) { Alert.alert('Required', 'Please enter your height.'); return false; }
    if (!weightKg || isNaN(weightKg)) { Alert.alert('Required', 'Please enter your weight.'); return false; }
    return true;
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      const result = await registerUser({
        email:          email.trim().toLowerCase(),
        password,
        name:           name.trim(),
        age:            parseInt(age, 10),
        gender,
        height_cm:      parseFloat(heightCm),
        weight_kg:      parseFloat(weightKg),
        diseases,
        allergies,
        activity_level: activityLevel || null,
        dietary_pref:   dietaryPref   || null,
      });
      await saveSession(result.token, result.profile);
      navigation.replace('Home', { profile: result.profile });
    } catch (error) {
      console.log('FULL ERROR:', JSON.stringify(error.response?.data));
      const msg = error.response?.data?.detail || error.message || 'Registration failed.';
      Alert.alert('Error ' + error.response?.status, msg);
    } finally {
      setLoading(false);
    }
  };

  const progressWidth = step === 1 ? '33%' : step === 2 ? '66%' : '100%';

  // ── Step 1 ────────────────────────────────────────────────────────────────
  const renderStep1 = () => (
    <View>
      <Text style={styles.stepLabel}>STEP 1 OF 3  ·  CREATE ACCOUNT</Text>

      <Text style={styles.fieldLabel}>Email Address</Text>
      <View style={styles.inputWrapper}>
        <Ionicons name="mail-outline" size={18} color={COLORS.cyan} style={styles.inputIcon} />
        <TextInput style={styles.input} placeholder="you@example.com" placeholderTextColor={COLORS.placeholder}
          value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
      </View>

      <Text style={styles.fieldLabel}>Password</Text>
      <View style={styles.inputWrapper}>
        <Ionicons name="lock-closed-outline" size={18} color={COLORS.cyan} style={styles.inputIcon} />
        <TextInput style={styles.input} placeholder="Minimum 6 characters" placeholderTextColor={COLORS.placeholder}
          value={password} onChangeText={setPassword} secureTextEntry={!showPw} autoCapitalize="none" />
        <TouchableOpacity onPress={() => setShowPw(p => !p)}>
          <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.textTertiary} />
        </TouchableOpacity>
      </View>

      <Text style={styles.fieldLabel}>Confirm Password</Text>
      <View style={styles.inputWrapper}>
        <Ionicons name="lock-closed-outline" size={18} color={COLORS.cyan} style={styles.inputIcon} />
        <TextInput style={styles.input} placeholder="Re-enter password" placeholderTextColor={COLORS.placeholder}
          value={confirmPw} onChangeText={setConfirmPw} secureTextEntry={!showPw} autoCapitalize="none" />
      </View>

      <View style={styles.strengthRow}>
        {[1, 2, 3].map(i => (
          <View key={i} style={[styles.strengthBar,
            password.length >= i * 3 && {
              backgroundColor: password.length >= 9 ? COLORS.safe : password.length >= 6 ? COLORS.caution : COLORS.avoid
            }
          ]} />
        ))}
        <Text style={styles.strengthText}>
          {password.length === 0 ? '' : password.length < 6 ? 'Weak' : password.length < 9 ? 'Medium' : 'Strong'}
        </Text>
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={() => { if (validateStep1()) setStep(2); }} activeOpacity={0.85}>
        <LinearGradient colors={GRADIENTS.cyan} style={styles.btnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Text style={styles.btnText}>Continue</Text>
          <Ionicons name="arrow-forward" size={18} color={COLORS.navy} />
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity style={styles.switchBtn} onPress={() => navigation.replace('Login')}>
        <Text style={styles.switchText}>
          Already have an account?{'  '}<Text style={styles.switchLink}>Sign In</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );

  // ── Step 2 ────────────────────────────────────────────────────────────────
  const renderStep2 = () => (
    <View>
      <Text style={styles.stepLabel}>STEP 2 OF 3  ·  PERSONAL INFO</Text>
      <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
        <Ionicons name="arrow-back" size={16} color={COLORS.cyan} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.fieldLabel}>Full Name</Text>
      <View style={styles.inputWrapper}>
        <Ionicons name="person-outline" size={18} color={COLORS.cyan} style={styles.inputIcon} />
        <TextInput style={styles.input} placeholder="e.g. Ahmed Rahman" placeholderTextColor={COLORS.placeholder}
          value={name} onChangeText={setName} autoCapitalize="words" />
      </View>

      <Text style={styles.fieldLabel}>Age</Text>
      <View style={styles.inputWrapper}>
        <Ionicons name="calendar-outline" size={18} color={COLORS.cyan} style={styles.inputIcon} />
        <TextInput style={styles.input} placeholder="e.g. 45" placeholderTextColor={COLORS.placeholder}
          value={age} onChangeText={setAge} keyboardType="numeric" />
      </View>

      <Text style={styles.fieldLabel}>Gender</Text>
      <View style={styles.chipRow}>
        {GENDERS.map(g => (
          <TouchableOpacity key={g} style={[styles.chip, gender === g && styles.chipActive]} onPress={() => setGender(g)}>
            <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>{g}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.fieldLabel}>Height (cm)</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="resize-outline" size={18} color={COLORS.cyan} style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="175" placeholderTextColor={COLORS.placeholder}
              value={heightCm} onChangeText={setHeightCm} keyboardType="numeric" />
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.fieldLabel}>Weight (kg)</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="barbell-outline" size={18} color={COLORS.cyan} style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="80" placeholderTextColor={COLORS.placeholder}
              value={weightKg} onChangeText={setWeightKg} keyboardType="numeric" />
          </View>
        </View>
      </View>

      <Text style={styles.fieldLabel}>Activity Level</Text>
      <View style={styles.chipRow}>
        {['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active'].map(a => (
          <TouchableOpacity key={a} style={[styles.chip, activityLevel === a && styles.chipActive]} onPress={() => setActivityLevel(a)}>
            <Text style={[styles.chipText, activityLevel === a && styles.chipTextActive]}>{a}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.fieldLabel}>Dietary Preference</Text>
      <View style={styles.chipRow}>
        {['Omnivore', 'Vegetarian', 'Vegan', 'Pescatarian'].map(d => (
          <TouchableOpacity key={d} style={[styles.chip, dietaryPref === d && styles.chipActive]} onPress={() => setDietaryPref(d)}>
            <Text style={[styles.chipText, dietaryPref === d && styles.chipTextActive]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={() => { if (validateStep2()) setStep(3); }} activeOpacity={0.85}>
        <LinearGradient colors={GRADIENTS.cyan} style={styles.btnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Text style={styles.btnText}>Continue</Text>
          <Ionicons name="arrow-forward" size={18} color={COLORS.navy} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  // ── Step 3 ────────────────────────────────────────────────────────────────
  const renderStep3 = () => (
    <View>
      <Text style={styles.stepLabel}>STEP 3 OF 3  ·  MEDICAL INFO</Text>
      <TouchableOpacity style={styles.backBtn} onPress={() => setStep(2)}>
        <Ionicons name="arrow-back" size={16} color={COLORS.cyan} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.fieldLabel}>
        Chronic Conditions<Text style={styles.optional}>  (select all that apply)</Text>
      </Text>
      <Text style={styles.fieldHint}>Leave empty if you have no chronic conditions.</Text>
      <View style={styles.chipRow}>
        {DISEASES.map(d => (
          <TouchableOpacity key={d} style={[styles.chip, diseases.includes(d) && styles.chipActive]} onPress={() => toggle(d, diseases, setDiseases)}>
            {diseases.includes(d) && <Ionicons name="checkmark" size={13} color={COLORS.navy} style={{ marginRight: 4 }} />}
            <Text style={[styles.chipText, diseases.includes(d) && styles.chipTextActive]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.fieldLabel, { marginTop: SPACING.lg }]}>
        Food Allergies<Text style={styles.optional}>  (select all that apply)</Text>
      </Text>
      <View style={styles.chipRow}>
        {ALLERGIES.map(a => (
          <TouchableOpacity key={a} style={[styles.chip, allergies.includes(a) && styles.chipAvoid]} onPress={() => toggle(a, allergies, setAllergies)}>
            {allergies.includes(a) && <Ionicons name="alert" size={13} color={COLORS.navy} style={{ marginRight: 4 }} />}
            <Text style={[styles.chipText, allergies.includes(a) && styles.chipTextActive]}>{a}</Text>
          </TouchableOpacity>
        ))}
      </View>

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

      <TouchableOpacity style={[styles.primaryBtn, { marginTop: SPACING.xl }]} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
        <LinearGradient
          colors={loading ? [COLORS.btnDisabled, COLORS.btnDisabled] : GRADIENTS.cyan}
          style={styles.btnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        >
          {loading
            ? <ActivityIndicator color={COLORS.navy} />
            : <><Ionicons name="checkmark-circle" size={18} color={COLORS.navy} /><Text style={styles.btnText}>Create Account</Text></>
          }
        </LinearGradient>
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        This app provides nutritional guidance only — not medical advice.{'\n'}
        Always consult your healthcare provider for medical decisions.
      </Text>
    </View>
  );

  return (
    <LinearGradient colors={GRADIENTS.background} style={{ flex: 1 }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={COLORS.navy} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
          <View style={styles.logoRow}>
            <View style={styles.logoIcon}>
              <Ionicons name="nutrition" size={26} color={COLORS.cyan} />
            </View>
            <Text style={styles.appName}>FoodSafe</Text>
          </View>
          <Text style={styles.title}>
            {step === 1 && 'Create your\naccount.'}
            {step === 2 && 'Tell us about\nyourself.'}
            {step === 3 && 'Almost done.\nYour health profile.'}
          </Text>
          <View style={styles.formCard}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const makeStyles = ({ COLORS, SHADOWS }) => StyleSheet.create({
  scroll: {
    padding: SPACING.lg,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 16 : 60,
    paddingBottom: 60,
  },
  progressBar: { height: 3, backgroundColor: COLORS.navyBorder, borderRadius: RADIUS.full, marginBottom: SPACING.lg, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.cyan, borderRadius: RADIUS.full },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  logoIcon: {
    width: 42, height: 42, borderRadius: RADIUS.md,
    backgroundColor: COLORS.cyanGlow, borderWidth: 1, borderColor: COLORS.cyan + '40',
    alignItems: 'center', justifyContent: 'center',
  },
  appName: { ...FONTS.h3, color: COLORS.cyan, letterSpacing: 1 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.textPrimary, lineHeight: 34, marginBottom: SPACING.lg },
  formCard: {
    backgroundColor: COLORS.navyMid, borderRadius: RADIUS.xl, padding: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.navyBorder, ...SHADOWS.card,
  },
  stepLabel: { ...FONTS.label, color: COLORS.cyan, marginBottom: SPACING.md },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, marginTop: SPACING.md, marginBottom: SPACING.xs },
  fieldHint: { fontSize: 12, color: COLORS.textTertiary, marginBottom: SPACING.sm },
  optional: { fontWeight: '400', color: COLORS.textTertiary, fontSize: 12 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.inputBg, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.navyBorder, paddingHorizontal: SPACING.md, marginBottom: 2,
  },
  inputIcon: { marginRight: SPACING.sm },
  input: { flex: 1, paddingVertical: 13, fontSize: 15, color: COLORS.textPrimary },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: SPACING.sm, marginBottom: SPACING.xs },
  strengthBar: { flex: 1, height: 3, borderRadius: RADIUS.full, backgroundColor: COLORS.navyBorder },
  strengthText: { fontSize: 11, color: COLORS.textTertiary, width: 50 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.xs },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: RADIUS.full, borderWidth: 1.5,
    borderColor: COLORS.navyBorder, backgroundColor: COLORS.navyLight,
  },
  chipActive: { backgroundColor: COLORS.cyan, borderColor: COLORS.cyan },
  chipAvoid:  { backgroundColor: COLORS.avoid, borderColor: COLORS.avoid },
  chipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  chipTextActive: { color: COLORS.navy, fontWeight: '700' },
  summaryBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm,
    backgroundColor: COLORS.cyanGlow, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.cyan + '30', padding: SPACING.md, marginTop: SPACING.md,
  },
  summaryText: { flex: 1, fontSize: 13, color: COLORS.cyan, lineHeight: 20 },
  primaryBtn: { borderRadius: RADIUS.md, marginTop: SPACING.lg, overflow: 'hidden', ...SHADOWS.button },
  btnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: 16 },
  btnText: { fontSize: 16, fontWeight: '700', color: COLORS.navy },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: SPACING.md },
  backText: { fontSize: 14, color: COLORS.cyan, fontWeight: '600' },
  switchBtn: { alignItems: 'center', marginTop: SPACING.lg, padding: SPACING.sm },
  switchText: { fontSize: 14, color: COLORS.textSecondary },
  switchLink: { color: COLORS.cyan, fontWeight: '700' },
  disclaimer: { fontSize: 11, color: COLORS.textTertiary, textAlign: 'center', marginTop: SPACING.lg, lineHeight: 17 },
});
