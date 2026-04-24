// src/screens/LoginScreen.js
import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, StatusBar, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons }       from '@expo/vector-icons';

import { SPACING, RADIUS, FONTS } from '../theme/index';
import { useTheme }   from '../context/ThemeContext';
import { loginUser }  from '../api/index';
import { saveSession } from '../storage/userStorage';

export default function LoginScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const { COLORS, GRADIENTS, SHADOWS } = theme;

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);

  const styles = useMemo(() => makeStyles({ COLORS, GRADIENTS, SHADOWS }), [COLORS]);

  const handleLogin = async () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    if (!password) {
      Alert.alert('Required', 'Please enter your password.');
      return;
    }
    setLoading(true);
    try {
      const result = await loginUser(email.trim().toLowerCase(), password);
      await saveSession(result.token, result.profile);
      navigation.replace('Home', { profile: result.profile });
    } catch (error) {
      const status = error.response?.status;
      if (status === 401) {
        Alert.alert('Login Failed', 'Incorrect email or password. Please try again.');
      } else if (!error.response) {
        Alert.alert('Connection Error', 'Cannot reach the server.\n\nMake sure:\n• Docker is running\n• Phone and laptop are on the same WiFi');
      } else {
        Alert.alert('Error', 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={GRADIENTS.background} style={{ flex: 1 }}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={COLORS.navy}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoRow}>
            <View style={styles.logoIcon}>
              <Ionicons name="nutrition" size={26} color={COLORS.cyan} />
            </View>
            <Text style={styles.appName}>FoodSafe</Text>
          </View>

          <Text style={styles.title}>Welcome back.</Text>
          <Text style={styles.subtitle}>Sign in to continue checking your food safety.</Text>

          <View style={styles.formCard}>
            <Text style={styles.stepLabel}>SIGN IN TO YOUR ACCOUNT</Text>

            <Text style={styles.fieldLabel}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color={COLORS.cyan} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={COLORS.placeholder}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <Text style={styles.fieldLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color={COLORS.cyan} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Your password"
                placeholderTextColor={COLORS.placeholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPw}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPw(p => !p)}>
                <Ionicons
                  name={showPw ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={COLORS.textTertiary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={13} color={COLORS.textTertiary} />
              <Text style={styles.infoText}>
                You will be automatically logged out after 30 days of inactivity.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={loading ? [COLORS.btnDisabled, COLORS.btnDisabled] : GRADIENTS.cyan}
                style={styles.btnGradient}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                {loading
                  ? <ActivityIndicator color={COLORS.navy} />
                  : <>
                      <Ionicons name="log-in-outline" size={18} color={COLORS.navy} />
                      <Text style={styles.btnText}>Sign In</Text>
                    </>
                }
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.switchBtn} onPress={() => navigation.replace('Register')}>
              <Text style={styles.switchText}>
                Don't have an account?{'  '}
                <Text style={styles.switchLink}>Create one</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const makeStyles = ({ COLORS, SHADOWS }) => StyleSheet.create({
  scroll: {
    padding: SPACING.lg,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 24 : 70,
    paddingBottom: 60,
  },
  logoRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: SPACING.sm, marginBottom: SPACING.xl,
  },
  logoIcon: {
    width: 42, height: 42, borderRadius: RADIUS.md,
    backgroundColor: COLORS.cyanGlow,
    borderWidth: 1, borderColor: COLORS.cyan + '40',
    alignItems: 'center', justifyContent: 'center',
  },
  appName: { ...FONTS.h3, color: COLORS.cyan, letterSpacing: 1 },
  title: { fontSize: 30, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 21, marginBottom: SPACING.xl },
  formCard: {
    backgroundColor: COLORS.navyMid,
    borderRadius: RADIUS.xl, padding: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.navyBorder,
    ...SHADOWS.card,
  },
  stepLabel: { ...FONTS.label, color: COLORS.cyan, marginBottom: SPACING.md },
  fieldLabel: {
    fontSize: 13, fontWeight: '600', color: COLORS.textPrimary,
    marginTop: SPACING.md, marginBottom: SPACING.xs,
  },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.inputBg, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.navyBorder,
    paddingHorizontal: SPACING.md,
  },
  inputIcon: { marginRight: SPACING.sm },
  input: { flex: 1, paddingVertical: 13, fontSize: 15, color: COLORS.textPrimary },
  infoRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: 6, marginTop: SPACING.md, padding: SPACING.sm,
    backgroundColor: COLORS.navyLight, borderRadius: RADIUS.sm,
  },
  infoText: { flex: 1, fontSize: 12, color: COLORS.textTertiary, lineHeight: 17 },
  primaryBtn: { borderRadius: RADIUS.md, marginTop: SPACING.lg, overflow: 'hidden', ...SHADOWS.button },
  btnGradient: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: SPACING.sm, paddingVertical: 16,
  },
  btnText: { fontSize: 16, fontWeight: '700', color: COLORS.navy },
  switchBtn: { alignItems: 'center', marginTop: SPACING.lg, padding: SPACING.sm },
  switchText: { fontSize: 14, color: COLORS.textSecondary },
  switchLink: { color: COLORS.cyan, fontWeight: '700' },
});
