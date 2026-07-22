export interface BlogContentBlock {
  type: "heading" | "paragraph";
  text: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  topicSlug: "development" | "company-building" | "webdesign" | "ki-strategie";
  topic: string;
  readTime: string;
  featured: boolean;
  publishedDate: string;
  author: string;
  content: BlogContentBlock[];
}

export const blogPosts: BlogPost[] = [
  {
    slug: "warum-mvps-floppen",
    title: "Why most MVPs fail – and how to do better",
    excerpt:
      "An MVP isn't a half-finished product – it's a test. Here are the mistakes teams make most often, and how to learn more with less effort.",
    topicSlug: "development",
    topic: "Product Development",
    readTime: "6 min read",
    featured: true,
    publishedDate: "March 12, 2026",
    author: "VentureLabs Team",
    content: [
      {
        type: "paragraph",
        text: "An MVP is supposed to test an assumption, not ship a half-finished product. Yet we see the same pattern in almost every project: too many features, too little focus, and a launch that surprises no one — because no one asked beforehand.",
      },
      { type: "heading", text: "The misunderstanding: MVP as a smaller product" },
      {
        type: "paragraph",
        text: "Most teams treat an MVP as version 1.0 with fewer features. That's the first mistake. An MVP isn't a scaled-down product — it's an experiment with a clear hypothesis. The question isn't \"what can we ship by launch,\" it's \"what do we need to know before we keep building.\"",
      },
      { type: "heading", text: "What an MVP is actually supposed to test" },
      {
        type: "paragraph",
        text: "A good MVP tests exactly one risky assumption — usually whether anyone would pay for a solution to the problem at all. Anything that doesn't directly answer that question is dead weight, including polish, onboarding flows, and admin dashboards, tempting as they are.",
      },
      { type: "heading", text: "The three most common mistakes" },
      {
        type: "paragraph",
        text: "First: building too broad, out of fear of forgetting something. Second: building too long, because \"finished\" feels more important than \"learned.\" Third: building without users and only gathering real feedback after launch — by which point changes get expensive.",
      },
      { type: "heading", text: "How we approach it at VentureLabs" },
      {
        type: "paragraph",
        text: "We start with one sentence: \"We believe X, because Y. We'll know when Z happens.\" From that we derive the smallest feature set that can make Z visible at all. That's usually far less than founders originally think they need — and that gap is the difference between an MVP that learns something and one that's just small.",
      },
    ],
  },
  {
    slug: "ki-agenten-use-cases",
    title: "AI agents in everyday business: 5 use cases that actually work",
    excerpt:
      "From automated support workflows to internal knowledge assistants: five AI applications delivering real value today – no hype attached.",
    topicSlug: "ki-strategie",
    topic: "AI Strategy",
    readTime: "8 min read",
    featured: true,
    publishedDate: "April 28, 2026",
    author: "VentureLabs Team",
    content: [
      {
        type: "paragraph",
        text: "AI agents are long past being chatbots with better marketing. Used well, they take over entire steps of a workflow — not just individual answers. Here are five applications already running reliably inside companies today.",
      },
      { type: "heading", text: "Why the hype asks the wrong questions" },
      {
        type: "paragraph",
        text: "Most AI discourse focuses on models, not processes. The real question is which step in a workflow can be automated reliably enough that a mistake doesn't get expensive. That's exactly where sensible use splits from novelty.",
      },
      { type: "heading", text: "Five use cases with real payoff" },
      {
        type: "paragraph",
        text: "Support agents that pre-qualify tickets and only escalate the genuinely hard cases. Internal knowledge assistants that pull answers out of scattered documents instantly. Agents that extract quotes and invoices from emails and write them into the ERP. Research agents that summarize competitive data in a structured way. And code-review agents that catch recurring mistakes before they reach production.",
      },
      { type: "heading", text: "What these use cases have in common" },
      {
        type: "paragraph",
        text: "All five have a narrowly scoped task, a verifiable output, and a human who steps in when things get uncertain. None of them replaces an entire role — they remove routine work and free up time for the decisions that actually require judgment.",
      },
      { type: "heading", text: "Where teams should start" },
      {
        type: "paragraph",
        text: "Not with the biggest problem, but with the most clearly bounded one. A process with clear inputs and outputs, a repeating pattern, and manageable risk delivers a result in weeks — and the confidence to take the next step.",
      },
    ],
  },
  {
    slug: "design-systems-hebel",
    title: "Design systems: the underrated lever for faster growth",
    excerpt:
      "A good design system doesn't just save time in design – it speeds up development too. Here's how to build one people actually use.",
    topicSlug: "webdesign",
    topic: "Webdesign & UX",
    readTime: "5 min read",
    featured: false,
    publishedDate: "February 9, 2026",
    author: "VentureLabs Team",
    content: [
      {
        type: "paragraph",
        text: "A design system is often treated as the design team's job — a nice-to-have for consistency. But its biggest effect usually isn't visible in the design at all. It shows up in how fast a team can build anything in the first place.",
      },
      { type: "heading", text: "More than a color palette" },
      {
        type: "paragraph",
        text: "A design system isn't a collection of colors and font sizes. It's a shared language between design and engineering — components built properly once, then reused everywhere, instead of being reinvented in every feature.",
      },
      { type: "heading", text: "The effect on development speed" },
      {
        type: "paragraph",
        text: "Once buttons, forms, and layout building blocks exist as reusable components, the work shifts from \"how do I build this\" to \"where do I plug this in.\" Teams that do this consistently report shipping features in days instead of weeks — not because individual tasks get faster, but because a large share of the work simply stops being new.",
      },
      { type: "heading", text: "Where design systems fail in practice" },
      {
        type: "paragraph",
        text: "Usually not on the technical side, but on maintenance. A system that stops evolving after the first release goes stale fast — and developers start building around it again. The second common failure: designing for an idealized state instead of the messy, real requirements that show up day to day.",
      },
      { type: "heading", text: "How to build one people actually use" },
      {
        type: "paragraph",
        text: "Start small, with the components used most often, not a complete catalog. Build it together with the people who'll use it daily. And treat it as a product with its own owner, not a one-off project that's eventually done.",
      },
    ],
  },
  {
    slug: "pitch-zu-produkt",
    title: "From pitch to product: how we build an MVP in 12 weeks",
    excerpt:
      "A behind-the-scenes look at our company-building process – from first idea to first paying customer.",
    topicSlug: "company-building",
    topic: "Company Building",
    readTime: "7 min read",
    featured: false,
    publishedDate: "January 15, 2026",
    author: "VentureLabs Team",
    content: [
      {
        type: "paragraph",
        text: "Twelve weeks sounds ambitious for a full product — and it is. But with the right process, it's achievable, plannable, and repeatable. A behind-the-scenes look at our company-building approach.",
      },
      { type: "heading", text: "Weeks 1–2: Validation before code" },
      {
        type: "paragraph",
        text: "Before a single line of code gets written, we talk to potential customers. The goal isn't confirmation, it's contradiction — we want to learn as early as possible where the idea doesn't hold up. Only once a clear problem and a paying audience are visible do we move forward.",
      },
      { type: "heading", text: "Weeks 3–8: Building with the core team" },
      {
        type: "paragraph",
        text: "A small, cross-functional team of product, design, and engineering builds the core of the solution — deliberately without anything that's \"important later too.\" Weekly reviews with real users make sure course corrections happen early, not at the end.",
      },
      { type: "heading", text: "Weeks 9–12: The first paying customer" },
      {
        type: "paragraph",
        text: "This phase isn't about features anymore, it's about closing the first real deal. The product doesn't need to be complete — it needs to solve the one problem someone is willing to pay for. That first customer is the actual proof the idea holds up.",
      },
      { type: "heading", text: "What makes this process plannable" },
      {
        type: "paragraph",
        text: "Clear decision points at the end of each phase, where we honestly ask: continue, adjust, or stop? That takes the randomness out of the process — turning \"let's build something\" into an approach that repeats, project after project.",
      },
    ],
  },
  {
    slug: "no-code-vs-custom",
    title: "No-code vs. custom development: when each one pays off",
    excerpt:
      "No-code tools keep getting more powerful – but they're not always the right choice. An honest breakdown.",
    topicSlug: "development",
    topic: "Product Development",
    readTime: "4 min read",
    featured: false,
    publishedDate: "June 3, 2026",
    author: "VentureLabs Team",
    content: [
      {
        type: "paragraph",
        text: "No-code tools are powerful enough today to build entire products — at least at first glance. The real question isn't whether no-code works, it's when it's the right choice and when it becomes a dead end.",
      },
      { type: "heading", text: "What no-code is genuinely good at" },
      {
        type: "paragraph",
        text: "For internal tools, simple workflows, and early validation, no-code is unbeatably fast. A working prototype in days instead of weeks, without tying up developer resources — exactly what it was built for, and exactly where it plays to its strengths.",
      },
      { type: "heading", text: "Where no-code hits its limits" },
      {
        type: "paragraph",
        text: "Once custom logic, heavy scale, or deep integrations enter the picture, things get tight. Many no-code platforms then demand workarounds that end up more complicated than custom code — just without the control custom code gives you.",
      },
      { type: "heading", text: "The cost curve over time" },
      {
        type: "paragraph",
        text: "No-code is cheaper at the start; custom development usually is over time. License costs climb with user numbers, and workarounds pile up into technical debt that's more expensive to fix later than a clean build would have been from the start.",
      },
      { type: "heading", text: "An honest way to decide" },
      {
        type: "paragraph",
        text: "Ask yourself whether you'll still want to be on the same platform in two years — and whether requirements will stay simple or get complex by then. For validation and internal tools: no-code. For anything that becomes the core product: invest in custom development early.",
      },
    ],
  },
  {
    slug: "user-research-schnell",
    title: "Fast user research: 3 methods for tight timelines",
    excerpt:
      "Even with little time and budget, you can gather solid user feedback. Three methods that hold up in practice.",
    topicSlug: "webdesign",
    topic: "Webdesign & UX",
    readTime: "5 min read",
    featured: false,
    publishedDate: "June 22, 2026",
    author: "VentureLabs Team",
    content: [
      {
        type: "paragraph",
        text: "\"We don't have time for that\" is the most common reason user research gets skipped. But solid feedback doesn't need weeks or a big budget — with the right methods, a few days are often enough.",
      },
      { type: "heading", text: "Why \"no time\" isn't an excuse" },
      {
        type: "paragraph",
        text: "The biggest time sink in user research usually isn't running it, it's planning it. Teams that use fixed, repeatable formats can run research alongside development instead of gating it beforehand.",
      },
      { type: "heading", text: "Method 1: Guerrilla interviews" },
      {
        type: "paragraph",
        text: "Five short conversations with real users — in a café, on-site with a customer, or over video call — often surface more insight than one big, carefully planned study. The only requirement is one clear question per conversation, not a full questionnaire.",
      },
      { type: "heading", text: "Method 2: Fast, focused surveys" },
      {
        type: "paragraph",
        text: "One well-worded question to existing users beats any twenty-question survey. Response rates go up, analysis takes minutes instead of days, and the answers are more concrete.",
      },
      { type: "heading", text: "Method 3: Five-second tests" },
      {
        type: "paragraph",
        text: "A screenshot, five seconds of viewing time, one question: \"what does this product do?\" This method shows in minutes whether a message lands — long before an elaborate usability test would even be scheduled.",
      },
    ],
  },
];
