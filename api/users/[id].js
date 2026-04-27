// In-memory storage
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
    res.status(200).end();
    return;
  }

  try {
    const { id } = req.query;
    
    if (req.method === 'PUT') {
      const { status } = req.body;
      
      const user = users.find(u => u.id === id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      user.status = status;
      res.status(200).json({ user });
    } else {
      res.setHeader('Allow', ['PUT']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('User Status API Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
