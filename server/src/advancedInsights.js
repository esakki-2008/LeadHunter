const SERVICE_MAP={
 restaurant:'Website + online ordering + local SEO',cafe:'Website + online ordering + local SEO',bakery:'Website + online ordering + local SEO',
 gym:'Website + lead capture + membership enquiry',fitness:'Website + lead capture + membership enquiry',
 dentist:'Website + appointment booking + local SEO',doctor:'Website + appointment booking + local SEO',clinic:'Website + appointment booking + local SEO',
 salon:'Website + appointment booking + WhatsApp enquiry',spa:'Website + appointment booking + WhatsApp enquiry',
 hotel:'Website + direct booking + enquiry funnel',education:'Website + enquiry funnel + lead capture',school:'Website + enquiry funnel + lead capture',
 realestate:'Website + property lead funnel + enquiry capture'
};
function categoryKey(category=''){const c=category.toLowerCase();return Object.keys(SERVICE_MAP).find(k=>c.includes(k))||'default'}
export function buildAdvancedInsight(lead={}){
 const score=Number(lead.score||0),priority=Number(lead.priorityScore||score),seo=Number(lead.seoScore||0);
 const gaps=[];
 if(!lead.website)gaps.push('No dedicated website');else{if(!lead.https)gaps.push('HTTPS not detected');if(!lead.mobileFriendlySignal)gaps.push('Mobile viewport not detected');if(seo<60)gaps.push(`SEO signals at ${seo}%`);if(!lead.hasContactLink)gaps.push('No obvious conversion/contact path');}
 if(!(lead.contactEmail||lead.email))gaps.push('No public email');if(!(lead.contactPhone||lead.phone))gaps.push('No public phone');
 const key=categoryKey(lead.category),service=SERVICE_MAP[key]||'Modern business website + lead capture';
 const urgency=priority>=85?'Immediate review':priority>=70?'High attention':priority>=40?'Worth nurturing':'Low attention';
 const action=lead.nextAction||{type:'review',label:'Review lead',reason:'Review the latest lead signals.'};
 return {businessName:lead.name||'Business',opportunityScore:score,priorityScore:priority,urgency,service,categoryMatch:key,gaps:gaps.slice(0,8),nextAction:action,conversionSignals:{hasWebsite:Boolean(lead.website),seoScore:seo,hasContactPath:Boolean(lead.hasContactLink),hasEmail:Boolean(lead.contactEmail||lead.email),hasPhone:Boolean(lead.contactPhone||lead.phone)},generatedAt:new Date().toISOString()};
}
export function buildAdvancedInsights(leads=[]){return leads.map(buildAdvancedInsight).sort((a,b)=>b.priorityScore-a.priorityScore)}
