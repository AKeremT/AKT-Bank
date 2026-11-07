import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { ErrorResponse } from '../types/banking';

interface ErrorAlertProps {
  error: ErrorResponse | null;
  onClose?: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ error, onClose }) => {
  if (!error) return null;

  const hasValidations =
    error.validationErrors && Object.keys(error.validationErrors).length > 0;

  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-rose-900 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2 font-bold text-rose-800">
              <span>{error.error || 'Action Could Not Be Completed'}</span>
              {error.status && (
                <span className="rounded-md bg-rose-200/70 px-2 py-0.5 font-mono text-xs font-semibold text-rose-800">
                  HTTP {error.status}
                </span>
              )}
            </div>
            <p className="text-rose-700">{error.message}</p>
            {hasValidations && (
              <ul className="mt-2 list-inside list-disc space-y-1 rounded-xl border border-rose-200 bg-white/80 p-3 text-xs text-rose-800">
                {Object.entries(error.validationErrors!).map(([field, msg]) => (
                  <li key={field}>
                    <span className="font-semibold capitalize">{field}:</span> {msg}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-rose-500 hover:bg-rose-100 hover:text-rose-800"
            title="Dismiss"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};
