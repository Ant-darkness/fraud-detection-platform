import React, { createContext, useContext, useState } from 'react';

const translations = {
  SW: {
    dashboard: "Eneo la Kazi",
    fraudReviews: "Uhakiki wa Utapeli",
    models: "Mifano ya AI (Models)",
    transactions: "Miamala",
    volumeAnalysis: "Uchambuzi wa Thamani",
    officers: "Maafisa",
    airflow: "Nenda Airflow",
    logout: "Ondoka",
    confirmAction: "Thibitisha Kitendo",
    cancel: "Ghairi",
    confirm: "Thibitisha",
    active: "Inafanya kazi",
    inactive: "Haifanyi kazi",
    status: "Hali",
    actions: "Vitendo",
    totalTransactions: "Jumla ya Miamala",
    predictedFraud: "Kadirio la Utapeli",
    pendingReviews: "Reviews Zinazosubiri",
    confirmedFraud: "Utapeli uliothibitishwa",
    fraudRate: "Kiwango cha Utapeli",
    loginTitle: "Ingia Kwenye Mfumo - BOT",
    password: "Nenosiri",
    newPassword: "Nenosiri Jipya",
    changePassword: "Badili Nenosiri",
    forgotPassword: "Umesahau Nenosiri?",
    resetPassword: "Weka upya Nenosiri",
    username: "Jina la mtumiaji",
    fullName: "Jina Kamili",
    role: "Wajibu",
    registerOfficer: "Sajili Afisa Mpya",
    officerList: "Orodha ya Maafisa",
    search: "Tafuta...",
    timeframe: "Muda",
    all: "Zote",
    trend: "Mwenendo wa Utapeli",
    metricsTitle: "AI Leaderboard ya Utendaji",
    metricsSub: "Vipimo vya ubora vya mifumo ya AI iliyosajiliwa (Hali ya Kusoma Tu)",
    searchModelPlaceholder: "Tafuta Model...",
    rank: "Nafasi",
    modelName: "Jina la AI Model",
    f1ScoreText: "F1-Score (Kipimo Kuu)",
    precisionText: "Precision",
    recallText: "Recall (Kiwango cha Ukamataji)",
    accuracyText: "Accuracy",
    bestBadge: "Bora Zaidi",
    loadingMetrics: "Inapakia vipimo vya mifano...",
    noModelsFound: "Hakuna model yoyote iliyopatikana.",
    
    // NYONGEZA MPYA ZA KITAKWIMU NA TRANSACTIONAL
    txTitle: "Miamala Halisi (Live Streaming)",
    txSub: "Ufuatiliaji wa kina wa salio la asili, salio jipya na mtiririko wa fedha katika mifumo ya makazi.",
    txTotal: "Jumla",
    txItems: "Miamala",
    txTimeOrStep: "Muda / Hatua",
    txType: "Aina (Type)",
    txAmount: "Kiasi (Amount)",
    txOldOrig: "Salio la Mwanzo (Orig)",
    txNewOrig: "Salio Jipya (Orig)",
    txOldDest: "Salio la Mwanzo (Dest)",
    txNewDest: "Salio Jipya (Dest)",
    txEmpty: "Hakuna miamala halisi iliyoingia hivi sasa kwenye database yetu.",
    txStepLabel: "Hatua",
    pagePrev: "◀ Nyuma",
    pageNext: "Mbele ▶",
    pageOf: "kati ya",
    pageLabel: "Ukurasa",
    btnMaximize: "🖥️ Kuza Jedwali",
    btnMinimize: "🗗 Punguza",
    
    // REGISTRY MANAGER TRANSLATIONS
    registryTitle: "🏆 AI Model Registry Manager",
    registrySub: "Simamia mifano ya ujifunzaji wa mashine (Machine Learning Models) na upelekaji wake kazini.",
    btnReloadRAM: "🔄 Reload Models kwenye RAM",
    thVersion: "Toleo",
    thDescription: "Maelezo",
    thDataset: "Ukubwa wa Dataset",
    noDescription: "Haina maelezo ya ziada.",
    registryEmpty: "Hakuna AI models zozote zilizosajiliwa hivi sasa kwenye Registry yetu.",
    errId: "Hitilafu: ID ya model haipatikani!",
    dialogActiveTitle: "Thibitisha Kuwasha Model",
    dialogDeactiveTitle: "Thibitisha Kuzima Model",
    dialogDeleteTitle: "Thibitisha Kufuta kabisa Model",
    dialogActiveMsg: "Una uhakika unataka kuwasha model hii kuwa Active? Model ya sasa iliyopo kazini itazimwa mara moja na hii itaanza kukagua miamala.",
    dialogDeactiveMsg: "Una uhakika unataka kuizima hii model isifanye kazi? Mfumo hautakuwa na model inayofanya kazi hadi utakapowasha nyingine.",
    dialogDeleteMsg: "Tahadhari kubwa! Hatua hii itafuta kabisa faili la model (.pkl/.h5) kutoka ndani ya Docker container na database. Kitendo hiki hakirudishwi nyuma!"
  },
  ENG: {
    dashboard: "Dashboard",
    fraudReviews: "Fraud Reviews",
    models: "AI Models",
    transactions: "Transactions",
    volumeAnalysis: "Volume & Value",
    officers: "Officers Admin",
    airflow: "Go to Airflow",
    logout: "Logout",
    confirmAction: "Confirm Action",
    cancel: "Cancel",
    confirm: "Confirm",
    active: "Active",
    inactive: "Inactive",
    status: "Status",
    actions: "Actions",
    totalTransactions: "Total Transactions",
    predictedFraud: "Predicted Frauds",
    pendingReviews: "Pending Reviews",
    confirmedFraud: "Confirmed Frauds",
    fraudRate: "Fraud Rate",
    loginTitle: "Sign In - BOT Portal",
    password: "Password",
    newPassword: "New Password",
    changePassword: "Change Password",
    forgotPassword: "Forgot Password?",
    resetPassword: "Reset Password",
    username: "Username",
    fullName: "Full Name",
    role: "Role",
    registerOfficer: "Register New Officer",
    officerList: "Officers Directory",
    search: "Search...",
    timeframe: "Timeframe",
    all: "All",
    trend: "Fraud Trend",
    metricsTitle: "AI Models Performance Leaderboard",
    metricsSub: "Registered AI models performance benchmarks (Read-Only Mode)",
    searchModelPlaceholder: "Search Model...",
    rank: "Rank",
    modelName: "AI Model Name",
    f1ScoreText: "F1-Score (Primary Metric)",
    precisionText: "Precision",
    recallText: "Recall (Fraud Catch Rate)",
    accuracyText: "Accuracy",
    bestBadge: "Best",
    loadingMetrics: "Loading model metrics...",
    noModelsFound: "No models found matching your search.",
    
    // NEW TRANSACTIONAL TRANSLATIONS
    txTitle: "Live Transactions Streaming",
    txSub: "Comprehensive tracking of origin balance, new balance, and fund flow within settlement systems.",
    txTotal: "Total",
    txItems: "Transactions",
    txTimeOrStep: "Time / Step",
    txType: "Type",
    txAmount: "Amount",
    txOldOrig: "Old Balance (Orig)",
    txNewOrig: "New Balance (Orig)",
    txOldDest: "Old Balance (Dest)",
    txNewDest: "New Balance (Dest)",
    txEmpty: "No live transactions currently available in the database.",
    txStepLabel: "Step",
    pagePrev: "◀ Previous",
    pageNext: "Next ▶",
    pageOf: "of",
    pageLabel: "Page",
    btnMaximize: "🖥️ Maximize Table",
    btnMinimize: "🗗 Minimize",
    
    // REGISTRY MANAGER TRANSLATIONS
    registryTitle: "🏆 AI Model Registry Manager",
    registrySub: "Manage machine learning models deployment, state triggers, and operational versions.",
    btnReloadRAM: "🔄 Reload Models in RAM",
    thVersion: "Version",
    thDescription: "Description",
    thDataset: "Dataset Size",
    noDescription: "No additional description available.",
    registryEmpty: "No AI models currently registered in the system registry.",
    errId: "Error: Model ID cannot be found!",
    dialogActiveTitle: "Confirm Model Activation",
    dialogDeactiveTitle: "Confirm Model Deactivation",
    dialogDeleteTitle: "Confirm Permanent Deletion",
    dialogActiveMsg: "Are you sure you want to activate this model? The currently active model will be decommissioned immediately.",
    dialogDeactiveMsg: "Are you sure you want to deactivate this model? The core engine will have no active running model until a new one is triggered.",
    dialogDeleteMsg: "Critical Warning! This action permanently deletes the binary model file (.pkl/.h5) from storage and DB records. This cannot be undone!"
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
    throw new Error("useLanguage lazima itumike ndani ya LanguageProvider!");
  }
  return context;
};
