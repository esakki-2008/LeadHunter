const ACTIVE_STAGES=new Set(['new','contacted','interested','proposal']);
function day(value){return value?String(value).slice(0,10):''}
function addDays(base,days){const d=new Date(`${base}T00:00:00Z`);d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)}
export function buildFollowUpPlan(leads=[],today=new Date()){
 const todayKey=today.toISOString().slice(0,10);
 return leads.filter(l=>ACTIVE_STAGES.has(l.pipelineStatus||'new')).map(lead=>{
  const status=lead.outreachStatus||'not_started';
  let due=day(lead.followUpDate);let action='Review lead';let reason='Keep the lead moving through the pipeline.';
  if(status==='not_started'){action='Prepare outreach';reason='No outreach activity has been started.';if(!due)due=todayKey;}
  else if(status==='drafted'){action='Send outreach';reason='An outreach draft is ready for manual sending.';if(!due)due=todayKey;}
  else if(status==='sent'){action='Check for reply';reason='Outreach was marked sent; review for a response.';if(!due)due=addDays(todayKey,3);}
  else if(status==='follow_up'){action='Send follow-up';reason='The lead is marked for a follow-up touch.';if(!due)due=todayKey;}
  else if(status==='replied'){action='Respond and advance';reason='A reply is recorded; update the pipeline and next step.';if(!due)due=todayKey;}
  const bucket=due<todayKey?'overdue':due===todayKey?'today':'upcoming';
  return {id:lead.id,name:lead.name,category:lead.category||'Business',location:lead.location||'',score:Number(lead.score||0),priorityScore:Number(lead.priorityScore||lead.score||0),pipelineStatus:lead.pipelineStatus||'new',outreachStatus:status,followUpDate:due,action,reason,bucket};
 }).sort((a,b)=>({overdue:0,today:1,upcoming:2}[a.bucket]-({overdue:0,today:1,upcoming:2}[b.bucket])||b.priorityScore-a.priorityScore));
}
