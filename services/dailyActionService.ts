import { sessionRepository } from '@/repositories/sessionRepository';
import type { PlatformAccount } from '@/types/platform';

export interface DailyAction {
  id: string;
  title: string;
  description: string;
  actionType: 'update_profile' | 'create_resume' | 'apply_vacancy' | 'add_skill' | 'complete_test' | 'check_vacancies';
  route: string;
  ctaLabel: string;
}

const STORAGE_KEY = 'svyazka_daily_action';

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

export function getDailyAction(): DailyAction {
  const actions: DailyAction[] = [
    { id: 'a1', title: 'Обновите профиль', description: 'Заполните город и карьерную цель — это повысит видимость резюме', actionType: 'update_profile', route: '/career/profile', ctaLabel: 'Перейти к профилю' },
    { id: 'a2', title: 'Создайте резюме', description: 'Первое резюме откроет доступ к откликам на вакансии', actionType: 'create_resume', route: '/career/resumes', ctaLabel: 'Создать резюме' },
    { id: 'a3', title: 'Откликнитесь на вакансию', description: 'Один отклик в день приближает вас к работе мечты', actionType: 'apply_vacancy', route: '/career/vacancies', ctaLabel: 'Смотреть вакансии' },
    { id: 'a4', title: 'Добавьте навык', description: 'Навыки в профиле помогают алгоритму подбирать подходящие вакансии', actionType: 'add_skill', route: '/career/profile', ctaLabel: 'Добавить навык' },
    { id: 'a5', title: 'Пройдите тест', description: 'Тесты помогают определить интересы и рабочие предпочтения', actionType: 'complete_test', route: '/career/tests', ctaLabel: 'Пройти тест' },
    { id: 'a6', title: 'Изучите новые вакансии', description: 'Свежие вакансии появляются каждый день — не упустите свою', actionType: 'check_vacancies', route: '/career/vacancies', ctaLabel: 'Открыть вакансии' },
  ];
  const today = getTodayKey();
  const seed = today.split('-').reduce((a, b) => parseInt(b) + a, 0);
  return actions[seed % actions.length];
}

export interface StreakState {
  currentDate: string;
  streak: number;
  completedDates: string[];
}

export function getStreak(): StreakState {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${sessionRepository.load()?.accountId||'guest'}`);
    if (raw) {
      const state: StreakState = JSON.parse(raw);
      return state;
    }
  } catch { /* ignore */ }
  return { currentDate: getTodayKey(), streak: 0, completedDates: [] };
}

export function markDailyActionComplete(): StreakState {
  const today = getTodayKey();
  const current = getStreak();
  if (current.completedDates.includes(today)) return current;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yKey = yesterday.toISOString().split('T')[0];

  const newStreak = current.completedDates.includes(yKey) ? current.streak + 1 : 1;
  const newState: StreakState = {
    currentDate: today,
    streak: newStreak,
    completedDates: [...current.completedDates, today].slice(-30),
  };
  try {
    localStorage.setItem(`${STORAGE_KEY}_${sessionRepository.load()?.accountId||'guest'}`, JSON.stringify(newState));
  } catch { /* ignore */ }
  return newState;
}

export function isActionCompletedToday(): boolean {
  const state = getStreak();
  return state.completedDates.includes(getTodayKey());
}
