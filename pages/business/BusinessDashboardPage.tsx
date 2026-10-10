import { Link } from 'react-router-dom';
import {
  Building2, Megaphone, FolderKanban, Wrench, Users, Gem,
  FileText, BarChart3, Plus, Briefcase, TrendingUp,
} from 'lucide-react';

const quickActions = [
  { icon: <FolderKanban size={18} />, title: 'Создать проект', desc: 'Реклама, маркетинг, дизайн, сайт', to: '/business/projects/new', color: 'linear-gradient(135deg, #2dd4bf, #14b8a6)' },
  { icon: <Megaphone size={18} />, title: 'Подобрать рекламу', desc: 'Размещения на площадках', to: '/business/advertising', color: 'linear-gradient(135deg, #f59e0b, #d97706)' },
  { icon: <Briefcase size={18} />, title: 'Создать вакансию', desc: 'Опубликовать вакансию', to: '/business/team/vacancies/new', color: 'linear-gradient(135deg, #19b5fe, #0798df)' },
];

const navCards = [
  { icon: <Building2 size={20} />, title: 'Организации', desc: 'Реквизиты и профили компаний', to: '/business/organizations', color: 'linear-gradient(135deg, #19b5fe, #0798df)' },
  { icon: <FolderKanban size={20} />, title: 'Проекты', desc: 'Активные и завершённые', to: '/business/projects', color: 'linear-gradient(135deg, #2dd4bf, #14b8a6)' },
  { icon: <Wrench size={20} />, title: 'Услуги', desc: 'Маркетинг, дизайн, разработка, AI', to: '/business/services', color: 'linear-gradient(135deg, #22d3ee, #06b6d4)' },
  { icon: <Users size={20} />, title: 'Команда', desc: 'Сотрудники и роли', to: '/business/team', color: 'linear-gradient(135deg, #f59e0b, #d97706)' },
  { icon: <Gem size={20} />, title: 'Партнёрство', desc: 'Алмазы и реферальные ссылки', to: '/business/partnership', color: 'linear-gradient(135deg, #38bdf8, #0ea5e9)' },
  { icon: <FileText size={20} />, title: 'Документы', desc: 'Договоры, счета, акты', to: '/business/documents', color: 'linear-gradient(135deg, #94a3b8, #64748b)' },
  { icon: <BarChart3 size={20} />, title: 'Аналитика', desc: 'Отчёты и метрики (скоро)', to: '/business/projects', color: 'linear-gradient(135deg, #6366f1, #4f46e5)', soon: true },
];

export function BusinessDashboardPage() {
  return (
    <div className="dashboard-page">
      <div className="dashboard-body">
        <div className="dashboard-header">
          <h1>Дашборд бизнеса</h1>
          <p>Управляйте проектами, командой и услугами</p>
        </div>

        <div className="quick-actions">
          {quickActions.map((a) => (
            <Link to={a.to} key={a.title} className="quick-action-card css-fade-up">
              <div className="quick-action-icon" style={{ background: a.color }}>{a.icon}</div>
              <div>
                <strong>{a.title}</strong>
                <span>{a.desc}</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="dashboard-grid">
          {navCards.map((card) => (
            <Link to={card.to} key={card.title} className={`dashboard-card css-fade-up${card.soon ? ' soon' : ''}`}>
              <div className="dashboard-card-icon" style={{ background: card.color }}>{card.icon}</div>
              <h3>{card.title}</h3>
              <p>{card.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
