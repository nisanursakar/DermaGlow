import React, { useState, useCallback, useRef } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { launchImageLibrary, launchCamera, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import { RootStackParamList } from '../navigation/AppNavigator';

// -----------------------------------------------------------------------------
// Theme (DermaGlow pastel style)
// -----------------------------------------------------------------------------
const theme = {
  background: '#F8F4FF',
  headerBg: '#EFE8F6',
  cardBackground: '#FFFFFF',
  primaryPurple: '#4B3B70',
  secondaryPurple: '#887DA2',
  lightPurple: '#DDC9F3',
  iconBg: '#F5E6FA',
  textPrimary: '#4B3B70',
  textSecondary: '#8B7FA8',
  shadowColor: 'rgba(0,0,0,0.12)',
  likedColor: '#FF6B9D',
};

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

type MessageItem = {
  id: string;
  userId: string;
  userName: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  isOnline: boolean;
  skinType: string;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ChatScreen'>;

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

const MESSAGES: MessageItem[] = [
  {
    id: '1',
    userId: 'user1',
    userName: 'Elif Kaya',
    lastMessage: 'O serumu ben de kullanıyorum, harika!',
    time: '10:30',
    unreadCount: 2,
    isOnline: true,
    skinType: 'Kuru Cilt',
  },
  {
    id: '2',
    userId: 'user2',
    userName: 'Deniz Y.',
    lastMessage: 'Yeni peeling nasıl, memnun musun?',
    time: '09:12',
    unreadCount: 0,
    isOnline: false,
    skinType: 'Karma Cilt',
  },
  {
    id: '3',
    userId: 'user3',
    userName: 'Ayşe K.',
    lastMessage: 'Maske önerin için teşekkürler 💜',
    time: 'Dün',
    unreadCount: 1,
    isOnline: false,
    skinType: 'Hassas Cilt',
  },
];

// Image picker with camera and gallery options
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
  return true; // iOS handles permissions automatically
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
              {
                mediaType: 'photo' as MediaType,
                quality: 0.8,
                saveToPhotos: true,
              },
              (response: ImagePickerResponse) => {
                if (response.didCancel) {
                  resolve(null);
                } else if (response.errorMessage) {
                  Alert.alert('Hata', response.errorMessage);
                  resolve(null);
                } else if (response.assets && response.assets[0]) {
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
              {
                mediaType: 'photo' as MediaType,
                quality: 0.8,
              },
              (response: ImagePickerResponse) => {
                if (response.didCancel) {
                  resolve(null);
                } else if (response.errorMessage) {
                  Alert.alert('Hata', response.errorMessage);
                  resolve(null);
                } else if (response.assets && response.assets[0]) {
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

// Helper functions
function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getTimeAgo(): string {
  return 'Az önce';
}

// -----------------------------------------------------------------------------
// Comment Modal Component
// -----------------------------------------------------------------------------
function CommentModal({
  visible,
  post,
  onClose,
  onAddComment,
}: {
  visible: boolean;
  post: CommunityPost | null;
  onClose: () => void;
  onAddComment: (postId: string, commentText: string) => void;
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
// Create Post Modal Component
// -----------------------------------------------------------------------------
function CreatePostModal({
  visible,
  onClose,
  onCreatePost,
}: {
  visible: boolean;
  onClose: () => void;
  onCreatePost: (content: string, imageUri?: string) => void;
}) {
  const [postText, setPostText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handlePickImage = async () => {
    const uri = await pickImage();
    if (uri) {
      setSelectedImage(uri);
    }
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
            <Text style={styles.modalTitle}>Yeni Gönderi</Text>
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
// Post Card Component
// -----------------------------------------------------------------------------
function CommunityPostCard({
  post,
  onLike,
  onComment,
}: {
  post: CommunityPost;
  onLike: (postId: string) => void;
  onComment: (post: CommunityPost) => void;
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
          <Text
            style={[
              styles.postFooterText,
              post.isLiked && styles.postFooterTextLiked,
            ]}
          >
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
// Message Row Component
// -----------------------------------------------------------------------------
function MessageRow({
  item,
  onPress,
}: {
  item: MessageItem;
  onPress: (userId: string, userName: string) => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress(item.userId, item.userName)}
      style={styles.messageRow}
    >
      <View style={styles.messageAvatarWrapper}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{getInitials(item.userName)}</Text>
        </View>
        {item.isOnline ? <View style={styles.onlineDot} /> : null}
      </View>

      <View style={styles.messageContentBlock}>
        <View style={styles.messageTopRow}>
          <Text style={styles.messageUserName}>{item.userName}</Text>
          <Text style={styles.messageTime}>{item.time}</Text>
        </View>

        <Text numberOfLines={1} style={styles.messagePreview}>
          {item.lastMessage}
        </Text>

        <View style={styles.messageBottomRow}>
          <View style={styles.skinTypePill}>
            <Text style={styles.skinTypeText}>{item.skinType}</Text>
          </View>
          {item.unreadCount > 0 ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// -----------------------------------------------------------------------------
// Main ChatScreen Component
// -----------------------------------------------------------------------------
export default function ChatScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [posts, setPosts] = useState<CommunityPost[]>(INITIAL_POSTS);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [createPostModalVisible, setCreatePostModalVisible] = useState(false);
  const nextPostIdRef = useRef(4);
  const nextCommentIdRef = useRef(100);

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
      userName: 'Sen', // Current user
      text: commentText,
      timeAgo: getTimeAgo(),
    };

    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            comments: [...post.comments, newComment],
          };
        }
        return post;
      })
    );

    // Update selected post if modal is open
    if (selectedPost?.id === postId) {
      setSelectedPost({
        ...selectedPost,
        comments: [...selectedPost.comments, newComment],
      });
    }
  }, [selectedPost]);

  const handleCreatePost = useCallback((content: string, imageUri?: string) => {
    const newPost: CommunityPost = {
      id: `post${nextPostIdRef.current++}`,
      userName: 'Sen', // Current user
      timeAgo: getTimeAgo(),
      content,
      imageUri,
      likeCount: 0,
      isLiked: false,
      comments: [],
    };

    setPosts((prevPosts) => [newPost, ...prevPosts]);
  }, []);

  const handleMessagePress = useCallback(
    (userId: string, userName: string) => {
      navigation.navigate('ChatDetailScreen', { userId, userName });
    },
    [navigation]
  );

  const renderPost: ListRenderItem<CommunityPost> = ({ item }) => (
    <CommunityPostCard post={item} onLike={handleLike} onComment={handleComment} />
  );

  const keyExtractor = (item: CommunityPost) => item.id;

  const renderHeader = () => (
    <View>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>💬</Text>
        <Text style={styles.headerTitle}>Topluluk & Chat</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search users or topics..."
          placeholderTextColor={theme.textSecondary}
          style={styles.searchInput}
        />
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Topluluk</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setCreatePostModalVisible(true)}
          style={styles.createPostButtonHeader}
        >
          <Text style={styles.createPostButtonHeaderText}>+ Yeni Gönderi</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFooter = () => (
    <View style={styles.messagesSection}>
      <Text style={styles.sectionTitle}>Mesajlar</Text>
      {MESSAGES.map((m) => (
        <MessageRow key={m.id} item={m} onPress={handleMessagePress} />
      ))}
      <View style={styles.bottomSpacing} />
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={keyExtractor}
        renderItem={renderPost}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <CommentModal
        visible={commentModalVisible}
        post={selectedPost}
        onClose={() => setCommentModalVisible(false)}
        onAddComment={handleAddComment}
      />

      <CreatePostModal
        visible={createPostModalVisible}
        onClose={() => setCreatePostModalVisible(false)}
        onCreatePost={handleCreatePost}
      />

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7}>
          <Text style={styles.tabIcon}>🏠</Text>
          <Text style={styles.tabLabel}>Ana Sayfa</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7}>
          <Text style={styles.tabIcon}>📋</Text>
          <Text style={styles.tabLabel}>Rutin</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7}>
          <Text style={styles.tabIcon}>📷</Text>
          <Text style={styles.tabLabel}>Kamera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7}>
          <Text style={styles.tabIcon}>💬</Text>
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>Chat</Text>
          <View style={styles.tabActiveIndicator} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7}>
          <Text style={styles.tabIcon}>⋯</Text>
          <Text style={styles.tabLabel}>Daha Fazla</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  listContent: {
    paddingBottom: 24,
  },

  // Header & search
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
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: theme.textPrimary,
    shadowColor: theme.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },

  // Section headers
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
    backgroundColor: theme.primaryPurple,
    borderRadius: 16,
  },
  createPostButtonHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Community post card
  postCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: theme.cardBackground,
    shadowColor: theme.shadowColor,
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
    color: '#FFFFFF',
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
    color: theme.likedColor,
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
    color: theme.secondaryPurple,
    fontWeight: '600',
  },

  // Messages section
  messagesSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: theme.cardBackground,
    marginTop: 10,
    shadowColor: theme.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  messageAvatarWrapper: {
    marginRight: 12,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CD964',
    borderWidth: 2,
    borderColor: theme.cardBackground,
  },
  messageContentBlock: {
    flex: 1,
  },
  messageTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageUserName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  messageTime: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  messagePreview: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 4,
  },
  messageBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  skinTypePill: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: theme.iconBg,
  },
  skinTypeText: {
    fontSize: 11,
    color: theme.textPrimary,
    fontWeight: '600',
  },
  unreadBadge: {
    marginLeft: 8,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.primaryPurple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  bottomSpacing: {
    height: 24,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.cardBackground,
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
    borderBottomColor: '#F0EBF5',
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
    borderBottomColor: '#F0EBF5',
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
    color: '#FFFFFF',
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
    borderTopColor: '#F0EBF5',
    alignItems: 'flex-end',
  },
  commentInput: {
    flex: 1,
    backgroundColor: theme.background,
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
    backgroundColor: theme.primaryPurple,
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

  // Create post modal
  createPostContent: {
    padding: 20,
    maxHeight: 500,
  },
  createPostInput: {
    backgroundColor: theme.background,
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
    backgroundColor: theme.background,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  pickImageText: {
    fontSize: 14,
    color: theme.primaryPurple,
    fontWeight: '600',
  },
  createPostButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 14,
    backgroundColor: theme.primaryPurple,
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

  // Bottom tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.cardBackground,
    borderTopWidth: 1,
    borderTopColor: '#E8E4F0',
    paddingVertical: 10,
    paddingBottom: 24,
    paddingTop: 8,
    shadowColor: theme.shadowColor,
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
    color: theme.primaryPurple,
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
    backgroundColor: theme.primaryPurple,
  },
});
