import type { UserProfile, Vacancy } from './types';

export const educationLevels = [
  { value: 'Школа', emoji: '🏫' },
  { value: 'СПО', emoji: '🎓' },
  { value: 'Бакалавриат', emoji: '🎓' },
  { value: 'Специалитет', emoji: '🎓' },
  { value: 'Магистратура', emoji: '🎓' },
  { value: 'Аспирантура', emoji: '🔬' },
  { value: 'Уже закончил обучение', emoji: '✅' },
];

export const educationForms = ['Очная', 'Очно-заочная', 'Заочная'];

export const academicAchievements = [
  'Повышенная стипендия', 'Олимпиада', 'Конференция', 'Публикация',
  'Красный диплом', 'Конкурс', 'Грант', 'Другое',
];

export const opportunityTypes = [
  { name: 'Стажировка', emoji: '🚀' },
  { name: 'Первая работа', emoji: '💼' },
  { name: 'Подработка', emoji: '⏰' },
  { name: 'Проектная работа', emoji: '📦' },
  { name: 'Удалённая работа', emoji: '🏠' },
  { name: 'Практика', emoji: '📋' },
  { name: 'Времененная занятость', emoji: '📅' },
];

export const startWhenOptions = ['Сейчас', 'В течение месяца', 'Через 1–3 месяца', 'Пока просто изучаю возможности'];
export const hoursOptions = ['До 20 часов', '20–30 часов', '30–40 часов', 'Полный день'];
export const formatOptions = ['Офис', 'Гибрид', 'Удалённо', 'Неважно'];

export const professions = [
  { name: 'IT', emoji: '💻' },
  { name: 'Маркетинг', emoji: '📢' },
  { name: 'PR', emoji: '📣' },
  { name: 'Дизайн', emoji: '🎨' },
  { name: 'Продажи', emoji: '🤝' },
  { name: 'Финансы', emoji: '💰' },
  { name: 'HR', emoji: '👥' },
  { name: 'Государственное управление', emoji: '🏛' },
  { name: 'Инженерия', emoji: '⚙️' },
  { name: 'Производство', emoji: '🏭' },
  { name: 'Медиа', emoji: '📱' },
  { name: 'Образование', emoji: '📚' },
  { name: 'Наука', emoji: '🔬' },
  { name: 'Юриспруденция', emoji: '⚖️' },
  { name: 'Логистика', emoji: '🚚' },
  { name: 'Медицина', emoji: '⚕️' },
  { name: 'Data', emoji: '📊' },
  { name: 'Менеджмент', emoji: '📋' },
];

export const roles = [
  'Маркетолог', 'SMM-менеджер', 'Бренд-менеджер', 'Product Manager', 'Project Manager',
  'PR-менеджер', 'Аналитик', 'Дизайнер', 'Разработчик', 'HR-менеджер',
  'Финансовый аналитик', 'Контент-менеджер', 'Не знаю, кем хочу быть',
];

export const experienceTypes = [
  { name: 'Работа', emoji: '💼' },
  { name: 'Стажировка', emoji: '🚀' },
  { name: 'Практика', emoji: '📋' },
  { name: 'Волонтёрство', emoji: '🤝' },
  { name: 'Студенческое объединение', emoji: '👥' },
  { name: 'Организация мероприятий', emoji: '🎪' },
  { name: 'Хакатоны', emoji: '💻' },
  { name: 'Кейсы', emoji: '📦' },
  { name: 'Курсовые проекты', emoji: '📝' },
  { name: 'Диплом', emoji: '🎓' },
  { name: 'Исследования', emoji: '🔬' },
  { name: 'Стартап', emoji: '🚀' },
  { name: 'Фриланс', emoji: '✨' },
  { name: 'Олимпиады', emoji: '🏆' },
  { name: 'Личные проекты', emoji: '🎯' },
  { name: 'Социальные проекты', emoji: '💚' },
  { name: 'Блог / социальные сети', emoji: '📱' },
  { name: 'Спорт', emoji: '⚽' },
  { name: 'Хобби', emoji: '🎨' },
];

