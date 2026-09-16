import axios from 'axios';

const EMAIL_RE=/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_RE=/(?:\+?\d[\d\s().-]{7,}\d)/g;
const SOCIAL_RE=/(?:https?:\/\/)?(?:www\.)?(?:linkedin\.com|instagram\.com|facebook\.com|x\.com|twitter\.com)\/[^\s"'<>]+/gi;

function clean(value=''){return String(value).replace(/\s+/g,' ').trim()}
function stripHtml(html=''){return html.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ')}
function absoluteUrl(base,href){try{return new URL(href,base).href}catch{return ''}}
function unique(values){return [...new Set(values.map(clean).filter(Boolean))]}
function extract(html,base){
 const text=stripHtml(html);
 const emails=unique((text.match(EMAIL_RE)||[]).map(x=>x.toLowerCase()).filter(x=>!x.includes('example.com')&&!x.includes('example.org')&&!x.includes('example.net')));
 const phones=unique((text.match(PHONE_RE)||[]).map(x=>x.replace(/\s+/g,' ').trim())).slice(0,5);
 const social=unique((html.match(SOCIAL_RE)||[]).map(x=>absoluteUrl(base,x))).slice(0,5);
 const links=[...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)].map(m=>({url:absoluteUrl(base,m[1]),text:clean(stripHtml(m[2]))}));
 const contactLink=links.find(l=>/(contact|about|team|staff|owner|founder|appointment|book|enquir|inquiry)/i.test(`${l.text} ${l.url}`));
 const title=(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||'').replace(/\s+/g,' ').trim();
 return {emails,phones,social,contactPage:contactLink?.url||'',title}
}

export async function enrichBusinessContact(lead){
 const website=lead?.website;
 if(!website)return {contactEmail:lead?.email||'',contactPhone:lead?.phone||'',contactSource:lead?.email||lead?.phone?'business listing':'',contactConfidence:lead?.email||lead?.phone?'medium':'none',contactPage:''};
 const target=/^https?:\/\//i.test(website)?website:`https://${website}`;
 const pages=[target];
 try{
  const home=await axios.get(target,{timeout:7000,maxRedirects:5,validateStatus:()=>true,headers:{'User-Agent':'LeadHunterAI/0.3 contact discovery'}});
  const homeHtml=typeof home.data==='string'?home.data:'';
  const first=extract(homeHtml,target);
  if(first.contactPage&&!pages.includes(first.contactPage))pages.push(first.contactPage);
  for(const page of pages.slice(0,2)){
   const html=page===target?homeHtml:(await axios.get(page,{timeout:6000,maxRedirects:5,validateStatus:()=>true,headers:{'User-Agent':'LeadHunterAI/0.3 contact discovery'}})).data;
   const data=extract(typeof html==='string'?html:'',page);
   const email=data.emails[0]||first.emails?.[0]||lead.email||'';
   const phone=data.phones[0]||first.phones?.[0]||lead.phone||'';
   if(email||phone)return {contactEmail:email,contactPhone:phone,contactSource:'public website',contactConfidence:data.contactPage||page!==target?'high':'medium',contactPage:data.contactPage||first.contactPage||page};
  }
 }catch{}
 return {contactEmail:lead.email||'',contactPhone:lead.phone||'',contactSource:lead.email||lead.phone?'business listing':'',contactConfidence:lead.email||lead.phone?'medium':'none',contactPage:''};
}
