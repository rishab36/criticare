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

  console.log('=== SERVER DEBUG ===');
  console.log('Method:', req.method);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('Query:', req.query);

  if (req.method === 'OPTIONS') {
    console.log('OPTIONS request - returning success');
    res.status(200).json({ success: true });
    return;
  }

  try {
    if (req.method === 'GET') {
      console.log('GET request - returning users:', users);
      res.status(200).json(users);
    } else if (req.method === 'POST') {
      console.log('POST request processing');
      const { name, username, password, role, department } = req.body;
      
      console.log('Parsed body:', { name, username, role, department });
      
      // Check if username exists
      if (users.find(u => u.username === username)) {
        console.log('Username already taken:', username);
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
      console.log('Total users now:', users.length);
      
      const response = { user: newUser };
      console.log('Sending response:', response);
      res.status(201).json(response);
    } else {
      console.log('Method not allowed:', req.method);
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
