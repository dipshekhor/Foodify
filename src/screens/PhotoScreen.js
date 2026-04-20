import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { COLORS, GRADIENTS, SPACING, RADIUS, SHADOWS, FONTS } from '../theme/index';
import { checkFoodByImagePrediction, getErrorMessage, predictFoodFromPhoto } from '../api/index';

export default function PhotoScreen({ navigation, route }) {
  const { userId, profile } = route.params || {};

  const [permission, requestPermission] = useCameraPermissions();
  const [capturedUri, setCapturedUri] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [facing, setFacing] = useState('back');

  const cameraRef = useRef(null);

  const toggleFacing = () => {
    setFacing((curr) => (curr === 'back' ? 'front' : 'back'));
  };

  const takePhoto = async () => {
    try {
      if (!cameraRef.current) return;
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: true,
      });
      if (photo?.uri) setCapturedUri(photo.uri);
    } catch (error) {
      Alert.alert('Camera error', error.message || 'Could not take photo.');
    }
  };

  const retake = () => setCapturedUri('');

  const analyzePhoto = async () => {
    if (!capturedUri) return;

    setAnalyzing(true);
    try {
      // Step 1: teammate image model endpoint
      const pred = await predictFoodFromPhoto(capturedUri);

      // Step 2: verdict endpoint with {food_label, confidence}
      const result = await checkFoodByImagePrediction(userId, pred.food_label, pred.confidence);

      navigation.navigate('Result', {
        result,
        foodName: result?.food_info?.food_item || pred.food_label,
        inputMode: 'photo',
        profile,
        userId,
      });
    } catch (error) {
      Alert.alert('Photo Analysis Failed', getErrorMessage(error));
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
        <Text style={styles.permissionTitle}>Camera access needed</Text>
        <Text style={styles.permissionText}>
          Food photo mode needs camera permission to capture meals.
        </Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Allow Camera</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={GRADIENTS.background} style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Food Photo</Text>
        <TouchableOpacity onPress={toggleFacing} style={styles.flipBtn}>
          <Ionicons name="camera-reverse-outline" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.cameraWrap}>
        {!capturedUri ? (
          <CameraView ref={cameraRef} style={styles.camera} facing={facing} />
        ) : (
          <Image source={{ uri: capturedUri }} style={styles.camera} resizeMode="cover" />
        )}
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
              colors={analyzing ? ['#334155', '#334155'] : GRADIENTS.cyan}
              style={styles.primaryBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {analyzing ? (
                <ActivityIndicator color={COLORS.navy} />
              ) : (
                <>
                  <Ionicons name="sparkles-outline" size={16} color={COLORS.navy} />
                  <Text style={styles.primaryBtnText}>Analyze Photo</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  permissionTitle: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  permissionText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  permissionBtn: {
    backgroundColor: COLORS.cyan,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  permissionBtnText: {
    color: COLORS.navy,
    fontWeight: '700',
  },
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
  flipBtn: {
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
  cameraWrap: {
    flex: 1,
    marginHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.navyBorder,
    ...SHADOWS.card,
  },
  camera: {
    flex: 1,
  },
  actionsRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
  },
  captureOuter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: COLORS.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.textPrimary,
  },
  bottomActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  secondaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.navyLight,
    borderWidth: 1,
    borderColor: COLORS.navyBorder,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  secondaryBtnText: {
    color: COLORS.cyan,
    fontWeight: '700',
  },
  primaryBtn: {
    flex: 1.5,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  primaryBtnGradient: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  primaryBtnText: {
    color: COLORS.navy,
    fontWeight: '700',
  },
});
