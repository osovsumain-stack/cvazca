import { Link } from 'react-router-dom';
import { Building2, Megaphone, FolderKanban, Wrench, Users, Gem, Briefcase } from 'lucide-react';
import { PartnersMarquee } from '@/components/PartnersMarquee';

export function BusinessIndexPage() {
  const cards = [
    { icon: <Briefcase size={20} />, title: 'Дашборд', desc: 'Обзор всех инструментов', to: '/business/dashboard', color: 'linear-gradient(135deg, #19b5fe, #0798df)' },
    { icon: <Building2 size={20} />, title: 'Организации', desc: 'Реквизиты и профили', to: '/business/organizations', color: 'linear-gradient(135deg, #a78bfa, #8b5cf6)' },
    { icon: <Megaphone size={20} />, title: 'Реклама', desc: 'Рекламные размещения', to: '/business/advertising', color: 'linear-gradient(135deg, #2dd4bf, #14b8a6)' },
    { icon: <FolderKanban size={20} />, title: 'Проекты', desc: 'Активные проекты', to: '/business/projects', color: 'linear-gradient(135deg, #22d3ee, #06b6d4)' },
    { icon: <Wrench size={20} />, title: 'Услуги', desc: 'Маркетинг, дизайн, AI', to: '/business/services', color: 'linear-gradient(135deg, #f59e0b, #d97706)' },
    { icon: <Users size={20} />, title: 'Команда', desc: 'Сотрудники и роли', to: '/business/team', color: 'linear-gradient(135deg, #38bdf8, #0ea5e9)' },
    { icon: <Gem size={20} />, title: 'Партнёрство', desc: 'Алмазы за рефералы', to: '/business/partnership', color: 'linear-gradient(135deg, #6366f1, #4f46e5)' },
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-body">
        <div className="dashboard-header">
          <h1>Бизнес</h1>
          <p>Инструменты для роста вашего бизнеса</p>
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
      <PartnersMarquee filterTypes={['advertising', 'platform', 'media']} />
    </div>
  );
}
