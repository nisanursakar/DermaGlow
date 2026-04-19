import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

type Post = {
  id: number;
  title: string;
  content: string;
  author_id?: string;
  created_at?: string;
};

// Use 10.0.2.2 for Android emulator to access localhost, and 127.0.0.1 for iOS/web
const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://127.0.0.1:8000';

export default function PostList() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/posts`);
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      const data = await response.json();
      setPosts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const renderPost = ({ item }: { item: Post }) => (
    <View style={styles.postCard}>
      <Text style={styles.postTitle}>{item.title}</Text>
      <Text style={styles.postContent}>{item.content}</Text>
      {item.created_at && (
         <Text style={styles.postDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Topluluk Paylaşımları</Text>
        <TouchableOpacity onPress={fetchPosts} activeOpacity={0.7} style={styles.refreshButton}>
          <Text style={styles.refreshIcon}>↻</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} style={styles.loader} />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Bağlantı Hatası: {error}</Text>
          <Text style={styles.errorSubtext}>FastAPI sunucusunun çalıştığından emin olun.</Text>
        </View>
      ) : posts.length === 0 ? (
        <Text style={styles.emptyText}>Henüz paylaşım bulunmuyor.</Text>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderPost}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          // We don't want FlatList to scroll independently if it's nested inside a ScrollView.
          // Since HomeScreen uses ScrollView, we disable scrolling on FlatList and let ScrollView handle it.
          scrollEnabled={false}
        />
      )}
    </View>
  );
}

function createStyles(theme: any) {
  return StyleSheet.create({
    container: {
      marginTop: 20,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    refreshButton: {
      padding: 8,
      backgroundColor: theme.cardBg,
      borderRadius: 12,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    refreshIcon: {
      fontSize: 18,
      color: theme.primary,
    },
    loader: {
      marginVertical: 20,
    },
    errorContainer: {
      padding: 16,
      backgroundColor: theme.accentPink ?? theme.lightPurple ?? '#ffe6e6',
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 16,
    },
    errorText: {
      color: theme.textPrimary,
      fontWeight: '600',
      marginBottom: 4,
      textAlign: 'center',
    },
    errorSubtext: {
      color: theme.textSecondary,
      fontSize: 12,
      textAlign: 'center',
    },
    emptyText: {
      color: theme.textSecondary,
      textAlign: 'center',
      fontStyle: 'italic',
      marginTop: 10,
      marginBottom: 20,
    },
    listContent: {
      paddingBottom: 10,
    },
    postCard: {
      backgroundColor: theme.cardBg,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 3,
      borderLeftWidth: 4,
      borderLeftColor: theme.primary,
    },
    postTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.textPrimary,
      marginBottom: 6,
    },
    postContent: {
      fontSize: 14,
      color: theme.textSecondary,
      lineHeight: 20,
      marginBottom: 8,
    },
    postDate: {
      fontSize: 11,
      color: theme.textSecondary,
      textAlign: 'right',
    },
  });
}
