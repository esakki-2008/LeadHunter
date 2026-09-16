import axios from 'axios';

const NOMINATIM = process.env.NOMINATIM_URL || 'https://nominatim.openstreetmap.org';
const OVERPASS = process.env.OVERPASS_URL || 'https://overpass-api.de/api/interpreter';
const USER_AGENT = process.env.OSM_USER_AGENT || 'LeadHunterAI/0.1 (local business discovery)';

const CATEGORY_FILTERS = {
  restaurant: ['amenity="restaurant"','amenity="cafe"','amenity="fast_food"','amenity="bar"'],
  cafe: ['amenity="cafe"'],
  gym: ['leisure="fitness_centre"','leisure="sports_centre"'],
  fitness: ['leisure="fitness_centre"','leisure="sports_centre"'],
  dental: ['amenity="dentist"'],
  dentist: ['amenity="dentist"'],
  salon: ['shop="hairdresser"','shop="beauty"'],
  hotel: ['tourism="hotel"','tourism="guest_house"'],
  education: ['amenity="school"','amenity="college"','amenity="university"'],
  retail: ['shop'],
  shop: ['shop'],
  pharmacy: ['amenity="pharmacy"'],
  clinic: ['amenity="clinic"','amenity="doctors"'],
  hospital: ['amenity="hospital"']
};

async function geocode(location) {
  const { data } = await axios.get(`${NOMINATIM}/search`, { params:{ q:location, format:'json', limit:1 }, headers:{'User-Agent':USER_AGENT}, timeout:8000 });
  if (!data?.[0]) throw new Error(`Location not found: ${location}`);
  return { lat:Number(data[0].lat), lon:Number(data[0].lon), displayName:data[0].display_name };
}

export async function searchOpenStreetMap({ location, category, limit }) {
  const place = await geocode(location);
  const radius = Number(process.env.OSM_SEARCH_RADIUS_METERS || 7000);
  const key = String(category || '').toLowerCase().trim();
  const filters = CATEGORY_FILTERS[key] || ['amenity','shop','office','craft','tourism','leisure'];
  const clauses = filters.map(filter => `nwr[${filter}](around:${radius},${place.lat},${place.lon});`).join('');
  const query = `[out:json][timeout:25];(${clauses});out center tags;`;
  const { data } = await axios.post(OVERPASS, query, { headers:{'User-Agent':USER_AGENT,'Content-Type':'text/plain'}, timeout:30000 });
  const seen = new Set();
  return (data.elements || []).map((e) => {
    const t=e.tags||{}; const name=t.name; if(!name) return null;
    const dedupe=`${name}|${t['addr:street']||''}|${t['addr:housenumber']||''}`.toLowerCase();
    if(seen.has(dedupe)) return null; seen.add(dedupe);
    const lat=e.lat ?? e.center?.lat, lon=e.lon ?? e.center?.lon;
    return { name, category: category || t.amenity || t.shop || t.tourism || t.leisure || 'business', location: [t['addr:housenumber'],t['addr:street'],t['addr:suburb'],t['addr:city']||place.displayName].filter(Boolean).join(', '), website:t.website||t['contact:website']||'', phone:t.phone||t['contact:phone']||'', email:t.email||t['contact:email']||'', source:'OpenStreetMap', latitude:lat, longitude:lon };
  }).filter(Boolean).slice(0, Math.min(Math.max(Number(limit)||10,1),50));
}
