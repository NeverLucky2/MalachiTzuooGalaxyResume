import type {ContentBlock, SectionId} from './types';

export const CONTENT: Record<SectionId, ContentBlock[]> = {
  about: [
    {kind:'paragraph', text:'Software developer with a strong engineering foundation — Python, cloud-native delivery, CI/CD automation, and generative-AI tooling. AWS Certified Developer based in Chicago, shipping production apps in cross-functional teams.'},
    {kind:'cards', items:[
      {label:'📍 Location', value:'Chicago, IL'},
      {label:'🎓 Study', value:'DePaul (BS Software Dev) · Linköping (BBA)'},
      {label:'🧗 Interests', value:'Rock climbing, gym, games'},
      {label:'🐱 Also', value:'Owner of 3 very good cats'},
    ]},
  ],
  xp: [
    {kind:'timeline', items:[
      {role:'Logistics Coordinator', meta:'Bensenville, IL · Nov 2024 – Present', bullets:[
        'Built Python automation pipelines to ingest, clean & process large operational datasets.',
        'Custom extraction/parsing with validation logic turning raw shipment records into analytics-ready data.']},
      {role:'Front-End Software Developer Intern', meta:'Remote · Jun 2024 – Nov 2024', bullets:[
        'Maintained an Astro + React app serving 10,000+ monthly users.',
        'Accessible UI in TypeScript + Tailwind, integrated with Supabase / PostgreSQL.']},
      {role:'Ruby Full-Stack Developer', meta:'Remote · Mar 2023 – Jul 2023', bullets:[
        'Rails + React blog platform on AWS with RDS PostgreSQL.',
        'Designed CI/CD from scratch with GitHub Actions; TDD & pair programming.']},
    ]},
  ],
  proj: [
    {kind:'projects', items:[
      {title:'ClaudeProphetAndFriends (fork of OpenProphet)', body:"A fork of Jake Nesler's OpenProphet that I largely rebuilt. The original was a single hyper-aggressive options agent with no real edge; I turned it into a fleet of agents running mechanical, backtested (historical-data) strategies that don't rely on options — lower highs, but far steadier and more consistent. I added a pre-flight step that cuts token cost, automatic heartbeat tuning, and FMP-powered screeners/analysis. Node/Express agent + Go (Gin) Alpaca backend + Claude (via OpenCode) + 45+ MCP tools with permission guardrails; paper trading. Mostly just the (reworked) dashboard layout remains from the original.", isNew:true, href:'https://github.com/NeverLucky2/ClaudeProphetAndFriends'},
      {title:'Tallio — local-first finance tracker', body:"A friendlier Quicken alternative built for my dad. Snap bills, receipts, paystubs & statements with your phone; Claude's vision model does the data entry into a double-entry ledger, then reports cash flow, net worth, spending & recurring charges. 100% in-browser (localStorage) — no server or account — with phone→desktop capture over WebRTC. React 19 · Vite · Claude vision · 590+ tests.", isNew:true},
      {title:'GenAI Dev Practice', body:'Daily Anthropic API, LangChain & agentic workflow work.'},
      {title:'Astrite.gg', body:'Wuthering Waves gacha tracker (Astro/React), 10k+ users.'},
      {title:'Revature Blogger', body:'Full-stack Rails + React blog, GitHub Actions CI/CD.'},
      {title:'Mario Screaming Bot', body:'JS Discord bot, token auth, self-hosted uptime.'},
    ]},
  ],
  skills: [
    {kind:'stats', items:[
      {label:'Python', pct:88},{label:'JavaScript / TypeScript', pct:85},{label:'React', pct:75},
      {label:'AWS (EC2/RDS/S3)', pct:82},{label:'GenAI / LLMs / LangChain', pct:85},{label:'CI/CD · Docker', pct:74},
    ]},
  ],
  resume: [
    {kind:'cards', items:[{label:'🏅 AWS Certified Developer – Associate', value:'Valid 2024 – 2027. EC2, Lambda, DynamoDB, SNS/SQS, CodePipeline.'}]},
    {kind:'paragraph', text:'Grab the full PDF for the complete history.'},
    {kind:'download', label:'⤓ Download résumé (PDF)', href:'/assets/Tzuoo_Malachi_Resume_.pdf'},
  ],
  contact: [
    {kind:'links', items:[
      {label:'✉️ Email', value:'mtzuoo@gmail.com', href:'mailto:mtzuoo@gmail.com'},
      {label:'🐙 GitHub', value:'github.com/NeverLucky2', href:'https://github.com/NeverLucky2'},
      {label:'💼 LinkedIn', value:'malachi-tzuoo-depaul', href:'https://www.linkedin.com/in/malachi-tzuoo-depaul/'},
      {label:'📍 Based in', value:'Chicago, IL'},
    ]},
  ],
};
