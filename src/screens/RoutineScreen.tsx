import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

// -----------------------------------------------------------------------------
// Theme & constants (Figma-aligned pastel purple / pink)
// -----------------------------------------------------------------------------
const theme = {
  background: '#F8F4FF',
  headerBg: '#EFE8F6',
  cardBackground: '#FFFFFF',
  primaryPurple: '#4B3B70',
  secondaryPurple: '#887DA2',
  lightPurple: '#DDC9F3',
  progressFill: '#7A66B8',
  iconBg: '#F5E6FA',
  textPrimary: '#4B3B70',
  textSecondary: '#887DA2',
  shadowColor: 'rgba(0,0,0,0.08)',
  shadowColorStrong: 'rgba(0,0,0,0.12)',
};

const LOCALE = 'tr-TR';
const DEFAULT_MORNING_TIME = '08:00';
const DEFAULT_EVENING_TIME = '21:00';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------
export interface RoutineTask {
  id: number;
  title: string;
  completed: boolean;
  time?: string;
}

interface DayItem {
  date: Date;
  weekdayShort: string;
  dayNumber: number;
  isSelected: boolean;
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
/** Validates HH:mm (0-23, 0-59). Returns true if valid. */
function isValidTime(value: string): boolean {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return false;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

/** Builds 7 consecutive days starting from today. */
function getWeekDaysFromToday(selectedIndex: number): DayItem[] {
  const days: DayItem[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    days.push({
      date: d,
      weekdayShort: d.toLocaleDateString(LOCALE, { weekday: 'short' }),
      dayNumber: d.getDate(),
      isSelected: i === selectedIndex,
    });
  }
  return days;
}

// -----------------------------------------------------------------------------
// Task row: checkbox, title, time, remove
// -----------------------------------------------------------------------------
function RoutineTaskItem({
  task,
  onToggle,
  onRemove,
}: {
  task: RoutineTask;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const displayTime = task.time ?? '--:--';
  return (
    <View style={styles.taskRow}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onToggle}
        style={[
          styles.checkCircle,
          task.completed ? styles.checkCircleFilled : styles.checkCircleEmpty,
        ]}
      >
        {task.completed ? <Text style={styles.checkMark}>✓</Text> : null}
      </TouchableOpacity>
      <Text
        style={[
          styles.taskName,
          task.completed ? styles.taskNameCompleted : undefined,
        ]}
        numberOfLines={1}
      >
        {task.title}
      </Text>
      <Text style={styles.taskTime}>{displayTime}</Text>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onRemove}
        style={styles.removeButton}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.removeButtonText}>×</Text>
      </TouchableOpacity>
    </View>
  );
}

// -----------------------------------------------------------------------------
// Single routine card: header, progress, task list, add form
// -----------------------------------------------------------------------------
function RoutineCard({
  title,
  iconEmoji,
  tasks,
  completedCount,
  onToggleTask,
  onRemoveTask,
  newTaskTitle,
  newTaskTime,
  onNewTaskTitleChange,
  onNewTaskTimeChange,
  onAddTask,
  defaultTime,
}: {
  title: string;
  iconEmoji: string;
  tasks: RoutineTask[];
  completedCount: number;
  onToggleTask: (id: number) => void;
  onRemoveTask: (id: number) => void;
  newTaskTitle: string;
  newTaskTime: string;
  onNewTaskTitleChange: (v: string) => void;
  onNewTaskTimeChange: (v: string) => void;
  onAddTask: () => void;
  defaultTime: string;
}) {
  const total = tasks.length;
  const progressPercent = total === 0 ? 0 : Math.round((completedCount / total) * 100);
  const subtitle = `${completedCount}/${total} tamamlandı`;

  const handleAdd = useCallback(() => {
    const trimmed = newTaskTitle.trim();
    if (!trimmed) return;
    const timeToUse = isValidTime(newTaskTime) ? newTaskTime.trim() : defaultTime;
    onAddTask();
    // Reset is done by parent after adding; parent will clear inputs
  }, [newTaskTitle, newTaskTime, defaultTime, onAddTask]);

  return (
    <View style={styles.routineCard}>
      <View style={styles.routineCardHeader}>
        <View style={styles.routineIconContainer}>
          <Text style={styles.routineIcon}>{iconEmoji}</Text>
        </View>
        <View style={styles.routineCardTitleBlock}>
          <Text style={styles.routineCardTitle}>{title}</Text>
          <Text style={styles.routineCardSubtitle}>{subtitle}</Text>
        </View>
        <View style={styles.progressPill}>
          <Text style={styles.progressPillText}>{progressPercent}%</Text>
        </View>
      </View>

      <View style={styles.progressBarTrack}>
        <View
          style={[
            styles.progressBarFill,
            { flex: progressPercent / 100 },
          ]}
        />
        <View
          style={[
            styles.progressBarEmpty,
            { flex: (100 - progressPercent) / 100 },
          ]}
        />
      </View>

      {/* Add new task row */}
      <View style={styles.addTaskRow}>
        <TextInput
          style={styles.addTaskInput}
          placeholder="Yeni görev ekle..."
          placeholderTextColor={theme.textSecondary}
          value={newTaskTitle}
          onChangeText={onNewTaskTitleChange}
          maxLength={80}
        />
        <TextInput
          style={styles.addTaskTimeInput}
          placeholder={defaultTime}
          placeholderTextColor={theme.textSecondary}
          value={newTaskTime}
          onChangeText={onNewTaskTimeChange}
          maxLength={5}
          keyboardType="numbers-and-punctuation"
        />
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleAdd}
          style={styles.addTaskButton}
        >
          <Text style={styles.addTaskButtonText}>Ekle</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.taskList}>
        {tasks.map((task) => (
          <RoutineTaskItem
            key={task.id}
            task={task}
            onToggle={() => onToggleTask(task.id)}
            onRemove={() => onRemoveTask(task.id)}
          />
        ))}
      </View>
    </View>
  );
}

