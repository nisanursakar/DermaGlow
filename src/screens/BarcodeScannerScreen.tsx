import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Camera, useCameraDevice, useCodeScanner, useCameraPermission } from 'react-native-vision-camera';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export default function BarcodeScannerScreen() {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const isFocused = useIsFocused(); // Ekranın açık olup olmadığını anlar

  // ÇÖZÜM 1: Makineli tüfek etkisini önlemek için kilit (Lock) state'i
  const [hasScanned, setHasScanned] = useState(false);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  // Ekran her açıldığında kilidi sıfırla ki tekrar okuma yapılabilsin
  useEffect(() => {
    if (isFocused) {
      setHasScanned(false);
    }
  }, [isFocused]);

  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13', 'ean-8', 'upc-e', 'upc-a', 'code-128'],
    onCodeScanned: (codes) => {
      // Eğer daha önce okuduysa veya kilitliyse hiçbir şey yapma!
      if (hasScanned) return;

      if (codes.length > 0 && codes[0].value) {
        setHasScanned(true); // Sistemi kilitle

        // Sadece 1 kere çalışacak şekilde gönder
        navigation.navigate('ProductSearchScreen', { scannedCode: codes[0].value });
      }
    }
  });

  if (!hasPermission) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.textPrimary }}>Kamera izni bekleniyor...</Text>
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.textPrimary }}>Kamera bulunamadı.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isFocused && !hasScanned} // Kamera sadece odaktayken ve henüz okumadıysa aktif olsun
        codeScanner={codeScanner}
      />

      {/* Overlay: Tarama Alanı Belirteci */}
      <View style={styles.overlay}>
        <View style={styles.scanArea}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
        <Text style={styles.instructionText}>{t('scanBarcodeInstruction') || 'Barkodu tarayıcı alanına getirin'}</Text>
      </View>

      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <Icon name="x" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  scanArea: { width: 250, height: 250, position: 'relative', backgroundColor: 'transparent' },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: '#00E676', borderWidth: 4 },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  instructionText: { marginTop: 40, color: '#FFF', fontSize: 16, fontWeight: '600', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, overflow: 'hidden' },
  closeButton: { position: 'absolute', top: 50, right: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }
});