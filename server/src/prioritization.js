const STAGE_PENALTY={new:0,contacted:4,interested:8,proposal:12,won:-25,lost:-25};
function nextAction(lead,stage,today){
 if(stage==='won')return {type:'maintain',label:'Maintain relationship',reason:'Lead is marked won.'};
 if(stage==='lost')return {type:'review',label:'Review later',reason:'Lead is marked lost.'};
 if(lead.followUpDate){const d=String(lead.followUpDate).slice(0,10);if(d<today)return {type:'follow_up',label:'Follow up now',reason:'Follow-up date is overdue.'};if(d===today)return {type:'follow_up',label:'Follow up today',reason:'Follow-up is due today.'};}
 const email=lead.contactEmail||lead.email;const phone=lead.contactPhone||lead.phone;
 if(!email&&!phone)return {type:'enrich',label:'Enrich contact details',reason:'No public email or phone is available.'};
 if(!lead.outreachStatus||lead.outreachStatus==='not_started')return {type:'draft',label:'Prepare outreach',reason:'A public contact is available and outreach has not started.'};
 if(lead.outreachStatus==='drafted')return {type:'send',label:'Send outreach',reason:'An outreach draft is ready for manual sending.'};
 if(lead.outreachStatus==='sent')return {type:'wait',label:'Watch for reply',reason:'Outreach was marked sent; check for a response.'};
 if(lead.outreachStatus==='follow_up')return {type:'follow_up',label:'Send follow-up',reason:'Lead is marked for outreach follow-up.'};
 return {type:'review',label:'Review lead',reason:'Review the latest lead activity.'};
}
export function prioritizeLeads(leads=[]){const today=new Date().toISOString().slice(0,10);return [...leads].map(lead=>{const score=Number(lead.score||0);const stage=lead.pipelineStatus||'new';const reasons=[];let priority=score;if(!lead.website){priority+=12;reasons.push('No website');}if(lead.contactEmail||lead.email)priority+=5;else reasons.push('No public email');if(lead.contactPhone||lead.phone)priority+=3;else reasons.push('No public phone');if(lead.recommendedService)priority+=4;if(lead.followUpDate&&stage!=='won'&&stage!=='lost'){const d=String(lead.followUpDate).slice(0,10);if(d<=today){priority+=15;reasons.push(d<today?'Follow-up overdue':'Follow-up due today');}}priority+=STAGE_PENALTY[stage]||0;const action=nextAction(lead,stage,today);return {...lead,priorityScore:Math.max(0,Math.min(100,priority)),priorityReasons:reasons.slice(0,4),nextAction:action};}).sort((a,b)=>b.priorityScore-a.priorityScore||Number(b.score||0)-Number(a.score||0));}
