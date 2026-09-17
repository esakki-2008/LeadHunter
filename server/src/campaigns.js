const CHANNELS=new Set(['email','whatsapp']);

function recipientFor(lead,channel){return channel==='email'?(lead.contactEmail||lead.email||''):(lead.contactPhone||lead.phone||'')}
function messageFor(lead,channel){
 const name=lead.name||'your business';
 const service=lead.recommendedService||'a modern website and lead capture';
 const gap=lead.website?'a few opportunities in the current web presence':'the opportunity to build a stronger online presence';
 if(channel==='whatsapp')return `Hi, I came across ${name} while looking at local businesses in ${lead.location||'the area'}. I noticed ${gap}. I help local businesses with ${service}. If you'd like, I can send a quick example and proposal. Thanks!`;
 return `Hi,\n\nI came across ${name} while researching local businesses in ${lead.location||'the area'}. I noticed ${gap}. I help local businesses with ${service}.\n\nIf you'd like, I can send a quick example and a simple proposal.\n\nThanks,\nEsakki`;
}

export function buildCampaign(leads=[],{channel='email',selectedIds=[]}={}){
 if(!CHANNELS.has(channel))throw new Error('Unsupported outreach channel.');
 const selected=selectedIds.length?leads.filter(l=>selectedIds.includes(l.id)):leads;
 return selected.map(lead=>({id:lead.id,name:lead.name,channel,recipient:recipientFor(lead,channel),subject:`Quick idea for ${lead.name||'your business'}`,message:lead.outreachMessage||messageFor(lead,channel),ready:Boolean(recipientFor(lead,channel)),status:lead.outreachStatus||'not_started'}));
}

export function campaignSummary(items=[]){return {total:items.length,ready:items.filter(x=>x.ready).length,blocked:items.filter(x=>!x.ready).length,sent:items.filter(x=>x.status==='sent').length,drafted:items.filter(x=>x.status==='drafted').length};}
