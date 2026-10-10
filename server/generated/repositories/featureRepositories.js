import { repositoryAdapter } from './transport.js';
import { INITIAL_ADVERTISING_PLACEMENTS } from '../data/advertisingPlacements.js';
function loadStore(key) {
    try {
        const raw = sessionStorage.getItem(key);
        return raw ? JSON.parse(raw) : [];
    }
    catch {
        return [];
    }
}
function saveStore(key, data) {
    try {
        sessionStorage.setItem(key, JSON.stringify(data));
    }
    catch { /* ignore */ }
}
// ─── Partner ───
class MockPartnerRepository {
    get store() { return loadStore('partners'); }
    set store(v) { saveStore('partners', v); }
    async getAll() {
        return [...this.store].sort((a, b) => a.sortOrder - b.sortOrder);
    }
    async getActive() {
        return (await this.getAll()).filter((p) => p.isActive);
    }
    async create(partner) {
        const full = { ...partner, id: crypto.randomUUID() };
        const all = this.store;
        all.push(full);
        this.store = all;
        return full;
    }
    async update(partner) {
        const all = this.store;
        const idx = all.findIndex((p) => p.id === partner.id);
        if (idx >= 0)
            all[idx] = partner;
        this.store = all;
    }
    async remove(id) {
        this.store = this.store.filter((p) => p.id !== id);
    }
}
// ─── Organization Invitation ───
class MockOrganizationInvitationRepository {
    get store() { return loadStore('org_invitations'); }
    set store(v) { saveStore('org_invitations', v); }
    async getByOrganization(orgId) {
        return this.store.filter((i) => i.organizationId === orgId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    async getByAccount(accountId) {
        return this.store.filter((i) => i.invitedBy === accountId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    async create(invitation) {
        const now = new Date().toISOString();
        const full = {
            ...invitation,
            id: crypto.randomUUID(),
            inviteToken: crypto.randomUUID(),
            createdAt: now,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        };
        const all = this.store;
        all.push(full);
        this.store = all;
        return full;
    }
    async updateStatus(id, status) {
        const all = this.store;
        const idx = all.findIndex((i) => i.id === id);
        if (idx >= 0)
            all[idx] = { ...all[idx], status };
        this.store = all;
    }
    async getByToken(token) {
        return this.store.find((i) => i.inviteToken === token && i.status === 'pending' && Date.parse(i.expiresAt) > Date.now()) ?? null;
    }
}
// ─── Document ───
class MockDocumentRepository {
    get store() { return loadStore('documents'); }
    set store(v) { saveStore('documents', v); }
    async getByOrganization(orgId) {
        return this.store.filter((d) => d.organizationId === orgId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    async getByProject(projectId) {
        return this.store.filter((d) => d.projectId === projectId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    async getById(id) {
        return this.store.find((d) => d.id === id) ?? null;
    }
    async create(doc) {
        const now = new Date().toISOString();
        const full = { ...doc, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
        const all = this.store;
        all.push(full);
        this.store = all;
        return full;
    }
    async update(doc) {
        const all = this.store;
        const idx = all.findIndex((d) => d.id === doc.id);
        if (idx >= 0)
            all[idx] = { ...doc, updatedAt: new Date().toISOString() };
        this.store = all;
    }
    async remove(id) {
        this.store = this.store.filter((d) => d.id !== id);
    }
}
// ─── Advertising ───
class MockAdvertisingRepository {
    placements = [...INITIAL_ADVERTISING_PLACEMENTS];
    async getAll() { return [...this.placements]; }
    async getById(id) {
        return this.placements.find((p) => p.id === id) ?? null;
    }
    async getByCategory(category) {
        return this.placements.filter((p) => p.category === category);
    }
}
// ─── Service Offering ───
class MockServiceOfferingRepository {
    services = [
        { id: 'svc-1', name: 'Таргетированная реклама ВКонтакте', category: 'targeted_ads', shortDescription: 'Настройка и ведение таргетированной рекламы в ВК.', format: 'Удалённо', estimatedCost: 'от 25 000 ₽', estimatedDuration: 'от 2 недель', result: 'Настроенные кампании, отчёт по результатам', description: 'Полное ведение таргетированной рекламы ВКонтакте: от настройки кабинета до ежедневной оптимизации и отчётности.', whatIsIncluded: ['Настройка рекламного кабинета', 'Создание креативов (до 5 вариантов)', 'Ежедневная оптимизация', 'Еженедельный отчёт', 'A/B тестирование аудиторий'], forWhom: ['Малый и средний бизнес', 'Стартапы', 'Интернет-магазины'], stages: [{ title: 'Анализ', description: 'Изучение продукта, аудитории, конкурентов' }, { title: 'Настройка', description: 'Создание кампаний, аудиторий, креативов' }, { title: 'Ведение', description: 'Ежедневная оптимизация, масштабирование' }, { title: 'Отчётность', description: 'Подробные отчёты по результатам и ROI' }], whatYouGet: ['Настроенные кампании', 'Креативы', 'Отчёты', 'Рекомендации'], faq: [{ question: 'Какой бюджет нужен?', answer: 'Рекомендуем от 10 000 ₽/день на рекламный бюджет.' }, { question: 'Когда будут результаты?', answer: 'Первые результаты видны через 3-5 дней после запуска.' }], sortOrder: 1 },
        { id: 'svc-2', name: 'Контекстная реклама (Яндекс.Директ)', category: 'context_ads', shortDescription: 'Настройка и ведение контекстной рекламы в Яндекс.', format: 'Удалённо', estimatedCost: 'от 30 000 ₽', estimatedDuration: 'от 2 недель', result: 'Настроенные кампании, рост целевого трафика', description: 'Полное ведение контекстной рекламы: поиск, РСЯ, ретаргетинг. Семантика, объявление, аналитика.', whatIsIncluded: ['Сбор семантики', 'Создание объявлений', 'Настройка целей и аналитики', 'Оптимизация ставок', 'Отчёты'], forWhom: ['Интернет-магазины', 'Сервисы', 'B2B компании'], stages: [{ title: 'Семантика', description: 'Сбор ключевых слов, минус-слов' }, { title: 'Настройка', description: 'Создание кампаний, объявлений' }, { title: 'Запуск', description: 'Запуск, проверка, корректировки' }, { title: 'Ведение', description: 'Оптимизация, отчёты' }], whatYouGet: ['Настроенные кампании', 'Семантическое ядро', 'Отчёты'], faq: [{ question: 'Подходит ли для нового сайта?', answer: 'Да, но рекомендуем начать с поиска по бренду.' }], sortOrder: 2 },
        { id: 'svc-3', name: 'Логотип и фирменный стиль', category: 'design', shortDescription: 'Разработка логотипа и базового брендбука.', format: 'Удалённо', estimatedCost: 'от 35 000 ₽', estimatedDuration: 'от 1 недели', result: 'Логотип + брендбук + готовые файлы', description: 'Создание логотипа, выбор цветовой палитры, шрифтов и базовых элементов фирменного стиля.', whatIsIncluded: ['3 варианта логотипа', 'Брендбук (10+ страниц)', 'Файлы во всех форматах', 'Мокапы'], forWhom: ['Новые компании', 'Ребрендинг', 'Стартапы'], stages: [{ title: 'Бриф', description: 'Изучение бренда, аудитории' }, { title: 'Концепции', description: '3 варианта логотипа' }, { title: 'Доработка', description: 'Финализация выбранного варианта' }, { title: 'Брендбук', description: 'Сборка брендбука' }], whatYouGet: ['Логотип', 'Брендбук', 'Файлы', 'Мокапы'], faq: [{ question: 'Сколько правок?', answer: 'До 3 раундов правок включено.' }], sortOrder: 3 },
        { id: 'svc-4', name: 'Сайт-визитка на React', category: 'websites', shortDescription: 'Разработка современного одностраничного сайта.', format: 'Удалённо', estimatedCost: 'от 80 000 ₽', estimatedDuration: 'от 2 недель', result: 'Готовый сайт, выложенный на хостинг', description: 'Разработка быстрого современного сайта-визитки на React/Vite с адаптивным дизайном.', whatIsIncluded: ['Дизайн (до 5 экранов)', 'Вёрстка на React', 'Адаптивность', 'SEO-оптимизация', 'Деплой'], forWhom: ['Малый бизнес', 'Фрилансеры', 'Стартапы'], stages: [{ title: 'Прототип', description: 'Структура и UX' }, { title: 'Дизайн', description: 'Визуальное оформление' }, { title: 'Разработка', description: 'Вёрстка и программирование' }, { title: 'Запуск', description: 'Тестирование и деплой' }], whatYouGet: ['Готовый сайт', 'Исходный код', 'Инструкция по управлению'], faq: [{ question: 'Можно ли расширить?', answer: 'Да, сайт можно расширять дополнительными страницами.' }], sortOrder: 4 },
        { id: 'svc-5', name: 'SEO-оптимизация сайта', category: 'seo', shortDescription: 'Технический и контентный SEO-аудит и оптимизация.', format: 'Удалённо', estimatedCost: 'от 40 000 ₽', estimatedDuration: 'от 1 месяца', result: 'Рост позиций, отчёт по работам', description: 'Комплексный SEO: технический аудит, семантика, контент-план, линкбилдинг.', whatIsIncluded: ['Технический аудит', 'Семантика (до 500 ключей)', 'Контент-план', 'Оптимизация страниц', 'Отчёты'], forWhom: ['Интернет-магазины', 'Сервисы', 'Блоги'], stages: [{ title: 'Аудит', description: 'Технический анализ' }, { title: 'Семантика', description: 'Сбор ключевых слов' }, { title: 'Оптимизация', description: 'On-page работы' }, { title: 'Линкбилдинг', description: 'Off-page работы' }], whatYouGet: ['Аудит-отчёт', 'Семантику', 'Контент-план', 'Рекомендации'], faq: [{ question: 'Когда будет эффект?', answer: 'Первые результаты через 2-3 месяца.' }], sortOrder: 5 },
        { id: 'svc-6', name: 'AI-агент для поддержки клиентов', category: 'ai_agents', shortDescription: 'Внедрение AI-агента для автоматизации поддержки.', format: 'Удалённо', estimatedCost: 'от 60 000 ₽', estimatedDuration: 'от 2 недель', result: 'Работающий AI-агент, интеграция', description: 'Разработка и внедрение AI-агента на базе LLM для автоматизации ответов на вопросы клиентов.', whatIsIncluded: ['Проектирование сценариев', 'Настройка LLM', 'Интеграция с CRM/мессенджерами', 'Тестирование', 'Обучение команды'], forWhom: ['Интернет-магазины', 'Сервисы', 'Поддержка 24/7'], stages: [{ title: 'Анализ', description: 'Изучение процессов поддержки' }, { title: 'Настройка', description: 'Создание агента, промптов' }, { title: 'Интеграция', description: 'Подключение к каналам' }, { title: 'Запуск', description: 'Тестирование, доработка' }], whatYouGet: ['AI-агента', 'Интеграцию', 'Документацию'], faq: [{ question: 'Какие модели используются?', answer: 'GPT-4, Claude, или open-source модели — по выбору.' }], sortOrder: 6 },
        { id: 'svc-7', name: 'HR-бренд и карьерный портал', category: 'hr_brand', shortDescription: 'Разработка HR-бренда и карьерного сайта.', format: 'Удалённо', estimatedCost: 'от 120 000 ₽', estimatedDuration: 'от 3 недель', result: 'HR-брендбук + карьерный сайт', description: 'Создание привлекательного HR-бренда для привлечения талантов: от ценностей до карьерного сайта.', whatIsIncluded: ['HR-стратегия', 'Визуальный стиль', 'Карьерный сайт', 'Контент-план', 'Гайдлайны'], forWhom: ['Растущие компании', 'Компании с массовым наймом'], stages: [{ title: 'Исследование', description: 'Аудит текущего HR-бренда' }, { title: 'Стратегия', description: 'Позиционирование, ценности' }, { title: 'Дизайн', description: 'Визуальный стиль' }, { title: 'Сайт', description: 'Карьерный портал' }], whatYouGet: ['HR-брендбук', 'Карьерный сайт', 'Контент-план'], faq: [{ question: 'Подходит ли для небольшой компании?', answer: 'Да, масштабируем под ваш размер.' }], sortOrder: 7 },
    ];
    async getAll() { return [...this.services].sort((a, b) => a.sortOrder - b.sortOrder); }
    async getById(id) {
        return this.services.find((s) => s.id === id) ?? null;
    }
    async getByCategory(category) {
        return this.services.filter((s) => s.category === category);
    }
}
// ─── Favorite Vacancy ───
class MockFavoriteVacancyRepository {
    get store() { return loadStore('favorite_vacancies'); }
    set store(v) { saveStore('favorite_vacancies', v); }
    async getByAccount(accountId) {
        return this.store.filter((f) => f.accountId === accountId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    async toggle(accountId, vacancyId) {
        const all = this.store;
        const existing = all.find((f) => f.accountId === accountId && f.vacancyId === vacancyId);
        if (existing) {
            this.store = all.filter((f) => f.id !== existing.id);
            return false;
        }
        all.push({ id: crypto.randomUUID(), accountId, vacancyId, createdAt: new Date().toISOString() });
        this.store = all;
        return true;
    }
    async isFavorite(accountId, vacancyId) {
        return this.store.some((f) => f.accountId === accountId && f.vacancyId === vacancyId);
    }
    async remove(accountId, vacancyId) {
        this.store = this.store.filter((f) => !(f.accountId === accountId && f.vacancyId === vacancyId));
    }
}
// ─── Notification ───
class MockNotificationRepository {
    get store() { return loadStore('notifications'); }
    set store(v) { saveStore('notifications', v); }
    async getByAccount(accountId) {
        return this.store.filter((n) => n.accountId === accountId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    async getUnreadCount(accountId) {
        return this.store.filter((n) => n.accountId === accountId && !n.read).length;
    }
    async create(notification) {
        const full = { ...notification, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        const all = this.store;
        all.unshift(full);
        this.store = all;
        return full;
    }
    async markRead(id) {
        const all = this.store;
        const idx = all.findIndex((n) => n.id === id);
        if (idx >= 0)
            all[idx] = { ...all[idx], read: true };
        this.store = all;
    }
    async markAllRead(accountId) {
        const all = this.store;
        all.forEach((n) => { if (n.accountId === accountId)
            n.read = true; });
        this.store = all;
    }
    async remove(id) {
        this.store = this.store.filter((n) => n.id !== id);
    }
}
// ─── Career Test ───
class MockCareerTestRepository {
    tests = [
        {
            id: 'test-1',
            type: 'career_interests',
            title: 'Карьерные интересы',
            description: 'Определите, какие сферы деятельности вам ближе всего.',
            questions: [
                { id: 'q1', text: 'Что вам больше нравится?', options: [
                        { id: 'a', text: 'Анализировать данные и искать закономерности', scores: { analytical: 2, research: 1 } },
                        { id: 'b', text: 'Создавать визуальные концепции', scores: { creative: 2, design: 1 } },
                        { id: 'c', text: 'Общаться с людьми и помогать им', scores: { social: 2, communication: 1 } },
                        { id: 'd', text: 'Организовывать процессы и проекты', scores: { management: 2, leadership: 1 } },
                    ] },
                { id: 'q2', text: 'Какая задача вас привлекает?', options: [
                        { id: 'a', text: 'Написать код или скрипт', scores: { analytical: 2, tech: 1 } },
                        { id: 'b', text: 'Разработать дизайн-макет', scores: { creative: 2, design: 1 } },
                        { id: 'c', text: 'Провести переговоры', scores: { social: 2, communication: 1 } },
                        { id: 'd', text: 'Спланировать запуск продукта', scores: { management: 2, leadership: 1 } },
                    ] },
                { id: 'q3', text: 'В какой среде вам комфортнее?', options: [
                        { id: 'a', text: 'Тихий офис с фокусом на задачу', scores: { analytical: 1, research: 1 } },
                        { id: 'b', text: 'Креативная студия', scores: { creative: 2, design: 1 } },
                        { id: 'c', text: 'Открытое пространство с общением', scores: { social: 2, communication: 1 } },
                        { id: 'd', text: 'Динамичный стартап', scores: { management: 1, leadership: 2 } },
                    ] },
                { id: 'q4', text: 'Что вы считаете своим преимуществом?', options: [
                        { id: 'a', text: 'Логика и внимание к деталям', scores: { analytical: 2 } },
                        { id: 'b', text: 'Креативность и вкус', scores: { creative: 2 } },
                        { id: 'c', text: 'Эмпатия и коммуникация', scores: { social: 2 } },
                        { id: 'd', text: 'Решительность и инициатива', scores: { management: 2, leadership: 1 } },
                    ] },
                { id: 'q5', text: 'Какой результат вас радует больше?', options: [
                        { id: 'a', text: 'Решённая техническая задача', scores: { analytical: 1, tech: 1 } },
                        { id: 'b', text: 'Красивый готовый продукт', scores: { creative: 1, design: 1 } },
                        { id: 'c', text: 'Довольный клиент или команда', scores: { social: 1, communication: 1 } },
                        { id: 'd', text: 'Запущенный проект', scores: { management: 1, leadership: 1 } },
                    ] },
                { id: 'q6', text: 'Как вы проводите свободное время?', options: [
                        { id: 'a', text: 'Изучаю новые технологии и инструменты', scores: { analytical: 2, tech: 1 } },
                        { id: 'b', text: 'Рисую, фотографирую или снимаю видео', scores: { creative: 2, design: 1 } },
                        { id: 'c', text: 'Организую встречи или мероприятия', scores: { social: 1, leadership: 1 } },
                        { id: 'd', text: 'Планирую свои цели и проекты', scores: { management: 2, leadership: 1 } },
                    ] },
                { id: 'q7', text: 'Какую книгу вы скорее прочтёте?', options: [
                        { id: 'a', text: 'Научно-популярную про технологии', scores: { analytical: 2, research: 1 } },
                        { id: 'b', text: 'По дизайну или искусству', scores: { creative: 2, design: 1 } },
                        { id: 'c', text: 'По психологии и коммуникациям', scores: { social: 2, communication: 1 } },
                        { id: 'd', text: 'Бизнес-биографию или мемуары лидеров', scores: { management: 2, leadership: 1 } },
                    ] },
                { id: 'q8', text: 'Что вас больше всего пугает в работе?', options: [
                        { id: 'a', text: 'Работа без логики и структуры', scores: { analytical: 2 } },
                        { id: 'b', text: 'Однообразие и шаблонность', scores: { creative: 2 } },
                        { id: 'c', text: 'Изоляция от людей', scores: { social: 2 } },
                        { id: 'd', text: 'Отсутствие влияния на результат', scores: { management: 2, leadership: 1 } },
                    ] },
                { id: 'q9', text: 'Какой проект вы бы выбрали для портфолио?', options: [
                        { id: 'a', text: 'Аналитический дашборд с данными', scores: { analytical: 2, tech: 1 } },
                        { id: 'b', text: 'Дизайн-система или брендбук', scores: { creative: 2, design: 1 } },
                        { id: 'c', text: 'Организация конференции или митапа', scores: { social: 2, communication: 1 } },
                        { id: 'd', text: 'Стартап с нуля', scores: { management: 2, leadership: 1 } },
                    ] },
                { id: 'q10', text: 'Что вам говорят о вас чаще всего?', options: [
                        { id: 'a', text: 'Ты такой внимательный к деталям', scores: { analytical: 2 } },
                        { id: 'b', text: 'У тебя отличный вкус', scores: { creative: 2, design: 1 } },
                        { id: 'c', text: 'С тобой легко общаться', scores: { social: 2, communication: 1 } },
                        { id: 'd', text: 'Ты прирождённый лидер', scores: { management: 2, leadership: 1 } },
                    ] },
            ],
            results: [
                { profile: 'Аналитик', description: 'Вы склонны к работе с данными, логикой и системным мышлением.', strengths: ['Логическое мышление', 'Внимание к деталям', 'Системный подход'], environment: ['Структурированные команды', 'Исследовательские проекты'], taskTypes: ['Анализ данных', 'Оптимизация процессов', 'Исследования'], directions: ['Аналитика данных', 'Разработка', 'QA', 'Исследования'], recommendations: ['Развивайте навыки работы с данными', 'Изучайте SQL и Python', 'Создавайте pet-проекты с аналитикой'] },
                { profile: 'Креативщик', description: 'Вы склонны к творческому подходу и визуальному мышлению.', strengths: ['Креативность', 'Эстетика', 'Нестандартное мышление'], environment: ['Креативные студии', 'Продуктовые команды'], taskTypes: ['Дизайн', 'Контент', 'Брендинг'], directions: ['Дизайн', 'Контент', 'Маркетинг', 'Брендинг'], recommendations: ['Собирайте портфолио', 'Изучайте Figma и тренды', 'Участвуйте в дизайн-челленджах'] },
                { profile: 'Коммуникатор', description: 'Вы склонны к работе с людьми и коммуникацией.', strengths: ['Эмпатия', 'Переговоры', 'Командная работа'], environment: ['Клиентоориентированные команды', 'HR и поддержка'], taskTypes: ['Переговоры', 'Поддержка', 'Обучение'], directions: ['HR', 'Продажи', 'Поддержка', 'Образование'], recommendations: ['Развивайте навыки презентации', 'Изучайте CRM-системы', 'Стройте нетворк'] },
                { profile: 'Организатор', description: 'Вы склонны к управлению и координации процессов.', strengths: ['Лидерство', 'Планирование', 'Ответственность'], environment: ['Стартапы', 'Управление проектами'], taskTypes: ['Планирование', 'Координация', 'Стратегия'], directions: ['Менеджмент', 'Project-менеджмент', 'Стратегия', 'Предпринимательство'], recommendations: ['Изучайте методологии управления', 'Развивайте лидерские качества', 'Стройте собственные проекты'] },
            ],
        },
        {
            id: 'test-2',
            type: 'work_style',
            title: 'Рабочий стиль',
            description: 'Поймите, как вам комфортнее работать и взаимодействовать с командой.',
            questions: [
                { id: 'q1', text: 'Как вы предпочитаете работать?', options: [
                        { id: 'a', text: 'Самостоятельно, с минимальным надзором', scores: { independent: 2 } },
                        { id: 'b', text: 'В команде, обсуждая идеи', scores: { collaborative: 2 } },
                        { id: 'c', text: 'С чётким планом и дедлайнами', scores: { structured: 2 } },
                        { id: 'd', text: 'В гибком режиме, по вдохновению', scores: { flexible: 2 } },
                    ] },
                { id: 'q2', text: 'Как вы принимаете решения?', options: [
                        { id: 'a', text: 'После сбора всех данных', scores: { structured: 2, analytical: 1 } },
                        { id: 'b', text: 'Обсудив с командой', scores: { collaborative: 2 } },
                        { id: 'c', text: 'Интуитивно, быстро', scores: { flexible: 1, independent: 1 } },
                        { id: 'd', text: 'Опираясь на опыт', scores: { independent: 1, structured: 1 } },
                    ] },
                { id: 'q3', text: 'Что для вас важнее?', options: [
                        { id: 'a', text: 'Автономия', scores: { independent: 2 } },
                        { id: 'b', text: 'Команда', scores: { collaborative: 2 } },
                        { id: 'c', text: 'Структура', scores: { structured: 2 } },
                        { id: 'd', text: 'Свобода', scores: { flexible: 2 } },
                    ] },
                { id: 'q4', text: 'Как вы реагируете на изменения?', options: [
                        { id: 'a', text: 'Планирую заранее', scores: { structured: 2 } },
                        { id: 'b', text: 'Обсуждаю с командой', scores: { collaborative: 1 } },
                        { id: 'c', text: 'Адаптируюсь быстро', scores: { flexible: 2 } },
                        { id: 'd', text: 'Действую самостоятельно', scores: { independent: 1 } },
                    ] },
                { id: 'q5', text: 'Как вы относитесь к правилам и регламентам?', options: [
                        { id: 'a', text: 'Люблю чёткие правила', scores: { structured: 2 } },
                        { id: 'b', text: 'Правила — это ориентир, не догма', scores: { flexible: 1, independent: 1 } },
                        { id: 'c', text: 'Обсуждаю с командой, что работает', scores: { collaborative: 2 } },
                        { id: 'd', text: 'Предпочитаю минимум ограничений', scores: { independent: 2, flexible: 1 } },
                    ] },
                { id: 'q6', text: 'Как вы справляетесь со стрессом?', options: [
                        { id: 'a', text: 'Структурирую задачу и действую по плану', scores: { structured: 2 } },
                        { id: 'b', text: 'Обсуждаю с коллегами', scores: { collaborative: 2 } },
                        { id: 'c', text: 'Быстро переключаюсь и действую', scores: { flexible: 2 } },
                        { id: 'd', text: 'Беру паузу и размышляю один', scores: { independent: 2 } },
                    ] },
                { id: 'q7', text: 'Как вы предпочитаете получать обратную связь?', options: [
                        { id: 'a', text: 'В письменном виде, структурированно', scores: { structured: 2 } },
                        { id: 'b', text: 'В живом обсуждении с командой', scores: { collaborative: 2 } },
                        { id: 'c', text: 'Непринуждённо, в моменте', scores: { flexible: 2 } },
                        { id: 'd', text: 'Один на один с руководителем', scores: { independent: 2 } },
                    ] },
                { id: 'q8', text: 'Что для вас важнее в рабочем пространстве?', options: [
                        { id: 'a', text: 'Тишина и порядок', scores: { structured: 1, independent: 1 } },
                        { id: 'b', text: 'Открытое пространство для общения', scores: { collaborative: 2 } },
                        { id: 'c', text: 'Коворкинг или кафе — где удобно', scores: { flexible: 2 } },
                        { id: 'd', text: 'Свой кабинет или домашний офис', scores: { independent: 2 } },
                    ] },
                { id: 'q9', text: 'Как вы начинаете новый проект?', options: [
                        { id: 'a', text: 'Составляю план и расставляю приоритеты', scores: { structured: 2 } },
                        { id: 'b', text: 'Собираю команду и обсуждаю видение', scores: { collaborative: 2 } },
                        { id: 'c', text: 'Начинаю с прототипа и корректирую', scores: { flexible: 2 } },
                        { id: 'd', text: 'Определяю цель и действую сам', scores: { independent: 2 } },
                    ] },
                { id: 'q10', text: 'Как вы относитесь к многозадачности?', options: [
                        { id: 'a', text: 'Предпочитаю одну задачу за раз', scores: { structured: 2 } },
                        { id: 'b', text: 'Команда помогает распределить', scores: { collaborative: 1 } },
                        { id: 'c', text: 'Легко переключаюсь между задачами', scores: { flexible: 2 } },
                        { id: 'd', text: 'Сам решаю, что и когда делать', scores: { independent: 2 } },
                    ] },
            ],
            results: [
                { profile: 'Самостоятельный', description: 'Вы цените автономию и ответственность за результат.', strengths: ['Самостоятельность', 'Инициатива', 'Ответственность'], environment: ['Удалённая работа', 'Проекты с высокой автономией'], taskTypes: ['Индивидуальные задачи', 'Исследования'], directions: ['Фриланс', 'Индивидуальные проекты', 'Консалтинг'], recommendations: ['Развивайте тайм-менеджмент', 'Стройте личный бренд', 'Ищите проекты с доверием'] },
                { profile: 'Командный', description: 'Вы лучше всего работаете в коллективе.', strengths: ['Командная работа', 'Коммуникация', 'Эмпатия'], environment: ['Кросс-функциональные команды', 'Agile-команды'], taskTypes: ['Совместные проекты', 'Обсуждения', 'Мозговые штурмы'], directions: ['Командная разработка', 'HR', 'Поддержка'], recommendations: ['Развивайте навыки фасилитации', 'Участвуйте в митапах', 'Изучайте Agile'] },
                { profile: 'Структурированный', description: 'Вы цените чёткие процессы и планирование.', strengths: ['Организованность', 'Планирование', 'Дисциплина'], environment: ['Корпоративные команды', 'Проекты с регламентами'], taskTypes: ['Планирование', 'Документация', 'Контроль'], directions: ['Project-менеджмент', 'Аналитика', 'Контроль качества'], recommendations: ['Изучайте методологии (Scrum, Kanban)', 'Развивайте навыки планирования', 'Ведите документацию'] },
                { profile: 'Гибкий', description: 'Вы адаптивны и работаете по вдохновению.', strengths: ['Адаптивность', 'Креативность', 'Скорость'], environment: ['Стартапы', 'Креативные проекты'], taskTypes: ['Быстрые итерации', 'Эксперименты'], directions: ['Стартапы', 'Креативные индустрии', 'Инновации'], recommendations: ['Развивайте навыки адаптации', 'Ищите динамичные проекты', 'Учитесь управлять хаосом'] },
            ],
        },
        {
            id: 'test-3',
            type: 'career_priorities',
            title: 'Карьерные приоритеты',
            description: 'Определите, что для вас важнее всего в работе.',
            questions: [
                { id: 'q1', text: 'Что для вас важнее в работе?', options: [
                        { id: 'a', text: 'Высокий доход', scores: { income: 2 } },
                        { id: 'b', text: 'Интересные задачи', scores: { interest: 2 } },
                        { id: 'c', text: 'Баланс работы и жизни', scores: { balance: 2 } },
                        { id: 'd', text: 'Рост и развитие', scores: { growth: 2 } },
                    ] },
                { id: 'q2', text: 'Что вас мотивирует?', options: [
                        { id: 'a', text: 'Финансовое вознаграждение', scores: { income: 2 } },
                        { id: 'b', text: 'Увлечённость процессом', scores: { interest: 2 } },
                        { id: 'c', text: 'Свободное время', scores: { balance: 2 } },
                        { id: 'd', text: 'Новые вызовы', scores: { growth: 2 } },
                    ] },
                { id: 'q3', text: 'Какой график вам ближе?', options: [
                        { id: 'a', text: 'Полный день, стабильность', scores: { income: 1, balance: 1 } },
                        { id: 'b', text: 'Гибкий, по задачам', scores: { interest: 1, balance: 1 } },
                        { id: 'c', text: 'Свободный, удалённо', scores: { balance: 2 } },
                        { id: 'd', text: 'Интенсивный, с ростом', scores: { growth: 2 } },
                    ] },
                { id: 'q4', text: 'Куда вы хотите расти?', options: [
                        { id: 'a', text: 'В доходах', scores: { income: 2 } },
                        { id: 'b', text: 'В экспертизе', scores: { interest: 2, growth: 1 } },
                        { id: 'c', text: 'В качестве жизни', scores: { balance: 2 } },
                        { id: 'd', text: 'В ответственности', scores: { growth: 2 } },
                    ] },
                { id: 'q5', text: 'Что для вас важнее при выборе компании?', options: [
                        { id: 'a', text: 'Высокая зарплата и бонусы', scores: { income: 2 } },
                        { id: 'b', text: 'Интересные проекты и технологии', scores: { interest: 2 } },
                        { id: 'c', text: 'Гибкий график и удалёнка', scores: { balance: 2 } },
                        { id: 'd', text: 'Возможности карьерного роста', scores: { growth: 2 } },
                    ] },
                { id: 'q6', text: 'Как вы относитесь к риску в карьере?', options: [
                        { id: 'a', text: 'Готов рисковать ради высокого дохода', scores: { income: 2 } },
                        { id: 'b', text: 'Риск оправдан, если задача интересная', scores: { interest: 2 } },
                        { id: 'c', text: 'Предпочитаю стабильность', scores: { balance: 2 } },
                        { id: 'd', text: 'Риск — это возможность для роста', scores: { growth: 2 } },
                    ] },
                { id: 'q7', text: 'Что вас больше всего демотивирует?', options: [
                        { id: 'a', text: 'Низкая оплата труда', scores: { income: 2 } },
                        { id: 'b', text: 'Скучные и рутинные задачи', scores: { interest: 2 } },
                        { id: 'c', text: 'Постоянные переработки', scores: { balance: 2 } },
                        { id: 'd', text: 'Отсутствие развития и перспектив', scores: { growth: 2 } },
                    ] },
                { id: 'q8', text: 'Какой компромисс вы готовы принять?', options: [
                        { id: 'a', text: 'Меньше свободного времени ради денег', scores: { income: 2 } },
                        { id: 'b', text: 'Меньше денег ради интересной работы', scores: { interest: 2 } },
                        { id: 'c', text: 'Меньше амбиций ради спокойствия', scores: { balance: 2 } },
                        { id: 'd', text: 'Меньше комфорта ради опыта', scores: { growth: 2 } },
                    ] },
                { id: 'q9', text: 'Как вы видите идеальную карьеру через 5 лет?', options: [
                        { id: 'a', text: 'Высокая должность с большим доходом', scores: { income: 2 } },
                        { id: 'b', text: 'Эксперт в любимом деле', scores: { interest: 2 } },
                        { id: 'c', text: 'Стабильная работа и личная жизнь', scores: { balance: 2 } },
                        { id: 'd', text: 'Руководящая роль, свой бизнес', scores: { growth: 2 } },
                    ] },
                { id: 'q10', text: 'Что для вас значит успех?', options: [
                        { id: 'a', text: 'Финансовая независимость', scores: { income: 2 } },
                        { id: 'b', text: 'Любовь к своей работе', scores: { interest: 2 } },
                        { id: 'c', text: 'Гармония работы и жизни', scores: { balance: 2 } },
                        { id: 'd', text: 'Постоянное развитие и влияние', scores: { growth: 2 } },
                    ] },
            ],
            results: [
                { profile: 'Доход-ориентированный', description: 'Для вас важен финансовый результат работы.', strengths: ['Целеустремлённость', 'Результативность', 'Амбиции'], environment: ['Высококонкурентные команды', 'Продажи'], taskTypes: ['Сделки', 'Проекты с KPI'], directions: ['Продажи', 'Финансы', 'Предпринимательство'], recommendations: ['Развивайте навыки переговоров', 'Изучайте финансовую грамотность', 'Ставьте амбициозные цели'] },
                { profile: 'Интерес-ориентированный', description: 'Для вас важна увлечённость процессом.', strengths: ['Любознательность', 'Креативность', 'Глубина'], environment: ['Исследовательские команды', 'Креативные проекты'], taskTypes: ['Исследования', 'Творческие задачи'], directions: ['Наука', 'Дизайн', 'Контент', 'R&D'], recommendations: ['Ищите проекты, которые зажигают', 'Развивайте экспертизу', 'Не бойтесь менять сферу'] },
                { profile: 'Баланс-ориентированный', description: 'Для вас важен баланс работы и личной жизни.', strengths: ['Стабильность', 'Саморегуляция', 'Здоровый подход'], environment: ['Команды с гибким графиком', 'Удалённая работа'], taskTypes: ['Предсказуемые задачи', 'Долгосрочные проекты'], directions: ['Удалённая работа', 'Стабильные компании', 'Фриланс'], recommendations: ['Ищите компании с гибким графиком', 'Развивайте навыки самоорганизации', 'Берегите здоровье'] },
                { profile: 'Рост-ориентированный', description: 'Для вас важен профессиональный рост.', strengths: ['Амбициозность', 'Обучаемость', 'Лидерство'], environment: ['Быстрорастущие компании', 'Стартапы'], taskTypes: ['Вызовы', 'Новые направления'], directions: ['Менеджмент', 'Стартапы', 'Инновации'], recommendations: ['Ищите менторов', 'Берите ответственность', 'Не бойтесь сложных задач'] },
            ],
        },
    ];
    get results() { return loadStore('career_test_results'); }
    set results(v) { saveStore('career_test_results', v); }
    async getAll() { return [...this.tests]; }
    async getByType(type) {
        return this.tests.find((t) => t.type === type) ?? null;
    }
    async getResult(accountId, testType) {
        return this.results.find((r) => r.accountId === accountId && r.testType === testType) ?? null;
    }
    async canRetake(accountId, testType) {
        const existing = this.results.find((r) => r.accountId === accountId && r.testType === testType);
        if (!existing)
            return { allowed: true, daysLeft: 0 };
        const daysSince = Math.floor((Date.now() - new Date(existing.takenAt).getTime()) / (86400000));
        if (daysSince < 30)
            return { allowed: false, daysLeft: 30 - daysSince };
        return { allowed: true, daysLeft: 0 };
    }
    async saveResult(result) {
        const all = this.results.filter((r) => !(r.accountId === result.accountId && r.testType === result.testType));
        const full = { ...result, id: crypto.randomUUID(), takenAt: new Date().toISOString() };
        all.push(full);
        this.results = all;
        return full;
    }
}
// ─── Consent (event-based) ───
class MockConsentRepository {
    get store() { return loadStore('consent_events'); }
    set store(v) { saveStore('consent_events', v); }
    async getEvents(accountId) {
        return this.store.filter((e) => e.accountId === accountId).sort((a, b) => b.acceptedAt.localeCompare(a.acceptedAt));
    }
    async getActiveByType(accountId, consentType) {
        return this.store.find((e) => e.accountId === accountId && e.consentType === consentType && !e.withdrawnAt) ?? null;
    }
    async hasAccepted(accountId, consentType) {
        return !!await this.getActiveByType(accountId, consentType);
    }
    async recordAcceptance(params) {
        // Withdraw any previous acceptance of this type
        const consentItems = this.store;
        const existing = consentItems.find((e) => e.accountId === params.accountId && e.consentType === params.consentType && !e.withdrawnAt);
        if (existing) {
            existing.withdrawnAt = new Date().toISOString();
            this.store = consentItems;
        }
        const full = {
            id: crypto.randomUUID(),
            accountId: params.accountId,
            organizationId: params.organizationId ?? null,
            consentType: params.consentType,
            documentSlug: params.documentSlug,
            documentVersion: params.documentVersion,
            categories: params.categories,
            acceptedAt: new Date().toISOString(),
            withdrawnAt: null,
            source: params.source,
            ipAddress: null,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        };
        const all = this.store;
        all.push(full);
        this.store = all;
        return full;
    }
    async withdraw(accountId, consentType) {
        const all = this.store;
        all.forEach((e) => {
            if (e.accountId === accountId && e.consentType === consentType && !e.withdrawnAt) {
                e.withdrawnAt = new Date().toISOString();
            }
        });
        this.store = all;
    }
    async getByOrganization(orgId) {
        return this.store.filter((e) => e.organizationId === orgId).sort((a, b) => b.acceptedAt.localeCompare(a.acceptedAt));
    }
}
// ─── Seed demo partners (DEV-only, call explicitly) ───
const PARTNERS_SEED_VERSION = 'official-3-v2';
export function seedDemoPartners() {
    const version = localStorage.getItem('partners_seed_version');
    if (version === PARTNERS_SEED_VERSION)
        return;
    const official = [
        { id: 'partner-minobrnauki', name: 'Минобрнауки России', logoUrl: '/assets/partners/minobrnauki.webp', websiteUrl: 'https://www.minobrnauki.gov.ru/', type: 'platform', description: 'Министерство науки и высшего образования РФ', isActive: true, sortOrder: 1 },
        { id: 'partner-sovet-minobrnauki', name: 'Совет обучающихся при Минобрнауки России', logoUrl: '/assets/partners/sovet-minobrnauki.webp', websiteUrl: 'https://vk.ru/sovet_minobrnauki', type: 'platform', description: 'Совет обучающихся при Минобрнауки России', isActive: true, sortOrder: 2 },
        { id: 'partner-studcareer', name: 'СтудКарьера', logoUrl: '/assets/partners/studcareer.webp', websiteUrl: 'https://vk.ru/sovetcareer', type: 'career', description: 'Карьерный консалтинг для студентов', isActive: true, sortOrder: 3 },
    ];
    // v1 → v2: replace all partners with the 3 official ones, preserving admin-added entries
    const existing = loadStore('partners');
    const officialIds = official.map((p) => p.id);
    const adminAdded = existing.filter((p) => !officialIds.includes(p.id));
    saveStore('partners', [...official, ...adminAdded]);
    localStorage.setItem('partners_seed_version', PARTNERS_SEED_VERSION);
}
class MockMediaPlanRepository {
    get store() {
        try {
            return JSON.parse(sessionStorage.getItem('media_plan') || '[]');
        }
        catch {
            return [];
        }
    }
    set store(v) {
        sessionStorage.setItem('media_plan', JSON.stringify(v));
    }
    async get() { return this.store; }
    async add(item) {
        const all = this.store;
        if (all.some((i) => i.placementId === item.placementId))
            return;
        all.push({ ...item, addedAt: new Date().toISOString() });
        this.store = all;
    }
    async remove(placementId) {
        this.store = this.store.filter((i) => i.placementId !== placementId);
    }
    async clear() { this.store = []; }
}
export const mediaPlanRepository = repositoryAdapter("mediaPlan", new MockMediaPlanRepository());
class MockProjectDraftSourceRepository {
    get store() {
        try {
            return JSON.parse(sessionStorage.getItem('project_draft_source') || '{"type":null,"sourceId":null,"sourceName":null,"category":null,"providerName":null,"format":null,"basePrice":null}');
        }
        catch {
            return { type: null, sourceId: null, sourceName: null, category: null, providerName: null, format: null, basePrice: null };
        }
    }
    set store(v) {
        sessionStorage.setItem('project_draft_source', JSON.stringify(v));
    }
    async get() { return this.store; }
    async set(source) { this.store = source; }
    async clear() { this.store = { type: null, sourceId: null, sourceName: null, category: null, providerName: null, format: null, basePrice: null, placementIds: null, placements: null, providerBreakdown: null, placementSubtotal: null, platformFee: null, totalAmount: null }; }
}
export const projectDraftSourceRepository = repositoryAdapter("projectDraftSource", new MockProjectDraftSourceRepository());
// ─── Export singletons ───
export const partnerRepository = repositoryAdapter("partner", new MockPartnerRepository());
export const organizationInvitationRepository = repositoryAdapter("organizationInvitation", new MockOrganizationInvitationRepository());
export const documentRepository = repositoryAdapter("document", new MockDocumentRepository());
export const advertisingRepository = repositoryAdapter("advertising", new MockAdvertisingRepository());
export const serviceOfferingRepository = repositoryAdapter("serviceOffering", new MockServiceOfferingRepository());
export const favoriteVacancyRepository = repositoryAdapter("favoriteVacancy", new MockFavoriteVacancyRepository());
export const notificationRepository = repositoryAdapter("notification", new MockNotificationRepository());
export const careerTestRepository = repositoryAdapter("careerTest", new MockCareerTestRepository());
export const consentRepository = repositoryAdapter("consent", new MockConsentRepository());
