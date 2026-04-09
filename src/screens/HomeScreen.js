// import React from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   StatusBar,
//   Alert,
// } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';

// import { COLORS, GRADIENTS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme/index';
// import { clearSession } from '../storage/userStorage';

// export default function HomeScreen({ navigation, route }) {
//   const profile = route?.params?.profile;

//   const handleLogout = async () => {
//     try {
//       await clearSession();
//       navigation.replace('Login');
//     } catch (error) {
//       Alert.alert('Error', 'Could not log out. Please try again.');
//     }
//   };

//   return (
//     <LinearGradient colors={GRADIENTS.background} style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />

//       <View style={styles.card}>
//         <Text style={styles.title}>Welcome to FoodSafe</Text>
//         <Text style={styles.subtitle}>Your Home screen is now connected.</Text>

//         <View style={styles.profileBox}>
//           <Text style={styles.profileLabel}>Signed in as</Text>
//           <Text style={styles.profileName}>{profile?.name || 'User'}</Text>
//           <Text style={styles.profileEmail}>{profile?.email || 'No email provided'}</Text>
//         </View>

//         <TouchableOpacity style={styles.button} onPress={handleLogout} activeOpacity={0.85}>
//           <Text style={styles.buttonText}>Log Out</Text>
//         </TouchableOpacity>
//       </View>
//     </LinearGradient>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     padding: SPACING.lg,
//   },
//   card: {
//     backgroundColor: COLORS.navyMid,
//     borderRadius: RADIUS.xl,
//     padding: SPACING.lg,
//     borderWidth: 1,
//     borderColor: COLORS.navyBorder,
//     ...SHADOWS.card,
//   },
//   title: {
//     ...FONTS.h2,
//     color: COLORS.cyan,
//     marginBottom: SPACING.sm,
//   },
//   subtitle: {
//     color: COLORS.textSecondary,
//     marginBottom: SPACING.lg,
//   },
//   profileBox: {
//     backgroundColor: COLORS.navyLight,
//     borderRadius: RADIUS.md,
//     padding: SPACING.md,
//     marginBottom: SPACING.lg,
//   },
//   profileLabel: {
//     color: COLORS.textTertiary,
//     marginBottom: SPACING.xs,
//   },
//   profileName: {
//     color: COLORS.textPrimary,
//     fontSize: 18,
//     fontWeight: '700',
//   },
//   profileEmail: {
//     color: COLORS.textSecondary,
//     marginTop: 4,
//   },
//   button: {
//     backgroundColor: COLORS.cyan,
//     borderRadius: RADIUS.md,
//     alignItems: 'center',
//     paddingVertical: 14,
//   },
//   buttonText: {
//     color: COLORS.navy,
//     fontSize: 16,
//     fontWeight: '700',
//   },
// });
// src/screens/HomeScreen.js
// ─────────────────────────────────────────────────────────────────────────────
// Main dashboard screen. Shown after login/register.
//
// Sections:
//   1. Header — app name + logout button
//   2. Profile card — name, diseases, allergies summary
//   3. Three input mode buttons — Manual, OCR, Photo
//   4. Recent checks — last 3 food checks from history
//
// Data flow:
//   profile → passed from App.js via route.params
//   history → fetched from GET /api/history/{user_id} on screen focus
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient }  from 'expo-linear-gradient';
import { Ionicons }        from '@expo/vector-icons';
import { useFocusEffect }  from '@react-navigation/native';

import { COLORS, GRADIENTS, FONTS, SPACING, RADIUS, SHADOWS, VERDICT_CONFIG } from '../theme/index';
import { getFoodHistory }  from '../api/index';
import { clearSession, loadSession }    from '../storage/userStorage';