export const hardSkillsByProfession: Record<string, string[]> = {
  'IT': ['JavaScript', 'Python', 'React', 'HTML/CSS', 'Git', 'SQL', 'Node.js', 'TypeScript', 'Docker', 'REST API', 'Linux'],
  'Маркетинг': ['VK Ads', 'Яндекс Директ', 'Таргетированная реклама', 'Аналитика', 'Excel', 'PowerPoint', 'SMM', 'Копирайтинг', 'CRM', 'Веб-аналитика'],
  'PR': ['Копирайтинг', 'Пресс-релизы', 'Связи с медиа', 'SMM', 'Организация мероприятий', 'Брендинг', 'Спикеринг'],
  'Дизайн': ['Figma', 'Canva', 'Photoshop', 'Illustrator', 'UI/UX', 'Прототипирование', 'Типографика', 'Motion-дизайн'],
  'Продажи': ['Холодные звонки', 'Переговоры', 'CRM', 'Excel', 'B2B продажи', 'Презентации', 'Воронка продаж'],
  'Финансы': ['Excel', 'Финансовое моделирование', '1С', 'Анализ данных', 'Бухгалтерия', 'Power BI', 'SQL'],
  'HR': ['Рекрутинг', 'Интервьюирование', 'Onboarding', 'HR-бренд', 'Excel', 'Talent acquisition', 'Оценка персонала'],
  'Data': ['Python', 'SQL', 'Pandas', 'Tableau', 'Excel', 'Статистика', 'Machine Learning', 'Power BI', 'R'],
  'Медиа': ['Копирайтинг', 'SMM', 'Видеомонтаж', 'Photoshop', 'Контент-планирование', 'SEO', 'Аналитика'],
  'Менеджмент': ['Project Management', 'Agile', 'Scrum', 'Jira', 'Notion', 'Планирование', 'Риск-менеджмент'],
  'Инженерия': ['AutoCAD', 'SolidWorks', 'Математика', 'Чтение чертежей', 'Нормоконтроль', '3D-моделирование'],
  'Логистика': ['Управление запасами', 'Excel', '1С', 'Закупки', 'Складская логистика', 'Таможенное оформление'],
};

export const genericSkills = ['Excel', 'PowerPoint', 'Коммуникация', 'Организация', 'Аналитика', 'Копирайтинг', 'Figma', 'SMM'];

export const softSkillsQuestions = [
  { id: 'q1', text: 'До дедлайна два дня, а один человек из команды перестал отвечать. Что сделаешь?', options: [
    { id: 'a', text: 'Свяжусь лично, узнаю причину и перераспределю задачи', scores: { Коммуникация: 2, Ответственность: 2, Самоорганизация: 1 } },
    { id: 'b', text: 'Возьму его задачи на себя и сделаю всё в одиночку', scores: { Самостоятельность: 2, Ответственность: 1 } },
    { id: 'c', text: 'Сообщу руководителю и буду ждать решения', scores: { Адаптивность: 1 } },
  ] },
  { id: 'q2', text: 'Команда не сходится во мнениях по ключевому решению. Твои действия?', options: [
    { id: 'a', text: 'Соберу всех и предложу каждому высказаться, потом проголосуем', scores: { Коммуникация: 2, Лидерство: 2, РаботаВКоманде: 1 } },
    { id: 'b', text: 'Предложу компромисс, который учитывает все мнения', scores: { Адаптивность: 2, Коммуникация: 1 } },
    { id: 'c', text: 'Подожду, пока спор утихнет сам', scores: {} },
  ] },
  { id: 'q3', text: 'Получил критику своей работы. Как отреагируешь?', options: [
    { id: 'a', text: 'Выслушаю, уточню детали и внесу улучшения', scores: { Адаптивность: 2, Самостоятельность: 1, КритическоеМышление: 2 } },
    { id: 'b', text: 'Обижусь, но промолчу', scores: {} },
    { id: 'c', text: 'Оправдаюсь и объясню, почему так сделал', scores: { Коммуникация: 1 } },
  ] },
  { id: 'q4', text: 'Новый проект в незнакомой области. С чего начнёшь?', options: [
    { id: 'a', text: 'Изучу материалы и задам вопросы экспертам', scores: { Самостоятельность: 2, КритическоеМышление: 2, Самоорганизация: 1 } },
    { id: 'b', text: 'Буду действовать по аналогии с прошлыми проектами', scores: { Адаптивность: 1 } },
    { id: 'c', text: 'Подожду первые задачи от руководителя', scores: {} },
  ] },
  { id: 'q5', text: 'Коллега не справляется со своей частью работы. Что сделаешь?', options: [
    { id: 'a', text: 'Предложу помощь и разберёмся вместе', scores: { РаботаВКоманде: 2, Коммуникация: 2, Лидерство: 1 } },
    { id: 'b', text: 'Сделаю сам молча, чтобы не подвести команду', scores: { Ответственность: 2, Самостоятельность: 1 } },
    { id: 'c', text: 'Пожалуюсь руководителю', scores: {} },
  ] },
];

