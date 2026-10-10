import { repositories } from '@/repositories';
import { projectNumberGenerator } from '@/services/projectNumberGenerator';
import type { BusinessProject, BusinessProjectStatus } from '@/types/platform';

const statusMessages: Record<BusinessProjectStatus, string> = {
  draft: 'Проект создан',
  calculated: 'Расчёт подготовлен',
  documents: 'Документы подготовлены',
  payment_pending: 'Ожидается оплата',
  paid: 'Оплачено',
  in_progress: 'Проект в работе',
  completed: 'Проект завершён',
  cancelled: 'Проект отменён',
};

const allowedTransitions: Record<BusinessProjectStatus, BusinessProjectStatus[]> = {
  draft: ['calculated', 'cancelled'],
  calculated: ['documents', 'cancelled'],
  documents: ['payment_pending', 'cancelled'],
  payment_pending: ['paid', 'cancelled'],
  paid: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export function getAllowedTransitions(status: BusinessProjectStatus): BusinessProjectStatus[] {
  return allowedTransitions[status] || [];
}

export function isValidTransition(from: BusinessProjectStatus, to: BusinessProjectStatus): boolean {
  if (from === to) return false;
  return allowedTransitions[from]?.includes(to) ?? false;
}

export async function updateProjectStatus(
  projectId: string,
  newStatus: BusinessProjectStatus,
  actorAccountId: string,
): Promise<void> {
  const project = await repositories.businessProject.getById(projectId);
  if (!project) throw new Error('Проект не найден');
  if (!isValidTransition(project.status, newStatus)) {
    throw new Error(`Недопустимый переход статуса: ${project.status} → ${newStatus}`);
  }
  await repositories.businessProject.update({ ...project, status: newStatus });
  await repositories.projectEvent.create({
    projectId,
    type: newStatus,
    actorAccountId,
    message: statusMessages[newStatus] || `Статус: ${newStatus}`,
  });
}
