export type TriggerSettings = {
  orderId: number;
  scheduledDate: string;
  customerEmail: string;
  subscriberId: number;
  customerName?: string;
};

export type EmailOptions = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from: {
    name: string;
    email: string;
  };
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
  // eslint-disable-next-line
  metadata?: Record<string, any>;
  trackOpens?: boolean;
  trackClicks?: boolean;
};

export type EmailResult = {
  success: boolean;
  messageId?: string;
  providerResponse?: unknown;
  error?: unknown;
};

export type Step = {
  id: number;
  isActive: boolean;
  automationId: number;
  stepOrder: number;
  stepType: string;
  subject: string | null;
  content: string | null;
  templateId: number | null;
  waitDuration: number | null;
  conditions: unknown;
};

export type Automation = {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  description: string | null;
  triggerType: string;
  triggerSettings: TriggerSettings;
  status: string;
};

export type Template = {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  subject: string;
  content: string;
  previewText: string | null;
  category: string | null;
  metadata: unknown;
};

export type EmailConfig = {
  id: number;
  providerType: string;
  providerConfig: unknown;
  defaultFromName: string;
  defaultFromEmail: string;
  defaultReplyTo: string | null;
  sendLimit: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};
