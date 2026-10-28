// All portfolio content lives here. Edit this file to update the site.

export const profile = {
  name: 'Muhammad Abdullah',
  first: 'Muhammad',
  title: 'Full-Stack Software Developer',
  location: 'Toronto, ON',
  email: 'info.abdullahmuhammad@gmail.com',
  linkedin: 'https://www.linkedin.com/in/mabdullah-cs/',
  github: 'https://github.com/muhammadabdullahh',
  githubUser: 'muhammadabdullahh',
  resume: 'Muhammad_Abdullah_Resume.pdf',
  summary:
    'Full-stack developer shipping production features to enterprise platforms serving 6.8M+ users, across React, TypeScript, C#/.NET, Go and SQL Server.',
  about: [
    'Hey, I’m Muhammad. I build software at Dayforce on the Scheduling platform, which 6.8M+ employees at nearly 7,000 organizations rely on every day.',
    'I like the unglamorous parts that make software feel fast and trustworthy: query tuning, concurrency, automated tests and CI/CD. My favourite win so far took an API from 5+ minutes to under 15 seconds.',
    'Outside work I ship my own products: a live ticketing platform that has sold hundreds of tickets, an event discovery app in Go and React Native, and an iOS budgeting app.',
    'I grew up building worlds one block at a time. This site is a little love letter to that. Walk around, mine some skills, and say hi in the chat.',
  ],
  splashes: [
    'Ships to 6.8M+ users!',
    '5 min → 15 sec!',
    'Now with row-level locking!',
    'Zero oversold tickets!',
    '150+ unit tests!',
    'Also try NearMoi!',
    'Made in Pickering, Ontario!',
    'Hire me!',
    'Full-stack, all biomes!',
    'With Distinction!',
    'Bugs squashed: 50+!',
    'React + .NET + SQL!',
    'Press T to chat!',
  ],
};

export type Job = {
  id: string;
  company: string;
  role: string;
  dates: string;
  place: string;
  stack: string[];
  points: string[];
};

export const jobs: Job[] = [
  {
    id: 'dayforce-associate',
    company: 'Dayforce',
    role: 'Software Developer Associate',
    dates: 'Dec 2025 – Present',
    place: 'Toronto, ON',
    stack: ['React', '.NET', 'SQL Server'],
    points: [
      'Build and ship features for the enterprise Scheduling platform used by 6,984 client organizations and 6.8M+ employees worldwide.',
      'Review peer code against quality and security standards, gating changes that reach production at global scale.',
    ],
  },
  {
    id: 'dayforce-intern',
    company: 'Dayforce',
    role: 'Software Developer Intern',
    dates: 'Jan 2025 – Dec 2025',
    place: 'Toronto, ON',
    stack: ['React', '.NET', 'SQL Server'],
    points: [
      'Cut backend API response times from 5+ minutes to under 15 seconds by refactoring .NET services and rewriting SQL Server queries.',
      'Converted 5 manual test scripts into automated tests, reducing regression testing time by 40%; the framework was later adopted by other teams.',
      'Resolved 50+ defects, including production incidents fixed within hours, across React, .NET and SQL services.',
      'Wrote 150+ unit tests covering 5,000+ lines of code, raising coverage and release reliability.',
    ],
  },
  {
    id: 'tmu',
    company: 'Toronto Metropolitan University',
    role: 'Software Engineer, Dept. of Architectural Science',
    dates: 'Sep 2024 – Jan 2025',
    place: 'Toronto, ON',
    stack: ['Python', 'Django', '.NET'],
    points: ['Built RESTful APIs in Python/Django and .NET powering real-time data streaming, analytics and BIM integration.'],
  },
  {
    id: 'opg',
    company: 'Ontario Power Generation',
    role: 'Software Engineer Intern',
    dates: 'Jan 2024 – Sep 2024',
    place: 'Whitby, ON',
    stack: ['Angular', '.NET', 'SQL Server', 'Azure'],
    points: [
      'Engineered a task scheduling service and automated email notifications, saving 10+ staff hours weekly and $2,000/month.',
      'Owned full-stack web apps (Angular, .NET, SQL Server, Azure) replacing legacy internal systems.',
      'Optimized SQL queries and backend logic, cutting process time from 20 minutes to 5.',
      'Worked directly with the teams using the tools: gathered requirements, built, demoed and iterated on feedback.',
    ],
  },
];

