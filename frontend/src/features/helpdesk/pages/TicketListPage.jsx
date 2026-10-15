import { useState } from 'react';
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

export default function TicketListPage(){
 const {hasPermission,user}=useAuth(); const {societyId}=useSociety(); const location=useLocation();
 const [status,setStatus]=useState(''); const [priority,setPriority]=useState(''); const [categoryId,setCategoryId]=useState('');
 const [show,setShow]=useState(false); const [saving,setSaving]=useState(false); const [error,setError]=useState('');
 const [form,setForm]=useState({categoryId:'',raisedBy:user?.id||user?.userId||'',unitId:'',subject:'',description:'',priority:''});
 const cats=useFetch(()=>societyId?api.listCategories({societyId}):Promise.resolve(null),[societyId]);
 const tickets=useFetch(()=>societyId?api.listTickets({societyId,status,priority,categoryId}):Promise.resolve(null),[societyId,status,priority,categoryId]);
 const rows=Array.isArray(tickets.data)?tickets.data:(tickets.data?.tickets||[]);
 const canCreate=hasPermission('TICKET_CREATE');
 const create=async(e)=>{e.preventDefault();setError(''); if(!societyId){setError('Choose a society first.');return;} if(!form.categoryId||!form.raisedBy||!form.subject.trim()){setError('Category, Raised By user ID and Subject are required.');return;} setSaving(true);try{const result=await api.createTicket({...form,societyId,unitId:form.unitId.trim()||null,priority:form.priority||undefined,description:form.description||''});setShow(false);setForm({categoryId:'',raisedBy:user?.id||user?.userId||'',unitId:'',subject:'',description:'',priority:''});tickets.reload();window.location.assign(`/helpdesk/tickets/${result.id}`);}catch(err){setError(getErrorMessage(err));}finally{setSaving(false)}};
 if(!societyId)return <PageContainer title="Helpdesk" subtitle="Manage society maintenance and service requests."><SocietyIdPrompt/></PageContainer>;
 const columns=[{key:'ticket',header:'Ticket',render:r=><><Link className="cell-title" to={`/helpdesk/tickets/${r.id}`}>{r.ticket_no||r.subject}</Link><span className="cell-sub">{r.subject}</span></>},{key:'category',header:'Category',render:r=>r.category_name||r.category?.name||'-'},{key:'priority',header:'Priority',render:r=><span className={`badge ${r.priority==='CRITICAL'||r.priority==='HIGH'?'badge-pending':'badge-system'}`}>{r.priority}</span>},{key:'status',header:'Status',render:r=><span className={`badge ${r.status==='CLOSED'||r.status==='RESOLVED'?'badge-active':r.status==='ON_HOLD'?'badge-pending':'badge-system'}`}>{label(r.status)}</span>},{key:'created',header:'Created',render:r=>r.created_at?new Date(r.created_at).toLocaleString():'-'}];
 return <PageContainer title="Helpdesk" subtitle="Track tickets, assignments, service status and SLA performance." actions={canCreate&&<button className="btn btn-primary" onClick={()=>{setError('');setShow(true)}}>New ticket</button>}>
 {location.state?.notice&&<Alert variant="success">{location.state.notice}</Alert>}
 <div className="tabs-bar"><div className="tabs"><Link className="tab active" to="/helpdesk/tickets">Tickets</Link><Link className="tab" to="/helpdesk/setup">Setup: Categories & SLA</Link></div></div>
 <div className="toolbar"><select className="input toolbar-select" value={status} onChange={e=>setStatus(e.target.value)}><option value="">All statuses</option>{TICKET_STATUSES.map(x=><option key={x} value={x}>{label(x)}</option>)}</select><select className="input toolbar-select" value={priority} onChange={e=>setPriority(e.target.value)}><option value="">All priorities</option>{PRIORITIES.map(x=><option key={x}>{x}</option>)}</select><select className="input toolbar-select" value={categoryId} onChange={e=>setCategoryId(e.target.value)}><option value="">All categories</option>{(Array.isArray(cats.data)?cats.data:cats.data?.categories||[]).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
 {(tickets.loading||tickets.error||rows.length>0)?<DataTable columns={columns} rows={rows} loading={tickets.loading} error={tickets.error?getErrorMessage(tickets.error):''} onRetry={tickets.reload} emptyTitle="No tickets found" emptyMessage="Create a helpdesk ticket or adjust the filters."/>:<div className="table-state"><h2>No tickets found</h2><p>{status||priority||categoryId?'Try a different search or status.':'Create a helpdesk ticket or adjust the filters.'}</p>{(status||priority||categoryId)&&<button type="button" className="btn btn-secondary" onClick={()=>{setStatus('');setPriority('');setCategoryId('')}}>Clear filters</button>}</div>}
 {show&&<Modal title="Create helpdesk ticket" onClose={()=>!saving&&setShow(false)} busy={saving}><form className="stack-form" onSubmit={create}>
 {error&&<Alert variant="error">{error}</Alert>}
 <label className="field">Category<select required className="input" value={form.categoryId} onChange={e=>setForm({...form,categoryId:e.target.value})}><option value="">Select category</option>{(Array.isArray(cats.data)?cats.data:cats.data?.categories||[]).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
 <label className="field">Raised by user ID<input required className="input" value={form.raisedBy} onChange={e=>setForm({...form,raisedBy:e.target.value})} placeholder="UUID of the resident/user"/></label>
 <label className="field">Unit ID (optional)<input className="input" value={form.unitId} onChange={e=>setForm({...form,unitId:e.target.value})} placeholder="Leave blank for common-area issue"/></label>
 <label className="field">Subject<input required maxLength={255} className="input" value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})}/></label>
 <label className="field">Description<textarea maxLength={5000} rows={4} className="input" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
 <label className="field">Priority (optional)<select className="input" value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}><option value="">Use category default</option>{PRIORITIES.map(x=><option key={x}>{x}</option>)}</select></label>
 <div className="form-actions"><button className="btn btn-primary" disabled={saving}>{saving?'Creating…':'Create ticket'}</button><button type="button" className="btn btn-secondary" onClick={()=>setShow(false)}>Cancel</button></div></form></Modal>}
 </PageContainer>;
}
