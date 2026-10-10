import { useState, useEffect } from 'react';
import { ClipboardList, ArrowRight, ArrowLeft, RotateCcw, Trophy, Clock, CheckCircle2 } from 'lucide-react';
import { careerTestRepository } from '@/repositories/featureRepositories';
import { useAuth } from '@/services/authContext';
import type { CareerTest, CareerTestResult } from '@/types/platform';
import { Badge, Button, PageHeader, Card } from '@/components/ui';
import { EmptyState } from '@/components/EmptyState';

const DIMENSION_TO_RESULT: Record<string, Record<string, string>> = {
  career_interests: {
    analytical: 'Аналитик',
    creative: 'Креативщик',
    social: 'Коммуникатор',
    management: 'Организатор',
  },
  work_style: {
    independent: 'Самостоятельный',
    collaborative: 'Командный',
    structured: 'Структурированный',
    flexible: 'Гибкий',
  },
  career_priorities: {
    income: 'Доход-ориентированный',
    interest: 'Интерес-ориентированный',
    balance: 'Баланс-ориентированный',
    growth: 'Рост-ориентированный',
  },
};

const SCORING_VERSION = 'career-test-v1';

export function CareerTestsPage() {
  const { account } = useAuth();
  const [tests, setTests] = useState<CareerTest[]>([]);
  const [results, setResults] = useState<Record<string, CareerTestResult | null>>({});
  const [loading, setLoading] = useState(true);
  const [activeTest, setActiveTest] = useState<CareerTest | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<'questions' | 'review'>('questions');
  const [showResult, setShowResult] = useState<CareerTestResult | null>(null);
  const [retakeBlock, setRetakeBlock] = useState<{ testName: string; daysLeft: number } | null>(null);

  useEffect(() => {
    careerTestRepository.getAll().then(async (t) => {
      setTests(t);
      if (account) {
        const r: Record<string, CareerTestResult | null> = {};
        for (const test of t) {
          r[test.type] = await careerTestRepository.getResult(account.id, test.type);
        }
        setResults(r);
      }
      setLoading(false);
    });
  }, [account]);

  const computeResult = (test: CareerTest): { scores: Record<string, number>; profileName: string } => {
    const scores: Record<string, number> = {};
    for (const q of test.questions) {
      const ans = answers[q.id];
      if (!ans) continue;
      const opt = q.options.find((o) => o.id === ans);
      if (opt) {
        for (const [k, v] of Object.entries(opt.scores)) {
          scores[k] = (scores[k] || 0) + v;
        }
      }
    }
    const mapping = DIMENSION_TO_RESULT[test.type] ?? {};
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    for (const [key] of sorted) {
      if (mapping[key]) {
        return { scores, profileName: mapping[key] };
      }
    }
    const fallback = test.results[0];
    return { scores, profileName: fallback?.profile ?? '' };
  };

  const handleSubmit = async () => {
    if (!account || !activeTest) return;
    const { scores, profileName } = computeResult(activeTest);
    const result = await careerTestRepository.saveResult({
      accountId: account.id,
      testType: activeTest.type,
      scores,
      profileName,
      scoringVersion: SCORING_VERSION,
      answers,
    });
    setResults({ ...results, [activeTest.type]: result });
    setActiveTest(null);
    setAnswers({});
    setQuestionIndex(0);
    setPhase('questions');
    setShowResult(result);
  };

  const startTest = (test: CareerTest) => {
    setActiveTest(test);
    setAnswers({});
    setQuestionIndex(0);
    setPhase('questions');
  };

  if (loading) return <div className="dashboard-page"><div className="dashboard-body"><p style={{ color: 'var(--muted)' }}>Загрузка...</p></div></div>;

  if (activeTest) {
    const total = activeTest.questions.length;
    const current = activeTest.questions[questionIndex];
    const allAnswered = Object.keys(answers).length === total;
    const progress = (Object.keys(answers).length / total) * 100;

    return (
      <div className="dashboard-page">
        <div className="dashboard-body" style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700 }}>{activeTest.title}</h1>
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>
                {phase === 'questions' ? `Вопрос ${questionIndex + 1} из ${total}` : 'Проверка ответов'}
              </p>
            </div>
            <Button variant="ghost" onClick={() => { setActiveTest(null); setAnswers({}); setQuestionIndex(0); setPhase('questions'); }}>Выйти</Button>
          </div>
          <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, marginBottom: 24 }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'var(--blue)', borderRadius: 3, transition: 'width 0.3s' }} />
          </div>

          {phase === 'questions' && current && (
            <Card style={{ padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>{current.text}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {current.options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setAnswers({ ...answers, [current.id]: opt.id })}
                    style={{
                      textAlign: 'left', padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border)',
                      background: answers[current.id] === opt.id ? 'rgba(8,104,247,0.08)' : 'var(--surface)',
                      cursor: 'pointer', fontSize: 14, transition: 'all 0.15s',
                      borderColor: answers[current.id] === opt.id ? 'var(--blue)' : 'var(--border)',
                    }}
                  >
                    {opt.text}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, alignItems: 'center' }}>
                <Button variant="ghost" icon={<ArrowLeft size={16} />} onClick={() => setQuestionIndex(Math.max(0, questionIndex - 1))} disabled={questionIndex === 0}>
                  Назад
                </Button>
                {questionIndex < total - 1 ? (
                  <Button icon={<ArrowRight size={16} />} onClick={() => setQuestionIndex(questionIndex + 1)} disabled={!answers[current.id]}>
                    Далее
                  </Button>
                ) : (
                  <Button icon={<CheckCircle2 size={18} />} onClick={() => setPhase('review')} disabled={!answers[current.id]}>
                    Проверить ответы
                  </Button>
                )}
              </div>
            </Card>
          )}

          {phase === 'review' && (
            <Card style={{ padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Проверка ответов</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {activeTest.questions.map((q, i) => {
                  const ans = answers[q.id];
                  const opt = q.options.find((o) => o.id === ans);
                  return (
                    <div key={q.id} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)' }}>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Вопрос {i + 1}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{q.text}</div>
                      <div style={{ fontSize: 13, color: ans ? 'var(--blue)' : 'var(--muted)' }}>
                        {opt ? opt.text : '— не отвечено —'}
                      </div>
                      <button onClick={() => { setPhase('questions'); setQuestionIndex(i); }} style={{ fontSize: 12, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', marginTop: 6 }}>
                        Изменить ответ
                      </button>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
                <Button variant="ghost" icon={<ArrowLeft size={16} />} onClick={() => setPhase('questions')}>Назад</Button>
                <Button icon={<Trophy size={18} />} onClick={handleSubmit} disabled={!allAnswered}>
                  Завершить тест
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    );
  }

  const resultProfile = showResult
    ? tests.flatMap((t) => t.results).find((r) => r.profile === showResult.profileName) ?? null
    : null;

  return (
    <div className="dashboard-page">
      <div className="dashboard-body" style={{ maxWidth: 1000, margin: '0 auto' }}>
        <PageHeader title="Карьерные тесты" subtitle="Узнайте больше о своих рабочих предпочтениях" />

          {resultProfile && (
            <Card style={{ padding: 24, marginBottom: 20, border: '2px solid var(--blue)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <Trophy size={24} style={{ color: 'var(--blue)' }} />
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700 }}>Ваш профиль: {resultProfile.profile}</h3>
                  <p style={{ fontSize: 14, color: 'var(--muted)' }}>{resultProfile.description}</p>
                </div>
                <Button variant="ghost" icon={<ArrowRight size={16} />} onClick={() => setShowResult(null)} style={{ marginLeft: 'auto' }}>Закрыть</Button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--muted)' }}>Сильные стороны</h4>
                  {resultProfile.strengths.map((s, i) => <Badge key={i} color="green">{s}</Badge>)}
                </div>
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--muted)' }}>Среда</h4>
                  {resultProfile.environment.map((s, i) => <Badge key={i} color="blue">{s}</Badge>)}
                </div>
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--muted)' }}>Типы задач</h4>
                  {resultProfile.taskTypes.map((s, i) => <Badge key={i} color="violet">{s}</Badge>)}
                </div>
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--muted)' }}>Направления</h4>
                  {resultProfile.directions.map((s, i) => <Badge key={i} color="amber">{s}</Badge>)}
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--muted)' }}>Рекомендации</h4>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {resultProfile.recommendations.map((r, i) => (
                    <li key={i} style={{ fontSize: 13, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ArrowRight size={14} style={{ color: 'var(--blue)' }} /> {r}
                    </li>
                  ))}
                </ul>
              </div>
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 12, lineHeight: 1.5 }}>
                Это тест предпочтений, а не подтверждение профессиональной квалификации. Версия оценок: {SCORING_VERSION}.
              </p>
            </Card>
          )}

          {retakeBlock && (
            <div style={{ marginBottom: 20, padding: 16, borderRadius: 12, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <Clock size={20} style={{ color: '#d97706' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Тест «{retakeBlock.testName}» уже пройден</div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>Пересдать можно через {retakeBlock.daysLeft} дн. — результаты теста обновляются раз в 30 дней.</div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setRetakeBlock(null)} style={{ marginLeft: 'auto' }}>Закрыть</Button>
            </div>
          )}

          {tests.length === 0 ? (
            <EmptyState icon={<ClipboardList size={32} />} title="Тесты скоро будут доступны" description="Мы готовим тесты для вас" />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {tests.map((test) => {
                const result = results[test.type];
                return (
                  <Card key={test.id} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <Badge color={result ? 'green' : 'blue'}>{result ? 'Пройден' : 'Доступен'}</Badge>
                    <h3 style={{ fontSize: 16, fontWeight: 700 }}>{test.title}</h3>
                    <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, flex: 1 }}>{test.description}</p>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{test.questions.length} вопросов</div>
                    {result ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button size="sm" variant="ghost" icon={<RotateCcw size={16} />} onClick={async () => {
                          const { allowed, daysLeft } = await careerTestRepository.canRetake(account!.id, test.type);
                          if (!allowed) {
                            setRetakeBlock({ testName: test.title, daysLeft });
                          } else {
                            startTest(test);
                          }
                        }}>Пройти заново</Button>
                        <Button size="sm" variant="outline" onClick={() => {
                          setShowResult(result);
                        }}>Результат</Button>
                      </div>
                    ) : (
                      <Button size="sm" icon={<ArrowRight size={16} />} onClick={() => startTest(test)}>Начать тест</Button>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
      </div>
    </div>
  );
}
