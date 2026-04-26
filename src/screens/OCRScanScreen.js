// src/screens/OCRScanScreen.js
// ─────────────────────────────────────────────────────────────────────────────
// Scan-Ingredients flow:
//   1. User opens camera, captures a photo of a nutrition-facts label.
//   2. Image is uploaded to /api/analyze-nutrition-image.
//   3. Backend runs the two-tier bilingual OCR (Google Vision → Tesseract),
//      extracts nutrients, runs the medical-rules engine, returns a verdict.
//   4. We forward the response to the existing ResultScreen.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useRef, useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator, Alert, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons }       from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { SPACING, RADIUS, FONTS } from '../theme/index';
import { useTheme }               from '../context/ThemeContext';
import { checkFoodByNutritionImage, getErrorMessage } from '../api/index';

export default function OCRScanScreen({ navigation, route }) {
  const { theme, isDark } = useTheme();
  const { COLORS, GRADIENTS, SHADOWS } = theme;

  const { userId, profile } = route.params || {};
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedUri, setCapturedUri] = useState('');
  const [analyzing,   setAnalyzing]   = useState(false);
  const [facing,      setFacing]      = useState('back');
  const cameraRef = useRef(null);

  const styles = useMemo(() => makeStyles({ COLORS, SHADOWS }), [COLORS]);

  const toggleFacing = () => setFacing(curr => curr === 'back' ? 'front' : 'back');

  const takePhoto = async () => {
    try {
      if (!cameraRef.current) return;
      const photo = await cameraRef.current.takePictureAsync({ quality: 1, skipProcessing: false });
      if (photo?.uri) setCapturedUri(photo.uri);
    } catch (error) {
      Alert.alert('Camera error', error.message || 'Could not take photo.');
    }
  };

  const retake = () => setCapturedUri('');

  const analyzePhoto = async () => {
    if (!capturedUri) return;
    if (!userId) {
      Alert.alert('Session required', 'User session is missing. Please log in again.');
      return;
    }
    setAnalyzing(true);
    try {
      const result = await checkFoodByNutritionImage(userId, capturedUri);
      navigation.navigate('Result', {
        result,
        foodName:  result?.food_info?.food_item || 'Scanned nutrition label',
        inputMode: 'ocr',
        profile,
        userId,
      });
    } catch (error) {
      Alert.alert('Scan Failed', getErrorMessage(error));
    } finally {
      setAnalyzing(false);
    }
  };

  if (!permission) {
    return (
      <LinearGradient colors={GRADIENTS.background} style={styles.centered}>
        <ActivityIndicator color={COLORS.cyan} />
      </LinearGradient>
    );
  }

  if (!permission.granted) {
    return (
      <LinearGradient colors={GRADIENTS.background} style={styles.centered}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={COLORS.navy} />
        <Text style={styles.permissionTitle}>Camera access needed</Text>
        <Text style={styles.permissionText}>
          To scan nutrition-facts labels we need permission to use the camera.
        </Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Allow Camera</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={GRADIENTS.background} style={{ flex: 1 }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={COLORS.navy} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Ingredients</Text>
        <TouchableOpacity onPress={toggleFacing} style={styles.flipBtn}>
          <Ionicons name="camera-reverse-outline" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.tipBar}>
        <Ionicons name="information-circle-outline" size={14} color={COLORS.cyan} />
        <Text style={styles.tipText}>
          Frame the nutrition-facts panel clearly. English + Bangla supported.
        </Text>
      </View>

      <View style={styles.cameraWrap}>
        {!capturedUri
          ? <CameraView ref={cameraRef} style={styles.camera} facing={facing} autofocus="on" />
          : <Image source={{ uri: capturedUri }} style={styles.camera} resizeMode="cover" />
        }
        {!capturedUri && <View pointerEvents="none" style={styles.guideFrame} />}
      </View>

      {!capturedUri ? (
        <View style={styles.actionsRow}>
          <TouchableOpacity onPress={takePhoto} style={styles.captureOuter}>
            <View style={styles.captureInner} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={retake} disabled={analyzing}>
            <Ionicons name="refresh" size={16} color={COLORS.cyan} />
            <Text style={styles.secondaryBtnText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryBtn} onPress={analyzePhoto} disabled={analyzing}>
            <LinearGradient
              colors={analyzing ? [COLORS.btnDisabled, COLORS.btnDisabled] : GRADIENTS.cyan}
              style={styles.primaryBtnGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              {analyzing
                ? <ActivityIndicator color={COLORS.navy} />
                : <><Ionicons name="scan-outline" size={16} color={COLORS.navy} /><Text style={styles.primaryBtnText}>Scan & Analyze</Text></>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </LinearGradient>
  );
}

const makeStyles = ({ COLORS, SHADOWS }) => StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
  permissionTitle: { ...FONTS.h3, color: COLORS.textPrimary, marginBottom: SPACING.sm },
  permissionText: { color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.md },
  permissionBtn: { backgroundColor: COLORS.cyan, borderRadius: RADIUS.md, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm },
  permissionBtnText: { color: COLORS.navy, fontWeight: '700' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: StatusBar.currentHeight + SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  backBtn: { width: 38, height: 38, borderRadius: RADIUS.sm, backgroundColor: COLORS.navyLight, alignItems: 'center', justifyContent: 'center' },
  flipBtn: { width: 38, height: 38, borderRadius: RADIUS.sm, backgroundColor: COLORS.navyLight, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...FONTS.h4, color: COLORS.textPrimary },
  tipBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: SPACING.md, marginBottom: SPACING.sm,
    backgroundColor: COLORS.navyMid, borderRadius: RADIUS.sm,
    borderWidth: 1, borderColor: COLORS.navyBorder,
    paddingHorizontal: SPACING.sm, paddingVertical: 6,
  },
  tipText: { fontSize: 11, color: COLORS.textSecondary, flex: 1 },
  cameraWrap: {
    flex: 1, marginHorizontal: SPACING.md, borderRadius: RADIUS.lg,
    overflow: 'hidden', borderWidth: 1, borderColor: COLORS.navyBorder, ...SHADOWS.card,
  },
  camera: { flex: 1 },
  guideFrame: {
    position: 'absolute', top: '15%', bottom: '20%', left: '8%', right: '8%',
    borderWidth: 2, borderColor: COLORS.cyan + 'AA',
    borderRadius: RADIUS.md, borderStyle: 'dashed',
  },
  actionsRow: { alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.lg },
  captureOuter: { width: 78, height: 78, borderRadius: 39, borderWidth: 4, borderColor: COLORS.textPrimary, alignItems: 'center', justifyContent: 'center' },
  captureInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: COLORS.textPrimary },
  bottomActions: { flexDirection: 'row', gap: SPACING.sm, padding: SPACING.md },
  secondaryBtn: {
    flex: 1, height: 48, borderRadius: RADIUS.md,
    backgroundColor: COLORS.navyLight, borderWidth: 1, borderColor: COLORS.navyBorder,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6,
  },
  secondaryBtnText: { color: COLORS.cyan, fontWeight: '700' },
  primaryBtn: { flex: 1.5, borderRadius: RADIUS.md, overflow: 'hidden' },
  primaryBtnGradient: { height: 48, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  primaryBtnText: { color: COLORS.navy, fontWeight: '700' },
});
