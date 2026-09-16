const STAGE_PENALTY={new:0,contacted:4,interested:8,proposal:12,won:-25,lost:-25};
export function prioritizeLeads(leads=[]){return [...leads].map(lead=>{const score=Number(lead.score||0);const stage=lead.pipelineStatus||'new';const reasons=[];let priority=score;
 if(!lead.website){priority+=12;reasons.push('No website');}
 if(lead.contactEmail||lead.email)priority+=5;else reasons.push('No public email');
 if(lead.contactPhone||lead.phone)priority+=3;else reasons.push('No public phone');
 if(lead.recommendedService)priority+=4;
 if(lead.followUpDate&&stage!=='won'&&stage!=='lost'){const today=new Date().toISOString().slice(0,10);if(String(lead.followUpDate).slice(0,10)<=today){priority+=15;reasons.push(String(lead.followUpDate).slice(0,10)<today?'Follow-up overdue':'Follow-up due today');}}
 priority+=STAGE_PENALTY[stage]||0;
 return {...lead,priorityScore:Math.max(0,Math.min(100,priority)),priorityReasons:reasons.slice(0,4)};}).sort((a,b)=>b.priorityScore-a.priorityScore||Number(b.score||0)-Number(a.score||0));}
