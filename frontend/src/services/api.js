const BASE_URL = "http://localhost:8000";

// Kazi ya usaidizi kupata Headers zote zikiwa na Authorization Token
const getHeaders = () => {
  const savedUser = localStorage.getItem('bot_user');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (savedUser) {
    const { token } = JSON.parse(savedUser);
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Kazi ya usaidizi ya kushughulikia majibu na makosa ya API (Error Handling)
const handleResponse = async (response) => {
  if (!response.ok) {
    // Jaribu kusoma maelezo ya kosa kutoka FastAPI (detail)
    try {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Hitilafu imetokea kwenye server.");
    } catch (e) {
      throw new Error(e.message || "Mawasiliano na mfumo yamefeli.");
    }
  }
  return response.json();
};

export const api = {
  // --- AUTHENTICATION ---
  auth: {
    login: async (email, password) => {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      return handleResponse(response);
    },
    changePassword: async (newPassword) => {
      const response = await fetch(`${BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ new_password: newPassword }),
      });
      return handleResponse(response);
    },
    forgotPassword: async (email) => {
      const response = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      return handleResponse(response);
    },
    resetPasswordConfirm: async (token, newPassword) => {
      const response = await fetch(`${BASE_URL}/auth/reset-password-confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: newPassword }),
      });
      return handleResponse(response);
    }
  },

  // --- DASHBOARD & ANALYTICS ---
  dashboard: {
    getSummary: async () => {
      const response = await fetch(`${BASE_URL}/dashboard/summary`, { headers: getHeaders() });
      return handleResponse(response);
    },
    getAnalytics: async (timeframe = '7days', startDate = null, endDate = null) => {
      let url = `${BASE_URL}/dashboard/analytics?timeframe=${timeframe}`;
      if (startDate && endDate) {
        url += `&start_date=${startDate}&end_date=${endDate}`;
      }
      const response = await fetch(url, { headers: getHeaders() });
      return handleResponse(response);
    },
    getVolumeComparison: async () => {
      const response = await fetch(`${BASE_URL}/dashboard/volume-comparison`, { headers: getHeaders() });
      return handleResponse(response);
    }
  },

  // --- AI MODELS REGISTRY ---
  models: {
    getAll: async () => {
      const response = await fetch(`${BASE_URL}/models/`, { headers: getHeaders() });
      return handleResponse(response);
    },
    getActive: async () => {
      const response = await fetch(`${BASE_URL}/models/active`, { headers: getHeaders() });
      return handleResponse(response);
    },
    reload: async () => {
      const response = await fetch(`${BASE_URL}/models/reload`, { method: 'POST', headers: getHeaders() });
      return handleResponse(response);
    },
    activate: async (modelId) => {
      if (!modelId) throw new Error("Hitilafu: ID ya model haipo au haitambuliki!");
      const response = await fetch(`${BASE_URL}/models/${modelId}/activate`, { 
        method: 'PUT', 
        headers: getHeaders() 
      });
      return handleResponse(response);
    },
    reject: async (modelId) => {
      if (!modelId) throw new Error("Hitilafu: ID ya model haipo au haitambuliki!");
      const response = await fetch(`${BASE_URL}/models/${modelId}/reject`, { 
        method: 'PUT', 
        headers: getHeaders() 
      });
      return handleResponse(response);
    },
    delete: async (modelId) => {
      if (!modelId) throw new Error("Hitilafu: ID ya model haipo au haitambuliki!");
      const response = await fetch(`${BASE_URL}/models/${modelId}`, { 
        method: 'DELETE', 
        headers: getHeaders() 
      });
      return handleResponse(response);
    }
  },

  // --- FRAUD REVIEWS ---
  reviews: {
    getPending: async () => {
      const response = await fetch(`${BASE_URL}/reviews/pending`, { headers: getHeaders() });
      return handleResponse(response);
    },
    approve: async (reviewId) => {
      if (!reviewId) throw new Error("Hitilafu: ID ya review haipo!");
      const response = await fetch(`${BASE_URL}/reviews/${reviewId}/approve`, { 
        method: 'PUT', 
        headers: getHeaders() 
      });
      return handleResponse(response);
    },
    reject: async (reviewId) => {
      if (!reviewId) throw new Error("Hitilafu: ID ya review haipo!");
      const response = await fetch(`${BASE_URL}/reviews/${reviewId}/reject`, { 
        method: 'PUT', 
        headers: getHeaders() 
      });
      return handleResponse(response);
    }
  },

  // --- OFFICERS (ADMIN ONLY) ---
  officers: {
    list: async () => {
      const response = await fetch(`${BASE_URL}/officers/`, { headers: getHeaders() });
      return handleResponse(response);
    },
    register: async (fullName, username, email, password, role = 'OFFICER') => {
      const queryParams = new URLSearchParams({ full_name: fullName, username, email, password, role });
      const response = await fetch(`${BASE_URL}/officers/register?${queryParams}`, {
        method: 'POST',
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    enable: async (officerId) => {
      if (!officerId) throw new Error("Hitilafu: ID ya afisa haipo!");
      const response = await fetch(`${BASE_URL}/officers/${officerId}/enable`, { 
        method: 'PUT', 
        headers: getHeaders() 
      });
      return handleResponse(response);
    },
    disable: async (officerId) => {
      if (!officerId) throw new Error("Hitilafu: ID ya afisa haipo!");
      const response = await fetch(`${BASE_URL}/officers/${officerId}/disable`, { 
        method: 'PUT', 
        headers: getHeaders() 
      });
      return handleResponse(response);
    }
  },

  // --- TRANSACTIONS ---
  transactions: {
    getAll: async () => {
      const response = await fetch(`${BASE_URL}/transactions/`, { headers: getHeaders() });
      return handleResponse(response);
    },
    getOne: async (transactionId) => {
      if (!transactionId) throw new Error("Hitilafu: ID ya muamala haipo!");
      const response = await fetch(`${BASE_URL}/transactions/${transactionId}`, { headers: getHeaders() });
      return handleResponse(response);
    }
  }
};
