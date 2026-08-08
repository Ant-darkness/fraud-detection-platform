import React, { createContext, useContext, useState } from 'react';

const translations = {
  SW: {
    // Navigation & Main Titles
    fraudSummary: "Muhtasari wa Utapeli",
    fraudReviews: "Uhakiki wa Utapeli",
    models: "Mifumo ya Uchambuzi (Models)",
    transactions: "Miamala Halisi",
    volumeAnalysis: "Uchambuzi wa Thamani",
    businessAnalytics: "Uchambuzi wa Kina (BI)",
    officers: "Usimamizi wa Maafisa",
    airflow: "Nenda Airflow Pipeline",
    logout: "Ondoka Mfumoni",
    loggedAs: "Umeingia kama",

    // Common Actions & Labels
    confirmAction: "Thibitisha Kitendo",
    cancel: "Ghairi",
    confirm: "Thibitisha",
    active: "Inafanya kazi",
    inactive: "Haifanyi kazi",
    status: "Hali ya Mfumo",
    actions: "Vitendo",
    totalTransactions: "Jumla ya Miamala",
    predictedFraud: "Miamala Yenye Shaka",
    pendingReviews: "Inayosubiri Uhakiki",
    confirmedFraud: "Utapeli Uliothibitishwa",
    fraudRate: "Kiwango cha Hatari (%)",
    search: "Tafuta...",
    timeframe: "Muda wa Ufuatiliaji",
    all: "Zote",
    trend: "Mwenendo wa Utapeli",

    // Authentication & Reset Password
    loginTitle: "Mfumo wa Usimamizi wa Utapeli - BOT",
    password: "Nenosiri",
    oldPassword: "Nenosiri la Zamani",
    newPassword: "Nenosiri Jipya",
    confirmNewPassword: "Thibitisha Nenosiri Jipya",
    changePassword: "Badilisha Nenosiri",
    forgotPassword: "Umesahau Nenosiri?",
    resetPassword: "Weka Upya Nenosiri",
    resetPasswordSub: "Ingiza nenosiri lako jipya salama hapa chini ili kukamilisha mchakato.",
    username: "Barua Pepe / Mtumiaji",
    fullName: "Jina Kamili",
    role: "Wajibu / Fursa (Role)",
    registerOfficer: "Sajili Afisa Mpya",
    officerList: "Orodha ya Maafisa wa Mfumo",

    // Models & Metrics (Embedded)
    registryTitle: "Usimamizi wa Models & Metrics",
    registrySub: "Tazama utendaji, vipimo vya usahihi (accuracy/f1-score), na badilisha model inayofanya kazi.",
    viewModelMetrics: "Tazama Metrics",
    btnReloadRAM: "🔄 Reload Models kwenye RAM",
    thVersion: "Toleo",
    thDescription: "Maelezo ya Utendaji",
    thDataset: "Ukubwa wa Data",
    noDescription: "Haina maelezo ya ziada.",
    registryEmpty: "Hakuna models zilizosajiliwa hivi sasa.",
    f1ScoreText: "F1-Score",
    precisionText: "Precision",
    recallText: "Recall",
    accuracyText: "Accuracy",
    bestBadge: "Inayofanya Kazi",

    // Live Transactions
    txTitle: "Mtiririko wa Live Data (Transactions)",
    txSub: "Ufuatiliaji wa papo hapo wa miamala inayoingia kutoka kwenye mifumo ya makazi.",
    txTotal: "Jumla",
    txItems: "Miamala",
    txTimeOrStep: "Muda / Sekunde",
    txType: "Aina ya Muamala",
    txAmount: "Kiasi (TZS/USD)",
    txOldOrig: "Salio la Awali (Akaunti ya Kutuma)",
    txNewOrig: "Salio Jipya (Akaunti ya Kutuma)",
    txOldDest: "Salio la Awali (Akaunti ya Kupokea)",
    txNewDest: "Salio Jipya (Akaunti ya Kupokea)",
    txEmpty: "Hakuna miamala inayotiririka hivi sasa.",
    pagePrev: "◀ Nyuma",
    pageNext: "Mbele ▶",

    // Dialogs
    dialogActiveTitle: "Thibitisha Kuwasha Model",
    dialogDeactiveTitle: "Thibitisha Kuzima Model",
    dialogDeleteTitle: "Thibitisha Kufuta Model",
    dialogActiveMsg: "Una uhakika unataka kuwasha model hii? Model ya sasa itawekwa pembeni na hii inza kuanza kufanya kazi mara moja.",
    dialogDeactiveMsg: "Una uhakika unataka kuizima model hii?",
    dialogDeleteMsg: "Hatua hii itafuta kabisa faili la model na taarifa zake zote. Kitendo hiki hakirudishwi nyuma!"
  },
  ENG: {
    // Navigation & Main Titles
    fraudSummary: "Fraud Summary",
    fraudReviews: "Fraud Reviews",
    models: "Models & Metrics",
    transactions: "Live Transactions",
    volumeAnalysis: "Volume & Value",
    businessAnalytics: "Business Intelligence",
    officers: "Officers Directory",
    airflow: "Go to Airflow Pipeline",
    logout: "Sign Out",
    loggedAs: "Logged in as",

    // Common Actions & Labels
    confirmAction: "Confirm Action",
    cancel: "Cancel",
    confirm: "Confirm",
    active: "Active",
    inactive: "Inactive",
    status: "System Status",
    actions: "Actions",
    totalTransactions: "Total Volume",
    predictedFraud: "Flagged Suspicious",
    pendingReviews: "Pending Compliance Review",
    confirmedFraud: "Confirmed Fraud",
    fraudRate: "Fraud Risk Index (%)",
    search: "Search...",
    timeframe: "Timeframe",
    all: "All",
    trend: "Fraud Activity Trend",

    // Authentication & Reset Password
    loginTitle: "Bank of Tanzania - Fraud Radar Portal",
    password: "Password",
    oldPassword: "Old Password",
    newPassword: "New Password",
    confirmNewPassword: "Confirm New Password",
    changePassword: "Change Password",
    forgotPassword: "Forgot Password?",
    resetPassword: "Reset Password",
    resetPasswordSub: "Enter your new secure password below to regain system entry.",
    username: "Email / Username",
    fullName: "Full Name",
    role: "User Role & Privileges",
    registerOfficer: "Register New Compliance Officer",
    officerList: "System Officers Directory",

    // Models & Metrics (Embedded)
    registryTitle: "Models & Metrics Management",
    registrySub: "Monitor performance benchmarks, evaluation metrics, and active state triggers.",
    viewModelMetrics: "View Metrics & Charts",
    btnReloadRAM: "🔄 Reload Models in RAM",
    thVersion: "Version",
    thDescription: "Operational Notes",
    thDataset: "Training Dataset Size",
    noDescription: "No additional notes provided.",
    registryEmpty: "No analytical models found in the system registry.",
    f1ScoreText: "F1-Score",
    precisionText: "Precision",
    recallText: "Recall",
    accuracyText: "Accuracy",
    bestBadge: "Active Production",

    // Live Transactions
    txTitle: "Live Data Streaming Monitor",
    txSub: "Real-time stream monitoring across core settlement endpoints.",
    txTotal: "Total Streaming",
    txItems: "Transactions",
    txTimeOrStep: "Timestamp / Sequence",
    txType: "Transaction Type",
    txAmount: "Amount",
    txOldOrig: "Origin Initial Balance",
    txNewOrig: "Origin Updated Balance",
    txOldDest: "Destination Initial Balance",
    txNewDest: "Destination Updated Balance",
    txEmpty: "No live stream activity currently detected.",
    pagePrev: "◀ Previous",
    pageNext: "Next ▶",

    // Dialogs
    dialogActiveTitle: "Confirm Model Activation",
    dialogDeactiveTitle: "Confirm Model Deactivation",
    dialogDeleteTitle: "Confirm Permanent Deletion",
    dialogActiveMsg: "Are you sure you want to activate this model for live evaluation?",
    dialogDeactiveMsg: "Are you sure you want to deactivate this model?",
    dialogDeleteMsg: "Critical Warning! This will permanently remove the binary file and metadata."
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('bot_lang');
    return (saved === 'SW' || saved === 'ENG') ? saved : 'SW';
  });

  const toggleLanguage = () => {
    setLanguage((prevLang) => {
      const nextLang = prevLang === 'SW' ? 'ENG' : 'SW';
      localStorage.setItem('bot_lang', nextLang);
      return nextLang;
    });
  };

  const t = (key) => {
    const currentLang = (language === 'SW' || language === 'ENG') ? language : 'SW';
    return translations[currentLang]?.[key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider!");
  }
  return context;
};
