// Contact type definitions for BeeTagged
export interface Contact {
  id: string;
  name: string;
  company: string;
  jobTitle: string;
  industry: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  howWeMet: string;
  notes?: string;
  tags: string[];
  createdAt: Date;
  updatedAt?: Date;
  source?: 'linkedin' | 'facebook' | 'phone' | 'manual';
  location?: string;
  position?: string;
  profileImage?: string;
  facebookId?: string;
  connectedOn?: string;
  url?: string;
}

export interface ContactImportResult {
  success: boolean;
  count: number;
  processed: number;
  skipped?: number;
  message: string;
  contacts?: Contact[];
}

export interface ImportStats {
  total: number;
  successful: number;
  failed: number;
  duplicates: number;
}