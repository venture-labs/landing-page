---
slug: "multi-agent-system"
language: "en"
seoTitle: 'Multi-agent system: agent cluster explained – Venture Labs'
seoDescription: 'A multi-agent system uses several AI agents with their own tasks and permissions. What an agent cluster and a base agent mean, with a practical example.'
order: 68
title: "Multi-agent system: agent cluster and base agent"
excerpt: "A multi-agent system uses several AI agents with their own tasks and permissions. What an agent cluster and a base agent mean, with a practical example."
topicSlug: "ai-automation"
topic: "AI Automation"
readTime: "2 min read"
featured: false
publishedDate: "January 11, 2027"  # prüfen: publication date is set by Christian at go-live; year 2027 inferred from «Woche 9 · 11.01.»
author: "VentureLabs Team"
draft: true
kind: "glossar"
plannedUrl: "/en/wissen/multi-agent-system/"
week: "Week 9 · 11.01."
keyword: "multi agent system"
# video: episode 3 “Base agent” (not shot yet)
content:
  - type: "paragraph"
    text: "A multi-agent system consists of several AI agents that each have their own task and work together. An agent cluster is such a system that is operated and monitored as a whole."
  - type: "heading"
    text: "When to use which: one agent or several"
  - type: "paragraph"
    text: "A single agent with a good playbook is enough as long as all tasks need the same permissions. Several agents pay off when tasks need different permissions, tools or models, or when a mistake could reach the outside world. The base agent is the shared template: it defines what every agent brings along, and each further agent is derived from it."  # prüfen: “base agent” is a term from our video series (episode 3, not shot); agree the definition with Christian
  - type: "heading"
    text: "An example from our own operation"
  - type: "paragraph"
    text: "In our own operation a cluster of several agents works for different areas. Each has its own folders, tools and keys, and shared rules apply to all. A text agent needs no access to financial data, and a data agent may not publish anything. Status: 09.11.2026."  # prüfen: Christian confirms the account and the status; deliberately without internal agent names and count
  - type: "heading"
    text: "Where it helps in a company"
  - type: "paragraph"
    text: "Several agents with separate permissions keep mistakes smaller and responsibility clearer. The price is more setup and upkeep, so it is better to start with one agent and to split only when needed."
  - type: "link"
    text: "Using AI agents in a company"
    href: "/leistungen/ki-agenten-unternehmen"
  - type: "link"
    text: "All terms in the knowledge hub"  # prüfen: Hub /wissen existiert erst nach dem Hub-Bau
    href: "/wissen"
  - type: "link"
    text: "Related: Playbook, role or own agent"
    href: "/blog/playbook-agent-rolle"
  - type: "link"
    text: "Related: What is an AI agent?"
    href: "/blog/ki-agent"
  - type: "link"
    text: "Related: AI guardrails"
    href: "/blog/ki-guardrails"
---
