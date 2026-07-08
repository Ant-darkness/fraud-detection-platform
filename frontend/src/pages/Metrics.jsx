import { useEffect, useState } from "react";
import Card from "../components/common/Card";
import Loading from "../components/common/Loading";
import EmptyState from "../components/common/EmptyState";
import MetricsTable from "../components/tables/MetricsTable";
import { getLeaderboard } from "../api/metricApi";

export default function Metrics() {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadMetrics() {
    try {
      const data = await getLeaderboard();
      setMetrics(data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMetrics();
  }, []);

  return (
    <Card title="Model Performance Leaderboard">
      {loading ? (
        <Loading text="Computing model performance vectors..." />
      ) : metrics.length === 0 ? (
        <EmptyState title="Metrics Sync Void" description="Evaluation matrices are unavailable for this operational tier." />
      ) : (
        <MetricsTable metrics={metrics} />
      )}
    </Card>
  );
}
