export default function MetricTable({ metrics = [] }) {
    return (
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-xs">
            <tr>
              <th className="p-4 pl-6">Model Architecture</th>
              <th className="p-4 text-center">Accuracy</th>
              <th className="p-4 text-center">Precision</th>
              <th className="p-4 text-center">Recall Score</th>
              <th className="p-4 text-center">F1-Score Vector</th>
              <th className="p-4 pr-6 text-center">ROC-AUC</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {metrics.map((metric, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 transition">
                <td className="p-4 pl-6 font-bold text-slate-800">{metric.model_name}</td>
                <td className="p-4 text-center font-mono font-semibold text-slate-600">{(metric.accuracy * 100).toFixed(2)}%</td>
                <td className="p-4 text-center font-mono font-semibold text-slate-600">{(metric.precision * 100).toFixed(2)}%</td>
                <td className="p-4 text-center font-mono font-semibold text-emerald-600 font-bold">{(metric.recall * 100).toFixed(2)}%</td>
                <td className="p-4 text-center font-mono font-semibold text-slate-600">{(metric.f1_score * 100).toFixed(2)}%</td>
                <td className="p-4 pr-6 text-center">
                  <span className="inline-block bg-blue-50 text-blue-700 font-mono px-2 py-0.5 rounded text-xs font-bold border border-blue-100">
                    {metric.roc_auc.toFixed(4)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  