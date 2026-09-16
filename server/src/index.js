import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { scoreLead, scoreLabel } from './scoring.js';
import { dbEnabled, listLeads as listDbLeads, upsertLead, deleteLead as deleteDbLead } from './db.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
const memoryLeads = new Map();
const sampleBusinesses = [
  { name:'Local Cafe', category:'Cafe', location:'Dombivli', website:'https://example.com', phone:'+91 90000 00001', email:'' },
  { name:'Shree Dental Care', category:'Dentist', location:'Dombivli', website:'', phone:'+91 90000 00002', email:'hello@example.com' },
  { name:'Prime Fitness Studio', category:'Gym', location:'Dombivli', website:'https://example.org', phone:'+91 90000 00003', email:'' },
  { name:'Urban Spice Restaurant', category:'Restaurant', location:'Dombivli', website:'', phone:'+91 90000 00004', email:'' },
  { name:'Bright Minds Academy', category:'Education', location:'Dombivli', website:'https://example.net', phone:'+91 90000 00005', email:'' }
];
function normalizeUrl(url){return /^https?:\/\//i.test(url)?url:`https://${url}`;}
async function analyzeWebsite(url){
 if(!url)return {websiteStatus:'missing',https:false,pageLoadMs:null,mobileFriendlySignal:false,title:''};
 const target=normalizeUrl(url),started=Date.now();
 try{const r=await axios.get(target,{timeout:7000,maxRedirects:5,validateStatus:()=>true,headers:{'User-Agent':'LeadHunterAI/0.1 website audit'}});const html=typeof r.data==='string'?r.data:'';return {websiteStatus:r.status>=200&&r.status<400?'ok':'error',https:target.startsWith('https://'),pageLoadMs:Date.now()-started,mobileFriendlySignal:/<meta[^>]+name=["']viewport["']/i.test(html),title:(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]||'').trim().slice(0,160)};}catch{return {websiteStatus:'unreachable',https:target.startsWith('https://'),pageLoadMs:Date.now()-started,mobileFriendlySignal:false,title:''};}
}
app.get('/api/health',async(_req,res)=>res.json({ok:true,service:'LeadHunter API',database:await dbEnabled()}));
app.get('/api/leads',async(_req,res)=>{res.json(await listDbLeads() || [...memoryLeads.values()]);});
app.post('/api/search',async(req,res)=>{
 const {location='',category='',limit=10}=req.body||{};const max=Math.min(Math.max(Number(limit)||10,1),50);
 const matches=sampleBusinesses.filter(b=>(!location||b.location.toLowerCase().includes(location.toLowerCase()))&&(!category||b.category.toLowerCase().includes(category.toLowerCase()))).slice(0,max);
 const analyzed=await Promise.all(matches.map(async b=>{const audit=await analyzeWebsite(b.website);const lead={...b,id:`${b.name.toLowerCase().replace(/[^a-z0-9]+/g,'-')}-${b.location.toLowerCase()}`,...audit};const scored=scoreLead(lead);return {...lead,...scored,scoreLabel:scoreLabel(scored.score),saved:(await listDbLeads()).some(x=>x.id===lead.id)||memoryLeads.has(lead.id)};}));
 res.json({leads:analyzed,meta:{location,category,limit:max,source:'demo/provider-neutral'}});
});
app.post('/api/analyze',async(req,res)=>{const {lead}=req.body||{};if(!lead)return res.status(400).json({error:'lead is required'});const enriched={...lead,...await analyzeWebsite(lead.website)};const scored=scoreLead(enriched);res.json({...enriched,...scored,scoreLabel:scoreLabel(scored.score)});});
app.post('/api/leads',async(req,res)=>{const lead=req.body;if(!lead?.id)return res.status(400).json({error:'id is required'});const saved={...lead,saved:true};if(await dbEnabled())return res.status(201).json(await upsertLead(saved));memoryLeads.set(lead.id,saved);res.status(201).json(saved);});
app.delete('/api/leads/:id',async(req,res)=>{if(await dbEnabled())await deleteDbLead(req.params.id);memoryLeads.delete(req.params.id);res.status(204).end();});
app.get('/api/export.csv',async(_req,res)=>{const rows=await listDbLeads() || [...memoryLeads.values()];const fields=['name','category','location','website','phone','email','websiteStatus','score','scoreLabel'];const esc=v=>`"${String(v??'').replaceAll('"','""')}"`;const csv=[fields.join(','),...rows.map(row=>fields.map(f=>esc(row[f])).join(','))].join('\n');res.setHeader('Content-Type','text/csv; charset=utf-8');res.setHeader('Content-Disposition','attachment; filename="leadhunter-leads.csv"');res.send(csv);});
const port=process.env.PORT||4000;app.listen(port,()=>console.log(`LeadHunter API running on port ${port}`));
