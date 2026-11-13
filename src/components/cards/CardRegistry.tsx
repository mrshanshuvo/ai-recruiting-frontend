import React from 'react';
import { ICardPart, SourcingProgress } from '../../types/chat';
import { JobConfirmationCard } from './JobConfirmationCard';
import { SourcingConfirmationCard } from './SourcingConfirmationCard';

interface CardHostProps {
  cardPart: ICardPart;
  sourcingProgress?: Record<string, SourcingProgress>;
}

export const CardHost: React.FC<CardHostProps> = ({ cardPart, sourcingProgress }) => {
  const { card } = cardPart;

  switch (card.cardType) {
    case 'job_confirmation':
      return (
        <JobConfirmationCard
          actionId={card.actionId}
          status={card.status}
          payload={card.payload}
        />
      );

    case 'sourcing_confirmation':
      return (
        <SourcingConfirmationCard
          actionId={card.actionId}
          status={card.status}
          payload={card.payload as any}
          progress={card.payload?.jobId ? sourcingProgress?.[card.payload.jobId] : undefined}
        />
      );

    default:
      return (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm my-2">
          <div className="text-xs font-semibold uppercase text-indigo-600 mb-2">
            Card: {card.cardType} ({card.status})
          </div>
          <pre className="text-xs bg-slate-50 p-2 rounded overflow-x-auto text-slate-700">
            {JSON.stringify(card.payload, null, 2)}
          </pre>
        </div>
      );
  }
};

