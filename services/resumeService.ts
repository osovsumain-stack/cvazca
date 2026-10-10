import { repositories } from '@/repositories';
import { canPublishResume, canShareContacts } from '@/services/guardianPermissionService';
import type { Resume, CandidateProfile, PublicResume } from '@/types/platform';

export class PermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermissionError';
  }
}

export async function publishResume(resumeId: string, profile: CandidateProfile): Promise<Resume> {
  if (!canPublishResume(profile)) {
    throw new PermissionError('Для публикации резюме требуется подтверждение родителя или законного представителя.');
  }
  const resume = await repositories.resume.getById(resumeId);
  if (!resume) throw new Error('Резюме не найдено');
  const updated: Resume = { ...resume, isPublic: true };
  await repositories.resume.update(updated);
  return updated;
}

export async function unpublishResume(resumeId: string): Promise<Resume> {
  const resume = await repositories.resume.getById(resumeId);
  if (!resume) throw new Error('Резюме не найдено');
  const updated: Resume = { ...resume, isPublic: false };
  await repositories.resume.update(updated);
  return updated;
}

export async function toggleResumePublic(resumeId: string, profile: CandidateProfile): Promise<Resume> {
  const resume = await repositories.resume.getById(resumeId);
  if (!resume) throw new Error('Резюме не найдено');
  if (!resume.isPublic) {
    return publishResume(resumeId, profile);
  }
  return unpublishResume(resumeId);
}

export function getEffectiveVisibility(resume: Resume, profile: CandidateProfile): Resume['visibility'] {
  if (canShareContacts(profile)) {
    return resume.visibility;
  }
  return { ...resume.visibility, showEmail: false, showPhone: false };
}

export function getSharedContacts(profile: CandidateProfile): { email?: string; phone?: string } {
  if (!canShareContacts(profile)) return {};
  const contacts: { email?: string; phone?: string } = {};
  if (profile.email) contacts.email = profile.email;
  if (profile.phone) contacts.phone = profile.phone;
  return contacts;
}

export function toPublicResume(resume: Resume, profile: CandidateProfile): PublicResume | null {
  if (!resume.isPublic) return null;
  const canShare = canShareContacts(profile);
  return {
    id: resume.id,
    publicSlug: resume.publicSlug,
    title: resume.title,
    targetPosition: resume.targetPosition,
    summary: resume.summary,
    skills: resume.skills,
    showCity: canShare ? resume.visibility.showCity : false,
    city: canShare && resume.visibility.showCity ? profile.city : undefined,
    educationIncluded: resume.educationIncluded,
    createdAt: resume.createdAt,
    updatedAt: resume.updatedAt,
  };
}
