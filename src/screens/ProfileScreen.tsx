import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useUserProfile, type SkinType, type SensitivityLevel } from '../context/UserProfileContext';
import { launchImageLibrary } from 'react-native-image-picker';

const SKIN_TYPES: { value: SkinType; key: string }[] = [
  { value: 'normal', key: 'skinTypeNormal' },
  { value: 'dry', key: 'skinTypeDry' },
  { value: 'oily', key: 'skinTypeOily' },
  { value: 'combination', key: 'skinTypeCombination' },
  { value: 'sensitive', key: 'skinTypeSensitive' },
];

const SENSITIVITY_OPTIONS: { value: SensitivityLevel; key: string }[] = [
  { value: 'low', key: 'sensitivityLow' },
  { value: 'medium', key: 'sensitivityMedium' },
  { value: 'high', key: 'sensitivityHigh' },
];

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { profile, updateProfile, setProfileImage } = useUserProfile();

  // Profile image state is defined immediately after context so it is in scope for all handlers
  const [profileImage, setProfileImageState] = useState<string | null>(profile.profileImageUri);
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [email, setEmail] = useState(profile.email);
  const [password, setPassword] = useState(profile.password);
  const [skinType, setSkinType] = useState<SkinType>(profile.skinType);
  const [sensitivity, setSensitivity] = useState<SensitivityLevel>(profile.sensitivity);
  const [skinProblems, setSkinProblems] = useState<string[]>(profile.skinProblems);
  const [birthDate, setBirthDate] = useState(profile.birthDate ?? '');
  const [height, setHeight] = useState(profile.height ?? '');
  const [weight, setWeight] = useState(profile.weight ?? '');
  const [skinTypeModalVisible, setSkinTypeModalVisible] = useState(false);
  const [sensitivityModalVisible, setSensitivityModalVisible] = useState(false);
  const [birthDatePickerVisible, setBirthDatePickerVisible] = useState(false);
  const now = new Date();
  const parseBirthDate = (s: string) => {
    if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return { day: 1, month: 1, year: now.getFullYear() - 30 };
    const [y, m, d] = s.split('-').map(Number);
    return { day: d, month: m, year: y };
  };
  const parsed = parseBirthDate(birthDate);
  const [pickerDay, setPickerDay] = useState(parsed.day);
  const [pickerMonth, setPickerMonth] = useState(parsed.month);
  const [pickerYear, setPickerYear] = useState(parsed.year);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = Array.from(
    { length: now.getFullYear() - 1970 + 1 },
    (_, i) => 1970 + i
  );
  const openBirthDatePicker = () => {
    const p = parseBirthDate(birthDate);
    setPickerDay(p.day);
    setPickerMonth(p.month);
    setPickerYear(p.year);
    setBirthDatePickerVisible(true);
  };
  const confirmBirthDate = () => {
    const s = `${pickerYear}-${String(pickerMonth).padStart(2, '0')}-${String(pickerDay).padStart(2, '0')}`;
    setBirthDate(s);
    setBirthDatePickerVisible(false);
  };


  useEffect(() => {
    const fetchRealUser = async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (authError) throw authError;

        if (user) {
          setEmail(user.email ?? '');

          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profileData) {
            setDisplayName(profileData.display_name || user.user_metadata?.full_name || '');
            setSkinType((profileData.skin_type as SkinType) || 'combination');
            setSensitivity((profileData.sensitivity as SensitivityLevel) || 'medium');
            setSkinProblems((profileData.skin_problems as string[]) || []);
            const bd = (profileData as Record<string, unknown>)['birth_date'] as string | undefined;
            const h = (profileData as Record<string, unknown>)['height_cm'] as string | number | undefined;
            const w = (profileData as Record<string, unknown>)['weight_kg'] as string | number | undefined;
            setBirthDate(bd ?? profile.birthDate ?? '');
            setHeight(h != null ? String(h) : (profile.height ?? ''));
            setWeight(w != null ? String(w) : (profile.weight ?? ''));
            const imageFromDb = (profileData['profile_image_url'] as string | null) ?? null;
            setProfileImageState(imageFromDb);
            setProfileImage(imageFromDb);

            updateProfile({
              displayName: profileData.display_name || user.user_metadata?.full_name || '',
              skinType: (profileData.skin_type as SkinType) || 'combination',
              sensitivity: (profileData.sensitivity as SensitivityLevel) || 'medium',
              skinProblems: (profileData.skin_problems as string[]) || [],
              profileImageUri: imageFromDb,
              birthDate: bd ?? profile.birthDate ?? null,
              height: h != null ? String(h) : profile.height ?? '',
              weight: w != null ? String(w) : profile.weight ?? '',
            });
          } else if (user.user_metadata?.full_name) {
            setDisplayName(user.user_metadata.full_name);
          }
        }
      } catch (err) {
        console.error('Kullanıcı bilgileri çekilemedi:', err);
      }
    };

    fetchRealUser();
  }, [updateProfile]);

  const toggleSkinProblem = (problem: string) => {
    if (skinProblems.includes(problem)) {
      setSkinProblems(skinProblems.filter(p => p !== problem));
    } else {
      setSkinProblems([...skinProblems, problem]);
    }
  };

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("Hata", "Oturum bulunamadı. Lütfen tekrar giriş yapın.");
        return;
      }

      // 1. Auth Metadata'yı da güncelliyoruz ki iki taraf da senkron kalsın
      await supabase.auth.updateUser({
        data: { full_name: displayName.trim() }
      });

      // 2. Profiles tablosunu Upsert (Güncelleme/Ekleme) yapıyoruz
      console.log('Supabase Schema Check:', profileImage);

      // Sadece Supabase'de kesin olan sütunları gönder (birth_date, height_cm, weight_kg tabloda yoksa hata verir)
      const userData = {
        id: user.id,
        display_name: displayName.trim(),
        skin_type: skinType,
        sensitivity: sensitivity,
        skin_problems: skinProblems,
        profile_image_url: profileImage,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(userData);

      if (error) throw error;

      // 3. Yerel Context'i de anında güncelliyoruz
      updateProfile({
        displayName: displayName.trim(),
        email: email.trim(),
        password,
        skinType,
        sensitivity,
        skinProblems,
        profileImageUri: profileImage,
        birthDate: birthDate.trim() || undefined,
        height: height.trim() || undefined,
        weight: weight.trim() || undefined,
      });

      Alert.alert("Başarılı", "Profil bilgileriniz başarıyla güncellendi!");
      navigation.goBack();

    } catch (err) {
      console.error("Kaydetme hatası:", err);
      Alert.alert("Hata", "Bilgileriniz kaydedilirken bir sorun oluştu.");
    }
  };

  const handleChangePhoto = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, (res) => {
      const uri = res.assets?.[0]?.uri;
      if (uri) {
        setProfileImageState(uri);
        setProfileImage(uri);
      }
    });
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return (name[0] || 'N').toUpperCase();
  };

  const skinTypeLabel = t(SKIN_TYPES.find((o) => o.value === skinType)?.key ?? 'skinTypeCombination');
  const sensitivityLabel = t(SENSITIVITY_OPTIONS.find((o) => o.value === sensitivity)?.key ?? 'sensitivityMedium');

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Icon name="arrow-left" size={24} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>{t('profileTitle')}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.avatarSection, { backgroundColor: theme.headerBg }]}>
          <TouchableOpacity onPress={handleChangePhoto} style={styles.avatarWrap} activeOpacity={0.8}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
                <Text style={styles.avatarText}>{getInitials(displayName || profile.displayName)}</Text>
              </View>
            )}
            <View style={[styles.cameraBadge, { backgroundColor: theme.primary }]}>
              <Icon name="camera" size={14} color="#FFF" />
            </View>
          </TouchableOpacity>
          <Text style={[styles.profileName, { color: theme.textPrimary }]}>{displayName || profile.displayName}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.cardBg }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>👤 {t('personalInfo')}</Text>
          <Text style={[styles.label, { color: theme.textSecondary }]}>{t('nameSurname')}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.iconBg, color: theme.textPrimary, borderColor: theme.textSecondary + '40' }]}
            placeholder={t('nameSurname')}
            placeholderTextColor={theme.textSecondary}
            value={displayName}
            onChangeText={setDisplayName}
          />
          <Text style={[styles.label, { color: theme.textSecondary }]}>{t('email')}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.iconBg, color: theme.textPrimary, borderColor: theme.textSecondary + '40' }]}
            placeholder={t('email')}
            placeholderTextColor={theme.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={false} // Supabase'de mail değişimi ayrı bir akış gerektirir, şimdilik kapatmak güvenlidir
          />
        </View>

        <View style={[styles.card, { backgroundColor: theme.cardBg }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>❤️ {t('skinProfile')}</Text>
          <Text style={[styles.label, { color: theme.textSecondary }]}>{t('skinType')}</Text>
          <TouchableOpacity style={[styles.picker, { backgroundColor: theme.iconBg, borderColor: theme.textSecondary + '40' }]} onPress={() => setSkinTypeModalVisible(true)}>
            <Text style={[styles.pickerText, { color: theme.textPrimary }]}>{skinTypeLabel}</Text>
            <Icon name="chevron-down" size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          <Text style={[styles.label, { color: theme.textSecondary }]}>{t('sensitivity')}</Text>
          <TouchableOpacity style={[styles.picker, { backgroundColor: theme.iconBg, borderColor: theme.textSecondary + '40' }]} onPress={() => setSensitivityModalVisible(true)}>
            <Text style={[styles.pickerText, { color: theme.textPrimary }]}>{sensitivityLabel}</Text>
            <Icon name="chevron-down" size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          <Text style={[styles.label, { color: theme.textSecondary }]}>{t('birthDate')}</Text>
          <TouchableOpacity
            style={[styles.picker, { backgroundColor: theme.iconBg, borderColor: theme.textSecondary + '40' }]}
            onPress={openBirthDatePicker}
          >
            <Text style={[styles.pickerText, { color: birthDate ? theme.textPrimary : theme.textSecondary }]}>
              {birthDate || t('birthDate')}
            </Text>
            <Icon name="calendar" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.label, { color: theme.textSecondary }]}>{t('height')}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.iconBg, color: theme.textPrimary, borderColor: theme.textSecondary + '40' }]}
            placeholder="170"
            placeholderTextColor={theme.textSecondary}
            value={height}
            onChangeText={setHeight}
            keyboardType="numeric"
          />
          <Text style={[styles.label, { color: theme.textSecondary }]}>{t('weight')}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.iconBg, color: theme.textPrimary, borderColor: theme.textSecondary + '40' }]}
            placeholder="65"
            placeholderTextColor={theme.textSecondary}
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
          />
          <Text style={[styles.label, { color: theme.textSecondary }]}>{t('skinProblems')}</Text>
          <View style={styles.tagsRow}>
            {['Kuru Cilt', 'Akne İzleri', 'Hassasiyet', 'Siyah Nokta'].map((p, i) => {
              const isSelected = skinProblems.includes(p);
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => toggleSkinProblem(p)}
                  style={[styles.tag, { backgroundColor: isSelected ? theme.primary : theme.lightPurple }]}
                >
                  <Text style={[styles.tagText, { color: isSelected ? '#FFF' : theme.primary }]}>{p}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.primary }]} onPress={handleSave} activeOpacity={0.8}>
          <Icon name="save" size={20} color="#FFF" />
          <Text style={styles.saveButtonText}>{t('save')}</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <Modal visible={skinTypeModalVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSkinTypeModalVisible(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBg }]}>
            {SKIN_TYPES.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.modalOption, skinType === opt.value && { backgroundColor: theme.iconBg }]}
                onPress={() => { setSkinType(opt.value); setSkinTypeModalVisible(false); }}
              >
                <Text style={[styles.modalOptionText, { color: theme.textPrimary }]}>{t(opt.key)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={sensitivityModalVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSensitivityModalVisible(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBg }]}>
            {SENSITIVITY_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.modalOption, sensitivity === opt.value && { backgroundColor: theme.iconBg }]}
                onPress={() => { setSensitivity(opt.value); setSensitivityModalVisible(false); }}
              >
                <Text style={[styles.modalOptionText, { color: theme.textPrimary }]}>{t(opt.key)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={birthDatePickerVisible} transparent animationType="fade">
        <View style={[styles.dateOverlay, { backgroundColor: theme.background + 'CC' }]}>
          <ScrollView
            contentContainerStyle={styles.dateSheetScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.dateSheet, { backgroundColor: theme.cardBg }]}>
              <Text style={[styles.dateSheetTitle, { color: theme.textPrimary }]}>{t('birthDate')}</Text>
              <View style={[styles.dateColumns, { maxHeight: Dimensions.get('window').height * 0.36 }]}>
                <ScrollView style={[styles.dateColumn, { width: '14%' }]} showsVerticalScrollIndicator nestedScrollEnabled>
                  {days.map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[styles.dateItem, pickerDay === d && { backgroundColor: theme.primary + '22' }]}
                      onPress={() => setPickerDay(d)}
                    >
                      <Text style={[styles.dateItemText, { color: pickerDay === d ? theme.primary : theme.textPrimary }]}>
                        {String(d).padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <ScrollView
                  style={[styles.dateColumn, { width: '70%' }]}
                  contentContainerStyle={{ width: '100%' }}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                >
                  {months.map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.dateItem, pickerMonth === m && { backgroundColor: theme.primary + '22' }]}
                      onPress={() => setPickerMonth(m)}
                    >
                      <Text style={[styles.dateItemText, { color: pickerMonth === m ? theme.primary : theme.textPrimary }]}>
                        {t(`onb_month_${m}`)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <ScrollView style={[styles.dateColumn, { width: '16%' }]} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                  {years.map((y) => (
                    <TouchableOpacity
                      key={y}
                      style={[styles.dateItem, pickerYear === y && { backgroundColor: theme.primary + '22' }]}
                      onPress={() => setPickerYear(y)}
                    >
                      <Text style={[styles.dateItemText, { color: pickerYear === y ? theme.primary : theme.textPrimary }]}>
                        {y}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.dateButtonsRow}>
                <TouchableOpacity style={styles.dateSecondaryBtn} onPress={() => setBirthDatePickerVisible(false)}>
                  <Text style={[styles.dateSecondaryText, { color: theme.textSecondary }]}>{t('cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.datePrimaryBtn, { backgroundColor: theme.primary }]} onPress={confirmBirthDate}>
                  <Text style={styles.datePrimaryText}>{t('save')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 48, paddingHorizontal: 16, paddingBottom: 16 },
  backButton: { marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16 },
  avatarSection: { alignItems: 'center', paddingVertical: 24, marginBottom: 16, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 36, fontWeight: '700', color: '#FFF' },
  cameraBadge: { position: 'absolute', right: 0, bottom: 0, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  profileName: { fontSize: 20, fontWeight: '700', marginTop: 12 },
  card: { borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, borderWidth: 1, marginBottom: 16 },
  picker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, marginBottom: 16 },
  pickerText: { fontSize: 16 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  tagText: { fontSize: 13, fontWeight: '600' },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 14, marginTop: 8, gap: 8 },
  saveButtonText: { fontSize: 17, fontWeight: '600', color: '#FFF' },
  bottomSpacing: { height: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { borderRadius: 16, padding: 8 },
  modalOption: { paddingVertical: 16, paddingHorizontal: 20, borderRadius: 12 },
  modalOptionText: { fontSize: 16 },
  dateOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dateSheetScroll: { flexGrow: 1, justifyContent: 'center', paddingVertical: 16 },
  dateSheet: {
    width: '98%',
    maxWidth: 600,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  dateSheetTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  dateColumns: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  dateColumn: { flex: 1, minHeight: 200 },
  dateItem: { paddingVertical: 10, alignItems: 'center', borderRadius: 14, marginBottom: 4, alignSelf: 'stretch' },
  dateItemText: { fontSize: 12 },
  dateButtonsRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
  dateSecondaryBtn: { paddingVertical: 10, paddingHorizontal: 14, marginRight: 8 },
  dateSecondaryText: { fontSize: 14 },
  datePrimaryBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 16 },
  datePrimaryText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});