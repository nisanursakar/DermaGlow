// src/screens/ChatDetailScreen.tsx

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

import { useRoutine } from '../context/RoutineContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { API_URL } from '../../secret';

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

// Çevirilerin güvenli bir şekilde çekilmesini sağlayan yardımcı fonksiyon (Translation Helper)
// Eğer çeviri dosyasında kelime yoksa (veya çeviri kütüphanesi hazır değilse) varsayılan bir metin döner.
const safeTranslate = (t: any, key: string, fallback: string) => {
  if (!t) return fallback;
  const translated = t(key);
  return translated === key ? fallback : translated;
};

// Dinamik başlangıç mesajları fonksiyonu (Artık t fonksiyonunu parametre olarak alıyor)
const getInitialMessages = (userId: string, t: any): Message[] => {
  const currentUserId = 'currentUser';

  if (userId === 'bot_01') {
    return [{
      id: 'm0',
      text: safeTranslate(t, 'aiWelcomeMessage', 'Merhaba! Ben DermAI. Cilt bakım rutinin hakkında bana her şeyi sorabilirsin. 🤖'),
      senderId: userId,
      receiverId: currentUserId,
      timestamp: new Date(),
      isRead: true,
    }];
  }

  return [
    {
      id: 'm1',
      text: safeTranslate(t, 'userWelcome1', 'Merhaba! Cilt bakımı hakkında konuşmak ister misin?'),
      senderId: userId,
      receiverId: currentUserId,
      timestamp: new Date(Date.now() - 3600000),
      isRead: true,
    },
    {
      id: 'm2',
      text: safeTranslate(t, 'userWelcome2', 'Tabii ki! Hangi ürünleri kullanıyorsun?'),
      senderId: currentUserId,
      receiverId: userId,
      timestamp: new Date(Date.now() - 3300000),
      isRead: true,
    },
  ];
};

function getInitials(name: string): string {
  const parts = name ? name.trim().split(' ') : ['?'];
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function MessageBubble({
  message,
  isSent,
  showTime,
  styles: bubbleStyles,
}: {
  message: Message;
  isSent: boolean;
  showTime: boolean;
  styles: ReturnType<typeof createChatDetailStyles>;
}) {
  return (
    <View style={[bubbleStyles.messageBubbleContainer, isSent ? bubbleStyles.sentContainer : bubbleStyles.receivedContainer]}>
      <View style={[bubbleStyles.messageBubble, isSent ? bubbleStyles.sentBubble : bubbleStyles.receivedBubble]}>
        <Text style={[bubbleStyles.messageText, isSent && bubbleStyles.sentMessageText]}>{message.text}</Text>
        {showTime && (
          <Text style={[bubbleStyles.messageTime, isSent && bubbleStyles.sentMessageTime]}>{formatTime(message.timestamp)}</Text>
        )}
      </View>
    </View>
  );
}

function createChatDetailStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    messagesList: { padding: 16, paddingBottom: 8 },
    headerInfo: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, backgroundColor: theme.cardBackground || theme.cardBg, borderRadius: 16, marginBottom: 16, shadowColor: theme.shadowStrong || '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
    avatarCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: theme.lightPurple || '#DDC9F3', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    avatarText: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
    headerTextBlock: { flex: 1 },
    headerName: { fontSize: 16, fontWeight: '700', color: theme.textPrimary, marginBottom: 2 },
    headerStatus: { fontSize: 12, color: theme.success || '#4CD964', fontWeight: '600' },
    messageBubbleContainer: { marginBottom: 8, flexDirection: 'row' },
    sentContainer: { justifyContent: 'flex-end' },
    receivedContainer: { justifyContent: 'flex-start' },
    messageBubble: { maxWidth: '75%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
    sentBubble: { backgroundColor: theme.primaryLight || '#8A70B3', borderBottomRightRadius: 4 },
    receivedBubble: { backgroundColor: theme.iconBg || '#F5E6FA', borderBottomLeftRadius: 4 },
    messageText: { fontSize: 15, color: theme.textPrimary, lineHeight: 20 },
    sentMessageText: { color: '#FFFFFF' },
    messageTime: { fontSize: 11, color: theme.textSecondary, marginTop: 4, alignSelf: 'flex-end' },
    sentMessageTime: { color: 'rgba(255,255,255,0.8)' },
    inputContainer: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: theme.cardBackground || theme.cardBg, borderTopWidth: 1, borderTopColor: theme.textSecondary + '40', alignItems: 'flex-end' },
    input: { flex: 1, backgroundColor: theme.background, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: theme.textPrimary, maxHeight: 100, marginRight: 10 },
    sendButton: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: theme.primary, borderRadius: 20 },
    sendButtonDisabled: { backgroundColor: theme.lightPurple || '#DDC9F3' },
    sendButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  });
}

