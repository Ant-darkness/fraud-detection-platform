STRUCTURE

frontend/
│
├── public/
│
├── src/
│   │
│   ├── api/
│   │      axios.js
│   │      authApi.js
│   │      dashboardApi.js
│   │      transactionApi.js
│   │      reviewApi.js
│   │      modelApi.js
│   │      metricApi.js
│   │      officerApi.js
│   │
│   ├── assets/
│   │      bot-logo.png
│   │
│   ├── components/
│   │      │
│   │      ├── common/
│   │      │      Button.jsx
│   │      │      Card.jsx
│   │      │      Badge.jsx
│   │      │      Modal.jsx
│   │      │      ConfirmDialog.jsx
│   │      │      Loading.jsx
│   │      │      EmptyState.jsx
│   │      │
│   │      ├── dashboard/
│   │      │      StatCard.jsx
│   │      │      FraudTrendChart.jsx
│   │      │
│   │      ├── layout/
│   │      │      Sidebar.jsx
│   │      │      MobileSidebar.jsx
│   │      │      Topbar.jsx
│   │      │
│   │      └── tables/
│   │             TransactionsTable.jsx
│   │             ReviewsTable.jsx
│   │             ModelsTable.jsx
│   │             MetricsTable.jsx
│   │             OfficersTable.jsx
│   │
│   ├── layouts/
│   │      DashboardLayout.jsx
│   │
│   ├── pages/
│   │      Login.jsx
│   │      ChangePassword.jsx
│   │      Dashboard.jsx
│   │      Transactions.jsx
│   │      Reviews.jsx
│   │      Models.jsx
│   │      Metrics.jsx
│   │      Officers.jsx
│   │
│   ├── routes/
│   │      ProtectedRoute.jsx
│   │
│   ├── styles/
│   │      theme.css
│   │
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
│
├── package.json
├── vite.config.js
└── index.html
