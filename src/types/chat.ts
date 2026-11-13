export type MessageRole = 'user' | 'assistant' | 'system';

export type CardType =
  | 'job_confirmation'
  | 'sourcing_confirmation'
  | 'candidate_table'
  | 'campaign_preview'
  | 'reply_draft'
  | 'status_update'
  | 'booking_link'
  | 'stats_summary';

export type CardStatus = 'pending' | 'confirmed' | 'cancelled' | 'expired';

export interface ICardPart {
  type: 'card';
  card: {
    cardType: CardType;
    actionId?: string;
    status: CardStatus;
    payload: Record<string, any>;
  };
}

export interface ITextPart {
  type: 'text';
  text: string;
}

export type IMessagePart = ITextPart | ICardPart;

export interface Message {
  _id: string;
  conversationId: string;
  role: MessageRole;
  parts: IMessagePart[];
  createdAt: string;
}

export interface SourcingProgress {
  jobId: string;
  found: number;
  scored: number;
  total: number;
  status: string;
}

