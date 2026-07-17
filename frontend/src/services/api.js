const BASE_URL = "http://localhost:8000";

// Kazi ya usaidizi kupata Headers zote zikiwa na Authorization Token
// MAREKEBISHO: Inakubali 'customToken' wakati mtumiaji bado hajawekwa kwenye localStorage
const getHeaders = (customToken = null) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (customToken) {
    headers['Authorization'] = `Bearer ${customToken}`;
  } else {
    const savedUser = localStorage.getItem('bot_user');
    if (savedUser) {
      const { token } = JSON.parse(savedUser);
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
};

const handleResponse = async (response) => {
  if (!response.ok) {
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

    // 1. Mabadiliko ya kawaida ya profile (Yanauliza old_password)
    changePassword: async ({ old_password, new_password }) => {
      const response = await fetch(`${BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ 
          old_password: old_password, 
          new_password: new_password 
        }),
      });
      return handleResponse(response);
    },

    // 2. Mabadiliko ya lazima ya Login ya Kwanza (Haitaji old_password)
    forceChangePassword: async (newPassword, tempToken) => {
      if (!tempToken) throw new Error("Hitilafu ya Usalama: Token ya muda haipatikani!");
      
      const response = await fetch(`${BASE_URL}/auth/force-change-password`, {
        method: 'POST',
        headers: getHeaders(tempToken), // Pitisha token ya muda hapa
        body: JSON.stringify({ 
          new_password: newPassword 
        }),
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
        getVolumeComparison: async (params = {}) => {
            const { timeframe, custom_start, custom_end } = params;
        
            // Kutengeneza query string kwa njia salama
            const urlParams = new URLSearchParams();
            if (timeframe) urlParams.append('timeframe', timeframe);
            if (custom_start) urlParams.append('custom_start', custom_start);
            if (custom_end) urlParams.append('custom_end', custom_end);
        
            const queryString = urlParams.toString();
            const finalUrl = queryString
                ? `${BASE_URL}/dashboard/volume-comparison?${queryString}`
                : `${BASE_URL}/dashboard/volume-comparison`;
      
            const response = await fetch(finalUrl, { headers: getHeaders() });
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
