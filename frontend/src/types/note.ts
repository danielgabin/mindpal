/**
 * TypeScript types for clinical notes and versions.
 */

export type NoteKind = 'conceptualization' | 'followup' | 'split';

export interface Note {
  id: string;
  patient_id: string;
  author_id: string;
  parent_note_id?: string | null;
  kind: NoteKind;
  title: string;
  content_markdown: string;
  created_at: string;
  updated_at: string;
  current_version: number;
}

export interface NoteListItem {
  id: string;
  title: string;
  kind: NoteKind;
  patient_id: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  version_count: number;
}

export interface NoteCreate {
  patient_id: string;
  title: string;
  content_markdown: string;
  kind: NoteKind;
  parent_note_id?: string;
}

export interface NoteUpdate {
  title?: string;
  content_markdown?: string;
}

export interface NoteVersion {
  id: string;
  note_id: string;
  editor_id: string;
  content_markdown: string;
  version_number: number;
  created_at: string;
}
