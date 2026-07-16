STRUCTURE

src/
├── assets/
│   └── logo.png             # Logo yako (Inakaa hapa au kwenye public/)
├── context/
│   ├── AuthContext.jsx      # Kusimamia Login, Logout, Session ya 5-mins, na temporary password
│   └── LanguageContext.jsx  # Kusimamia utafsiri wa lugha (Swahili/English)
├── components/
│   ├── Sidebar.jsx          # Glassmorphism Fixed Sidebar
│   ├── Topbar.jsx           # Pink Topbar yenye Golden Text na Logo
│   ├── ConfirmDialog.jsx    # Golden Confirmation Dialog inayotumika mfumo mzima
│   └── GlassCard.jsx        # Reusable component ya Glass Container
├── pages/
│   ├── Login.jsx            # Login page (pamoja na Change Password & Reset Password)
│   ├── Dashboard.jsx        # Advanced Analytics na Fraud Graphs zenye range-filters
│   ├── VolumeAnalysis.jsx   # Volume & Amount Analytics na Agent Explanations
│   ├── FraudReviews.jsx     # Pending reviews, Transaction inspection modal, Approve/Reject
│   ├── ModelsRegistry.jsx   # Leaderboard ya models, Activation/Delete/Deactivation
│   ├── OfficersAdmin.jsx    # Usimamizi wa Officers (Admin Only) & Registration Form
│   └── Transactions.jsx     # Orodha kamili ya miamala yote
├── App.jsx                  # Main App with Router & Layout
└── main.jsx                 # Entry point
