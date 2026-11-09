---
slug: "rolle-system-prompt"
language: "en"
seoTitle: "What is a system prompt? Role and persona – Venture Labs"
seoDescription: "What is a system prompt? The starting text of an AI agent. How role and persona fit in, and why text alone does not replace permissions."
order: 61
title: "Role, persona and system prompt for AI agents"
excerpt: "What a system prompt is, how role and persona relate to it, and why a starting text does not replace permissions."
topicSlug: "ai-automation"
topic: "AI Automation"
readTime: "2 min read"
featured: false
publishedDate: "December 14, 2026"  # prüfen: date is set by Christian at go-live; follows the weekly plan (week 5)
author: "VentureLabs Team"
draft: true
kind: "glossar"
plannedUrl: "/en/wissen/rolle-system-prompt/"
week: "Woche 5 · 14.12."
keyword: "what is a system prompt"
# video: Episode 2 «Rolle oder Playbook», series not shot yet
content:
  - type: "paragraph"
    text: "A system prompt is the starting text a language model receives before any conversation and that defines its behaviour: task, tone, limits. The role is the task this text gives the agent, the persona is how it presents itself while doing it."
  - type: "heading"
    text: "How system prompt, role and persona differ"
  - type: "paragraph"
    text: "The system prompt is the technical place where instructions live. The role (“checks invoices”, “prepares quotes”) describes what the agent does. The persona describes tone and manner, for example factual or friendly. In everyday use, “role” usually means a system prompt with a clear task."
  - type: "heading"
    text: "When text is no longer enough"
  - type: "paragraph"
    text: "A system prompt is a request, not a lock. A sentence like “never write to customers” is mostly followed but not enforced. What must never happen belongs in permissions: which folders and tools an agent has and what leaves the company only after approval. If only the perspective changes with the same permissions, a role is enough. If only the tone should change, a different persona is enough. If the task needs different permissions, a separate agent is the more honest solution."
  - type: "heading"
    text: "Example from our own operation"
  - type: "paragraph"
    text: "In our own operation, an agent's starting configuration is more than one text: playbook, skills, model, caps, folders and tools belong to it. The text sets the task, the permissions set the limits. Status: 09.11.2026."  # prüfen: check the description of role configuration in our operation against current practice; Christian approves
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
    text: "Permissions instead of text for AI agents"
    href: "/blog/rechte-statt-text"
---
