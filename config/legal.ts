export const LEGAL_EMAIL = import.meta.env.VITE_LEGAL_EMAIL || '[LEGAL_EMAIL]';
export const LEGAL_ADDRESS = import.meta.env.VITE_LEGAL_ADDRESS || '[LEGAL_ADDRESS]';
export const PRODUCTION_DOMAIN = import.meta.env.VITE_PRODUCTION_DOMAIN || '[PRODUCTION_DOMAIN]';
export const LEGAL_OPERATOR = {
  operatorName: 'ИП Шелопугин Никита Матвеевич',
  inn: '360503291360', ogrnip: '324366800113504',
  email: LEGAL_EMAIL, address: LEGAL_ADDRESS, website: PRODUCTION_DOMAIN,
};
export function isLegalConfigComplete(): boolean { return ![LEGAL_EMAIL,LEGAL_ADDRESS,PRODUCTION_DOMAIN].some(v=>v.includes('[')); }
