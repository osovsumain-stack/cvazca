import { notificationRepository } from '@/repositories/featureRepositories';
import type { AppNotification } from '@/types/platform';

export async function notify(
  accountId: string,
  type: AppNotification['type'],
  title: string,
  message: string,
  link?: string,
): Promise<void> {
  const existing = await notificationRepository.getByAccount(accountId);
  const isDuplicate = existing.some(
    (n) => n.type === type && n.title === title && n.message === message,
  );
  if (isDuplicate) return;
  await notificationRepository.create({
    accountId,
    type,
    title,
    message,
    link: link ?? null,
    read: false,
  });
}

export async function notifyVacancyApproved(accountId: string, vacancyTitle: string): Promise<void> {
  await notify(accountId, 'vacancy_approved', 'Вакансия одобрена', `Вакансия «${vacancyTitle}» прошла модерацию и опубликована.`, '/business/team');
}

export async function notifyVacancyRejected(accountId: string, vacancyTitle: string, comment: string): Promise<void> {
  await notify(accountId, 'vacancy_rejected', 'Вакансия отклонена', `Вакансия «${vacancyTitle}» отклонена: ${comment}`, '/business/team');
}

export async function notifyNewApplication(accountId: string, vacancyTitle: string, candidateName: string): Promise<void> {
  await notify(accountId, 'new_application', 'Новый отклик', `Новый отклик на вакансию «${vacancyTitle}» от ${candidateName}.`, '/business/applications');
}

export async function notifyProjectStatusChanged(accountId: string, projectTitle: string, newStatus: string): Promise<void> {
  await notify(accountId, 'project_status_changed', 'Статус проекта изменён', `Проект «${projectTitle}» перешёл в статус: ${newStatus}.`, '/business/projects');
}

export async function notifyGuardianVerified(accountId: string): Promise<void> {
  await notify(accountId, 'guardian_verified', 'Согласие получено', 'Согласие законного представителя подтверждено. Профиль разблокирован.', '/career/profile');
}
