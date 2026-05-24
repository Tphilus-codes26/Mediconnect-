import { useState, useEffect } from "react";
import { sbFetch, S, Spin, Tag, Card, Btn, Toast, Stat, Empty, statusColor } from "./Auth";

export default function PatientDashboard({user,onLogout}) {
  const [tab,setTab] = useState("home");
  const [doctors,setDoctors] = useState([]);
  const [appts,setAppts] = useState([]);
  const [patient,setPatient] = useState(null);
  const [loading,setLoading] = useState(true);
  const [booking,setBooking] = useState(null);
  const [bForm,setBForm] = useState({type:"video",date:"",complaint:""});
  const [toast,setToast] = useState(null);

  const showToast=(msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),3000);};

  useEffect(()=>{load();},[]);

  async function load() {
    setLoading(true);
    try {
      const [pats,docs,apps] = await Promise.all([
        sbFetch("GET",`/rest/v1/patients?user_id=eq.${user.id}&select=*`,null,user.token),
        sbFetch("GET",`/rest/v1/doctors?approval_status=eq.approved&select=*&order=rating.desc&limit=30`,null,user.token),
        sbFetch("GET",`/rest/v1/appointments?patient_user_id=eq.${user.id}&select=*,doctors(full_name,specialty,consultation_fee)&order=scheduled_at.desc&limit=30`,null,user.token),
      ]);
      setPatient(pats?.[0]||null);
      setDoctors(docs||[]);
      setAppts(apps||[]);
    } catch(e){showToast(e.message,"error");}
    setLoading(false);
  }

  async function book() {
    if(!booking||!bForm.date||!bForm.complaint){showToast("Fill all fields","error");return;}
    try {
      await sbFetch("POST",`/rest/v1/appointments`,[{
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

  const nav=[{id:"home",label:"Home",icon:"🏠"},{id:"doctors",label:"Doctors",icon:"👨‍⚕️"},{id:"appointments",label:"Bookings",icon:"📅"},{id:"profile",label:"Profile",icon:"👤"}];

  return (
    <div style={{minHeight:"100vh",background:"#050C18",paddingBottom:72}}>
      <style>{S}</style>
      {toast&&<Toast {...toast}/>}
      <div style={{background:"#080F1E",borderBottom:"1px solid #102038",padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:100}}>
        <div>
          <div style={{fontFamily:"Syne",fontSize:16,fontWeight:800,color:"#00C8FF"}}>🩺 MediConnect</div>
          <div style={{fontSize:10,color:"#3D6080",letterSpacing:1}}>{user.email?.split("@")[0].toUpperCase()}</div>
        </div>
        <Btn onClick={onLogout} ghost color="#3D6080" sm>Sign Out</Btn>
      </div>

      <div style={{padding:16,maxWidth:680,margin:"0 auto"}}>
        {loading?<div style={{textAlign:"center",paddingTop:60}}><Spin/></div>:<>

          {tab==="home"&&<div className="fu">
            <div style={{display:"flex",gap:10,marginBottom:18,flexWrap:"wrap"}}>
              <Stat label="PLAN" value={(patient?.subscription_plan||"FREE").toUpperCase()} color="#00F5A0" icon="⭐"/>
              <Stat label="BOOKINGS" value={appts.length} color="#00C8FF" icon="📅"/>
              <Stat label="DOCTORS" value={doctors.length} color="#B47FFF" icon="👨‍⚕️"/>
            </div>
            <div style={{fontFamily:"Syne",fontWeight:700,fontSize:14,letterSpacing:1,marginBottom:10}}>UPCOMING</div>
            {appts.filter(a=>["pending","confirmed"].includes(a.status)).length===0
              ?<Card><Empty msg="No upcoming appointments. Find a doctor and book!"/></Card>
              :appts.filter(a=>["pending","confirmed"].includes(a.status)).slice(0,3).map(a=>(
                <Card key={a.id} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <div style={{fontWeight:600}}>Dr. {a.doctors?.full_name}</div>
                      <div style={{color:"#3D6080",fontSize:11,marginTop:3}}>{a.doctors?.specialty} · {a.appointment_type}</div>
                      <div style={{color:"#3D6080",fontSize:11}}>📅 {new Date(a.scheduled_at).toLocaleString()}</div>
                    </div>
                    <Tag label={a.status.toUpperCase()} color={statusColor(a.status)}/>
                  </div>
                </Card>
              ))}
            <div style={{fontFamily:"Syne",fontWeight:700,fontSize:14,letterSpacing:1,marginTop:20,marginBottom:10}}>TOP DOCTORS</div>
            {doctors.slice(0,4).map(d=>(
              <Card key={d.id} style={{marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontWeight:600}}>Dr. {d.full_name}</div>
                    <div style={{color:"#3D6080",fontSize:11}}>{d.specialty}</div>
                    <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>
                      <Tag label={`⭐ ${d.rating||"New"}`} color="#FFD54F"/>
                      {d.is_available&&<Tag label="Available" color="#00F5A0"/>}
                    </div>
                    <div style={{color:"#00C8FF",fontWeight:700,fontSize:12,marginTop:6}}>${d.consultation_fee} {d.fee_currency}</div>
                  </div>
                  <Btn sm onClick={()=>{setBooking(d);setTab("doctors");}}>Book</Btn>
                </div>
              </Card>
            ))}
          </div>}

          {tab==="doctors"&&<div className="fu">
            <div style={{fontFamily:"Syne",fontWeight:800,fontSize:18,marginBottom:14}}>Find a Doctor</div>
            {booking&&(
              <Card style={{marginBottom:16,border:"1px solid #00C8FF40"}}>
                <div style={{color:"#00C8FF",fontFamily:"Syne",fontWeight:700,marginBottom:12}}>Book Dr. {booking.full_name}</div>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  <select value={bForm.type} onChange={e=>setBForm(f=>({...f,type:e.target.value}))}>
                    <option value="video">📹 Video Call</option>
                    <option value="voice">📞 Voice Call</option>
                    <option value="chat">💬 Chat</option>
                  </select>
                  <input type="datetime-local" value={bForm.date} onChange={e=>setBForm(f=>({...f,date:e.target.value}))}/>
                  <textarea rows={3} placeholder="Describe your symptoms / chief complaint" value={bForm.complaint} onChange={e=>setBForm(f=>({...f,complaint:e.target.value}))} style={{resize:"none"}}/>
                  <div style={{display:"flex",gap:8}}>
                    <Btn onClick={book} color="#00F5A0">Confirm Booking ✓</Btn>
                    <Btn onClick={()=>setBooking(null)} ghost color="#3D6080">Cancel</Btn>
                  </div>
                </div>
              </Card>
            )}
            {doctors.length===0?<Empty msg="No approved doctors yet."/>:doctors.map(d=>(
              <Card key={d.id} style={{marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:14}}>Dr. {d.full_name}</div>
                    <div style={{color:"#3D6080",fontSize:11,marginTop:2}}>{d.specialty}</div>
                    <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
                      <Tag label={`⭐ ${d.rating||"New"}`} color="#FFD54F"/>
                      <Tag label={`${d.total_consultations} consults`} color="#3D6080"/>
                      {d.is_available&&<Tag label="🟢 Online" color="#00F5A0"/>}
                    </div>
                    {d.languages?.length>0&&<div style={{color:"#3D6080",fontSize:10,marginTop:6}}>🗣 {d.languages.join(", ")}</div>}
                    <div style={{color:"#00C8FF",fontWeight:700,fontSize:13,marginTop:8}}>${d.consultation_fee} {d.fee_currency}</div>
                  </div>
                  <Btn sm onClick={()=>setBooking(d)} style={{marginLeft:10}}>Book</Btn>
                </div>
              </Card>
            ))}
          </div>}

          {tab==="appointments"&&<div className="fu">
            <div style={{fontFamily:"Syne",fontWeight:800,fontSize:18,marginBottom:14}}>My Appointments</div>
            {appts.length===0?<Empty msg="No appointments yet."/>:appts.map(a=>(
              <Card key={a.id} style={{marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                  <div style={{fontWeight:600}}>Dr. {a.doctors?.full_name||"—"}</div>
                  <Tag label={a.status.replace("_"," ").toUpperCase()} color={statusColor(a.status)}/>
                </div>
                <div style={{color:"#3D6080",fontSize:11}}>{a.doctors?.specialty}</div>
                <div style={{color:"#3D6080",fontSize:11,marginTop:4}}>📅 {new Date(a.scheduled_at).toLocaleString()}</div>
                <div style={{color:"#3D6080",fontSize:11}}>{a.appointment_type==="video"?"📹":a.appointment_type==="voice"?"📞":"💬"} {a.appointment_type}</div>
                {a.chief_complaint&&<div style={{marginTop:8,background:"#0F1E30",padding:"8px 10px",borderRadius:8,fontSize:12}}>{a.chief_complaint}</div>}
                <div style={{marginTop:8,fontSize:11,fontWeight:600,color:a.is_paid?"#00F5A0":"#FF7043"}}>{a.is_paid?"✅ Paid":`💳 Pending — $${a.amount}`}</div>
              </Card>
            ))}
          </div>}

          {tab==="profile"&&<div className="fu">
            <div style={{fontFamily:"Syne",fontWeight:800,fontSize:18,marginBottom:14}}>My Profile</div>
            <Card style={{marginBottom:14}}>
              <div style={{textAlign:"center",marginBottom:18}}>
                <div style={{width:64,height:64,borderRadius:"50%",background:"#00C8FF18",border:"2px solid #00C8FF",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,margin:"0 auto 10px"}}>🏥</div>
                <div style={{fontFamily:"Syne",fontWeight:700,fontSize:16}}>{patient?.full_name||user.email}</div>
                <div style={{color:"#3D6080",fontSize:11,marginTop:2}}>{user.email}</div>
                <div style={{marginTop:8}}><Tag label={(patient?.subscription_plan||"FREE").toUpperCase()+" PLAN"} color="#00F5A0"/></div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {[["Blood Group",patient?.blood_group||"—"],["Genotype",patient?.genotype||"—"],["Country",patient?.country||"—"],["Timezone",patient?.timezone||"UTC"]].map(([l,v])=>(
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
          <button key={n.id} onClick={()=>setTab(n.id)} style={{
            display:"flex",flexDirection:"column",alignItems:"center",gap:3,
            background:"none",border:"none",color:tab===n.id?"#00C8FF":"#3D6080",
            fontSize:9,fontWeight:tab===n.id?700:400,cursor:"pointer",
            borderTop:tab===n.id?"2px solid #00C8FF":"2px solid transparent",
            padding:"4px 14px",letterSpacing:.5,
          }}>
            <span style={{fontSize:18}}>{n.icon}</span>
            {n.label.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
                }
      
