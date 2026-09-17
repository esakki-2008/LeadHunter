import axios from 'axios';

const NOMINATIM = process.env.NOMINATIM_URL || 'https://nominatim.openstreetmap.org';
const OVERPASS_URLS = [
  process.env.OVERPASS_URL,
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter'
].filter((value,index,array)=>value && array.indexOf(value)===index);
const USER_AGENT = process.env.OSM_USER_AGENT || 'LeadHunterAI/0.1 (local business discovery)';

const CATEGORY_FILTERS = {
  restaurant: ['amenity="restaurant"','amenity="fast_food"'], cafe: ['amenity="cafe"'], bakery: ['shop="bakery"'],
  gym: ['leisure="fitness_centre"'], fitness: ['leisure="fitness_centre"'], dental: ['amenity="dentist"'], dentist: ['amenity="dentist"'],
  doctor: ['amenity="doctors"'], clinic: ['amenity="clinic"','amenity="doctors"'], salon: ['shop="hairdresser"','shop="beauty"'],
  spa: ['leisure="spa"'], hotel: ['tourism="hotel"','tourism="guest_house"'], education: ['amenity="school"','amenity="college"','amenity="university"'],
  school: ['amenity="school"'], college: ['amenity="college"'], retail: ['shop'], shop: ['shop'], pharmacy: ['amenity="pharmacy"'], hospital: ['amenity="hospital"']
};
const CATEGORY_ALIASES = {
  restaurants:'restaurant',restaurant:'restaurant',cafes:'cafe',cafe:'cafe',bakeries:'bakery',bakery:'bakery',gyms:'gym',gym:'gym',fitness:'fitness',
  dentists:'dentist',dentist:'dentist',dental:'dental',doctors:'doctor',doctor:'doctor',clinics:'clinic',clinic:'clinic',salons:'salon',salon:'salon',
  spas:'spa',spa:'spa',hotels:'hotel',hotel:'hotel',schools:'school',school:'school',colleges:'college',college:'college',education:'education',
  pharmacies:'pharmacy',pharmacy:'pharmacy',hospitals:'hospital',hospital:'hospital',shops:'shop',shop:'shop',retail:'retail'
};
function normalizeCategory(category='') { const key=String(category||'').toLowerCase().trim().replace(/\s+/g,'_'); return CATEGORY_ALIASES[key] || key; }

async function geocode(location) {
  const { data } = await axios.get(`${NOMINATIM}/search`, { params:{q:location,format:'json',limit:1}, headers:{'User-Agent':USER_AGENT,'Accept-Language':'en'}, timeout:10000 });
  if (!data?.[0]) throw new Error(`Location not found: ${location}`);
  return {lat:Number(data[0].lat),lon:Number(data[0].lon),displayName:data[0].display_name};
}

async function queryOverpass(query) {
  let lastError;
  for (const endpoint of OVERPASS_URLS) {
    try {
      const {data} = await axios.post(endpoint, query, {headers:{'User-Agent':USER_AGENT,'Content-Type':'text/plain','Accept':'application/json'},timeout:45000,maxContentLength:10*1024*1024});
      return data;
    } catch (error) {
      lastError=error;
    }
  }
  throw new Error(`All OpenStreetMap Overpass servers failed${lastError?.message?`: ${lastError.message}`:''}`);
}

export async function searchOpenStreetMap({location,category,limit}) {
  const place=await geocode(location);
  const radius=Math.min(Math.max(Number(process.env.OSM_SEARCH_RADIUS_METERS)||7000,1000),15000);
  const key=normalizeCategory(category);
  if (category && !CATEGORY_FILTERS[key]) throw new Error(`Unsupported business category: ${category}`);
  const filters=CATEGORY_FILTERS[key] || ['amenity','shop','office','craft','tourism','leisure'];
  const clauses=filters.map(filter=>`nwr[${filter}](around:${radius},${place.lat},${place.lon});`).join('');
  const query=`[out:json][timeout:40];(${clauses});out center tags;`;
  const data=await queryOverpass(query);
  const seen=new Set();
  return (data.elements||[]).map(e=>{
    const t=e.tags||{},name=t.name;if(!name)return null;
    const dedupe=`${name}|${t['addr:street']||''}|${t['addr:housenumber']||''}`.toLowerCase();
    if(seen.has(dedupe))return null;seen.add(dedupe);
    const lat=e.lat??e.center?.lat,lon=e.lon??e.center?.lon;
    return {name,category:key||t.amenity||t.shop||t.tourism||t.leisure||'business',location:[t['addr:housenumber'],t['addr:street'],t['addr:suburb'],t['addr:city']||place.displayName].filter(Boolean).join(', '),website:t.website||t['contact:website']||'',phone:t.phone||t['contact:phone']||'',email:t.email||t['contact:email']||'',source:'OpenStreetMap',latitude:lat,longitude:lon};
  }).filter(Boolean).slice(0,Math.min(Math.max(Number(limit)||10,1),50));
}
