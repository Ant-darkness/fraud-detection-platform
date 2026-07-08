import Badge from "../common/Badge";
import Button from "../common/Button";

export default function ModelsTable({ models = [], onActivate, onReject, onDelete }) {
  function statusColor(status) {
    switch (status) {
      case "ACTIVE":
      case "AUTO_ACTIVE": return "green";
      case "PENDING": return "orange";
      case "REJECTED": return "red";
      default: return "gray";
    }
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-left border-collapse text-sm">
        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-xs">
          <tr>
            <th className="p-4 pl-6">Model Core Name</th>
            <th className="p-4 text-center">Version Tag</th>
            <th className="p-4 text-right">Trained Dataset Size</th>
            <th className="p-4">Activation Status</th>
            <th className="p-4 text-center">Cluster Active</th>
            <th className="p-4 pr-6 text-center">Registry Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {models.map(model => (
            <tr key={model.model_id} className="hover:bg-slate-50/50 transition">
              <td className="p-4 pl-6">
                <div className="font-bold text-slate-800">{model.model_name}</div>
                <div className="text-xs text-slate-400 mt-0.5">{model.model_description}</div>
              </td>
              <td className="p-4 text-center font-mono text-xs font-semibold text-slate-600">v{model.model_version}</td>
              <td className="p-4 text-right font-mono font-bold text-slate-900">{Number(model.dataset_size).toLocaleString()}</td>
              <td className="p-4"><Badge color={statusColor(model.activation_status)}>{model.activation_status}</Badge></td>
              <td className="p-4 text-center">{model.is_active ? <Badge color="green">ACTIVE NODE</Badge> : <Badge color="gray">STANDBY</Badge>}</td>
              <td className="p-4 pr-6">
                <div className="flex justify-center gap-2">
                  {!model.is_active && <Button className="py-1 px-2.5 text-[11px]" onClick={() => onActivate(model.model_id)}>Activate</Button>}
                  {model.activation_status !== "REJECTED" && !model.is_active && <Button variant="danger" className="py-1 px-2.5 text-[11px]" onClick={() => onReject(model.model_id)}>Reject</Button>}
                  {!model.is_active && <Button variant="secondary" className="py-1 px-2.5 text-[11px]" onClick={() => onDelete(model.model_id)}>Delete</Button>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
