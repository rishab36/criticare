import { useState, useEffect, useRef, useCallback } from "react";
import api from "./api";

// ─── STYLES ───────────────────────────────────────────────────────────────────
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #0a0c10; --bg2: #111318; --bg3: #181c24;
      --border: rgba(255,255,255,0.07); --border2: rgba(255,255,255,0.12);
      --text: #f0f2f5; --muted: #7a8090;
      --accent: #00e5a0; --accent2: #0088ff;
      --danger: #ff3b5c; --warn: #ffb020;
      --font-head: 'Syne', sans-serif; --font-body: 'DM Sans', sans-serif;
    }
    html, body, #root { height: 100%; background: var(--bg); color: var(--text); font-family: var(--font-body); }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }
    input, textarea, select {
      font-family: var(--font-body); background: var(--bg3);
      border: 1px solid var(--border); color: var(--text);
      border-radius: 8px; padding: 10px 14px; font-size: 14px;
      outline: none; transition: border-color 0.2s; width: 100%;
    }
    input:focus, textarea:focus, select:focus { border-color: var(--accent); }
    input::placeholder, textarea::placeholder { color: var(--muted); }
    button { cursor: pointer; font-family: var(--font-body); border: none; outline: none; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
    @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    @keyframes glow { 0%,100%{box-shadow:0 0 8px rgba(255,59,92,0.4)} 50%{box-shadow:0 0 24px rgba(255,59,92,0.8)} }
    @keyframes alertPop { 0%{transform:scale(0.96);opacity:0} 100%{transform:scale(1);opacity:1} }
  `}</style>
);

// ─── STORE ────────────────────────────────────────────────────────────────────
const useStore = () => {
  const [users,       setUsers]       = useState([]);
  const [incidents,   setIncidents]   = useState([]);
  const [chats,       setChats]       = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [view,        setView]        = useState("auth");

  // Load initial data and restore session
  useEffect(() => {
    loadInitialData();
    restoreSession();
  }, []);

  const loadInitialData = async () => {
    try {
      const [usersData, incidentsData] = await Promise.all([
        api.getUsers(),
        api.getIncidents()
      ]);
      setUsers(usersData);
      setIncidents(incidentsData);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const restoreSession = () => {
    try {
      const savedUser = localStorage.getItem('cc_currentUser');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setView(user.role === "admin" ? "admin" : "staff");
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
    }
  };

  /* ── Auth ── */
  const registerUser = async (data) => {
    try {
      console.log("=== REGISTRATION DEBUG ===");
      console.log("Registration data:", data);
      const result = await api.registerUser(data);
      console.log("Registration result:", result);
      
      if (result.error) {
        return result;
      }
      
      // Refresh users list
      const updatedUsers = await api.getUsers();
      setUsers(updatedUsers);
      
      setCurrentUser(result.user);
      setView(result.user.role === "admin" ? "admin" : "staff");
      localStorage.setItem('cc_currentUser', JSON.stringify(result.user));
      console.log("========================");
      return result;
    } catch (error) {
      console.error('Registration failed:', error);
      return { error: 'Registration failed. Please try again.' };
    }
  };

  const loginUser = async (username, password) => {
    try {
      const result = await api.login(username, password);
      
      if (result.error) {
        return result;
      }
      
      setCurrentUser(result.user);
      setView(result.user.role === "admin" ? "admin" : "staff");
      localStorage.setItem('cc_currentUser', JSON.stringify(result.user));
      return result;
    } catch (error) {
      console.error('Login failed:', error);
      return { error: 'Login failed. Please try again.' };
    }
  };

  const logout = () => { 
    setCurrentUser(null); 
    setView("auth"); 
    localStorage.removeItem('cc_currentUser');
  };

  const refreshFromStorage = async () => {
    try {
      console.log("=== REFRESH FROM API ===");
      const [updatedUsers, updatedIncidents] = await Promise.all([
        api.getUsers(),
        api.getIncidents()
      ]);
      console.log("Updated users count:", updatedUsers.length);
      console.log("Updated users:", updatedUsers.map(u => ({ name: u.name, role: u.role, department: u.department })));
      console.log("========================");
      setUsers(updatedUsers);
      setIncidents(updatedIncidents);
    } catch (error) {
      console.error('Refresh failed:', error);
    }
  };

  /* ── Status ── */
  const updateStatus = async (userId, status) => {
    try {
      const result = await api.updateUserStatus(userId, status);
      if (result.user) {
        setUsers(prev => prev.map(u => u.id === userId ? result.user : u));
        if (currentUser?.id === userId) {
          setCurrentUser(result.user);
        }
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  /* ── Incidents ── */
  const fireAlert = async (data) => {
    try {
      console.log("=== FIRE ALERT DEBUG ===");
      console.log("Alert data:", data);
      const inc = await api.createIncident(data);
      console.log("Created incident:", inc);
      console.log("=====================");
      
      // Refresh incidents list
      const updatedIncidents = await api.getIncidents();
      setIncidents(updatedIncidents);
      
      return inc;
    } catch (error) {
      console.error('Failed to fire alert:', error);
    }
  };

  const acceptIncident = async (incidentId, user) => {
    try {
      const result = await api.acceptIncident(incidentId, user);
      
      // Refresh data
      const [updatedUsers, updatedIncidents] = await Promise.all([
        api.getUsers(),
        api.getIncidents()
      ]);
      setUsers(updatedUsers);
      setIncidents(updatedIncidents);
      
      return result;
    } catch (error) {
      console.error('Failed to accept incident:', error);
    }
  };

  const resolveIncident = async (incidentId) => {
    try {
      const result = await api.resolveIncident(incidentId);
      
      // Refresh data
      const [updatedUsers, updatedIncidents] = await Promise.all([
        api.getUsers(),
        api.getIncidents()
      ]);
      setUsers(updatedUsers);
      setIncidents(updatedIncidents);
      
      return result;
    } catch (error) {
      console.error('Failed to resolve incident:', error);
    }
  };

  const sendMessage = async (incidentId, text, file) => {
    if (!text.trim() && !file) return;
    
    try {
      const messageData = {
        text: text.trim(),
        file: file || null,
        sender: currentUser.name,
        role: currentUser.role,
        userId: currentUser.id
      };
      
      await api.sendMessage(incidentId, messageData);
      
      // Refresh chat
      const updatedChat = await api.getChat(incidentId);
      setChats(prev => ({ ...prev, [incidentId]: updatedChat }));
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  /* ── Alert routing ── */
  const incidentsForUser = (user) => {
    if (!user || user.role === "admin") return incidents;
    const filtered = incidents.filter(i => {
      // For nurses, show open and active alerts (they can assist even if doctor accepted)
      if (user.role === "nurse") {
        return i.status === "open" || i.status === "active";
      }
      // For doctors, only show open alerts matching their department
      if (user.role === "doctor") {
        return i.status === "open" && i.department === user.department;
      }
      return false;
    });
    console.log("=== ALERT ROUTING DEBUG ===");
    console.log("User:", user);
    console.log("All incidents:", incidents);
    console.log("Filtered incidents for this user:", filtered);
    console.log("========================");
    return filtered;
  };

  return {
    users, incidents, chats, currentUser, view,
    registerUser, loginUser, logout, refreshFromStorage,
    updateStatus, fireAlert, acceptIncident, resolveIncident, sendMessage,
    incidentsForUser,
  };
};

// ─── UI ATOMS ─────────────────────────────────────────────────────────────────
const sMeta = {
  available: { color: "#00e5a0", label: "Available" },
  busy:      { color: "#ff3b5c", label: "Busy" },
  "off-duty":{ color: "#7a8090", label: "Off-duty" },
  "on-call": { color: "#ffb020", label: "On-call" },
};
const sColor = s => sMeta[s]?.color || "#7a8090";

const Badge = ({ status }) => {
  const m = sMeta[status] || sMeta.available;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px",
      borderRadius:20, background:m.color+"18", border:`1px solid ${m.color}40`,
      color:m.color, fontSize:11, fontWeight:600, letterSpacing:"0.04em", whiteSpace:"nowrap" }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:m.color,
        animation: status==="available" ? "pulse 2s infinite" : "none" }} />
      {m.label}
    </span>
  );
};

const sevM = { Critical:{bg:"#ff3b5c",fg:"#fff"}, Moderate:{bg:"#ffb020",fg:"#000"}, Low:{bg:"#00e5a0",fg:"#000"} };
const SevBadge = ({ sev }) => {
  const m = sevM[sev] || sevM.Low;
  return <span style={{ padding:"2px 9px", borderRadius:4, fontSize:10, fontWeight:700,
    background:m.bg, color:m.fg, letterSpacing:"0.06em" }}>{(sev||"").toUpperCase()}</span>;
};

const Card = ({ children, style }) => (
  <div style={{ background:"var(--bg2)", border:"1px solid var(--border)",
    borderRadius:14, padding:20, animation:"fadeIn 0.25s ease", ...style }}>{children}</div>
);

const Lbl = ({ children }) => (
  <div style={{ fontSize:11, color:"var(--muted)", fontWeight:600,
    letterSpacing:"0.08em", marginBottom:6 }}>{children}</div>
);

// ─── CHAT PANEL ───────────────────────────────────────────────────────────────
const ChatPanel = ({ incidentId, chats, onSend, currentUser, incident }) => {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [messages, setMessages] = useState([]);
  const bottomRef = useRef();
  const fileRef   = useRef();

  // Load chat messages and set up real-time polling
  useEffect(() => {
    if (incidentId) {
      loadChatMessages();
      
      // Set up polling for real-time updates
      const interval = setInterval(() => {
        loadChatMessages();
      }, 2000); // Poll every 2 seconds
      
      return () => clearInterval(interval);
    }
  }, [incidentId, loadChatMessages]);

  const loadChatMessages = useCallback(async () => {
    try {
      const chatMessages = await api.getChat(incidentId);
      setMessages(chatMessages);
    } catch (error) {
      console.error('Failed to load chat messages:', error);
    }
  }, [incidentId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  const send = () => { onSend(incidentId, text, file); setText(""); setFile(null); };
  const handleFile = e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => setFile({ name:f.name, type:f.type, url:ev.target.result });
    r.readAsDataURL(f); e.target.value = "";
  };
  const resolved = incident?.status === "resolved";
  const isAdmin = currentUser?.role === "admin";

  // Close chat for non-admin users when incident is resolved
  useEffect(() => {
    if (resolved && !isAdmin) {
      // Chat will be closed by the parent component
      console.log("Incident resolved, closing chat for staff");
    }
  }, [resolved, isAdmin]);

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>
      {/* header */}
      <div style={{ padding:"12px 18px", borderBottom:"1px solid var(--border)",
        display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
        <div style={{ width:8, height:8, borderRadius:"50%",
          background: resolved ? "var(--muted)" : "var(--accent)",
          animation: !resolved ? "pulse 1.5s infinite" : "none" }} />
        <span style={{ fontFamily:"var(--font-head)", fontWeight:700, fontSize:14, flex:1 }}>
          {incident ? `${incident.department} · Room ${incident.room}` : "Chat"}
        </span>
        {incident && <SevBadge sev={incident.severity} />}
        {resolved && <span style={{ fontSize:11, color:"var(--muted)" }}>RESOLVED</span>}
      </div>

      {/* messages */}
      <div style={{ flex:1, overflowY:"auto", padding:"14px 18px",
        display:"flex", flexDirection:"column", gap:10 }}>
        {messages.map(msg => {
          const isMe = msg.userId === currentUser?.id;
          if (msg.role === "system") return (
            <div key={msg.id} style={{ textAlign:"center" }}>
              <span style={{ fontSize:11, color:"var(--muted)", background:"var(--bg3)",
                padding:"4px 12px", borderRadius:20 }}>{msg.text}</span>
            </div>
          );
          return (
            <div key={msg.id} style={{ display:"flex", justifyContent:isMe?"flex-end":"flex-start",
              animation:"fadeIn 0.2s ease" }}>
              <div style={{ maxWidth:"75%" }}>
                {!isMe && <div style={{ fontSize:10, color:"var(--muted)", marginBottom:3, paddingLeft:4 }}>
                  {msg.sender} · {msg.role}
                </div>}
                <div style={{ padding:"10px 14px",
                  borderRadius: isMe ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  background: isMe ? "var(--accent)" : "var(--bg3)",
                  color: isMe ? "#000" : "var(--text)", fontSize:13, lineHeight:1.5 }}>
                  {msg.text && <p>{msg.text}</p>}
                  {msg.file && (
                    <div style={{ marginTop: msg.text ? 8 : 0 }}>
                      {msg.file.type?.startsWith("image/")
                        ? <img src={msg.file.url} alt={msg.file.name}
                            style={{ maxWidth:200, borderRadius:8, display:"block" }} />
                        : <a href={msg.file.url} download={msg.file.name}
                            style={{ color: isMe ? "#004d33" : "var(--accent)", fontSize:12 }}>
                            📎 {msg.file.name}
                          </a>}
                    </div>
                  )}
                </div>
                <div style={{ fontSize:10, color:"var(--muted)", marginTop:3,
                  textAlign: isMe ? "right" : "left" }}>{msg.time}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* input */}
      {(!resolved || isAdmin) && (
        <div style={{ padding:"10px 18px", borderTop:"1px solid var(--border)", flexShrink:0 }}>
          {resolved && isAdmin && (
            <div style={{ marginBottom:8, padding:"6px 10px", background:"var(--bg3)", borderRadius:6,
              fontSize:11, color:"var(--muted)", textAlign:"center" }}>
              Incident resolved - chat archived
            </div>
          )}
          {file && (
            <div style={{ marginBottom:8, display:"flex", alignItems:"center", gap:8,
              padding:"5px 10px", background:"var(--bg3)", borderRadius:8 }}>
              <span style={{ fontSize:12, color:"var(--accent)", flex:1 }}>📎 {file.name}</span>
              <button onClick={() => setFile(null)} style={{ background:"none", color:"var(--muted)", fontSize:16 }}>×</button>
            </div>
          )}
          <div style={{ display:"flex", gap:8, alignItems:"flex-end" }}>
            <textarea value={text} onChange={e => setText(e.target.value)}
              placeholder={resolved && isAdmin ? "Chat archived - no new messages" : "Type a message…"}
              rows={1}
              disabled={resolved && !isAdmin}
              style={{ 
                flex:1, resize:"none", borderRadius:10, fontSize:13, padding:"10px 14px",
                opacity: (resolved && !isAdmin) ? 0.5 : 1
              }}
              onKeyDown={e => { if (e.key==="Enter" && !e.shiftKey && !resolved) { e.preventDefault(); send(); } }} />
            <input type="file" ref={fileRef} onChange={handleFile} style={{ display:"none" }} disabled={resolved && !isAdmin} />
            <button onClick={() => fileRef.current?.click()} style={{ width:40, height:40, borderRadius:8,
              background:"var(--bg3)", border:"1px solid var(--border)", color:"var(--muted)", fontSize:16, flexShrink:0,
              opacity: (resolved && !isAdmin) ? 0.5 : 1
            }} disabled={resolved && !isAdmin}>
              📎
            </button>
            <button onClick={send} style={{ width:40, height:40, borderRadius:8,
              background:"var(--accent)", color:"#000", fontWeight:700, fontSize:18, flexShrink:0,
              opacity: (resolved && !isAdmin) ? 0.5 : 1
            }} disabled={resolved && !isAdmin}>
              ↑
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── AUTH PAGE ────────────────────────────────────────────────────────────────
const AuthPage = ({ store }) => {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name:"", username:"", password:"", role:"doctor", department:"Cardio" });
  const [error, setError] = useState("");
  const DEPTS = ["Cardio","ER","Surgery","Neurology","Pediatrics"];
  const h = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const submit = () => {
    setError("");
    if (!form.username || !form.password) return setError("Username and password required.");
    if (mode === "register") {
      if (!form.name) return setError("Name is required.");
      const res = store.registerUser(form);
      if (res.error) setError(res.error);
    } else {
      const res = store.loginUser(form.username, form.password);
      if (res.error) setError(res.error);
    }
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
      background:"var(--bg)", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", inset:0,
        backgroundImage:"linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px)",
        backgroundSize:"48px 48px", opacity:0.5 }} />
      <div style={{ position:"absolute", top:"35%", left:"50%", transform:"translate(-50%,-50%)",
        width:600, height:600, borderRadius:"50%",
        background:"radial-gradient(circle,rgba(0,229,160,0.06) 0%,transparent 70%)", pointerEvents:"none" }} />

      <div style={{ position:"relative", width:"100%", maxWidth:420, padding:24, animation:"fadeIn 0.4s ease" }}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:12, marginBottom:10 }}>
            <div style={{ width:42, height:42, borderRadius:12,
              background:"linear-gradient(135deg,var(--accent),var(--accent2))",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:22, color:"#000", fontWeight:800 }}>+</div>
            <span style={{ fontFamily:"var(--font-head)", fontSize:30, fontWeight:800, letterSpacing:"-0.02em" }}>
              Criti<span style={{ color:"var(--accent)" }}>Care</span>
            </span>
          </div>
          <p style={{ color:"var(--muted)", fontSize:13 }}>Emergency response coordination</p>
        </div>

        <Card>
          {/* Toggle */}
          <div style={{ display:"flex", background:"var(--bg3)", borderRadius:8, padding:3, marginBottom:22 }}>
            {["login","register"].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); }} style={{
                flex:1, padding:"8px 0", borderRadius:6, fontSize:13, fontWeight:500,
                background: mode===m ? "var(--bg2)" : "transparent",
                color: mode===m ? "var(--text)" : "var(--muted)",
                border: mode===m ? "1px solid var(--border)" : "1px solid transparent",
                transition:"all 0.2s",
              }}>{m==="login" ? "Sign in" : "Register"}</button>
            ))}
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {mode==="register" && <>
              <div><Lbl>FULL NAME</Lbl><input placeholder="Dr. Jane Smith" value={form.name} onChange={h("name")} /></div>
              <div>
                <Lbl>ROLE</Lbl>
                <select value={form.role} onChange={h("role")}>
                  <option value="admin">Admin (Command center)</option>
                  <option value="doctor">Doctor</option>
                  <option value="nurse">Nurse</option>
                </select>
              </div>
              {form.role !== "admin" && (
                <div>
                  <Lbl>DEPARTMENT</Lbl>
                  <select value={form.department} onChange={h("department")}>
                    {DEPTS.map(d => <option key={d}>{d}</option>)}
                    {form.role==="nurse" && <option value="Nurse">Nurse (General)</option>}
                  </select>
                </div>
              )}
            </>}
            <div><Lbl>USERNAME</Lbl><input placeholder="username" value={form.username} onChange={h("username")} /></div>
            <div>
              <Lbl>PASSWORD</Lbl>
              <input type="password" placeholder="••••••••" value={form.password} onChange={h("password")}
                onKeyDown={e => e.key==="Enter" && submit()} />
            </div>
            {error && <p style={{ color:"var(--danger)", fontSize:13, lineHeight:1.4 }}>{error}</p>}
            <button onClick={submit} style={{
              padding:"11px 0", borderRadius:8, fontSize:14, fontWeight:700,
              background:"var(--accent)", color:"#000", marginTop:2,
            }}>{mode==="login" ? "Sign in →" : "Create account →"}</button>
          </div>
        </Card>

        <p style={{ textAlign:"center", marginTop:16, color:"var(--muted)", fontSize:12 }}>
          {mode==="login" ? "No account? " : "Have an account? "}
          <button onClick={() => { setMode(mode==="login"?"register":"login"); setError(""); }}
            style={{ color:"var(--accent)", background:"none", fontSize:12, textDecoration:"underline" }}>
            {mode==="login" ? "Register" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
};

// ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────────
const AdminDashboard = ({ store }) => {
  const { users, incidents, chats, currentUser, fireAlert, resolveIncident, sendMessage, logout, refreshFromStorage } = store;
  const [tab, setTab] = useState("incidents");
  const [selInc, setSelInc] = useState(null);
  const [sos, setSos] = useState({ department:"Cardio", severity:"Critical", room:"", floor:"", note:"" });
  const sh = f => e => setSos(p => ({ ...p, [f]: e.target.value }));
  const DEPTS = ["Cardio","ER","Surgery","Neurology","Pediatrics","Nurse"];
  const staff = users.filter(u => u.role !== "admin");
  const liveInc = incidents.filter(i => i.status !== "resolved");
  const resolved = incidents.filter(i => i.status === "resolved");
  
  // Debug admin dashboard data
  console.log("=== ADMIN DASHBOARD DEBUG ===");
  console.log("All users:", users.map(u => ({ name: u.name, role: u.role, department: u.department })));
  console.log("Filtered staff (non-admin):", staff.map(u => ({ name: u.name, role: u.role, department: u.department })));
  console.log("Staff count:", staff.length);
  console.log("============================");
  
  // Poll for new data every 1 second and refresh on window focus
  useEffect(() => {
    const interval = setInterval(() => {
      refreshFromStorage();
    }, 1000);
    
    const handleFocus = () => {
      refreshFromStorage();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshFromStorage]);

  const fire = () => {
    if (!sos.room.trim()) return;
    const inc = fireAlert({ ...sos });
    setSos(p => ({ ...p, room:"", floor:"", note:"" }));
    setSelInc(inc.id); setTab("incidents");
  };

  return (
    <div style={{ height:"100vh", display:"flex", flexDirection:"column", overflow:"hidden" }}>
      {/* Topbar */}
      <div style={{ display:"flex", alignItems:"center", padding:"0 20px", height:56,
        borderBottom:"1px solid var(--border)", background:"var(--bg2)", flexShrink:0, gap:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, flex:1 }}>
          <div style={{ width:28, height:28, borderRadius:7,
            background:"linear-gradient(135deg,var(--accent),var(--accent2))",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, color:"#000", fontWeight:800 }}>+</div>
          <span style={{ fontFamily:"var(--font-head)", fontWeight:800, fontSize:18, letterSpacing:"-0.02em" }}>
            Criti<span style={{ color:"var(--accent)" }}>Care</span>
          </span>
          <span style={{ fontSize:10, color:"var(--muted)", background:"var(--bg3)",
            padding:"2px 8px", borderRadius:4, letterSpacing:"0.06em" }}>ADMIN</span>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {[
            { label:"ACTIVE", val:incidents.filter(i=>i.status==="active").length, c:"var(--danger)" },
            { label:"OPEN",   val:incidents.filter(i=>i.status==="open").length,   c:"var(--warn)"   },
            { label:"STAFF",  val:staff.filter(u=>u.status!=="off-duty").length,   c:"var(--accent)" },
          ].map(s => (
            <div key={s.label} style={{ textAlign:"center", padding:"3px 14px",
              borderRadius:8, background:"var(--bg3)", border:"1px solid var(--border)" }}>
              <div style={{ fontSize:18, fontWeight:800, color:s.c, fontFamily:"var(--font-head)", lineHeight:1.2 }}>{s.val}</div>
              <div style={{ fontSize:9, color:"var(--muted)", letterSpacing:"0.06em" }}>{s.label}</div>
            </div>
          ))}
        </div>
        <button onClick={logout} style={{ padding:"6px 14px", borderRadius:8, fontSize:12,
          background:"var(--bg3)", border:"1px solid var(--border)", color:"var(--muted)" }}>Sign out</button>
      </div>

      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
        {/* Sidebar */}
        <div style={{ width:252, borderRight:"1px solid var(--border)", display:"flex",
          flexDirection:"column", overflowY:"auto", flexShrink:0 }}>
          {/* SOS form */}
          <div style={{ padding:14, borderBottom:"1px solid var(--border)" }}>
            <Lbl>DEPARTMENT NEEDED</Lbl>
            <select value={sos.department} onChange={sh("department")} style={{ marginBottom:10 }}>
              {DEPTS.map(d => <option key={d}>{d}</option>)}
            </select>

            <Lbl>SEVERITY</Lbl>
            <div style={{ display:"flex", gap:6, marginBottom:10 }}>
              {["Critical","Moderate","Low"].map(sev => (
                <button key={sev} onClick={() => setSos(p => ({ ...p, severity:sev }))} style={{
                  flex:1, padding:"7px 2px", borderRadius:7, fontSize:11, fontWeight:700,
                  background: sos.severity===sev
                    ? (sev==="Critical"?"var(--danger)":sev==="Moderate"?"var(--warn)":"var(--accent)")
                    : "var(--bg3)",
                  color: sos.severity===sev ? (sev==="Moderate"?"#000":"#fff") : "var(--muted)",
                  border:`1px solid ${sos.severity===sev?"transparent":"var(--border)"}`,
                }}>{sev}</button>
              ))}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
              <div><Lbl>ROOM</Lbl><input placeholder="302" value={sos.room} onChange={sh("room")} /></div>
              <div><Lbl>FLOOR</Lbl><input placeholder="3" value={sos.floor} onChange={sh("floor")} /></div>
            </div>
            <Lbl>NOTE (optional)</Lbl>
            <textarea rows={2} placeholder="Patient details…" value={sos.note} onChange={sh("note")}
              style={{ marginBottom:12 }} />

            <button onClick={fire} disabled={!sos.room.trim()} style={{
              width:"100%", padding:"13px 0", borderRadius:10, fontWeight:800, fontSize:14,
              background:"var(--danger)", color:"#fff", opacity:sos.room.trim()?1:0.4,
              letterSpacing:"0.04em", display:"flex", alignItems:"center", justifyContent:"center", gap:8,
              animation: sos.room.trim() ? "glow 2s infinite" : "none",
            }}>🚨 FIRE SOS</button>

            {sos.room.trim() && (
              <p style={{ marginTop:8, fontSize:11, color:"var(--muted)", textAlign:"center", lineHeight:1.5 }}>
                Sends to all available{" "}
                <span style={{ color:"var(--accent)" }}>
                  {sos.department==="Nurse" ? "nurses" : `${sos.department} doctors`}
                </span>
                {" "}and all nurses
              </p>
            )}
          </div>

          {/* Nav */}
          <div style={{ padding:10 }}>
            {[
              { k:"incidents", l:"🔴 Live incidents" },
              { k:"staff",     l:"👥 All staff"      },
              { k:"history",   l:"📋 History"        },
            ].map(t => (
              <button key={t.k} onClick={() => setTab(t.k)} style={{
                width:"100%", textAlign:"left", padding:"8px 12px", borderRadius:8, marginBottom:2, fontSize:13,
                background: tab===t.k ? "var(--bg3)" : "transparent",
                color: tab===t.k ? "var(--text)" : "var(--muted)",
                border:`1px solid ${tab===t.k ? "var(--border)" : "transparent"}`,
              }}>{t.l}</button>
            ))}
          </div>
        </div>

        {/* Main */}
        <div style={{ flex:1, overflowY:"auto", padding:20 }}>

          {tab==="incidents" && <>
            <h2 style={{ fontFamily:"var(--font-head)", fontSize:18, fontWeight:700, marginBottom:16 }}>Live incidents</h2>
            {liveInc.length===0 && (
              <div style={{ textAlign:"center", padding:60, color:"var(--muted)" }}>
                <div style={{ fontSize:48, marginBottom:12 }}>📡</div>
                <div style={{ fontFamily:"var(--font-head)", fontSize:16, color:"var(--text)" }}>No incidents yet</div>
                <div style={{ fontSize:13, marginTop:6 }}>Fire an SOS to begin</div>
              </div>
            )}
            {liveInc.map(inc => (
              <div key={inc.id} onClick={() => setSelInc(selInc===inc.id ? null : inc.id)} style={{
                background:"var(--bg2)",
                border:`1px solid ${selInc===inc.id ? "var(--accent)" : "var(--border)"}`,
                borderLeft:`3px solid ${inc.severity==="Critical"?"var(--danger)":inc.severity==="Moderate"?"var(--warn)":"var(--accent)"}`,
                borderRadius:10, padding:"14px 16px", cursor:"pointer", marginBottom:10,
                transition:"border-color 0.2s", animation:"alertPop 0.3s ease",
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                  <SevBadge sev={inc.severity} />
                  <span style={{ fontFamily:"var(--font-head)", fontWeight:700, fontSize:15 }}>
                    {inc.department} — Room {inc.room}{inc.floor ? `, Floor ${inc.floor}` : ""}
                  </span>
                  <span style={{ marginLeft:"auto", fontSize:11, color:"var(--muted)" }}>
                    {new Date(inc.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                {inc.note && <p style={{ fontSize:12, color:"var(--muted)", marginBottom:8 }}>{inc.note}</p>}
                <div style={{ display:"flex", alignItems:"center", fontSize:12 }}>
                  <span style={{ color:inc.status==="active"?"var(--accent)":"var(--warn)" }}>
                    ● {inc.status==="active" ? `Accepted by ${inc.acceptedBy?.name}` : "Awaiting response"}
                  </span>
                  {inc.status==="active" && (
                    <button onClick={e => { e.stopPropagation(); resolveIncident(inc.id); }} style={{
                      marginLeft:"auto", fontSize:11, padding:"3px 10px", borderRadius:6,
                      background:"var(--bg3)", border:"1px solid var(--border)", color:"var(--muted)",
                    }}>Resolve</button>
                  )}
                </div>
              </div>
            ))}
          </>}

          {tab==="staff" && <>
            <h2 style={{ fontFamily:"var(--font-head)", fontSize:18, fontWeight:700, marginBottom:16 }}>
              All staff ({staff.length})
            </h2>
            {staff.length===0 && (
              <div style={{ textAlign:"center", padding:60, color:"var(--muted)" }}>
                <div style={{ fontSize:48, marginBottom:12 }}>👥</div>
                <div style={{ fontFamily:"var(--font-head)", fontSize:16, color:"var(--text)" }}>No staff registered yet</div>
                <div style={{ fontSize:13, marginTop:6 }}>Staff appear here after registering on their device</div>
              </div>
            )}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))", gap:12 }}>
              {staff.map(u => {
                const ai = incidents.find(i => i.acceptedBy?.id===u.id && i.status==="active");
                return (
                  <Card key={u.id} style={{ padding:16 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                      <div style={{ width:38, height:38, borderRadius:10, background:"var(--bg3)",
                        display:"flex", alignItems:"center", justifyContent:"center", fontSize:18,
                        border:`2px solid ${sColor(u.status)}30` }}>
                        {u.role==="doctor" ? "👨‍⚕️" : "🩺"}
                      </div>
                      <Badge status={u.status} />
                    </div>
                    <div style={{ fontFamily:"var(--font-head)", fontWeight:700, fontSize:14, marginBottom:2 }}>{u.name}</div>
                    <div style={{ fontSize:11, color:"var(--muted)", marginBottom: ai ? 8 : 0 }}>
                      {u.role.toUpperCase()}{u.department ? ` · ${u.department}` : ""}
                    </div>
                    {ai && (
                      <div style={{ padding:"5px 10px", background:"var(--danger)15",
                        border:"1px solid var(--danger)30", borderRadius:6, fontSize:11, color:"var(--danger)" }}>
                        🚨 {ai.department} · Room {ai.room}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </>}

          {tab==="history" && <>
            <h2 style={{ fontFamily:"var(--font-head)", fontSize:18, fontWeight:700, marginBottom:16 }}>History</h2>
            {resolved.length===0 && (
              <div style={{ textAlign:"center", padding:60, color:"var(--muted)" }}>
                <div style={{ fontSize:48, marginBottom:12 }}>📋</div>
                <div style={{ fontFamily:"var(--font-head)", fontSize:16, color:"var(--text)" }}>No resolved incidents</div>
              </div>
            )}
            {resolved.map(inc => (
              <div key={inc.id} onClick={() => setSelInc(selInc===inc.id ? null : inc.id)} style={{
                background:"var(--bg2)", border:`1px solid ${selInc===inc.id?"var(--accent)":"var(--border)"}`,
                borderRadius:10, padding:"12px 16px", cursor:"pointer", marginBottom:8, opacity:0.75,
              }}>
                <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                  <SevBadge sev={inc.severity} />
                  <span style={{ fontFamily:"var(--font-head)", fontWeight:600 }}>
                    {inc.department} — Room {inc.room}
                  </span>
                  <span style={{ marginLeft:"auto", fontSize:11, color:"var(--muted)" }}>
                    {new Date(inc.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                {inc.acceptedBy && (
                  <p style={{ fontSize:12, color:"var(--muted)", marginTop:4 }}>Handled by {inc.acceptedBy.name}</p>
                )}
              </div>
            ))}
          </>}
        </div>

        {/* Chat sidebar */}
        {selInc && (() => {
          const inc = incidents.find(i => i.id===selInc);
          if (!inc) return null;
          return (
            <div style={{ width:340, borderLeft:"1px solid var(--border)",
              display:"flex", flexDirection:"column", flexShrink:0 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                padding:"12px 18px", borderBottom:"1px solid var(--border)", flexShrink:0 }}>
                <span style={{ fontSize:11, color:"var(--muted)", fontWeight:600, letterSpacing:"0.06em" }}>
                  INCIDENT CHAT
                </span>
                <button onClick={() => setSelInc(null)}
                  style={{ background:"none", color:"var(--muted)", fontSize:20, lineHeight:1 }}>×</button>
              </div>
              <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
                <ChatPanel incidentId={selInc} chats={chats}
                  onSend={sendMessage} currentUser={currentUser} incident={inc} />
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

// ─── STAFF DASHBOARD ──────────────────────────────────────────────────────────
const StaffDashboard = ({ store }) => {
  const { users, incidents, chats, currentUser, updateStatus,
          acceptIncident, resolveIncident, sendMessage, logout, incidentsForUser, refreshFromStorage } = store;
  const [selInc, setSelInc] = useState(null);

  const me = currentUser;
  const myActiveInc  = incidents.find(i => i.acceptedBy?.id===me?.id && i.status==="active");
  const openForMe    = incidentsForUser(me);
  
  
  // Poll for new alerts every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshFromStorage();
    }, 2000);
    return () => clearInterval(interval);
  }, [refreshFromStorage]);

  // Auto-select active incident and close chat when resolved
  useEffect(() => {
    if (myActiveInc && selInc !== myActiveInc.id) setSelInc(myActiveInc.id);
  }, [myActiveInc?.id, selInc]);

  // Close chat if current incident is resolved
  useEffect(() => {
    if (selInc) {
      const incident = incidents.find(i => i.id === selInc);
      if (incident?.status === "resolved") {
        setSelInc(null);
      }
    }
  }, [incidents, selInc]);

  // Play notification sound for new alerts
  useEffect(() => {
    if (openForMe.length > 0) {
      // Simple audio notification using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    }
  }, [openForMe.length]);

  const STATUSES = ["available","busy","off-duty","on-call"];

  return (
    <div style={{ height:"100vh", display:"flex", flexDirection:"column", overflow:"hidden" }}>
      {/* Topbar */}
      <div style={{ display:"flex", alignItems:"center", padding:"0 16px", height:56,
        borderBottom:"1px solid var(--border)", background:"var(--bg2)", flexShrink:0, gap:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:26, height:26, borderRadius:6,
            background:"linear-gradient(135deg,var(--accent),var(--accent2))",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, color:"#000", fontWeight:800 }}>+</div>
          <span style={{ fontFamily:"var(--font-head)", fontWeight:800, fontSize:18, letterSpacing:"-0.02em" }}>
            Criti<span style={{ color:"var(--accent)" }}>Care</span>
          </span>
        </div>
        <div style={{ display:"flex", gap:5, marginLeft:8 }}>
          {STATUSES.map(s => (
            <button key={s} onClick={() => updateStatus(me.id, s)} style={{
              padding:"5px 11px", borderRadius:20, fontSize:11, fontWeight:600,
              background: me?.status===s ? sColor(s)+"22" : "var(--bg3)",
              color: me?.status===s ? sColor(s) : "var(--muted)",
              border:`1px solid ${me?.status===s ? sColor(s)+"60" : "var(--border)"}`,
              transition:"all 0.15s",
            }}>{sMeta[s]?.label}</button>
          ))}
        </div>
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:12, fontWeight:600 }}>{me?.name}</div>
            <div style={{ fontSize:10, color:"var(--muted)" }}>
              {me?.role}{me?.department ? ` · ${me.department}` : ""}
            </div>
          </div>
          <button onClick={logout} style={{ padding:"5px 12px", borderRadius:8, fontSize:12,
            background:"var(--bg3)", border:"1px solid var(--border)", color:"var(--muted)" }}>Out</button>
        </div>
      </div>

      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
        {/* Left panel */}
        <div style={{ width:290, borderRight:"1px solid var(--border)", overflowY:"auto", flexShrink:0 }}>

          {/* My active case */}
          {myActiveInc && (
            <div style={{ margin:14, padding:14, borderRadius:12,
              background:"var(--danger)12", border:"1px solid var(--danger)40", animation:"alertPop 0.3s ease" }}>
              <div style={{ fontSize:10, color:"var(--danger)", fontWeight:700, letterSpacing:"0.08em", marginBottom:8 }}>
                🚨 MY ACTIVE CASE
              </div>
              <div style={{ fontFamily:"var(--font-head)", fontWeight:700, marginBottom:4 }}>
                {myActiveInc.department} — Room {myActiveInc.room}
                {myActiveInc.floor ? `, Floor ${myActiveInc.floor}` : ""}
              </div>
              <SevBadge sev={myActiveInc.severity} />
              <div style={{ display:"flex", gap:8, marginTop:10 }}>
                <button onClick={() => setSelInc(myActiveInc.id)} style={{
                  flex:1, padding:"7px 0", borderRadius:8, fontSize:12, fontWeight:700,
                  background:"var(--accent)", color:"#000" }}>Open chat</button>
                <button onClick={() => resolveIncident(myActiveInc.id)} style={{
                  flex:1, padding:"7px 0", borderRadius:8, fontSize:12, fontWeight:600,
                  background:"var(--bg3)", border:"1px solid var(--border)", color:"var(--muted)" }}>Resolve</button>
              </div>
            </div>
          )}

          {/* Incoming alerts */}
          <div style={{ padding:"12px 14px" }}>
            <div style={{ fontSize:11, color:"var(--muted)", fontWeight:600,
              letterSpacing:"0.08em", marginBottom:10, display:"flex", alignItems:"center", gap:8 }}>
              INCOMING ALERTS
              {openForMe.length>0 && (
                <span style={{ background:"var(--danger)", color:"#fff", borderRadius:"50%",
                  width:18, height:18, display:"inline-flex", alignItems:"center",
                  justifyContent:"center", fontSize:10, fontWeight:800 }}>
                  {openForMe.length}
                </span>
              )}
            </div>

            {openForMe.length===0 && !myActiveInc && (
              <div style={{ color:"var(--muted)", fontSize:13, padding:"20px 0", textAlign:"center", lineHeight:1.6 }}>
                <div style={{ fontSize:28, marginBottom:8 }}>📡</div>
                Monitoring for alerts
                {me?.department && <><br /><span style={{ color:"var(--accent)", fontSize:11 }}>{me.department}</span></>}
              </div>
            )}

            {openForMe.map(inc => (
              <div key={inc.id} style={{
                background: inc.severity==="Critical" ? "var(--danger)10" : "var(--bg3)",
                borderRadius:10, padding:14, marginBottom:10,
                border:`1px solid ${inc.severity==="Critical"?"var(--danger)50":"var(--border)"}`,
                animation:"alertPop 0.35s ease",
              }}>
                <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:6 }}>
                  <SevBadge sev={inc.severity} />
                  <span style={{ fontSize:12, fontWeight:600 }}>{inc.department}</span>
                  <span style={{ marginLeft:"auto", fontSize:10, color:"var(--muted)" }}>
                    {new Date(inc.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <div style={{ fontFamily:"var(--font-head)", fontWeight:700, marginBottom:4, fontSize:14 }}>
                  Room {inc.room}{inc.floor ? `, Floor ${inc.floor}` : ""}
                </div>
                {inc.note && <p style={{ fontSize:12, color:"var(--muted)", marginBottom:10, lineHeight:1.4 }}>{inc.note}</p>}
                <button
                  disabled={!!myActiveInc || me?.status==="off-duty"}
                  onClick={() => { acceptIncident(inc.id, me); setSelInc(inc.id); }}
                  style={{
                    width:"100%", padding:"9px 0", borderRadius:8, fontWeight:700, fontSize:13,
                    background:"var(--accent)", color:"#000",
                    opacity:(myActiveInc||me?.status==="off-duty") ? 0.35 : 1,
                  }}>
                  {myActiveInc ? "Already on a case" : me?.status==="off-duty" ? "Off-duty" : "✓ Accept"}
                </button>
              </div>
            ))}
          </div>

          {/* Team status */}
          <div style={{ padding:"0 14px 14px" }}>
            <div style={{ fontSize:11, color:"var(--muted)", fontWeight:600,
              letterSpacing:"0.08em", marginBottom:8 }}>TEAM STATUS</div>
            {users.filter(u => u.id!==me?.id && u.role!=="admin").length===0 && (
              <div style={{ fontSize:12, color:"var(--muted)", textAlign:"center", padding:"10px 0" }}>No other staff registered</div>
            )}
            {users.filter(u => u.id!==me?.id && u.role!=="admin").map(u => (
              <div key={u.id} style={{ display:"flex", alignItems:"center", gap:10,
                padding:"8px 0", borderBottom:"1px solid var(--border)" }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:sColor(u.status),
                  flexShrink:0, animation:u.status==="available"?"pulse 2s infinite":"none" }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:600,
                    whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{u.name}</div>
                  <div style={{ fontSize:10, color:"var(--muted)" }}>
                    {u.role}{u.department ? ` · ${u.department}` : ""}
                  </div>
                </div>
                <Badge status={u.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          {selInc ? (() => {
            const inc = incidents.find(i => i.id===selInc);
            return <ChatPanel incidentId={selInc} chats={chats}
              onSend={sendMessage} currentUser={currentUser} incident={inc} />;
          })() : (
            <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center",
              flexDirection:"column", gap:12, color:"var(--muted)" }}>
              <div style={{ fontSize:52 }}>💬</div>
              <div style={{ fontFamily:"var(--font-head)", fontSize:18, color:"var(--text)" }}>No chat open</div>
              <div style={{ fontSize:13 }}>Accept an incident to open its chat</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const store = useStore();
  const { view, currentUser } = store;
  
  // Add debug function to window for testing
  useEffect(() => {
    window.debugCriticare = () => {
      console.log("=== CRITICARE DEBUG ===");
      console.log("Users:", store.users);
      console.log("Incidents:", store.incidents);
      console.log("Chats:", store.chats);
      console.log("Current User:", store.currentUser);
      console.log("View:", store.view);
      console.log("====================");
    };
    
    // Add test registration function
    window.testRegister = () => {
      const testData = {
        name: "Test Doctor " + Date.now(),
        username: "testdoc_" + Date.now(),
        password: "test123",
        role: "doctor",
        department: "Cardio"
      };
      console.log("Testing registration with:", testData);
      const result = store.registerUser(testData);
      console.log("Registration result:", result);
      return result;
    };
  }, [store]);

  return (
    <>
      <GlobalStyle />
      {view==="auth" && <AuthPage store={store} />}
      {view==="admin" && currentUser?.role==="admin" && <AdminDashboard store={store} />}
      {view==="staff" && currentUser?.role!=="admin" && <StaffDashboard store={store} />}
    </>
  );
}
