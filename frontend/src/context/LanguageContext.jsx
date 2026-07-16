import React, { createContext, useContext, useState, useEffect } from 'react';

// 1. Tafsiri zetu zote za lugha
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
    metricsSub: "Vipimo vya ubora wa mifumo ya AI iliyosajiliwa (Hali ya Kusoma Tu)",
    searchModelPlaceholder: "Tafuta Model...",
    rank: "Nafasi",
    modelName: "Jina la AI Model",
    f1ScoreText: "F1-Score (Kipimo Kuu)",
    precisionText: "Precision",
    recallText: "Recall (Kiwango cha Ukamataji)",
    accuracyText: "Accuracy",
    bestBadge: "Bora Zaidi",
    loadingMetrics: "Inapakia vipimo vya mifano...",
    noModelsFound: "Hakuna model yoyote iliyopatikana."
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
    noModelsFound: "No models found matching your search."
  }
};

// 2. Kutengeneza React Context
const LanguageContext = createContext();

// 3. Provider Component ambayo itafunika App yetu
export const LanguageProvider = ({ children }) => {
  // Chaguo la msingi ni Swahili (SW) au jinsi mtumiaji alivyosave mwanzoni
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('bot_lang') || 'SW';
  });

  const toggleLanguage = () => {
    setLanguage((prevLang) => {
      const nextLang = prevLang === 'SW' ? 'ENG' : 'SW';
      localStorage.setItem('bot_lang', nextLang);
      return nextLang;
    });
  };

  // Kazi ya kutafsiri maneno (t function)
  const t = (key) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// 4. Custom Hook ya kurahisisha matumizi ya lugha
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage lazima itumike ndani ya LanguageProvider!");
  }
  return context;
};
