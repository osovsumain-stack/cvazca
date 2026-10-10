import { Link } from 'react-router-dom';
import { User, FileText, Briefcase, ClipboardList, ClipboardCheck, Gem, Sparkles } from 'lucide-react';
import { PartnersMarquee } from '@/components/PartnersMarquee';
import { DailyFortuneCookie } from '@/components/DailyFortuneCookie';
import { DailyActionCard } from '@/components/DailyActionCard';

export function CareerIndexPage() {
  const cards = [
    { icon: <Sparkles size={20} />, title: 'Карьерный маршрут', desc: 'Профиль за 3 шага', to: '/career/onboarding', color: 'linear-gradient(135deg, #19b5fe, #0798df)' },
    { icon: <User size={20} />, title: 'Профиль', desc: 'Ваш карьерный профиль', to: '/career/profile', color: 'linear-gradient(135deg, #2dd4bf, #14b8a6)' },
    { icon: <FileText size={20} />, title: 'Резюме', desc: 'Скачайте готовое резюме', to: '/career/resumes', color: 'linear-gradient(135deg, #a78bfa, #8b5cf6)' },
    { icon: <Briefcase size={20} />, title: 'Вакансии', desc: 'Стажировки и стартовые позиции', to: '/career/vacancies', color: 'linear-gradient(135deg, #22d3ee, #06b6d4)' },
    { icon: <ClipboardList size={20} />, title: 'Отклики', desc: 'История ваших откликов', to: '/career/applications', color: 'linear-gradient(135deg, #f59e0b, #d97706)' },
    { icon: <ClipboardCheck size={20} />, title: 'Тесты', desc: 'Определите интересы и рабочие предпочтения', to: '/career/tests', color: 'linear-gradient(135deg, #38bdf8, #0ea5e9)' },
    { icon: <Gem size={20} />, title: 'Партнёрство', desc: 'Изумруды и Алмазы', to: '/career/partnership', color: 'linear-gradient(135deg, #10b981, #059669)' },
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-body">
        <div className="dashboard-header">
          <h1>Карьера</h1>
          <p>Инструменты для вашего карьерного роста</p>
        </div>

        <div className="daily-widgets">
          <DailyFortuneCookie />
          <DailyActionCard />
        </div>

        <div className="dashboard-grid">
          {cards.map((card) => (
            <Link to={card.to} key={card.title} className="dashboard-card css-fade-up">
              <div className="dashboard-card-icon" style={{ background: card.color }}>{card.icon}</div>
              <h3>{card.title}</h3>
              <p>{card.desc}</p>
            </Link>
          ))}
        </div>
      </div>
      <PartnersMarquee filterTypes={['career', 'platform']} />
    </div>
  );
}
