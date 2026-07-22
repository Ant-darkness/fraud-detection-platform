import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

const Transactions = ({ showToast }) => {
  const { t } = useLanguage();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(15); 
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const response = await api.transactions.getAll({ page: currentPage, limit });
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

  const formatTimeOrStep = (tx) => {
    if (tx.created_at) {
      try {
        return new Date(tx.created_at).toLocaleString('sw-TZ', { hour12: false });
      } catch {
        return tx.created_at;
      }
    }
    if (tx.step !== undefined && tx.step !== null) {
      return `${t('txStepLabel')} ${tx.step}`;
    }
    return "N/A";
  };

  return (
    <div className={`transition-all duration-300 ${
      isMaximized 
        ? 'fixed inset-4 z-50 bg-[#020205]/95 border border-[#D4AF37]/40 backdrop-blur-2xl rounded-3xl p-8 flex flex-col justify-between shadow-[0_0_50px_rgba(0,0,0,0.8)]' 
        : 'bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 relative overflow-hidden'
    }`}>
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent"></div>

      {/* KICHWA CHA UKURASA - BUTTON IPO MBERE YA TITLE SASA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span>💸</span> {t('txTitle')}
          </h3>
          {/* BUTTON IPO MBLE YA JINA RASMI */}
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="px-2.5 py-1 bg-[#D4AF37]/15 border border-[#D4AF37]/30 hover:bg-[#D4AF37] hover:text-black text-[#D4AF37] rounded-xl text-[11px] font-black tracking-wider uppercase transition-all flex items-center gap-1 cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.05)]"
            title={isMaximized ? t('btnMinimize') : t('btnMaximize')}
          >
            {isMaximized ? `🗗 ${t('btnMinimize')}` : t('btnMaximize')}
          </button>
        </div>
        
        <div className="text-xs text-gray-400 bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl self-end sm:self-center">
          {t('txTotal')}: <span className="text-[#D4AF37] font-bold">{totalCount.toLocaleString()}</span> {t('txItems')}
        </div>
      </div>

      {loading ? (
        <div className="grow flex items-center justify-center min-h-[40vh]">
          <span className="w-8 h-8 border-3 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></span>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto grow border border-white/5 rounded-xl bg-black/20 scrollbar-thin scrollbar-thumb-white/10">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead>
                <tr className="border-b border-white/10 text-xs text-gray-400 bg-white/5 uppercase tracking-wider font-semibold">
                  <th className="py-4 px-5">{t('txTimeOrStep')}</th>
                  <th className="py-4 px-5">{t('txType')}</th>
                  <th className="py-4 px-5">{t('txAmount')}</th>
                  <th className="py-4 px-5 bg-blue-500/5 text-blue-300">{t('txOldOrig')}</th>
                  <th className="py-4 px-5 bg-blue-500/5 text-blue-400">{t('txNewOrig')}</th>
                  <th className="py-4 px-5 bg-purple-500/5 text-purple-300">{t('txOldDest')}</th>
                  <th className="py-4 px-5 bg-purple-500/5 text-purple-400">{t('txNewDest')}</th>
                </tr>
              </thead>
              <tbody className="text-xs text-gray-300 divide-y divide-white/5 font-mono">
                {transactions.map((tx, index) => (
                  <tr key={index} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-5 text-gray-400">{formatTimeOrStep(tx)}</td>
                    <td className="py-4 px-5">
                      <span className="bg-white/5 border border-white/5 px-2 py-0.5 rounded text-[10px] font-bold text-cyan-400 uppercase">
                        {tx.type || "TRANSFER"}
                      </span>
                    </td>
                    <td className="py-4 px-5 font-bold text-green-400 text-sm">
                      TZS {Number(tx.amount || 0).toLocaleString()}
                    </td>
                    <td className="py-4 px-5 bg-blue-500/5 text-gray-300">
                      {Number(tx.oldbalanceorg || 0).toLocaleString()}
                    </td>
                    <td className="py-4 px-5 bg-blue-500/5 text-white font-bold">
                      {Number(tx.newbalanceorig || 0).toLocaleString()}
                    </td>
                    <td className="py-4 px-5 bg-purple-500/5 text-gray-300">
                      {Number(tx.oldbalancedest || 0).toLocaleString()}
                    </td>
                    <td className="py-4 px-5 bg-purple-500/5 text-white font-bold">
                      {Number(tx.newbalancedest || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-gray-500 text-sm font-sans">
                      {t('txEmpty')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10 shrink-0">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-300 hover:border-[#D4AF37]/50 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                {t('pagePrev')}
              </button>
              
              <span className="text-xs text-gray-400 font-sans">
                {t('pageLabel')} <span className="text-white font-bold">{currentPage}</span> {t('pageOf')} <span className="text-white font-bold">{totalPages}</span>
              </span>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-300 hover:border-[#D4AF37]/50 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                {t('pageNext')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Transactions;
