const BASE_URL = "http://localhost:8000";

const WS_BASE_URL = BASE_URL.replace(/^http/, 'ws') + "/ws/live-feed";



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
    
  // --- WEBSOCKET SERVICE ---
  ws: {
    connect: (onMessage, onError) => {
      const socket = new WebSocket(WS_BASE_URL);

      socket.onopen = () => {
        console.log("⚡ Live WebSocket Stream Connected to FastAPI.");
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (onMessage) onMessage(data);
        } catch (err) {
          console.error("WebSocket message parsing error:", err);
        }
      };

      socket.onerror = (error) => {
        console.error("WebSocket Error:", error);
        if (onError) onError(error);
      };

      socket.onclose = () => {
        console.warn("WebSocket disconnected. Reconnecting attempt in 3s...");
      };

      return socket;
    }
  },

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
//  import { BASE_URL, getHeaders, handleResponse } from './config'; // Recalibrate paths based on your setup

  dashboard: {
    // 1. Summary & Analytics Base REST API
    getSummary: async () => {
      const response = await fetch(`${BASE_URL}/dashboard/summary`, { headers: getHeaders() });
      return handleResponse(response);
    },

    getAnalytics: async (timeframe = '24hrs', startDate = null, endDate = null) => {
      let url = `${BASE_URL}/dashboard/analytics?timeframe=${timeframe}`;
      if (startDate && endDate) {
        url += `&start_date=${startDate}&end_date=${endDate}`;
      }
      const response = await fetch(url, { headers: getHeaders() });
      return handleResponse(response);
    },

    getVolumeComparison: async (params = {}) => {
      const { timeframe, custom_start, custom_end } = params;
      const urlParams = new URLSearchParams();
      if (timeframe) urlParams.append('timeframe', timeframe);
      if (custom_start) urlParams.append('custom_start', custom_start);
      if (custom_end) urlParams.append('custom_end', custom_end);

      const response = await fetch(`${BASE_URL}/dashboard/volume-comparison?${urlParams.toString()}`, {
        headers: getHeaders()
      });
      return handleResponse(response);
    },

    // 2. Real-Time WebSocket for Plotly/Recharts Live Volume
    connectVolumeWebSocket: (onMessageCallback, timeframe = '24hrs') => {
      const wsUrl = BASE_URL.replace(/^http/, 'ws') + '/dashboard/ws/live-volume';
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('WebSocket Connected for Live Chart');
        socket.send(JSON.stringify({ timeframe }));
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (onMessageCallback) {
          onMessageCallback(data);
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket Error:', error);
      };

      socket.onclose = () => {
        console.log('WebSocket Disconnected');
      };

      const changeTimeframe = (newTimeframe) => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ timeframe: newTimeframe }));
        }
      };

      return {
        socket,
        changeTimeframe,
        close: () => socket.close()
      };
    },

    // -------------------------------------------------------------
    // AGENT 2 INTEGRATION: Autonomous Trend & Liquidity Analysis (Zamani - HUIJAGUSA/HUIJAHARIBU)
    // -------------------------------------------------------------
    getTrendAnalysisAgent: async (params = {}) => {
      const { timeframe, custom_start, custom_end } = params;

      const urlParams = new URLSearchParams();
      if (timeframe) urlParams.append('timeframe', timeframe);
      if (custom_start) urlParams.append('custom_start', custom_start);
      if (custom_end) urlParams.append('custom_end', custom_end);

      const queryString = urlParams.toString();
      const finalUrl = `${BASE_URL}/api/v1/agents/trends${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(finalUrl, { headers: getHeaders() });
      return handleResponse(response);
    },

    // -------------------------------------------------------------
    // AI AGENTS PROMPT PORTALS (Mpya kwa ajili ya Dynamic Prompts)
    // -------------------------------------------------------------
    askFraudAgent: async (payload) => {
      const response = await fetch(`${BASE_URL}/api/v1/agents/ask-fraud`, {
        method: 'POST',
        headers: {
          ...getHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      return handleResponse(response);
    },

    askVolumeAgent: async (payload) => {
      const response = await fetch(`${BASE_URL}/api/v1/agents/ask-volume`, {
        method: 'POST',
        headers: {
          ...getHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      return handleResponse(response);
    }
  },


   
    // --- ADVANCED FORENSIC AGENT ANALYTICS ---
    businessAnalytics: {
      /**
       * AI AGENT ASSISTANT (SELECT-Only Query Agent)
       * Handles natural language forensic questions.
       * Restricted strictly to SELECT operations.
       */
      askAgent: async (prompt) => {
        const response = await fetch(`${BASE_URL}/api/v1/agents/query`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ prompt })
        });
        return handleResponse(response);
      },
    
      /**
       * Export analytical query results into CSV/Report format if needed.
       */
      exportReport: async (filters) => {
        const response = await fetch(`${BASE_URL}/analytics/export`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(filters)
        });
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
  
    // - METRICS REGISTRY ---
    metrics: {
      getLeaderboard: async () => {
        const response = await fetch(`${BASE_URL}/metrics/leaderboard`, { headers: getHeaders() });
        return handleResponse(response);
      },
      getById: async (modelId) => {
        const response = await fetch(`${BASE_URL}/metrics/${modelId}`, { headers: getHeaders() });
        return handleResponse(response);
      }
    },

  // --- FRAUD REVIEWS ---
  reviews: {
    getPending: async (page = 1, limit = 10) => {
      const response = await fetch(
        `${BASE_URL}/reviews/pending?page=${page}&limit=${limit}`, 
        { headers: getHeaders() }
      );
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
    getAll: async ({ page = 1, limit = 15 } = {}) => {
      // Inapachika vigezo rasmi kwenye URL ya ombi kwenda FastAPI
      const response = await fetch(`${BASE_URL}/transactions/?page=${page}&limit=${limit}`, { 
        headers: getHeaders() 
      });
      return handleResponse(response);
    },
    getOne: async (transactionId) => {
      if (!transactionId) throw new Error("Hitilafu: ID ya muamala haipo!");
      const response = await fetch(`${BASE_URL}/transactions/${transactionId}`, { headers: getHeaders() });
      return handleResponse(response);
    }
}

};