export default function ChatDetailScreen() {
  const route = useRoute<ChatDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { userId, userName } = route.params;
  const { getRoutineSummary } = useRoutine();
  const styles = React.useMemo(() => createChatDetailStyles(theme), [theme]);

  const currentUserId = 'currentUser';
  const flatListRef = useRef<FlatList>(null);

  // Mesajları çeviri sistemiyle (t) başlatıyoruz
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const nextMessageIdRef = useRef(100);

  // Uygulama dili değiştiğinde veya sayfa ilk açıldığında mesajları dille uyumlu şekilde yükle
  useEffect(() => {
    if (messages.length === 0) {
      setMessages(getInitialMessages(userId, t));
    }
  }, [t, userId]);

  useEffect(() => {
    navigation.setOptions({
      title: userName,
      headerStyle: { backgroundColor: theme.headerBg },
      headerTintColor: theme.textPrimary,
      headerTitleStyle: { fontWeight: '700' },
    });
  }, [navigation, userName, theme]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim()) return;

    const userMsgText = inputText.trim();
    const newMessage: Message = {
      id: `m${nextMessageIdRef.current++}`,
      text: userMsgText,
      senderId: currentUserId,
      receiverId: userId,
      timestamp: new Date(),
      isRead: false,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText('');

    if (userId === 'bot_01') {
      setIsTyping(true);

      try {
        const routineContext = getRoutineSummary();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 saniye zaman aşımı

        const response = await fetch(`${API_URL}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMsgText,
            routine_context: routineContext
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API hatası (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        const aiResponseText = data.reply || 'Bir hata oluştu.';

        const aiMessage: Message = {
          id: `m${nextMessageIdRef.current++}`,
          text: aiResponseText,
          senderId: userId,
          receiverId: currentUserId,
          timestamp: new Date(),
          isRead: false,
        };
        setMessages((prev) => [...prev, aiMessage]);

      } catch (error: any) {
        console.error(`AI Hatası (${API_URL}):`, error.message || error);
        
        // Hata türüne göre kullanıcıya daha spesifik bir mesaj göster
        let userErrorMessage = 'Üzgünüm, şu an bağlantıda bir sorun yaşıyorum. Lütfen birazdan tekrar dene.';
        if (error.name === 'AbortError') {
          userErrorMessage = 'İstek zaman aşımına uğradı. Lütfen internet bağlantını kontrol et.';
        } else if (error.message === 'Network request failed') {
          userErrorMessage = 'Sunucuya bağlanılamadı. Lütfen aynı Wi-Fi ağına bağlı olduğunuzdan emin olun.';
        }

        const errorMessage: Message = {
          id: `m${nextMessageIdRef.current++}`,
          text: userErrorMessage,
          senderId: userId,
          receiverId: currentUserId,
          timestamp: new Date(),
          isRead: false,
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsTyping(false);
      }

    } else {
      setTimeout(() => {
        const replyMessage: Message = {
          id: `m${nextMessageIdRef.current++}`,
          text: safeTranslate(t, 'userReplySimulation', 'Teşekkürler! Bu bilgi çok yardımcı oldu.'),
          senderId: userId,
          receiverId: currentUserId,
          timestamp: new Date(),
          isRead: false,
        };
        setMessages((prev) => [...prev, replyMessage]);
      }, 1500);
    }
  }, [inputText, userId, getRoutineSummary, t]);

  const renderMessage: ListRenderItem<Message> = ({ item, index }) => {
    const isSent = item.senderId === currentUserId;
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showTime =
      !prevMessage ||
      item.timestamp.getTime() - prevMessage.timestamp.getTime() > 300000 ||
      isSent !== (prevMessage.senderId === currentUserId);

    return <MessageBubble message={item} isSent={isSent} showTime={showTime} styles={styles} />;
  };

  const keyExtractor = (item: Message) => item.id;

  const renderHeader = () => (
    <View style={styles.headerInfo}>
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarText}>{getInitials(userName)}</Text>
      </View>
      <View style={styles.headerTextBlock}>
        <Text style={styles.headerName}>{userName}</Text>
        <Text style={styles.headerStatus}>
           {userId === 'bot_01'
             ? (isTyping ? safeTranslate(t, 'typing', 'Yazıyor...') : safeTranslate(t, 'online', 'Çevrimiçi') + ' 🤖')
             : safeTranslate(t, 'online', 'Çevrimiçi')
           }
        </Text>
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
          placeholder={safeTranslate(t, 'typeMessage', 'Mesaj yaz...')}
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
          <Text style={styles.sendButtonText}>{safeTranslate(t, 'send', 'Gönder')}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}