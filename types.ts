
export enum LeadStatus {
  NEW = 'new',
  DRAFTED = 'drafted',
  QUEUED = 'queued',
  APPROVED = 'approved',
  SENT = 'sent',
  SKIPPED = 'skipped',
  RESEARCHING = 'researching',
  SUPPRESSED = 'suppressed'
}

export enum NeedType {
  NEEDS_REBUILD = 'needs_rebuild',
  NEEDS_AUDIT = 'needs_audit',
  SERMONS_NO_CLIPS = 'sermons_no_clips',
  INACTIVE_SOCIAL = 'inactive_social',
  SPEAKER_OPPORTUNITY = 'speaker_opportunity'
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface Lead {
  id: string;
  orgName: string;
  websiteUrl: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  sourceType?: 'csv' | 'gmaps' | 'diocese_scraper' | 'manual';
  sourceMetadata?: string;
  socials: {
    ig?: string;
    fb?: string;
    yt?: string;
  };
  evidenceSnippet: string;
  tags: NeedType[];
  primaryNeed: NeedType;
  status: LeadStatus;
  ghlContactId?: string;
  errorMessage?: string;
  groundingSources?: GroundingSource[];
  createdAt: string;
  updatedAt: string;
}

export interface Draft {
  id: string;
  leadId: string;
  subject: string;
  body: string;
  createdAt: string;
  approvedAt?: string;
  sentAt?: string;
}

export interface Run {
  id: string;
  source: string;
  sourceType: 'csv' | 'gmaps' | 'diocese_scraper' | 'manual';
  startedAt: string;
  finishedAt?: string;
  stats: {
    scraped: number;
    drafted: number;
    sent: number;
    skipped: number;
  };
  status: 'running' | 'completed' | 'failed';
}

export interface SystemLog {
  id: string;
  timestamp: string;
  type: 'info' | 'error' | 'success' | 'warning';
  category: 'discovery' | 'research' | 'uplink' | 'system';
  message: string;
}

export interface Reply {
  id: string;
  leadId: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  snippet: string;
  content: string;
  receivedAt: string;
  isRead: boolean;
}

export interface SyncLog {
  id: string;
  timestamp: string;
  type: 'manual' | 'background';
  results: {
    sent: number;
    skipped: number;
  };
  details: string[];
}
