const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - allow all origins for development
app.use(cors({
  origin: ['http://localhost:3000', 'https://criticare.vercel.app', /.+\.vercel\.app$/],
  credentials: true
}));
app.use(express.json());

// In-memory storage (replace with database later)
let users = [];
let incidents = [];
let chats = {};

// Initialize with admin user
users.push({
  id: '1',
  name: 'Admin',
  username: 'admin',
  password: 'admin',
  role: 'admin',
  status: 'available',
  joinedAt: new Date().toISOString()
});

// Routes
app.get('/api/users', (req, res) => {
  res.json(users);
});

app.post('/api/users', (req, res) => {
  const { name, username, password, role, department } = req.body;
  
  // Check if username exists
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'Username already taken' });
  }
  
  const newUser = {
    id: Date.now().toString(),
    name,
    username,
    password,
    role,
    department: department || null,
    status: 'available',
    joinedAt: new Date().toISOString()
  };
  
  users.push(newUser);
  console.log('New user registered:', newUser);
  res.json({ user: newUser });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  
  res.json({ user });
});

app.put('/api/users/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const user = users.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  user.status = status;
  res.json({ user });
});

app.get('/api/incidents', (req, res) => {
  res.json(incidents);
});

app.post('/api/incidents', (req, res) => {
  const incident = {
    id: Date.now().toString(),
    ...req.body,
    status: 'open',
    createdAt: new Date().toISOString(),
    acceptedBy: null,
    acceptedAt: null
  };
  
  incidents.unshift(incident);
  console.log('New incident created:', incident);
  
  // Create initial chat message
  const chatId = incident.id;
  chats[chatId] = [{
    id: 'sys_' + Date.now(),
    sender: 'System',
    role: 'system',
    text: `🚨 Alert fired — ${incident.department} needed at Room ${incident.room}${incident.floor ? `, Floor ${incident.floor}` : ''}. Severity: ${incident.severity}.${incident.note ? ` Note: ${incident.note}` : ''}`,
    time: new Date().toLocaleTimeString()
  }];
  
  res.json(incident);
});

app.put('/api/incidents/:id/accept', (req, res) => {
  const { id } = req.params;
  const { user } = req.body;
  
  const incident = incidents.find(i => i.id === id);
  if (!incident) {
    return res.status(404).json({ error: 'Incident not found' });
  }
  
  incident.status = 'active';
  incident.acceptedBy = user;
  incident.acceptedAt = new Date().toISOString();
  
  // Update user status to busy
  const userObj = users.find(u => u.id === user.id);
  if (userObj) {
    userObj.status = 'busy';
  }
  
  // Add system message to chat
  const chatId = incident.id;
  if (!chats[chatId]) chats[chatId] = [];
  chats[chatId].push({
    id: 'sys_' + Date.now(),
    sender: 'System',
    role: 'system',
    text: `✅ ${user.name} accepted — en route.`,
    time: new Date().toLocaleTimeString()
  });
  
  res.json(incident);
});

app.put('/api/incidents/:id/resolve', (req, res) => {
  const { id } = req.params;
  
  const incident = incidents.find(i => i.id === id);
  if (!incident) {
    return res.status(404).json({ error: 'Incident not found' });
  }
  
  incident.status = 'resolved';
  incident.resolvedAt = new Date().toISOString();
  
  // Update user status to available
  if (incident.acceptedBy) {
    const userObj = users.find(u => u.id === incident.acceptedBy.id);
    if (userObj) {
      userObj.status = 'available';
    }
  }
  
  // Add system message to chat
  const chatId = incident.id;
  if (!chats[chatId]) chats[chatId] = [];
  chats[chatId].push({
    id: 'sys_' + Date.now(),
    sender: 'System',
    role: 'system',
    text: '🏁 Incident resolved.',
    time: new Date().toLocaleTimeString()
  });
  
  res.json(incident);
});

app.get('/api/chats/:incidentId', (req, res) => {
  const { incidentId } = req.params;
  res.json(chats[incidentId] || []);
});

app.post('/api/chats/:incidentId', (req, res) => {
  const { incidentId } = req.params;
  const { text, file, sender, role, userId } = req.body;
  
  if (!chats[incidentId]) {
    chats[incidentId] = [];
  }
  
  const message = {
    id: Date.now().toString(),
    sender,
    role,
    userId,
    text: text.trim(),
    file: file || null,
    time: new Date().toLocaleTimeString()
  };
  
  chats[incidentId].push(message);
  res.json(message);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Criticare server running on http://localhost:${PORT}`);
  console.log('📊 Initial users:', users.length);
});
