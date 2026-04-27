// In-memory storage (same as server.js)
let users = [
  {
    id: '1',
    name: 'Admin',
    username: 'admin',
    password: 'admin',
    role: 'admin',
    status: 'available',
    joinedAt: new Date().toISOString()
  }
];

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).json({ success: true });
    return;
  }

  try {
    if (req.method === 'GET') {
      res.status(200).json(users);
    } else if (req.method === 'POST') {
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
      res.status(201).json({ user: newUser });
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