export default function HomeScreen({ navigation, route }) {
  // Profile comes from route params (passed by App.js or after login)
  const [profile,  setProfile]  = useState(route?.params?.profile || null);
  const [history,  setHistory]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [userId,   setUserId]   = useState(null);

  // ── Load user id and recent history every time screen comes into focus ──────
  // useFocusEffect re-runs when user navigates back from Result screen
  // so history always shows the latest check at the top
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          // Load userId from storage if not in route params
          const session = await loadSession();
          if (!session) {
            navigation.replace('Login');
            return;
          }

          const uid = session.userId;
          setUserId(uid);

          // Fetch last 3 food checks for the preview section
          setLoading(true);
          const historyData = await getFoodHistory(uid, 3);
          setHistory(historyData);

          // Update profile from storage in case it was edited
          if (session.profile) setProfile(session.profile);

        } catch (err) {
          // History fetch failing should not crash the home screen
          console.log('History load error:', err.message);
        } finally {
          setLoading(false);
        }
      };

      loadData();
    }, [])
  );

  // ── Logout ──────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await clearSession();
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  // ── Verdict color helper ────────────────────────────────────────────────────
  const getVerdictColor = (verdict) => {
    if (verdict === 'safe')    return COLORS.safe;
    if (verdict === 'caution') return COLORS.caution;
    if (verdict === 'avoid')   return COLORS.avoid;
    return COLORS.textSecondary;
  };

  // ── Format date for history items ───────────────────────────────────────────
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // ── Input mode button config ─────────────────────────────────────────────────
  const INPUT_MODES = [
    {
      key:      'manual',
      icon:     'search',
      label:    'Search Food',
      subtitle: 'Type a food name',
      gradient: [COLORS.cyan, COLORS.cyanDark],
      screen:   'ManualSearch',
    },
    {
      key:      'ocr',
      icon:     'scan-outline',
      label:    'Scan Ingredients',
      subtitle: 'Photo of packaging',
      gradient: ['#7C3AED', '#5B21B6'],
      screen:   'OCRScan',
    },
    {
      key:      'photo',
      icon:     'camera-outline',
      label:    'Food Photo',
      subtitle: 'Take a food picture',
      gradient: ['#EA580C', '#C2410C'],
      screen:   'Photo',
    },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <LinearGradient colors={GRADIENTS.background} style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <View style={styles.logoIcon}>
              <Ionicons name="nutrition" size={22} color={COLORS.cyan} />
            </View>
            <Text style={styles.appName}>FoodSafe</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* ── Greeting ───────────────────────────────────────────────────── */}
        <View style={styles.greetingRow}>
          <View>
            <Text style={styles.greeting}>
              Hello, {profile?.name?.split(' ')[0] || 'there'} 👋
            </Text>
            <Text style={styles.greetingSub}>
              What would you like to check today?
            </Text>
          </View>
        </View>

        {/* ── Profile summary card ────────────────────────────────────────── */}
        <View style={styles.profileCard}>
          <View style={styles.profileCardHeader}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{profile?.name || 'User'}</Text>
              <Text style={styles.profileEmail}>{profile?.email || ''}</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('History')}
              style={styles.historyIconBtn}
            >
              <Ionicons name="time-outline" size={20} color={COLORS.cyan} />
            </TouchableOpacity>
          </View>

          {/* Diseases and allergies pills */}
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

          {/* No conditions message */}
          {profile?.diseases?.length === 0 && profile?.allergies?.length === 0 && (
            <View style={styles.noConditionsRow}>
              <Ionicons name="checkmark-circle" size={14} color={COLORS.safe} />
              <Text style={styles.noConditionsText}>No conditions or allergies on record</Text>
            </View>
          )}
        </View>

        {/* ── Check food section ──────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>CHECK YOUR FOOD</Text>

        {/* 3 input mode buttons */}
        <View style={styles.modeGrid}>
          {INPUT_MODES.map((mode) => (
            <TouchableOpacity
              key={mode.key}
              style={styles.modeBtn}
              onPress={() => navigation.navigate(mode.screen, { userId, profile })}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={mode.gradient}
                style={styles.modeBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.modeIconWrapper}>
                  <Ionicons name={mode.icon} size={28} color="#fff" />
                </View>
                <Text style={styles.modeBtnLabel}>{mode.label}</Text>
                <Text style={styles.modeBtnSub}>{mode.subtitle}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Recent checks section ───────────────────────────────────────── */}
        <View style={styles.recentHeader}>
          <Text style={styles.sectionLabel}>RECENT CHECKS</Text>
          {history.length > 0 && (
            <TouchableOpacity onPress={() => navigation.navigate('History', { userId })}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.cyan} style={{ marginVertical: SPACING.lg }} />
        ) : history.length === 0 ? (
          // Empty state
          <View style={styles.emptyHistory}>
            <Ionicons name="receipt-outline" size={36} color={COLORS.textTertiary} />
            <Text style={styles.emptyHistoryText}>No checks yet</Text>
            <Text style={styles.emptyHistorySub}>
              Use one of the options above to check your first food
            </Text>
          </View>
        ) : (
          // History preview — last 3 items
          history.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.historyItem}
              onPress={() => navigation.navigate('History', { userId })}
              activeOpacity={0.8}
            >
              {/* Verdict color bar on left */}
              <View style={[styles.verdictBar, { backgroundColor: getVerdictColor(item.verdict) }]} />

              <View style={{ flex: 1 }}>
                <Text style={styles.historyFood} numberOfLines={1}>
                  {item.food_found || item.query || 'Unknown food'}
                </Text>
                <Text style={styles.historyMeta}>
                  {item.input_mode?.toUpperCase()}  ·  {formatDate(item.checked_at)}
                </Text>
              </View>

              {/* Score badge */}
              <View style={[styles.scoreBadge, { backgroundColor: getVerdictColor(item.verdict) + '22' }]}>
                <Text style={[styles.scoreText, { color: getVerdictColor(item.verdict) }]}>
                  {item.score}
                </Text>
              </View>

              {/* Verdict label */}
              <Text style={[styles.verdictLabel, { color: getVerdictColor(item.verdict) }]}>
                {item.verdict?.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))
        )}

        {/* Bottom padding */}
        <View style={{ height: SPACING.xl }} />

      </ScrollView>
    </LinearGradient>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scroll: {
    paddingTop: StatusBar.currentHeight + SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.cyanGlow,
    borderWidth: 1,
    borderColor: COLORS.cyan + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.cyan,
    letterSpacing: 1,
  },
  logoutBtn: {
    padding: SPACING.sm,
  },

  // Greeting
  greetingRow: {
    marginBottom: SPACING.lg,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  greetingSub: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  // Profile card
  profileCard: {
    backgroundColor: COLORS.navyMid,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.navyBorder,
    marginBottom: SPACING.lg,
    ...SHADOWS.card,
  },
  profileCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.cyan + '22',
    borderWidth: 2,
    borderColor: COLORS.cyan + '60',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.cyan,
  },
  profileName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  profileEmail: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 1,
  },
  historyIconBtn: {
    padding: SPACING.xs,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  diseaseTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.cautionBg,
    borderRadius: RADIUS.full,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: COLORS.cautionBorder,
  },
  diseaseTagText: {
    fontSize: 11,
    color: COLORS.caution,
    fontWeight: '600',
  },
  allergyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.avoidBg,
    borderRadius: RADIUS.full,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: COLORS.avoidBorder,
  },
  allergyTagText: {
    fontSize: 11,
    color: COLORS.avoid,
    fontWeight: '600',
  },
  noConditionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.xs,
  },
  noConditionsText: {
    fontSize: 12,
    color: COLORS.safe,
  },

  // Section labels
  sectionLabel: {
    ...FONTS.label,
    color: COLORS.textTertiary,
    marginBottom: SPACING.sm,
  },

  // Input mode buttons grid
  modeGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  modeBtn: {
    flex: 1,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.button,
  },
  modeBtnGradient: {
    padding: SPACING.md,
    alignItems: 'center',
    minHeight: 110,
    justifyContent: 'center',
  },
  modeIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  modeBtnLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 2,
  },
  modeBtnSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
  },

  // Recent checks
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  seeAllText: {
    fontSize: 13,
    color: COLORS.cyan,
    fontWeight: '600',
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    backgroundColor: COLORS.navyMid,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.navyBorder,
    gap: SPACING.sm,
  },
  emptyHistoryText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  emptyHistorySub: {
    fontSize: 12,
    color: COLORS.textTertiary,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.navyMid,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.navyBorder,
    overflow: 'hidden',
    gap: SPACING.sm,
    paddingRight: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  verdictBar: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: 2,
    marginLeft: 0,
    minHeight: 44,
  },
  historyFood: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  historyMeta: {
    fontSize: 11,
    color: COLORS.textTertiary,
  },
  scoreBadge: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '800',
  },
  verdictLabel: {
    fontSize: 10,
    fontWeight: '700',
    width: 44,
    textAlign: 'right',
  },
});


