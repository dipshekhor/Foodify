// src/screens/HomeScreen.js
import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient }  from 'expo-linear-gradient';
import { Ionicons }        from '@expo/vector-icons';
import { useFocusEffect }  from '@react-navigation/native';

import { SPACING, RADIUS, FONTS, VERDICT_CONFIG } from '../theme/index';
import { useTheme }       from '../context/ThemeContext';
import { getFoodHistory } from '../api/index';
import { clearSession, loadSession } from '../storage/userStorage';

export default function HomeScreen({ navigation, route }) {
  const { theme, isDark, toggleTheme } = useTheme();
  const { COLORS, GRADIENTS, SHADOWS } = theme;

  const [profile, setProfile] = useState(route?.params?.profile || null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userId,  setUserId]  = useState(null);

  const styles = useMemo(() => makeStyles({ COLORS, SHADOWS }), [COLORS]);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          const session = await loadSession();
          if (!session) { navigation.replace('Login'); return; }
          const uid = session.userId;
          setUserId(uid);
          setLoading(true);
          const historyData = await getFoodHistory(uid, 3);
          setHistory(historyData);
          if (session.profile) setProfile(session.profile);
        } catch (err) {
          console.log('History load error:', err.message);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }, [])
  );

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: async () => { await clearSession(); navigation.replace('Login'); } },
    ]);
  };

  const getVerdictColor = (verdict) => {
    if (verdict === 'safe')    return COLORS.safe;
    if (verdict === 'caution') return COLORS.caution;
    if (verdict === 'avoid')   return COLORS.avoid;
    return COLORS.textSecondary;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const INPUT_MODES = [
    { key: 'manual', icon: 'search',        label: 'Search Food',    subtitle: 'Type a food name',   gradient: [COLORS.cyan, COLORS.cyanDark], screen: 'ManualSearch' },
    { key: 'ocr',    icon: 'scan-outline',  label: 'Scan Ingredients', subtitle: 'Photo of packaging', gradient: ['#7C3AED', '#5B21B6'],          screen: 'OCRScan' },
    { key: 'photo',  icon: 'camera-outline', label: 'Food Photo',     subtitle: 'Take a food picture', gradient: ['#EA580C', '#C2410C'],          screen: 'Photo' },
  ];

  return (
    <LinearGradient colors={GRADIENTS.background} style={{ flex: 1 }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={COLORS.navy} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <View style={styles.logoIcon}>
              <Ionicons name="nutrition" size={22} color={COLORS.cyan} />
            </View>
            <Text style={styles.appName}>FoodSafe</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={toggleTheme} style={styles.iconBtn}>
              <Ionicons
                name={isDark ? 'sunny-outline' : 'moon-outline'}
                size={20}
                color={COLORS.cyan}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={styles.iconBtn}>
              <Ionicons name="log-out-outline" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Greeting ── */}
        <View style={styles.greetingRow}>
          <Text style={styles.greeting}>Hello, {profile?.name?.split(' ')[0] || 'there'} 👋</Text>
          <Text style={styles.greetingSub}>What would you like to check today?</Text>
        </View>

        {/* ── Profile card ── */}
        <View style={styles.profileCard}>
          <View style={styles.profileCardHeader}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{profile?.name?.charAt(0)?.toUpperCase() || 'U'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{profile?.name || 'User'}</Text>
              <Text style={styles.profileEmail}>{profile?.email || ''}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Profile', { profile, userId })} style={styles.iconBtnSm}>
              <Ionicons name="create-outline" size={20} color={COLORS.cyan} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Alert.alert('Coming Soon', 'History screen is not built yet.')} style={styles.iconBtnSm}>
              <Ionicons name="time-outline" size={20} color={COLORS.cyan} />
            </TouchableOpacity>
          </View>

          {(profile?.diseases?.length > 0 || profile?.allergies?.length > 0) && (
            <View style={styles.tagsRow}>
              {profile?.diseases?.map(d => (
                <View key={d} style={styles.diseaseTag}>
                  <Ionicons name="medical" size={10} color={COLORS.caution} />
                  <Text style={styles.diseaseTagText}>{d}</Text>
                </View>
              ))}
              {profile?.allergies?.map(a => (
                <View key={a} style={styles.allergyTag}>
                  <Ionicons name="warning" size={10} color={COLORS.avoid} />
                  <Text style={styles.allergyTagText}>{a}</Text>
                </View>
              ))}
            </View>
          )}

          {profile?.diseases?.length === 0 && profile?.allergies?.length === 0 && (
            <View style={styles.noConditionsRow}>
              <Ionicons name="checkmark-circle" size={14} color={COLORS.safe} />
              <Text style={styles.noConditionsText}>No conditions or allergies on record</Text>
            </View>
          )}
        </View>

        {/* ── Check food ── */}
        <Text style={styles.sectionLabel}>CHECK YOUR FOOD</Text>
        <View style={styles.modeGrid}>
          {INPUT_MODES.map((mode) => (
            <TouchableOpacity
              key={mode.key}
              style={styles.modeBtn}
              onPress={() => {
                if (mode.screen === 'OCRScan') { Alert.alert('Coming Soon', 'OCR scan screen is not built yet.'); return; }
                navigation.navigate(mode.screen, { userId, profile });
              }}
              activeOpacity={0.85}
            >
              <LinearGradient colors={mode.gradient} style={styles.modeBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={styles.modeIconWrapper}>
                  <Ionicons name={mode.icon} size={28} color="#fff" />
                </View>
                <Text style={styles.modeBtnLabel}>{mode.label}</Text>
                <Text style={styles.modeBtnSub}>{mode.subtitle}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Recent checks ── */}
        <View style={styles.recentHeader}>
          <Text style={styles.sectionLabel}>RECENT CHECKS</Text>
          {history.length > 0 && (
            <TouchableOpacity onPress={() => Alert.alert('Coming Soon', 'History screen is not built yet.')}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.cyan} style={{ marginVertical: SPACING.lg }} />
        ) : history.length === 0 ? (
          <View style={styles.emptyHistory}>
            <Ionicons name="receipt-outline" size={36} color={COLORS.textTertiary} />
            <Text style={styles.emptyHistoryText}>No checks yet</Text>
            <Text style={styles.emptyHistorySub}>Use one of the options above to check your first food</Text>
          </View>
        ) : (
          history.map((item) => (
            <TouchableOpacity key={item.id} style={styles.historyItem} onPress={() => navigation.navigate('History', { userId })} activeOpacity={0.8}>
              <View style={[styles.verdictBar, { backgroundColor: getVerdictColor(item.verdict) }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.historyFood} numberOfLines={1}>{item.food_found || item.query || 'Unknown food'}</Text>
                <Text style={styles.historyMeta}>{item.input_mode?.toUpperCase()}  ·  {formatDate(item.checked_at)}</Text>
              </View>
              <View style={[styles.scoreBadge, { backgroundColor: getVerdictColor(item.verdict) + '22' }]}>
                <Text style={[styles.scoreText, { color: getVerdictColor(item.verdict) }]}>{item.score}</Text>
              </View>
              <Text style={[styles.verdictLabel, { color: getVerdictColor(item.verdict) }]}>{item.verdict?.toUpperCase()}</Text>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </LinearGradient>
  );
}

const makeStyles = ({ COLORS, SHADOWS }) => StyleSheet.create({
  scroll: {
    paddingTop: StatusBar.currentHeight + SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.lg },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  logoIcon: {
    width: 36, height: 36, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.cyanGlow, borderWidth: 1, borderColor: COLORS.cyan + '40',
    alignItems: 'center', justifyContent: 'center',
  },
  appName: { fontSize: 18, fontWeight: '800', color: COLORS.cyan, letterSpacing: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  iconBtn: { padding: SPACING.sm },
  greetingRow: { marginBottom: SPACING.lg },
  greeting: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  greetingSub: { fontSize: 14, color: COLORS.textSecondary },
  profileCard: {
    backgroundColor: COLORS.navyMid, borderRadius: RADIUS.lg, padding: SPACING.md,
    borderWidth: 1, borderColor: COLORS.navyBorder, marginBottom: SPACING.lg, ...SHADOWS.card,
  },
  profileCardHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  avatarCircle: {
    width: 44, height: 44, borderRadius: RADIUS.full,
    backgroundColor: COLORS.cyan + '22', borderWidth: 2, borderColor: COLORS.cyan + '60',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '800', color: COLORS.cyan },
  profileName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  profileEmail: { fontSize: 12, color: COLORS.textTertiary, marginTop: 1 },
  iconBtnSm: { padding: SPACING.xs },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginTop: SPACING.xs },
  diseaseTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.cautionBg, borderRadius: RADIUS.full,
    paddingVertical: 4, paddingHorizontal: 10, borderWidth: 1, borderColor: COLORS.cautionBorder,
  },
  diseaseTagText: { fontSize: 11, color: COLORS.caution, fontWeight: '600' },
  allergyTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.avoidBg, borderRadius: RADIUS.full,
    paddingVertical: 4, paddingHorizontal: 10, borderWidth: 1, borderColor: COLORS.avoidBorder,
  },
  allergyTagText: { fontSize: 11, color: COLORS.avoid, fontWeight: '600' },
  noConditionsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SPACING.xs },
  noConditionsText: { fontSize: 12, color: COLORS.safe },
  sectionLabel: { ...FONTS.label, color: COLORS.textTertiary, marginBottom: SPACING.sm },
  modeGrid: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  modeBtn: { flex: 1, borderRadius: RADIUS.lg, overflow: 'hidden', ...SHADOWS.button },
  modeBtnGradient: { padding: SPACING.md, alignItems: 'center', minHeight: 110, justifyContent: 'center' },
  modeIconWrapper: {
    width: 48, height: 48, borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm,
  },
  modeBtnLabel: { fontSize: 13, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 2 },
  modeBtnSub: { fontSize: 10, color: 'rgba(255,255,255,0.75)', textAlign: 'center' },
  recentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm },
  seeAllText: { fontSize: 13, color: COLORS.cyan, fontWeight: '600' },
  emptyHistory: {
    alignItems: 'center', paddingVertical: SPACING.xl,
    backgroundColor: COLORS.navyMid, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.navyBorder, gap: SPACING.sm,
  },
  emptyHistoryText: { fontSize: 15, fontWeight: '600', color: COLORS.textSecondary },
  emptyHistorySub: { fontSize: 12, color: COLORS.textTertiary, textAlign: 'center', paddingHorizontal: SPACING.lg },
  historyItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.navyMid, borderRadius: RADIUS.md, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.navyBorder, overflow: 'hidden',
    gap: SPACING.sm, paddingRight: SPACING.md, paddingVertical: SPACING.sm,
  },
  verdictBar: { width: 4, alignSelf: 'stretch', borderRadius: 2, marginLeft: 0, minHeight: 44 },
  historyFood: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 2 },
  historyMeta: { fontSize: 11, color: COLORS.textTertiary },
  scoreBadge: { width: 36, height: 36, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  scoreText: { fontSize: 13, fontWeight: '800' },
  verdictLabel: { fontSize: 10, fontWeight: '700', width: 44, textAlign: 'right' },
});
