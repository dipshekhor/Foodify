// src/screens/BlogFeedScreen.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl,
  StyleSheet, ActivityIndicator, Modal, TextInput, Alert,
  KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { SPACING, RADIUS, FONTS } from '../theme/index';
import { useTheme }               from '../context/ThemeContext';
import { loadSession }            from '../storage/userStorage';
import {
  getBlogPosts, createBlogPost, deleteBlogPost, getErrorMessage,
} from '../api/index';

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function BlogFeedScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const { COLORS, SHADOWS } = theme;

  const [posts,         setPosts]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [modalVisible,  setModalVisible]  = useState(false);
  const [title,         setTitle]         = useState('');
  const [body,          setBody]          = useState('');
  const [submitting,    setSubmitting]    = useState(false);
  const [session,       setSession]       = useState(null);

  const styles = useMemo(() => makeStyles({ COLORS, SHADOWS }), [COLORS]);

  useEffect(() => {
    loadSession().then(setSession);
    fetchPosts(true);
  }, []);

  const fetchPosts = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const data = await getBlogPosts();
      setPosts(data);
    } catch (e) {
      Alert.alert('Error', getErrorMessage(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts(false);
  };

  const handleCreatePost = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Required', 'Both title and body are required.');
      return;
    }
    setSubmitting(true);
    try {
      await createBlogPost({ title: title.trim(), body: body.trim() });
      setTitle('');
      setBody('');
      setModalVisible(false);
      fetchPosts(false);
    } catch (e) {
      Alert.alert('Error', getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLongPress = (item) => {
    if (!session || session.userId !== item.user_id) return;
    Alert.alert('Delete Post', 'Are you sure you want to delete this post and all its answers?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteBlogPost(item.id);
            setPosts((prev) => prev.filter((p) => p.id !== item.id));
          } catch (e) {
            Alert.alert('Error', getErrorMessage(e));
          }
        },
      },
    ]);
  };

  const renderPost = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('BlogPost', { postId: item.id })}
      onLongPress={() => handleLongPress(item)}
      activeOpacity={0.8}
    >
      <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
      <View style={styles.cardMeta}>
        <Text style={styles.metaAuthor}>{item.author_name}</Text>
        <View style={styles.metaRight}>
          <Ionicons name="chatbubble-outline" size={13} color={COLORS.cyan} />
          <Text style={styles.metaCount}>{item.answer_count}</Text>
          <Text style={styles.metaDate}>{formatDate(item.created_at)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.cyan} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={COLORS.navy}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.cyan} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Community Blog</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPost}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.cyan}
            colors={[COLORS.cyan]}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="newspaper-outline" size={52} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No posts yet.{'\n'}Be the first to share!</Text>
          </View>
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={30} color={COLORS.navy} />
      </TouchableOpacity>

      {/* Create Post Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Post</Text>

            <TextInput
              style={styles.textInput}
              placeholder="Title"
              placeholderTextColor={COLORS.placeholder}
              value={title}
              onChangeText={setTitle}
              maxLength={200}
            />
            <TextInput
              style={[styles.textInput, styles.bodyInput]}
              placeholder="Share your experience or ask a question..."
              placeholderTextColor={COLORS.placeholder}
              value={body}
              onChangeText={setBody}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={5000}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => { setModalVisible(false); setTitle(''); setBody(''); }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.btnDisabled]}
                onPress={handleCreatePost}
                disabled={submitting}
              >
                {submitting
                  ? <ActivityIndicator size="small" color={COLORS.navy} />
                  : <Text style={styles.submitBtnText}>Post</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const makeStyles = ({ COLORS, SHADOWS }) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.navy,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.navy,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg + 8,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.navyBorder,
  },
  headerTitle: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
  },
  list: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: COLORS.navyMid,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.navyBorder,
    ...SHADOWS.card,
  },
  cardTitle: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaAuthor: {
    ...FONTS.small,
    color: COLORS.cyan,
  },
  metaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaCount: {
    ...FONTS.small,
    color: COLORS.cyan,
    marginRight: SPACING.sm,
  },
  metaDate: {
    ...FONTS.small,
    color: COLORS.textSecondary,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    gap: SPACING.md,
  },
  emptyText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.cyan,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: COLORS.cyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000066',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.navyMid,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: SPACING.xl + 8,
  },
  modalTitle: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  textInput: {
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.navyBorder,
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
    fontSize: 15,
  },
  bodyInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.navyBorder,
    alignItems: 'center',
  },
  cancelBtnText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
  },
  submitBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.cyan,
    alignItems: 'center',
  },
  submitBtnText: {
    ...FONTS.body,
    fontWeight: '700',
    color: COLORS.navy,
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
