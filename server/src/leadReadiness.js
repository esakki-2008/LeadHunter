const ACTIVE_STAGES=new Set(['new','contacted','interested','proposal']);
export function buildLeadReadiness(lead={}){
 const score=Number(lead.score||0),priority=Number(lead.priorityScore||score);
 const email=lead.contactEmail||lead.email||'',phone=lead.contactPhone||lead.phone||'';
 const checks=[
  {key:'contact',label:'Public contact',ok:Boolean(email||phone)},
  {key:'website',label:'Website audited',ok:Boolean(lead.websiteStatus)},
  {key:'intelligence',label:'Lead intelligence',ok:Boolean(lead.recommendedService||lead.salesAngle)},
  {key:'message',label:'Outreach message',ok:Boolean(lead.outreachMessage||lead.outreachLastMessage)}
 ];
 const completed=checks.filter(x=>x.ok).length;
 const stage=lead.pipelineStatus||'new';
 const blockedReason=!email&&!phone?'No public email or phone':!ACTIVE_STAGES.has(stage)?`Pipeline stage is ${stage}`:'';
 return {id:lead.id,name:lead.name||'Business',score,priorityScore:priority,pipelineStatus:stage,outreachStatus:lead.outreachStatus||'not_started',email:email||'',phone:phone||'',ready:completed===checks.length&&!blockedReason,completion:Math.round(completed/checks.length*100),checks,blockedReason};
}
export function buildReadinessSummary(leads=[]){const items=leads.map(buildLeadReadiness);return {total:items.length,ready:items.filter(x=>x.ready).length,blocked:items.filter(x=>!x.ready).length,averageCompletion:items.length?Math.round(items.reduce((n,x)=>n+x.completion,0)/items.length):0,items:items.sort((a,b)=>b.priorityScore-a.priorityScore)}}
