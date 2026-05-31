import { useEffect, useState } from 'react';

type Props = {
  open: boolean;
  issueId: string | number | null;
  onClose: () => void;
  onAssigned?: (contractor: any) => void;
};

export default function ContractorAssignModal({ open, issueId, onClose, onAssigned }: Props) {
  const [contractors, setContractors] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [budgetAmount, setBudgetAmount] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetch('/api/contractors')
      .then(res => res.json())
      .then((data) => setContractors(data.data || []))
      .catch(err => console.warn('Failed to load contractors', err));
  }, [open]);

  useEffect(() => {
    if (!open) return setSelected(null);
  }, [open]);

  async function handleAssign() {
    if (!selected || !issueId) return;
    setLoading(true);
    try {
      // create an assignment record
      await fetch(`/api/contractors/${selected}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issue_id: issueId, assigned_by: 'dashboard-ui' })
      });

      // update the report to include contractor info and budget
      const contractor = contractors.find(c => c.contractor_id === selected) || contractors.find(c => c.contractor_id == selected);
      
      await fetch(`/api/reports/${issueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractor_id: contractor?.contractor_id,
          contractor_name: contractor?.company_name || contractor?.contractor_name,
          amount_sanctioned: budgetAmount !== '' ? Number(budgetAmount) : undefined,
          status: 'In Progress'
        })
      });

      // push to local storage so BudgetPage picks it up
      if (budgetAmount !== '') {
        try {
          const raw = localStorage.getItem('wg_budget_allocations');
          const allocs = raw ? JSON.parse(raw) : [];
          allocs.push({
            allocation_id: `local-${Date.now()}`,
            issueId: issueId,
            issueTitle: `Report #${issueId}`,
            city: contractor?.city || 'Unknown',
            country: contractor?.country || 'Unknown',
            amount: Number(budgetAmount),
            currency: 'INR'
          });
          localStorage.setItem('wg_budget_allocations', JSON.stringify(allocs));
        } catch (e) {
          console.warn('Failed to save budget allocation to local storage', e);
        }
      }

      onAssigned && onAssigned(contractor);
      onClose();
    } catch (err) {
      console.error('Assign failed', err);
      alert('Failed to assign contractor');
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
        <h3 className="text-lg font-bold mb-3">Assign Contractor</h3>
        <p className="text-sm text-gray-600 mb-4">Select a contractor to assign to this issue.</p>
        <div className="max-h-64 overflow-auto mb-4">
          {contractors.length === 0 ? (
            <p className="text-sm text-gray-500">No contractors available</p>
          ) : (
            contractors.map(c => (
              <label key={c.contractor_id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
                <input type="radio" name="contractor" value={c.contractor_id} checked={selected === c.contractor_id} onChange={() => setSelected(c.contractor_id)} />
                <div className="text-sm">
                  <div className="font-medium">{c.company_name || c.contractor_name}</div>
                  <div className="text-xs text-gray-500">{c.city}, {c.country} — rating {c.rating || 'N/A'}</div>
                </div>
              </label>
            ))
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-bold text-gray-700 mb-1">Sanctioned Budget (INR)</label>
          <input
            type="number"
            value={budgetAmount}
            onChange={(e) => setBudgetAmount(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="e.g. 50000"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button className="px-4 py-2 rounded bg-gray-200" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="px-4 py-2 rounded bg-green-600 text-white" onClick={handleAssign} disabled={!selected || loading}>{loading ? 'Assigning...' : 'Assign'}</button>
        </div>
      </div>
    </div>
  );
}