// -----------------------------------------------------------------------------
// Main screen
// -----------------------------------------------------------------------------
export default function RoutineScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const nextIdRef = useRef(11);

  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [morningTasks, setMorningTasks] = useState<RoutineTask[]>([
    { id: 1, title: 'Yüz Temizleyici', completed: true, time: '08:00' },
    { id: 2, title: 'Toner', completed: true, time: '08:05' },
    { id: 3, title: 'Serum', completed: true, time: '08:10' },
    { id: 4, title: 'Nemlendirici', completed: false, time: '08:15' },
    { id: 5, title: 'Güneş Kremi', completed: false, time: '08:20' },
  ]);
  const [eveningTasks, setEveningTasks] = useState<RoutineTask[]>([
    { id: 6, title: 'Makyaj Temizleyici', completed: false, time: '21:00' },
    { id: 7, title: 'Yüz Temizleyici', completed: false, time: '21:05' },
    { id: 8, title: 'Toner', completed: false, time: '21:10' },
    { id: 9, title: 'Serum', completed: false, time: '21:15' },
    { id: 10, title: 'Gece Kremi', completed: false, time: '21:20' },
  ]);

  const [newMorningTitle, setNewMorningTitle] = useState('');
  const [newMorningTime, setNewMorningTime] = useState('');
  const [newEveningTitle, setNewEveningTitle] = useState('');
  const [newEveningTime, setNewEveningTime] = useState('');

  const weekDays = useMemo(
    () => getWeekDaysFromToday(selectedDateIndex),
    [selectedDateIndex]
  );

  const morningCompleted = morningTasks.filter((t) => t.completed).length;
  const eveningCompleted = eveningTasks.filter((t) => t.completed).length;

  const addMorningTask = useCallback(() => {
    const title = newMorningTitle.trim();
    if (!title) return;
    const time = isValidTime(newMorningTime) ? newMorningTime.trim() : DEFAULT_MORNING_TIME;
    const id = nextIdRef.current++;
    setMorningTasks((prev) => [...prev, { id, title, completed: false, time }]);
    setNewMorningTitle('');
    setNewMorningTime('');
  }, [newMorningTitle, newMorningTime]);

  const addEveningTask = useCallback(() => {
    const title = newEveningTitle.trim();
    if (!title) return;
    const time = isValidTime(newEveningTime) ? newEveningTime.trim() : DEFAULT_EVENING_TIME;
    const id = nextIdRef.current++;
    setEveningTasks((prev) => [...prev, { id, title, completed: false, time }]);
    setNewEveningTitle('');
    setNewEveningTime('');
  }, [newEveningTitle, newEveningTime]);

  const toggleMorning = useCallback((id: number) => {
    setMorningTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }, []);

  const toggleEvening = useCallback((id: number) => {
    setEveningTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }, []);

  const removeMorning = useCallback((id: number) => {
    setMorningTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const removeEvening = useCallback((id: number) => {
    setEveningTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.calendarIcon}>📅</Text>
        <Text style={styles.headerTitle}>Günlük Rutin</Text>
      </View>

      {/* Dynamic 7-day date selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateSelectorContent}
        style={styles.dateSelectorScroll}
      >
        {weekDays.map((item, index) => (
          <TouchableOpacity
            key={`${item.date.getTime()}`}
            activeOpacity={0.8}
            onPress={() => setSelectedDateIndex(index)}
            style={[
              styles.dayCard,
              item.isSelected ? styles.dayCardSelected : undefined,
            ]}
          >
            <Text
              style={[
                styles.dayCardLabel,
                item.isSelected ? styles.dayCardLabelSelected : undefined,
              ]}
            >
              {item.weekdayShort}
            </Text>
            <Text
              style={[
                styles.dayCardNumber,
                item.isSelected ? styles.dayCardNumberSelected : undefined,
              ]}
            >
              {item.dayNumber}
            </Text>
            {item.isSelected ? <View style={styles.dayCardDot} /> : null}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <RoutineCard
          title="Sabah Rutini"
          iconEmoji="☀️"
          tasks={morningTasks}
          completedCount={morningCompleted}
          onToggleTask={toggleMorning}
          onRemoveTask={removeMorning}
          newTaskTitle={newMorningTitle}
          newTaskTime={newMorningTime}
          onNewTaskTitleChange={setNewMorningTitle}
          onNewTaskTimeChange={setNewMorningTime}
          onAddTask={addMorningTask}
          defaultTime={DEFAULT_MORNING_TIME}
        />

        <RoutineCard
          title="Akşam Rutini"
          iconEmoji="🌙"
          tasks={eveningTasks}
          completedCount={eveningCompleted}
          onToggleTask={toggleEvening}
          onRemoveTask={removeEvening}
          newTaskTitle={newEveningTitle}
          newTaskTime={newEveningTime}
          onNewTaskTitleChange={setNewEveningTitle}
          onNewTaskTimeChange={setNewEveningTime}
          onAddTask={addEveningTask}
          defaultTime={DEFAULT_EVENING_TIME}
        />

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Tab Bar (static) */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('HomeScreen')}
        >
          <Text style={styles.tabIcon}>🏠</Text>
          <Text style={styles.tabLabel}>Ana Sayfa</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7}>
          <Text style={styles.tabIcon}>📋</Text>
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>Rutin</Text>
          <View style={styles.tabActiveIndicator} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7}>
          <Text style={styles.tabIcon}>📷</Text>
          <Text style={styles.tabLabel}>Kamera</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('ChatScreen')}
        >
          <Text style={styles.tabIcon}>💬</Text>
          <Text style={styles.tabLabel}>Chat</Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.headerBg,
    paddingVertical: 20,
    paddingHorizontal: 20,
    paddingTop: 48,
  },
  calendarIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  dateSelectorScroll: {
    maxHeight: 88,
  },
  dateSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: theme.headerBg,
  },
  dayCard: {
    minWidth: 56,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginRight: 12,
    borderRadius: 14,
    backgroundColor: theme.lightPurple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCardSelected: {
    backgroundColor: theme.cardBackground,
    shadowColor: theme.shadowColorStrong,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
  dayCardLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.secondaryPurple,
    marginBottom: 2,
  },
  dayCardLabelSelected: {
    color: theme.textPrimary,
    fontWeight: '600',
  },
  dayCardNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.secondaryPurple,
  },
  dayCardNumberSelected: {
    color: theme.textPrimary,
    fontWeight: '700',
  },
  dayCardDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.textPrimary,
    marginTop: 6,
  },
  routineCard: {
    backgroundColor: theme.cardBackground,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 20,
    shadowColor: theme.shadowColorStrong,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  routineCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  routineIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  routineIcon: {
    fontSize: 22,
  },
  routineCardTitleBlock: {
    flex: 1,
  },
  routineCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 2,
  },
  routineCardSubtitle: {
    fontSize: 13,
    color: theme.secondaryPurple,
    fontWeight: '500',
  },
  progressPill: {
    backgroundColor: theme.headerBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  progressPillText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  progressBarTrack: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 18,
    backgroundColor: theme.lightPurple,
  },
  progressBarFill: {
    minWidth: 0,
    backgroundColor: theme.progressFill,
    borderRadius: 5,
  },
  progressBarEmpty: {
    minWidth: 0,
    backgroundColor: theme.lightPurple,
    borderRadius: 5,
  },
  addTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EBF5',
    paddingBottom: 12,
  },
  addTaskInput: {
    flex: 1,
    height: 44,
    backgroundColor: theme.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: theme.textPrimary,
    marginRight: 8,
  },
  addTaskTimeInput: {
    width: 64,
    height: 44,
    backgroundColor: theme.background,
    borderRadius: 12,
    paddingHorizontal: 8,
    fontSize: 14,
    color: theme.textPrimary,
    textAlign: 'center',
    marginRight: 8,
  },
  addTaskButton: {
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: theme.primaryPurple,
    borderRadius: 12,
  },
  addTaskButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  taskList: {
    flexDirection: 'column',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EBF5',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  checkCircleEmpty: {
    borderWidth: 2,
    borderColor: theme.secondaryPurple,
    backgroundColor: 'transparent',
  },
  checkCircleFilled: {
    backgroundColor: theme.primaryPurple,
    borderWidth: 0,
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  taskName: {
    flex: 1,
    fontSize: 15,
    color: theme.secondaryPurple,
    fontWeight: '500',
    minWidth: 0,
  },
  taskNameCompleted: {
    color: theme.textPrimary,
  },
  taskTime: {
    fontSize: 14,
    color: theme.secondaryPurple,
    fontWeight: '500',
    marginRight: 8,
    width: 44,
    textAlign: 'right',
  },
  removeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: theme.lightPurple,
  },
  removeButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.secondaryPurple,
    lineHeight: 22,
  },
  bottomSpacing: {
    height: 24,
  },
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
    color: theme.secondaryPurple,
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
