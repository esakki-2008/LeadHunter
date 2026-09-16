import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { scoreLead, scoreLabel } from './scoring.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const savedLeads = new Map();
const sampleBusinesses = [
  { name:'Local Cafe', category:'Cafe', location:'Dombivli', website:'https://example.com', phone:'+91 90000 00001', email:'' },
  { name:'Shree Dental Care', category:'Dentist', location:'Dombivli', website:'', phone:'+91 90000 00002', email:'hello@example.com' },
  { name:'Prime Fitness Studio', category:'Gym', location:'Dombivli', website:'https://example.org', phone:'+91 90000 00003', email:'' },
  { name:'Urban Spice Restaurant', category:'Restaurant', location:'Dombivli', website:'', phone:'+91 90000 00004', email:'' },
  { name:'Bright Minds Academy', category:'Education', location:'Dombivli', website:'https://example.net', phone:'+91 90000 00005', email:'' }
];

function normalizeUrl(url) { return /^https?:\/\//i.test(url) ? url : `https://${url}`; }

async function analyzeWebsite(url) {
  if (!url) return { websiteStatus:'missing', https:false, pageLoadMs:null, mobileFriendlySignal:false, title:'' };
  const target = normalizeUrl(url);
  const started = Date.now();
  try {
    const response = await axios.get(target, { timeout:7000, maxRedirects:5, validateStatus:() => true, headers:{'User-Agent':'LeadHunterAI/0.1 website audit'} });
    const html = typeof response.data === 'string' ? response.data : '';
    const viewport = /<meta[^>]+name=["']viewport["']/i.test(html);
    const title = (html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || '').trim().slice(0,160);
    return { websiteStatus: response.status >= 200 && response.status < 400 ? 'ok' : 'error', https:target.startsWith('https://'), pageLoadMs:Date.now()-started, mobileFriendlySignal:viewport, title };
  } catch (error) {
    return { websiteStatus:'unreachable', https:target.startsWith('https://'), pageLoadMs:Date.now()-started, mobileFriendlySignal:false, title:'', error:'Request failed safely' };
  }
}

app.get('/api/health', (_req,res) => res.json({ ok:true, service:'LeadHunter API' }));

app.get('/api/leads', (_req,res) => res.json([...savedLeads.values()]));

app.post('/api/search', async (req,res) => {
  const { location='', category='', limit=10 } = req.body || {};
  const max = Math.min(Math.max(Number(limit) || 10, 1), 50);
  // Provider-neutral MVP: use supplied demo records until a compliant places/search provider is configured.
  const matches = sampleBusinesses.filter(b => (!location || b.location.toLowerCase().includes(location.toLowerCase())) && (!category || b.category.toLowerCase().includes(category.toLowerCase()))).slice(0,max);
  const analyzed = await Promise.all(matches.map(async b => {
    const audit = await analyzeWebsite(b.website);
    const lead = { ...b, id: `${b.name.toLowerCase().replace(/[^a-z0-9]+/g,'-')}-${b.location.toLowerCase()}`, ...audit };
    const scored = scoreLead(lead);
    return { ...lead, ...scored, scoreLabel:scoreLabel(scored.score), saved:savedLeads.has(lead.id) };
  }));
  res.json({ leads:analyzed, meta:{location,category,limit:max, source:'demo/provider-neutral', message:'Connect a compliant business-data provider to replace the built-in sample source.'} });
});

app.post('/api/analyze', async (req,res) => {
  const { lead } = req.body || {};
  if (!lead) return res.status(400).json({ error:'lead is required' });
  const audit = await analyzeWebsite(lead.website);
  const enriched = { ...lead, ...audit };
  const scored = scoreLead(enriched);
  res.json({ ...enriched, ...scored, scoreLabel:scoreLabel(scored.score) });
});

app.post('/api/leads', (req,res) => {
  const lead = req.body;
  if (!lead?.id) return res.status(400).json({ error:'id is required' });
  savedLeads.set(lead.id, { ...lead, saved:true });
  res.status(201).json(savedLeads.get(lead.id));
});

app.delete('/api/leads/:id', (req,res) => { savedLeads.delete(req.params.id); res.status(204).end(); });

app.get('/api/export.csv', (_req,res) => {
  const fields=['name','category','location','website','phone','email','websiteStatus','score','scoreLabel'];
  const esc=v => `"${String(v ?? '').replaceAll('"','""')}"`;
  const csv=[fields.join(','), ...savedLeads.values()].map(row => fields.map(f=>esc(row[f])).join(',')).join('\n');
  res.setHeader('Content-Type','text/csv; charset=utf-8');
  res.setHeader('Content-Disposition','attachment; filename="leadhunter-leads.csv"');
  res.send(csv);
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`LeadHunter API running on http://localhost:${port}`));
