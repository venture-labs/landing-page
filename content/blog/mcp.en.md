---
slug: "mcp"
language: "en"
seoTitle: "What is MCP? Model Context Protocol explained – Venture Labs"
seoDescription: "What is MCP in AI? The Model Context Protocol is an open standard that connects AI applications to data sources and tools. Explained simply."
order: 64
title: "What is MCP? The Model Context Protocol explained simply"
excerpt: "MCP, the Model Context Protocol, connects AI applications to data and tools through an open standard. Definition, distinctions and an example."
topicSlug: "ai-automation"
topic: "AI Automation"
readTime: "2 min read"
featured: false
publishedDate: "December 28, 2026"  # prüfen: date is set by Christian at go-live; follows the weekly plan (week 7)
author: "VentureLabs Team"
draft: true
kind: "glossar"
plannedUrl: "/en/wissen/mcp/"
week: "Woche 7 · 28.12."
keyword: "what is mcp ai"
# video: none (gap)
content:
  - type: "paragraph"
    text: "MCP stands for Model Context Protocol and is an open standard for connecting AI applications to external systems such as files, databases and tools. Anthropic introduced it in November 2024."  # prüfen: definition and origin per modelcontextprotocol.io/docs/getting-started/intro (retrieved 09.11.2026: “open-source standard for connecting AI applications to external systems”) and Anthropic's announcement of 25.11.2024 (anthropic.com/news/model-context-protocol, confirmed via web search)
  - type: "heading"
    text: "How MCP works and when it matters"
  - type: "paragraph"
    text: "The official documentation compares MCP to a USB-C port: one standard plug instead of a separate cable per device. An MCP server provides data or tools, an AI application as the client uses them. Without a standard, every connection has to be built individually; with one, applications and tools from different vendors can fit together."  # prüfen: check the USB-C comparison and client-server structure against the official docs (modelcontextprotocol.io, retrieved 09.11.2026)
  - type: "heading"
    text: "How MCP differs from skills and approvals"
  - type: "paragraph"
    text: "A skill gives an agent knowledge, MCP gives it access to systems. Giving an agent a tool via MCP also gives it the ability to do something. The same rules therefore apply as for any permission: as little as needed, read before write, approval before anything takes effect outside. A standard makes connecting simpler, it does not make it safe automatically."
  - type: "heading"
    text: "Example from practice"
  - type: "paragraph"
    text: "A typical case is an agent that can use tools: read a calendar, search documents, create a draft. Whether these tools are connected via MCP or another way is a technical decision. For the benefit to the company it is secondary. What matters is which permissions they give the agent."  # prüfen: deliberately generic, not a report from our own operation; whether and where we use MCP ourselves is not documented and Christian would have to confirm
  - type: "link"
    text: "AI agents for companies"
    href: "/leistungen/ki-agenten-unternehmen"
  - type: "link"
    text: "All terms in the knowledge section"
    href: "/wissen"  # prüfen: hub /wissen only exists once the hub is built
  - type: "link"
    text: "What is an AI skill?"
    href: "/blog/ki-skill"
  - type: "link"
    text: "Human in the loop for AI"
    href: "/blog/human-in-the-loop"
---
