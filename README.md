# Criticare - Medical Alert System

A real-time medical alert routing system for hospitals with admin, doctor, and nurse dashboards.

## Features

- 🔔 **Real-time Alert Routing** - Instant alerts to doctors and nurses based on department
- 👨‍⚕️ **Role-Based Dashboards** - Separate interfaces for admin, doctors, and nurses
- 💬 **Real-time Chat** - Instant messaging during incident response
- 📊 **Staff Management** - Track staff availability and status
- 🏥 **Department-Based Routing** - Cardio, ER, Surgery, Neurology, Pediatrics
- 📱 **Mobile Responsive** - Works on all devices
- 🔐 **Authentication** - Secure login system

## Tech Stack

- **Frontend**: React 18, React Hooks
- **Backend**: Express.js, Node.js
- **API**: RESTful API with CORS support
- **State Management**: React Context API
- **Styling**: Custom CSS with CSS variables

## Local Development

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/rishab36/criticare.git
cd criticare
```

2. Install dependencies:
```bash
npm install
```

3. Start the backend server:
```bash
npm run server
```
The backend will run on `http://localhost:3001`

4. In a new terminal, start the frontend:
```bash
npm start
```
The frontend will run on `http://localhost:3000`

### Default Admin Login
- Username: `admin`
- Password: `admin`

## Deployment

### Frontend Deployment (Vercel)

1. Push code to GitHub repository
2. Import project in Vercel
3. Set environment variable:
   - `REACT_APP_API_URL`: Your backend API URL (e.g., `https://your-backend.onrender.com/api`)
4. Deploy

### Backend Deployment Options

#### Option 1: Render (Recommended)
1. Create account at [render.com](https://render.com)
2. Create new "Web Service"
3. Connect your GitHub repository
4. Set build command: `npm install`
5. Set start command: `node server.js`
6. Deploy
7. Copy the backend URL and use it as `REACT_APP_API_URL` in Vercel

#### Option 2: Railway
1. Create account at [railway.app](https://railway.app)
2. Create new project
3. Deploy from GitHub
4. Set PORT environment variable to `3001`
5. Copy the backend URL

#### Option 3: Your own server
1. Deploy `server.js` to your server
2. Ensure Node.js is installed
3. Run `npm install` and `node server.js`
4. Configure your server firewall to allow port 3001
5. Use your server IP/domain as the API URL

### Environment Variables

Create a `.env` file in the root directory (not committed to git):

```env
REACT_APP_API_URL=http://localhost:3001/api
```

For production, set this in your hosting platform:
- Vercel: Project Settings → Environment Variables
- Render: Environment section in service settings

## API Endpoints

### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Register new user
- `POST /api/login` - User login
- `PUT /api/users/:id/status` - Update user status

### Incidents
- `GET /api/incidents` - Get all incidents
- `POST /api/incidents` - Create new incident
- `PUT /api/incidents/:id/accept` - Accept incident
- `PUT /api/incidents/:id/resolve` - Resolve incident

### Chats
- `GET /api/chats/:incidentId` - Get chat messages
- `POST /api/chats/:incidentId` - Send message

## Project Structure

```
criticare/
├── public/
│   └── index.html
├── src/
│   ├── api.js          # API service layer
│   ├── index.js        # React entry point
│   └── main.jsx        # Main application component
├── server.js           # Express backend server
├── package.json        # Dependencies
└── README.md           # This file
```

## Default Users

The system initializes with one admin user:
- Username: `admin`
- Password: `admin`

You can register additional doctors and nurses through the registration page.

## Troubleshooting

### CORS Errors
If you encounter CORS errors, ensure:
1. Backend CORS configuration includes your frontend URL
2. `REACT_APP_API_URL` is set correctly
3. Backend is running and accessible

### Connection Issues
If the frontend can't connect to the backend:
1. Check if backend server is running
2. Verify the API URL in environment variables
3. Check browser console for specific error messages
4. Ensure CORS is properly configured

### Deployment Issues
For Vercel deployment:
1. Make sure all ESLint errors are fixed
2. Set the `REACT_APP_API_URL` environment variable
3. Ensure backend is deployed and accessible
4. Check Vercel deployment logs for specific errors

## License

MIT License - feel free to use this project for your hospital or medical facility.

## Support

For issues and questions, please open an issue on GitHub or contact the development team.
