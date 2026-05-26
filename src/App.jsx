import { useState, useEffect, useRef } from "react";

const SB_URL = "https://scadyfzaqvkcujsnicvl.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjYWR5ZnphcXZrY3Vqc25pY3ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NDc2ODQsImV4cCI6MjA5NDUyMzY4NH0.ZYdOoWZoR6LPuKMQHY-18WhZP1aHFapyOTxoUPMDzcg";

async function sb(method, path, body, token) {
  const h = { "apikey": SB_KEY, "Content-Type": "application/json", "Prefer": "return=representation" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  const r = await fetch(`${SB_URL}${path}`, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  if (r.status === 204) return null;
  const d = await r.json();
  if (!r.ok) throw new Error(d.message || d.error_description || `HTTP ${r.status}`);
  return d;
}

// Design tokens
const C = {
  bg:"#030812",surface:"#060E1F",card:"#091526",border:"#0D1F35",
  accent:"#00CFFF",green:"#00F0A0",orange:"#FF6B35",purple:"#9B6DFF",
  yellow:"#FFD166",red:"#FF4560",text:"#EDF4FF",muted:"#3A5A7A",dim:"#0C1E30",
};

const S = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@300;400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#030812;color:#EDF4FF;font-family:'Space Grotesk',sans-serif;font-size:14px}
  input,select,textarea{background:#0C1E30;border:1px solid #0D1F35;color:#EDF4FF;
    border-radius:10px;padding:10px 14px;font-family:'Space Grotesk',sans-serif;font-size:13px;
    width:100%;outline:none;transition:border .2s}
  input:focus,select:focus,textarea:focus{border-color:#00CFFF;box-shadow:0 0 0 3px #00CFFF15}
  button{cursor:pointer;font-family:'Space Grotesk',sans-serif;transition:all .2s}
  ::-webkit-scrollbar{width:3px}
  ::-webkit-scrollbar-thumb{background:#0D1F35;border-radius:2px}
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  .fu{animation:fadeUp .35s ease forwards}
  .pulse{animation:pulse 2s infinite}
`;

const Spin = () => <div style={{width:18,height:18,borderRadius:"50%",border:"2px solid #0D1F35",borderTopColor:"#00CFFF",animation:"spin .7s linear infinite",display:"inline-block"}}/>;
const Tag = ({label,color="#00CFFF"}) => <span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,background:`${color}18`,color,border:`1px solid ${color}30`}}>{label}</span>;
const Card = ({children,style={}}) => <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:20,...style}}>{children}</div>;
const Btn = ({children,onClick,color="#00CFFF",ghost=false,sm=false,full=false,disabled=false,style={}}) => (
  <button onClick={onClick} disabled={disabled} style={{padding:sm?"6px 14px":"11px 22px",borderRadius:10,fontSize:sm?12:14,fontWeight:600,border:`1px solid ${disabled?C.muted:color}`,background:ghost?"transparent":`${disabled?C.muted:color}18`,color:disabled?C.muted:color,width:full?"100%":"auto",opacity:disabled?.6:1,...style}}>{children}</button>
);
const Toast = ({msg,type="success"}) => <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",zIndex:9999,padding:"12px 24px",borderRadius:12,background:type==="error"?`${C.red}15`:`${C.green}15`,border:`1px solid ${type==="error"?C.red:C.green}`,color:type==="error"?C.red:C.green,fontSize:13,fontWeight:600,animation:"fadeUp .3s ease",whiteSpace:"nowrap"}}>{msg}</div>;
const Stat = ({label,value,color="#00CFFF",icon}) => <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:18,flex:1,minWidth:120}}><div style={{color:C.muted,fontSize:10,letterSpacing:2,marginBottom:8}}>{icon} {label}</div><div style={{fontSize:24,fontWeight:700,color,fontFamily:"JetBrains Mono"}}>{value}</div></div>;
const Empty = ({msg,icon="📭"}) => <div style={{textAlign:"center",padding:"48px 20px",color:C.muted}}><div style={{fontSize:32,marginBottom:10}}>{icon}</div><div style={{fontSize:13}}>{msg}</div></div>;
const statusColor = s => s==="completed"?C.green:s==="confirmed"?C.accent:s==="cancelled"?C.red:s==="in_progress"?C.orange:C.yellow;

function useToast() {
  const [t,setT] = useState(null);
  const show = (msg,type="success") => { setT({msg,type}); setTimeout(()=>setT(null),3500); };
  return [t,show];
}

// ============================================================
//  AUTH SCREEN
// ============================================================
function AuthScreen({onLogin}) {
  const [mode,setMode]=useState("login");
  const [role,setRole]=useState("patient");
  const [form,setForm]=useState({email:"",pass:"",name:"",phone:"",spec:"",fee:"",license:"",licenseBody:"",licenseCountry:"",experience:""});
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));

  async function doLogin() {
    setLoading(true);setErr("");
    try {
      const data = await sb("POST","/auth/v1/token?grant_type=password",{email:form.email,password:form.pass});
      const token = data.access_token;
      const users = await sb("GET",`/rest/v1/users?id=eq.${data.user.id}&select=*`,null,token);
      const user = users?.[0]||{id:data.user.id,email:form.email,role:"patient"};
      onLogin({...user,token});
    } catch(e){setErr(e.message);}
    setLoading(false);
  }

  async function doRegister() {
    setLoading(true);setErr("");
    try {
      const data = await sb("POST","/auth/v1/signup",{email:form.email,password:form.pass});
      const uid = data.user?.id;
      if(!uid) throw new Error("Signup failed. Try a different email.");
      const auth = await sb("POST","/auth/v1/token?grant_type=password",{email:form.email,password:form.pass}).catch(()=>null);
      const token = auth?.access_token||SB_KEY;
      await sb("POST",`/rest/v1/users`,[{id:uid,email:form.email,phone:form.phone||null,role,password_hash:"managed_by_supabase_auth"}],token);
      if(role==="patient") {
        await sb("POST",`/rest/v1/patients`,[{user_id:uid,full_name:form.name}],token);
      } else {
        const docRes = await sb("POST",`/rest/v1/doctors`,[{
          user_id:uid,full_name:form.name,specialty:form.spec,
          consultation_fee:parseFloat(form.fee)||0,fee_currency:"USD",
          approval_status:"pending",
          medical_license_number:form.license,
          license_body:form.licenseBody,
          license_country:form.licenseCountry,
          years_of_experience:parseInt(form.experience)||0,
        }],token);
        // Submit verification
        if(docRes?.[0]?.id) {
          await sb("POST",`/rest/v1/doctor_verifications`,[{
            doctor_id:docRes[0].id,
            license_number:form.license,
            license_body:form.licenseBody,
            license_country:form.licenseCountry,
            years_experience:parseInt(form.experience)||0,
            status:"pending",
          }],token);
        }
      }
      setMode("login");setErr("✅ Account created! Please sign in.");
    } catch(e){setErr(e.message);}
    setLoading(false);
  }

  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <style>{S}</style>
      <div style={{width:"100%",maxWidth:420}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:48,marginBottom:10}}>🩺</div>
          <div style={{fontFamily:"Space Grotesk",fontSize:28,fontWeight:700,background:`linear-gradient(135deg,${C.accent},${C.green})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>MediConnect</div>
          <div style={{color:C.muted,fontSize:12,marginTop:4,letterSpacing:3}}>GLOBAL TELEMEDICINE</div>
        </div>
        <Card>
          <div style={{display:"flex",gap:6,marginBottom:22}}>
            {["login","register"].map(m=>(
              <button key={m} onClick={()=>setMode(m)} style={{flex:1,padding:"9px",borderRadius:10,fontSize:13,fontWeight:600,border:`1px solid ${mode===m?C.accent:C.border}`,background:mode===m?`${C.accent}15`:"transparent",color:mode===m?C.accent:C.muted,cursor:"pointer"}}>
                {m==="login"?"Sign In":"Register"}
              </button>
            ))}
          </div>
          {mode==="register"&&(
            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,color:C.muted,letterSpacing:2,marginBottom:8}}>I AM A</div>
              <div style={{display:"flex",gap:8}}>
                {["patient","doctor"].map(r=>(
                  <button key={r} onClick={()=>setRole(r)} style={{flex:1,padding:"8px",borderRadius:10,fontSize:13,border:`1px solid ${role===r?C.green:C.border}`,background:role===r?`${C.green}12`:"transparent",color:role===r?C.green:C.muted,cursor:"pointer"}}>
                    {r==="patient"?"🏥 Patient":"👨‍⚕️ Doctor"}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {mode==="register"&&<input placeholder="Full Name *" value={form.name} onChange={e=>set("name",e.target.value)}/>}
            <input placeholder="Email address *" type="email" value={form.email} onChange={e=>set("email",e.target.value)}/>
            <input placeholder="Password (min 6 chars) *" type="password" value={form.pass} onChange={e=>set("pass",e.target.value)}/>
            {mode==="register"&&<>
              <input placeholder="Phone number" value={form.phone} onChange={e=>set("phone",e.target.value)}/>
              {role==="doctor"&&<>
                <input placeholder="Medical Specialty * (e.g. Cardiology)" value={form.spec} onChange={e=>set("spec",e.target.value)}/>
                <input placeholder="Consultation Fee (USD) *" type="number" value={form.fee} onChange={e=>set("fee",e.target.value)}/>
                <div style={{background:`${C.yellow}10`,border:`1px solid ${C.yellow}30`,borderRadius:10,padding:"10px 14px",fontSize:12,color:C.yellow}}>
                  🔐 Doctor Verification Required
                </div>
                <input placeholder="Medical License Number *" value={form.license} onChange={e=>set("license",e.target.value)}/>
                <input placeholder="License Body * (e.g. MDCN, GMC, AMA)" value={form.licenseBody} onChange={e=>set("licenseBody",e.target.value)}/>
                <input placeholder="License Country * (e.g. Nigeria, UK, USA)" value={form.licenseCountry} onChange={e=>set("licenseCountry",e.target.value)}/>
                <input placeholder="Years of Experience *" type="number" value={form.experience} onChange={e=>set("experience",e.target.value)}/>
              </>}
            </>}
          </div>
          {err&&<div style={{marginTop:12,fontSize:12,color:err.startsWith("✅")?C.green:C.red,padding:"8px 12px",background:err.startsWith("✅")?`${C.green}10`:`${C.red}10`,borderRadius:8}}>{err}</div>}
          <button onClick={mode==="login"?doLogin:doRegister} disabled={loading} style={{width:"100%",marginTop:20,padding:"13px",borderRadius:12,background:`linear-gradient(135deg,${C.accent},#0070CC)`,border:"none",color:"#fff",fontSize:15,fontWeight:700,cursor:loading?"not-allowed":"pointer",opacity:loading?.7:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            {loading?<Spin/>:(mode==="login"?"Sign In →":"Create Account →")}
          </button>
          {mode==="register"&&role==="doctor"&&<div style={{marginTop:12,fontSize:11,color:C.muted,textAlign:"center"}}>Your license will be verified by our medical team before you go live</div>}
        </Card>
      </div>
    </div>
  );
}

// ============================================================
//  PATIENT DASHBOARD
// ============================================================
function PatientDashboard({user,onLogout}) {
  const [tab,setTab]=useState("home");
  const [doctors,setDoctors]=useState([]);
  const [appts,setAppts]=useState([]);
  const [patient,setPatient]=useState(null);
  const [history,setHistory]=useState([]);
  const [loading,setLoading]=useState(true);
  const [booking,setBooking]=useState(null);
  const [bForm,setBForm]=useState({type:"video",date:"",complaint:""});
  const [chatAppt,setChatAppt]=useState(null);
  const [messages,setMessages]=useState([]);
  const [newMsg,setNewMsg]=useState("");
  const [aiSymptoms,setAiSymptoms]=useState("");
  const [aiResponse,setAiResponse]=useState("");
  const [aiLoading,setAiLoading]=useState(false);
  const [toast,showToast]=useToast();
  const msgEnd=useRef(null);

  useEffect(()=>{load();},[]);
  useEffect(()=>{msgEnd.current?.scrollIntoView({behavior:"smooth"});},[messages]);

  async function load() {
    setLoading(true);
    try {
      const [pats,docs,apps]=await Promise.all([
        sb("GET",`/rest/v1/patients?user_id=eq.${user.id}&select=*`,null,user.token),
        sb("GET",`/rest/v1/doctors?approval_status=eq.approved&select=*&order=rating.desc&limit=50`,null,user.token),
        sb("GET",`/rest/v1/appointments?patient_user_id=eq.${user.id}&select=*,doctors(full_name,specialty,consultation_fee,rating,profile_photo_url)&order=scheduled_at.desc&limit=30`,null,user.token),
      ]);
      setPatient(pats?.[0]||null);
      setDoctors(docs||[]);
      setAppts(apps||[]);
      if(pats?.[0]?.id) {
        const hist = await sb("GET",`/rest/v1/medical_history?patient_id=eq.${pats[0].id}&select=*`,null,user.token);
        setHistory(hist||[]);
      }
    } catch(e){showToast(e.message,"error");}
    setLoading(false);
  }

  async function book() {
    if(!booking||!bForm.date||!bForm.complaint){showToast("Fill all fields","error");return;}
    try {
      await sb("POST",`/rest/v1/appointments`,[{
        patient_id:patient?.id,patient_user_id:user.id,
        doctor_id:booking.id,doctor_user_id:booking.user_id,
        appointment_type:bForm.type,
        scheduled_at:new Date(bForm.date).toISOString(),
        chief_complaint:bForm.complaint,
        status:"pending",currency:"USD",amount:booking.consultation_fee,
      }],user.token);
      showToast("Appointment booked! ✓");
      setBooking(null);setBForm({type:"video",date:"",complaint:""});
      load();setTab("appointments");
    } catch(e){showToast(e.message,"error");}
  }

  async function loadChat(appt) {
    setChatAppt(appt);
    try {
      const msgs = await sb("GET",`/rest/v1/chat_messages?appointment_id=eq.${appt.id}&order=created_at.asc`,null,user.token);
      setMessages(msgs||[]);
    } catch(e){}
  }

  async function sendMessage() {
    if(!newMsg.trim()||!chatAppt) return;
    try {
      const msg = await sb("POST",`/rest/v1/chat_messages`,[{
        appointment_id:chatAppt.id,
        sender_id:user.id,
        receiver_id:chatAppt.doctor_user_id,
        message:newMsg.trim(),
      }],user.token);
      setMessages(m=>[...m,...(msg||[])]);
      setNewMsg("");
    } catch(e){showToast(e.message,"error");}
  }

  async function askAI() {
    if(!aiSymptoms.trim()) return;
    setAiLoading(true);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          messages:[{
            role:"user",
            content:`You are a medical AI assistant for MediConnect telemedicine platform. A patient has described these symptoms: "${aiSymptoms}". 
            
            Provide:
            1. Possible conditions (3 max) that could cause these symptoms
            2. Immediate home care advice
            3. Urgency level (Low/Medium/High/Emergency)
            4. Whether they should see a doctor immediately
            
            IMPORTANT: Always remind them this is not a diagnosis and they should consult a real doctor. Keep response concise and clear.`
          }]
        })
      });
      const data = await response.json();
      const text = data.content?.[0]?.text || "Unable to get AI response. Please consult a doctor.";
      setAiResponse(text);
      if(patient?.id) {
        await sb("POST",`/rest/v1/ai_consultations`,[{patient_id:patient.id,symptoms:aiSymptoms,ai_response:text}],user.token);
      }
    } catch(e){setAiResponse("AI service temporarily unavailable. Please consult a doctor.");}
    setAiLoading(false);
  }

  const nav=[{id:"home",label:"Home",icon:"🏠"},{id:"doctors",label:"Doctors",icon:"👨‍⚕️"},{id:"appointments",label:"Bookings",icon:"📅"},{id:"ai",label:"AI Check",icon:"🤖"},{id:"history",label:"History",icon:"📋"}];

  return (
    <div style={{minHeight:"100vh",background:C.bg,paddingBottom:80}}>
      <style>{S}</style>
      {toast&&<Toast {...toast}/>}

      {/* Chat Modal */}
      {chatAppt&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:1000,display:"flex",flexDirection:"column"}}>
          <div style={{background:C.surface,padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${C.border}`}}>
            <div>
              <div style={{fontWeight:700}}>Dr. {chatAppt.doctors?.full_name}</div>
              <div style={{color:C.muted,fontSize:12}}>{chatAppt.doctors?.specialty}</div>
            </div>
            <Btn sm onClick={()=>setChatAppt(null)} ghost color={C.muted}>✕ Close</Btn>
          </div>
          <div style={{flex:1,overflow:"auto",padding:16,display:"flex",flexDirection:"column",gap:10}}>
            {messages.length===0&&<Empty msg="No messages yet. Start the conversation!" icon="💬"/>}
            {messages.map(m=>(
              <div key={m.id} style={{display:"flex",justifyContent:m.sender_id===user.id?"flex-end":"flex-start"}}>
                <div style={{maxWidth:"75%",padding:"10px 14px",borderRadius:m.sender_id===user.id?"14px 14px 4px 14px":"14px 14px 14px 4px",background:m.sender_id===user.id?`${C.accent}20`:C.card,border:`1px solid ${m.sender_id===user.id?C.accent:C.border}`,fontSize:13}}>
                  {m.message}
                  <div style={{fontSize:10,color:C.muted,marginTop:4}}>{new Date(m.created_at).toLocaleTimeString()}</div>
                </div>
              </div>
            ))}
            <div ref={msgEnd}/>
          </div>
          <div style={{padding:16,background:C.surface,borderTop:`1px solid ${C.border}`,display:"flex",gap:10}}>
            <input value={newMsg} onChange={e=>setNewMsg(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMessage()} placeholder="Type a message..." style={{flex:1}}/>
            <Btn onClick={sendMessage} sm>Send →</Btn>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:100}}>
        <div>
          <div style={{fontFamily:"Space Grotesk",fontSize:16,fontWeight:700,color:C.accent}}>🩺 MediConnect</div>
          <div style={{fontSize:11,color:C.muted}}>{user.email?.split("@")[0]}</div>
        </div>
        <Btn onClick={onLogout} ghost color={C.muted} sm>Sign Out</Btn>
      </div>

      <div style={{padding:16,maxWidth:720,margin:"0 auto"}}>
        {loading?<div style={{textAlign:"center",paddingTop:60}}><Spin/></div>:<>

          {/* HOME */}
          {tab==="home"&&<div className="fu">
            <div style={{marginBottom:20}}>
              <div style={{fontSize:20,fontWeight:700,marginBottom:4}}>Hello, {patient?.full_name?.split(" ")[0]||"Patient"} 👋</div>
              <div style={{color:C.muted,fontSize:13}}>How are you feeling today?</div>
            </div>
            <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}}>
              <Stat label="PLAN" value={(patient?.subscription_plan||
