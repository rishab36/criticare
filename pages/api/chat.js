// In-memory storage
let chats = {};

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
    const { incidentId } = req.query;
    
    if (req.method === 'GET') {
      res.status(200).json(chats[incidentId] || []);
    } else if (req.method === 'POST') {
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
      res.status(201).json(message);
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
