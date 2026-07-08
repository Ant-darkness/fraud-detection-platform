import { useEffect, useState } from "react";
import Card from "../components/common/Card";
import Loading from "../components/common/Loading";
import StatCard from "../components/dashboard/StatCard";
import FraudTrendChart from "../components/dashboard/FraudTrendChart";
import { getDashboardSummary, getFraudTrend } from "../api/dashboardApi";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadDashboard() {
    try {
      const [summaryData, trendData] = await Promise.all([
        getDashboardSummary(),
        getFraudTrend()
      ]);
      setSummary(summaryData);
      setTrend(trendData || []);
    } catch (err) {
      console.error("Dashboard connection failedage", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return <Loading text="Fetching Core Node Metrics..." />;
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard title="Total Transactions" value={Number(summary?.total_transactions || 0).toLocaleString()} color="gold" />
        <StatCard title="Predicted Frauds" value={Number(summary?.predicted_frauds || 0).toLocaleString()} color="red" />
        <StatCard title="Pending Reviews" value={Number(summary?.pending_reviews || 0).toLocaleString()} color="orange" />
        <StatCard title="Fraud System Rate" value={`${summary?.fraud_rate || 0}%`} color="green" />
      </div>
      
      <Card title="Institutional Confirmed Fraud Trend (Kafka Live Ingestion)">
        <div className="h-96 w-full pt-4">
          <FraudTrendChart data={trend} />
        </div>
      </Card>
    </div>
  );
}
