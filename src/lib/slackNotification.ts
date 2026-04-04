import * as Sentry from '@sentry/browser';
import { request } from '@/api/apiClient';
import { QuoteInput, QuoteResult } from '@/types';
import { COUNTRY_OPTIONS } from '@/config/options';
import { formatKRW, formatUSD, formatNum } from './format';

interface SlackMemberInfo {
  name: string;
  email: string;
  company?: string;
}

function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return email;
  return `${localPart.slice(0, 1)}***@${domain}`;
}

export const sendQuoteSlackNotification = async (
  input: QuoteInput,
  result: QuoteResult,
  referenceNo: string,
  member: SlackMemberInfo
): Promise<void> => {
  const country = COUNTRY_OPTIONS.find(c => c.code === input.destinationCountry)?.name || input.destinationCountry;
  const carrier = input.overseasCarrier || 'UPS';
  const memberLine = member.company
    ? `${member.company} / ${member.name} / ${maskEmail(member.email)}`
    : `${member.name} / ${maskEmail(member.email)}`;

  try {
    await request('/api/v1/notifications/slack', {
      method: 'POST',
      body: JSON.stringify({
        referenceNo,
        member: memberLine,
        carrier,
        destination: country,
        billableWeight: formatNum(result.billableWeight),
        totalQuote: `${formatKRW(result.totalQuoteAmount)} (${formatUSD(result.totalQuoteAmountUSD)})`,
        discount: `${result.discountPercent.toFixed(1)}%`,
      }),
    });
  } catch (e) {
    // Slack notification is best-effort; never block the save flow
    Sentry.captureException(e);
  }
};
