export const phases = [
  {
    id: "01",
    title: "College onboarding",
    timing: "Week 0–2",
    description:
      "Sign the MoU, stand up a Launch Bharat Cell, align with your IIC and academic calendar.",
  },
  {
    id: "02",
    title: "Campus activation",
    timing: "Week 3–5",
    description:
      "Train ambassadors, run workshops, drop problem briefs, form teams — momentum before the lights go up.",
  },
  {
    id: "03",
    title: "2-day flagship",
    timing: "Week 6",
    description:
      "Innovation Challenge, Startup Summit, and Investor Grand Pitch — produced end-to-end on your campus.",
  },
  {
    id: "04",
    title: "Incubation & capital",
    timing: "Week 7–12",
    description:
      "Shortlisted teams get warm intros to incubators, angels, and Startup India grant pathways.",
  },
  {
    id: "05",
    title: "National alumni loop",
    timing: "Ongoing",
    description:
      "Cross-campus founder network for hiring, customers, co-founders, and ongoing deal flow.",
  },
];

export const missionLevers = [
  {
    id: "M01",
    title: "Mentorship at scale",
    description:
      "A rotating pool of 200+ founders, operators, and investors — office hours, panels, and 1:1 pitch reviews for every campus.",
  },
  {
    id: "M02",
    title: "Capital pathways",
    description:
      "Pipelines to angels, seed funds, and government grants — with warm intros for every shortlisted team on stage.",
  },
  {
    id: "M03",
    title: "The stage",
    description:
      "An investor-attended pitch arena on every partner campus — winners earn national exposure, not just a certificate.",
  },
  {
    id: "M04",
    title: "A shared network",
    description:
      "Alumni across 100+ campuses for co-founders, hires, customers, and peer learning no single college can build alone.",
  },
];

export const tailwinds = [
  {
    id: "01",
    title: "Startup India is ready for campuses",
    category: "Policy",
    description:
      "Fund of Funds, tax holidays, and DPIIT recognition are single-window. Colleges can plug students into formal pathways faster than ever.",
  },
  {
    id: "02",
    title: "Investors need non-metro deal flow",
    category: "Capital",
    description:
      "Billions in dry powder are hunting for founders outside Tier-1 metros — campuses are the highest-density discovery surface.",
  },
  {
    id: "03",
    title: "Founders are younger than ever",
    category: "Talent",
    description:
      "Median founder age is dropping; first-time builders outnumber serial founders. The classroom is the new pipeline.",
  },
  {
    id: "04",
    title: "Founder is a career track",
    category: "Culture",
    description:
      "Students no longer wait only for placements — they want a stage. Colleges that supply it own the narrative.",
    highlight: true,
  },
];


export const visionRoadmap: {
  year: string;
  label: string;
  detail: string;
  highlight?: boolean;
}[] = [
  {
    year: "2025",
    label: "Foundation year",
    detail:
      "100+ anchor colleges live. 5,000 students activated. Backed by Startup India.",
  },
  {
    year: "2027",
    label: "Expansion year",
    detail:
      "500+ colleges. Tier-2 & Tier-3 focus. First Launch Bharat Fund of Funds — ₹250 Cr target.",
  },
  {
    year: "2029",
    label: "Global year",
    detail:
      "Cross-border expansion into Southeast Asia and Africa. Indian student founders on the world stage.",
  },
  {
    year: "2030",
    label: "Movement year",
    detail:
      "1,000 colleges. 1M students. 10,000 startups. Ambition: unicorns traced back to a Launch Bharat pitch.",
    highlight: true,
  },
];

export const collegeFootprint = [
  { value: "100+", label: "Colleges by 2025" },
  { value: "500+", label: "Colleges by 2027" },
  { value: "1,000+", label: "Colleges by 2030" },
];

export const partnershipTimeline = [
  {
    when: "Day 0",
    label: "Discovery",
    title: "Introductory call · alignment",
    detail:
      "30-minute call with the Dean / VC / IIC head. Agenda: strategic fit, calendar, faculty champion.",
  },
  {
    when: "Week 1",
    label: "MoU signed",
    title: "MoU · Launch Bharat Cell activated",
    detail:
      "MoU signed, campus-side team named, shared workspace and event date locked.",
  },
  {
    when: "Week 2–3",
    label: "Ambassador training",
    title: "20+ student ambassadors trained · campaign live",
    detail:
      "Marketing collateral shipped, social calendar activated, campus posters up.",
  },
  {
    when: "Week 4–5",
    label: "Team registrations",
    title: "Problem statement drop · investor & jury locked",
    detail:
      "Sealed briefs prepared, judge invitations confirmed, PR embargo agreed.",
  },
  {
    when: "Week 6",
    label: "Live event",
    title: "The 2-day Launch Bharat flagship — live on campus",
    detail:
      "Innovation Challenge · Startup Summit · Grand Pitch · Investor day.",
    highlight: true,
  },
  {
    when: "Week 7+",
    label: "Follow-through",
    title: "Incubation routing · impact report · alumni loop",
    detail:
      "Top teams matched to accelerators, PR dossier delivered, joint press release published.",
  },
];