export const softSkillNames = ['Коммуникация', 'РаботаВКоманде', 'Самостоятельность', 'Ответственность', 'Лидерство', 'Адаптивность', 'КритическоеМышление', 'Самоорганизация'];

export const softSkillLabels: Record<string, string> = {
  Коммуникация: 'Коммуникация',
  РаботаВКоманде: 'Работа в команде',
  Самостоятельность: 'Самостоятельность',
  Ответственность: 'Ответственность',
  Лидерство: 'Лидерство',
  Адаптивность: 'Адаптивность',
  КритическоеМышление: 'Критическое мышление',
  Самоорганизация: 'Самоорганизация',
};

export const languageLevels = ['A1 — Начальный', 'A2 — Элементарный', 'B1 — Средний', 'B2 — Выше среднего', 'C1 — Продвинутый', 'C2 — В совершенстве'];

export const priorityOptions = [
  { name: 'Высокая зарплата', emoji: '💰' },
  { name: 'Опыт', emoji: '📈' },
  { name: 'Известный бренд', emoji: '🏢' },
  { name: 'Карьерный рост', emoji: '🚀' },
  { name: 'Удалёнка', emoji: '🏠' },
  { name: 'Гибкий график', emoji: '⏰' },
  { name: 'Обучение', emoji: '🎓' },
  { name: 'Наставник', emoji: '👨\u200d🏫' },
  { name: 'Сильная команда', emoji: '👥' },
  { name: 'Интересные проекты', emoji: '✨' },
  { name: 'Стабильность', emoji: '🛡' },
  { name: 'Польза обществу', emoji: '💚' },
  { name: 'Переезд', emoji: '📦' },
  { name: 'Жильё', emoji: '🏠' },
  { name: 'Корпоративные бонусы', emoji: '🎁' },
];

export const partnerBenefits = [
  { emoji: '💰', title: 'до 100 000 ₽ поддержки', desc: 'на образование, оборудование и развитие — в рамках партнёрских программ' },
  { emoji: '🏠', title: 'Жильё или компенсация аренды', desc: 'у отдельных работодателей для молодых специалистов' },
  { emoji: '🚆', title: 'Помощь при переезде', desc: 'релокационный пакет для молодых специалистов' },
  { emoji: '🎓', title: 'Корпоративное обучение', desc: 'за счёт компании — курсы, тренинги, сертификации' },
  { emoji: '❤️', title: 'ДМС и программы поддержки', desc: 'дополнительное медицинское страхование и забота о здоровье' },
  { emoji: '👨\u200d🏫', title: 'Наставник внутри компании', desc: 'персональный куратор на первые месяцы работы' },
  { emoji: '🚀', title: 'Быстрый карьерный рост', desc: 'прозрачная система грейдов и повышения' },
];

