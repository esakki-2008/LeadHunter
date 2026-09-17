const ACTIVE=new Set(['new','contacted','interested','proposal']);
function addDays(base,days){const d=new Date(`${base}T00:00:00Z`);d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)}
function day(v){return v?String(v).slice(0,10):''}

export function buildFollowUpSequence(lead={},today=new Date()){
 const status=lead.outreachStatus||'not_started';
 const stage=lead.pipelineStatus||'new';
 if(!ACTIVE.has(stage)||status==='replied'||stage==='won'||stage==='lost')return [];
 const todayKey=today.toISOString().slice(0,10);
 const base=day(lead.followUpDate)||todayKey;
 const steps=[];
 if(status==='not_started')steps.push({step:1,type:'initial',channel:'email',dueDate:base,action:'Prepare and send initial outreach'});
 else if(status==='drafted')steps.push({step:1,type:'initial',channel:lead.outreachChannel||'email',dueDate:base,action:'Send the drafted outreach'});
 else if(status==='sent'){
  steps.push({step:1,type:'check_reply',channel:lead.outreachChannel||'email',dueDate:base,action:'Check for a reply'});
  steps.push({step:2,type:'follow_up_1',channel:lead.outreachChannel||'email',dueDate:addDays(base,3),action:'Send first follow-up if no reply'});
  steps.push({step:3,type:'follow_up_2',channel:lead.outreachChannel||'email',dueDate:addDays(base,7),action:'Send second follow-up if no reply'});
 }
 else if(status==='follow_up'){
  steps.push({step:1,type:'follow_up_1',channel:lead.outreachChannel||'email',dueDate:base,action:'Send first follow-up'});
  steps.push({step:2,type:'follow_up_2',channel:lead.outreachChannel||'email',dueDate:addDays(base,4),action:'Send second follow-up if no reply'});
 }
 return steps.map(x=>({...x,id:lead.id,name:lead.name,overdue:x.dueDate<todayKey,today:x.dueDate===todayKey}));
}
