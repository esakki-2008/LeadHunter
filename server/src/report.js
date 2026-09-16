function clean(value=''){return String(value||'').trim()}

export function buildLeadReport(lead={}){
  const score=Number(lead.score||0);
  const priority=Number(lead.priorityScore||score);
  const audit=[];
  if(!lead.website)audit.push('No dedicated website detected.');
  else {
    if(lead.websiteStatus&&lead.websiteStatus!=='ok')audit.push('Website availability needs attention.');
    if(lead.https===false)audit.push('HTTPS is not detected.');
    if(lead.mobileFriendlySignal===false)audit.push('Mobile viewport signal is not detected.');
    if(Number(lead.seoScore||0)<60)audit.push(`SEO signals are currently at ${Number(lead.seoScore||0)}%.`);
    if(lead.hasContactLink===false)audit.push('No obvious contact or booking path was detected.');
  }
  const strengths=[];
  if(lead.contactEmail||lead.email)strengths.push('Public email available');
  if(lead.contactPhone||lead.phone)strengths.push('Public phone available');
  if(lead.website&&lead.https)strengths.push('HTTPS detected');
  if(lead.mobileFriendlySignal)strengths.push('Mobile viewport detected');
  const painPoints=Array.isArray(lead.painPoints)?lead.painPoints:[];
  return {
    title:`Lead Report — ${clean(lead.name)||'Business'}`,
    generatedAt:new Date().toISOString(),
    summary:{businessName:clean(lead.name),category:clean(lead.category)||'Business',location:clean(lead.location),opportunityScore:score,priorityScore:priority,scoreLabel:clean(lead.scoreLabel)||'Opportunity'},
    websiteAudit:{status:lead.websiteStatus||'unknown',url:clean(lead.website),https:Boolean(lead.https),seoScore:Number(lead.seoScore||0),pageLoadMs:lead.pageLoadMs??null,mobileFriendly:Boolean(lead.mobileFriendlySignal),issues:audit.length?audit:['No major audit issues detected.']},
    contact:{name:clean(lead.contactName),role:clean(lead.contactRole),email:clean(lead.contactEmail||lead.email),phone:clean(lead.contactPhone||lead.phone),source:clean(lead.contactSource),confidence:clean(lead.contactConfidence),page:clean(lead.contactPage)},
    opportunity:{recommendedService:clean(lead.recommendedService)||'Modern business website + lead capture',salesAngle:clean(lead.salesAngle)||'Improve the online journey from discovery to enquiry.',painPoints,priorityReasons:Array.isArray(lead.priorityReasons)?lead.priorityReasons:[]},
    outreach:{message:clean(lead.outreachMessage||lead.outreachLastMessage),status:clean(lead.outreachStatus)||'not_started',channel:clean(lead.outreachChannel)},
    signals:{strengths,auditFindings:audit}
  };
}
