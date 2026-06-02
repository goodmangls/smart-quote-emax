import React, { useState } from 'react';
import * as Sentry from '@sentry/browser';
import { QuoteDetail, QuoteStatus } from '@/types';
import { X, Package, DollarSign, TrendingUp, Copy, Mail, Loader2, Link2 } from 'lucide-react';
import { formatNum } from '@/lib/format';
import { updateQuoteStatus, sendQuoteEmail } from '@/api/quoteApi';
import { createShareLink } from '@/api/shareApi';
import { STATUS_COLORS } from '../constants';
import { useToast } from '@/components/ui/Toast';

interface Props {
  quote: QuoteDetail;
  onClose: () => void;
  onDuplicate?: (quote: QuoteDetail) => void;
  onStatusChange?: (id: number, newStatus: QuoteStatus) => void;
}

const STATUS_FLOW: QuoteStatus[] = [
  'draft',
  'sent',
  'confirmed',
  'accepted',
  'rejected',
  'expired',
];

export const QuoteDetailModal: React.FC<Props> = ({
  quote,
  onClose,
  onDuplicate,
  onStatusChange,
}) => {
  const fmt = formatNum;
  const [currentStatus, setCurrentStatus] = useState<QuoteStatus>(quote.status);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailName, setEmailName] = useState('');
  const [emailMsg, setEmailMsg] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const { toast } = useToast();

  const handleSendEmail = async () => {
    if (!emailTo.trim()) return;
    setEmailSending(true);
    try {
      await sendQuoteEmail(quote.id, emailTo, emailName || undefined, emailMsg || undefined);
      setEmailSent(true);
      setCurrentStatus('sent');
      onStatusChange?.(quote.id, 'sent');
      toast('success', `Quote sent to ${emailTo}`);
      setTimeout(() => {
        setShowEmailForm(false);
        setEmailSent(false);
      }, 2000);
    } catch (e) {
      Sentry.captureException(e);
      toast('error', 'Failed to send email');
    } finally {
      setEmailSending(false);
    }
  };

  const handleShareLink = async () => {
    setShareLoading(true);
    try {
      const { shareUrl } = await createShareLink(quote.id);
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      toast('success', 'Share link copied to clipboard');
      setTimeout(() => setShareCopied(false), 2000);
    } catch (e) {
      Sentry.captureException(e);
      toast('error', 'Failed to create share link');
    } finally {
      setShareLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: QuoteStatus) => {
    if (newStatus === currentStatus) return;
    setIsUpdating(true);
    try {
      await updateQuoteStatus(quote.id, newStatus);
      setCurrentStatus(newStatus);
      onStatusChange?.(quote.id, newStatus);
      toast('info', `Status updated to ${newStatus}`);
    } catch (e) {
      Sentry.captureException(e);
      toast('error', 'Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4'
      role='dialog'
      aria-modal='true'
      aria-labelledby='modal-title'
    >
      {/* Backdrop */}
      <div className='absolute inset-0 bg-black/50 backdrop-blur-sm' onClick={onClose} />

      {/* Modal */}
      <div className='relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl'>
        {/* Header */}
        <div className='sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 rounded-t-2xl'>
          <div>
            <h3 id='modal-title' className='text-lg font-bold text-gray-900 dark:text-white'>
              {quote.referenceNo}
            </h3>
            <div className='flex items-center gap-2 mt-1'>
              <p className='text-xs text-gray-500 dark:text-gray-400'>
                Created {new Date(quote.createdAt).toLocaleString('ko-KR')}
              </p>
              <div className='flex items-center gap-1'>
                {STATUS_FLOW.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    disabled={isUpdating}
                    aria-label={`Set status to ${s}`}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize transition-all ${
                      s === currentStatus
                        ? `${STATUS_COLORS[s]} ring-1 ring-current`
                        : 'text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700'
                    } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <button
              onClick={() => setShowEmailForm(!showEmailForm)}
              className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-300 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 transition-colors'
              aria-label='Send quote via email'
            >
              <Mail className='w-3.5 h-3.5' />
              Email
            </button>
            <button
              onClick={handleShareLink}
              disabled={shareLoading}
              className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-400 dark:hover:text-emerald-300 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 transition-colors disabled:opacity-50'
              aria-label='Share quote via link'
            >
              {shareLoading ? (
                <Loader2 className='w-3.5 h-3.5 animate-spin' />
              ) : (
                <Link2 className='w-3.5 h-3.5' />
              )}
              {shareCopied ? 'Link Copied!' : 'Share Link'}
            </button>
            {onDuplicate && (
              <button
                onClick={() => onDuplicate(quote)}
                className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-emax-600 hover:text-emax-700 bg-emax-50 hover:bg-emax-100 dark:text-emax-400 dark:hover:text-emax-300 dark:bg-emax-900/30 dark:hover:bg-emax-900/50 transition-colors'
                aria-label='Duplicate this quote'
              >
                <Copy className='w-3.5 h-3.5' />
                Duplicate
              </button>
            )}
            <button
              onClick={onClose}
              aria-label='Close modal'
              className='p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
            >
              <X className='w-5 h-5' />
            </button>
          </div>
        </div>

        <div className='px-6 py-5 space-y-6'>
          {/* Email Form */}
          {showEmailForm && (
            <div className='bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 space-y-2 border border-blue-200 dark:border-blue-800'>
              <div className='grid grid-cols-2 gap-2'>
                <input
                  type='email'
                  required
                  placeholder='Recipient email *'
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  className='px-2.5 py-1.5 text-xs rounded border border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
                />
                <input
                  placeholder='Recipient name'
                  value={emailName}
                  onChange={(e) => setEmailName(e.target.value)}
                  className='px-2.5 py-1.5 text-xs rounded border border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
                />
              </div>
              <input
                placeholder='Optional message'
                value={emailMsg}
                onChange={(e) => setEmailMsg(e.target.value)}
                className='w-full px-2.5 py-1.5 text-xs rounded border border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
              />
              <div className='flex justify-end'>
                <button
                  onClick={handleSendEmail}
                  disabled={emailSending || !emailTo.trim() || emailSent}
                  className='flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors'
                >
                  {emailSending ? (
                    <Loader2 className='w-3 h-3 animate-spin' />
                  ) : (
                    <Mail className='w-3 h-3' />
                  )}
                  {emailSent ? 'Sent!' : 'Send Quote'}
                </button>
              </div>
            </div>
          )}

          {/* Key Metrics */}
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
            <MetricCard
              icon={<DollarSign className='w-4 h-4 text-emax-500' />}
              label='Quote Amount'
              value={`${fmt(quote.totalQuoteAmount)} KRW`}
            />
            <MetricCard
              icon={<DollarSign className='w-4 h-4 text-blue-500' />}
              label='USD'
              value={`$${quote.totalQuoteAmountUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            />
            <MetricCard
              icon={<TrendingUp className='w-4 h-4 text-green-500' />}
              label='Discount'
              value={`${quote.discountPercent.toFixed(1)}%`}
            />
            <MetricCard
              icon={<Package className='w-4 h-4 text-amber-500' />}
              label='Billable Wt'
              value={`${quote.billableWeight.toFixed(1)} kg`}
            />
          </div>

          {/* Route & Service */}
          <Section title='Route & Service'>
            <div className='grid grid-cols-2 gap-x-6 gap-y-2 text-sm'>
              <Field label='Origin' value={quote.originCountry} />
              <Field
                label='Destination'
                value={`${quote.destinationCountry} ${quote.destinationZip || ''}`}
              />
              <Field
                label='Shipping Mode'
                value={quote.incoterm === 'DAP' ? 'Door-to-Door' : quote.incoterm}
              />
              <Field label='Packing' value={quote.packingType} />
              <Field label='Zone' value={quote.appliedZone || '-'} />
              <Field
                label='Exchange Rate'
                value={`${quote.exchangeRate.toLocaleString()} KRW/USD`}
              />
              <Field label='FSC' value={`${quote.fscPercent.toFixed(2)}%`} />
              <Field
                label='Validity'
                value={
                  quote.validityDate
                    ? new Date(quote.validityDate).toLocaleDateString('ko-KR')
                    : '-'
                }
              />
            </div>
          </Section>

          {/* Cargo Items */}
          <Section title='Cargo Items'>
            <div className='overflow-x-auto'>
              <table className='w-full text-xs'>
                <thead>
                  <tr className='text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700'>
                    <th className='text-left py-2 pr-3'>#</th>
                    <th className='text-right py-2 px-2'>W(cm)</th>
                    <th className='text-right py-2 px-2'>L(cm)</th>
                    <th className='text-right py-2 px-2'>H(cm)</th>
                    <th className='text-right py-2 px-2'>Wt(kg)</th>
                    <th className='text-right py-2 pl-2'>Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.items.map((item, i) => (
                    <tr
                      key={i}
                      className='border-b border-gray-50 dark:border-gray-700/50 text-gray-700 dark:text-gray-300'
                    >
                      <td className='py-2 pr-3'>{i + 1}</td>
                      <td className='text-right py-2 px-2'>{item.width}</td>
                      <td className='text-right py-2 px-2'>{item.length}</td>
                      <td className='text-right py-2 px-2'>{item.height}</td>
                      <td className='text-right py-2 px-2'>{item.weight}</td>
                      <td className='text-right py-2 pl-2'>{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* Cost Breakdown */}
          <Section title='Cost Breakdown'>
            <div className='space-y-1.5 text-sm'>
              <BreakdownRow label='Packing Material' value={quote.breakdown.packingMaterial} />
              <BreakdownRow label='Packing Labor' value={quote.breakdown.packingLabor} />
              <BreakdownRow label='Packing Fumigation' value={quote.breakdown.packingFumigation} />
              <BreakdownRow label='Handling Fees' value={quote.breakdown.handlingFees} />
              <BreakdownRow label='Intl. Base' value={quote.breakdown.intlBase} />
              <BreakdownRow label='Intl. FSC' value={quote.breakdown.intlFsc} />
              {quote.breakdown.appliedSurcharges && quote.breakdown.appliedSurcharges.length > 0 ? (
                <>
                  {quote.breakdown.appliedSurcharges.map((s, i) => (
                    <BreakdownRow
                      key={i}
                      label={`  ${s.nameKo || s.name}${s.chargeType === 'rate' ? ` (${s.amount}%)` : ''}`}
                      value={s.appliedAmount}
                    />
                  ))}
                  {(quote.breakdown.intlManualSurge ?? 0) > 0 && (
                    <BreakdownRow label='  Manual Surge' value={quote.breakdown.intlManualSurge!} />
                  )}
                </>
              ) : (
                <>
                  <BreakdownRow label='Intl. War Risk' value={quote.breakdown.intlWarRisk} />
                  <BreakdownRow label='Intl. Surge' value={quote.breakdown.intlSurge} />
                </>
              )}
              {quote.breakdown.destDuty > 0 && (
                <BreakdownRow label='Dest Duty/Tax' value={quote.breakdown.destDuty} />
              )}
              <div className='pt-2 mt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between font-bold text-gray-900 dark:text-white'>
                <span>Total Cost</span>
                <span>{fmt(quote.breakdown.totalCost)} KRW</span>
              </div>
            </div>
          </Section>

          {/* Warnings */}
          {quote.warnings && quote.warnings.length > 0 && (
            <Section title='Warnings'>
              <ul className='space-y-1'>
                {quote.warnings.map((w, i) => (
                  <li
                    key={i}
                    className='text-sm text-amber-600 dark:text-amber-400 flex items-start gap-2'
                  >
                    <span className='shrink-0 mt-0.5'>⚠</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Notes */}
          {quote.notes && (
            <Section title='Notes'>
              <p className='text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap'>
                {quote.notes}
              </p>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Sub-components ──

const MetricCard: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => (
  <div className='bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3'>
    <div className='flex items-center gap-1.5 mb-1'>
      {icon}
      <span className='text-xs text-gray-500 dark:text-gray-400'>{label}</span>
    </div>
    <p className='text-sm font-bold text-gray-900 dark:text-white truncate'>{value}</p>
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h4 className='text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2'>
      {title}
    </h4>
    {children}
  </div>
);

const Field: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className='flex justify-between py-1'>
    <span className='text-gray-500 dark:text-gray-400'>{label}</span>
    <span className='font-medium text-gray-900 dark:text-white'>{value}</span>
  </div>
);

const BreakdownRow: React.FC<{ label: string; value: number }> = ({ label, value }) => {
  if (value === 0) return null;
  return (
    <div className='flex justify-between text-gray-600 dark:text-gray-300'>
      <span>{label}</span>
      <span className='tabular-nums'>{formatNum(value)} KRW</span>
    </div>
  );
};
