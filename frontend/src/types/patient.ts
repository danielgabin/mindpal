/**
 * TypeScript types for patient management.
 */

export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  date_of_birth: string; // ISO date string
  age: number;
  is_minor: boolean;
  email?: string | null;
  phone?: string | null;
  appointment_reason?: string | null;
  tutor_name?: string | null;
  tutor_phone?: string | null;
  tutor_email?: string | null;
  tutor_relationship?: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PatientListItem {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  age: number;
  is_minor: boolean;
  email?: string | null;
  phone?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface PatientCreate {
  first_name: string;
  last_name: string;
  date_of_birth: string; // ISO date string (YYYY-MM-DD)
  email?: string;
  phone?: string;
  appointment_reason?: string;
  tutor_name?: string;
  tutor_phone?: string;
  tutor_email?: string;
  tutor_relationship?: string;
}

export interface PatientUpdate {
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  email?: string;
  phone?: string;
  appointment_reason?: string;
  tutor_name?: string;
  tutor_phone?: string;
  tutor_email?: string;
  tutor_relationship?: string;
  is_active?: boolean;
}

export type EntityType = 'symptom' | 'medication' | 'feeling';

export interface PatientEntity {
  id: string;
  patient_id: string;
  type: EntityType;
  value: string;
  created_by: string;
  created_at: string;
}

export interface PatientEntityCreate {
  type: EntityType;
  value: string;
}
