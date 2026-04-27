const API_BASE = process.env.NODE_ENV === 'production' 
  ? '/api' // Use relative path for Vercel serverless functions
  : 'http://localhost:3001/api'; // Use localhost for development

// API helper functions
const api = {
  // Users
  getUsers: async () => {
    const response = await fetch(`${API_BASE}/users`);
    return response.json();
  },

  registerUser: async (userData) => {
    try {
      console.log('=== API DEBUG ===');
      console.log('Sending to:', `${API_BASE}/users`);
      console.log('Request data:', userData);
      
      const response = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { error: responseText || `HTTP error! status: ${response.status}` };
        }
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        throw new Error(`Invalid JSON response: ${responseText}`);
      }
      
      console.log('Parsed result:', result);
      console.log('================');
      return result;
    } catch (error) {
      console.error('Registration API Error:', error);
      throw error;
    }
  },

  login: async (username, password) => {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return response.json();
  },

  updateUserStatus: async (userId, status) => {
    const response = await fetch(`${API_BASE}/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return response.json();
  },

  // Incidents
  getIncidents: async () => {
    const response = await fetch(`${API_BASE}/incidents`);
    return response.json();
  },

  createIncident: async (incidentData) => {
    const response = await fetch(`${API_BASE}/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incidentData)
    });
    return response.json();
  },

  acceptIncident: async (incidentId, user) => {
    const response = await fetch(`${API_BASE}/incidents?id=${incidentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, action: 'accept' })
    });
    return response.json();
  },

  resolveIncident: async (incidentId) => {
    const response = await fetch(`${API_BASE}/incidents?id=${incidentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'resolve' })
    });
    return response.json();
  },

  // Chats
  getChat: async (incidentId) => {
    const response = await fetch(`${API_BASE}/chat?incidentId=${incidentId}`);
    return response.json();
  },

  sendMessage: async (incidentId, messageData) => {
    const response = await fetch(`${API_BASE}/chat?incidentId=${incidentId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messageData)
    });
    return response.json();
  }
};

export default api;
