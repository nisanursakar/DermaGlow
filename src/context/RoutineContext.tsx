import React, { createContext, useContext, useState, ReactNode, useRef } from 'react';

// Görev Tipi
export interface RoutineTask {
  id: number;
  title: string;
  completed: boolean;
  time?: string;
}

// Context Tipi
interface RoutineContextType {
  morningTasks: RoutineTask[];
  eveningTasks: RoutineTask[];
  addMorningTask: (title: string, time: string) => void;
  addEveningTask: (title: string, time: string) => void;
  toggleMorning: (id: number) => void;
  toggleEvening: (id: number) => void;
  removeMorning: (id: number) => void;
  removeEvening: (id: number) => void;
  getRoutineSummary: () => string;
}

// Context'i Oluştur
const RoutineContext = createContext<RoutineContextType | undefined>(undefined);

// Provider (Veri Sağlayıcı) - App.tsx'in aradığı parça BU!
export function RoutineProvider({ children }: { children: ReactNode }) {
  const nextIdRef = useRef(11);

  // Sabah Rutini Verileri
  const [morningTasks, setMorningTasks] = useState<RoutineTask[]>([
    { id: 1, title: 'Yüz Temizleyici', completed: true, time: '08:00' },
    { id: 2, title: 'Toner', completed: true, time: '08:05' },
    { id: 3, title: 'Serum', completed: true, time: '08:10' },
    { id: 4, title: 'Nemlendirici', completed: false, time: '08:15' },
    { id: 5, title: 'Güneş Kremi', completed: false, time: '08:20' },
  ]);

  // Akşam Rutini Verileri
  const [eveningTasks, setEveningTasks] = useState<RoutineTask[]>([
    { id: 6, title: 'Makyaj Temizleyici', completed: false, time: '21:00' },
    { id: 7, title: 'Yüz Temizleyici', completed: false, time: '21:05' },
    { id: 8, title: 'Toner', completed: false, time: '21:10' },
    { id: 9, title: 'Serum', completed: false, time: '21:15' },
    { id: 10, title: 'Gece Kremi', completed: false, time: '21:20' },
  ]);

  // --- Fonksiyonlar ---

  const addMorningTask = (title: string, time: string) => {
    const id = nextIdRef.current++;
    setMorningTasks((prev) => [...prev, { id, title, completed: false, time }]);
  };

  const addEveningTask = (title: string, time: string) => {
    const id = nextIdRef.current++;
    setEveningTasks((prev) => [...prev, { id, title, completed: false, time }]);
  };

  const toggleMorning = (id: number) => {
    setMorningTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const toggleEvening = (id: number) => {
    setEveningTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const removeMorning = (id: number) => {
    setMorningTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const removeEvening = (id: number) => {
    setEveningTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // Yapay Zeka için Özet Çıkarma Fonksiyonu
  const getRoutineSummary = () => {
    const mTasks = morningTasks.map(t => `- ${t.title} (${t.time}): ${t.completed ? 'Yapıldı' : 'Yapılmadı'}`).join('\n');
    const eTasks = eveningTasks.map(t => `- ${t.title} (${t.time}): ${t.completed ? 'Yapıldı' : 'Yapılmadı'}`).join('\n');
    return `KULLANICI RUTİNİ:\nSABAH:\n${mTasks}\n\nAKŞAM:\n${eTasks}`;
  };

  return (
    <RoutineContext.Provider value={{
      morningTasks, eveningTasks,
      addMorningTask, addEveningTask,
      toggleMorning, toggleEvening,
      removeMorning, removeEvening,
      getRoutineSummary
    }}>
      {children}
    </RoutineContext.Provider>
  );
}

// Hook
export function useRoutine() {
  const context = useContext(RoutineContext);
  if (!context) throw new Error('useRoutine must be used within a RoutineProvider');
  return context;
}