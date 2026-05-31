import { useState, useEffect } from 'react';

interface Props {
  open: boolean;
  defaultAmount: number;
  currency?: string;
  defaultTitle?: string;
  timelineDefault?: string;
  showTimeline?: boolean;
  onClose: () => void;
  onAllocate: (payload: { amount: number; currency: string; note?: string; city?: string; country?: string; issueId?: string | number | null }) => void;
}

export default function AllocationModal({ open, defaultAmount, currency = 'USD', defaultTitle, timelineDefault = '', showTimeline = false, onClose, onAllocate }: Props) {
  const [amount, setAmount] = useState<number>(defaultAmount || 0);
  const [cur, setCur] = useState<string>(currency);
  const [note, setNote] = useState<string>(timelineDefault || '');
  const [city, setCity] = useState<string>('');
  const [country, setCountry] = useState<string>('');

  useEffect(() => {
    setAmount(defaultAmount || 0);
    setCur(currency);
    setNote(timelineDefault || '');
  }, [defaultAmount, currency, timelineDefault, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-lg z-10 p-6">
        <h3 className="text-lg font-semibold mb-2">Simulated Budget & Allocation</h3>
        {defaultTitle && <p className="text-sm text-gray-600 mb-3">{defaultTitle}</p>}

        <div className="grid grid-cols-1 gap-3">
          <label className="text-sm">Amount ({cur})</label>
          <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} className="w-full px-3 py-2 border rounded-md" />

          <label className="text-sm">Currency</label>
          <select value={cur} onChange={e => setCur(e.target.value)} className="w-full px-3 py-2 border rounded-md">
            <option value="USD">USD</option>
            <option value="INR">INR</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>

          {showTimeline && (
            <>
              <label className="text-sm">Fix timeline / Note</label>
              <input value={note} onChange={e => setNote(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
            </>
          )}

          <label className="text-sm">City (optional)</label>
          <input value={city} onChange={e => setCity(e.target.value)} className="w-full px-3 py-2 border rounded-md" />

          <label className="text-sm">Country (optional)</label>
          <input value={country} onChange={e => setCountry(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">Cancel</button>
          <button onClick={() => { onAllocate({ amount, currency: cur, note, city, country }); onClose(); }} className="px-4 py-2 rounded bg-teal-600 text-white hover:bg-teal-700">Allocate</button>
        </div>
      </div>
    </div>
  );
}
