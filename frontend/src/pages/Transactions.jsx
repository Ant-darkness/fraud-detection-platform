import { useEffect, useState } from "react";
import Card from "../components/common/Card";
import Loading from "../components/common/Loading";
import EmptyState from "../components/common/EmptyState";
import TransactionsTable from "../components/tables/TransactionsTable";
import { getTransactions } from "../api/transactionApi";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadTransactions() {
    try {
      const data = await getTransactions();
      setTransactions(data || []);
    } catch {
      console.error("Failed to sync with Core Ledger");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTransactions();
  }, []);

  return (
    <Card title="Core Ledger Real-time Audit Stream">
      {loading ? (
        <Loading text="Streaming live transactions from ledger node..." />
      ) : transactions.length === 0 ? (
        <EmptyState title="No Ledger History" description="No logged activities found inside this partition cluster." />
      ) : (
        <TransactionsTable transactions={transactions} />
      )}
    </Card>
  );
}
