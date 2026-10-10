import type { CandidateProfile, GuardianVerificationStatus } from '@/types/platform';

export function canPublishResume(profile: CandidateProfile): boolean {
  if (!profile.isMinor) return true;
  return profile.guardianVerificationStatus === 'verified';
}

export function canShareContacts(profile: CandidateProfile): boolean {
  if (!profile.isMinor) return true;
  return profile.guardianVerificationStatus === 'verified';
}

export function canApplyToVacancy(profile: CandidateProfile): boolean {
  if (!profile.isMinor) return true;
  return profile.guardianVerificationStatus === 'verified';
}

export function isGuardianRequired(profile: CandidateProfile): boolean {
  return profile.isMinor && profile.guardianVerificationStatus === 'required';
}

export function isGuardianPending(profile: CandidateProfile): boolean {
  return profile.isMinor && profile.guardianVerificationStatus === 'pending';
}

export function isGuardianVerified(profile: CandidateProfile): boolean {
  return !profile.isMinor || profile.guardianVerificationStatus === 'verified';
}

export function isGuardianRejected(profile: CandidateProfile): boolean {
  return profile.isMinor && profile.guardianVerificationStatus === 'rejected';
}
