import React, { useState } from 'react';
import { Check, CheckCircle2, Copy, ShieldCheck, X } from 'lucide-react';
import { TransferResponse } from '../types/banking';

interface ReceiptModalProps {
  receipt: TransferResponse | null;
  idempotencyKey?: string;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  receipt,
  idempotencyKey,
  onClose,
}) => {
  const [copiedRef, setCopiedRef] = useState(false);

  if (!receipt) return null;

  const copyReference = () => {
    navigator.clipboard.writeText(receipt.referenceNumber);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Transaction Successful!</h3>
              <p className="text-xs text-slate-500">
                Official AKT Bank Digital Receipt • Verified by Double-Entry Ledger
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="my-5 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Total Amount Processed
          </p>
          <p className="mt-1 font-mono text-3xl font-extrabold text-emerald-600">
            {Number(receipt.amount).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 4,
            })}{' '}
            {receipt.currency}
          </p>
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-0.5 text-xs font-bold text-white">
            <Check className="h-3.5 w-3.5" />
            {receipt.status}
          </span>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-slate-500">Receipt Reference No</span>
            <button
              type="button"
              onClick={copyReference}
              className="flex items-center gap-1.5 font-mono font-bold text-blue-600 hover:text-blue-700"
            >
              <span>{receipt.referenceNumber}</span>
              {copiedRef ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex flex-col gap-1 border-b border-slate-100 pb-2.5">
            <span className="text-xs text-slate-500">From Account (Sender)</span>
            <span className="font-mono text-xs font-semibold text-slate-800">
              {receipt.senderAccountNumber === 'TR000000000000000000000001'
                ? 'AKT Bank Cash Vault (TR000000000000000000000001)'
                : receipt.senderAccountNumber}
            </span>
          </div>

          <div className="flex flex-col gap-1 border-b border-slate-100 pb-2.5">
            <span className="text-xs text-slate-500">To Account (Recipient)</span>
            <span className="font-mono text-xs font-semibold text-emerald-700">
              {receipt.receiverAccountNumber === 'TR000000000000000000000001'
                ? 'AKT Bank Cash Vault (TR000000000000000000000001)'
                : receipt.receiverAccountNumber}
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-slate-500">Date & Time</span>
            <span className="font-mono text-xs text-slate-700">
              {new Date(receipt.createdAt).toLocaleString('en-US')}
            </span>
          </div>

          {idempotencyKey && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700">
                <ShieldCheck className="h-4 w-4" />
                <span>Duplicate-Charge Protection Key (Idempotency)</span>
              </div>
              <p className="mt-1 font-mono text-[11px] text-slate-600">{idempotencyKey}</p>
            </div>
          )}
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
