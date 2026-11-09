---
slug: "ki-skill"
language: "en"
seoTitle: "What is an AI skill? Definition and example – Venture Labs"
seoDescription: "What is an AI skill? A knowledge package an AI agent loads when needed. How it differs from a playbook and a role, with an example and limits."
order: 62
title: "What is an AI skill?"
excerpt: "An AI skill is a knowledge package an agent loads when needed. Definition, how it differs from a playbook and a role, and an example."
topicSlug: "ai-automation"
topic: "AI Automation"
readTime: "2 min read"
featured: false
publishedDate: "December 21, 2026"  # prüfen: date is set by Christian at go-live; follows the weekly plan (week 6)
author: "VentureLabs Team"
draft: true
kind: "glossar"
plannedUrl: "/en/wissen/ki-skill/"
week: "Woche 6 · 21.12."
keyword: "what is an ai skill"
# video: no own video; skill as part of a role appears in episode 2 (series not shot yet)
content:
  - type: "paragraph"
    text: "An AI skill is a self-contained knowledge package for an AI agent, such as instructions, rules and examples on one topic. The agent loads it only when the task calls for it and does not carry it around otherwise."
  - type: "heading"
    text: "What an AI skill is and what it is not"
  - type: "paragraph"
    text: "A playbook describes the procedure of a task, a skill supplies the expertise for one part of it, for example how quotes are written or the rules for checking receipts. A role bundles both with a model, caps and, where needed, folders and tools. A skill gives the agent knowledge, but no new permissions. If knowledge is missing, a skill helps; if a permission is missing, it does not."
  - type: "heading"
    text: "Why skills instead of one long starting text"
  - type: "paragraph"
    text: "A very long starting text takes up space and attention on every request, even when most of it is not needed right now. Skills keep the base text short and provide specialist knowledge when it fits. A skill can also be reused in several roles and maintained in one place."  # prüfen: statements on space and attention are a general explanation; check against the documentation of the system used
  - type: "heading"
    text: "Example from our own operation"
  - type: "paragraph"
    text: "In our own operation, each role gets a fixed list of skills, for instance for writing style or review rules. The skills are files in a shared library and are used by several roles. Status: 09.11.2026."  # prüfen: story from our own operation (fixed skill list per role, shared library) needs Christian's approval and a check against practice
  - type: "link"
    text: "AI agents for companies"
    href: "/leistungen/ki-agenten-unternehmen"
  - type: "link"
    text: "All terms in the knowledge section"
    href: "/wissen"  # prüfen: hub /wissen only exists once the hub is built
  - type: "link"
    text: "What is an AI playbook?"
    href: "/blog/ki-playbook"
  - type: "link"
    text: "Role, persona and system prompt for AI agents"
    href: "/blog/rolle-system-prompt"
---
