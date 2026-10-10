import type { AdvertisingPlacement } from '@/types/platform';

const OPERATOR = 'ИП Шелопугин Никита Матвеевич';
const PERIOD = '01.10.2023–06.10.2026';

const COMMUNITIES = {
  vsu: {
    providerName: 'ВГУ',
    providerId: 'vk-vsumain',
    sourceUrl: 'https://vk.ru/vsumain',
    audience: 'Студенты, абитуриенты, выпускники и сотрудники ВГУ',
    metrics: { contentViews: 19_100_000, contentReach: 503_600, period: PERIOD },
  },
  error: {
    providerName: 'ERROR',
    providerId: 'vk-careererror',
    sourceUrl: 'https://vk.ru/careererror',
    audience: 'Разработчики, начинающие IT-специалисты и молодежная аудитория',
    metrics: { followers: 12_900, contentViews: 6_900_000, contentReach: 1_100_000, period: '01.10.2023–04.10.2026' },
  },
  creator: {
    providerName: 'КРЕАТОР',
    providerId: 'vk-careercreators',
    sourceUrl: 'https://vk.ru/careercreators',
    audience: 'Авторы контента, SMM-специалисты, дизайнеры и студенты',
    metrics: { followers: 4_800, contentViews: 2_000_000, contentReach: 256_200, period: PERIOD },
  },
  studcareer: {
    providerName: 'СТУДКАРЬЕРА',
    providerId: 'vk-sovetcareer',
    sourceUrl: 'https://vk.ru/sovetcareer',
    audience: 'Студенты, выпускники и молодые специалисты 16–35 лет',
    metrics: { followers: 2_100, contentViews: 1_800_000, contentReach: 254_800, period: PERIOD },
  },
} satisfies Record<string, Pick<AdvertisingPlacement, 'providerName' | 'providerId' | 'sourceUrl' | 'audience' | 'metrics'>>;

interface VkPlacementInput {
  id: string;
  community: keyof typeof COMMUNITIES;
  name: string;
  city: string;
  format: string;
  basePrice: number;
  period: string;
  reach: number;
  description: string;
  requirements: string[];
  priceNote: string;
}

function vkPlacement(input: VkPlacementInput): AdvertisingPlacement {
  const community = COMMUNITIES[input.community];
  return {
    id: input.id,
    name: input.name,
    category: 'vk',
    city: input.city,
    format: input.format,
    basePrice: input.basePrice,
    period: input.period,
    reach: null,
    description: input.description,
    imageUrl: null,
    providerName: community.providerName,
    providerId: community.providerId,
    requirements: input.requirements,
    gallery: [],
    isAvailable: true,
    sourceUrl: community.sourceUrl,
    audience: community.audience,
    metrics: null,
    priceNote: input.priceNote,
    isPilot: true,
    operatorName: OPERATOR,
  };
}

const POST_REQUIREMENTS = ['Текст до 1500 знаков', 'До 5 изображений или видео', 'Данные рекламодателя для маркировки'];
const STORY_REQUIREMENTS = ['Вертикальный макет 1080×1920', 'Видео до 15 секунд', 'Ссылка и короткий призыв к действию'];
const PACKAGE_REQUIREMENTS = ['Один оффер на весь пакет', 'Материалы передаются минимум за 3 рабочих дня', 'График выходов согласуется заранее'];

