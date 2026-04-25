// src/screens/BlogPostScreen.js
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, StyleSheet, Alert,
  ActivityIndicator, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { SPACING, RADIUS, FONTS } from '../theme/index';
import { useTheme }               from '../context/ThemeContext';
import { loadSession }            from '../storage/userStorage';
import {
  getBlogPost, createBlogAnswer, deleteBlogPost, deleteBlogAnswer, getErrorMessage,
} from '../api/index';

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function BlogPostScreen({ navigation, route }) {
  const { postId } = route.params;
  const { theme, isDark } = useTheme();
  const { COLORS, SHADOWS } = theme;

  const [post,       setPost]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [answerBody, setAnswerBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [session,    setSession]    = useState(null);
  const flatListRef = useRef(null);

  const styles = useMemo(() => makeStyles({ COLORS, SHADOWS }), [COLORS]);

  useEffect(() => {
    loadSession().then(setSession);
    fetchPost();
  }, []);

  const fetchPost = useCallback(async () => {
    try {
      const data = await getBlogPost(postId);
      setPost(data);
    } catch (e) {
      Alert.alert('Error', getErrorMessage(e));
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [postId]);

  const handleSubmitAnswer = async () => {
    const text = answerBody.trim();
    if (!text) return;
    setSubmitting(true);
    try {
      const newAnswer = await createBlogAnswer(postId, text);
      setPost((prev) => ({
        ...prev,
        answers:      [...prev.answers, newAnswer],
        answer_count: prev.answer_count + 1,
      }));
      setAnswerBody('');
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
    } catch (e) {
      Alert.alert('Error', getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLongPressPost = () => {
    if (!session || !post || session.userId !== post.user_id) return;
    Alert.alert(
      'Delete Post',
      'This will permanently delete the post and all its answers.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBlogPost(postId);
              navigation.goBack();
            } catch (e) {
              Alert.alert('Error', getErrorMessage(e));
            }
          },
        },
      ],
    );
  };

  const handleLongPressAnswer = (answer) => {
    if (!session || session.userId !== answer.user_id) return;
    Alert.alert('Delete Answer', 'Remove this answer?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteBlogAnswer(answer.id);
            setPost((prev) => ({
              ...prev,
              answers:      prev.answers.filter((a) => a.id !== answer.id),
              answer_count: prev.answer_count - 1,
            }));
          } catch (e) {
            Alert.alert('Error', getErrorMessage(e));
          }
        },
      },
    ]);
  };

  const renderAnswer = ({ item }) => (
    <TouchableOpacity
      style={styles.answerCard}
      onLongPress={() => handleLongPressAnswer(item)}
      activeOpacity={session?.userId === item.user_id ? 0.8 : 1}
    >
      <View style={styles.answerHeader}>
        <Ionicons name="person-circle-outline" size={15} color={COLORS.cyan} />
        <Text style={styles.answerAuthor}>{item.author_name}</Text>
        <Text style={styles.answerDate}>{formatDate(item.created_at)}</Text>
      </View>
      <Text style={styles.answerBody}>{item.body}</Text>
    </TouchableOpacity>
  );

  const ListHeader = () => (
    <>
      {/* Post card — long-press to delete if owner */}
      <TouchableOpacity
        style={styles.postCard}
        onLongPress={handleLongPressPost}
        activeOpacity={session?.userId === post?.user_id ? 0.8 : 1}
      >
        <Text style={styles.postTitle}>{post?.title}</Text>
        <View style={styles.postMeta}>
          <Text style={styles.metaAuthor}>{post?.author_name}</Text>
          <Text style={styles.metaDate}>{post ? formatDate(post.created_at) : ''}</Text>
        </View>
        <Text style={styles.postBody}>{post?.body}</Text>
      </TouchableOpacity>

      {/* Answers section header */}
      <View style={styles.sectionHeader}>
        <Ionicons name="chatbubbles-outline" size={16} color={COLORS.cyan} />
        <Text style={styles.sectionTitle}>
          {post?.answer_count ?? 0}{' '}
          {post?.answer_count === 1 ? 'Answer' : 'Answers'}
        </Text>
      </View>
    </>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.cyan} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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
        <Text style={styles.headerTitle} numberOfLines={1}>{post?.title ?? 'Post'}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Post body + answers list */}
      <FlatList
        ref={flatListRef}
        data={post?.answers ?? []}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderAnswer}
        ListHeaderComponent={post ? <ListHeader /> : null}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Text style={styles.emptyText}>No answers yet. Be the first to reply!</Text>
        }
      />

      {/* Reply bar */}
      <View style={styles.replyBar}>
        <TextInput
          style={styles.replyInput}
          placeholder="Write a reply..."
          placeholderTextColor={COLORS.placeholder}
          value={answerBody}
          onChangeText={setAnswerBody}
          multiline
          maxLength={2000}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !answerBody.trim() && styles.sendBtnDisabled]}
          onPress={handleSubmitAnswer}
          disabled={submitting || !answerBody.trim()}
        >
          {submitting
            ? <ActivityIndicator size="small" color={COLORS.navy} />
            : <Ionicons name="send" size={18} color={COLORS.navy} />
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    ...FONTS.h4,
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: SPACING.sm,
  },
  list: {
    padding: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  postCard: {
    backgroundColor: COLORS.navyMid,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.navyBorder,
    ...SHADOWS.card,
  },
  postTitle: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  postMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  metaAuthor: {
    ...FONTS.small,
    color: COLORS.cyan,
  },
  metaDate: {
    ...FONTS.small,
    color: COLORS.textSecondary,
  },
  postBody: {
    ...FONTS.body,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    ...FONTS.label,
    color: COLORS.textSecondary,
  },
  answerCard: {
    backgroundColor: COLORS.navyMid,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm + 4,
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.navyBorder,
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  answerAuthor: {
    ...FONTS.small,
    color: COLORS.cyan,
    fontWeight: '600',
  },
  answerDate: {
    ...FONTS.small,
    color: COLORS.textSecondary,
    marginLeft: 'auto',
  },
  answerBody: {
    ...FONTS.body,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  emptyText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: SPACING.lg,
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.navyBorder,
    backgroundColor: COLORS.navyMid,
    gap: SPACING.xs,
  },
  replyInput: {
    flex: 1,
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.navyBorder,
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs + 2,
    fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cyan,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: COLORS.btnDisabled,
  },
});
