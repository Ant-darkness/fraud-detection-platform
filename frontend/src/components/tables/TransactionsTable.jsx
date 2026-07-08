import Badge from "../common/Badge";

export default function TransactionsTable({ transactions = [] }) {
  function statusBadge(status) {
    switch (status) {
      case "APPROVED": return <Badge color="green">APPROVED</Badge>;
      case "HELD": return <Badge color="orange">HELD</Badge>;
      case "REJECTED": return <Badge color="red">REJECTED</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-left border-collapse text-sm">
        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-xs">
          <tr>
            <th className="p-4 pl-6">Transaction ID</th>
            <th className="p-4">Type</th>
            <th className="p-4 text-right">Amount (TZS)</th>
            <th className="p-4">Sender</th>
            <th className="p-4">Receiver</th>
            <th className="p-4">Gate Status</th>
            <th className="p-4 pr-6">Timestamp</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {transactions.map(tx => (
            <tr key={tx.transaction_id} className="hover:bg-slate-50/50 transition duration-100">
              <td className="p-4 pl-6 font-mono font-semibold text-slate-900 text-xs">{tx.transaction_id}</td>
              <td className="p-4 font-medium"><span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-600 font-semibold">{tx.type}</span></td>
              <td className="p-4 text-right font-bold font-mono text-slate-900">{Number(tx.amount).toLocaleString()}</td>
              <td className="p-4 text-xs font-medium text-slate-600">{tx.nameOrig}</td>
              <td className="p-4 text-xs font-medium text-slate-600">{tx.nameDest}</td>
              <td className="p-4">{statusBadge(tx.status)}</td>
              <td className="p-4 pr-6 text-xs text-slate-400 font-medium">{new Date(tx.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
