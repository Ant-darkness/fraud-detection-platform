import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import Card from "../components/common/Card";
import Loading from "../components/common/Loading";
import EmptyState from "../components/common/EmptyState";
import ReviewsTable from "../components/tables/ReviewsTable";
import { getPendingReviews, approveReview, rejectReview } from "../api/reviewApi";

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadReviews() {
    try {
      const data = await getPendingReviews();
      setReviews(data || []);
    } catch (err) {
      console.error("Critical failure reading review ledger", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviews();
  }, []);

  // --- OPTIMISTIC REALTIME ARCHITECTURE ---
  async function handleAction(id, actionFn) {
    const backupState = [...reviews];
    // Sakata linasafishwa kwenye screen papo hapo (Kasi ya Radi)
    setReviews(prev => prev.filter(item => item.review_id !== id));

    try {
      await actionFn(id);
    } catch (err) {
      // Kama mtandao umekufa, rudisha data haraka kuzuia data loss desyncs
      setReviews(backupState);
      alert("Institutional processing node failed. Action rolled back safely.");
    }
  }

  return (
    <div className="space-y-6">
      <Card title="Live Fraud Review Queue">
        {loading ? (
          <Loading text="Connecting live to Kafka transaction stream..." />
        ) : reviews.length === 0 ? (
          <EmptyState title="Queue Fully Cleared" description="All flagged high-risk activities evaluated successfully." />
        ) : (
          <ReviewsTable 
            reviews={reviews} 
            onApprove={(id) => handleAction(id, approveReview)} 
            onReject={(id) => handleAction(id, rejectReview)} 
          />
        )}
      </Card>
    </div>
  );
}
