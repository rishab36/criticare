const API_BASE = 'http://localhost:3001/api';

// API helper functions
const api = {
  // Users
  getUsers: async () => {
    const response = await fetch(`${API_BASE}/users`);
    return response.json();
  },

  registerUser: async (userData) => {
    const response = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return response.json();
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
    const response = await fetch(`${API_BASE}/users/${userId}/status`, {
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
    const response = await fetch(`${API_BASE}/incidents/${incidentId}/accept`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user })
    });
    return response.json();
  },

  resolveIncident: async (incidentId) => {
    const response = await fetch(`${API_BASE}/incidents/${incidentId}/resolve`, {
      method: 'PUT'
    });
    return response.json();
  },

  // Chats
  getChat: async (incidentId) => {
    const response = await fetch(`${API_BASE}/chats/${incidentId}`);
    return response.json();
  },

  sendMessage: async (incidentId, messageData) => {
    const response = await fetch(`${API_BASE}/chats/${incidentId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messageData)
    });
    return response.json();
  }
};

export default api;
