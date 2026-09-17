export function scoreLead(lead) {
  let score = 0;
  const reasons = [];
  const hasEmail = Boolean(lead.contactEmail || lead.email);
  const hasPhone = Boolean(lead.contactPhone || lead.phone);

  if (!lead.website) {
    score += 35;
    reasons.push('No website detected');
  } else {
    if (!lead.https) { score += 12; reasons.push('Website is not using HTTPS'); }
    if (lead.websiteStatus !== 'ok') { score += 18; reasons.push('Website is unreachable or unhealthy'); }
    if (lead.websiteStatus === 'ok' && !lead.mobileFriendlySignal) { score += 8; reasons.push('Mobile optimization could not be confirmed'); }
    if (lead.websiteStatus === 'ok' && lead.pageLoadMs > 3000) { score += 8; reasons.push('Slow initial response'); }
    if (lead.websiteStatus === 'ok' && lead.seoScore < 60) { score += 8; reasons.push('SEO fundamentals need improvement'); }
    if (lead.websiteStatus === 'ok' && lead.h1Count === 0) { score += 4; reasons.push('Missing H1 heading'); }
    if (lead.websiteStatus === 'ok' && lead.imagesMissingAlt > 0) { score += 3; reasons.push('Images need alt text'); }
    if (lead.websiteStatus === 'ok' && !lead.hasContactLink) { score += 4; reasons.push('No obvious contact or booking path'); }
    if (lead.websiteStatus === 'ok' && !lead.hasSocialLinks) { score += 2; reasons.push('Social links not detected'); }
  }

  if (!hasEmail) { score += 8; reasons.push('No public email found'); }
  if (!hasPhone) { score += 5; reasons.push('No public phone found'); }

  // A real, category-matched business is more useful than an unclassified map result.
  if (lead.category) score += 4;
  if (lead.name) score += 2;
  if (lead.location) score += 1;

  // Strong public contact signals make a lead more actionable, while still preserving
  // opportunity score for businesses with no website.
  if (hasEmail && hasPhone) score += 3;

  return { score: Math.min(100, score), reasons: reasons.slice(0, 8) };
}

export function scoreLabel(score) {
  if (score >= 70) return 'High opportunity';
  if (score >= 40) return 'Medium opportunity';
  return 'Low opportunity';
}
