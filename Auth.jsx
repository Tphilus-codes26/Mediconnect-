import { useState } from "react";

const C = {
  bg:"#050C18",surface:"#080F1E",card:"#0B1526",border:"#102038",
  accent:"#00C8FF",green:"#00F5A0",orange:"#FF7043",purple:"#B47FFF",
  yellow:"#FFD54F",red:"#FF4569",text:"#E8F3FF",muted:"#3D6080",dim:"#0F1E30",
};

const SB_URL = "https://scadyfzaqvkcujsnicvl.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjYWR5ZnphcXZrY3Vqc25pY3ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NDc2ODQsImV4cCI6MjA5NDUyMzY4NH0.ZYdOoWZoR6LPuKMQHY-18WhZP1aHFapyOTxoUPMDzcg";

export async function sbFetch(method, path, body, token) {
  const headers = {
    "apikey": SB_KEY,
    "Content-Type": "application/json",
    "Prefer": "return=representation",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${SB_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error_description || `HTTP ${res.status}`);
  return data;
}

export const S = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Mono:wght@300;400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#050C18;color:#E8F3FF;font-family:'DM Mono',monospace;font-size:13px}
  input,select,textarea{background:#0F1E30;border:1px solid #102038;color:#E8F3FF;
    border-radius:8px;padding:9px 12px;font-family:'DM Mono',monospace;font-size:13px;
    width:100%;outline:none;transition:border .2s}
  input:focus,select:focus,textarea:focus{border-color:#00C8FF}
  button{cursor:pointer;font-family:'DM Mono',monospace}
  ::-webkit-scrollbar{width:3px}
  ::-webkit-scrollbar-thumb{background:#102038;border-radius:2px}
  @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  .fu{animation:fadeUp .3s ease forwards}
`;

export const Spin = () => (
  <div style={{width:18,height:18,borderRadius:"50%",border:`2px solid #102038`,
    borderTopColor:"#00C8FF",animation:"spin .7s linear infinite",display:"inline-block"}}/>
);

export const Tag = ({label,color="#00C8FF"}) => (
  <span style={{padding:"2px 9px",borderRadius:20,fontSize:10,fontWeight:600,
    background:`${color}15`,color,border:`1px solid ${color}30`}}>{label}</span>
);

export const Card = ({children,style={}}) => (
  <div style={{background:"#0B1526",border:"1px solid #102038",
    borderRadius:12,padding:18,...style}}>{children}</div>
);

export const Btn = ({children,onClick,color="#00C8FF",ghost=false,sm=false,full=false,disabled=false,style={}}) => (
  <button onClick={onClick} disabled={disabled} style={{
    padding:sm?"5px 12px":"10px 20px",borderRadius:8,fontSize:sm?11:13,fontWeight:600,
    border:`1px solid ${disabled?"#3D6080":color}`,
    background:ghost?"transparent":`${disabled?"#3D6080":color}15`,
    color:disabled?"#3D6080":color,width:full?"100%":"auto",
    opacity:disabled?.6:1,transition:"all .2s",...style,
  }}>{children}</button>
);

export const Toast = ({msg,type="success"}) => (
  <div style={{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",
    zIndex:9999,padding:"10px 20px",borderRadius:10,
    background:type==="error"?"#FF456918":"#00F5A018",
    border:`1px solid ${type==="error"?"#FF4569":"#00F5A0"}`,
    color:type==="error"?"#FF4569":"#00F5A0",
    fontSize:12,fontWeight:500,whiteSpace:"nowrap",
    animation:"fadeUp .3s ease"}}>
    {msg}
  </div>
);

export const Stat = ({label,value,color="#00C8FF",icon}) => (
  <div style={{background:"#0B1526",border:"1px solid #102038",borderRadius:12,
    padding:16,flex:1,minWidth:110}}>
    <div style={{color:"#3D6080",fontSize:10,letterSpacing:2,marginBottom:6}}>{icon} {label}</div>
    <div style={{fontSize:20,fontWeight:800,color,fontFamily:"Syne"}}>{value}</div>
  </div>
);

export const Empty = ({msg}) => (
  <div style={{textAlign:"center",padding:"36px 20px",color:"#3D6080"}}>
    <div style={{fontSize:28,marginBottom:8}}>📭</div>
    <div style={{fontSize:12}}>{msg}</div>
  </div>
);

export const statusColor = s =>
  s==="completed"?"#00F5A0":s==="confirmed"?"#00C8FF":
  s==="cancelled"?"#FF4569":s==="in_progress"?"#FF7043":"#FFD54F";

