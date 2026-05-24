import { useState, useEffect } from "react";
import { sbFetch, S, Spin, Tag, Card, Btn, Toast, Stat, Empty, statusColor } from "./Auth";

export default function DoctorDashboard({user,onLogout}) {
  const [tab,setTab] = useState("home");
  const [doctor,setDoctor] = useState(null);
  const [appts,setAppts] = useState([]);
  const [loading,setLoading] = useState(true);
  const [online,setOnline] = useState(false);
  const [notes,setNotes] = useState({});
  const [activeNote,setActiveNote] = useState(null);
  const [toast,setToast] = useState(null);

  const showToast=(msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),3000);};

  useEffect(()=>{load();},[]);

  async function load() {
    setLoading(true);
    try {
      const docs = await sbFetch("GET",`/rest/v1/doctors?user_id=eq.${user.id}&select=*`,null,user.token);
      const doc = docs?.[0]||null;
      setDoctor(doc); setOnline(doc?.is_available||false);
      if(doc) {
        const apps = await sbFetch("GET",`/rest/v1/appointments?doctor_id=eq.${doc.id}&select=*,patients(full_name,blood_group,allergies)&order=scheduled_at.desc&limit=40`,null,user.token);
        setAppts(apps||[]);
      }
    } catch(e){showToast(e.message,"error");}
    setLoading(false);
  }

  async function toggleOnline() {
    const next=!online;
    await sbFetch("PATCH",`/rest/v1/doctors?user_id=eq.${user.id}`,{is_available:next},user.token);
    setOnline(next);
    showToast(next?"You are now online 🟢":"You are now offline ⚫");
  }

  async function setStatus(apptId,status) {
    const updates={status};
    if(status==="in_progress") updates.started_at=new Date().toISOString();
    if(status==="completed") updates.ended_at=new Date().toISOString();
    await sbFetch("PATCH",`/rest/v1/appointments?id=eq.${apptId}`,updates,user.token);
    if(status==="completed"&&doctor) {
      await sbFetch("PATCH",`/rest/v1/doctors?id=eq.${doctor.id}`,{total_consultations:(doctor.total_consultations||0)+1},user.token);
    }
    showToast(`Status → ${status}`); load();
  }

  async function saveNotes(apptId) {
    const n=notes[apptId]||{};
    if(!n.assessment){showToast("Add assessment","error");return;}
    const appt=appts.find(a=>a.id===apptId);
    await sbFetch("POST",`/rest/v1/consultation_notes`,[{
      appointment_id:apptId,doctor_id:doctor.id,patient_id:appt.patient_id,
      subjective:n.subjective||"",objective:n.objective||"",
      assessment:n.assessment,plan:n.plan||"",
    }],user.token);
    showToast("Notes saved ✓"); setActiveNote(null);
  }

  const setN=(id,k,v)=>setNotes(n=>({...n,[id]:{...n[id],[k]:v}}));
  const pending=appts.filter(a=>a.status==="pending");
  const active=appts.filter(a=>["confirmed","in_progress"].includes(a.status));
  const completed=appts.filter(a=>a.status==="completed");
  const earnings=completed.reduce((s,a)=>s+(Number(a.amount)||0)*0.85,0);

  const nav=[{id:"home",label:"Dashboard",icon:"🏠"},{id:"history",label:"History",icon:"📋"},{id:"profile",label:"Profile",icon:"👨‍⚕️"}];

  return (
    <div style={{minHeight:"100vh",background:"#050C18",paddingBottom:72}}>
      <style>{S}</style>
      {toast&&<Toast {...toast}/>}
      <div style={{background:"#080F1E",borderBottom:"1px solid #102038",padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:100}}>
        <div>
          <div style={{fontFamily:"Syne",fontSize:16,fontWeight:800,color:"#FF7043"}}>🩺 Dr. Portal</div>
          <div style={{fontSize:10,color:"#3D6080",letterSpacing:1}}>MEDICONNECT</div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={toggleOnline} style={{padding:"5px 12px",borderRadius:20,fontSize:11,fontWeight:700,border:`1px solid ${online?"#00F5A0":"#3D6080"}`,background:online?"#00F5A012":"transparent",color:online?"#00F5A0":"#3D6080",cursor:"pointer"}}>{online?"🟢 Online":"⚫ Offline"}</button>
          <Btn onClick={onLogout} ghost color="#3D6080" sm>Out</Btn>
        </div>
      </div>

      {doctor?.approval_status==="pending"&&(
        <div style={{margin:16,padding:"12px 16px",borderRadius:10,background:"#FFD54F10",border:"1px solid #FFD54F30",color:"#FFD54F",fontSize:12}}>
          ⏳ Your account is pending admin approval. You will be notified once approved.
        </div>
      )}

      <div style={{padding:16,maxWidth:680,margin:"0 auto"}}>
        {loading?<div style={{textAlign:"center",paddingTop:60}}><Spin/></div>:<>

          {tab==="home"&&<div className="fu">
            <div style={{display:"flex",gap:10,marginBottom:18,flexWrap:"wrap"}}>
              <Stat label="PENDING" value={pending.length} color="#FFD54F" icon="⏳"/>
              <Stat label="ACTIVE" value={active.length} color="#FF7043" icon="🔥"/>
              <Stat label="EARNINGS" value={`$${earnings.toFixed(0)}`} color="#00F5A0" icon="💰"/>
              <Stat label="RATING" value={`⭐${doctor?.rating||"—"}`} color="#B47FFF" icon=""/>
            </div>

            {pending.length>0&&<>
              <div style={{fontFamily:"Syne",fontWeight:700,fontSize:13,letterSpacing:1,color:"#FFD54F",marginBottom:10}}>⏳ PENDING REQUESTS</div>
              {pending.map(a=>(
                <Card key={a.id} style={{marginBottom:10,border:"1px solid #FFD54F25"}}>
                  <div style={{fontWeight:600,marginBottom:4}}>{a.patients?.full_name||"Patient"}</div>
                  <div style={{color:"#3D6080",fontSize:11}}>📅 {new Date(a.scheduled_at).toLocaleString()} · {a.appointment_type}</div>
                  {a.chief_complaint&&<div style={{marginTop:8,background:"#0F1E30",padding:"8px 10px",borderRadius:8,fontSize:12}}>{a.chief_complaint}</div>}
                  <div style={{display:"flex",gap:8,marginTop:10}}>
                    <Btn sm onClick={()=>setStatus(a.id,"confirmed")} color="#00F5A0">✓ Accept</Btn>
                    <Btn sm onClick={()=>setStatus(a.id,"cancelled")} color="#FF4569" ghost>✗ Decline</Btn>
                  </div>
                </Card>
              ))}
            </>}

            {active.length>0&&<>
              <div style={{fontFamily:"Syne",fontWeight:700,fontSize:13,letterSpacing:1,color:"#00C8FF",marginBottom:10,marginTop:16}}>📅 ACTIVE SESSIONS</div>
              {active.map(a=>(
                <Card key={a.id} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                    <div style={{fontWeight:600}}>{a.patients?.full_name}</div>
                    <Tag label={a.status.replace("_"," ").toUpperCase()} color={statusColor(a.status)}/>
                  </div>
                  <div style={{color:"#3D6080",fontSize:11}}>{new Date(a.scheduled_at).toLocaleString()}</div>
                  {a.patients?.blood_group&&<div style={{color:"#3D6080",fontSize:11,marginTop:2}}>Blood: {a.patients.blood_group}</div>}
                  <div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap"}}>
                    {a.status==="confirmed"&&<Btn sm onClick={()=>setStatus(a.id,"in_progress")} color="#FF7043">▶ Start</Btn>}
                    {a.status==="in_progress"&&<Btn sm onClick={()=>setStatus(a.id,"completed")} color="#00F5A0">✓ Complete</Btn>}
                    <Btn sm onClick={()=>setActiveNote(activeNote===a.id?null:a.id)} color="#B47FFF" ghost>📝 Notes</Btn>
                  </div>
                  {activeNote===a.id&&(
                    <div style={{marginTop:12,display:"flex",flexDirection:"column",gap:8}}>
                      {[["subjective","Subjective (patient complaints)"],["objective","Objective (your findings)"],["assessment","Assessment / Diagnosis *"],["plan","Treatment Plan"]].map(([k,ph])=>(
                        <textarea key={k} rows={2} placeholder={ph} value={notes[a.id]?.[k]||""} onChange={e=>setN(a.id,k,e.target.value)} style={{resize:"none"}}/>
                      ))}
                      <Btn sm onClick={()=>saveNotes(a.id)} color="#00F5A0">Save Notes ✓</Btn>
                    </div>
                  )}
                </Card>
              ))}
            </>}

            {pending.length===0&&active.length===0&&<Card><Empty msg="No active appointments. Toggle online to receive bookings."/></Card>}
          </div>}

          {tab==="history"&&<div className="fu">
            <div style={{fontFamily:"Syne",fontWeight:800,fontSize:18,marginBottom:14}}>Consultation History</div>
            {completed.length===0?<Empty msg="No completed consultations yet."/>:completed.map(a=>(
              <Card key={a.id} style={{marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontWeight:600}}>{a.patients?.full_name}</div>
                    <div style={{color:"#3D6080",fontSize:11}}>{new Date(a.scheduled_at).toLocaleDateString()}</div>
                    <div style={{color:"#3D6080",fontSize:11}}>{a.chief_complaint}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <Tag label="DONE" color="#00F5A0"/>
                    <div style={{color:"#00F5A0",fontWeight:700,marginTop:6,fontSize:13}}>+${(Number(a.amount)*0.85).toFixed(0)}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>}

          {tab==="profile"&&<div className="fu">
            <div style={{fontFamily:"Syne",fontWeight:800,fontSize:18,marginBottom:14}}>Doctor Profile</div>
            <Card style={{marginBottom:14}}>
              <div style={{textAlign:"center",marginBottom:16}}>
                <div style={{width:64,height:64,borderRadius:"50%",background:"#FF704318",border:"2px solid #FF7043",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,margin:"0 auto 10px"}}>👨‍⚕️</div>
                <div style={{fontFamily:"Syne",fontWeight:700,fontSize:16}}>Dr. {doctor?.full_name}</div>
                <div style={{color:"#3D6080",fontSize:11,marginTop:2}}>{doctor?.specialty}</div>
                <div style={{marginTop:8,display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap"}}>
                  <Tag label={doctor?.approval_status?.toUpperCase()} color={doctor?.approval_status==="approved"?"#00F5A0":"#FFD54F"}/>
                  <Tag label={`⭐ ${doctor?.rating||"No ratings"}`} color="#FFD54F"/>
                  <Tag label={`${doctor?.total_consultations||0} consults`} color="#00C8FF"/>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {[["Fee",`$${doctor?.consultation_fee} ${doctor?.fee_currency}`],["Experience",`${doctor?.years_of_experience||0} yrs`],["License",doctor?.license_body||"—"],["Country",doctor?.license_country||"—"]].map(([l,v])=>(
                  <div key={l} style={{background:"#0F1E30",borderRadius:8,padding:"9px 12px"}}>
                    <div style={{color:"#3D6080",fontSize:10}}>{l}</div>
                    <div style={{fontWeight:600,marginTop:2}}>{v}</div>
                  </div>
                ))}
              </div>
            </Card>
            <Btn full onClick={onLogout} color="#FF4569" ghost>Sign Out</Btn>
          </div>}
        </>}
      </div>

      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#080F1E",borderTop:"1px solid #102038",display:"flex",justifyContent:"space-around",padding:"8px 0"}}>
        {nav.map(n=>(
          <button key={n.id} onClick={()=>setTab(n.id)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,background:"none",border:"none",color:tab===n.id?"#FF7043":"#3D6080",fontSize:9,fontWeight:tab===n.id?700:400,cursor:"pointer",borderTop:tab===n.id?"2px solid #FF7043":"2px solid transparent",padding:"4px 18px",letterSpacing:.5}}>
            <span style={{fontSize:18}}>{n.icon}</span>
            {n.label.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
                  }
      
