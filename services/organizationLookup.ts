import type { OrganizationLookupResult, BankLookupResult } from '@/types/platform';
import { apiRequest } from '@/repositories/transport';
export function lookupOrganizationByInn(inn:string):Promise<OrganizationLookupResult>{return apiRequest('/api/lookup/organization',{inn});}
export function lookupBankByBik(bik:string):Promise<BankLookupResult>{return apiRequest('/api/lookup/bank',{bik});}