export type Project = {
  id: string;
  name: string;
  tagline: string;
  url: string;
  urlLabel: string;
  embeddable: boolean;
  status: string;
  stack: string[];
  points: string[];
  image?: string;
};

export const projects: Project[] = [
  {
    id: 'stf',
    name: 'Sisters Through Faith',
    tagline: 'Event ticketing platform',
    url: 'https://www.sistersthroughfaith.ca',
    urlLabel: 'sistersthroughfaith.ca',
    embeddable: true,
    status: 'Live · hundreds of tickets sold',
    stack: ['Next.js', 'TypeScript', 'PostgreSQL', 'Stripe', 'Supabase', 'Vercel'],
    points: [
      'Eliminated ticket overselling under concurrent demand with an atomic PostgreSQL function using row-level locking.',
      'Holds inventory for 5 minutes and auto-releases it via Stripe webhooks on failed or expired payments.',
      'Server-authoritative pricing, webhook signature verification, row-level security and per-IP rate limiting.',
      'Admin console for events, refunds and order exports; fixed gallery overload with paginated, indexed queries.',
    ],
  },
  {
    id: 'nearmoi',
    name: 'NearMoi',
    tagline: 'Cross-platform event discovery',
    url: 'https://nearmoi.ca',
    urlLabel: 'nearmoi.ca',
    embeddable: false,
    status: 'In development',
    stack: ['Go', 'Gin', 'PostgreSQL', 'React Native', 'Expo', 'Auth0', 'Mapbox'],
    points: [
      'Go (Gin) REST API over PostgreSQL serving a location-ranked feed via Haversine distance queries, paginated and composite-indexed.',
      'One React Native (Expo) + TypeScript codebase for iOS, Android and web, with Mapbox, push notifications and Apple/Google sign-in.',
      'Daily GitHub Actions pipeline ingests 18 municipal event calendars: geocodes, deduplicates and upserts with per-source failure isolation.',
      'Auth0 JWT validation and per-IP rate limiting on credential endpoints to block brute-force attempts.',
    ],
  },
  {
    id: 'zenny',
    name: 'Zenny',
    tagline: 'iOS personal finance manager',
    url: 'https://zennyapp.netlify.app',
    urlLabel: 'zennyapp.netlify.app',
    embeddable: true,
    status: 'On the App Store',
    stack: ['Swift', 'SwiftUI', 'Speech', 'NaturalLanguage', 'WidgetKit'],
    points: [
      'Voice-driven transaction entry using Apple’s Speech framework.',
      'Self-implemented on-device TF-IDF / k-NN classifier that learns each user’s merchant and category patterns.',
      'Face ID lock and home-screen widgets; all data stays on the device.',
    ],
  },
];

export type SkillCategory = 'Languages' | 'Frontend' | 'Backend' | 'Data & Cloud' | 'Practices';

export type Skill = { id: string; name: string; short: string; cat: SkillCategory; core?: boolean; usedAt: string[] };

const s = (name: string, short: string, cat: SkillCategory, usedAt: string[] = [], core = false): Skill => ({
  id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  name,
  short,
  cat,
  core,
  usedAt,
});

