import Badge from "../common/Badge";
import Button from "../common/Button";

export default function ReviewsTable({ reviews = [], onApprove, onReject }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-left border-collapse text-sm">
        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-xs">
          <tr>
            <th className="p-4 pl-6">Transaction ID</th>
            <th className="p-4 text-right">Amount</th>
            <th className="p-4">Sender Name</th>
            <th className="p-4">Receiver Name</th>
            <th className="p-4 text-center">Fraud Probability</th>
            <th className="p-4 text-center">State Status</th>
            <th className="p-4 pr-6 text-center">Execution Controls</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {reviews.map(review => (
            <tr key={review.review_id} className="hover:bg-slate-50/50 transition">
              <td className="p-4 pl-6 font-mono font-semibold text-xs text-slate-900">{review.transaction_id}</td>
              <td className="p-4 text-right font-bold font-mono text-slate-900">{Number(review.amount).toLocaleString()}</td>
              <td className="p-4 text-xs text-slate-600 font-medium">{review.nameOrig}</td>
              <td className="p-4 text-xs text-slate-600 font-medium">{review.nameDest}</td>
              <td className="p-4 text-center">
                <span className="inline-block bg-rose-50 text-rose-700 border border-rose-100 font-mono px-2 py-0.5 rounded text-xs font-bold">
                  {(review.fraud_probability * 100).toFixed(2)}%
                </span>
              </td>
              <td className="p-4 text-center"><Badge color="orange">{review.status}</Badge></td>
              <td className="p-4 pr-6">
                <div className="flex justify-center gap-2">
                  <Button variant="primary" className="py-1 px-3 text-[11px]" onClick={() => onApprove(review.review_id)}>Approve</Button>
                  <Button variant="danger" className="py-1 px-3 text-[11px]" onClick={() => onReject(review.review_id)}>Reject</Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
