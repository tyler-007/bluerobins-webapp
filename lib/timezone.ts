// Map of timezone regions to country codes
const timezoneToCountry: Record<string, string> = {
  // North America
  "America/New_York": "US",
  "America/Los_Angeles": "US",
  "America/Chicago": "US",
  "America/Denver": "US",
  "America/Phoenix": "US",
  "America/Anchorage": "US",
  "America/Adak": "US",
  "America/Honolulu": "US",
  "America/Detroit": "US",
  "America/Indiana/Indianapolis": "US",
  "America/Kentucky/Louisville": "US",
  "America/Boise": "US",
  "America/Juneau": "US",
  "America/Sitka": "US",
  "America/Toronto": "CA",
  "America/Vancouver": "CA",
  "America/Montreal": "CA",
  "America/Edmonton": "CA",
  "America/Winnipeg": "CA",
  "America/Halifax": "CA",
  "America/St_Johns": "CA",
  "America/Whitehorse": "CA",
  "America/Yellowknife": "CA",
  "America/Mexico_City": "MX",
  "America/Tijuana": "MX",
  "America/Monterrey": "MX",
  "America/Merida": "MX",
  "America/Matamoros": "MX",
  "America/Cancun": "MX",
  "America/Hermosillo": "MX",
  "America/Chihuahua": "MX",
  "America/Ojinaga": "MX",
  "America/Mazatlan": "MX",
  "America/Bahia_Banderas": "MX",

  // Europe
  "Europe/London": "GB",
  "Europe/Paris": "FR",
  "Europe/Berlin": "DE",
  "Europe/Madrid": "ES",
  "Europe/Rome": "IT",
  "Europe/Amsterdam": "NL",
  "Europe/Brussels": "BE",
  "Europe/Vienna": "AT",
  "Europe/Zurich": "CH",
  "Europe/Stockholm": "SE",
  "Europe/Oslo": "NO",
  "Europe/Copenhagen": "DK",
  "Europe/Helsinki": "FI",
  "Europe/Warsaw": "PL",
  "Europe/Prague": "CZ",
  "Europe/Budapest": "HU",
  "Europe/Athens": "GR",
  "Europe/Istanbul": "TR",
  "Europe/Moscow": "RU",
  "Europe/Dublin": "IE",
  "Europe/Lisbon": "PT",
  "Europe/Bucharest": "RO",
  "Europe/Sofia": "BG",
  "Europe/Belgrade": "RS",
  "Europe/Zagreb": "HR",
  "Europe/Sarajevo": "BA",
  "Europe/Skopje": "MK",
  "Europe/Tallinn": "EE",
  "Europe/Riga": "LV",
  "Europe/Vilnius": "LT",
  "Europe/Kiev": "UA",
  "Europe/Minsk": "BY",
  "Europe/Kaliningrad": "RU",
  "Europe/Samara": "RU",
  "Europe/Volgograd": "RU",
  "Europe/Astrakhan": "RU",
  "Europe/Ulyanovsk": "RU",

  // Asia
  "Asia/Tokyo": "JP",
  "Asia/Shanghai": "CN",
  "Asia/Singapore": "SG",
  "Asia/Hong_Kong": "HK",
  "Asia/Seoul": "KR",
  "Asia/Bangkok": "TH",
  "Asia/Kuala_Lumpur": "MY",
  "Asia/Manila": "PH",
  "Asia/Jakarta": "ID",
  "Asia/Ho_Chi_Minh": "VN",
  "Asia/New_Delhi": "IN",
  "Asia/Kolkata": "IN",
  "Asia/Dubai": "AE",
  "Asia/Riyadh": "SA",
  "Asia/Tehran": "IR",
  "Asia/Baghdad": "IQ",
  "Asia/Beirut": "LB",
  "Asia/Amman": "JO",
  "Asia/Jerusalem": "IL",
  "Asia/Gaza": "PS",
  "Asia/Hebron": "PS",
  "Asia/Damascus": "SY",
  "Asia/Aden": "YE",
  "Asia/Kuwait": "KW",
  "Asia/Bahrain": "BH",
  "Asia/Qatar": "QA",
  "Asia/Muscat": "OM",
  "Asia/Karachi": "PK",
  "Asia/Colombo": "LK",
  "Asia/Kathmandu": "NP",
  "Asia/Thimphu": "BT",
  "Asia/Dhaka": "BD",
  "Asia/Yangon": "MM",
  "Asia/Phnom_Penh": "KH",
  "Asia/Vientiane": "LA",
  "Asia/Brunei": "BN",
  "Asia/Makassar": "ID",
  "Asia/Jayapura": "ID",
  "Asia/Pontianak": "ID",
  "Asia/Ulaanbaatar": "MN",
  "Asia/Choibalsan": "MN",
  "Asia/Hovd": "MN",
  "Asia/Almaty": "KZ",
  "Asia/Aqtobe": "KZ",
  "Asia/Aqtau": "KZ",
  "Asia/Oral": "KZ",
  "Asia/Bishkek": "KG",
  "Asia/Tashkent": "UZ",
  "Asia/Samarkand": "UZ",
  "Asia/Ashgabat": "TM",
  "Asia/Dushanbe": "TJ",
  "Asia/Baku": "AZ",
  "Asia/Yerevan": "AM",
  "Asia/Tbilisi": "GE",

  // Oceania
  "Australia/Sydney": "AU",
  "Australia/Melbourne": "AU",
  "Australia/Brisbane": "AU",
  "Australia/Perth": "AU",
  "Australia/Adelaide": "AU",
  "Australia/Darwin": "AU",
  "Australia/Hobart": "AU",
  "Australia/Lord_Howe": "AU",
  "Australia/Eucla": "AU",
  "Pacific/Auckland": "NZ",
  "Pacific/Chatham": "NZ",
  "Pacific/Fiji": "FJ",
  "Pacific/Guam": "GU",
  "Pacific/Port_Moresby": "PG",
  "Pacific/Noumea": "NC",
  "Pacific/Palau": "PW",
  "Pacific/Port_Vila": "VU",
  "Pacific/Saipan": "MP",
  "Pacific/Tahiti": "PF",
  "Pacific/Tarawa": "KI",
  "Pacific/Tongatapu": "TO",
  "Pacific/Wake": "UM",
  "Pacific/Wallis": "WF",

  // South America
  "America/Sao_Paulo": "BR",
  "America/Argentina/Buenos_Aires": "AR",
  "America/Santiago": "CL",
  "America/Lima": "PE",
  "America/Bogota": "CO",
  "America/Caracas": "VE",
  "America/La_Paz": "BO",
  "America/Asuncion": "PY",
  "America/Montevideo": "UY",
  "America/Paramaribo": "SR",
  "America/Cayenne": "GF",
  "America/Guyana": "GY",
  "America/Guayaquil": "EC",
  "America/Manaus": "BR",
  "America/Belem": "BR",
  "America/Fortaleza": "BR",
  "America/Recife": "BR",
  "America/Noronha": "BR",
  "America/Araguaina": "BR",
  "America/Maceio": "BR",
  "America/Bahia": "BR",
  "America/Campo_Grande": "BR",
  "America/Cuiaba": "BR",
  "America/Porto_Velho": "BR",
  "America/Boa_Vista": "BR",
  "America/Rio_Branco": "BR",

  // Africa
  "Africa/Cairo": "EG",
  "Africa/Johannesburg": "ZA",
  "Africa/Lagos": "NG",
  "Africa/Nairobi": "KE",
  "Africa/Casablanca": "MA",
  "Africa/Tunis": "TN",
  "Africa/Abidjan": "CI",
  "Africa/Accra": "GH",
  "Africa/Addis_Ababa": "ET",
  "Africa/Algiers": "DZ",
  "Africa/Asmara": "ER",
  "Africa/Bamako": "ML",
  "Africa/Bangui": "CF",
  "Africa/Banjul": "GM",
  "Africa/Bissau": "GW",
  "Africa/Blantyre": "MW",
  "Africa/Brazzaville": "CG",
  "Africa/Bujumbura": "BI",
  "Africa/Cape_Town": "ZA",
  "Africa/Douala": "CM",
  "Africa/Djibouti": "DJ",
  "Africa/Gaborone": "BW",
  "Africa/Harare": "ZW",
  "Africa/Kampala": "UG",
  "Africa/Khartoum": "SD",
  "Africa/Kigali": "RW",
  "Africa/Kinshasa": "CD",
  "Africa/Libreville": "GA",
  "Africa/Lome": "TG",
  "Africa/Luanda": "AO",
  "Africa/Lubumbashi": "CD",
  "Africa/Lusaka": "ZM",
  "Africa/Malabo": "GQ",
  "Africa/Maputo": "MZ",
  "Africa/Maseru": "LS",
  "Africa/Mbabane": "SZ",
  "Africa/Mogadishu": "SO",
  "Africa/Monrovia": "LR",
  "Africa/Ndjamena": "TD",
  "Africa/Niamey": "NE",
  "Africa/Nouakchott": "MR",
  "Africa/Ouagadougou": "BF",
  "Africa/Porto-Novo": "BJ",
  "Africa/Sao_Tome": "ST",
  "Africa/Tripoli": "LY",
  "Africa/Windhoek": "NA",
  "Africa/Yaounde": "CM",
  "Africa/Zanzibar": "TZ",
};

