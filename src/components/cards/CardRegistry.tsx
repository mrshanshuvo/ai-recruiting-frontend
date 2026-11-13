import React from 'react';
import { ICardPart } from '../../types/chat';
import { JobConfirmationCard } from './JobConfirmationCard';

interface CardHostProps {
  cardPart: ICardPart;
}

export const CardHost: React.FC<CardHostProps> = ({ cardPart }) => {
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