export const vacancies: Vacancy[] = [
  {
    title: 'Стажёр-аналитик данных', company: 'Сбер', type: 'Стажировка', location: 'Москва', format: 'Гибрид',
    salary: 'от 45 000 ₽', experience: 'Не требуется', match: 96,
    reasons: ['совпадает образование', '5 из 7 ключевых навыков', 'опыт не требуется', 'возможен гибрид', 'есть обучение', 'карьерные ожидания совпадают'],
    logo: 'С', gradient: 'from-green-400 to-emerald-500',
    bonuses: ['🎓 бесплатное обучение', '💻 техника', '❤️ ДМС', '👨\u200d🏫 наставник'],
    skillsRequired: ['Python', 'SQL', 'Excel', 'Аналитика', 'Pandas', 'Статистика', 'Tableau'],
    skillsMissing: ['Pandas', 'Tableau'],
  },
  {
    title: 'Младший продуктовый дизайнер', company: 'VK', type: 'Без опыта', location: 'Удалённо', format: 'Удалённо',
    salary: 'от 50 000 ₽', experience: 'Не требуется', match: 91,
    reasons: ['совпадает образование', 'креативные задачи', 'опыт не требуется', 'удалённый формат', 'сильная команда'],
    logo: 'VK', gradient: 'from-blue-400 to-indigo-500',
    bonuses: ['🏠 компенсация аренды', '🎓 обучение', '🍴 питание', '👨\u200d🏫 наставник'],
    skillsRequired: ['Figma', 'UI/UX', 'Прототипирование', 'Photoshop', 'Типографика', 'Motion-дизайн'],
    skillsMissing: ['Motion-дизайн'],
  },
  {
    title: 'Ассистент маркетолога', company: 'Яндекс', type: 'Стажировка', location: 'Москва', format: 'Офис',
    salary: 'от 40 000 ₽', experience: 'Не требуется', match: 88,
    reasons: ['совпадает образование', 'близкий вуз', 'опыт не требуется', 'известный бренд', 'обучение внутри'],
    logo: 'Я', gradient: 'from-yellow-400 to-orange-500',
    bonuses: ['🎓 обучение', '🍴 питание', '💻 техника', '🚀 быстрый рост'],
    skillsRequired: ['SMM', 'Копирайтинг', 'Яндекс Директ', 'Аналитика', 'Excel', 'CRM'],
    skillsMissing: ['Яндекс Директ', 'CRM'],
  },
  {
    title: 'Junior frontend-разработчик', company: 'Авито', type: 'Стажировка', location: 'Удалённо', format: 'Удалённо',
    salary: 'от 60 000 ₽', experience: 'Не требуется', match: 93,
    reasons: ['опыт не требуется', 'высокий спрос', 'совпадают навыки', 'удалённый формат', 'наставник'],
    logo: 'А', gradient: 'from-teal-400 to-cyan-500',
    bonuses: ['🎓 обучение', '💻 техника', '❤️ ДМС', '🏠 жильё'],
    skillsRequired: ['JavaScript', 'React', 'HTML/CSS', 'Git', 'TypeScript', 'REST API'],
    skillsMissing: ['TypeScript'],
  },
  {
    title: 'Стажёр в команду коммуникаций', company: 'Ростелеком', type: 'Без опыта', location: 'Санкт-Петербург', format: 'Гибрид',
    salary: 'от 35 000 ₽', experience: 'Не требуется', match: 79,
    reasons: ['опыт не требуется', 'подходит профиль', 'гибридный формат', 'стабильность'],
    logo: 'Р', gradient: 'from-violet-400 to-purple-500',
    bonuses: ['🎓 обучение', '❤️ ДМС', '🚆 релокация'],
    skillsRequired: ['Копирайтинг', 'SMM', 'Пресс-релизы', 'Организация мероприятий'],
    skillsMissing: ['Пресс-релизы'],
  },
  {
    title: 'Помощник HR-менеджера', company: 'Озон', type: 'Без опыта', location: 'Москва', format: 'Гибрид',
    salary: 'от 42 000 ₽', experience: 'Не требуется', match: 82,
    reasons: ['опыт не требуется', 'командная работа', 'гибрид', 'обучение', 'наставник'],
    logo: 'О', gradient: 'from-fuchsia-400 to-pink-500',
    bonuses: ['🎓 обучение', '🍴 питание', '👨\u200d🏫 наставник', '🚀 рост'],
    skillsRequired: ['Рекрутинг', 'Интервьюирование', 'Excel', 'Коммуникация', 'Onboarding'],
    skillsMissing: ['Рекрутинг', 'Интервьюирование'],
  },
];

export const interestOptions = professions;

export const universities = [
  'Воронежский государственный университет',
  'Московский государственный университет',
  'Санкт-Петербургский государственный университет',
  'НИУ ВШЭ',
  'МФТИ',
  'ИТМО',
  'УрФУ',
  'Казанский федеральный университет',
  'Другое',
];

export const navigatorPlatforms = [
  { name: 'СВЯЗКА', icon: '✨', url: 'https://svyazka.ru' },
  { name: 'HH.ru', icon: '💼', url: 'https://hh.ru' },
  { name: 'Работа России', icon: '🏛', url: 'https://trudvsem.ru' },
  { name: 'FutureToday', icon: '🚀', url: 'https://futuretoday.ru' },
];

