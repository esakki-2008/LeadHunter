export function scoreLead(lead) {
  let score = 0;
  const reasons = [];
  if (!lead.website) { score += 35; reasons.push('No website detected'); }
  else {
    if (!lead.https) { score += 12; reasons.push('Website is not using HTTPS'); }
    if (lead.websiteStatus !== 'ok') { score += 18; reasons.push('Website is unreachable or unhealthy'); }
    if (lead.websiteStatus === 'ok' && !lead.mobileFriendlySignal) { score += 8; reasons.push('Mobile optimization could not be confirmed'); }
    if (lead.websiteStatus === 'ok' && lead.pageLoadMs > 3000) { score += 8; reasons.push('Slow initial response'); }
  }
  if (!lead.email) { score += 8; reasons.push('No public email found'); }
  if (!lead.phone) { score += 5; reasons.push('No public phone found'); }
  if (lead.category) { score += 4; }
  return { score: Math.min(100, score), reasons };
}

export function scoreLabel(score) {
  if (score >= 70) return 'High opportunity';
  if (score >= 40) return 'Medium opportunity';
  return 'Low opportunity';
}
