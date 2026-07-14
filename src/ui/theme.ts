import type { ClaimStatus } from '../domain/types';

export const colors = {
  background: '#f5f7fa',
  surface: '#ffffff',
  border: '#e2e8f0',
  text: '#1a202c',
  muted: '#718096',
  primary: '#2b6cb0',
  primaryText: '#ffffff',
  danger: '#c53030',
  success: '#2f855a',
};

export interface StatusMeta {
  label: string;
  color: string;
}

const STATUS_META: Record<ClaimStatus, StatusMeta> = {
  submitted: { label: 'Submitted', color: '#718096' },
  under_review: { label: 'Under review', color: '#b7791f' },
  approved: { label: 'Approved', color: '#2b6cb0' },
  partially_paid: { label: 'Partially paid', color: '#805ad5' },
  paid: { label: 'Paid', color: '#2f855a' },
  rejected: { label: 'Rejected', color: '#c53030' },
};

export function statusMeta(status: ClaimStatus): StatusMeta {
  return STATUS_META[status];
}