export const nextStepsList = [
  { title: 'Подготовиться к собеседованию', emoji: '🎤', desc: 'Топ-5 вопросов и как на них отвечать' },
  { title: 'Изучить работодателя', emoji: '🔬', desc: 'Культура, продукты, последние новости' },
  { title: 'Отправить ещё 2 сильных отклика', emoji: '📤', desc: 'Ещё 3 подходящие вакансии рядом' },
  { title: 'Усилить навык', emoji: '💪', desc: 'Курсы и материалы по зонам роста' },
];

export const aiMessages: Record<string, string[]> = {
  welcome: ['👋 Привет! Я твой цифровой наставник. Помогу пройти путь от первого экрана до первого отклика.'],
  personal: ['✨ Отличное начало! Как только узнаем твоё имя, маршрут станет персональным.'],
  education: ['🎓 Учёба — это тоже часть профессионального опыта. Мы используем её при создании резюме.'],
  opportunity: ['🚯 Ничего страшного, если ты пока просто изучаешь возможности. Мы подберём подходящее.'],
  interests: ['🔥 Чем больше направлений выберешь, тем точнее подберём вакансии.'],
  experience: ['💡 Даже если нет официального опыта — учебные проекты тоже считаются. Расскажи о них!'],
  hardskills: ['🛠 Отметь всё, что умеешь. Если чего-то нет в списке — добавь свой навык.'],
  softskills: ['🧠 Несколько коротких ситуаций — и мы поймем твои сильные стороны.'],
  additional: ['🌍 Языки, права, портфолио — всё это делает резюме сильнее.'],
  priorities: ['🎯 Что для тебя по-настоящему важно в первой работе? Выбери до пяти.'],
  'profile-ready': ['🧠 Анализирую твой профиль... Нахожу сильные стороны и зоны роста.'],
  resume: ['🎉 Твоё резюме выглядит значительно сильнее, чем обычное студенческое. Можно скачать PDF.'],
  vacancies: ['💼 Я подобрал вакансии, которые идеально совпадают с твоим профилем.'],
  'cover-letter': ['✍️ Я подготовил черновик письма на основе твоего профиля. Посмотри и поправь.'],
  'final-check': ['🚀 Остался один клик — и твоя первая заявка отправлена!'],
  celebration: ['🎉 Ты сделал это! Первый отклик отправлен. Дальше — больше!'],
  'next-steps': ['👏 Осталось всего несколько шагов до собеседования. Ты справишься!'],
  certificate: ['📜 Получи свой первый сертификат — он может пригодиться в портфолио.'],
};

