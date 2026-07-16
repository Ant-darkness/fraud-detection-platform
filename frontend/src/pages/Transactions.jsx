import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

const Transactions = ({ showToast }) => {
  const { t } = useLanguage();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const data = await api.transactions.getAll();
        setTransactions(data);
      } catch (error) {
        showToast("Imeshindikana kupakia orodha ya miamala.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <span className="w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
      <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wider">💸 Real-Time Miamala (Transactions)</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-xs text-gray-400 bg-white/5">
              <th className="py-4 px-6">ID</th>
              <th className="py-4 px-6">Muda (Time)</th>
              <th className="py-4 px-6">Aina (Type)</th>
              <th className="py-4 px-6">Kiasi (Amount)</th>
              <th className="py-4 px-6">Kutoka (Orig)</th>
              <th className="py-4 px-6">Kwenda (Dest)</th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-200 divide-y divide-white/5">
            {transactions.map(tx => (
              <tr key={tx.transaction_id} className="hover:bg-white/5 transition-colors">
                <td className="py-4 px-6 font-mono font-bold text-[#D4AF37]">#{tx.transaction_id}</td>
                <td className="py-4 px-6 font-mono text-xs text-gray-400">{tx.time || tx.timestamp}</td>
                <td className="py-4 px-6">{tx.type}</td>
                <td className="py-4 px-6 font-bold text-green-400">TZS {tx.amount.toLocaleString()}</td>
                <td className="py-4 px-6">{tx.orig || tx.nameOrig}</td>
                <td className="py-4 px-6">{tx.dest || tx.nameDest}</td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan="6" className="py-8 text-center text-gray-500 text-sm">
                  Hakuna miamala iliyoingia hivi sasa kwenye database yetu.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Transactions;
