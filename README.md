# DermaGlow

React Native (TypeScript) ile geliştirilmiş AI cilt bakımı mobil uygulaması.

## Kurulum

```bash
npm install
```

### iOS
```bash
cd ios && pod install && cd ..
```

Proje **sadece React Native** kullanır (Expo yok). Kamera ve galeri için `react-native-image-picker`, ikonlar için `react-native-vector-icons` kullanılır.

## Çalıştırma

```bash
npm run android   # Android
npm run ios       # iOS
```

## Proje yapısı

- **src/screens** – Ana Sayfa, Rutin, Kamera, Chat, Daha Fazla, detay ekranları
- **src/navigation** – Stack + Bottom Tab navigasyon
- **src/components** – Ortak UI bileşenleri
- **src/constants** – Tema ve sabitler
