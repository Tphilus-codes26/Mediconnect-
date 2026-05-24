import { useState, useEffect } from "react";
import { sbFetch, S, Spin, Tag, Card, Btn, Toast, Stat, Empty } from "./Auth";

export default function AdminDashboard({user,onLogout}) {
  const [tab,setTab] = useState("overview");
  const [stats,setStats] = useState({users:0,doctors:0,patients:0,appointments:0,revenue:0});
  const [pendingDocs,setPendingDocs] = useState([]);
  const [allUsers,setAllUsers] = useState([]);
  const [flags,setFlags] = useState([]);
  const [errors,setErrors] = useState([]);
  const [txns,setTxns] = useState([]);
  const [loading,setLoading] = useState(true);
  const [toast,setToast] = useState(null);

  const showToast=(msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),3000);};

  useEffect(()=>{loadAll();},[]);

  async function loadAll() {
    setLoading(true);
    try {
      const [uRes,dRes,pRes,aRes,pdRes,usRes,fRes,eRes,tRes] = await Promise.all([
        sbFetch("GET",`/rest/v1/users?select=id`,null,user.token),
        sbFetch("GET",`/rest/v1/doctors?select=id`,null,user.token),
        sbFetch("GET",`/rest/v1/patients?select=id`,null,user.token),
        sbFetch("GET",`/rest/v1/appointments?select=id`,null,user.token),
        sbFetch("GET",`/rest/v1/doctors?approval_status=eq.pending&select=*`,null,user.token),
        sbFetch("GET",`/rest/v1/users?select=*&order=created_at.desc&limit=30`,null,user.token),
        sbFetch("GET",`/rest/v1/feature_flags?select=*&order=key.asc`,null,user.token),
        sbFetch("GET",`/rest/v1/error_logs?is_resolved=eq.false&select=*&order=created_at.desc&limit=30`,null,user.token),
        sbFetch("GET",`/rest/v1/transactions?status=eq.success&select=*&order=created_at.desc&limit=30`,null,user.token),
      ]);
      const rev=(tRes||[]).reduce((s,t)=>s+Number(t.platform_fee||0),0);
      setStats({users:(uRes||[]).length,doctors:(dRes||[]).length,patients:(pRes||[]).length,appointments:(aRes||[]).length,revenue:rev});
      setPendingDocs(pdRes||[]);
      setAllUsers(usRes||[]);
      setFlags(fRes||[]);
      setErrors(eRes||[]);
      setTxns(tRes||[]);
    } catch(e){showToast(e.message,"error");}
    setLoading(false);
  }

  async function approveDoc(id,status) {
    await sbFetch("PATCH",`/rest/v1/doctors?id=eq.${id}`,{approval_status:status,approved_by:user.id,approved_at:new Date().toISOString()},user.token);
    await sbFetch("POST",`/rest/v1/admin_actions`,[{admin_id:user.id,action:`doctor_${status}`,target_type:"doctor",target_id:id}],user.token);
    showToast(`Doctor ${status}`); loadAll();
  }

  async function toggleFlag(id,key,cur) {
    await sbFetch("PATCH",`/rest/v1/feature_flags?id=eq.${id}`,{is_enabled:!cur,updated_by:user.id,updated_at:new Date().toISOString()},user.token);
    showToast(`${key.replace("enable_","")} → ${!cur?"ON":"OFF"}`); loadAll();
  }

  async function banUser(uid,isBanned) {
    await sbFetch("PATCH",`/rest/v1/users?id=eq.${uid}`,{is_banned:isBanned},user.token);
    await sbFetch("POST",`/rest/v1/admin_actions`,[{admin_id:user.id,action:isBanned?"user_banned":"user_unbanned",target_type:"user",target_id:uid}],user.token);
    showToast(isBanned?"User banned":"User unbanned"); loadAll();
  }

  async function resolveError(id) {
    await sbFetch("PATCH",`/rest/v1/error_logs?id=eq.${id}`,{is_resolved:true,resolved_by:user.id,resolved_at:new Date().toISOString()},user.token);
    showToast("Error resolved ✓"); loadAll();
  }

  const nav=[
    {id:"overview",label:"Overview",icon:"📊"},
    {id:"doctors",label:"Doctors",icon:"👨‍⚕️",badge:pendingDocs.length},
    {id:"users",label:"Users",icon:"👥"},
    {id:"flags",label:"Features",icon:"🚩"},
    {id:"revenue",label:"Revenue",icon:"💰"},
    {id:"errors",label:"Errors",icon:"🐛",badge:errors.length},
  ];

  return (
    <div style={{minHeight:"100vh",background:"#050C18",display:"flex"}}>
      <style>{S}</style>
      {toast&&<Toast {...toast}/>}

      {/* Sidebar */}
      <div style={{width:175,background:"#080F1E",borderRight:"1px solid #102038",padding:"18px 0",flexShrink:0,display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh",overflowY:"auto"}}>
        <div style={{padding:"0 16px 20px"}}>
          <div style={{fontFamily:"Syne",fontSize:15,fontWeight:800,color:"#B47FFF"}}>🛡️ Admin</div>
          <div style={{fontSize:10,color:"#3D6080",letterSpacing:1,marginTop:2}}>MEDICONNECT</div>
        </div>
        {nav.map(n=>(
          <button key={n.id} onClick={()=>setTab(n.id)} style={{width:"100%",textAlign:"left",padding:"9px 16px",background:tab===n.id?"#B47FFF10":"transparent",borderLeft:tab===n.id?"3px solid #B47FFF":"3px solid transparent",border:"none",borderRight:"none",color:tab===n.id?"#B47FFF":"#3D6080",cursor:"pointer",fontSize:12,fontWeight:tab===n.id?600:400,display:"flex",alignItems:"center",gap:8}}>
            <span>{n.icon}</span>
            <span style={{flex:1}}>{n.label}</span>
            {n.badge>0&&<span style={{background:"#FF4569",color:"#fff",borderRadius:10,padding:"1px 6px",fontSize:9,fontWeight:700}}>{n.badge}</span>}
          </button>
        ))}
        <div style={{marginTop:"auto",padding:"16px"}}>
          <Btn full onClick={onLogout} color="#FF4569" ghost sm>Sign Out</Btn>
        </div>
      </div>

      {/* Main */}
      <div style={{flex:1,padding:20,overflow:"auto",maxHeight:"100vh",overflowY:"auto"}}>
        {loading?<div style={{textAlign:"center",paddingTop:80}}><Spin/></div>:<>

          {tab==="overview"&&<div className="fu">
            <div style={{fontFamily:"Syne",fontWeight:800,fontSize:20,marginBottom:18}}>Platform Overview</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:12,marginBottom:24}}>
              <Stat label="USERS" value={stats.users} color="#00C8FF" icon="👥"/>
              <Stat label="DOCTORS" value={stats.doctors} color="#FF7043" icon="👨‍⚕️"/>
              <Stat label="PATIENTS" value={stats.patients} color="#00F5A0" icon="🏥"/>
              <Stat label="APPOINTMENTS" value={stats.appointments} color="#B47FFF" icon="📅"/>
              <Stat label="REVENUE" value={`$${stats.revenue.toFixed(0)}`} color="#FFD54F" icon="💰"/>
              <Stat label="PENDING" value={pendingDocs.length} color="#FF4569" icon="⏳"/>
            </div>
            {pendingDocs.length>0&&<>
              <div style={{fontFamily:"Syne",fontWeight:700,fontSize:13,color:"#FF4569",letterSpacing:1,marginBottom:10}}>⚠️ DOCTORS AWAITING APPROVAL</div>
              {pendingDocs.map(d=>(
                <Card key={d.id} style={{marginBottom:10,border:"1px solid #FF456925"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <div style={{fontWeight:600}}>Dr. {d.full_name}</div>
                      <div style={{color:"#3D6080",fontSize:11,marginTop:2}}>{d.specialty} · {d.license_body||"—"} #{d.medical_license_number||"—"}</div>
                      <div style={{color:"#00C8FF",fontSize:11}}>${d.consultation_fee}/{d.fee_currency}</div>
                    </div>
                    <div style={{display:"flex",gap:6}}>
                      <Btn sm onClick={()=>approveDoc(d.id,"approved")} color="#00F5A0">✓</Btn>
                      <Btn sm onClick={()=>approveDoc(d.id,"rejected")} color="#FF4569" ghost>✗</Btn>
                    </div>
                  </div>
                </Card>
              ))}
            </>}
            {pendingDocs.length===0&&<Card><div style={{textAlign:"center",padding:30,color:"#00F5A0",fontSize:13}}>✅ No pending approvals</div></Card>}
          </div>}

          {tab==="doctors"&&<div className="fu">
            <div style={{fontFamily:"Syne",fontWeight:800,fontSize:20,marginBottom:18}}>Doctor Approvals</div>
            {pendingDocs.length===0?<Card><Empty msg="No pending doctor applications."/></Card>:pendingDocs.map(d=>(
              <Card key={d.id} style={{marginBottom:12}}>
                <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>Dr. {d.full_name}</div>
                <div style={{color:"#3D6080",fontSize:11}}>Specialty: {d.specialty}</div>
                <div style={{color:"#3D6080",fontSize:11}}>License: {d.license_body} #{d.medical_license_number}</div>
                <div style={{color:"#3D6080",fontSize:11}}>Country: {d.license_country}</div>
                <div style={{color:"#3D6080",fontSize:11}}>Experience: {d.years_of_experience||0} years</div>
                <div style={{color:"#00C8FF",fontWeight:700,fontSize:12,marginTop:4}}>Fee: ${d.consultation_fee} {d.fee_currency}</div>
                {d.bio&&<div style={{color:"#3D6080",fontSize:11,marginTop:6}}>{d.bio}</div>}
                <div style={{display:"flex",gap:8,marginTop:12}}>
                  <Btn sm onClick={()=>approveDoc(d.id,"approved")} color="#00F5A0">✓ Approve</Btn>
                  <Btn sm onClick={()=>approveDoc(d.id,"rejected")} color="#FF4569" ghost>✗ Reject</Btn>
                  <Btn sm onClick={()=>approveDoc(d.id,"suspended")} color="#FF7043" ghost>⏸ Suspend</Btn>
                </div>
              </Card>
            ))}
          </div>}

          {tab==="users"&&<div className="fu">
            <div style={{fontFamily:"Syne",fontWeight:800,fontSize:20,marginBottom:18}}>User Management</div>
            {allUsers.map(u=>(
              <Card key={u.id} style={{marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontWeight:600,fontSize:13}}>{u.email}</div>
                    <div style={{display:"flex",gap:6,marginTop:4,flexWrap:"wrap"}}>
                      <Tag label={u.role?.toUpperCase()} color={u.role==="admin"?"#B47FFF":u.role==="doctor"?"#FF7043":"#00C8FF"}/>
                      {u.is_banned&&<Tag label="BANNED" color="#FF4569"/>}
                    </div>
                    <div style={{color:"#3D6080",fontSize:10,marginTop:4}}>{u.country||"—"} · {new Date(u.created_at).toLocaleDateString()}</div>
                  </div>
                  {u.id!==user.id&&(
                    <Btn sm onClick={()=>banUser(u.id,!u.is_banned)} color={u.is_banned?"#00F5A0":"#FF4569"} ghost>
                      {u.is_banned?"Unban":"Ban"}
                    </Btn>
                  )}
                </div>
              </Card>
            ))}
          </div>}

          {tab==="flags"&&<div className="fu">
            <div style={{fontFamily:"Syne",fontWeight:800,fontSize:20,marginBottom:6}}>Feature Flags</div>
            <div style={{color:"#3D6080",fontSize:11,marginBottom:18}}>Toggle features instantly — no code changes needed.</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:10}}>
              {flags.map(f=>(
                <Card key={f.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:12}}>{f.key.replace(/_/g," ").replace("enable ","").toUpperCase()}</div>
                    <div style={{color:"#3D6080",fontSize:10,marginTop:2}}>{f.description}</div>
                  </div>
                  <button onClick={()=>toggleFlag(f.id,f.key,f.is_enabled)} style={{width:42,height:22,borderRadius:11,border:"none",cursor:"pointer",background:f.is_enabled?"#00F5A0":"#0F1E30",position:"relative",flexShrink:0,transition:"background .25s"}}>
                    <div style={{width:16,height:16,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:f.is_enabled?23:3,transition:"left .25s"}}/>
                  </button>
                </Card>
              ))}
            </div>
          </div>}

          {tab==="revenue"&&<div className="fu">
            <div style={{fontFamily:"Syne",fontWeight:800,fontSize:20,marginBottom:18}}>Revenue</div>
            <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
              <Stat label="PLATFORM FEES" value={`$${stats.revenue.toFixed(0)}`} color="#00F5A0" icon="💰"/>
              <Stat label="TRANSACTIONS" value={txns.length} color="#00C8FF" icon="📊"/>
            </div>
            {txns.length===0?<Empty msg="No successful transactions yet."/>:txns.map(t=>(
              <Card key={t.id} style={{marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontWeight:600,fontSize:12}}>{t.reference}</div>
                    <div style={{color:"#3D6080",fontSize:10}}>{t.gateway} · {new Date(t.created_at).toLocaleDateString()}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontWeight:700}}>{t.currency} {t.amount}</div>
                    <div style={{color:"#00F5A0",fontSize:11}}>Fee: {t.currency} {Number(t.platform_fee).toFixed(2)}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>}

          {tab==="errors"&&<div className="fu">
            <div style={{fontFamily:"Syne",fontWeight:800,fontSize:20,marginBottom:6}}>Error Logs</div>
            <div style={{color:"#3D6080",fontSize:11,marginBottom:18}}>Bugs captured automatically.</div>
            {errors.length===0
              ?<Card><div style={{textAlign:"center",padding:40,color:"#00F5A0",fontSize:14}}>✅ No unresolved errors!</div></Card>
              :errors.map(e=>(
                <Card key={e.id} style={{marginBottom:10,border:`1px solid ${e.severity==="critical"?"#FF4569":e.severity==="high"?"#FF7043":"#102038"}30`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:6}}>
                        <Tag label={e.severity?.toUpperCase()} color={e.severity==="critical"?"#FF4569":e.severity==="high"?"#FF7043":"#FFD54F"}/>
                        <span style={{color:"#3D6080",fontSize:10}}>{new Date(e.created_at).toLocaleString()}</span>
                      </div>
                      <div style={{fontWeight:600,fontSize:12}}>{e.error_type}</div>
                      <div style={{color:"#3D6080",fontSize:11,marginTop:3}}>{e.error_message}</div>
                    </div>
                    <Btn sm onClick={()=>resolveError(e.id)} color="#00F5A0">Resolve</Btn>
                  </div>
                </Card>
              ))
            }
          </div>}
        </>}
      </div>
    </div>
  );
        }
        
