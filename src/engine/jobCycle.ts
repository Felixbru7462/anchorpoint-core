// src/engine/jobCycle.ts

export type JobStatus = 'REQUESTED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'REPORTED' | 'VERIFIED' | 'FLAGGED' | 'CLOSED';

export const STATUS_ORDER: JobStatus[] = [
  'REQUESTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'REPORTED', 'VERIFIED', 'FLAGGED', 'CLOSED'
];

export const JobEngine = {
  canRoleHandleStatus: (role: 'CUSTOMER' | 'VENDOR', status: string): boolean => {
    const s = status.toUpperCase();
    const vendorPower = ['REQUESTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED'];
    const customerPower = ['REPORTED', 'VERIFIED', 'FLAGGED'];
    
    if (role === 'VENDOR') return vendorPower.includes(s);
    if (role === 'CUSTOMER') return customerPower.includes(s);
    return false;
  },

  validateTransition: (nextStatus: JobStatus, evidence: any[] = []): { allowed: boolean; reason?: string } => {
    const hasPhoto = evidence?.some(e => e.evidence_type === 'photo');
    const hasReport = evidence?.some(e => e.evidence_type === 'report');

    if (nextStatus === 'COMPLETED' && !hasPhoto) {
      return { allowed: false, reason: "Physical proof (photo/logs) is missing." };
    }
    if (nextStatus === 'REPORTED' && !hasReport) {
      return { allowed: false, reason: "Final service report is missing." };
    }
    return { allowed: true };
  }
};