export const skills: Skill[] = [
  s('C#', 'C#', 'Languages', ['Dayforce', 'OPG', 'TMU'], true),
  s('TypeScript', 'TS', 'Languages', ['Dayforce', 'Sisters Through Faith', 'NearMoi'], true),
  s('JavaScript', 'JS', 'Languages', ['Dayforce', 'OPG']),
  s('Go', 'Go', 'Languages', ['NearMoi']),
  s('Python', 'Py', 'Languages', ['TMU']),
  s('Java', 'Java', 'Languages', []),
  s('SQL', 'SQL', 'Languages', ['Dayforce', 'OPG', 'Sisters Through Faith'], true),
  s('Swift', 'Swift', 'Languages', ['Zenny']),
  s('C', 'C', 'Languages', []),
  s('React', 'React', 'Frontend', ['Dayforce', 'Sisters Through Faith'], true),
  s('Next.js', 'Next', 'Frontend', ['Sisters Through Faith']),
  s('React Native', 'RN', 'Frontend', ['NearMoi']),
  s('Angular', 'Ang', 'Frontend', ['OPG']),
  s('HTML', 'HTML', 'Frontend', ['Everywhere']),
  s('CSS', 'CSS', 'Frontend', ['Everywhere']),
  s('Tailwind', 'TW', 'Frontend', ['Sisters Through Faith']),
  s('.NET', '.NET', 'Backend', ['Dayforce', 'OPG', 'TMU'], true),
  s('Node.js', 'Node', 'Backend', []),
  s('Gin', 'Gin', 'Backend', ['NearMoi']),
  s('Django', 'Djngo', 'Backend', ['TMU']),
  s('REST APIs', 'REST', 'Backend', ['Dayforce', 'TMU', 'NearMoi'], true),
  s('Stripe', 'Stripe', 'Backend', ['Sisters Through Faith']),
  s('Auth0 / JWT', 'JWT', 'Backend', ['NearMoi']),
  s('SQL Server', 'MSSQL', 'Data & Cloud', ['Dayforce', 'OPG'], true),
  s('PostgreSQL', 'PG', 'Data & Cloud', ['Sisters Through Faith', 'NearMoi']),
  s('Supabase', 'Supa', 'Data & Cloud', ['Sisters Through Faith']),
  s('MySQL', 'MySQL', 'Data & Cloud', []),
  s('Oracle', 'Oracl', 'Data & Cloud', []),
  s('Azure', 'Azure', 'Data & Cloud', ['OPG', 'Dayforce']),
  s('Azure DevOps', 'ADO', 'Data & Cloud', ['Dayforce']),
  s('AWS', 'AWS', 'Data & Cloud', []),
  s('Vercel', 'Vrcel', 'Data & Cloud', ['Sisters Through Faith']),
  s('Git', 'Git', 'Practices', ['Everywhere']),
  s('CI/CD', 'CI/CD', 'Practices', ['Dayforce', 'NearMoi'], true),
  s('GitHub Actions', 'GHA', 'Practices', ['NearMoi']),
  s('Agile / Scrum', 'Agile', 'Practices', ['Dayforce', 'OPG']),
  s('Jest / Vitest', 'Jest', 'Practices', ['Dayforce'], true),
  s('Code Review', 'Review', 'Practices', ['Dayforce']),
];

export const categories: { id: SkillCategory; ore: OreKind; blurb: string }[] = [
  { id: 'Languages', ore: 'diamond', blurb: 'Diamond ore' },
  { id: 'Frontend', ore: 'emerald', blurb: 'Emerald ore' },
  { id: 'Backend', ore: 'gold', blurb: 'Gold ore' },
  { id: 'Data & Cloud', ore: 'lapis', blurb: 'Lapis ore' },
  { id: 'Practices', ore: 'redstone', blurb: 'Redstone ore' },
];

export type OreKind = 'diamond' | 'emerald' | 'gold' | 'lapis' | 'redstone';

export const oreFor = (cat: SkillCategory): OreKind => categories.find((c) => c.id === cat)!.ore;

export const education = {
  school: 'Toronto Metropolitan University',
  degree: 'BSc (Honours), Computer Science',
  date: 'April 2026',
  honours: 'With Distinction',
  gpa: '3.7 / 4.0',
};
