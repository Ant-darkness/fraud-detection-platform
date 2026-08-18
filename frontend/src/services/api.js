const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || "ws://localhost:8000/ws/live-feed";

const getHeaders = (customToken = null) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (customToken) {
    headers['Authorization'] = `Bearer ${customToken}`;
  } else {
    const savedUser = localStorage.getItem('bot_user');
    if (savedUser) {
      try {
        const { token } = JSON.parse(savedUser);
        if (token) headers['Authorization'] = `Bearer ${token}`;
      } catch (e) {
        console.error("Error parsing saved user:", e);
      }
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
      let socket = null;
      let reconnectInterval = null;

      const createSocket = () => {
        socket = new WebSocket(WS_BASE_URL);

        socket.onopen = () => {
          console.log("⚡ Live WebSocket Stream Connected to FastAPI.");
          if (reconnectInterval) clearInterval(reconnectInterval);
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
          console.warn("WebSocket disconnected. Reconnecting in 3 seconds...");
        };
      };

      createSocket();

      return {
        send: (msg) => {
          if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(typeof msg === 'string' ? msg : JSON.stringify(msg));
          }
        },
        close: () => {
          if (socket) socket.close();
        }
      };
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

    changePassword: async ({ old_password, new_password }) => {
      const response = await fetch(`${BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ old_password, new_password }),
      });
      return handleResponse(response);
    },

    forceChangePassword: async (newPassword, tempToken) => {
      if (!tempToken) throw new Error("Hitilafu ya Usalama: Token ya muda haipatikani!");
      
      const response = await fetch(`${BASE_URL}/auth/force-change-password`, {
        method: 'POST',
        headers: getHeaders(tempToken),
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

  // --- DASHBOARD & REALTIME AI AGENTS ---
  dashboard: {
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

    connectVolumeWebSocket: (onMessageCallback, timeframe = '24hrs') => {
      const wsClient = api.ws.connect((data) => {
        if (data.event_type === 'LIVE_PULSE_UPDATE' && onMessageCallback) {
          onMessageCallback(data.volume_chart);
        }
      });

      wsClient.send({ timeframe });

      return {
        changeTimeframe: (newTimeframe) => wsClient.send({ timeframe: newTimeframe }),
        close: () => wsClient.close()
      };
    },

    // -------------------------------------------------------------
    // REAL-TIME ANALYTICS AGENTS (VOLUME & FRAUD AGENTS)
    // -------------------------------------------------------------
    getVolumeAnalyticsAgent: async (timeframe = '7DAYS', language = 'sw') => {
      const response = await fetch(
        `${BASE_URL}/api/v1/agents/volume-analytics?timeframe=${timeframe}&language=${language}`, 
        { headers: getHeaders() }
      );
      return handleResponse(response);
    },

    getFraudAnalyticsAgent: async (timeframe = '7DAYS', language = 'sw') => {
      const response = await fetch(
        `${BASE_URL}/api/v1/agents/fraud-analytics?timeframe=${timeframe}&language=${language}`, 
        { headers: getHeaders() }
      );
      return handleResponse(response);
    }
  },

  // -------------------------------------------------------------
  // SCOPED FORENSIC SEARCH ASSISTANT (SCOPED QUERY AGENT)
  // -------------------------------------------------------------
  agents: {
    askScopedAgent: async (prompt, context = "business") => {
      const response = await fetch(`${BASE_URL}/api/v1/agents/query`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ prompt, context })
      });
      return handleResponse(response);
    },

    triggerModelAudit: async (modelId, metrics) => {
      const response = await fetch(`${BASE_URL}/api/v1/agents/model-audit`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ model_id: modelId, metrics })
      });
      return handleResponse(response);
    }
  },

  // --- AI MODELS & INTEGRATED METRICS ---
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
      const response = await fetch(`${BASE_URL}/models/${modelId}/activate`, { method: 'PUT', headers: getHeaders() });
      return handleResponse(response);
    },
    reject: async (modelId) => {
      const response = await fetch(`${BASE_URL}/models/${modelId}/reject`, { method: 'PUT', headers: getHeaders() });
      return handleResponse(response);
    },
    delete: async (modelId) => {
      const response = await fetch(`${BASE_URL}/models/${modelId}`, { method: 'DELETE', headers: getHeaders() });
      return handleResponse(response);
    },
    getMetrics: async (modelId) => {
      const response = await fetch(`${BASE_URL}/metrics/${modelId}`, { headers: getHeaders() });
      return handleResponse(response);
    }
  },

  // --- REVIEWS ---
  reviews: {
    getPending: async (page = 1, limit = 10) => {
      const response = await fetch(`${BASE_URL}/reviews/pending?page=${page}&limit=${limit}`, { headers: getHeaders() });
      return handleResponse(response);
    },
    approve: async (reviewId) => {
      const response = await fetch(`${BASE_URL}/reviews/${reviewId}/approve`, { method: 'PUT', headers: getHeaders() });
      return handleResponse(response);
    },
    reject: async (reviewId) => {
      const response = await fetch(`${BASE_URL}/reviews/${reviewId}/reject`, { method: 'PUT', headers: getHeaders() });
      return handleResponse(response);
    }
  },

  // --- TRANSACTIONS ---
  transactions: {
    getAll: async ({ page = 1, limit = 15 } = {}) => {
      const response = await fetch(`${BASE_URL}/transactions/?page=${page}&limit=${limit}`, { headers: getHeaders() });
      return handleResponse(response);
    },
    getOne: async (transactionId) => {
      const response = await fetch(`${BASE_URL}/transactions/${transactionId}`, { headers: getHeaders() });
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
};
