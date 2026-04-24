import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ListRenderItem,
  Modal,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  PermissionsAndroid,
} from 'react-native';
import { launchImageLibrary, launchCamera, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useUserProfile } from '../context/UserProfileContext';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------
export type Comment = {
  id: string;
  userName: string;
  text: string;
  timeAgo: string;
};

export type CommunityPost = {
  id: string;
  userName: string;
  timeAgo: string;
  content: string;
  imageUri?: string;
  likeCount: number;
  isLiked: boolean;
  comments: Comment[];
};

// -----------------------------------------------------------------------------
// Initial Data
// -----------------------------------------------------------------------------
const INITIAL_POSTS: CommunityPost[] = [
  {
    id: '1',
    userName: 'Melis A.',
    timeAgo: '2 saat önce',
    content: 'Niacinamide ile başarılı sonuçlar aldım! 🌟',
    likeCount: 24,
    isLiked: false,
    comments: [
      { id: 'c1', userName: 'Ayşe K.', text: 'Harika! Hangi marka kullandın?', timeAgo: '1 saat önce' },
      { id: 'c2', userName: 'Melis A.', text: 'The Ordinary kullandım, çok memnunum!', timeAgo: '45 dk önce' },
    ],
  },
  {
    id: '2',
    userName: 'Ece T.',
    timeAgo: '5 saat önce',
    content: 'Sabah rutinime yeni eklediğim C vitamini muhteşem.',
    likeCount: 18,
    isLiked: true,
    comments: [
      { id: 'c3', userName: 'Deniz Y.', text: 'Ben de denemek istiyorum!', timeAgo: '3 saat önce' },
    ],
  },
  {
    id: '3',
    userName: 'Can B.',
    timeAgo: '1 gün önce',
    content: 'Güneş kremi değiştirdim, cildim çok daha rahatladı.',
    likeCount: 31,
    isLiked: false,
    comments: [],
  },
];

// Image picker
const requestCameraPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Kamera İzni',
          message: 'Fotoğraf çekmek için kamera iznine ihtiyacımız var.',
          buttonNeutral: 'Daha Sonra Sor',
          buttonNegative: 'İptal',
          buttonPositive: 'Tamam',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
  return true;
};

const pickImage = (): Promise<string | null> => {
  return new Promise((resolve) => {
    Alert.alert(
      'Fotoğraf Ekle',
      'Fotoğraf eklemek için bir seçenek seçin',
      [
        { text: 'İptal', style: 'cancel', onPress: () => resolve(null) },
        {
          text: 'Kamera',
          onPress: async () => {
            const hasPermission = await requestCameraPermission();
            if (!hasPermission) {
              Alert.alert('İzin Gerekli', 'Kamera izni verilmedi.');
              resolve(null);
              return;
            }
            launchCamera(
              { mediaType: 'photo' as MediaType, quality: 0.8, saveToPhotos: true },
              (response: ImagePickerResponse) => {
                if (response.assets && response.assets[0]) {
                  resolve(response.assets[0].uri || null);
                } else {
                  resolve(null);
                }
              }
            );
          },
        },
        {
          text: 'Galeri',
          onPress: () => {
            launchImageLibrary(
              { mediaType: 'photo' as MediaType, quality: 0.8 },
              (response: ImagePickerResponse) => {
                if (response.assets && response.assets[0]) {
                  resolve(response.assets[0].uri || null);
                } else {
                  resolve(null);
                }
              }
            );
          },
        },
      ],
      { cancelable: true }
    );
  });
};

// Helpers
function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getTimeAgo(): string {
  return 'Az önce';
}

