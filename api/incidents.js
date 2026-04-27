// In-memory storage
let incidents = [];
let chats = {};

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
    if (req.method === 'GET') {
      res.status(200).json(incidents);
    } else if (req.method === 'POST') {
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
      
      res.status(201).json(incident);
    } else if (req.method === 'PUT') {
      const { id } = req.query;
      const { user, action } = req.body;
      
      const incident = incidents.find(i => i.id === id);
      if (!incident) {
        return res.status(404).json({ error: 'Incident not found' });
      }
      
      if (action === 'accept') {
        incident.status = 'active';
        incident.acceptedBy = user;
        incident.acceptedAt = new Date().toISOString();
        
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
      } else if (action === 'resolve') {
        incident.status = 'resolved';
        incident.resolvedAt = new Date().toISOString();
        
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
      }
      
      res.status(200).json(incident);
    } else {
      res.setHeader('Allow', ['GET', 'POST', 'PUT']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Incidents API Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
