import { useEffect, useState } from "react";
import Card from "../components/common/Card";
import Loading from "../components/common/Loading";
import EmptyState from "../components/common/EmptyState";
import ModelsTable from "../components/tables/ModelsTable";
import { getModels, activateModel, rejectModel, deleteModel } from "../api/modelApi";

export default function Models() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadModels() {
    try {
      const data = await getModels();
      setModels(data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadModels();
  }, []);

  // --- OPTIMISTIC ENGINE FOR REGISTRY CONTROLS ---
  async function runRegistryAction(id, actionFn) {
    const previous = [...models];
    try {
      await actionFn(id);
      await loadModels();
    } catch {
      setModels(previous);
      alert("Registry modification failed. Sync state aborted.");
    }
  }

  return (
    <Card title="Machine Learning Models Registry">
      {loading ? (
        <Loading text="Compiling registered cluster configurations..." />
      ) : models.length === 0 ? (
        <EmptyState title="No Models Registered" description="The cluster Registry contains zero inference artifacts." />
      ) : (
        <ModelsTable
          models={models}
          onActivate={(id) => runRegistryAction(id, activateModel)}
          onReject={(id) => runRegistryAction(id, rejectModel)}
          onDelete={async (id) => {
            if (window.confirm("Confirm deletion from secure disk infrastructure?")) {
              runRegistryAction(id, deleteModel);
            }
          }}
        />
      )}
    </Card>
  );
}