/**
 * Get the country code based on the user's timezone
 * @returns {string} Two-letter country code (ISO 3166-1 alpha-2)
 */
export function getCountryFromTimezone(): string {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return timezoneToCountry[timezone] || "US"; // Default to US if timezone not found
  } catch (error) {
    console.error("Error getting timezone:", error);
    return "US"; // Default to US if there's an error
  }
}

/**
 * Get the country code based on a specific timezone
 * @param {string} timezone - The timezone to get the country for
 * @returns {string} Two-letter country code (ISO 3166-1 alpha-2)
 */
export function getCountryFromSpecificTimezone(timezone: string): string {
  return timezoneToCountry[timezone] || "US";
}

export async function getCountry(): Promise<string> {
  try {
    // Try IP geolocation first
    const ipCountry = await getCountryFromIP();
    if (ipCountry) return ipCountry;

    // Try browser geolocation if IP fails
    try {
      const geoCountry = await getCountryFromGeolocation();
      if (geoCountry) return geoCountry;
    } catch (error) {
      console.log("Geolocation failed:", error);
    }

    // Fallback to browser language
    return getCountryFromBrowser();
  } catch (error) {
    console.error("Error getting country:", error);
    return "US"; // Final fallback
  }
}

function getCountryFromGeolocation(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Use reverse geocoding to get country from coordinates
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
          );
          const data = await response.json();
          resolve(data.address.country_code.toUpperCase());
        } catch (error) {
          reject(error);
        }
      },
      (error) => reject(error)
    );
  });
}

// Using a service like ipapi.co, ipstack.com, or MaxMind
async function getCountryFromIP() {
  try {
    const response = await fetch("https://ipapi.co/json/");
    const data = await response.json();
    return data.country_code; // Returns ISO 3166-1 alpha-2 code
  } catch (error) {
    console.error("Error getting country from IP:", error);
    return "US"; // Fallback
  }
}

/**
 * Get the country code from the browser's language/region setting.
 * Example: "en-US" => "US", "fr-CA" => "CA"
 */
export function getCountryFromBrowser(): string {
  if (typeof navigator !== "undefined") {
    const locale =
      navigator.language || (navigator.languages && navigator.languages[0]);
    if (locale && locale.includes("-")) {
      return locale.split("-")[1].toUpperCase();
    }
  }
  return "US"; // Fallback
}
