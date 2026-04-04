import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSharedQuote, SharedQuoteData } from '@/api/shareApi';
import { COUNTRY_OPTIONS } from '@/config/options';
import { Plane, MapPin, Clock, Shield, Package, AlertTriangle } from 'lucide-react';

const SharedQuotePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<SharedQuoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getSharedQuote(token)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const countryName = (code: string) =>
    COUNTRY_OPTIONS.find((c) => c.code === code)?.name?.replace(/[^\x20-\x7E]/g, '').trim() || code;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-3 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Quote Unavailable</h2>
          <p className="text-gray-500 text-sm mb-6">{error || 'This share link is invalid or has expired.'}</p>
          <Link
            to="/"
            className="inline-flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            Go to E-MAX Quote
          </Link>
        </div>
      </div>
    );
  }

  const isUsd = true; // Shared quotes always show USD for external partners
  const totalDisplay = isUsd
    ? `$${data.totalQuoteAmountUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    : `KRW ${data.totalQuoteAmount.toLocaleString('en-US')}`;
  const secondaryDisplay = isUsd
    ? `KRW ${data.totalQuoteAmount.toLocaleString('en-US')}`
    : `$${data.totalQuoteAmountUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">E-MAX Quote</h1>
          <p className="text-sm text-gray-500">Freight Quotation</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Reference Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-blue-200 uppercase tracking-wider">Quotation</p>
                <p className="text-lg font-bold">{data.referenceNo}</p>
              </div>
              <div className="text-right text-xs text-blue-200">
                <p>Issued: {new Date(data.createdAt).toLocaleDateString('en-US')}</p>
                {data.validityDate && (
                  <p>Valid until: {new Date(data.validityDate).toLocaleDateString('en-US')}</p>
                )}
              </div>
            </div>
          </div>

          {/* Route */}
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-xs text-gray-400 uppercase">Origin</p>
                <p className="font-semibold text-gray-900">{countryName(data.originCountry)}</p>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <div className="w-8 h-px bg-gray-300" />
                <Plane className="w-4 h-4" />
                <div className="w-8 h-px bg-gray-300" />
              </div>
              <div className="flex-1 text-right">
                <p className="text-xs text-gray-400 uppercase">Destination</p>
                <p className="font-semibold text-gray-900">
                  {countryName(data.destinationCountry)}
                  {data.destinationZip ? ` (${data.destinationZip})` : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="px-6 py-4 grid grid-cols-2 gap-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Carrier</p>
                <p className="text-sm font-semibold text-gray-900">{data.overseasCarrier}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Zone</p>
                <p className="text-sm font-semibold text-gray-900">{data.appliedZone}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Transit</p>
                <p className="text-sm font-semibold text-gray-900">{data.transitTime}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Incoterm</p>
                <p className="text-sm font-semibold text-gray-900">{data.incoterm}</p>
              </div>
            </div>
          </div>

          {/* Weight */}
          <div className="px-6 py-3 border-b border-gray-100 text-sm text-gray-500">
            Billable Weight: <span className="font-semibold text-gray-900">{data.billableWeight} kg</span>
          </div>

          {/* Total Quote */}
          <div className="px-6 py-6 bg-gradient-to-r from-blue-50 to-blue-100">
            <p className="text-xs text-blue-600 uppercase tracking-wider mb-1">Total Quote</p>
            <p className="text-3xl font-extrabold text-blue-900">{totalDisplay}</p>
            <p className="text-sm text-blue-600 mt-1">Approx. {secondaryDisplay}</p>
          </div>

          {/* Disclaimer */}
          <div className="px-6 py-3 bg-gray-50 text-xs text-gray-400">
            This quotation is valid within the stated period. Surcharges are subject to change at time of booking.
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-4">
          Powered by E-MAX Quote
        </p>
      </div>
    </div>
  );
};

export default SharedQuotePage;
