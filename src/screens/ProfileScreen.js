// src/screens/ProfileScreen.js
import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons }       from '@expo/vector-icons';

import { SPACING, RADIUS, FONTS } from '../theme/index';
import { useTheme }               from '../context/ThemeContext';
import { updateProfile, getErrorMessage } from '../api/index';
import { updateLocalProfile, loadSession } from '../storage/userStorage';

const DISEASES      = ['Diabetes', 'Hypertension', 'Heart Disease', 'Obesity', 'Kidney Disease'];
const ALLERGIES     = ['Nut Allergy', 'Gluten Intolerance', 'Lactose Intolerance'];
const GENDERS       = ['Male', 'Female', 'Other'];
const ACTIVITY_OPTS = ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active'];
const DIETARY_OPTS  = ['Omnivore', 'Vegetarian', 'Vegan', 'Pescatarian'];

export default function ProfileScreen({ navigation, route }) {
  const { theme, isDark } = useTheme();
  const { COLORS, GRADIENTS, SHADOWS } = theme;

  const { profile, userId } = route.params;

  const [name,          setName]          = useState(profile?.name              || '');
  const [age,           setAge]           = useState(profile?.age?.toString()   || '');
  const [gender,        setGender]        = useState(profile?.gender            || '');
  const [heightCm,      setHeightCm]      = useState(profile?.height_cm?.toString() || '');
  const [weightKg,      setWeightKg]      = useState(profile?.weight_kg?.toString() || '');
  const [activityLevel, setActivityLevel] = useState(profile?.activity_level   || '');
  const [dietaryPref,   setDietaryPref]   = useState(profile?.dietary_pref     || '');
  const [diseases,      setDiseases]      = useState(profile?.diseases         || []);
  const [allergies,     setAllergies]     = useState(profile?.allergies        || []);
  const [loading,       setLoading]       = useState(false);

  const styles = useMemo(() => makeStyles({ COLORS, SHADOWS }), [COLORS]);

  const toggle = (item, list, setList) => {
    setList(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  const validate = () => {
    if (!name.trim())                   { Alert.alert('Required', 'Please enter your name.');    return false; }
    if (!age || isNaN(age) || +age < 1) { Alert.alert('Required', 'Please enter a valid age.');  return false; }
    if (!gender)                        { Alert.alert('Required', 'Please select your gender.'); return false; }
    if (!heightCm || isNaN(heightCm))   { Alert.alert('Required', 'Please enter your height.'); return false; }
    if (!weightKg || isNaN(weightKg))   { Alert.alert('Required', 'Please enter your weight.'); return false; }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const uid = userId || (await loadSession())?.userId;
      const updatedData = {
        name:           name.trim(),
        age:            parseInt(age, 10),
        gender,
        height_cm:      parseFloat(heightCm),
        weight_kg:      parseFloat(weightKg),
        activity_level: activityLevel || null,
        dietary_pref:   dietaryPref   || null,
        diseases,
        allergies,
      };
      const updatedProfile = await updateProfile(uid, updatedData);
      await updateLocalProfile(updatedProfile);
      Alert.alert('Profile Updated', 'Your profile has been saved successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={GRADIENTS.background} style={{ flex: 1 }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={COLORS.navy} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={20} color={COLORS.cyan} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{name?.charAt(0)?.toUpperCase() || 'U'}</Text>
            </View>
            <Text style={styles.avatarEmail}>{profile?.email || ''}</Text>
          </View>

          {/* ── Personal Info ── */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>PERSONAL INFO</Text>

            <Text style={styles.fieldLabel}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={18} color={COLORS.cyan} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="e.g. Ahmed Rahman" placeholderTextColor={COLORS.placeholder}
                value={name} onChangeText={setName} autoCapitalize="words" />
            </View>

            <Text style={styles.fieldLabel}>Age</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="calendar-outline" size={18} color={COLORS.cyan} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="e.g. 30" placeholderTextColor={COLORS.placeholder}
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
                  <TextInput style={styles.input} placeholder="70" placeholderTextColor={COLORS.placeholder}
                    value={weightKg} onChangeText={setWeightKg} keyboardType="numeric" />
                </View>
              </View>
            </View>

            <Text style={styles.fieldLabel}>Activity Level</Text>
            <View style={styles.chipRow}>
              {ACTIVITY_OPTS.map(a => (
                <TouchableOpacity key={a} style={[styles.chip, activityLevel === a && styles.chipActive]}
                  onPress={() => setActivityLevel(prev => prev === a ? '' : a)}>
                  <Text style={[styles.chipText, activityLevel === a && styles.chipTextActive]}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Dietary Preference</Text>
            <View style={styles.chipRow}>
              {DIETARY_OPTS.map(d => (
                <TouchableOpacity key={d} style={[styles.chip, dietaryPref === d && styles.chipActive]}
                  onPress={() => setDietaryPref(prev => prev === d ? '' : d)}>
                  <Text style={[styles.chipText, dietaryPref === d && styles.chipTextActive]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Medical Info ── */}
          <View style={[styles.card, { marginTop: SPACING.md }]}>
            <Text style={styles.sectionLabel}>MEDICAL INFO</Text>

            <Text style={styles.fieldLabel}>
              Chronic Conditions<Text style={styles.optional}>  (tap to toggle)</Text>
            </Text>
            <View style={styles.chipRow}>
              {DISEASES.map(d => (
                <TouchableOpacity key={d} style={[styles.chip, diseases.includes(d) && styles.chipActive]} onPress={() => toggle(d, diseases, setDiseases)}>
                  {diseases.includes(d) && <Ionicons name="checkmark" size={13} color={COLORS.navy} style={{ marginRight: 4 }} />}
                  <Text style={[styles.chipText, diseases.includes(d) && styles.chipTextActive]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { marginTop: SPACING.md }]}>
              Food Allergies<Text style={styles.optional}>  (tap to toggle)</Text>
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
          </View>

          {/* Save */}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading} activeOpacity={0.85}>
            <LinearGradient
              colors={loading ? [COLORS.btnDisabled, COLORS.btnDisabled] : GRADIENTS.cyan}
              style={styles.saveBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              {loading
                ? <ActivityIndicator color={COLORS.navy} />
                : <><Ionicons name="checkmark-circle" size={20} color={COLORS.navy} /><Text style={styles.saveBtnText}>Save Changes</Text></>
              }
            </LinearGradient>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const makeStyles = ({ COLORS, SHADOWS }) => StyleSheet.create({
  scroll: {
    padding: SPACING.lg,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 60,
    paddingBottom: 60,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.lg },
  backBtn: {
    width: 36, height: 36, borderRadius: RADIUS.full,
    backgroundColor: COLORS.navyMid, borderWidth: 1, borderColor: COLORS.navyBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  avatarSection: { alignItems: 'center', marginBottom: SPACING.lg },
  avatarCircle: {
    width: 72, height: 72, borderRadius: RADIUS.full,
    backgroundColor: COLORS.cyan + '22', borderWidth: 2, borderColor: COLORS.cyan + '60',
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm,
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: COLORS.cyan },
  avatarEmail: { fontSize: 13, color: COLORS.textTertiary },
  card: {
    backgroundColor: COLORS.navyMid, borderRadius: RADIUS.xl, padding: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.navyBorder, ...SHADOWS.card,
  },
  sectionLabel: { ...FONTS.label, color: COLORS.cyan, marginBottom: SPACING.sm },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, marginTop: SPACING.md, marginBottom: SPACING.xs },
  optional: { fontWeight: '400', color: COLORS.textTertiary, fontSize: 12 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.inputBg, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.navyBorder, paddingHorizontal: SPACING.md,
  },
  inputIcon: { marginRight: SPACING.sm },
  input: { flex: 1, paddingVertical: 13, fontSize: 15, color: COLORS.textPrimary },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.xs },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: RADIUS.full,
    borderWidth: 1.5, borderColor: COLORS.navyBorder, backgroundColor: COLORS.navyLight,
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
  saveBtn: { borderRadius: RADIUS.md, marginTop: SPACING.lg, overflow: 'hidden', ...SHADOWS.button },
  saveBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: 16 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.navy },
});