// -----------------------------------------------------------------------------
// Comment Modal
// -----------------------------------------------------------------------------
function CommentModal({
  visible,
  post,
  onClose,
  onAddComment,
  styles,
  theme,
}: {
  visible: boolean;
  post: CommunityPost | null;
  onClose: () => void;
  onAddComment: (postId: string, commentText: string) => void;
  styles: ReturnType<typeof createChatScreenStyles>;
  theme: ReturnType<typeof useTheme>['theme'];
}) {
  const [newComment, setNewComment] = useState('');

  const handleAddComment = () => {
    if (!post || !newComment.trim()) return;
    onAddComment(post.id, newComment.trim());
    setNewComment('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Yorumlar</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.commentsList}>
            {post?.comments.length === 0 ? (
              <Text style={styles.noCommentsText}>Henüz yorum yok. İlk yorumu sen yap!</Text>
            ) : (
              post?.comments.map((comment) => (
                <View key={comment.id} style={styles.commentItem}>
                  <View style={styles.commentAvatar}>
                    <Text style={styles.commentAvatarText}>{getInitials(comment.userName)}</Text>
                  </View>
                  <View style={styles.commentContent}>
                    <Text style={styles.commentUserName}>{comment.userName}</Text>
                    <Text style={styles.commentText}>{comment.text}</Text>
                    <Text style={styles.commentTime}>{comment.timeAgo}</Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Yorum yaz..."
              placeholderTextColor={theme.textSecondary}
              value={newComment}
              onChangeText={setNewComment}
              multiline
            />
            <TouchableOpacity
              onPress={handleAddComment}
              style={[styles.sendButton, !newComment.trim() && styles.sendButtonDisabled]}
              disabled={!newComment.trim()}
            >
              <Text style={styles.sendButtonText}>Gönder</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// -----------------------------------------------------------------------------
// Create Post Modal
// -----------------------------------------------------------------------------
function CreatePostModal({
  visible,
  onClose,
  onCreatePost,
  styles,
  theme,
}: {
  visible: boolean;
  onClose: () => void;
  onCreatePost: (content: string, imageUri?: string) => void;
  styles: ReturnType<typeof createChatScreenStyles>;
  theme: ReturnType<typeof useTheme>['theme'];
}) {
  const { t } = useLanguage();
  const [postText, setPostText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handlePickImage = async () => {
    const uri = await pickImage();
    if (uri) setSelectedImage(uri);
  };

  const handleCreatePost = () => {
    if (!postText.trim()) {
      Alert.alert('Hata', 'Lütfen bir mesaj yazın.');
      return;
    }
    onCreatePost(postText.trim(), selectedImage || undefined);
    setPostText('');
    setSelectedImage(null);
    onClose();
  };

  const handleClose = () => {
    setPostText('');
    setSelectedImage(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('newPost')}</Text>
            <TouchableOpacity onPress={handleClose} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.createPostContent}>
            <TextInput
              style={styles.createPostInput}
              placeholder="Ne paylaşmak istersiniz?"
              placeholderTextColor={theme.textSecondary}
              value={postText}
              onChangeText={setPostText}
              multiline
              textAlignVertical="top"
            />
            {selectedImage && (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
                <TouchableOpacity
                  onPress={() => setSelectedImage(null)}
                  style={styles.removeImageButton}
                >
                  <Text style={styles.removeImageText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity onPress={handlePickImage} style={styles.pickImageButton}>
              <Text style={styles.pickImageText}>📷 Fotoğraf Ekle</Text>
            </TouchableOpacity>
          </ScrollView>

          <TouchableOpacity
            onPress={handleCreatePost}
            style={[styles.createPostButton, !postText.trim() && styles.createPostButtonDisabled]}
            disabled={!postText.trim()}
          >
            <Text style={styles.createPostButtonText}>Paylaş</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// -----------------------------------------------------------------------------
// Post Card
// -----------------------------------------------------------------------------
function CommunityPostCard({
  post,
  onLike,
  onComment,
  styles,
}: {
  post: CommunityPost;
  onLike: (postId: string) => void;
  onComment: (post: CommunityPost) => void;
  styles: ReturnType<typeof createChatScreenStyles>;
}) {
  return (
    <View style={styles.postCard}>
      <View style={styles.postHeaderRow}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{getInitials(post.userName)}</Text>
        </View>
        <View style={styles.postHeaderTextBlock}>
          <Text style={styles.postUserName}>{post.userName}</Text>
          <Text style={styles.postTime}>{post.timeAgo}</Text>
        </View>
      </View>

      {post.content ? <Text style={styles.postContent}>{post.content}</Text> : null}

      {post.imageUri && (
        <Image source={{ uri: post.imageUri }} style={styles.postImage} resizeMode="cover" />
      )}

      <View style={styles.postFooterRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onLike(post.id)}
          style={styles.postFooterLeft}
        >
          <Text style={styles.postFooterIcon}>{post.isLiked ? '❤️' : '🤍'}</Text>
          <Text style={[styles.postFooterText, post.isLiked && styles.postFooterTextLiked]}>
            {post.likeCount}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onComment(post)}
          style={styles.commentButton}
        >
          <Text style={styles.commentIcon}>💬</Text>
          <Text style={styles.commentText}>{post.comments.length} yorum</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// -----------------------------------------------------------------------------
// Main ChatScreen
// -----------------------------------------------------------------------------
export default function ChatScreen() {
  const [posts, setPosts] = useState<CommunityPost[]>(INITIAL_POSTS);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [createPostModalVisible, setCreatePostModalVisible] = useState(false);
  const nextPostIdRef = useRef(4);
  const nextCommentIdRef = useRef(100);
  const { theme: contextTheme } = useTheme();
  const { t } = useLanguage();
  const { profile: userProfile } = useUserProfile();

  const handleLike = useCallback((postId: string) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          const newIsLiked = !post.isLiked;
          return {
            ...post,
            isLiked: newIsLiked,
            likeCount: newIsLiked ? post.likeCount + 1 : post.likeCount - 1,
          };
        }
        return post;
      })
    );
  }, []);

  const handleComment = useCallback((post: CommunityPost) => {
    setSelectedPost(post);
    setCommentModalVisible(true);
  }, []);

  const handleAddComment = useCallback((postId: string, commentText: string) => {
    const newComment: Comment = {
      id: `c${nextCommentIdRef.current++}`,
      userName: 'Sen',
      text: commentText,
      timeAgo: getTimeAgo(),
    };
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          return { ...post, comments: [...post.comments, newComment] };
        }
        return post;
      })
    );
    if (selectedPost?.id === postId) {
      setSelectedPost({ ...selectedPost, comments: [...selectedPost.comments, newComment] });
    }
  }, [selectedPost]);

  const handleCreatePost = useCallback((content: string, imageUri?: string) => {
    const newPost: CommunityPost = {
      id: `post${nextPostIdRef.current++}`,
      userName: userProfile.displayName || 'Sen',
      timeAgo: getTimeAgo(),
      content,
      imageUri,
      likeCount: 0,
      isLiked: false,
      comments: [],
    };
    setPosts((prevPosts) => [newPost, ...prevPosts]);
  }, [userProfile.displayName]);

  const styles = useMemo(() => createChatScreenStyles(contextTheme), [contextTheme]);

  const renderPost: ListRenderItem<CommunityPost> = ({ item }) => (
    <CommunityPostCard post={item} onLike={handleLike} onComment={handleComment} styles={styles} />
  );

  const keyExtractor = (item: CommunityPost) => item.id;

  const renderHeader = () => (
    <View>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>💬</Text>
        <Text style={styles.headerTitle}>{t('community')} & Chat</Text>
      </View>
      <View style={styles.searchContainer}>
        <TextInput
          placeholder={t('searchUsersTopics')}
          placeholderTextColor={contextTheme.textSecondary}
          style={styles.searchInput}
        />
      </View>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>{t('community')}</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setCreatePostModalVisible(true)}
          style={styles.createPostButtonHeader}
        >
          <Text style={styles.createPostButtonHeaderText}>+ {t('newPost')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: contextTheme.background }]}>
      <FlatList
        data={posts}
        keyExtractor={keyExtractor}
        renderItem={renderPost}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={<View style={styles.bottomSpacing} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <CommentModal
        visible={commentModalVisible}
        post={selectedPost}
        onClose={() => setCommentModalVisible(false)}
        onAddComment={handleAddComment}
        styles={styles}
        theme={contextTheme}
      />

      <CreatePostModal
        visible={createPostModalVisible}
        onClose={() => setCreatePostModalVisible(false)}
        onCreatePost={handleCreatePost}
        styles={styles}
        theme={contextTheme}
      />
    </View>
  );
}

// -----------------------------------------------------------------------------
// Styles (tema ile karanlık mod uyumlu)
// -----------------------------------------------------------------------------
function createChatScreenStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    listContent: {
      paddingBottom: 24,
    },
    header: {
      backgroundColor: theme.headerBg,
      paddingTop: 48,
      paddingBottom: 16,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerIcon: {
      fontSize: 22,
      marginRight: 10,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    searchContainer: {
      backgroundColor: theme.headerBg,
      paddingHorizontal: 20,
      paddingBottom: 16,
    },
    searchInput: {
      backgroundColor: theme.cardBg,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      fontSize: 14,
      color: theme.textPrimary,
      shadowColor: theme.shadowStrong,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 4,
      elevation: 2,
    },
    sectionHeaderRow: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    createPostButtonHeader: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: theme.primary,
      borderRadius: 16,
    },
    createPostButtonHeaderText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    postCard: {
      marginHorizontal: 20,
      marginBottom: 12,
      padding: 16,
      borderRadius: 18,
      backgroundColor: theme.cardBg,
      shadowColor: theme.shadowStrong,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 4,
    },
    postHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    avatarCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.lightPurple,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    postHeaderTextBlock: {
      marginLeft: 10,
    },
    postUserName: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    postTime: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
    postContent: {
      fontSize: 14,
      color: theme.textPrimary,
      lineHeight: 20,
      marginBottom: 12,
    },
    postImage: {
      width: '100%',
      height: 250,
      borderRadius: 12,
      marginBottom: 12,
    },
    postFooterRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    postFooterLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    postFooterIcon: {
      fontSize: 18,
      marginRight: 4,
    },
    postFooterText: {
      fontSize: 13,
      color: theme.textSecondary,
    },
    postFooterTextLiked: {
      color: theme.accentPink,
      fontWeight: '600',
    },
    commentButton: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    commentIcon: {
      fontSize: 16,
      marginRight: 4,
    },
    commentText: {
      fontSize: 13,
      color: theme.secondary,
      fontWeight: '600',
    },
    bottomSpacing: {
      height: 24,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.cardBg,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '90%',
      paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.textSecondary + '30',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    modalCloseButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalCloseText: {
      fontSize: 24,
      color: theme.textSecondary,
    },
    commentsList: {
      maxHeight: 400,
      paddingHorizontal: 20,
    },
    noCommentsText: {
      textAlign: 'center',
      color: theme.textSecondary,
      marginTop: 40,
      fontSize: 14,
    },
    commentItem: {
      flexDirection: 'row',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.textSecondary + '30',
    },
    commentAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.lightPurple,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    commentAvatarText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    commentContent: {
      flex: 1,
    },
    commentUserName: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.textPrimary,
      marginBottom: 2,
    },
    commentText: {
      fontSize: 14,
      color: theme.textPrimary,
      lineHeight: 20,
    },
    commentTime: {
      fontSize: 11,
      color: theme.textSecondary,
      marginTop: 4,
    },
    commentInputContainer: {
      flexDirection: 'row',
      padding: 20,
      borderTopWidth: 1,
      borderTopColor: theme.textSecondary + '30',
      alignItems: 'flex-end',
    },
    commentInput: {
      flex: 1,
      backgroundColor: theme.iconBg,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      fontSize: 14,
      color: theme.textPrimary,
      maxHeight: 100,
      marginRight: 10,
    },
    sendButton: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      backgroundColor: theme.primary,
      borderRadius: 20,
    },
    sendButtonDisabled: {
      backgroundColor: theme.lightPurple,
    },
    sendButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: 14,
    },
    createPostContent: {
      padding: 20,
      maxHeight: 500,
    },
    createPostInput: {
      backgroundColor: theme.iconBg,
      borderRadius: 16,
      padding: 16,
      fontSize: 15,
      color: theme.textPrimary,
      minHeight: 120,
      marginBottom: 16,
    },
    imagePreviewContainer: {
      position: 'relative',
      marginBottom: 16,
    },
    imagePreview: {
      width: '100%',
      height: 200,
      borderRadius: 12,
    },
    removeImageButton: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(0,0,0,0.6)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    removeImageText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '700',
    },
    pickImageButton: {
      padding: 12,
      backgroundColor: theme.iconBg,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 16,
    },
    pickImageText: {
      fontSize: 14,
      color: theme.primary,
      fontWeight: '600',
    },
    createPostButton: {
      marginHorizontal: 20,
      marginBottom: 20,
      paddingVertical: 14,
      backgroundColor: theme.primary,
      borderRadius: 16,
      alignItems: 'center',
    },
    createPostButtonDisabled: {
      backgroundColor: theme.lightPurple,
    },
    createPostButtonText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 16,
    },
    tabBar: {
      flexDirection: 'row',
      backgroundColor: theme.cardBg,
      borderTopWidth: 1,
      borderTopColor: theme.textSecondary + '40',
      paddingVertical: 10,
      paddingBottom: 24,
      paddingTop: 8,
      shadowColor: theme.shadowStrong,
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 8,
    },
    tabItem: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 4,
    },
    tabIcon: {
      fontSize: 22,
      marginBottom: 4,
    },
    tabLabel: {
      fontSize: 11,
      color: theme.textSecondary,
      fontWeight: '500',
    },
    tabLabelActive: {
      color: theme.primary,
      fontWeight: '700',
    },
    tabActiveIndicator: {
      position: 'absolute',
      top: 0,
      left: '50%',
      marginLeft: -20,
      width: 40,
      height: 3,
      borderRadius: 2,
      backgroundColor: theme.primary,
    },
  });
}