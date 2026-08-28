import { defineConfig } from "tinacms";

const branch =
  process.env.GITHUB_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD ||
  "main";

export default defineConfig({
  branch,
  clientId: process.env.TINA_CLIENT_ID || "local",
  token: process.env.TINA_TOKEN || "local",

  build: {
    outputFolder: "admin",
    publicFolder: "public",
    // Bind the local admin/GraphQL dev server to IPv4 too — by default it
    // only listens on the IPv6 loopback, which causes ERR_CONNECTION_REFUSED
    // on systems where "localhost" resolves to 127.0.0.1 first.
    host: "0.0.0.0",
  },
  media: {
    tina: {
      mediaRoot: "uploads",
      publicFolder: "public",
    },
  },

  schema: {
    collections: [
      {
        name: "site",
        label: "Website",
        path: "content/site",
        format: "md",
        match: { include: "home*" },
        ui: {
          allowedActions: { create: false, delete: false },
          router: ({ document }) => `/${document.language ?? "de"}`,
        },
        fields: [
          {
            type: "string",
            name: "language",
            label: "Sprache",
            options: ["de", "en"],
            required: true,
          },
          { type: "string", name: "heroHeadline", label: "Hero Headline" },
          { type: "string", name: "heroSubline", label: "Hero Subline", ui: { component: "textarea" } },
          { type: "string", name: "heroCta", label: "Hero CTA (primär)" },
          { type: "string", name: "heroCtaSecondary", label: "Hero CTA (sekundär)" },
          { type: "string", name: "clientLogosLabel", label: "Kundenlogos Label" },
        ],
      },
      {
        name: "service",
        label: "Leistungen",
        path: "content/services",
        format: "md",
        ui: {
          router: ({ document }) => `/${document.language ?? "de"}/leistungen/${document.slug}`,
        },
        fields: [
          { type: "string", name: "slug", label: "Slug", required: true },
          {
            type: "string",
            name: "language",
            label: "Sprache",
            options: ["de", "en"],
            required: true,
          },
          { type: "number", name: "order", label: "Reihenfolge" },
          { type: "string", name: "title", label: "Titel" },
          { type: "string", name: "description", label: "Kurzbeschreibung (Karte)", ui: { component: "textarea" } },
          { type: "string", name: "gradient", label: "Gradient (CSS)" },
          {
            type: "string",
            name: "icon",
            label: "Icon",
            options: ["code", "grid", "palette", "bot"],
          },
          { type: "string", name: "heroHeadline", label: "Detail: Hero Headline" },
          { type: "string", name: "heroSubline", label: "Detail: Hero Subline", ui: { component: "textarea" } },
          { type: "image", name: "heroImage", label: "Detail: Hero Bild" },
          { type: "string", name: "tags", label: "Übersicht: Bullet-Points (4 Stichpunkte)", list: true },
          {
            type: "object",
            name: "process",
            label: "Detail: Prozess-Schritte",
            list: true,
            fields: [
              { type: "string", name: "number", label: "Nummer" },
              { type: "string", name: "title", label: "Titel" },
              { type: "string", name: "description", label: "Beschreibung", ui: { component: "textarea" } },
            ],
          },
          { type: "string", name: "caseTitle", label: "Detail: Case Titel" },
          { type: "string", name: "caseSlug", label: "Detail: Case Slug" },
          { type: "string", name: "caseSubtitle", label: "Detail: Case Subtitle" },
          { type: "image", name: "caseImage", label: "Detail: Case Bild" },
          {
            type: "object",
            name: "caseStats",
            label: "Detail: Case Stats",
            list: true,
            fields: [
              { type: "string", name: "value", label: "Wert" },
              { type: "string", name: "label", label: "Label" },
            ],
          },
          { type: "string", name: "caseDescription", label: "Detail: Case Beschreibung", ui: { component: "textarea" } },
          { type: "string", name: "ctaHeadline", label: "Detail: CTA Headline" },
          { type: "string", name: "ctaBody", label: "Detail: CTA Text", ui: { component: "textarea" } },
        ],
      },
      {
        name: "case",
        label: "Cases",
        path: "content/cases",
        format: "md",
        ui: {
          router: ({ document }) => `/${document.language ?? "de"}/cases/${document.slug}`,
        },
        fields: [
          { type: "string", name: "slug", label: "Slug", required: true },
          {
            type: "string",
            name: "language",
            label: "Sprache",
            options: ["de", "en"],
            required: true,
          },
          { type: "number", name: "order", label: "Reihenfolge" },
          { type: "string", name: "title", label: "Titel" },
          { type: "string", name: "subtitle", label: "Subtitle", ui: { component: "textarea" } },
          { type: "boolean", name: "featured", label: "Featured (große Karte auf der Startseite)" },
          {
            type: "string",
            name: "imagePosition",
            label: "Bildposition (nur Featured)",
            options: ["left", "right"],
          },
          { type: "image", name: "image", label: "Karten-Bild" },
          { type: "string", name: "stats", label: "Karten-Stats (nur Featured)", list: true },
          { type: "string", name: "category", label: "Detail: Kategorie" },
          { type: "string", name: "heroHeadline", label: "Detail: Hero Headline" },
          { type: "string", name: "heroSubline", label: "Detail: Hero Subline", ui: { component: "textarea" } },
          { type: "image", name: "heroImage", label: "Detail: Hero Bild" },
          { type: "string", name: "description", label: "Detail: Beschreibung", ui: { component: "textarea" } },
          { type: "string", name: "background", label: "Detail: Hintergrund", ui: { component: "textarea" } },
          { type: "string", name: "problem", label: "Detail: Problem", ui: { component: "textarea" } },
          { type: "string", name: "solution", label: "Detail: Lösung", ui: { component: "textarea" } },
          {
            type: "object",
            name: "detailStats",
            label: "Detail: Ergebnis-Stats",
            list: true,
            fields: [
              { type: "string", name: "value", label: "Wert" },
              { type: "string", name: "label", label: "Label" },
            ],
          },
          { type: "image", name: "mockupImages", label: "Detail: Mockup-Bilder", list: true },
        ],
      },
      {
        name: "blog",
        label: "Blog",
        path: "content/blog",
        format: "md",
        ui: {
          router: ({ document }) => `/${document.language ?? "de"}/blog/${document.slug}`,
        },
        fields: [
          { type: "string", name: "slug", label: "Slug", required: true },
          {
            type: "string",
            name: "language",
            label: "Sprache",
            options: ["de", "en"],
            required: true,
          },
          { type: "number", name: "order", label: "Reihenfolge" },
          { type: "string", name: "title", label: "Titel" },
          { type: "string", name: "excerpt", label: "Teaser", ui: { component: "textarea" } },
          {
            type: "string",
            name: "topicSlug",
            label: "Themen-Slug",
            options: ["development", "company-building", "ui-ux", "ai-consulting"],
          },
          { type: "string", name: "topic", label: "Thema (Anzeigename)" },
          { type: "string", name: "readTime", label: "Lesezeit" },
          { type: "boolean", name: "featured", label: "Featured (große Karte)" },
          { type: "string", name: "publishedDate", label: "Veröffentlicht am" },
          { type: "string", name: "author", label: "Autor" },
          {
            type: "object",
            name: "content",
            label: "Artikel-Inhalt",
            list: true,
            fields: [
              {
                type: "string",
                name: "type",
                label: "Block-Typ",
                options: ["heading", "paragraph"],
              },
              { type: "string", name: "text", label: "Text", ui: { component: "textarea" } },
            ],
          },
        ],
      },
      {
        name: "leistungen",
        label: "Leistungen (Übersicht)",
        path: "content/site",
        format: "md",
        match: { include: "leistungen*" },
        ui: {
          allowedActions: { create: false, delete: false },
          router: ({ document }) => `/${document.language ?? "de"}/leistungen`,
        },
        fields: [
          {
            type: "string",
            name: "language",
            label: "Sprache",
            options: ["de", "en"],
            required: true,
          },
          { type: "string", name: "heroTitlePrefix", label: "Hero Title Prefix" },
          { type: "string", name: "heroTitleHighlight", label: "Hero Title Highlight" },
          { type: "string", name: "heroSubheading", label: "Hero Subheading", ui: { component: "textarea" } },
          { type: "string", name: "contactCallout", label: "Contact Callout", ui: { component: "textarea" } },
          { type: "string", name: "strengthHeadline", label: "Stärke-Box: Headline", ui: { component: "textarea" } },
          { type: "string", name: "strengthDescription", label: "Stärke-Box: Beschreibung", ui: { component: "textarea" } },
          {
            type: "object",
            name: "strengthFeatures",
            label: "Stärke-Box: Merkmale",
            list: true,
            fields: [
              {
                type: "string",
                name: "icon",
                label: "Icon",
                options: ["users", "layers", "zap", "handshake"],
              },
              { type: "string", name: "title", label: "Titel" },
              { type: "string", name: "subtitle", label: "Untertitel" },
            ],
          },
        ],
      },
      {
        name: "about",
        label: "Über uns",
        path: "content/about",
        format: "md",
        ui: {
          allowedActions: { create: false, delete: false },
          router: ({ document }) => `/${document.language ?? "de"}/ueber-uns`,
        },
        fields: [
          {
            type: "string",
            name: "language",
            label: "Sprache",
            options: ["de", "en"],
            required: true,
          },
          { type: "string", name: "heroTitle", label: "Hero: Titel" },
          { type: "string", name: "heroSubheading", label: "Hero: Subheading", ui: { component: "textarea" } },
          { type: "string", name: "missionTitle", label: "Mission: Titel" },
          { type: "string", name: "missionText", label: "Mission: Text", ui: { component: "textarea" } },
          { type: "string", name: "valuesTitle", label: "Values: Titel" },
          {
            type: "object",
            name: "valuesItems",
            label: "Values: Items",
            list: true,
            fields: [
              { type: "string", name: "title", label: "Titel" },
              { type: "string", name: "description", label: "Beschreibung", ui: { component: "textarea" } },
            ],
          },
          { type: "string", name: "processTitle", label: "Prozess: Titel" },
          {
            type: "object",
            name: "processSteps",
            label: "Prozess: Schritte",
            list: true,
            fields: [
              { type: "string", name: "number", label: "Nummer" },
              { type: "string", name: "title", label: "Titel" },
              { type: "string", name: "description", label: "Beschreibung", ui: { component: "textarea" } },
            ],
          },
          { type: "string", name: "teamTitle", label: "Team: Titel" },
          { type: "string", name: "teamDescription", label: "Team: Beschreibung", ui: { component: "textarea" } },
          { type: "string", name: "cta", label: "CTA Text" },
        ],
      },
    ],
  },
});