export const demoProfile: UserProfile = {
  firstName: 'Дарья',
  lastName: 'Танчук',
  middleName: 'Романовна',
  birthDate: '2003-09-11',
  gender: 'Женский',
  city: 'Воронеж',
  region: 'Воронежская область',
  relocation: 'Возможно',
  phone: '+7 999 123-45-67',
  email: 'tan@mail.ru',
  telegram: '@tan',
  vk: 'vk.com/tan',
  photo: '',
  education: {
    level: 'Бакалавриат',
    institution: 'Воронежский государственный университет',
    faculty: 'Факультет журналистики',
    specialty: 'Реклама и связи с общественностью',
    profile: 'Маркетинг',
    course: '4',
    endYear: '2025',
    form: 'Очная',
    gpa: '4.6',
    achievements: ['Повышенная стипендия', 'Конференция', 'Олимпиада'],
  },
  opportunity: {
    types: ['Стажировка', 'Первая работа'],
    startWhen: 'В течение месяца',
    hoursPerWeek: '20–30 часов',
    format: 'Гибрид',
    salary: 40000,
    salaryNotMain: false,
  },
  profession: 'Маркетинг',
  roles: ['Маркетолог', 'SMM-менеджер'],
  interests: ['Маркетинг', 'Медиа', 'Дизайн'],
  experiences: [
    {
      id: 'exp1', type: 'Организация мероприятий', title: 'Организация студенческого форума',
      organization: 'ВГУ', role: 'Координатор', startDate: '2024-02', endDate: '2024-04', ongoing: false,
      description: 'Координировал организацию университетского форума: взаимодействовал с участниками и партнёрами, участвовал в подготовке площадки и информационном сопровождении.',
      result: 'Форум посетили 300+ студентов, 5 партнёрских компаний', teamSize: '8 человек',
      numbers: '300+ посетителей', link: '', skills: ['Коммуникация', 'Организация мероприятий', 'Работа в команде'],
    },
    {
      id: 'exp2', type: 'Волонтёрство', title: 'Волонтёр на конференции',
      organization: 'РСО', role: 'Волонтёр', startDate: '2023-09', endDate: '2023-09', ongoing: false,
      description: 'Помогал в организации конференции: встреча гостей, навигация, координация потоков.',
      result: 'Успешно проведена конференция на 500 человек', teamSize: '20 человек',
      numbers: '500 гостей', link: '', skills: ['Коммуникация', 'Работа в команде'],
    },
  ],
  skills: [
    { name: 'VK Ads', level: 60, source: 'manual' },
    { name: 'Figma', level: 55, source: 'manual' },
    { name: 'Excel', level: 70, source: 'manual' },
    { name: 'SMM', level: 75, source: 'manual' },
    { name: 'Копирайтинг', level: 65, source: 'manual' },
  ],
  softSkills: [
    { name: 'Коммуникация', score: 85 },
    { name: 'РаботаВКоманде', score: 80 },
    { name: 'Самостоятельность', score: 75 },
    { name: 'Ответственность', score: 90 },
    { name: 'Лидерство', score: 70 },
    { name: 'Адаптивность', score: 78 },
    { name: 'КритическоеМышление', score: 72 },
    { name: 'Самоорганизация', score: 82 },
  ],
  languages: [{ name: 'Английский', level: 'B1 — Средний' }],
  driverLicense: 'B',
  businessTrips: 'Да',
  portfolioLinks: ['https://behance.net/nikita_s'],
  priorities: ['Опыт', 'Обучение', 'Наставник', 'Интересные проекты', 'Карьерный рост'],
  projects: '',
  achievements: [],
  tests: [],
  coverLetter: '',
  certificateName: '',
  certificateNumber: '',
};

export const defaultProfile: UserProfile = {
  firstName: '', lastName: '', middleName: '', birthDate: '', gender: '', city: '', region: '',
  relocation: '', phone: '', email: '', telegram: '', vk: '', photo: '',
  education: {
    level: '', institution: '', faculty: '', specialty: '', profile: '', course: '', endYear: '',
    form: '', gpa: '', achievements: [],
  },
  opportunity: {
    types: [], startWhen: '', hoursPerWeek: '', format: '', salary: 0, salaryNotMain: false,
  },
  profession: '', roles: [], interests: [], experiences: [], skills: [], softSkills: [],
  languages: [], driverLicense: '', businessTrips: '', portfolioLinks: [], priorities: [],
  projects: '', achievements: [], tests: [], coverLetter: '', certificateName: '', certificateNumber: '',
};

export function computeReadiness(profile: UserProfile): number {
  let score = 15;
  if (profile.firstName) score += 5;
  if (profile.city) score += 3;
  if (profile.education.institution) score += 8;
  if (profile.education.specialty) score += 4;
  if (profile.profession) score += 8;
  if (profile.interests.length >= 2) score += 5;
  if (profile.experiences.length >= 1) score += 15;
  if (profile.experiences.length >= 2) score += 5;
  if (profile.skills.length >= 3) score += 10;
  if (profile.skills.length >= 5) score += 5;
  if (profile.softSkills.length >= 5) score += 8;
  if (profile.languages.length >= 1) score += 4;
  if (profile.priorities.length >= 3) score += 5;
  return Math.min(100, score);
}

export function computeReadinessBreakdown(profile: UserProfile) {
  const resume = Math.min(100, 20 + (profile.firstName ? 10 : 0) + (profile.education.institution ? 20 : 0) + (profile.profession ? 15 : 0) + (profile.skills.length >= 3 ? 20 : 0) + (profile.languages.length >= 1 ? 15 : 0));
  const experience = Math.min(100, 10 + profile.experiences.length * 25 + (profile.experiences[0]?.description.length > 50 ? 15 : 0));
  const hard = Math.min(100, profile.skills.length * 15 + (profile.skills.length >= 5 ? 25 : 0));
  const soft = Math.min(100, profile.softSkills.length * 10 + (profile.softSkills.length >= 6 ? 30 : 0));
  const portfolio = Math.min(100, 20 + profile.portfolioLinks.length * 30 + (profile.experiences[0]?.link ? 20 : 0));
  const overall = Math.round((resume + experience + hard + soft + portfolio) / 5);
  return { resume, experience, hard, soft, portfolio, overall };
}

