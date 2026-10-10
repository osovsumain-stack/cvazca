import { Link } from 'react-router-dom';
import { ArrowRight, Megaphone, Briefcase, Sparkles, Users, Shield, Wrench, Building2, FileText, ClipboardCheck, Heart, Gem } from 'lucide-react';
import { PartnersMarquee } from '@/components/PartnersMarquee';
import { HomeVacanciesTeaser } from '@/components/HomeVacanciesTeaser';

const directions = [
  { icon: <Megaphone size={24} />, title: 'Реклама', desc: 'Билборды, digital, транспорт, СМИ', to: '/advertising', color: 'linear-gradient(135deg, #19b5fe, #0798df)' },
  { icon: <Wrench size={24} />, title: 'Услуги', desc: 'Маркетинг, дизайн, сайты, AI', to: '/services', color: 'linear-gradient(135deg, #a78bfa, #8b5cf6)' },
  { icon: <Users size={24} />, title: 'Команда', desc: 'Найм сотрудников и HR', to: '/business', color: 'linear-gradient(135deg, #2dd4bf, #14b8a6)' },
  { icon: <Briefcase size={24} />, title: 'Карьера', desc: 'Резюме, вакансии, стажировки', to: '/career', color: 'linear-gradient(135deg, #22d3ee, #06b6d4)' },
];

const steps = [
  { num: '01', title: 'Войдите через VK ID', desc: 'Один аккаунт для бизнеса и карьеры' },
  { num: '02', title: 'Выберите направление', desc: 'Бизнес или карьера — или оба сразу' },
  { num: '03', title: 'Заполните профиль', desc: 'Онбординг за 10–15 минут' },
  { num: '04', title: 'Действуйте', desc: 'Заказывайте, откликайтесь, приглашайте' },
];

const businessItems = [
  { icon: <Megaphone size={20} />, title: 'Реклама', desc: 'Каталог площадок' },
  { icon: <Wrench size={20} />, title: 'Услуги', desc: 'Маркетинг и дизайн' },
  { icon: <Briefcase size={20} />, title: 'Проекты', desc: 'Управление проектами' },
  { icon: <Users size={20} />, title: 'Команда', desc: 'Сотрудники и роли' },
  { icon: <Building2 size={20} />, title: 'Вакансии', desc: 'Найм персонала' },
];

const careerItems = [
  { icon: <Sparkles size={20} />, title: 'Карьерный профиль', desc: 'Онбординг и маршрут' },
  { icon: <FileText size={20} />, title: 'Резюме', desc: 'Создание и управление' },
  { icon: <Briefcase size={20} />, title: 'Вакансии', desc: 'Поиск и отклик' },
  { icon: <ClipboardCheck size={20} />, title: 'Тесты', desc: 'Оценка навыков' },
  { icon: <Heart size={20} />, title: 'Отклики', desc: 'История и статус' },
];

