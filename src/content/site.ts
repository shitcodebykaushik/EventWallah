export const site = {
  name: "EventWallah",
  tagline: "Every campus event, one simple pass.",
  edition: "India · 2026",
  description:
    "Discover events at colleges and universities across India, register free, and receive a verified QR pass.",
  url: "https://www.eventwallah.com",
  poweredBy: {
    name: "EventWallah",
    email: "info@theeventwallah.com",
    phone: "+91 9355214750",
    website: "https://www.theeventwallah.com",
    websiteLabel: "www.theeventwallah.com",
  },
  contact: {
    partnershipsEmail: "hello@eventwallah.com",
    website: "https://www.eventwallah.com",
    websiteLabel: "www.eventwallah.com",
  },
  backing: "Designed around Startup India and campus innovation frameworks",
  scarcity: {
    slots: 100,
    season: "2026–27",
    priority:
      "IITs · IIMs · NITs · NAAC A+ universities and top private institutions",
  },
} as const;

/** Primary desktop links — keep short for a clean bar */
export const navigationPrimary = [
  { href: "/events", label: "Events" },
  { href: "/colleges", label: "Colleges" },
  { href: "/for-students", label: "For students" },
] as const;

/** Secondary links — “More” menu + full mobile list */
export const navigationMore = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

/** Full list for mobile drawer / footer */
export const navigation = [
  { href: "/", label: "Home" },
  ...navigationPrimary,
  ...navigationMore,
] as const;
