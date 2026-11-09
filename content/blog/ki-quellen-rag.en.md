---
slug: "ki-quellen-rag"
language: "en"
seoTitle: 'What is RAG in AI? Sources and knowledge base – Venture Labs'
seoDescription: 'What is RAG? Retrieval-augmented generation lets an AI model look things up in a knowledge base before answering. Why sources and “not found” matter.'
order: 69
title: "Sources and knowledge base for AI agents (RAG)"
excerpt: "What is RAG? Retrieval-augmented generation lets an AI model look things up in a knowledge base before answering. Why sources and “not found” matter."
topicSlug: "ai-automation"
topic: "AI Automation"
readTime: "2 min read"
featured: false
publishedDate: "January 18, 2027"  # prüfen: publication date is set by Christian at go-live; year 2027 inferred from «Woche 10 · 18.01.»
author: "VentureLabs Team"
draft: true
kind: "glossar"
plannedUrl: "/en/wissen/ki-quellen-rag/"
week: "Week 10 · 18.01."
keyword: "what is rag ai"
# video: episode 6 “Sources: how does the agent know what is true?” (not shot yet)
content:
  - type: "paragraph"
    text: "RAG stands for retrieval-augmented generation. Before answering, an AI model looks things up in a trusted knowledge base instead of relying on its training knowledge alone."  # prüfen: definition checked against AWS “What is Retrieval-Augmented Generation?” (aws.amazon.com/what-is/retrieval-augmented-generation), retrieved 09.11.2026; vendor page, not a standard; also check the original paper (Lewis et al. 2020) as primary source
  - type: "heading"
    text: "When to use which: RAG, training, playbook"
  - type: "paragraph"
    text: "With training, a model learns knowledge permanently, which is costly and goes out of date. With RAG the knowledge stays in the company’s own documents and is searched anew for every question. A playbook tells the agent how to proceed; the sources tell it what applies."
  - type: "heading"
    text: "Why sources and “not found” matter"
  - type: "paragraph"
    text: "An answer is only as good as its source. That is why each answer should name the place it comes from, so it can be checked. Just as important is that the agent says “not found” when nothing suitable exists, instead of inventing an answer."
  - type: "heading"
    text: "An example from our own operation"
  - type: "paragraph"
    text: "In our own operation, agents draw on a maintained knowledge base and name the source for facts. If nothing is found, the answer says so. Status: 09.11.2026."  # prüfen: Christian confirms the account and the status; check on the system whether source citation and “not found” apply throughout
  - type: "heading"
    text: "Where it helps in a company"
  - type: "paragraph"
    text: "Knowledge from manuals, reports and agreements becomes findable without anyone having to search. The precondition is that it was written down beforehand and is kept up to date."
  - type: "link"
    text: "Using AI agents in a company"
    href: "/leistungen/ki-agenten-unternehmen"
  - type: "link"
    text: "All terms in the knowledge hub"
    href: "/wissen"
  - type: "link"
    text: "Related: What is an AI agent?"
    href: "/wissen/ki-agent"
  - type: "link"
    text: "Related: What is an AI playbook?"
    href: "/wissen/ki-playbook"
  - type: "link"
    text: "Related: Securing maintenance knowledge"
    href: "/blog/wartungswissen-sichern"
---