export function HomePage() {
  return (
    <div className="platform-page">
      <div className="bg-blobs" />
      <div className="platform-content">
        <section className="platform-hero">
          <div className="platform-hero-inner">
            <div className="platform-hero-eyebrow css-fade-up">
              <Sparkles size={14} /> ПЛАТФОРМА СВЯЗКА
            </div>
            <h1 className="css-fade-up" style={{ animationDelay: '0.1s' }}>
              Бизнес. Реклама. Команда.<br />Карьера. <em>В одном месте.</em>
            </h1>
            <p className="css-fade-up" style={{ animationDelay: '0.2s' }}>
              СВЯЗКА объединяет инструменты для бизнеса и карьерного роста. Реклама, маркетинг, дизайн, найм — для компаний. Резюме, вакансии, тесты — для специалистов.
            </p>
            <div className="platform-hero-ctas css-fade-up" style={{ animationDelay: '0.3s' }}>
              <Link to="/business/login" className="platform-nav-btn primary">
                Для бизнеса <ArrowRight size={16} />
              </Link>
              <Link to="/career/login" className="platform-nav-btn ghost">
                Для карьеры <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        <PartnersMarquee />

        <HomeVacanciesTeaser />

        <section className="platform-section">
          <div className="platform-section-header">
            <h2>Что можно решить</h2>
            <p>Четыре направления — одна платформа</p>
          </div>
          <div className="directions-grid">
            {directions.map((d) => (
              <Link to={d.to} key={d.title} className="direction-card css-fade-up">
                <div className="direction-card-icon" style={{ background: d.color }}>{d.icon}</div>
                <h3>{d.title}</h3>
                <p>{d.desc}</p>
                <ArrowRight size={16} className="direction-card-arrow" />
              </Link>
            ))}
          </div>
        </section>

        <section className="platform-section">
          <div className="platform-section-header">
            <h2>Два направления — одна платформа</h2>
            <p>Выберите свой путь</p>
          </div>
          <div className="platform-dual">
            <div className="platform-path platform-path-business">
              <div className="platform-path-header">
                <div className="platform-path-icon business"><Building2 size={24} /></div>
                <div>
                  <h2>Для бизнеса</h2>
                  <span>Инструменты для продвижения, проектов и найма</span>
                </div>
              </div>
              <div className="platform-path-items">
                {businessItems.map((item) => (
                  <Link to="/business" key={item.title} className="platform-path-item">
                    <span className="platform-path-item-icon">{item.icon}</span>
                    <span className="platform-path-item-text">
                      <strong>{item.title}</strong>
                      <span>{item.desc}</span>
                    </span>
                    <ArrowRight size={16} className="platform-path-item-arrow" />
                  </Link>
                ))}
              </div>
              <Link to="/business" className="platform-nav-btn primary" style={{ marginTop: 20, width: 'fit-content' }}>
                Открыть бизнес <ArrowRight size={16} />
              </Link>
            </div>

            <div className="platform-path platform-path-career">
              <div className="platform-path-header">
                <div className="platform-path-icon career"><Sparkles size={24} /></div>
                <div>
                  <h2>Для карьеры</h2>
                  <span>Профиль, поиск работы и развитие карьеры</span>
                </div>
              </div>
              <div className="platform-path-items">
                {careerItems.map((item) => (
                  <Link to="/career" key={item.title} className="platform-path-item">
                    <span className="platform-path-item-icon">{item.icon}</span>
                    <span className="platform-path-item-text">
                      <strong>{item.title}</strong>
                      <span>{item.desc}</span>
                    </span>
                    <ArrowRight size={16} className="platform-path-item-arrow" />
                  </Link>
                ))}
              </div>
              <Link to="/career" className="platform-nav-btn primary" style={{ marginTop: 20, width: 'fit-content', background: 'linear-gradient(135deg, var(--teal), var(--cyan))' }}>
                Открыть карьеру <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        <section className="platform-section">
          <div className="platform-section-header">
            <h2>Как работает СВЯЗКА</h2>
          </div>
          <div className="steps-grid">
            {steps.map((s) => (
              <div className="step-card css-fade-up" key={s.num}>
                <span className="step-num">{s.num}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="platform-cta-section">
          <div className="platform-cta-inner css-fade-up">
            <Shield size={28} style={{ color: 'var(--blue)', marginBottom: 12 }} />
            <h2>Начните прямо сейчас</h2>
            <p>Бесплатно для карьеры. Для бизнеса — после регистрации организации.</p>
            <Link to="/auth" className="platform-nav-btn primary">
              Войти через VK ID <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        <footer className="platform-footer">
          <p>СВЯЗКА — Бизнес. Реклама. Команда. Карьера.</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8, flexWrap: 'wrap' }}>
            <Link to="/legal/privacy" style={{ fontSize: 12, color: 'var(--muted)' }}>Политика конфиденциальности</Link>
            <Link to="/legal/terms" style={{ fontSize: 12, color: 'var(--muted)' }}>Пользовательское соглашение</Link>
            <Link to="/legal" style={{ fontSize: 12, color: 'var(--muted)' }}>Правовая база</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
