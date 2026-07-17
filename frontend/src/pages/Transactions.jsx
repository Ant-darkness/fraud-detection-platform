import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

const Transactions = ({ showToast }) => {
  const { t } = useLanguage();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Vigezo vya Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(15); 
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const response = await api.transactions.getAll({ page: currentPage, limit });
        
        // Kukubali muundo wa { data: [...], total: X } au Array ya moja kwa moja
        if (response && response.data) {
          setTransactions(response.data);
          setTotalCount(response.total || 0);
        } else {
          setTransactions(Array.isArray(response) ? response : []);
          setTotalCount(Array.isArray(response) ? response.length : 0);
        }
      } catch (error) {
        showToast("Imeshindikana kupakia orodha ya miamala ya kweli.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [currentPage, limit]);

  const totalPages = Math.ceil(totalCount / limit) || 1;

  // Format ya Muda/Hatua (Step) ya muamala kulingana na simulation ya dataset
  const formatTimeOrStep = (tx) => {
    if (tx.time || tx.timestamp) {
      try {
        return new Date(tx.time || tx.timestamp).toLocaleString('sw-TZ', { hour12: false });
      } catch {
        return tx.time || tx.timestamp;
      }
    }
    // Kama inatumia "step" kutoka kwenye model ya simulation
    if (tx.step !== undefined && tx.step !== null) {
      return `Hatua (Step) ${tx.step}`;
    }
    return "N/A";
  };

  return (
    <div className="glassmorphism rounded-2xl p-6 relative overflow-hidden">
      {/* Golden top border */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent"></div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span>💸</span> Real-Time Miamala (Live Data)
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Ufuatiliaji wa miamala halisi inayopita kwenye mifumo ya makazi kwa sasa.
          </p>
        </div>
        <div className="text-xs text-gray-400 bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl">
          Jumla: <span className="text-[#D4AF37] font-bold">{totalCount}</span> Miamala
        </div>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <span className="w-8 h-8 border-3 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></span>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs text-gray-400 bg-white/5">
                  <th className="py-4 px-6">ID Muamala</th>
                  <th className="py-4 px-6">Muda / Hatua</th>
                  <th className="py-4 px-6">Aina (Type)</th>
                  <th className="py-4 px-6">Kiasi (Amount)</th>
                  <th className="py-4 px-6">Kutoka (Orig Acc)</th>
                  <th className="py-4 px-6">Kwenda (Dest Acc)</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-200 divide-y divide-white/5">
                {transactions.map((tx, index) => {
                  // Kushika ID kwa usahihi wa kipekee
                  const txId = tx.transaction_id || tx.id || `TX-${index}`;
                  // Kushika thamani sahihi kutoka kwenye backend data keys zote zinazowezekana
                  const amountVal = tx.amount !== undefined ? tx.amount : (tx.amountVal || 0);
                  const originAcc = tx.nameOrig || tx.orig || tx.sender || "N/A";
                  const destAcc = tx.nameDest || tx.dest || tx.receiver || "N/A";

                  return (
                    <tr key={txId} className="hover:bg-white/5 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-[#D4AF37]">#{txId}</td>
                      <td className="py-4 px-6 font-mono text-xs text-gray-400">
                        {formatTimeOrStep(tx)}
                      </td>
                      <td className="py-4 px-6">
                        <span className="bg-white/5 border border-white/5 px-2 py-1 rounded-md text-xs font-semibold uppercase text-blue-400">
                          {tx.type || "CASH_OUT"}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-bold text-green-400">
                        TZS {Number(amountVal).toLocaleString()}
                      </td>
                      <td className="py-4 px-6 font-mono text-gray-300">{originAcc}</td>
                      <td className="py-4 px-6 font-mono text-gray-300">{destAcc}</td>
                    </tr>
                  );
                })}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-gray-500 text-sm">
                      Hakuna miamala halisi iliyoingia hivi sasa kwenye database yetu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* CONTROLS ZA PAGINATION */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10 shrink-0">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-300 hover:border-[#D4AF37]/50 hover:text-white transition-all disabled:opacity-30 disabled:hover:border-white/10 disabled:cursor-not-allowed cursor-pointer"
              >
                ◀ Nyuma
              </button>
              
              <span className="text-xs text-gray-400">
                Ukurasa <span className="text-white font-bold">{currentPage}</span> kati ya <span className="text-white font-bold">{totalPages}</span>
              </span>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-300 hover:border-[#D4AF37]/50 hover:text-white transition-all disabled:opacity-30 disabled:hover:border-white/10 disabled:cursor-not-allowed cursor-pointer"
              >
                Mbele ▶
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Transactions;