export default function AuthScreen({onLogin}) {
  const [mode,setMode] = useState("login");
  const [role,setRole] = useState("patient");
  const [email,setEmail] = useState("");
  const [pass,setPass] = useState("");
  const [name,setName] = useState("");
  const [phone,setPhone] = useState("");
  const [spec,setSpec] = useState("");
  const [fee,setFee] = useState("");
  const [loading,setLoading] = useState(false);
  const [err,setErr] = useState("");

  async function doLogin() {
    setLoading(true); setErr("");
    try {
      const data = await sbFetch("POST","/auth/v1/token?grant_type=password",{email,password:pass});
      const token = data.access_token;
      const users = await sbFetch("GET",`/rest/v1/users?id=eq.${data.user.id}&select=*`,null,token);
      const user = users?.[0]||{id:data.user.id,email,role:"patient"};
      onLogin({...user,token});
    } catch(e){setErr(e.message);}
    setLoading(false);
  }

  async function doRegister() {
    setLoading(true); setErr("");
    try {
      const data = await sbFetch("POST","/auth/v1/signup",{email,password:pass});
      const uid = data.user?.id||data.id;
      if(!uid) throw new Error("Signup failed. Try a different email.");
      const auth = await sbFetch("POST","/auth/v1/token?grant_type=password",{email,password:pass}).catch(()=>null);
      const token = auth?.access_token||SB_KEY;
      await sbFetch("POST",`/rest/v1/users`,[{id:uid,email,phone:phone||null,role,password_hash:"managed_by_supabase_auth"}],token);
      if(role==="patient") {
        await sbFetch("POST",`/rest/v1/patients`,[{user_id:uid,full_name:name}],token);
      } else {
        await sbFetch("POST",`/rest/v1/doctors`,[{user_id:uid,full_name:name,specialty:spec,consultation_fee:parseFloat(fee)||0,fee_currency:"USD",approval_status:"pending"}],token);
      }
      setMode("login"); setErr("✅ Account created! Please sign in.");
    } catch(e){setErr(e.message);}
    setLoading(false);
  }

  return (
    <div style={{minHeight:"100vh",background:"#050C18",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <style>{S}</style>
      <div style={{width:"100%",maxWidth:400}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:44,marginBottom:8}}>🩺</div>
          <div style={{fontFamily:"Syne",fontSize:26,fontWeight:800,
            background:"linear-gradient(135deg,#00C8FF,#00F5A0)",
            WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>MediConnect</div>
          <div style={{color:"#3D6080",fontSize:11,marginTop:4,letterSpacing:2}}>GLOBAL TELEMEDICINE</div>
        </div>
        <Card>
          <div style={{display:"flex",gap:6,marginBottom:20}}>
            {["login","register"].map(m=>(
              <button key={m} onClick={()=>setMode(m)} style={{
                flex:1,padding:"8px",borderRadius:8,fontSize:12,fontWeight:600,
                border:`1px solid ${mode===m?"#00C8FF":"#102038"}`,
                background:mode===m?"#00C8FF15":"transparent",
                color:mode===m?"#00C8FF":"#3D6080",cursor:"pointer",letterSpacing:1,
              }}>{m==="login"?"Sign In":"Register"}</button>
            ))}
          </div>
          {mode==="register"&&(
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,color:"#3D6080",letterSpacing:2,marginBottom:6}}>I AM A</div>
              <div style={{display:"flex",gap:6}}>
                {["patient","doctor"].map(r=>(
                  <button key={r} onClick={()=>setRole(r)} style={{
                    flex:1,padding:"7px",borderRadius:8,fontSize:12,
                    border:`1px solid ${role===r?"#00F5A0":"#102038"}`,
                    background:role===r?"#00F5A012":"transparent",
                    color:role===r?"#00F5A0":"#3D6080",cursor:"pointer",
                  }}>{r==="patient"?"🏥 Patient":"👨‍⚕️ Doctor"}</button>
                ))}
              </div>
            </div>
          )}
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {mode==="register"&&<input placeholder="Full Name" value={name} onChange={e=>setName(e.target.value)}/>}
            <input placeholder="Email address" type="email" value={email} onChange={e=>setEmail(e.target.value)}/>
            <input placeholder="Password (min 6 chars)" type="password" value={pass} onChange={e=>setPass(e.target.value)}/>
            {mode==="register"&&<>
              <input placeholder="Phone (optional)" value={phone} onChange={e=>setPhone(e.target.value)}/>
              {role==="doctor"&&<>
                <input placeholder="Specialty e.g. Cardiology" value={spec} onChange={e=>setSpec(e.target.value)}/>
                <input placeholder="Consultation Fee (USD)" type="number" value={fee} onChange={e=>setFee(e.target.value)}/>
              </>}
            </>}
          </div>
          {err&&<div style={{marginTop:10,fontSize:12,color:err.startsWith("✅")?"#00F5A0":"#FF4569"}}>{err}</div>}
          <button onClick={mode==="login"?doLogin:doRegister} disabled={loading} style={{
            width:"100%",marginTop:18,padding:"12px",borderRadius:10,
            background:"linear-gradient(135deg,#00C8FF,#007ACC)",
            border:"none",color:"#fff",fontSize:14,fontWeight:700,
            cursor:loading?"not-allowed":"pointer",opacity:loading?.7:1,
            display:"flex",alignItems:"center",justifyContent:"center",gap:8,
          }}>{loading?<Spin/>:(mode==="login"?"Sign In →":"Create Account →")}</button>
          <div style={{marginTop:12,textAlign:"center",fontSize:10,color:"#3D6080"}}>
            Secured by Supabase · Global Telemedicine
          </div>
        </Card>
      </div>
    </div>
  );
               }
    
