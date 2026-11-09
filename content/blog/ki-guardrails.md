---
slug: "ki-guardrails"
language: "de"
seoTitle: 'KI-Guardrails: Sperren statt Bitten im Prompt – Venture Labs'
seoDescription: 'KI-Guardrails sind technische Sperren und Rechte, die ein Agent nicht umgehen kann. Warum sie mehr leisten als Anweisungen im Prompt, mit Beispiel.'
order: 67
title: "KI-Guardrails: Sperren statt Bitten"
excerpt: "KI-Guardrails sind technische Sperren und Rechte, die ein Agent nicht umgehen kann. Warum sie mehr leisten als Anweisungen im Prompt, mit Beispiel."
topicSlug: "ai-automation"
topic: "AI Automation"
readTime: "2 Min. Lesezeit"
featured: false
publishedDate: "11. Januar 2027"  # prüfen: Veröffentlichungsdatum setzt Christian beim Go-live; Jahr 2027 aus «Woche 9 · 11.01.» abgeleitet
author: "VentureLabs Team"
draft: true
kind: "glossar"
plannedUrl: "/de/wissen/ki-guardrails/"
week: "Woche 9 · 11.01."
keyword: "ki guardrails"
# video: Folge 5 «Rechte statt Text» (noch nicht gedreht)
content:
  - type: "paragraph"
    text: "KI-Guardrails sind Schutzgrenzen um einen KI-Agenten, die technisch durchgesetzt werden: Rechte, fehlende Werkzeuge, Freigaben und Prüfungen. Die Wirkung hängt nicht davon ab, was das Modell verstanden hat."
  - type: "heading"
    text: "Wann was: Sperre oder Anweisung"
  - type: "paragraph"
    text: "Eine Anweisung im Prompt ist eine Bitte, an die sich ein Modell meistens hält. Eine Sperre entscheidet dagegen, was der Agent überhaupt kann. Wo ein Fehler teuer wäre oder nach außen ginge, gehört die Grenze in die Rechte und nicht in den Text."
  - type: "heading"
    text: "Ein Beispiel aus unserem eigenen Betrieb"
  - type: "paragraph"
    text: "Ein Agent in unserem Betrieb sollte eine neue Software-Version freigeben und konnte es nicht, weil es für ihn kein Werkzeug «Version freigeben» gab. Ein Satz im Prompt wie «alles ist erlaubt» hätte daran nichts geändert. Die Lösung ist ein eigenes Werkzeug, das jede Freigabe protokolliert und eine menschliche Zustimmung verlangt."  # prüfen: Fall «fehlendes Werkzeug» vom 06.11.2026 (Quelle: Playbook-Entwurf artikel-playbook-agent-rolle.md); damals Stand «Lücke gefunden, Werkzeug in Arbeit», aktuellen Stand lesen und «Stand: …» ergänzen; Christian gibt die Geschichte frei
  - type: "heading"
    text: "Wo das im Unternehmen hilft"
  - type: "paragraph"
    text: "Guardrails entscheiden, ob ein Agent im Betrieb eingesetzt werden kann: Er bekommt nur die Ordner, Werkzeuge und Schlüssel, die seine Aufgabe braucht, und jede Handlung nach außen läuft über eine Freigabe."
  - type: "link"
    text: "KI-Agenten im Unternehmen einsetzen"
    href: "/leistungen/ki-agenten-unternehmen"
  - type: "link"
    text: "Alle Begriffe im Wissensbereich"  # prüfen: Hub /wissen existiert erst nach dem Hub-Bau
    href: "/wissen"
  - type: "link"
    text: "Verwandt: Rechte statt Text"
    href: "/blog/rechte-statt-text"
  - type: "link"
    text: "Verwandt: Human in the Loop"
    href: "/blog/human-in-the-loop"
  - type: "link"
    text: "Verwandt: Playbook, Rolle oder eigener Agent"
    href: "/blog/playbook-agent-rolle"
---
