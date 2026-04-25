// src/screens/HistoryScreen.js
import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons }       from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { SPACING, RADIUS, FONTS } from '../theme/index';
import { useTheme }               from '../context/ThemeContext';
import { getFoodHistory, getFoodCheckDetail, deleteFoodCheck } from '../api/index';

export default function HistoryScreen({ navigation, route }) {
  const { theme, isDark } = useTheme();
  const { COLORS, GRADIENTS, SHADOWS } = theme;

  const { userId, profile } = route.params || {};

  const [history,       setHistory]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(null); // id of item being opened

  const styles = useMemo(() => makeStyles({ COLORS, SHADOWS }), [COLORS]);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        setLoading(true);
        try {
          const data = await getFoodHistory(userId, 100);
          setHistory(data);
        } catch {
          Alert.alert('Error', 'Could not load history.');
        } finally {
          setLoading(false);
        }
      };
      load();
    }, [userId])
  );

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const getVerdictColor = (v) =>
    v === 'safe' ? COLORS.safe : v === 'avoid' ? COLORS.avoid : COLORS.caution;

  const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  // Group items into { 'Today': [...], 'Yesterday': [...], '3 days ago': [...] }
  const grouped = useMemo(() => {
    const now    = new Date();
    const result = {};
    history.forEach(item => {
      const d        = new Date(item.checked_at);
      const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
      const label    =
        diffDays === 0 ? 'Today' :
        diffDays === 1 ? 'Yesterday' :
        `${diffDays} days ago`;
      if (!result[label]) result[label] = [];
      result[label].push(item);
    });
    return result;
  }, [history]);

  // ── Actions ───────────────────────────────────────────────────────────────────

  const openDetail = async (item) => {
    setLoadingDetail(item.id);
    try {
      const detail = await getFoodCheckDetail(userId, item.id);
      navigation.navigate('Result', {
        result: {
          verdict:       detail.verdict,
          score:         detail.score,
          warnings:      detail.warnings      || [],
          reasons:       detail.reasons       || [],
          food_info:     detail.nutrients     || {},
          ml_prediction: detail.ml_prediction || null,
          check_id:      detail.id,
        },
        foodName:  detail.food_found || detail.query || 'Unknown food',
        inputMode: detail.input_mode,
        userId,
        profile,
      });
    } catch {
      Alert.alert('Error', 'Could not load check details.');
    } finally {
      setLoadingDetail(null);
    }
  };

  const confirmDelete = (item) => {
    Alert.alert(
      'Delete check',
      `Remove "${item.food_found || item.query || 'this check'}" from history?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await deleteFoodCheck(item.id);
              setHistory(prev => prev.filter(h => h.id !== item.id));
            } catch {
              Alert.alert('Error', 'Could not delete check.');
            }
          },
        },
      ]
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <LinearGradient colors={GRADIENTS.background} style={{ flex: 1 }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={COLORS.navy} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Check History</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.cyan} style={{ marginTop: 48 }} />
      ) : history.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="receipt-outline" size={52} color={COLORS.textTertiary} />
          <Text style={styles.emptyTitle}>No checks yet</Text>
          <Text style={styles.emptySub}>
            Use the home screen to check your first food
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {Object.entries(grouped).map(([label, items]) => (
            <View key={label}>
              {/* Date group header */}
              <Text style={styles.groupLabel}>{label}</Text>

              {items.map(item => {
                const color     = getVerdictColor(item.verdict);
                const isLoading = loadingDetail === item.id;

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.historyItem}
                    onPress={() => openDetail(item)}
                    onLongPress={() => confirmDelete(item)}
                    activeOpacity={0.8}
                    disabled={isLoading}
                  >
                    {/* Left verdict colour bar */}
                    <View style={[styles.verdictBar, { backgroundColor: color }]} />

                    {/* Food name + meta */}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.foodName} numberOfLines={1}>
                        {item.food_found || item.query || 'Unknown food'}
                      </Text>
                      <Text style={styles.meta}>
                        {item.input_mode?.toUpperCase()}{'  ·  '}{formatTime(item.checked_at)}
                      </Text>
                    </View>

                    {/* Score / loading spinner */}
                    {isLoading ? (
                      <ActivityIndicator size="small" color={COLORS.cyan} style={{ marginRight: 8 }} />
                    ) : (
                      <>
                        <View style={[styles.scoreBadge, { backgroundColor: color + '22' }]}>
                          <Text style={[styles.scoreText, { color }]}>{item.score}</Text>
                        </View>
                        <Text style={[styles.verdictLabel, { color }]}>
                          {item.verdict?.toUpperCase()}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}

          <Text style={styles.longPressTip}>Long-press any item to delete it</Text>
          <View style={{ height: SPACING.xl }} />
        </ScrollView>
      )}
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
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },

  scroll: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.xs, paddingBottom: 40 },

  groupLabel: {
    ...FONTS.label, color: COLORS.textTertiary,
    marginTop: SPACING.md, marginBottom: SPACING.xs,
  },

  historyItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.navyMid, borderRadius: RADIUS.md,
    marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.navyBorder,
    overflow: 'hidden', gap: SPACING.sm,
    paddingRight: SPACING.md, paddingVertical: SPACING.sm,
    ...SHADOWS.card,
  },
  verdictBar: { width: 4, alignSelf: 'stretch', borderRadius: 2, minHeight: 44 },
  foodName:   { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 2 },
  meta:       { fontSize: 11, color: COLORS.textTertiary },
  scoreBadge: {
    width: 36, height: 36, borderRadius: RADIUS.full,
    alignItems: 'center', justifyContent: 'center',
  },
  scoreText:    { fontSize: 13, fontWeight: '800' },
  verdictLabel: { fontSize: 10, fontWeight: '700', width: 44, textAlign: 'right' },

  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, paddingHorizontal: SPACING.xl,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textSecondary },
  emptySub:   { fontSize: 13, color: COLORS.textTertiary, textAlign: 'center' },

  longPressTip: {
    fontSize: 11, color: COLORS.textTertiary,
    textAlign: 'center', marginTop: SPACING.md,
  },
});
