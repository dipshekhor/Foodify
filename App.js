// App.js
// ─────────────────────────────────────────────────────────────────────────────
// App startup logic with full auth flow:
//
//   1. Check AsyncStorage for saved session
//   2. No session → go to Login
//   3. Session found but 30 days passed → clear → go to Login (auto logout)
//   4. Session found and not expired → verify token with server
//   5. Token valid → go to Home
//   6. Token invalid/expired on server → clear → go to Login
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StatusBar } from 'react-native';
import { NavigationContainer }        from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { COLORS }                    from './src/theme/index';
import { ThemeProvider }             from './src/context/ThemeContext';
import { loadSession, clearSession } from './src/storage/userStorage';
import { verifyToken }               from './src/api/index';

import LoginScreen    from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen         from './src/screens/HomeScreen';
import ManualSearchScreen from './src/screens/ManualSearchScreen';
import ResultScreen       from './src/screens/ResultScreen';
import PhotoScreen        from './src/screens/PhotoScreen';
import ProfileScreen      from './src/screens/ProfileScreen';
import BlogFeedScreen    from './src/screens/BlogFeedScreen';
import BlogPostScreen    from './src/screens/BlogPostScreen';

// Uncomment each screen as you build it in Parts 2–5:
// import ManualSearchScreen from './src/screens/ManualSearchScreen';
// import ResultScreen       from './src/screens/ResultScreen';
// import OCRScanScreen      from './src/screens/OCRScanScreen';
// import PhotoScreen        from './src/screens/PhotoScreen';
// import HistoryScreen      from './src/screens/HistoryScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [checking,     setChecking]     = useState(true);
  const [initialRoute, setInitialRoute] = useState('Login');
  const [savedProfile, setSavedProfile] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        // Step 1: Load session from AsyncStorage
        const session = await loadSession();

        if (!session) {
          // No saved session OR 30 days expired (loadSession returns null for both)
          setInitialRoute('Login');
          setChecking(false);
          return;
        }

        // Step 2: Session found — verify token is still valid on server
        // This catches the case where server was reset or token was revoked
        try {
          await verifyToken(session.token);
          // Token valid — go straight to Home
          setSavedProfile(session.profile);
          setInitialRoute('Home');
        } catch (e) {
          // Server rejected token (expired or invalid)
          await clearSession();
          setInitialRoute('Login');
        }

      } catch (e) {
        // AsyncStorage read error — safe fallback
        setInitialRoute('Login');
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  // Splash screen while checking — shows cyan spinner on dark navy background
  if (checking) {
    return (
      <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor: COLORS.navy }}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />
        <ActivityIndicator size="large" color={COLORS.cyan} />
      </View>
    );
  }

  return (
    <ThemeProvider>
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        {/* Auth screens */}
        <Stack.Screen name="Login"    component={LoginScreen}    />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          initialParams={{ profile: savedProfile }}
        />
        <Stack.Screen name="ManualSearch" component={ManualSearchScreen} />
        <Stack.Screen name="Result"       component={ResultScreen} />
        <Stack.Screen name="Photo"        component={PhotoScreen} />
        <Stack.Screen name="Profile"      component={ProfileScreen} />
        <Stack.Screen name="BlogFeed"     component={BlogFeedScreen} />
        <Stack.Screen name="BlogPost"     component={BlogPostScreen} />

        {/* App screens — uncomment as you build them */}
        {/*
        <Stack.Screen name="ManualSearch" component={ManualSearchScreen} />
        <Stack.Screen name="Result"       component={ResultScreen} />
        <Stack.Screen name="OCRScan"      component={OCRScanScreen} />
        <Stack.Screen name="Photo"        component={PhotoScreen} />
        <Stack.Screen name="History"      component={HistoryScreen} />
        */}
      </Stack.Navigator>
    </NavigationContainer>
    </ThemeProvider>
  );
}