const STAGES=['new','contacted','interested','proposal','won','lost'];

function dateKey(value){
  if(!value)return '';
  return String(value).slice(0,10);
}

export function buildDashboard(leads=[],today=new Date()){
  const todayKey=today.toISOString().slice(0,10);
  const stageCounts=Object.fromEntries(STAGES.map(stage=>[stage,0]));
  let highOpportunity=0,noWebsite=0,withEmail=0,withPhone=0,enriched=0,overdue=0,dueToday=0,upcoming=0,won=0,lost=0,contacted=0;
  const followUps=[];

  for(const lead of leads){
    const stage=STAGES.includes(lead.pipelineStatus)?lead.pipelineStatus:'new';
    stageCounts[stage]++;
    if(Number(lead.score||0)>=70)highOpportunity++;
    if(!lead.website)noWebsite++;
    if(lead.contactEmail||lead.email)withEmail++;
    if(lead.contactPhone||lead.phone)withPhone++;
    if(lead.contactName||lead.contactEmail||lead.contactPhone)enriched++;
    if(stage==='won')won++;
    if(stage==='lost')lost++;
    if(stage==='contacted')contacted++;

    const followUp=dateKey(lead.followUpDate);
    if(followUp && !['won','lost'].includes(stage)){
      const item={id:lead.id,name:lead.name,category:lead.category||'Business',location:lead.location||'',followUpDate:followUp,pipelineStatus:stage,score:Number(lead.score||0)};
      if(followUp<todayKey){overdue++;followUps.push({...item,bucket:'overdue'});}
      else if(followUp===todayKey){dueToday++;followUps.push({...item,bucket:'today'});}
      else {upcoming++;followUps.push({...item,bucket:'upcoming'});}
    }
  }

  followUps.sort((a,b)=>a.followUpDate.localeCompare(b.followUpDate)||b.score-a.score);
  const total=leads.length;
  return {
    totals:{total,highOpportunity,noWebsite,withEmail,withPhone,enriched,won,lost,contacted},
    pipeline:stageCounts,
    followUps:{overdue,dueToday,upcoming,items:followUps.slice(0,50)},
    coverage:{emailPercent:total?Math.round(withEmail/total*100):0,phonePercent:total?Math.round(withPhone/total*100):0,enrichmentPercent:total?Math.round(enriched/total*100):0},
    generatedAt:new Date().toISOString()
  };
}
