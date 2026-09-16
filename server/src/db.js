import pg from 'pg';
const { Pool } = pg;
const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
export const pool = connectionString ? new Pool({ connectionString, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized:false } : undefined }) : null;
export async function dbEnabled(){return Boolean(pool)}
export async function listLeads(){if(!pool)return [];const {rows}=await pool.query('select * from public.leads order by score desc, updated_at desc');return rows.map(fromRow)}
export async function upsertLead(lead){
 if(!pool)return null;
 const q=`insert into public.leads (id,business_name,category,location,website,phone,email,website_status,https,page_load_ms,mobile_friendly_signal,website_title,score,score_label,score_reasons,source,pipeline_status,notes,follow_up_date,last_contacted_at)
 values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
 on conflict(id) do update set business_name=excluded.business_name,category=excluded.category,location=excluded.location,website=excluded.website,phone=excluded.phone,email=excluded.email,website_status=excluded.website_status,https=excluded.https,page_load_ms=excluded.page_load_ms,mobile_friendly_signal=excluded.mobile_friendly_signal,website_title=excluded.website_title,score=excluded.score,score_label=excluded.score_label,score_reasons=excluded.score_reasons,source=excluded.source,pipeline_status=excluded.pipeline_status,notes=excluded.notes,follow_up_date=excluded.follow_up_date,last_contacted_at=excluded.last_contacted_at,updated_at=now() returning *`;
 const values=[lead.id,lead.name,lead.category,lead.location,lead.website||null,lead.phone||null,lead.email||null,lead.websiteStatus||'unknown',Boolean(lead.https),lead.pageLoadMs||null,Boolean(lead.mobileFriendlySignal),lead.title||null,lead.score||0,lead.scoreLabel||null,JSON.stringify(lead.reasons||[]),lead.source||'search',lead.pipelineStatus||'new',lead.notes||'',lead.followUpDate||null,lead.lastContactedAt||null];
 const {rows}=await pool.query(q,values);return fromRow(rows[0]);
}
export async function updateLeadCRM(id,{pipelineStatus,notes,followUpDate,lastContactedAt}){
 if(!pool)return null;
 const q=`update public.leads set pipeline_status=coalesce($2,pipeline_status),notes=coalesce($3,notes),follow_up_date=$4,last_contacted_at=coalesce($5,last_contacted_at),updated_at=now() where id=$1 returning *`;
 const {rows}=await pool.query(q,[id,pipelineStatus??null,notes??null,followUpDate||null,lastContactedAt||null]);return rows[0]?fromRow(rows[0]):null;
}
export async function deleteLead(id){if(pool)await pool.query('delete from public.leads where id=$1',[id])}
function fromRow(r){return {...r,name:r.business_name,websiteStatus:r.website_status,pageLoadMs:r.page_load_ms,mobileFriendlySignal:r.mobile_friendly_signal,title:r.website_title,reasons:r.score_reasons,scoreLabel:r.score_label,pipelineStatus:r.pipeline_status||'new',notes:r.notes||'',followUpDate:r.follow_up_date?String(r.follow_up_date).slice(0,10):'',lastContactedAt:r.last_contacted_at,saved:true}}
