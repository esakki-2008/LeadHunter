const SERVICE_BY_CATEGORY={
 restaurant:'Website + online ordering',cafe:'Website + online ordering',bakery:'Website + online ordering',gym:'Website + lead capture',fitness:'Website + lead capture',dentist:'Website + appointment booking',doctor:'Website + appointment booking',clinic:'Website + appointment booking',salon:'Website + booking system',spa:'Website + booking system',hotel:'Website + direct booking',education:'Website + enquiry funnel',school:'Website + enquiry funnel',college:'Website + enquiry funnel',realestate:'Website + property lead funnel'
};
function categoryKey(category=''){return Object.keys(SERVICE_BY_CATEGORY).find(k=>category.toLowerCase().includes(k))||'default'}
export function generateLeadIntelligence(lead={}){
 const category=String(lead.category||'business').trim();const key=categoryKey(category);const service=SERVICE_BY_CATEGORY[key]||'Modern business website + lead capture';
 const pain=[];const reasons=Array.isArray(lead.reasons)?lead.reasons:[];
 if(!lead.website) pain.push('No website presence detected');
 if(lead.website&&!lead.https) pain.push('Website is not using HTTPS');
 if(lead.website&&lead.mobileFriendlySignal===false) pain.push('Mobile-friendly signal was not detected');
 if(lead.website&&Number(lead.seoScore||0)<60) pain.push('Website has SEO gaps');
 if(lead.website&&Number(lead.pageLoadMs||0)>3000) pain.push('Website response time is slow');
 if(!lead.email&&!lead.contactEmail) pain.push('No public email was detected');
 if(!lead.phone&&!lead.contactPhone) pain.push('No public phone was detected');
 if(!pain.length) pain.push(...reasons.slice(0,2));
 const location=lead.location||'your area';
 const angle=!lead.website?`A simple, mobile-first website could help ${lead.name||'this business'} turn local searches in ${location} into enquiries.`:`The existing web presence has visible opportunities that could be improved to make ${lead.name||'the business'} easier to discover and convert visitors.`;
 const greeting=lead.contactName?`Hi ${lead.contactName},`:`Hi ${lead.name||'there'},`;
 const message=`${greeting}\n\nI came across ${lead.name||'your business'} while researching ${category.toLowerCase()} businesses in ${location}. ${angle} I can help with ${service.toLowerCase()} and a focused conversion/SEO refresh.\n\nIf useful, I can share a quick mockup and a few specific improvements I noticed.\n\nBest,\nEsakki`;
 return {recommendedService:service,salesAngle:angle,painPoints:[...new Set(pain)].slice(0,5),outreachMessage:message,intelligenceGeneratedAt:new Date().toISOString()};
}