export const INITIAL_ADVERTISING_PLACEMENTS: AdvertisingPlacement[] = [
  vkPlacement({
    id: 'vk-vsu-post', community: 'vsu', name: 'ВГУ — нативная публикация', city: 'Воронеж', format: 'Пост в сообществе', basePrice: 10_000, period: '1 публикация', reach: 20_000,
    description: 'Информационная или нативная публикация в сообществе ВГУ. Подходит для образовательных, молодежных, карьерных и городских проектов.',
    requirements: ['Текст и визуал проходят редакционное согласование', ...POST_REQUIREMENTS],
    priceNote: 'Стартовая цена. Размещение возможно только после согласования редакцией сообщества.',
  }),
  vkPlacement({
    id: 'vk-vsu-story', community: 'vsu', name: 'ВГУ — история', city: 'Воронеж', format: 'VK История', basePrice: 4_000, period: '24 часа', reach: 8_000,
    description: 'Полноэкранная история для анонса события, набора участников, регистрации или короткой промоакции.',
    requirements: ['Текст и визуал проходят редакционное согласование', ...STORY_REQUIREMENTS],
    priceNote: 'Стартовая цена за одну историю после редакционного согласования.',
  }),
  vkPlacement({
    id: 'vk-vsu-combo', community: 'vsu', name: 'ВГУ — пост + 2 истории', city: 'Воронеж', format: 'Пакет', basePrice: 13_000, period: 'До 3 дней', reach: 28_000,
    description: 'Нативная публикация и две истории для повторного контакта с аудиторией ВГУ.',
    requirements: ['Редакционное согласование обязательно', ...PACKAGE_REQUIREMENTS],
    priceNote: 'Пакетная стартовая цена. Даты подтверждаются отдельно.',
  }),
  vkPlacement({
    id: 'vk-error-post', community: 'error', name: 'ERROR — рекламный пост', city: 'РФ', format: 'Пост в сообществе', basePrice: 4_500, period: '1 публикация', reach: 8_000,
    description: 'Нативный пост в сообществе «ERROR: мемы, разработка, карьера» для IT-вакансий, курсов и digital-сервисов.',
    requirements: POST_REQUIREMENTS,
    priceNote: 'Стартовая цена за пост без закрепления.',
  }),
  vkPlacement({
    id: 'vk-error-story', community: 'error', name: 'ERROR — история', city: 'РФ', format: 'VK История', basePrice: 1_800, period: '24 часа', reach: 3_500,
    description: 'История с коротким оффером и ссылкой для регистрации, промокода или анонса.',
    requirements: STORY_REQUIREMENTS,
    priceNote: 'Стартовая цена за одну историю.',
  }),
  vkPlacement({
    id: 'vk-error-combo', community: 'error', name: 'ERROR — пост + 2 истории', city: 'РФ', format: 'Пакет', basePrice: 5_900, period: 'До 3 дней', reach: 12_000,
    description: 'Пост и две поддерживающие истории для вакансии, образовательного продукта или запуска сервиса.',
    requirements: PACKAGE_REQUIREMENTS,
    priceNote: 'Публикации распределяются в течение трех дней.',
  }),
  vkPlacement({
    id: 'vk-error-native', community: 'error', name: 'ERROR — нативная интеграция', city: 'РФ', format: 'Мем / клип / спецпост', basePrice: 7_500, period: '1 интеграция', reach: 15_000,
    description: 'Креативная интеграция продукта в стилистике сообщества: мем, короткий клип или авторский спецпост.',
    requirements: ['Креативный бриф', 'До двух итераций согласования', 'Сложное производство оценивается отдельно'],
    priceNote: 'Базовая разработка идеи включена. Съемка и сложный дизайн рассчитываются отдельно.',
  }),
  vkPlacement({
    id: 'vk-creator-post', community: 'creator', name: 'КРЕАТОР — рекламный пост', city: 'РФ', format: 'Пост в сообществе', basePrice: 2_500, period: '1 публикация', reach: 3_000,
    description: 'Публикация для вакансий, стажировок, курсов и инструментов создателей контента.',
    requirements: POST_REQUIREMENTS,
    priceNote: 'Стартовая цена за одну публикацию.',
  }),
  vkPlacement({
    id: 'vk-creator-story', community: 'creator', name: 'КРЕАТОР — история', city: 'РФ', format: 'VK История', basePrice: 1_000, period: '24 часа', reach: 1_500,
    description: 'История для короткого анонса, промокода, стажировки или продвижения контентного продукта.',
    requirements: STORY_REQUIREMENTS,
    priceNote: 'Стартовая цена за одну историю.',
  }),
  vkPlacement({
    id: 'vk-creator-combo', community: 'creator', name: 'КРЕАТОР — пост + 2 истории', city: 'РФ', format: 'Пакет', basePrice: 3_200, period: 'До 3 дней', reach: 4_500,
    description: 'Компактный пакет для запуска курса, вакансии или набора участников.',
    requirements: PACKAGE_REQUIREMENTS,
    priceNote: 'Стартовая пакетная цена.',
  }),
  vkPlacement({
    id: 'vk-studcareer-post', community: 'studcareer', name: 'СТУДКАРЬЕРА — карьерная публикация', city: 'Воронеж', format: 'Пост в сообществе', basePrice: 2_000, period: '1 публикация', reach: 2_500,
    description: 'Тематическая публикация о вакансии, стажировке, образовательной программе или карьерном событии.',
    requirements: ['Карьерная или образовательная тематика', ...POST_REQUIREMENTS],
    priceNote: 'Стартовая цена за одну тематическую публикацию.',
  }),
  vkPlacement({
    id: 'vk-studcareer-story', community: 'studcareer', name: 'СТУДКАРЬЕРА — история', city: 'Воронеж', format: 'VK История', basePrice: 900, period: '24 часа', reach: 1_200,
    description: 'История с призывом зарегистрироваться, откликнуться на вакансию или пройти тест.',
    requirements: STORY_REQUIREMENTS,
    priceNote: 'Стартовая цена за одну историю.',
  }),
  vkPlacement({
    id: 'vk-studcareer-combo', community: 'studcareer', name: 'СТУДКАРЬЕРА — пост + 2 истории', city: 'Воронеж', format: 'Пакет', basePrice: 2_600, period: 'До 3 дней', reach: 3_800,
    description: 'Пакет для работодателей и образовательных проектов: подробная публикация и две истории.',
    requirements: PACKAGE_REQUIREMENTS,
    priceNote: 'Стартовая пакетная цена.',
  }),
  vkPlacement({
    id: 'vk-studcareer-selection', community: 'studcareer', name: 'СТУДКАРЬЕРА — подборка возможностей', city: 'Воронеж', format: 'Спецпроект + история', basePrice: 4_000, period: '1 подборка', reach: 5_000,
    description: 'Расширенная подборка вакансий, стажировок или образовательных возможностей с поддерживающей историей.',
    requirements: ['До 5 позиций или один расширенный оффер', 'Ссылки и сроки по каждой возможности', 'Базовая редактура включена'],
    priceNote: 'Включена базовая редактура и упаковка материалов.',
  }),
];
