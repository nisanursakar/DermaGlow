import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ListRenderItem,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

// -----------------------------------------------------------------------------
// Theme
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
  sentMessageBg: '#7A66B8',
  receivedMessageBg: '#F0EBF5',
};

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------
type Message = {
  id: string;
  text: string;
  senderId: string;
  receiverId: string;
  timestamp: Date;
  isRead: boolean;
};

type ChatDetailRouteProp = RouteProp<RootStackParamList, 'ChatDetailScreen'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ChatDetailScreen'>;

// Mock initial messages (in real app, fetch from API)
const getInitialMessages = (userId: string): Message[] => {
  const currentUserId = 'currentUser';
  return [
    {
      id: 'm1',
      text: 'Merhaba! Cilt bakımı hakkında konuşmak ister misin?',
      senderId: userId,
      receiverId: currentUserId,
      timestamp: new Date(Date.now() - 3600000),
      isRead: true,
    },
    {
      id: 'm2',
      text: 'Tabii ki! Hangi ürünleri kullanıyorsun?',
      senderId: currentUserId,
      receiverId: userId,
      timestamp: new Date(Date.now() - 3300000),
      isRead: true,
    },
    {
      id: 'm3',
      text: 'Niacinamide serum kullanıyorum, çok memnunum.',
      senderId: userId,
      receiverId: currentUserId,
      timestamp: new Date(Date.now() - 3000000),
      isRead: true,
    },
  ];
};

// Helper functions
function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

// -----------------------------------------------------------------------------
// Message Bubble Component
// -----------------------------------------------------------------------------
function MessageBubble({
  message,
  isSent,
  showTime,
}: {
  message: Message;
  isSent: boolean;
  showTime: boolean;
}) {
  return (
    <View style={[styles.messageBubbleContainer, isSent ? styles.sentContainer : styles.receivedContainer]}>
      <View
        style={[
          styles.messageBubble,
          isSent ? styles.sentBubble : styles.receivedBubble,
        ]}
      >
        <Text style={[styles.messageText, isSent && styles.sentMessageText]}>
          {message.text}
        </Text>
        {showTime && (
          <Text style={[styles.messageTime, isSent && styles.sentMessageTime]}>
            {formatTime(message.timestamp)}
          </Text>
        )}
      </View>
    </View>
  );
}

// -----------------------------------------------------------------------------
// Main ChatDetailScreen Component
// -----------------------------------------------------------------------------
export default function ChatDetailScreen() {
  const route = useRoute<ChatDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { userId, userName } = route.params;

  const currentUserId = 'currentUser';
  const flatListRef = useRef<FlatList>(null);
  const [messages, setMessages] = useState<Message[]>(getInitialMessages(userId));
  const [inputText, setInputText] = useState('');
  const nextMessageIdRef = useRef(100);

  // Set header title
  useEffect(() => {
    navigation.setOptions({
      title: userName,
      headerStyle: {
        backgroundColor: theme.headerBg,
      },
      headerTintColor: theme.textPrimary,
      headerTitleStyle: {
        fontWeight: '700',
      },
    });
  }, [navigation, userName]);

  // Auto-scroll to bottom when new message is added
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSendMessage = useCallback(() => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: `m${nextMessageIdRef.current++}`,
      text: inputText.trim(),
      senderId: currentUserId,
      receiverId: userId,
      timestamp: new Date(),
      isRead: false,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText('');

    // Simulate reply after 1-2 seconds (optional)
    setTimeout(() => {
      const replyMessage: Message = {
        id: `m${nextMessageIdRef.current++}`,
        text: 'Teşekkürler! Bu bilgi çok yardımcı oldu.',
        senderId: userId,
        receiverId: currentUserId,
        timestamp: new Date(),
        isRead: false,
      };
      setMessages((prev) => [...prev, replyMessage]);
    }, 1500);
  }, [inputText, userId]);

  const renderMessage: ListRenderItem<Message> = ({ item, index }) => {
    const isSent = item.senderId === currentUserId;
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showTime =
      !prevMessage ||
      item.timestamp.getTime() - prevMessage.timestamp.getTime() > 300000 || // 5 minutes
      isSent !== (prevMessage.senderId === currentUserId);

    return <MessageBubble message={item} isSent={isSent} showTime={showTime} />;
  };

  const keyExtractor = (item: Message) => item.id;

  const renderHeader = () => (
    <View style={styles.headerInfo}>
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarText}>{getInitials(userName)}</Text>
      </View>
      <View style={styles.headerTextBlock}>
        <Text style={styles.headerName}>{userName}</Text>
        <Text style={styles.headerStatus}>Çevrimiçi</Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={keyExtractor}
        renderItem={renderMessage}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.messagesList}
        inverted={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Mesaj yaz..."
          placeholderTextColor={theme.textSecondary}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          onPress={handleSendMessage}
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          disabled={!inputText.trim()}
        >
          <Text style={styles.sendButtonText}>Gönder</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: theme.cardBackground,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: theme.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.lightPurple,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerTextBlock: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 2,
  },
  headerStatus: {
    fontSize: 12,
    color: '#4CD964',
    fontWeight: '600',
  },
  messageBubbleContainer: {
    marginBottom: 8,
    flexDirection: 'row',
  },
  sentContainer: {
    justifyContent: 'flex-end',
  },
  receivedContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  sentBubble: {
    backgroundColor: theme.sentMessageBg,
    borderBottomRightRadius: 4,
  },
  receivedBubble: {
    backgroundColor: theme.receivedMessageBg,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    color: theme.textPrimary,
    lineHeight: 20,
  },
  sentMessageText: {
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  sentMessageTime: {
    color: 'rgba(255,255,255,0.8)',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.cardBackground,
    borderTopWidth: 1,
    borderTopColor: '#E8E4F0',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: theme.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
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
});
