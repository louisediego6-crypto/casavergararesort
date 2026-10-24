

const CV_BOOKING_STORAGE_KEY = "cv_bookings_v1";
const CVR_PENDING_RESERVATION_KEY = "cvr_pending_reservation";

let CVR_SERVER_CATALOG = null;

function cvrCatalogApiBase() {
  const path = window.location.pathname;
  if (path.includes("/pages/admin/")) return "../../api";
  if (path.includes("/pages/")) return "../api";
  return "api";
}

function cvrNormalizeServerRoom(row) {
  return {
    id: row.id,
    title: row.title,
    tagline: row.tagline || "",
    description: row.description || "",
    pricePerNight: Number(row.pricePerNight) || 0,
    currency: "PHP",
    capacity: { min: row.capacity?.min ?? 1, max: row.capacity?.max ?? 1 },
    areaSqm: row.areaSqm ?? null,
    bed: row.bed || "",
    inclusions: Array.isArray(row.inclusions) ? row.inclusions : [],
    addOns: Array.isArray(row.addOns) ? row.addOns : [],
    image: row.image || "../images/booking-photo-1.png",
    standardCheckIn: row.standardCheckIn || "15:00",
    standardCheckOut: row.standardCheckOut || "Anytime (flexible)",
    availabilityNote: row.availabilityNote || "",
    isActive: true,
  };
}

function cvrNormalizeServerEvent(row) {
  return {
    price: Number(row.price) || 0,
    pax: row.pax ?? 0,
    maxPax: row.maxPax != null ? Number(row.maxPax) : undefined,
    extraPaxRate: row.extraPaxRate != null ? Number(row.extraPaxRate) : undefined,
    isActive: true,
    isCustom: Boolean(row.isCustom),
    flatRate: Boolean(row.isFlatRate),
    doubleRateOn24hr: Boolean(row.doubleRateOn24hr),
    image: row.image || "",
    inclusions: Array.isArray(row.inclusions) ? row.inclusions : [],
    motifs: Array.isArray(row.motifs) ? row.motifs : [],
    addOns: Array.isArray(row.addOns) ? row.addOns : [],
  };
}

