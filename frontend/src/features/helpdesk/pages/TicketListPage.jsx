import { useEffect, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import useAuth from '../../../app/providers/useAuth';
import useSociety from '../../../app/store/useSociety';
import useFetch from '../../../utils/useFetch';
import { getErrorMessage } from '../../../lib/axios';
import * as api from '../api/helpdesk.api';
import PageContainer from '../../../components/layout/PageContainer';
import DataTable from '../../../components/tables/DataTable';
import Alert from '../../../components/ui/Alert';
import Modal from '../../../components/ui/Modal';
import SocietyIdPrompt from '../../../components/ui/SocietyIdPrompt';
import { PRIORITIES, TICKET_STATUSES, label } from '../components/helpdeskOptions';
import unitApi from '../../units/api/unit.api';
import floorApi from '../../floors/api/floor.api';
import towerApi from '../../towers/api/tower.api';

const rowsFrom = (response, key) => {
 const rows = Array.isArray(response) ? response : response?.data || response?.[key] || [];
 return Array.isArray(rows) ? rows : [];
};

export default function TicketListPage(){
 const {hasPermission,user}=useAuth(); const {societyId}=useSociety(); const location=useLocation();
 const [status,setStatus]=useState(''); const [priority,setPriority]=useState(''); const [categoryId,setCategoryId]=useState('');
 const [show,setShow]=useState(false); const [saving,setSaving]=useState(false); const [error,setError]=useState('');
 const [form,setForm]=useState({categoryId:'',raisedBy:user?.id||user?.userId||'',unitId:'',subject:'',description:'',priority:''});
 const [units,setUnits]=useState([]); const [unitsLoading,setUnitsLoading]=useState(false); const [unitsError,setUnitsError]=useState('');
 const cats=useFetch(()=>societyId?api.listCategories({societyId}):Promise.resolve(null),[societyId]);
 const tickets=useFetch(()=>societyId?api.listTickets({societyId,status,priority,categoryId}):Promise.resolve(null),[societyId,status,priority,categoryId]);
 useEffect(()=>{
  if(!show||!societyId)return undefined;
  let active=true;
  setUnitsLoading(true);setUnitsError('');setUnits([]);
  const config={headers:{'x-society-id':societyId}};
  Promise.all([unitApi.getAll(config),floorApi.getAll(config),towerApi.getAll(config)])
   .then(([unitResponse,floorResponse,towerResponse])=>{
    if(!active)return;
    const allUnits=rowsFrom(unitResponse,'units');
    const floors=rowsFrom(floorResponse,'floors');
    const towers=rowsFrom(towerResponse,'towers');
    const floorsById=new Map(floors.map(floor=>[floor.id,floor]));
    const towersById=new Map(towers.map(tower=>[tower.id,tower]));
    setUnits(allUnits.filter(unit=>unit.status!=='INACTIVE').map(unit=>{
     const floor=floorsById.get(unit.floorId||unit.floor_id);
     const tower=towersById.get(floor?.towerId||floor?.tower_id);
     const unitName=unit.unitNumber||unit.unit_number||unit.name||'Unit';
     return {id:unit.id,label:`${unitName}${tower?.name?` - ${tower.name}`:''}`};
    }));
   })
   .catch(()=>{if(active)setUnitsError('Could not load units for this society. You can still create a common-area ticket.');})
   .finally(()=>{if(active)setUnitsLoading(false);});
  return ()=>{active=false;};
 },[show,societyId]);
 const rows=Array.isArray(tickets.data)?tickets.data:(tickets.data?.tickets||[]);
 const categoryRows=Array.isArray(cats.data)?cats.data:(cats.data?.categories||[]);
 const categoryNames=new Map(categoryRows.map(category=>[String(category.id),category.name||category.category_name||category.title]));
 const canCreate=hasPermission('TICKET_CREATE');
 const create=async(e)=>{e.preventDefault();setError(''); if(!societyId){setError('Choose a society first.');return;} if(!form.categoryId||!form.raisedBy||!form.subject.trim()){setError('Category, Raised by and Subject are required.');return;} setSaving(true);try{const result=await api.createTicket({...form,societyId,unitId:form.unitId.trim()||null,priority:form.priority||undefined,description:form.description||''});setShow(false);setForm({categoryId:'',raisedBy:user?.id||user?.userId||'',unitId:'',subject:'',description:'',priority:''});tickets.reload();window.location.assign(`/helpdesk/tickets/${result.id}`);}catch(err){setError(getErrorMessage(err));}finally{setSaving(false)}};
 if(!societyId)return <PageContainer className="helpdesk-page" title="Helpdesk" subtitle="Manage society maintenance and service requests."><SocietyIdPrompt/></PageContainer>;
 const columns=[{key:'ticket',header:'Ticket',render:r=><><Link className="cell-title" to={`/helpdesk/tickets/${r.id}`}>{r.ticket_no||r.subject}</Link><span className="cell-sub">{r.subject}</span></>},{key:'category',header:'Category',render:r=>r.category_name||r.categoryName||r.category?.name||categoryNames.get(String(r.category_id||r.categoryId||r.category?.id))||'-'},{key:'priority',header:'Priority',render:r=><span className={`badge ${r.priority==='CRITICAL'||r.priority==='HIGH'?'badge-pending':'badge-system'}`}>{r.priority}</span>},{key:'status',header:'Status',render:r=><span className={`badge ${r.status==='CLOSED'||r.status==='RESOLVED'?'badge-active':r.status==='ON_HOLD'?'badge-pending':'badge-system'}`}>{label(r.status)}</span>},{key:'created',header:'Created',render:r=>r.created_at?new Date(r.created_at).toLocaleString():'-'}];
 return <PageContainer className="helpdesk-page" title="Helpdesk" subtitle="Track tickets, assignments, service status and SLA performance." actions={<><button className="society-workflow-action" onClick={tickets.reload} disabled={tickets.loading}><RefreshCw size={16}/> Refresh</button>{canCreate&&<button className="society-add-button" onClick={()=>{setError('');setShow(true)}}><Plus size={16} /> New ticket</button>}</>}>
 {location.state?.notice&&<Alert variant="success">{location.state.notice}</Alert>}
 <nav className="security-tabs helpdesk-tabs" aria-label="Helpdesk sections"><Link className="active" to="/helpdesk/tickets">Tickets</Link><Link to="/helpdesk/setup">Categories & SLA setup</Link></nav>
 <section className="helpdesk-data-panel"><div className="society-list-heading"><div><h2>Tickets</h2><p>Review requests, priorities, categories, and status.</p></div><span className="society-count">{tickets.loading?'Loading':`${rows.length} tickets`}</span></div><div className="toolbar helpdesk-toolbar"><select className="input toolbar-select helpdesk-filter" value={status} onChange={e=>setStatus(e.target.value)}><option value="">All statuses</option>{TICKET_STATUSES.map(x=><option key={x} value={x}>{label(x)}</option>)}</select><select className="input toolbar-select helpdesk-filter" value={priority} onChange={e=>setPriority(e.target.value)}><option value="">All priorities</option>{PRIORITIES.map(x=><option key={x}>{x}</option>)}</select><select className="input toolbar-select helpdesk-filter" value={categoryId} onChange={e=>setCategoryId(e.target.value)}><option value="">All categories</option>{(Array.isArray(cats.data)?cats.data:cats.data?.categories||[]).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>{(status||priority||categoryId)&&<button type="button" className="btn btn-secondary" onClick={()=>{setStatus('');setPriority('');setCategoryId('')}}>Clear filters</button>}</div>
 <div className="helpdesk-table">{(tickets.loading||tickets.error||rows.length>0)?<DataTable columns={columns} rows={rows} loading={tickets.loading} error={tickets.error?getErrorMessage(tickets.error):''} onRetry={tickets.reload} emptyTitle="No tickets found" emptyMessage="Create a helpdesk ticket or adjust the filters."/>:<div className="table-state"><h2>No tickets found</h2><p>Create a helpdesk ticket or adjust the filters.</p></div>}</div></section>
 {show&&<Modal title="Create helpdesk ticket" className="helpdesk-dialog" onClose={()=>!saving&&setShow(false)} busy={saving}><form className="stack-form helpdesk-ticket-form" onSubmit={create}>
 {error&&<Alert variant="error">{error}</Alert>}
 <label className="field">Category<select required className="input" value={form.categoryId} onChange={e=>setForm({...form,categoryId:e.target.value})}><option value="">Select category</option>{(Array.isArray(cats.data)?cats.data:cats.data?.categories||[]).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
 <label className="field">Raised by<input className="input" value={[user?.first_name,user?.last_name].filter(Boolean).join(' ')||[user?.firstName,user?.lastName].filter(Boolean).join(' ')||user?.fullName||user?.name||user?.email||'Current user'} readOnly /></label>
 <label className="field">Unit (optional)<select className="input" value={form.unitId} onChange={e=>setForm({...form,unitId:e.target.value})} disabled={unitsLoading}><option value="">{unitsLoading?'Loading units...':'Common area (no unit)'}</option>{units.map(unit=><option key={unit.id} value={unit.id}>{unit.label}</option>)}</select>{unitsError&&<small className="field-hint">{unitsError}</small>}</label>
 <label className="field">Subject<input required maxLength={255} className="input" value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})}/></label>
 <label className="field">Description<textarea maxLength={5000} rows={4} className="input" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
 <label className="field">Priority (optional)<select className="input" value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}><option value="">Use category default</option>{PRIORITIES.map(x=><option key={x}>{x}</option>)}</select></label>
 <div className="form-actions"><button className="btn btn-primary" disabled={saving}>{saving?'Creating…':'Create ticket'}</button><button type="button" className="btn btn-secondary" onClick={()=>setShow(false)}>Cancel</button></div></form></Modal>}
 </PageContainer>;
}
