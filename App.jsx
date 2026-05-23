import { useState, useEffect } from "react";
import { sbFetch, S, Spin } from "./Auth";
import AuthScreen from "./Auth";
import PatientDashboard from "./Patient";
import DoctorDashboard from "./Doctor";
import AdminDashboard from "./Admin";

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("mc_user");
      if (saved) setUser(JSON.parse(saved));
    } catch(_) {}
    setChecking(false);
  }, []);

  function handleLogin(u) {
    setUser(u);
    try { localStorage.setItem("mc_user", JSON.stringify(u)); } catch(_) {}
  }

  async function handleLogout() {
    try {
      if (user?.token) {
        await fetch("https://scadyfzaqvkcujsnicvl.supabase.co/auth/v1/logout", {
          method: "POST",
          headers: {
            "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjYWR5ZnphcXZrY3Vqc25pY3ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NDc2ODQsImV4cCI6MjA5NDUyMzY4NH0.ZYdOoWZoR6LPuKMQHY-18WhZP1aHFapyOTxoUPMDzcg",
            "Authorization": `Bearer ${user.token}`,
          },
        });
      }
    } catch(_) {}
    localStorage.removeItem("mc_user");
    setUser(null);
  }

  if (checking) return (
    <div style={{minHeight:"100vh",background:"#050C18",display:"flex",
      alignItems:"center",justifyContent:"center"}}>
      <style>{S}</style>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:44,marginBottom:12}}>🩺</div>
        <div style={{fontFamily:"Syne",fontSize:20,fontWeight:800,color:"#00C8FF"}}>
          MediConnect
        </div>
        <div style={{marginTop:16}}><Spin/></div>
      </div>
    </div>
  );

  if (!user) return <AuthScreen onLogin={handleLogin}/>;
  if (user.role === "admin" || user.role === "superadmin")
    return <AdminDashboard user={user} onLogout={handleLogout}/>;
  if (user.role === "doctor")
    return <DoctorDashboard user={user} onLogout={handleLogout}/>;
  return <PatientDashboard user={user} onLogout={handleLogout}/>;
}