async function cvrSyncCatalogFromServer() {
  try {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${cvrCatalogApiBase()}/content/packages`, {
      credentials: "same-origin",
      signal: controller.signal,
    });
    window.clearTimeout(timeout);
    if (!res.ok) return;
    const body = await res.json();
    const rooms = body?.data?.rooms;
    const events = body?.data?.events;
    if (!body?.success || !Array.isArray(rooms) || !Array.isArray(events)) return;
    if (rooms.length === 0 && events.length === 0) return;

    const eventsByName = {};
    events.forEach((e) => {
      if (e?.name) eventsByName[e.name] = cvrNormalizeServerEvent(e);
    });

    CVR_SERVER_CATALOG = {
      rooms: rooms.map(cvrNormalizeServerRoom),
      events: eventsByName,
    };
    window.dispatchEvent(new CustomEvent("cvr:catalog-synced"));
  } catch {

  }
}

const CVR_CATALOG_READY = cvrSyncCatalogFromServer();

const PRIVATE_VENUE_FIXED_SCHEDULES = {
  "Private Venue – Morning (8:00 AM–5:00 PM)": {
    checkInTime: "08:00",
    checkOutTime: "17:00",
    label: "8:00 AM – 5:00 PM",
    durationKey: "12hr",
  },
  "Private Venue – Night (7:00 PM–5:00 AM)": {
    checkInTime: "19:00",
    checkOutTime: "05:00",
    label: "7:00 PM – 5:00 AM (next day)",
    durationKey: "12hr",
  },
  "Private Venue – Whole Day (2 Sessions)": {
    checkInTime: "08:00",
    checkOutTime: "05:00",
    label: "8:00 AM – 5:00 AM (next day, 2 sessions)",
    durationKey: "24hr",
  },
};

function getFixedEventSchedule(packageOption) {
  return PRIVATE_VENUE_FIXED_SCHEDULES[packageOption] || null;
}

const EVENT_PACKAGE_CATALOG = {
  "Ayesha Package": {
    price: 7500,
    pax: 50,
    isActive: true,
    inclusions: [
      "2 panels theme backdrop with lights",
      "Celebrant chair",
      "Lighted age number",
      "Name cut-out",
      "Theme character",
      "Happy birthday LED",
      "Entrance balloons",
      "Cake table & souvenir stand",
      "Table centerpieces",
      "Tables and chairs with cover (50 pax)",
    ],
    motifs: [
      { id: "pastel-rainbow", label: "Pastel Rainbow", colors: "Pink · Lavender · Mint" },
      { id: "princess-pink", label: "Princess Pink & Gold", colors: "Blush · Gold · White" },
      { id: "unicorn-dream", label: "Unicorn Dream", colors: "Lavender · Aqua · Silver" },
      { id: "blue-gold", label: "Royal Blue & Gold", colors: "Navy · Gold · Ivory" },
      { id: "custom", label: "Custom motif (describe below)", colors: "Your choice" },
    ],
    addOns: [
      { id: "ay-lights-uplighting", label: "Basic LED uplighting (4 units)", price: 1500, category: "lights" },
      { id: "ay-lights-spotlight", label: "Stage spotlight set (2 units)", price: 3000, category: "lights" },
      { id: "ay-sound-basic", label: "Basic sound system (speaker + mic)", price: 2000, category: "sound" },
      { id: "ay-sound-mic", label: "Wireless microphone (extra unit)", price: 500, category: "sound" },
      { id: "ay-extra-panel", label: "Extra backdrop panel", price: 1500, category: "extra" },
      { id: "ay-balloon-upgrade", label: "Premium balloon arch upgrade", price: 2000, category: "extra" },
      { id: "ay-photo-corner", label: "Photo corner setup", price: 1200, category: "extra" },
      { id: "ay-cake-table-deco", label: "Enhanced cake table décor", price: 800, category: "extra" },
    ],
  },
  "Anica Package": {
    price: 10000,
    pax: 50,
    isActive: true,
    inclusions: [
      "3 panels theme backdrop with lights",
      "Upgraded decorations",
      "Celebrant chair",
      "Lighted age number",
      "Happy birthday LED",
      "Name cut-out",
      "Theme character",
      "Celebrant name standee",
      "Basic ceiling balloons",
      "Entrance arch balloon with garland",
      "Cake stand & souvenir stand",
      "Buffet table setup & centerpieces",
      "Tables and chairs with cover (50 pax)",
    ],
    motifs: [
      { id: "elegant-gold", label: "Elegant Gold & White", colors: "Champagne · Gold · White" },
      { id: "garden-blush", label: "Garden Blush", colors: "Rose · Sage · Cream" },
      { id: "midnight-glam", label: "Midnight Glam", colors: "Black · Silver · Blue" },
      { id: "tropical-fiesta", label: "Tropical Fiesta", colors: "Coral · Teal · Yellow" },
      { id: "custom", label: "Custom motif (describe below)", colors: "Your choice" },
    ],
    addOns: [
      { id: "an-lights-fairy", label: "Fairy light ceiling drape", price: 2500, category: "lights" },
      { id: "an-led-dancefloor", label: "LED dance floor accent", price: 3500, category: "lights" },
      { id: "an-sound-premium", label: "Premium sound system + DJ mixer", price: 5000, category: "sound" },
      { id: "an-ceiling-upgrade", label: "Premium ceiling balloon install", price: 2500, category: "extra" },
      { id: "an-extra-character", label: "Additional theme character", price: 1800, category: "extra" },
      { id: "an-catering-coord", label: "On-site catering coordination", price: 2000, category: "catering" },
    ],
  },
  "Amarah Package": {
    price: 5000,
    pax: 30,
    isActive: true,
    inclusions: [
      "1 panel basic theme backdrop",
      "Celebrant chair",
      "Age number standee",
      "Name cut-out",
      "Theme character",
      "Cake stand",
      "Entrance balloon standee",
      "Table centerpieces",
      "Tables and chairs cover (30 pax)",
    ],
    motifs: [
      { id: "soft-pastel", label: "Soft Pastel", colors: "Peach · Lilac · Sky blue" },
      { id: "classic-red-gold", label: "Classic Red & Gold", colors: "Red · Gold · White" },
      { id: "minimal-white", label: "Minimal White & Greenery", colors: "White · Green · Wood" },
      { id: "custom", label: "Custom motif (describe below)", colors: "Your choice" },
    ],
    addOns: [
      { id: "am-lights-uplighting", label: "Basic LED uplighting (4 units)", price: 1500, category: "lights" },
      { id: "am-sound-basic", label: "Basic sound system (speaker + mic)", price: 2000, category: "sound" },
      { id: "am-extra-panel", label: "Add second backdrop panel", price: 2000, category: "extra" },
      { id: "am-balloon-entrance", label: "Balloon entrance upgrade", price: 1500, category: "extra" },
      { id: "am-dessert-table", label: "Dessert table styling", price: 1000, category: "extra" },
    ],
  },
  "Custom Package": {
    price: 3500,
    pax: 100,
    isCustom: true,
    isActive: true,
    inclusions: [
      "Venue setup crew & basic tables/chairs",
      "On-site event coordinator",
      "Post-event cleanup",
      "Build your own look: pick any lighting, sound, motif, and decor add-ons below",
    ],
    motifs: [
      { id: "pastel-rainbow", label: "Pastel Rainbow", colors: "Pink · Lavender · Mint" },
      { id: "princess-pink", label: "Princess Pink & Gold", colors: "Blush · Gold · White" },
      { id: "unicorn-dream", label: "Unicorn Dream", colors: "Lavender · Aqua · Silver" },
      { id: "blue-gold", label: "Royal Blue & Gold", colors: "Navy · Gold · Ivory" },
      { id: "elegant-gold", label: "Elegant Gold & White", colors: "Champagne · Gold · White" },
      { id: "garden-blush", label: "Garden Blush", colors: "Rose · Sage · Cream" },
      { id: "midnight-glam", label: "Midnight Glam", colors: "Black · Silver · Blue" },
      { id: "tropical-fiesta", label: "Tropical Fiesta", colors: "Coral · Teal · Yellow" },
      { id: "classic-red-gold", label: "Classic Red & Gold", colors: "Red · Gold · White" },
      { id: "minimal-white", label: "Minimal White & Greenery", colors: "White · Green · Wood" },
      { id: "custom", label: "Custom motif (describe below)", colors: "Your choice" },
    ],
    addOns: [

      { id: "cx-lights-uplighting", label: "Basic LED uplighting (4 units)", price: 1500, category: "lights" },
      { id: "cx-lights-fairy", label: "Fairy light ceiling drape", price: 2500, category: "lights" },
      { id: "cx-lights-spotlight", label: "Stage spotlight set (2 units)", price: 3000, category: "lights" },
      { id: "cx-lights-dancefloor", label: "LED dance floor accent", price: 3500, category: "lights" },

      { id: "cx-sound-basic", label: "Basic sound system (speaker + mic)", price: 2000, category: "sound" },
      { id: "cx-sound-premium", label: "Premium sound system + DJ mixer", price: 5000, category: "sound" },
      { id: "cx-sound-mic", label: "Wireless microphone (extra unit)", price: 500, category: "sound" },

      { id: "cx-extra-backdrop-1", label: "Theme backdrop panel (per panel)", price: 1500, category: "extra" },
      { id: "cx-extra-balloon-arch", label: "LED balloon entrance arch", price: 2000, category: "extra" },
      { id: "cx-extra-photo-corner", label: "Photo corner setup", price: 1200, category: "extra" },
      { id: "cx-extra-cake-table", label: "Styled cake & souvenir table", price: 800, category: "extra" },
      { id: "cx-extra-name-cutout", label: "Celebrant name cut-out", price: 700, category: "extra" },
      { id: "cx-extra-age-number", label: "Lighted age number", price: 900, category: "extra" },
      { id: "cx-extra-fog", label: "Fog machine effect", price: 1800, category: "extra" },
      { id: "cx-extra-theme-character", label: "Theme character appearance", price: 1800, category: "extra" },

      { id: "cx-catering-buffet", label: "Buffet-style catering (per pax)", price: 250, category: "catering" },
      { id: "cx-catering-coord", label: "On-site catering coordination", price: 2000, category: "catering" },
    ],
  },

  "Private Venue – Morning (8:00 AM–5:00 PM)": {
    price: 10000,
    pax: 50,
    maxPax: 100,
    extraPaxRate: 1000,
    flatRate: true,
    isActive: true,
    inclusions: [
      "Exclusive private use of the resort, good for 50 pax",
      "1 adult pool & 1 kiddie pool",
      "Function hall, tables & chairs, videoke",
      "2 family rooms, kitchen space, parking space",
      "Add ₱1,000 per person for 51–100 pax",
      "Extended stay: ₱1,000 per additional hour",
      "First come, first served — no down payment, no reservation without payment",
      "Non-refundable once paid",
      "₱1,000–₱2,000 refundable damage/loss deposit required",
      "Electric appliances/gadgets (speakers, lights, photobooth, etc.) may incur a ₱500–₱2,500 power consumption charge",
    ],
    motifs: [
      { id: "priv-tropical-fiesta", label: "Tropical Fiesta", colors: "Turquoise · Coral · Yellow" },
      { id: "priv-simple-elegant", label: "Simple & Elegant White", colors: "White · Silver · Greenery" },
      { id: "priv-rustic-nature", label: "Rustic Nature", colors: "Brown · Green · Beige" },
      { id: "custom", label: "Custom motif (describe below)", colors: "Your choice" },
    ],
    addOns: [
      { id: "priv-sounds-lights", label: "Sounds & lights system", price: 7500, category: "sound" },
      { id: "priv-gas-stove", label: "Gas stove use (per 6 hrs)", price: 400, category: "extra" },
    ],
  },
  "Private Venue – Night (7:00 PM–5:00 AM)": {
    price: 12000,
    pax: 50,
    maxPax: 100,
    extraPaxRate: 1000,
    flatRate: true,
    isActive: true,
    inclusions: [
      "Exclusive private use of the resort, good for 50 pax",
      "1 adult pool & 1 kiddie pool",
      "Function hall, tables & chairs, videoke",
      "2 family rooms, kitchen space, parking space",
      "Add ₱1,000 per person for 51–100 pax",
      "Extended stay: ₱1,000 per additional hour",
      "First come, first served — no down payment, no reservation without payment",
      "Non-refundable once paid",
      "₱1,000–₱2,000 refundable damage/loss deposit required",
      "Electric appliances/gadgets (speakers, lights, photobooth, etc.) may incur a ₱500–₱2,500 power consumption charge",
    ],
    motifs: [
      { id: "priv-tropical-fiesta", label: "Tropical Fiesta", colors: "Turquoise · Coral · Yellow" },
      { id: "priv-simple-elegant", label: "Simple & Elegant White", colors: "White · Silver · Greenery" },
      { id: "priv-rustic-nature", label: "Rustic Nature", colors: "Brown · Green · Beige" },
      { id: "custom", label: "Custom motif (describe below)", colors: "Your choice" },
    ],
    addOns: [
      { id: "priv-sounds-lights-n", label: "Sounds & lights system", price: 7500, category: "sound" },
      { id: "priv-gas-stove-n", label: "Gas stove use (per 6 hrs)", price: 400, category: "extra" },
    ],
  },
  "Private Venue – Whole Day (2 Sessions)": {
    price: 17000,
    pax: 50,
    maxPax: 100,
    extraPaxRate: 1000,
    flatRate: true,
    isActive: true,
    inclusions: [
      "Both morning and night sessions — exclusive private use, good for 50 pax",
      "1 adult pool & 1 kiddie pool",
      "Function hall, tables & chairs, videoke",
      "2 family rooms, kitchen space, parking space",
      "Add ₱1,000 per person for 51–100 pax",
      "Extended stay: ₱1,000 per additional hour",
      "First come, first served — no down payment, no reservation without payment",
      "Non-refundable once paid",
      "₱1,000–₱2,000 refundable damage/loss deposit required",
      "Electric appliances/gadgets (speakers, lights, photobooth, etc.) may incur a ₱500–₱2,500 power consumption charge",
    ],
    motifs: [
      { id: "priv-tropical-fiesta", label: "Tropical Fiesta", colors: "Turquoise · Coral · Yellow" },
      { id: "priv-simple-elegant", label: "Simple & Elegant White", colors: "White · Silver · Greenery" },
      { id: "priv-rustic-nature", label: "Rustic Nature", colors: "Brown · Green · Beige" },
      { id: "custom", label: "Custom motif (describe below)", colors: "Your choice" },
    ],
    addOns: [
      { id: "priv-sounds-lights-2", label: "Sounds & lights system", price: 7500, category: "sound" },
      { id: "priv-gas-stove-2", label: "Gas stove use (per 6 hrs)", price: 400, category: "extra" },
    ],
  },
  "Wedding Package": {
    price: 20000,
    pax: 100,
    flatRate: true,
    isActive: true,
    inclusions: [
      "Good for 100 pax · 10 hours + 3 hours preparation time",
      "Exclusive private use of the resort — pools, function hall, tables & chairs",
      "Extended stay: ₱1,500 per additional hour",
      "First come, first served — no down payment, no reservation without payment",
      "Non-refundable once paid",
      "₱1,000–₱2,000 refundable damage/loss deposit required",
      "Electric appliances/gadgets (speakers, lights, photobooth, etc.) may incur a ₱500–₱2,500 power consumption charge",
    ],
    motifs: [
      { id: "wed-rustic-garden", label: "Rustic Garden Romance", colors: "Sage Green · Ivory · Wood Tones" },
      { id: "wed-classic-white-gold", label: "Classic White & Gold", colors: "White · Gold · Champagne" },
      { id: "wed-blush-garden", label: "Blush Garden Elegance", colors: "Blush Pink · Sage Green · Cream" },
      { id: "wed-tropical-beach", label: "Tropical Beach Elegance", colors: "White · Turquoise · Sandy Beige" },
      { id: "custom", label: "Custom motif (describe below)", colors: "Your choice" },
    ],
    addOns: [
      { id: "wed-sounds-lights", label: "Sounds & lights system", price: 7500, category: "sound" },
      { id: "wed-gowns", label: "Gowns rental (ask front desk for current pricing)", price: 0, category: "extra" },
    ],
  },
  "Debut Package": {
    price: 17000,
    pax: 100,
    flatRate: true,
    isActive: true,
    inclusions: [
      "Good for 100 pax · 10 hours + 3 hours preparation time",
      "Exclusive private use of the resort — pools, function hall, tables & chairs",
      "Extended stay: ₱1,500 per additional hour",
      "First come, first served — no down payment, no reservation without payment",
      "Non-refundable once paid",
      "₱1,000–₱2,000 refundable damage/loss deposit required",
      "Electric appliances/gadgets (speakers, lights, photobooth, etc.) may incur a ₱500–₱2,500 power consumption charge",
    ],
    motifs: [
      { id: "deb-enchanted-garden", label: "Enchanted Garden", colors: "Blush Pink · Sage · Gold" },
      { id: "deb-hollywood-glam", label: "Hollywood Glam", colors: "Black · Gold · Red" },
      { id: "deb-pastel-dream", label: "Pastel Dream", colors: "Lavender · Blush · Silver" },
      { id: "deb-modern-white", label: "Modern Minimalist White", colors: "White · Champagne · Greenery" },
      { id: "custom", label: "Custom motif (describe below)", colors: "Your choice" },
    ],
    addOns: [
      { id: "deb-sounds-lights", label: "Sounds & lights system", price: 7500, category: "sound" },
      { id: "deb-gowns", label: "Gowns rental (ask front desk for current pricing)", price: 0, category: "extra" },
    ],
  },

  "Reunion": {
    price: 10000,
    pax: 50,
    maxPax: 100,
    extraPaxRate: 1000,
    doubleRateOn24hr: true,
    isActive: true,
    inclusions: [
      "Exclusive private use of the resort, good for 50 pax",
      "1 adult pool & 1 kiddie pool",
      "Function hall, tables & chairs, videoke",
      "2 family rooms, kitchen space, parking space",
      "Add ₱1,000 per person for 51–100 pax",
      "Extended stay: ₱1,000 per additional hour",
      "First come, first served — no down payment, no reservation without payment",
      "Non-refundable once paid",
      "₱1,000–₱2,000 refundable damage/loss deposit required",
      "Electric appliances/gadgets (speakers, lights, photobooth, etc.) may incur a ₱500–₱2,500 power consumption charge",
    ],
    motifs: [
      { id: "reu-rustic-family", label: "Rustic Family Gathering", colors: "Brown · Cream · Forest Green" },
      { id: "reu-fiesta-filipiniana", label: "Fiesta Filipiniana", colors: "Red · Yellow · Green" },
      { id: "reu-vintage-nostalgia", label: "Vintage Nostalgia", colors: "Sepia · Ivory · Brass" },
      { id: "reu-tropical-homecoming", label: "Tropical Homecoming", colors: "Coral · Turquoise · White" },
      { id: "reu-garden-picnic", label: "Garden Family Picnic", colors: "Sage Green · Yellow · White" },
      { id: "reu-classic-white", label: "Classic White & Wood", colors: "White · Natural Wood · Greenery" },
      { id: "custom", label: "Custom motif (describe below)", colors: "Your choice" },
    ],
    addOns: [],
  },
  "Team Building": {
    price: 10000,
    pax: 50,
    maxPax: 100,
    extraPaxRate: 1000,
    doubleRateOn24hr: true,
    isActive: true,
    inclusions: [
      "Exclusive private use of the resort, good for 50 pax",
      "1 adult pool & 1 kiddie pool",
      "Function hall, tables & chairs, videoke",
      "2 family rooms, kitchen space, parking space",
      "Add ₱1,000 per person for 51–100 pax",
      "Extended stay: ₱1,000 per additional hour",
      "First come, first served — no down payment, no reservation without payment",
      "Non-refundable once paid",
      "₱1,000–₱2,000 refundable damage/loss deposit required",
      "Electric appliances/gadgets (speakers, lights, photobooth, etc.) may incur a ₱500–₱2,500 power consumption charge",
    ],
    motifs: [
      { id: "team-corporate-blue", label: "Corporate Blue & Silver", colors: "Navy · Silver · White" },
      { id: "team-adventure-outdoor", label: "Adventure Outdoor", colors: "Khaki · Forest Green · Orange" },
      { id: "team-minimalist-modern", label: "Minimalist Modern", colors: "White · Gray · Black" },
      { id: "team-beach-bonding", label: "Beach Bonding", colors: "Turquoise · Sandy Beige · White" },
      { id: "team-energetic-red", label: "Energetic Red & Yellow", colors: "Red · Yellow · White" },
      { id: "team-eco-green", label: "Eco Green Retreat", colors: "Olive · Cream · Wood Tones" },
      { id: "custom", label: "Custom motif (describe below)", colors: "Your choice" },
    ],
    addOns: [],
  },
  "Others": {
    price: 10000,
    pax: 50,
    maxPax: 100,
    extraPaxRate: 1000,
    doubleRateOn24hr: true,
    isActive: true,
    inclusions: [
      "Exclusive private use of the resort, good for 50 pax",
      "1 adult pool & 1 kiddie pool",
      "Function hall, tables & chairs, videoke",
      "2 family rooms, kitchen space, parking space",
      "Add ₱1,000 per person for 51–100 pax",
      "Extended stay: ₱1,000 per additional hour",
      "First come, first served — no down payment, no reservation without payment",
      "Non-refundable once paid",
      "₱1,000–₱2,000 refundable damage/loss deposit required",
      "Electric appliances/gadgets (speakers, lights, photobooth, etc.) may incur a ₱500–₱2,500 power consumption charge",
    ],
    motifs: [
      { id: "oth-pastel-celebration", label: "Pastel Celebration", colors: "Blush Pink · Mint · Lavender" },
      { id: "oth-classic-white-gold", label: "Classic White & Gold", colors: "White · Gold · Champagne" },
      { id: "oth-tropical-paradise", label: "Tropical Paradise", colors: "Turquoise · Coral · Palm Green" },
      { id: "oth-rustic-garden", label: "Rustic Garden", colors: "Sage Green · Ivory · Wood Tones" },
      { id: "oth-vibrant-fiesta", label: "Vibrant Fiesta", colors: "Red · Yellow · Orange" },
      { id: "oth-elegant-black-silver", label: "Elegant Black & Silver", colors: "Black · Silver · White" },
      { id: "oth-baby-soft", label: "Soft Baby Blue & Pink", colors: "Baby Blue · Blush Pink · White" },
      { id: "custom", label: "Custom motif (describe below)", colors: "Your choice" },
    ],
    addOns: [],
  },
};

const ADDON_CATEGORY_META = {
  lights: { label: "Lighting", order: 1 },
  sound: { label: "Sound", order: 2 },
  extra: { label: "Extras & Decor", order: 3 },
  catering: { label: "Catering", order: 4 },
  other: { label: "Other", order: 5 },
};

function getAddOnCategoryMeta(category) {
  return ADDON_CATEGORY_META[category] || ADDON_CATEGORY_META.other;
}

const CVR_EVENT_PACKAGE_PRICES = Object.fromEntries(
  Object.entries(EVENT_PACKAGE_CATALOG).map(([key, pkg]) => [key, pkg.price]).concat([["", 0]])
);

const ROOM_PACKAGE_ADDONS = {
  "standard-room": [
    { id: "std-table", label: "Table (6 pax)", price: 400 },
    { id: "std-long-table", label: "Long table", price: 600 },
    { id: "std-small-cottage", label: "Small cottage", price: 750 },
    { id: "std-big-cottage", label: "Big cottage", price: 1000 },
    { id: "std-gazebo", label: "Gazebo", price: 1200 },
    { id: "std-function-hall", label: "Function hall", price: 1500 },
    { id: "std-videoke", label: "Videoke", price: 500 },
    { id: "std-gas-stove", label: "Gas stove use (per 6 hrs)", price: 400 },
  ],
};

const CVR_EVENT_PACKAGE_STORE_KEY = "cvr_event_package_store_v1";
const CVR_ROOM_PACKAGE_STORE_KEY = "cvr_room_package_store_v1";

function readJsonStore(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" ? { ...fallback, ...parsed } : { ...fallback };
  } catch {
    return { ...fallback };
  }
}

function writeJsonStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {

  }
}

function getEventPackageStore() {
  const store = readJsonStore(CVR_EVENT_PACKAGE_STORE_KEY, { edits: {}, deleted: [] });
  if (!store.edits || typeof store.edits !== "object") store.edits = {};
  if (!Array.isArray(store.deleted)) store.deleted = [];
  return store;
}

function saveEventPackageStore(store) {
  writeJsonStore(CVR_EVENT_PACKAGE_STORE_KEY, store);
}

function getRoomPackageStore() {
  const store = readJsonStore(CVR_ROOM_PACKAGE_STORE_KEY, { edits: {}, deleted: [] });
  if (!store.edits || typeof store.edits !== "object") store.edits = {};
  if (!Array.isArray(store.deleted)) store.deleted = [];
  return store;
}

function saveRoomPackageStore(store) {
  writeJsonStore(CVR_ROOM_PACKAGE_STORE_KEY, store);
}

function slugify(text) {
  return (
    String(text || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "item"
  );
}

function generateAddOnId(prefix, label) {
  return `${prefix}-${slugify(label)}-${Math.random().toString(36).slice(2, 6)}`;
}

function eventPackageKeyExists(key) {
  return getEventPackageKeys().includes(key);
}

function roomPackageIdExists(id) {
  return getRoomPackages().some((p) => p.id === id);
}

function generateRoomPackageId(title) {
  const base = slugify(title);
  const existing = new Set(getRoomPackages().map((p) => p.id));
  let id = base;
  let n = 2;
  while (existing.has(id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  return id;
}

function createEventPackage(data) {
  const key = String(data.name || "").trim();
  if (!key) throw new Error("Package name is required.");
  if (eventPackageKeyExists(key)) throw new Error("A package with this name already exists.");
  const store = getEventPackageStore();
  const { name, ...fields } = data;
  store.edits[key] = { isActive: true, ...fields };
  saveEventPackageStore(store);
  return key;
}

function updateEventPackage(key, data) {
  if (!key) throw new Error("Missing package key.");
  const store = getEventPackageStore();
  const { name, ...fields } = data;
  const base = EVENT_PACKAGE_CATALOG[key] || {};
  store.edits[key] = { ...base, ...store.edits[key], ...fields };
  saveEventPackageStore(store);
  return key;
}

function deleteEventPackage(key) {
  const store = getEventPackageStore();
  if (!store.deleted.includes(key)) store.deleted.push(key);
  saveEventPackageStore(store);
}

function createRoomPackage(data) {
  const title = String(data.title || "").trim();
  if (!title) throw new Error("Package title is required.");
  const id = generateRoomPackageId(title);
  const store = getRoomPackageStore();
  store.edits[id] = {
    isActive: true,
    currency: "PHP",
    image: "../images/booking-photo-1.png",
    standardCheckIn: "15:00",
    standardCheckOut: "Anytime (flexible)",
    ...data,
    title,
  };
  saveRoomPackageStore(store);
  return id;
}

function updateRoomPackage(id, data) {
  if (!id) throw new Error("Missing package id.");
  const store = getRoomPackageStore();
  const base = ROOM_PACKAGES.find((p) => p.id === id) || {};
  store.edits[id] = { ...base, ...store.edits[id], ...data, id };
  saveRoomPackageStore(store);
  return id;
}

function deleteRoomPackage(id) {
  const store = getRoomPackageStore();
  if (!store.deleted.includes(id)) store.deleted.push(id);
  saveRoomPackageStore(store);
}

function getEventPackageCatalog(packageOption) {
  if (CVR_SERVER_CATALOG) {
    const found = CVR_SERVER_CATALOG.events[packageOption];
    return found ? { ...found } : null;
  }
  const store = getEventPackageStore();
  if (store.deleted.includes(packageOption)) return null;
  const base = EVENT_PACKAGE_CATALOG[packageOption] || null;
  const edit = store.edits[packageOption];
  if (!base && !edit) return null;
  return edit ? { ...(base || {}), ...edit } : { ...base };
}

function getEventMotifs(packageOption) {
  const cat = getEventPackageCatalog(packageOption);
  return cat?.motifs || [];
}

function getPackageAddOns(bookingType, packageKey) {
  if (bookingType === "event") {
    return getEventPackageCatalog(packageKey)?.addOns || [];
  }
  const pkg = getRoomPackageById(packageKey);
  if (pkg && Array.isArray(pkg.addOns)) return pkg.addOns;
  return ROOM_PACKAGE_ADDONS[packageKey] || [];
}

function sumSelectedAddOns(addOnCatalog, selectedIds) {
  const ids = Array.isArray(selectedIds) ? selectedIds : [];
  let total = 0;
  const lines = [];
  ids.forEach((id) => {
    const item = addOnCatalog.find((a) => a.id === id);
    if (item) {
      total += Number(item.price) || 0;
      lines.push({ ...item, category: item.category || "other" });
    }
  });
  return { total: Math.round(total * 100) / 100, lines };
}

function calculatePaxSurcharge(pkg, guestCount) {
  const rate = Number(pkg?.extraPaxRate) || 0;
  const baseline = Number(pkg?.pax) || 0;
  if (!rate || !baseline) return null;
  const cap = Number(pkg?.maxPax) || baseline;
  const guests = Math.max(0, Number(guestCount) || 0);
  if (guests <= baseline) return null;
  const extraPax = Math.min(guests, cap) - baseline;
  if (extraPax <= 0) return null;
  const price = Math.round(extraPax * rate * 100) / 100;
  return {
    id: "extra-pax-surcharge",
    label: `Additional guests (${extraPax} × ₱${rate.toLocaleString()}/pax, ${baseline + 1}–${cap} pax)`,
    price,
    category: "extra",
  };
}

function calculateEventTotal(packageOption, selectedAddOnIds = [], guestCount = null) {
  const pkg = getEventPackageCatalog(packageOption) || {};
  const base = pkg.price ?? 0;
  const addOns = sumSelectedAddOns(getPackageAddOns("event", packageOption), selectedAddOnIds);
  const paxSurcharge = calculatePaxSurcharge(pkg, guestCount);
  if (paxSurcharge) {
    addOns.lines = [...addOns.lines, paxSurcharge];
    addOns.total = Math.round((addOns.total + paxSurcharge.price) * 100) / 100;
  }
  const roomSubtotal = Math.round(base * 100) / 100;
  const total = Math.round((roomSubtotal + addOns.total) * 100) / 100;
  return {
    nights: 1,
    roomSubtotal,
    addOnsTotal: addOns.total,
    addOnLines: addOns.lines,
    serviceFee: 0,
    taxes: 0,
    total,
  };
}

function calculateStayTotals(checkInStr, checkOutStr, pricePerNight, selectedAddOnIds = [], packageId = "") {
  if (!checkInStr || !checkOutStr || checkOutStr < checkInStr) return null;
  const nights = countNightsBetween(checkInStr, checkOutStr);

  const dayUse = nights === 0;
  const billableNights = Math.max(1, nights);
  const roomSubtotal = Number(pricePerNight) * billableNights;
  const addOns = sumSelectedAddOns(getPackageAddOns("room", packageId), selectedAddOnIds);
  const subRounded = Math.round(roomSubtotal * 100) / 100;
  const total = Math.round((subRounded + addOns.total) * 100) / 100;
  return {
    nights,
    dayUse,
    billableNights,
    roomSubtotal: subRounded,
    addOnsTotal: addOns.total,
    addOnLines: addOns.lines,
    serviceFee: 0,
    taxes: 0,
    total,
  };
}

function calculateDurationStayTotals(dateStr, durationKey, pricePerNight, selectedAddOnIds = [], packageId = "", nights = null, customCheckInTime = null, customCheckOutTime = null) {
  const dur = window.CVRDuration;
  if (!dur || !dateStr || !dur.get(durationKey)) return null;

  const window_ = dur.buildWindow(dateStr, durationKey, nights, customCheckInTime, customCheckOutTime);
  if (!window_) return null;
  const rate = dur.roomRate(pricePerNight, durationKey, nights);
  const addOns = sumSelectedAddOns(getPackageAddOns("room", packageId), selectedAddOnIds);
  const subRounded = Math.round(rate * 100) / 100;
  const total = Math.round((subRounded + addOns.total) * 100) / 100;
  return {
    durationKey,
    durationLabel: dur.get(durationKey).label,
    ...window_,
    roomSubtotal: subRounded,
    addOnsTotal: addOns.total,
    addOnLines: addOns.lines,
    serviceFee: 0,
    taxes: 0,
    total,
  };
}

const CVR_WHOLE_DAY_KEY = "Private Venue – Whole Day (2 Sessions)";

// Per the printed price sheet, a 24-hour / 2-session private booking is ₱17,000 (not double the morning rate).
function cvrWholeDayRate(pkg) {
  const whole = Number(getEventPackageCatalog(CVR_WHOLE_DAY_KEY)?.price);
  return whole > 0 ? whole : Math.max(0, Number(pkg?.price) || 0) * 2;
}

function calculateDurationEventTotal(dateStr, durationKey, packageOption, selectedAddOnIds = [], customCheckInTime = null, nights = null, customCheckOutTime = null, guestCount = null) {
  const dur = window.CVRDuration;
  if (!dur || !dateStr || !dur.get(durationKey)) return null;

  const fixedSchedule = getFixedEventSchedule(packageOption);
  const window_ = fixedSchedule
    ? dur.buildFixedWindow(dateStr, fixedSchedule.checkInTime, fixedSchedule.checkOutTime, fixedSchedule.label)
    : dur.buildWindow(dateStr, durationKey, nights, customCheckInTime, customCheckOutTime);
  if (!window_) return null;
  const pkg = getEventPackageCatalog(packageOption);
  const basePrice = pkg?.price ?? 0;

  const rate = pkg?.flatRate
    ? Math.max(0, Number(basePrice) || 0)
    : pkg?.doubleRateOn24hr && durationKey === "24hr"
    ? cvrWholeDayRate(pkg)
    : dur.eventRate(basePrice, durationKey, nights);
  const addOns = sumSelectedAddOns(getPackageAddOns("event", packageOption), selectedAddOnIds);
  const paxSurcharge = calculatePaxSurcharge(pkg, guestCount);
  if (paxSurcharge) {
    addOns.lines = [...addOns.lines, paxSurcharge];
    addOns.total = Math.round((addOns.total + paxSurcharge.price) * 100) / 100;
  }
  const subRounded = Math.round(rate * 100) / 100;
  const total = Math.round((subRounded + addOns.total) * 100) / 100;
  return {
    durationKey,
    durationLabel: fixedSchedule ? fixedSchedule.label : dur.get(durationKey).label,
    ...window_,
    roomSubtotal: subRounded,
    addOnsTotal: addOns.total,
    addOnLines: addOns.lines,
    serviceFee: 0,
    taxes: 0,
    total,
  };
}

const DOWNPAYMENT_PERCENT = 50;

function computeDownpayment(totalNumeric, percent = DOWNPAYMENT_PERCENT) {
  const total = Number(totalNumeric) || 0;
  const pct = Math.min(100, Math.max(0, Number(percent) || 0));
  const downpayment = Math.round(total * (pct / 100) * 100) / 100;
  const balance = Math.round((total - downpayment) * 100) / 100;
  return { percent: pct, downpayment, balance, total };
}

const ROOM_PACKAGES = [
  {
    id: "standard-room",
    title: "Standard Room",
    isActive: true,
    tagline: "Good for 2 pax",
    description:
      "Casa Vergara's standard room, good for 2 guests. Rates: ₱250 for 3 hours, ₱800 for 12 hours, ₱1,400 for 24 hours.",
    pricePerNight: 1400,
    currency: "PHP",
    capacity: { min: 1, max: 2 },
    areaSqm: null,
    bed: "1 Double Bed",
    inclusions: ["Good for 2 pax", "Parking space", "Access to the adult & kiddie pools"],
    image: "../images/booking-photo-4.png",
    standardCheckIn: "flexible",
    standardCheckOut: "flexible",
    availabilityNote:
      "Public day-use entrance is ₱150/head (morning) or ₱180/head (night). First come, first served. Non-refundable. A ₱1,000–₱2,000 refundable deposit is required for damages or losses.",
  },
];

const CVR_PACKAGE_STATUS_KEY = "cvr_package_status_v1";

function getPackageStatusOverrides() {
  try {
    const raw = localStorage.getItem(CVR_PACKAGE_STATUS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function setPackageActive(bookingType, key, isActive) {
  const overrides = getPackageStatusOverrides();
  overrides[`${bookingType}:${key}`] = Boolean(isActive);
  try {
    localStorage.setItem(CVR_PACKAGE_STATUS_KEY, JSON.stringify(overrides));
  } catch {

  }
  return overrides;
}

function isPackageActive(bookingType, key, defaultActive = true) {
  const overrides = getPackageStatusOverrides();
  const override = overrides[`${bookingType}:${key}`];
  return typeof override === "boolean" ? override : defaultActive;
}

const CVR_ROOM_PACKAGE_ORDER_KEY = "cvr_room_package_order_v1";
const CVR_EVENT_PACKAGE_ORDER_KEY = "cvr_event_package_order_v1";

function readOrderList(key) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeOrderList(key, ids) {
  try {
    localStorage.setItem(key, JSON.stringify(ids));
  } catch {

  }
}

function applyStoredOrder(ids, orderKey) {
  const order = readOrderList(orderKey);
  if (!order.length) return ids;
  const rank = new Map(order.map((id, i) => [id, i]));
  return ids
    .map((id, i) => ({ id, i, r: rank.has(id) ? rank.get(id) : order.length + i }))
    .sort((a, b) => a.r - b.r || a.i - b.i)
    .map((x) => x.id);
}

function setRoomPackageOrder(orderedIds) {
  if (CVR_SERVER_CATALOG) return;
  writeOrderList(CVR_ROOM_PACKAGE_ORDER_KEY, orderedIds);
}

function setEventPackageOrder(orderedKeys) {
  if (CVR_SERVER_CATALOG) return;
  writeOrderList(CVR_EVENT_PACKAGE_ORDER_KEY, orderedKeys);
}

function getRoomPackages({ activeOnly = false } = {}) {
  if (CVR_SERVER_CATALOG) return CVR_SERVER_CATALOG.rooms.map((r) => ({ ...r }));
  const store = getRoomPackageStore();
  const builtinIds = ROOM_PACKAGES.map((p) => p.id);
  const customIds = Object.keys(store.edits).filter((id) => !builtinIds.includes(id));
  let ids = [...builtinIds, ...customIds].filter((id) => !store.deleted.includes(id));
  ids = applyStoredOrder(ids, CVR_ROOM_PACKAGE_ORDER_KEY);
  const list = ids.map((id) => getRoomPackageById(id)).filter(Boolean);
  return activeOnly ? list.filter((p) => p.isActive) : list;
}

function getRoomPackageById(id) {
  if (CVR_SERVER_CATALOG) {
    const found = CVR_SERVER_CATALOG.rooms.find((r) => r.id === id);
    return found ? { ...found } : null;
  }
  const store = getRoomPackageStore();
  if (store.deleted.includes(id)) return null;
  const base = ROOM_PACKAGES.find((p) => p.id === id) || null;
  const edit = store.edits[id];
  if (!base && !edit) return null;
  const merged = edit ? { ...(base || {}), ...edit, id } : { ...base };
  merged.isActive = isPackageActive("room", id, merged.isActive !== false);
  return merged;
}

function getEventPackageKeys({ activeOnly = false } = {}) {
  if (CVR_SERVER_CATALOG) return Object.keys(CVR_SERVER_CATALOG.events);
  const store = getEventPackageStore();
  const builtinKeys = Object.keys(EVENT_PACKAGE_CATALOG).filter((k) => k !== "");
  const customKeys = Object.keys(store.edits).filter((k) => !builtinKeys.includes(k));
  let keys = [...builtinKeys, ...customKeys].filter((k) => !store.deleted.includes(k));
  keys = applyStoredOrder(keys, CVR_EVENT_PACKAGE_ORDER_KEY);
  if (!activeOnly) return keys;
  return keys.filter((key) => {
    const pkg = getEventPackageCatalog(key);
    return pkg && isPackageActive("event", key, pkg.isActive !== false);
  });
}

function isEventPackageActive(key) {
  if (CVR_SERVER_CATALOG) return Boolean(CVR_SERVER_CATALOG.events[key]);
  const pkg = getEventPackageCatalog(key);
  if (!pkg) return false;
  return isPackageActive("event", key, pkg.isActive !== false);
}

function formatMoney(amount, currency = "USD") {
  const n = Number(amount);
  if (Number.isNaN(n)) return "—";
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
}

function countNightsBetween(checkInStr, checkOutStr) {
  if (!checkInStr || !checkOutStr) return 0;
  const start = new Date(`${checkInStr}T12:00:00`);
  const end = new Date(`${checkOutStr}T12:00:00`);
  const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

function calculateStayTotalsLegacy(checkInStr, checkOutStr, pricePerNight) {
  return calculateStayTotals(checkInStr, checkOutStr, pricePerNight, [], "");
}

function calculateEventTotalLegacy(packageOption) {
  return calculateEventTotal(packageOption, []);
}

function setPendingReservation(payload) {
  try {
    sessionStorage.setItem(CVR_PENDING_RESERVATION_KEY, JSON.stringify(payload));
  } catch {

  }
}

function getPendingReservation() {
  try {
    const raw = sessionStorage.getItem(CVR_PENDING_RESERVATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function clearPendingReservation() {
  try {
    sessionStorage.removeItem(CVR_PENDING_RESERVATION_KEY);
  } catch {

  }
}

function cvLoadBookings() {
  try {
    const raw = localStorage.getItem(CV_BOOKING_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function cvSaveBookings(bookings) {
  localStorage.setItem(CV_BOOKING_STORAGE_KEY, JSON.stringify(bookings));
}

function cvCreateId() {
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `BK-${stamp}-${rand}`.toUpperCase();
}

function cvAddBooking(payload) {
  const bookings = cvLoadBookings();
  const booking = {
    id: cvCreateId(),
    status: "Pending",
    createdAt: new Date().toISOString(),
    ...payload,
  };
  bookings.unshift(booking);
  cvSaveBookings(bookings);
  return booking;
}

function cvUpdateBookingStatus(id, status) {
  const bookings = cvLoadBookings();
  const next = bookings.map((item) => (item.id === id ? { ...item, status } : item));
  cvSaveBookings(next);
  return next.find((item) => item.id === id) || null;
}

window.CVBookingDB = {
  loadBookings: cvLoadBookings,
  addBooking: cvAddBooking,
  updateBookingStatus: cvUpdateBookingStatus,
};

function createQuotationLineId() {
  return `ql-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function recalculateQuotationTotals(lines) {
  const active = (lines || []).filter((line) => line.approved !== false);
  const sumType = (type) =>
    active.filter((line) => line.type === type).reduce((sum, line) => sum + (Number(line.amount) || 0), 0);
  const packageTotal = sumType("package");
  const addonTotal = sumType("addon");
  const specialTotal = active
    .filter((line) => line.type === "special" || line.type === "custom")
    .reduce((sum, line) => sum + (Number(line.amount) || 0), 0);
  const totalNumeric = Math.round((packageTotal + addonTotal + specialTotal) * 100) / 100;
  return {
    subtotalPackage: packageTotal,
    subtotalAddOns: addonTotal,
    subtotalSpecial: specialTotal,
    totalNumeric,
  };
}

function cvrScheduleDescription(reservation) {
  if (!reservation) return "";
  const inLabel = reservation.checkInLabel || "";
  const outLabel = reservation.checkOutLabel || "";
  const durLabel = reservation.durationLabel || window.CVRDuration?.get(reservation.durationKey)?.label || "";
  if (!inLabel && !outLabel && !durLabel) return "";
  const parts = [];
  if (durLabel) parts.push(durLabel);
  if (inLabel) parts.push(`Check-in ${inLabel}${reservation.customCheckInTime ? " (your requested arrival time)" : ""}`);
  if (outLabel) parts.push(`Check-out ${outLabel} (fixed)`);
  return parts.join(" · ");
}

function buildQuotationFromReservation(reservation) {
  const lines = [];
  const currency = reservation.currency || "PHP";

  if (reservation.bookingType === "room") {
    const nights = reservation.nights || 1;
    const unit = nights > 0 ? (Number(reservation.roomSubtotal) || 0) / nights : Number(reservation.roomSubtotal) || 0;
    lines.push({
      id: createQuotationLineId(),
      type: "package",
      label: `${reservation.roomName || "Room package"} (${nights} night${nights !== 1 ? "s" : ""})`,
      description: cvrScheduleDescription(reservation),
      qty: nights,
      unitPrice: Math.round(unit * 100) / 100,
      amount: Number(reservation.roomSubtotal) || 0,
      approved: true,
      source: "catalog",
    });
  } else {
    lines.push({
      id: createQuotationLineId(),
      type: "package",
      label: reservation.packageOption || reservation.roomName || "Event package",
      description: cvrScheduleDescription(reservation),
      qty: 1,
      unitPrice: Number(reservation.roomSubtotal) || 0,
      amount: Number(reservation.roomSubtotal) || 0,
      approved: true,
      source: "catalog",
    });
  }

  (reservation.addOnLines || []).forEach((addon) => {
    lines.push({
      id: createQuotationLineId(),
      type: "addon",
      label: addon.label,
      qty: 1,
      unitPrice: Number(addon.price) || 0,
      amount: Number(addon.price) || 0,
      approved: true,
      source: "client",
      catalogId: addon.id,
    });
  });

  const specialText = (reservation.specialRequests || reservation.eventNotes || "").trim();
  if (specialText) {
    lines.push({
      id: createQuotationLineId(),
      type: "special",
      label: "Special requests & additional services",
      description: specialText,
      qty: 1,
      unitPrice: 0,
      amount: 0,
      approved: false,
      source: "client",
    });
  }

  const totals = recalculateQuotationTotals(lines);
  const needsAdminReview = lines.some((line) => line.type === "special" && !line.approved);

  return {
    status: needsAdminReview ? "Pending Admin Review" : "Approved",
    lines,
    ...totals,
    totalAmount: formatMoney(totals.totalNumeric, currency),
    currency,
    adminNotes: "",
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    approvedAt: needsAdminReview ? null : new Date().toISOString(),
    acceptedAt: null,
  };
}

function applyQuotationToReservation(reservation, quotation) {
  if (!reservation || !quotation) return reservation;
  const cat = window.CVRBookingCatalog;
  const currency = quotation.currency || reservation.currency || "PHP";
  const approvedAddOns = (quotation.lines || []).filter((line) => line.type === "addon" && line.approved !== false);
  reservation.quotation = quotation;
  reservation.roomSubtotal = quotation.subtotalPackage;
  reservation.addOnsTotal = quotation.subtotalAddOns;
  reservation.addOnLines = approvedAddOns.map((line) => ({
    id: line.catalogId || line.id,
    label: line.label,
    price: line.amount,
  }));
  reservation.selectedAddOns = approvedAddOns.map((line) => line.catalogId || line.id);
  reservation.totalNumeric = quotation.totalNumeric;
  reservation.totalAmount = cat ? cat.formatMoney(quotation.totalNumeric, currency) : String(quotation.totalNumeric);
  reservation.currency = currency;

  const dp = computeDownpayment(quotation.totalNumeric);
  reservation.downpaymentPercent = dp.percent;
  reservation.downpaymentAmount = dp.downpayment;
  reservation.balanceAmount = dp.balance;
  reservation.downpaymentAmountFormatted = cat ? cat.formatMoney(dp.downpayment, currency) : String(dp.downpayment);
  reservation.balanceAmountFormatted = cat ? cat.formatMoney(dp.balance, currency) : String(dp.balance);
  quotation.downpaymentPercent = dp.percent;
  quotation.downpaymentAmount = dp.downpayment;
  quotation.balanceAmount = dp.balance;

  return reservation;
}

window.CVRQuotation = {
  createQuotationLineId,
  recalculateQuotationTotals,
  buildQuotationFromReservation,
  applyQuotationToReservation,
};

window.CVRBookingCatalog = {
  ROOM_PACKAGES,
  EVENT_PACKAGE_CATALOG,
  ROOM_PACKAGE_ADDONS,
  getRoomPackages,
  getRoomPackageById,
  getEventPackageCatalog,
  getFixedEventSchedule,
  getEventMotifs,
  getPackageAddOns,
  sumSelectedAddOns,
  formatMoney,
  countNightsBetween,
  calculateStayTotals,
  calculateEventTotal,
  calculateDurationStayTotals,
  calculateDurationEventTotal,
  calculatePaxSurcharge,
  cvrWholeDayRate,
  setPendingReservation,
  getPendingReservation,
  clearPendingReservation,
  CVR_EVENT_PACKAGE_PRICES,
  getAddOnCategoryMeta,
  isPackageActive,
  setPackageActive,
  getPackageStatusOverrides,
  getEventPackageKeys,
  isEventPackageActive,
  DOWNPAYMENT_PERCENT,
  computeDownpayment,
  createEventPackage,
  updateEventPackage,
  deleteEventPackage,
  createRoomPackage,
  updateRoomPackage,
  deleteRoomPackage,
  setRoomPackageOrder,
  setEventPackageOrder,
  eventPackageKeyExists,
  roomPackageIdExists,
  generateAddOnId,
  catalogReady: CVR_CATALOG_READY,
  isServerCatalogLoaded: () => Boolean(CVR_SERVER_CATALOG),
};
