import axios from 'axios';

function clean(v=''){return String(v||'').trim()}

export function messagingStatus(){
  return {
    email:{provider:process.env.EMAIL_PROVIDER||'resend',configured:Boolean(process.env.RESEND_API_KEY&&process.env.OUTREACH_FROM_EMAIL)},
    whatsapp:{provider:'whatsapp-cloud-api',configured:Boolean(process.env.WHATSAPP_ACCESS_TOKEN&&process.env.WHATSAPP_PHONE_NUMBER_ID)}
  };
}

export async function sendEmail({to,subject,text}){
  if(!process.env.RESEND_API_KEY||!process.env.OUTREACH_FROM_EMAIL)throw new Error('Email sending is not configured. Set RESEND_API_KEY and OUTREACH_FROM_EMAIL.');
  if(!clean(to))throw new Error('Lead has no public email address.');
  const r=await axios.post('https://api.resend.com/emails',{from:process.env.OUTREACH_FROM_EMAIL,to:[clean(to)],subject:clean(subject)||'Quick idea for your business',text:clean(text)},{headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`},timeout:10000});
  return {provider:'resend',messageId:r.data?.id||'',status:'sent'};
}

export async function sendWhatsApp({to,text}){
  if(!process.env.WHATSAPP_ACCESS_TOKEN||!process.env.WHATSAPP_PHONE_NUMBER_ID)throw new Error('WhatsApp sending is not configured. Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID.');
  const phone=clean(to).replace(/[^0-9]/g,'');
  if(!phone)throw new Error('Lead has no public phone number.');
  const url=`https://graph.facebook.com/v23.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const r=await axios.post(url,{messaging_product:'whatsapp',to:phone,type:'text',text:{preview_url:false,body:clean(text)}},{headers:{Authorization:`Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`},timeout:10000});
  return {provider:'whatsapp-cloud-api',messageId:r.data?.messages?.[0]?.id||'',status:'sent'};
}
