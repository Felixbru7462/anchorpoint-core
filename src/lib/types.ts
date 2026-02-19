export type JobStatus = 'SCHEDULED' | 'EN_ROUTE' | 'ON_SITE' | 'COMPLETED';

export const STATUS_SEQUENCE: JobStatus[] = ['SCHEDULED', 'EN_ROUTE', 'ON_SITE', 'COMPLETED'];

export interface Job {
  id: string;
  created_at: string;
  description: string;
  status: JobStatus;
  location_id: string;
  vendor_id: string;
  locations?: { name: string };
  vendors?: { name: string };
}
