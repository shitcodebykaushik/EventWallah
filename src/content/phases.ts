export const phases = [
  {
    id: "01",
    title: "College onboarding",
    timing: "Week 0–2",
    description:
      "Confirm the program calendar, sign the MoU, and nominate the faculty and student leads.",
  },
  {
    id: "02",
    title: "Campus activation",
    timing: "Week 3–5",
    description:
      "Train student ambassadors, publish the challenge briefs, run orientation sessions, and open team registration.",
  },
  {
    id: "03",
    title: "2-day flagship",
    timing: "Week 6",
    description:
      "Run the Innovation Challenge, founder sessions, startup showcase, and final pitch on campus.",
  },
  {
    id: "04",
    title: "Incubation & capital",
    timing: "Week 7–12",
    description:
      "Review shortlisted teams and connect suitable ventures with incubators, mentors, investors, and grant programs.",
  },
  {
    id: "05",
    title: "National alumni loop",
    timing: "Ongoing",
    description:
      "Keep participating teams connected through peer sessions, referrals, and future program opportunities.",
  },
];

export const missionLevers = [
  {
    id: "M01",
    title: "Experienced mentors",
    description:
      "Founders, operators, and investors support workshops, office hours, and focused reviews for selected teams.",
  },
  {
    id: "M02",
    title: "Capital pathways",
    description:
      "Suitable teams are introduced to relevant angels, seed funds, incubators, and government grant programs.",
  },
  {
    id: "M03",
    title: "A structured pitch process",
    description:
      "A consistent evaluation and pitch format helps students prepare well and gives reviewers comparable information.",
  },
  {
    id: "M04",
    title: "A shared network",
    description:
      "A cross-campus community creates room for peer learning, introductions, hiring, and future collaboration.",
  },
];

export const tailwinds = [
  {
    id: "01",
    title: "Campus innovation has clearer policy support",
    category: "Policy",
    description:
      "Institutions can connect entrepreneurship activity with IIC programs, incubation networks, and recognised startup-support pathways.",
  },
  {
    id: "02",
    title: "Investors are looking beyond established hubs",
    category: "Capital",
    description:
      "A consistent screening process can make it easier for early-stage investors to review teams from more cities and institutions.",
  },
  {
    id: "03",
    title: "Students are building earlier",
    category: "Talent",
    description:
      "Students increasingly test products, freelance, join startups, and explore entrepreneurship before graduation.",
  },
  {
    id: "04",
    title: "Entrepreneurship complements placements",
    category: "Culture",
    description:
      "A credible founder pathway gives students another way to apply their skills while strengthening industry and alumni engagement.",
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
    year: "2026",
    label: "Partner cohort",
    detail:
      "Launch the 2026–27 cohort with a focused group of partner institutions and a common delivery model.",
  },
  {
    year: "2027",
    label: "Network year",
    detail:
      "Use the first cohort's operating data to improve the program and expand into more regions and disciplines.",
  },
  {
    year: "2029",
    label: "Ecosystem year",
    detail:
      "Build stronger links between campuses, incubators, industry partners, and early-stage capital.",
  },
  {
    year: "2030",
    label: "Long-term network",
    detail:
      "Establish a durable national network that helps campus ventures progress beyond their first competition.",
    highlight: true,
  },
];

export const collegeFootprint = [
  { value: "25", label: "Pilot institutions · 2026" },
  { value: "100", label: "Partner goal · 2026–27" },
  { value: "500", label: "Long-term network goal" },
];

export const partnershipTimeline = [
  {
    when: "Day 0",
    label: "Discovery",
    title: "Initial program review",
    detail:
      "A 30-minute discussion with the institutional lead covering fit, timing, facilities, and the campus team.",
  },
  {
    when: "Week 1",
    label: "MoU signed",
    title: "Agreement and campus team",
    detail:
      "Confirm the scope, nominate the faculty and student leads, and agree on the program date and working plan.",
  },
  {
    when: "Week 2–3",
    label: "Ambassador training",
    title: "Ambassador orientation and campus communication",
    detail:
      "Brief the student ambassadors, prepare institutional communication, and publish the registration schedule.",
  },
  {
    when: "Week 4–5",
    label: "Team registrations",
    title: "Team registration and reviewer confirmation",
    detail:
      "Open team registration, finalise the challenge briefs, confirm mentors and reviewers, and share evaluation criteria.",
  },
  {
    when: "Week 6",
    label: "Live event",
    title: "Two-day campus program",
    detail:
      "Innovation Challenge, founder sessions, finalist pitches, startup showcase, and scheduled introductions.",
    highlight: true,
  },
  {
    when: "Week 7+",
    label: "Follow-through",
    title: "Team referrals and program report",
    detail:
      "Review selected teams, arrange relevant referrals, and deliver the agreed participation, outcome, and media records.",
  },
];
