export const site = {
  name: "Launch Bharat",
  tagline: "Launch Your Dream. Build the Future.",
  edition: "2024–25 Edition",
  description:
    "India's nationwide student startup movement. We turn colleges into innovation hubs — with mentorship, capital pathways, and an investor-attended pitch stage for the next generation of founders.",
  url: "https://www.launchbharat.in",
  poweredBy: {
    name: "The Event Wallah",
    email: "info@theeventwallah.com",
    phone: "+91 9355214750",
    website: "https://www.theeventwallah.com",
    websiteLabel: "www.theeventwallah.com",
  },
  contact: {
    partnershipsEmail: "partnerships@launchbharat.in",
    website: "https://www.launchbharat.in",
    websiteLabel: "www.launchbharat.in",
  },
  backing: "Aligned with Startup India · MoCI",
  scarcity: {
    slots: 100,
    season: "2024–25",
    priority:
      "IITs · IIMs · NITs · NAAC A+ universities and top private institutions",
  },
} as const;

/** Primary desktop links — keep short for a clean bar */
export const navigationPrimary = [
  { href: "/program", label: "Program" },
  { href: "/for-colleges", label: "Colleges" },
  { href: "/for-students", label: "Students" },
  { href: "/impact", label: "Impact" },
] as const;

/** Secondary links — “More” menu + full mobile list */
export const navigationMore = [
  { href: "/about", label: "About" },
  { href: "/partners", label: "Track record" },
  { href: "/contact", label: "Contact" },
] as const;

/** Full list for mobile drawer / footer */
export const navigation = [
  { href: "/", label: "Home" },
  ...navigationPrimary,
  ...navigationMore,
] as const;
