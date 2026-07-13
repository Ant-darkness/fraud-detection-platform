import React, { createContext, useState, useContext } from 'react';

const translations = {
  en: {
    title: "BANK OF TANZANIA",
    subtitle: "Financial Fraud Intelligence & Real-time Audit System",
    dashboard: "Command Centre", fraudReview: "Fraud Queue", officerManagement: "Officer Registry",
    modelRegistry: "AI Models", metrics: "Analytical Metrics", graphs: "Advanced Trends",
    airflow: "Airflow Pipeline", login: "Secure Sign-In", logout: "Exit Session",
    username: "Staff Username", password: "Password", changePass: "Enforce Password Update",
    newPass: "New Secure Password", confirm: "Confirm", reject: "Flag Fraud", approve: "Approve TX",
    status: "Status", agentInsight: "BoT AI Agent Insights", txVolumeTab: "Tx Volume Metrics",
    forgotPass: "Forgot Password?", resetTitle: "Reset Password Link", backToLogin: "Back to Login",
    sendCode: "Send Verification Code", verifyCode: "Verify 6-Digit Token", enter6Digit: "Enter 6-Digit Code"
  },
  sw: {
    title: "BENKI KUU YA TANZANIA",
    subtitle: "Mfumo wa Kichujio cha Utapeli wa Kifedha kwa Wakati Halisi",
    dashboard: "Ukurasa Mkuu", fraudReview: "Foleni ya Mapitio", officerManagement: "Orodha ya Maafisa",
    modelRegistry: "Mifumo ya AI", metrics: "Vigezo vya Ubora", graphs: "Grafu za Uchambuzi",
    airflow: "Mtiririko wa Airflow", login: "Ingia Mfumoni", logout: "Ondoka",
    username: "Jina la Mtumiaji", password: "Nywila", changePass: "Badilisha Nywila ya Lazima",
    newPass: "Nywila Mpya ya Usalama", confirm: "Thibitisha", reject: "Kataa (Tapeli)", approve: "Ruhusu Muamala",
    status: "Hali", agentInsight: "Uchambuzi wa Wakala wa AI (BoT)", txVolumeTab: "Ujazo wa Miamala",
    forgotPass: "Umesahau Nywila?", resetTitle: "Urejesho wa Nywila", backToLogin: "Rudi Nyuma",
    sendCode: "Tuma Namba ya Uhakiki", verifyCode: "Hakiki Tokeni (Namba 6)", enter6Digit: "Ingiza Namba 6 za Siri"
  }
};

const LanguageContext = createContext();
export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState('sw');
  const t = (key) => translations[lang][key] || key;
  return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>;
};
export const useLang = () => useContext(LanguageContext);
