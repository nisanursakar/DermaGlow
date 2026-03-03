import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useUserProfile } from '../context/UserProfileContext';
import { supabase } from '../../supabase';
import type { SkinType } from '../context/UserProfileContext';
import type { SensitivityLevel } from '../context/UserProfileContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type QuestionId =
  | 'bioSex'
  | 'birthDate'
  | 'skinFeel'
  | 'oiliness'
  | 'tightAfterShower'
  | 'skinProblems'
  | 'sensitivity'
  | 'darkSpotsAfterAcne'
  | 'manyBlackheads'
  | 'mainExpectation'
  | 'waterIntake'
  | 'sunscreen'
  | 'makeup'
  | 'timeForRoutine'
  | 'skinTone'
  | 'dermTreatment'
  | 'prescription'
  | 'pregnancyHormonal'
  | 'cheekFruit'
  | 'fineLinesAreas';

type QuestionType = 'single' | 'multi' | 'date';

type QuestionConfig = {
  id: QuestionId;
  type: QuestionType;
  titleKey: string;
  descriptionKey?: string;
  optionsKeys?: string[];
};

type AnswersState = {
  [K in QuestionId]?: string | string[] | Date;
};

export default function OnboardingSurveyScreen({ navigation }: { navigation: any }) {
  const { theme } = useTheme();
  const { t, language, setLanguage } = useLanguage();
  const { updateProfile } = useUserProfile();

  const questions: QuestionConfig[] = useMemo(
    () => [
      {
        id: 'bioSex',
        type: 'single',
        titleKey: 'onb_q1_title',
        optionsKeys: ['onb_q1_opt1', 'onb_q1_opt2', 'onb_q1_opt3'],
      },
      {
        id: 'birthDate',
        type: 'date',
        titleKey: 'onb_q2_title',
        descriptionKey: 'onb_q2_desc',
      },
      {
        id: 'skinTone',
        type: 'single',
        titleKey: 'onb_q14_title',
        optionsKeys: ['onb_q14_opt1', 'onb_q14_opt2', 'onb_q14_opt3', 'onb_q14_opt4', 'onb_q14_opt5', 'onb_opt_unsure'],
      },
      {
        id: 'skinFeel',
        type: 'single',
        titleKey: 'onb_q3_title',
        optionsKeys: ['onb_q3_opt1', 'onb_q3_opt2', 'onb_q3_opt3', 'onb_q3_opt4'],
      },
      {
        id: 'oiliness',
        type: 'single',
        titleKey: 'onb_q4_title',
        optionsKeys: ['onb_q4_opt1', 'onb_q4_opt2', 'onb_q4_opt3', 'onb_q4_opt4'],
      },
      {
        id: 'tightAfterShower',
        type: 'single',
        titleKey: 'onb_q5_title',
        optionsKeys: ['onb_yes', 'onb_sometimes', 'onb_no'],
      },
      {
        id: 'skinProblems',
        type: 'multi',
        titleKey: 'onb_q6_title',
        optionsKeys: [
          'onb_q6_opt1',
          'onb_q6_opt2',
          'onb_q6_opt3',
          'onb_q6_opt4',
          'onb_q6_opt5',
          'onb_q6_opt6',
        ],
      },
      {
        id: 'sensitivity',
        type: 'single',
        titleKey: 'onb_q7_title',
        optionsKeys: ['onb_q7_opt1', 'onb_q7_opt2', 'onb_q7_opt3'],
      },
      {
        id: 'darkSpotsAfterAcne',
        type: 'single',
        titleKey: 'onb_q19_title',
        optionsKeys: ['onb_yes', 'onb_sometimes', 'onb_no'],
      },
      {
        id: 'manyBlackheads',
        type: 'single',
        titleKey: 'onb_q20_title',
        optionsKeys: ['onb_yes', 'onb_sometimes', 'onb_no'],
      },
      {
        id: 'mainExpectation',
        type: 'single',
        titleKey: 'onb_q13_title',
        optionsKeys: ['onb_q13_opt1', 'onb_q13_opt2', 'onb_q13_opt3', 'onb_q13_opt4', 'onb_q13_opt5'],
      },
      {
        id: 'waterIntake',
        type: 'single',
        titleKey: 'onb_q9_title',
        optionsKeys: ['onb_q9_opt1', 'onb_q9_opt2', 'onb_q9_opt3'],
      },
      {
        id: 'sunscreen',
        type: 'single',
        titleKey: 'onb_q8_title',
        optionsKeys: ['onb_yes_daily', 'onb_yes_sometimes', 'onb_no'],
      },
      {
        id: 'makeup',
        type: 'single',
        titleKey: 'onb_q10_title',
        optionsKeys: ['onb_q10_opt1', 'onb_q10_opt2', 'onb_q10_opt3'],
      },
      {
        id: 'timeForRoutine',
        type: 'single',
        titleKey: 'onb_q18_title',
        optionsKeys: ['onb_q18_opt1', 'onb_q18_opt2', 'onb_q18_opt3'],
      },
      {
        id: 'dermTreatment',
        type: 'single',
        titleKey: 'onb_q15_title',
        optionsKeys: ['onb_yes', 'onb_no', 'onb_opt_unsure'],
      },
      {
        id: 'prescription',
        type: 'single',
        titleKey: 'onb_q16_title',
        optionsKeys: ['onb_yes', 'onb_no'],
      },
      {
        id: 'pregnancyHormonal',
        type: 'single',
        titleKey: 'onb_q17_title',
        optionsKeys: ['onb_yes', 'onb_no'],
      },
      {
        id: 'cheekFruit',
        type: 'single',
        titleKey: 'onb_q11_title',
        optionsKeys: [
          'onb_q11_opt1',
          'onb_q11_opt2',
          'onb_q11_opt3',
          'onb_q11_opt4',
          'onb_q11_opt5',
          'onb_opt_unsure',
        ],
      },
      {
        id: 'fineLinesAreas',
        type: 'multi',
        titleKey: 'onb_q12_title',
        optionsKeys: [
          'onb_q12_opt1',
          'onb_q12_opt2',
          'onb_q12_opt3',
          'onb_q12_opt4',
          'onb_q12_opt5',
        ],
      },
    ],
    [t]
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswersState>({});
  const [isFinished, setIsFinished] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [birthDay, setBirthDay] = useState<number | null>(null);
  const [birthMonth, setBirthMonth] = useState<number | null>(null);
  const [birthYear, setBirthYear] = useState<number | null>(null);

  const lotusScrollRef = useRef<ScrollView | null>(null);

  const currentQuestion = questions[currentIndex];

  const totalQuestions = questions.length;

  const isAnswered = (q: QuestionConfig): boolean => {
    const value = answers[q.id];
    if (q.type === 'multi') {
      return Array.isArray(value) && value.length > 0;
    }
    if (q.type === 'date') {
      return value instanceof Date;
    }
    return typeof value === 'string' && value.length > 0;
  };

  const handleSelectOption = (q: QuestionConfig, optKey: string) => {
    setAnswers((prev) => {
      const prevValue = prev[q.id];
      if (q.type === 'multi') {
        const arr = Array.isArray(prevValue) ? [...prevValue] : [];
        const index = arr.indexOf(optKey);
        if (index >= 0) {
          arr.splice(index, 1);
        } else {
          arr.push(optKey);
        }
        return { ...prev, [q.id]: arr };
      }
      return { ...prev, [q.id]: optKey };
    });
  };

  const handleFakeDateSelect = () => {
    setShowDatePicker(true);
  };

  const goNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((idx) => idx + 1);
    } else {
      setIsFinished(true);
    }
  };

  const goBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((idx) => idx - 1);
    }
  };

  const answeredCount = questions.filter(isAnswered).length;

  const days = useMemo(() => Array.from({ length: 31 }, (_, i) => i + 1), []);
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const start = currentYear - 80;
    return Array.from({ length: 61 }, (_, i) => start + i);
  }, []);

  useEffect(() => {
    if (lotusScrollRef.current && !isFinished) {
      const itemWidth = 40;
      const offset = Math.max(0, (currentIndex - 4) * itemWidth);
      lotusScrollRef.current.scrollTo({ x: offset, animated: true });
    }
  }, [currentIndex, isFinished]);

  const getResultCards = () => {
    const cards: { icon: string; title: string; text: string }[] = [];

    const skinFeel = answers.skinFeel as string | undefined;
    let skinKey = 'onb_result_skin_normal';
    if (skinFeel === 'onb_q3_opt1') skinKey = 'onb_result_skin_dry';
    else if (skinFeel === 'onb_q3_opt2') skinKey = 'onb_result_skin_oily';
    else if (skinFeel === 'onb_q3_opt3') skinKey = 'onb_result_skin_combo';

    cards.push({
      icon: '🌸',
      title: t('onb_result_skin_title'),
      text: t(skinKey),
    });

    const water = answers.waterIntake as string | undefined;
    let hydrationKey = 'onb_result_hydration_mid';
    if (water === 'onb_q9_opt1') hydrationKey = 'onb_result_hydration_low';
    else if (water === 'onb_q9_opt3') hydrationKey = 'onb_result_hydration_good';

    cards.push({
      icon: '💧',
      title: t('onb_result_hydration_title'),
      text: t(hydrationKey),
    });

    const sunscreen = answers.sunscreen as string | undefined;
    let sunKey = 'onb_result_sun_mid';
    if (sunscreen === 'onb_yes_daily') sunKey = 'onb_result_sun_good';
    else if (sunscreen === 'onb_no') sunKey = 'onb_result_sun_low';

    cards.push({
      icon: '☀️',
      title: t('onb_result_sun_title'),
      text: t(sunKey),
    });

    const goal = answers.mainExpectation as string | undefined;
    if (goal) {
      cards.push({
        icon: '✨',
        title: t('onb_result_focus_title'),
        text: `${t('onb_result_focus_text_prefix')}${t(goal)}`,
      });
    }

    return cards;
  };

  const renderOptions = (q: QuestionConfig) => {
    if (q.type === 'date') {
      const hasDate = answers.birthDate instanceof Date;
      return (
        <TouchableOpacity
          style={[
            styles.datePickerMock,
            {
              borderColor: hasDate ? theme.primary : theme.textSecondary + '40',
              backgroundColor: theme.iconBg,
            },
          ]}
          onPress={handleFakeDateSelect}
          activeOpacity={0.8}
        >
          <Text style={[styles.datePickerText, { color: theme.textPrimary }]}>
            {hasDate ? t('onb_q2_selected') : t('onb_q2_placeholder')}
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.optionsContainer}>
        {q.optionsKeys?.map((optKey) => {
          const value = answers[q.id];
          const isMulti = q.type === 'multi';
          const isActive = isMulti
            ? Array.isArray(value) && value.includes(optKey)
            : value === optKey;

          const isSkinTone = q.id === 'skinTone';
          const isWaterIntake = q.id === 'waterIntake';

          let skinColor: string | undefined;
          if (isSkinTone) {
            if (optKey === 'onb_q14_opt1') skinColor = '#FFE8E8';
            else if (optKey === 'onb_q14_opt2') skinColor = '#FFD6B8';
            else if (optKey === 'onb_q14_opt3') skinColor = '#F4B27A';
            else if (optKey === 'onb_q14_opt4') skinColor = '#D98C52';
            else if (optKey === 'onb_q14_opt5') skinColor = '#8B5A2B';
          }

          let waterLevel = 0;
          if (isWaterIntake) {
            if (optKey === 'onb_q9_opt1') waterLevel = 0.3;
            else if (optKey === 'onb_q9_opt2') waterLevel = 0.6;
            else if (optKey === 'onb_q9_opt3') waterLevel = 0.9;
          }

          return (
            <TouchableOpacity
              key={optKey}
              style={[
                styles.optionChip,
                {
                  borderColor: isActive ? theme.primary : theme.textSecondary + '40',
                  backgroundColor: isActive ? theme.primaryLight ?? theme.primary + '22' : theme.cardBg,
                },
              ]}
              activeOpacity={0.8}
              onPress={() => handleSelectOption(q, optKey)}
            >
              <View style={styles.optionContent}>
                {isSkinTone && (
                  <View style={[styles.skinToneSwatch, { backgroundColor: skinColor ?? theme.iconBg }]} />
                )}
                {isWaterIntake && (
                  <View style={[styles.waterGlassOuter, { borderColor: theme.primary }]}>
                    <View
                      style={[
                        styles.waterGlassInner,
                        {
                          backgroundColor: theme.primaryLight ?? '#80DEEA',
                          height: `${waterLevel * 100}%`,
                        },
                      ]}
                    />
                  </View>
                )}
                <Text
                  style={[
                    styles.optionText,
                    { color: isActive ? theme.primary : theme.textPrimary },
                  ]}
                >
                  {t(optKey)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
        <View>
          <Text style={[styles.smallTitle, { color: theme.textSecondary }]}>{t('onb_header_small')}</Text>
          <Text style={[styles.title, { color: theme.textPrimary }]}>{t('onb_header_title')}</Text>
        </View>
        <TouchableOpacity
          style={[styles.langButton, { backgroundColor: theme.iconBg, borderColor: theme.textSecondary + '50' }]}
          onPress={() => setLanguage(language === 'tr' ? 'en' : 'tr')}
          activeOpacity={0.7}
        >
          <Icon name="globe" size={18} color={theme.primary} />
          <Text style={[styles.langButtonText, { color: theme.primary }]}>{language === 'tr' ? 'EN' : 'TR'}</Text>
        </TouchableOpacity>
      </View>

      {!isFinished ? (
        <View style={styles.card}>
          <ScrollView
            style={styles.cardScroll}
            contentContainerStyle={styles.cardContent}
            showsVerticalScrollIndicator={false}
            scrollEnabled={!showDatePicker}
          >
            <Text style={[styles.questionNumber, { color: theme.textSecondary }]}>
              {currentIndex + 1}/{totalQuestions}
            </Text>
            <Text style={[styles.questionTitle, { color: theme.textPrimary }]}>
              {t(currentQuestion.titleKey)}
            </Text>
            {currentQuestion.descriptionKey && (
              <Text style={[styles.questionDescription, { color: theme.textSecondary }]}>
                {t(currentQuestion.descriptionKey)}
              </Text>
            )}
            {renderOptions(currentQuestion)}
          </ScrollView>
        </View>
      ) : (
        <View style={styles.card}>
          <ScrollView
            style={styles.cardScroll}
            contentContainerStyle={styles.cardContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.questionNumber, { color: theme.textSecondary }]}>
              {t('onb_result_title')}
            </Text>
            <Text style={[styles.questionDescription, { color: theme.textSecondary, marginBottom: 16 }]}>
              {t('onb_result_sub')}
            </Text>
            {getResultCards().map((card) => (
              <View
                key={card.title}
                style={[styles.resultCard, { backgroundColor: theme.cardBg, borderColor: theme.primary + '33' }]}
              >
                <Text style={styles.resultIcon}>{card.icon}</Text>
                <Text style={[styles.resultTitle, { color: theme.textPrimary }]}>{card.title}</Text>
                <Text style={[styles.resultText, { color: theme.textSecondary }]}>{card.text}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.footerTop}>
          <ScrollView
            ref={lotusScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.lotusRow}
          >
            {questions.map((q, index) => {
              const answered = isAnswered(q) || isFinished;
              const current = !isFinished && index === currentIndex;
              return (
                <TouchableOpacity
                  key={q.id}
                  style={styles.lotusWrap}
                  onPress={() => !isFinished && setCurrentIndex(index)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.lotusCircle,
                      {
                        backgroundColor: answered ? theme.primaryLight ?? '#B39DDB' : theme.iconBg,
                        borderColor: current ? theme.primary : 'transparent',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.lotusEmoji,
                        { opacity: answered ? 1 : 0.4 },
                      ]}
                    >
                      🪷
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.lotusIndex,
                      { color: current ? theme.primary : theme.textSecondary },
                    ]}
                  >
                    {index + 1}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <Text style={[styles.progressText, { color: theme.textSecondary }]}>
            {answeredCount}/{totalQuestions}
          </Text>
        </View>

        {!isFinished ? (
          <View style={styles.footerBottom}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => navigation.replace('LoginScreen')}
            >
              <Text style={[styles.secondaryBtnText, { color: theme.textSecondary }]}>
                {t('onb_skip')}
              </Text>
            </TouchableOpacity>
            <View style={styles.footerRight}>
              <TouchableOpacity
                style={[styles.navBtn, { opacity: currentIndex === 0 ? 0.5 : 1 }]}
                disabled={currentIndex === 0}
                onPress={goBack}
              >
                <Text style={[styles.navBtnText, { color: theme.textSecondary }]}>
                  {t('onb_back')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.navBtnPrimary,
                  {
                    backgroundColor: theme.primary,
                    opacity: isAnswered(currentQuestion) ? 1 : 0.6,
                  },
                ]}
                disabled={!isAnswered(currentQuestion)}
                onPress={goNext}
              >
                <Text style={styles.navBtnPrimaryText}>
                  {currentIndex === totalQuestions - 1 ? t('onb_finish') : t('onb_next')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.footerBottom}>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              style={[styles.navBtnPrimary, { backgroundColor: theme.primary }]}
              onPress={async () => {
                const skinFeel = answers.skinFeel as string | undefined;
                let skinType: SkinType = 'combination';
                if (skinFeel === 'onb_q3_opt1') skinType = 'dry';
                else if (skinFeel === 'onb_q3_opt2') skinType = 'oily';
                else if (skinFeel === 'onb_q3_opt3') skinType = 'combination';
                else if (skinFeel === 'onb_q3_opt4') skinType = 'normal';
                const sens = answers.sensitivity as string | undefined;
                let sensitivity: SensitivityLevel = 'medium';
                if (sens === 'onb_q7_opt1') sensitivity = 'low';
                else if (sens === 'onb_q7_opt2') sensitivity = 'medium';
                else if (sens === 'onb_q7_opt3') sensitivity = 'high';
                const rawProblems = (answers.skinProblems as string[] | undefined) ?? [];
                const skinProblems = rawProblems.map((key) => t(key));
                const birthDate = answers.birthDate instanceof Date
                  ? answers.birthDate.toISOString().slice(0, 10)
                  : undefined;
                updateProfile({
                  skinType,
                  sensitivity,
                  skinProblems,
                  ...(birthDate && { birthDate }),
                });
                try {
                  const { data: { user } } = await supabase.auth.getUser();
                  if (user) {
                    await supabase.from('profiles').upsert({
                      id: user.id,
                      skin_type: skinType,
                      sensitivity,
                      skin_problems: skinProblems,
                      ...(birthDate && { birth_date: birthDate }),
                      updated_at: new Date().toISOString(),
                    });
                  }
                } catch (e) {
                  console.warn('Onboarding profile sync:', e);
                }
                navigation.replace('MainTabs');
              }}
            >
              <Text style={styles.navBtnPrimaryText}>{t('onb_result_cta')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {showDatePicker && (
        <Modal visible transparent animationType="fade">
          <View style={[styles.dateOverlay, { backgroundColor: theme.background + 'CC' }]}>
            <ScrollView
              contentContainerStyle={styles.dateSheetScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={[styles.dateSheet, { backgroundColor: theme.cardBg }]}>
                <Text style={[styles.dateSheetTitle, { color: theme.textPrimary }]}>
                  {t('onb_q2_title')}
                </Text>
                <View style={[styles.dateColumns, { maxHeight: SCREEN_HEIGHT * 0.38 }]}>
                  <ScrollView
                    style={styles.dateColumn}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                  >
                    {days.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.dateItem,
                      birthDay === d && { backgroundColor: theme.primary + '22' },
                    ]}
                    onPress={() => setBirthDay(d)}
                  >
                    <Text
                      style={[
                        styles.dateItemText,
                        { color: birthDay === d ? theme.primary : theme.textPrimary },
                      ]}
                    >
                      {d.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <ScrollView
                style={styles.dateColumn}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              >
                {months.map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.dateItem,
                      birthMonth === m && { backgroundColor: theme.primary + '22' },
                    ]}
                    onPress={() => setBirthMonth(m)}
                  >
                    <Text
                      style={[
                        styles.dateItemText,
                        { color: birthMonth === m ? theme.primary : theme.textPrimary },
                      ]}
                    >
                      {t(`onb_month_${m}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <ScrollView
                style={styles.dateColumn}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              >
                {years.map((y) => (
                  <TouchableOpacity
                    key={y}
                    style={[
                      styles.dateItem,
                      birthYear === y && { backgroundColor: theme.primary + '22' },
                    ]}
                    onPress={() => setBirthYear(y)}
                  >
                    <Text
                      style={[
                        styles.dateItemText,
                        { color: birthYear === y ? theme.primary : theme.textPrimary },
                      ]}
                    >
                      {y}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={styles.dateButtonsRow}>
              <TouchableOpacity
                style={styles.dateSecondaryBtn}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={[styles.dateSecondaryText, { color: theme.textSecondary }]}>
                  {t('cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.datePrimaryBtn, { backgroundColor: theme.primary }]}
                onPress={() => {
                  if (birthDay && birthMonth && birthYear) {
                    const date = new Date(birthYear, birthMonth - 1, birthDay);
                    setAnswers((prev) => ({ ...prev, birthDate: date }));
                    setShowDatePicker(false);
                  }
                }}
              >
                <Text style={styles.datePrimaryText}>{t('ok')}</Text>
              </TouchableOpacity>
            </View>
          </View>
            </ScrollView>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 12,
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  langButtonText: { fontSize: 14, fontWeight: '700' },
  smallTitle: {
    fontSize: 13,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  lotusRow: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  lotusWrap: {
    alignItems: 'center',
    marginHorizontal: 4,
  },
  lotusCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  lotusEmoji: {
    fontSize: 18,
  },
  lotusIndex: {
    fontSize: 10,
    marginTop: -4,
  },
  progressText: {
    fontSize: 12,
    marginRight: 12,
  },
  card: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 4,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    backgroundColor: 'white',
  },
  cardScroll: {
    flex: 1,
  },
  cardContent: {
    paddingBottom: 12,
  },
  questionNumber: {
    fontSize: 12,
    marginBottom: 6,
  },
  questionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  questionDescription: {
    fontSize: 13,
    marginBottom: 16,
  },
  optionsContainer: {
    flexDirection: 'column',
    marginTop: 4,
  },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 8,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 14,
    textAlign: 'left',
    flexShrink: 1,
  },
  datePickerMock: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  datePickerText: {
    fontSize: 14,
  },
  footer: {
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  footerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  footerBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  secondaryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  secondaryBtnText: {
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  navBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  navBtnText: {
    fontSize: 13,
  },
  navBtnPrimary: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
  },
  navBtnPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  resultCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  resultIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  resultText: {
    fontSize: 13,
    lineHeight: 19,
  },
  skinToneSwatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#FFFFFFAA',
  },
  waterGlassOuter: {
    width: 22,
    height: 30,
    borderRadius: 6,
    borderWidth: 1,
    marginRight: 10,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  waterGlassInner: {
    width: '100%',
  },
  dateOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateSheetScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 12,
  },
  dateSheet: {
    width: '86%',
    alignSelf: 'center',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  dateSheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  dateColumns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateColumn: {
    width: '30%',
    flex: 1,
    minHeight: 180,
  },
  dateItem: {
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 4,
  },
  dateItemText: {
    fontSize: 14,
  },
  dateButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  dateSecondaryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 4,
  },
  dateSecondaryText: {
    fontSize: 13,
  },
  datePrimaryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  datePrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

