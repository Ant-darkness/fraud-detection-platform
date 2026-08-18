import React, { createContext, useContext, useState } from 'react';

const translations = {
  SW: {
    fraudSummary: "Muhtasari wa Utapeli",
    fraudReviews: "Uhakiki wa Utapeli",
    models: "Mifumo ya Uchambuzi",
    transactions: "Miamala Halisi Live",
    volumeAnalysis: "Uchambuzi wa Thamani",
    businessAnalytics: "Uchambuzi wa Kina (BI)",
    officers: "Usimamizi wa Maafisa",
    airflow: "Apache Airflow Pipeline",
    logout: "Ondoka Mfumoni",
    loggedAs: "Umeingia kama",

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

    loginTitle: "Benki Kuu ya Tanzania - Mfumo wa Udhibiti wa Utapeli",
    password: "Nenosiri",
    oldPassword: "Nenosiri la Sasa",
    newPassword: "Nenosiri Jipya",
    confirmNewPassword: "Thibitisha Nenosiri Jipya",
    changePassword: "Badilisha Nenosiri",
    forgotPassword: "Umesahau Nenosiri?",
    resetPassword: "Weka Upya Nenosiri",
    resetPasswordSub: "Ingiza nenosiri lako jipya salama hapa chini.",
    username: "Barua Pepe / Mtumiaji",
    fullName: "Jina Kamili",
    role: "Wajibu Wa Afisa",
    registerOfficer: "Sajili Afisa Mpya",
    officerList: "Orodha ya Maafisa wa Mfumo",

    registryTitle: "Usimamizi wa Mifumo ya Uchambuzi",
    registrySub: "Tazama utendaji na usahihi wa mifumo ya utambuzi wa miamala.",
    viewModelMetrics: "Tazama Metrics",
    btnReloadRAM: "🔄 Reload kwenye RAM",
    thVersion: "Toleo",
    thDescription: "Maelezo ya Utendaji",
    thDataset: "Ukubwa wa Data",
    noDescription: "Haina maelezo ya ziada.",
    registryEmpty: "Hakuna mifumo iliyosajiliwa hivi sasa.",
    f1ScoreText: "F1-Score",
    precisionText: "Precision",
    recallText: "Recall",
    accuracyText: "Accuracy",
    bestBadge: "Inayofanya Kazi",

    txTitle: "Mtiririko wa Live Data (Transactions)",
    txSub: "Ufuatiliaji wa papo hapo wa miamala inayoingia kutoka kwenye mifumo ya makazi.",
    txTotal: "Jumla",
    txItems: "Miamala",
    txTimeOrStep: "Muda / Sekunde",
    txType: "Aina ya Muamala",
    txAmount: "Kiasi (TZS)",
    txOldOrig: "Salio la Awali (Kutuma)",
    txNewOrig: "Salio Jipya (Kutuma)",
    txOldDest: "Salio la Awali (Kupokea)",
    txNewDest: "Salio Jipya (Kupokea)",
    txEmpty: "Hakuna miamala inayotiririka hivi sasa.",
    pagePrev: "◀ Nyuma",
    pageNext: "Mbele ▶",

    btnMinimize: "Punguza Window",
    btnMaximize: "Enua Window"
  },
  ENG: {
    fraudSummary: "Fraud Summary",
    fraudReviews: "Fraud Reviews",
    models: "Analytical Models",
    transactions: "Live Streaming",
    volumeAnalysis: "Volume & Value",
    businessAnalytics: "Business Intelligence",
    officers: "Officers Directory",
    airflow: "Apache Airflow Pipeline",
    logout: "Sign Out",
    loggedAs: "Logged in as",

    confirmAction: "Confirm Action",
    cancel: "Cancel",
    confirm: "Confirm",
    active: "Active",
    inactive: "Inactive",
    status: "System Status",
    actions: "Actions",
    totalTransactions: "Total Volume",
    predictedFraud: "Flagged Suspicious",
    pendingReviews: "Pending Review",
    confirmedFraud: "Confirmed Fraud",
    fraudRate: "Fraud Risk Index (%)",
    search: "Search...",
    timeframe: "Timeframe",
    all: "All",
    trend: "Fraud Activity Trend",

    loginTitle: "Bank of Tanzania - Fraud Oversight Portal",
    password: "Password",
    oldPassword: "Old Password",
    newPassword: "New Password",
    confirmNewPassword: "Confirm New Password",
    changePassword: "Change Password",
    forgotPassword: "Forgot Password?",
    resetPassword: "Reset Password",
    resetPasswordSub: "Enter your secure credentials below.",
    username: "Email / Username",
    fullName: "Full Name",
    role: "User Privileges",
    registerOfficer: "Register Compliance Officer",
    officerList: "Officers Directory",

    registryTitle: "Model Operations Management",
    registrySub: "Monitor detection metrics and performance triggers.",
    viewModelMetrics: "View Metrics",
    btnReloadRAM: "🔄 Reload RAM Models",
    thVersion: "Version",
    thDescription: "Notes",
    thDataset: "Dataset Size",
    noDescription: "No additional notes provided.",
    registryEmpty: "No analytical models registered.",
    f1ScoreText: "F1-Score",
    precisionText: "Precision",
    recallText: "Recall",
    accuracyText: "Accuracy",
    bestBadge: "Active Production",

    txTitle: "Live Data Streaming Monitor",
    txSub: "Real-time stream monitoring across core settlement endpoints.",
    txTotal: "Total Streaming",
    txItems: "Transactions",
    txTimeOrStep: "Timestamp / Sequence",
    txType: "Transaction Type",
    txAmount: "Amount (TZS)",
    txOldOrig: "Origin Initial Balance",
    txNewOrig: "Origin Updated Balance",
    txOldDest: "Destination Initial Balance",
    txNewDest: "Destination Updated Balance",
    txEmpty: "No live stream activity detected.",
    pagePrev: "◀ Previous",
    pageNext: "Next ▶",

    btnMinimize: "Minimize Window",
    btnMaximize: "Maximize Window"
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('bot_lang');
    return (saved === 'SW' || saved === 'ENG') ? saved : 'SW';
  });

  const toggleLanguage = () => {
    setLanguage((prev) => {
      const nextLang = prev === 'SW' ? 'ENG' : 'SW';
      localStorage.setItem('bot_lang', nextLang);
      return nextLang;
    });
  };

  const t = (key) => translations[language]?.[key] ?? key;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider!");
  return context;
};
