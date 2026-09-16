import pg from 'pg';
const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
export const pool = connectionString ? new Pool({ connectionString, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized:false } : undefined }) : null;

export async function dbEnabled() { return Boolean(pool); }

export async function listLeads() {
  if (!pool) return [];
  const { rows } = await pool.query('select * from public.leads order by score desc, updated_at desc');
  return rows.map(fromRow);
}

export async function upsertLead(lead) {
  if (!pool) return null;
  const q = `insert into public.leads
    (id,business_name,category,location,website,phone,email,website_status,https,page_load_ms,mobile_friendly_signal,website_title,score,score_label,score_reasons,source)
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
    on conflict (id) do update set business_name=excluded.business_name,category=excluded.category,location=excluded.location,website=excluded.website,phone=excluded.phone,email=excluded.email,website_status=excluded.website_status,https=excluded.https,page_load_ms=excluded.page_load_ms,mobile_friendly_signal=excluded.mobile_friendly_signal,website_title=excluded.website_title,score=excluded.score,score_label=excluded.score_label,score_reasons=excluded.score_reasons,source=excluded.source,updated_at=now()
    returning *`;
  const values=[lead.id,lead.name,lead.category,lead.location,lead.website || null,lead.phone || null,lead.email || null,lead.websiteStatus || 'unknown',Boolean(lead.https),lead.pageLoadMs || null,Boolean(lead.mobileFriendlySignal),lead.title || null,lead.score || 0,lead.scoreLabel || null,JSON.stringify(lead.reasons || []),lead.source || 'search'];
  const { rows }=await pool.query(q,values); return fromRow(rows[0]);
}

export async function deleteLead(id) { if(pool) await pool.query('delete from public.leads where id=$1',[id]); }

function fromRow(r){return {...r,name:r.business_name,websiteStatus:r.website_status,pageLoadMs:r.page_load_ms,mobileFriendlySignal:r.mobile_friendly_signal,title:r.website_title,reasons:r.score_reasons,scoreLabel:r.score_label,saved:true};}