export function getStrongSides(profile: UserProfile): string[] {
  const sides: string[] = [];
  if (profile.experiences.length >= 2) sides.push('Управление проектами');
  if (profile.softSkills.find((s) => s.name === 'Коммуникация' && s.score >= 70)) sides.push('Коммуникация');
  if (profile.experiences.some((e) => e.type === 'Стартап' || e.type === 'Личные проекты')) sides.push('Инициативность');
  if (profile.softSkills.find((s) => s.name === 'Ответственность' && s.score >= 70)) sides.push('Ответственность');
  if (profile.skills.length >= 5) sides.push('Технические навыки');
  if (profile.softSkills.find((s) => s.name === 'Лидерство' && s.score >= 70)) sides.push('Лидерство');
  if (sides.length < 3) {
    if (profile.interests.length >= 3) sides.push('Широкий круг интересов');
    if (profile.languages.length >= 1) sides.push('Языковые навыки');
    sides.push('Креативность');
  }
  return sides.slice(0, 5);
}

export function getWeakSides(profile: UserProfile): { name: string; gain: string }[] {
  const weak: { name: string; gain: string }[] = [];
  if (!profile.languages.some((l) => l.name.toLowerCase().includes('англ')))
    weak.push({ name: 'Английский язык', gain: '+7 баллов к международным стажировкам' });
  if (profile.portfolioLinks.length === 0)
    weak.push({ name: 'Портфолио', gain: '+12 баллов к вакансиям маркетинга и дизайна' });
  if (profile.skills.length < 5)
    weak.push({ name: 'Hard Skills', gain: '+8 баллов к соответствию вакансиям' });
  if (profile.experiences.length < 2)
    weak.push({ name: 'Опыт', gain: '+10 баллов к карьерной готовности' });
  if (weak.length < 2) weak.push({ name: 'Сопроводительное письмо', gain: '+5 баллов к отклику' });
  return weak.slice(0, 3);
}

export function transformExperience(raw: string): string[] {
  const lower = raw.toLowerCase();
  const skills: string[] = [];
  if (lower.includes('организ') || lower.includes('мероприят'))
    skills.push('Координация команды', 'Управление проектами', 'Коммуникация', 'Работа со стейкхолдерами');
  else if (lower.includes('код') || lower.includes('програм') || lower.includes('разработ'))
    skills.push('Программирование', 'Алгоритмы', 'Работа в команде');
  else if (lower.includes('дизайн') || lower.includes('фигм'))
    skills.push('UX/UI дизайн', 'Прототипирование', 'Креативность');
  else if (lower.includes('анализ') || lower.includes('данн'))
    skills.push('Аналитика', 'Работа с данными', 'Логика');
  else skills.push('Коммуникация', 'Командная работа', 'Организация');
  return skills;
}

export function generateCoverLetter(profile: UserProfile, vacancy: Vacancy): string {
  const name = profile.firstName || 'Студент';
  const role = vacancy.title;
  const company = vacancy.company;
  const edu = profile.education.institution ? `${profile.education.institution}, ${profile.education.specialty}` : '';
  const skills = profile.skills.slice(0, 5).map((s) => s.name).join(', ');
  const exp = profile.experiences[0]?.title ? `Опыт: ${profile.experiences[0].title}` : '';
  const interests = profile.interests.slice(0, 3).join(', ');

  return `Здравствуйте, команда ${company}!

Меня зовут ${name}, я заинтересовался позицией «${role}». ${edu ? `Я учусь по направлению «${edu}» и хочу развиваться в сфере ${interests || profile.profession}.` : ''}

${skills ? `Мои ключевые навыки: ${skills}.` : ''} ${exp ? `${exp}.` : ''}

Меня привлекает возможность получить реальный опыт в ${company} и развиваться под руководством наставника. Готов начать ${profile.opportunity.startWhen.toLowerCase()} в формате ${profile.opportunity.format.toLowerCase()}.

Буду рад обсудить мою кандидатуру. Спасибо за внимание к заявке!

С уважением,
${name}`;
}

export function generateCertificateNumber(): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `CM-${y}${m}${d}-${rand}`;
}
