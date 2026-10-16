import { useEffect } from "react";
import { LegalPage } from "@/app/components/LegalPage";
import { useLocale } from "@/app/locale";

function DatenschutzDe() {
  return (
    <>
      <p>Diese Erklärung gilt für die Website venturelabs.team.</p>

      <div>
        <h2>I. Verantwortlicher</h2>
        <address>
          Venture Labs GmbH
          <br />
          Breite Str. 27, 40213 Düsseldorf
          <br />
          E-Mail: <a href="mailto:contact@venturelabs.team">contact@venturelabs.team</a>
          <br />
          — weitere Angaben siehe <a href="/de/impressum">Impressum</a>.
        </address>
      </div>

      <div>
        <h2>II. Externer Datenschutzbeauftragter</h2>
        <address>
          Martin Wagner
          <br />
          c/o EKP Engel, Kronenberg &amp; Partner Steuerberater/Rechtsanwälte mbB
          <br />
          Am Dieken 57, 40885 Ratingen
          <br />
          Telefon: +49 2102 3027 0
          <br />
          Web: <a href="https://www.e-k-p.de/">e-k-p.de</a>
        </address>
      </div>

      <div>
        <h2>III. Allgemeine Nutzung der Website</h2>
        <p>
          Diese Seite wird bei Netlify, Inc. (101 2nd Street, San Francisco, CA 94105, USA) gehostet. Beim rein
          informatorischen Besuch dieser Seite erheben wir selbst keine personenbezogenen Daten. Technisch bedingt
          kann Ihr Browser automatisch bestimmte Informationen an Netlify als Hosting-Anbieter übertragen (u. a.
          Datum und Uhrzeit des Zugriffs, Browsertyp, Betriebssystem, IP-Adresse). Diese Daten dienen ausschließlich
          der technischen Bereitstellung der Seite. Netlify verarbeitet auf Grundlage eines
          Auftragsverarbeitungsvertrags nach Art. 28 DSGVO und ist nach dem EU-U.S. Data Privacy Framework (inkl.
          UK- und Swiss-U.S.-Erweiterung) zertifiziert; ergänzend werden EU-Standardvertragsklauseln (Beschluss
          2021/914 der EU-Kommission) eingesetzt.
        </p>
        <p>
          Eine Terminbuchung über den Buchungslink dieser Seite führt zu Google Calendar (Google Ireland Limited),
          einem eigenständigen Angebot von Google. Dieser Link wird erst beim aktiven Anklicken aufgerufen; bis
          dahin findet keine Verbindung zu Google statt. Für die Terminbuchung selbst gelten die Datenschutzhinweise
          von Google.
        </p>
      </div>

      <div>
        <h2>IV. Kontaktaufnahme</h2>
        <p>
          Das Kontaktformular sowie das optionale E-Mail-Feld im Ergebnis des AI Pulse Score auf dieser Seite werden
          über Netlify Forms verarbeitet, eine Funktion unseres Hosting-Anbieters Netlify, Inc. (siehe Abschnitt
          III.). Beim Absenden werden die eingegebenen Angaben (beim Kontaktformular u. a. Name, E-Mail-Adresse und
          Nachricht; beim Pulse-Score-Feld die E-Mail-Adresse sowie das Testergebnis) direkt an Netlify übermittelt
          und dort gespeichert, bis wir sie im Netlify-Dashboard löschen; eine Übermittlung an unsere eigenen Server
          findet nicht statt. Rechtsgrundlage ist die Durchführung vorvertraglicher Maßnahmen auf Ihre Anfrage hin
          (Art. 6 Abs. 1 lit. b DSGVO) bzw., beim Pulse-Score-Feld, Ihre ausdrückliche Einwilligung (Art. 6 Abs. 1
          lit. a DSGVO), die Sie beim Absenden erteilen.
        </p>
      </div>

      <div>
        <h2>V. Cookies</h2>
        <p>Diese Seite setzt keine eigenen Analyse- oder Marketing-Cookies.</p>
        <p>
          Zur Reichweitenmessung kommt Plausible Analytics zum Einsatz — ein cookiefreier Webanalyse-Dienst mit
          Serverstandort in der EU, der keine personenbezogenen Daten speichert und keine geräteübergreifenden
          Profile bildet (Art. 6 Abs. 1 lit. f DSGVO).
        </p>
      </div>

      <div>
        <h2>VI. Schriftarten</h2>
        <p>
          Die auf dieser Seite verwendete Schriftart (Figtree) ist selbst gehostet und wird direkt von unserem
          eigenen Server bzw. von Netlify ausgeliefert (siehe Abschnitt III.). Es wird keine Verbindung zu einem
          externen Schriftarten-Dienst aufgebaut; beim Laden der Schriftart werden keine Daten an Dritte
          übertragen.
        </p>
      </div>

      <div>
        <h2>VII. Weitergabe an Dritte</h2>
        <p>
          Eine Weitergabe Ihrer Daten an Dritte erfolgt nur, soweit dies zur Erbringung der von Ihnen angefragten
          Leistung erforderlich ist — insbesondere an Netlify, Inc. als Hosting-Dienstleister und für die
          Verarbeitung der beiden Formulare über Netlify Forms (siehe Abschnitte III. und IV.) — oder wir gesetzlich
          dazu verpflichtet sind. Die eingebundene Schriftart (siehe Abschnitt VI.) ist selbst gehostet und
          begründet keine Weitergabe an Dritte. Eine Verarbeitung Ihrer Daten in den USA findet im Rahmen der
          Netlify-Verbindung statt; Netlify ist nach dem EU-U.S. Data Privacy Framework zertifiziert bzw. setzt
          EU-Standardvertragsklauseln ein. Beim Anklicken des Buchungslinks (siehe Abschnitt III.) findet zudem eine
          Verbindung zu Google Calendar statt.
        </p>
      </div>

      <div>
        <h2>VIII. Ihre Rechte</h2>
        <p>
          Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung,
          Datenübertragbarkeit sowie Widerspruch gegen die Verarbeitung Ihrer personenbezogenen Daten. Wenden Sie
          sich hierzu an <a href="mailto:contact@venturelabs.team">contact@venturelabs.team</a> oder unseren
          Datenschutzbeauftragten (siehe oben). Ihnen steht zudem ein Beschwerderecht bei einer
          Datenschutzaufsichtsbehörde zu, z. B. beim Landesbeauftragten für Datenschutz und Informationsfreiheit
          Nordrhein-Westfalen.
        </p>
      </div>

      <div>
        <h2>IX. Datensicherheit</h2>
        <p>Die Übertragung Ihrer Daten erfolgt verschlüsselt über SSL/TLS (https).</p>
      </div>

      <p className="text-white/40" style={{ fontSize: "var(--text-small)" }}>
        Stand: September 2026
      </p>
    </>
  );
}

function DatenschutzEn() {
  return (
    <>
      <p>This policy covers the website venturelabs.team.</p>

      <div>
        <h2>I. Controller</h2>
        <address>
          Venture Labs GmbH
          <br />
          Breite Str. 27, 40213 Düsseldorf, Germany
          <br />
          Email: <a href="mailto:contact@venturelabs.team">contact@venturelabs.team</a>
          <br />
          — see our <a href="/en/impressum">imprint</a> for further details.
        </address>
      </div>

      <div>
        <h2>II. External Data Protection Officer</h2>
        <address>
          Martin Wagner
          <br />
          c/o EKP Engel, Kronenberg &amp; Partner Steuerberater/Rechtsanwälte mbB
          <br />
          Am Dieken 57, 40885 Ratingen, Germany
          <br />
          Phone: +49 2102 3027 0
          <br />
          Web: <a href="https://www.e-k-p.de/">e-k-p.de</a>
        </address>
      </div>

      <div>
        <h2>III. General use of the website</h2>
        <p>
          This site is hosted by Netlify, Inc. (101 2nd Street, San Francisco, CA 94105, USA). We do not collect
          personal data ourselves for purely informational visits to this site. For technical reasons, your browser
          may automatically transmit certain information to Netlify as our hosting provider (including date and
          time of access, browser type, operating system, and IP address). This data is used solely to technically
          deliver the site. Netlify processes this under a data processing agreement pursuant to Art. 28 GDPR and is
          certified under the EU-U.S. Data Privacy Framework (including its UK and Swiss-U.S. extensions); EU
          Standard Contractual Clauses (European Commission Decision 2021/914) apply as an additional safeguard.
        </p>
        <p>
          Booking an appointment via this site's booking link takes you to Google Calendar (Google Ireland
          Limited), a separate Google service. That link is only called up when you actively click it; no
          connection to Google is made before that. Google's own privacy notices apply to the booking itself.
        </p>
      </div>

      <div>
        <h2>IV. Getting in touch</h2>
        <p>
          The contact form and the optional email field in the AI Pulse Score result on this site are processed via
          Netlify Forms, a feature of our hosting provider Netlify, Inc. (see section III). On submission, the
          information you enter (for the contact form: name, email address and message, among others; for the
          Pulse Score field: your email address and your test result) is sent directly to Netlify and stored there
          until we delete it from the Netlify dashboard; no data is transmitted to our own servers. The legal basis
          is the performance of pre-contractual measures taken at your request (Art. 6(1)(b) GDPR) or, for the
          Pulse Score field, your explicit consent (Art. 6(1)(a) GDPR), given on submission.
        </p>
      </div>

      <div>
        <h2>V. Cookies</h2>
        <p>This site does not set its own analytics or marketing cookies.</p>
        <p>
          Traffic statistics are collected with Plausible Analytics, a cookie-free, EU-hosted web analytics service
          that stores no personal data and builds no cross-device profiles (Art. 6(1)(f) GDPR).
        </p>
      </div>

      <div>
        <h2>VI. Fonts</h2>
        <p>
          The typeface used on this site (Figtree) is self-hosted and served directly from our own server or from
          Netlify (see section III). No connection is made to an external font service; loading the typeface
          transmits no data to a third party.
        </p>
      </div>

      <div>
        <h2>VII. Disclosure to third parties</h2>
        <p>
          We only disclose your data to third parties where necessary to provide the service you requested — in
          particular to Netlify, Inc. as our hosting provider and for processing both forms via Netlify Forms (see
          sections III and IV) — or where we are legally required to do so. The embedded typeface (see section VI)
          is self-hosted and involves no disclosure to third parties. Your data is processed in the USA through
          this connection; Netlify is certified under the EU-U.S. Data Privacy Framework and/or applies EU Standard
          Contractual Clauses. Clicking the booking link (see section III) also establishes a connection to Google
          Calendar.
        </p>
      </div>

      <div>
        <h2>VIII. Your rights</h2>
        <p>
          You have the right to access, rectification, erasure, restriction of processing, data portability, and
          objection regarding your personal data. Contact{" "}
          <a href="mailto:contact@venturelabs.team">contact@venturelabs.team</a> or our data protection officer
          (above). You also have the right to lodge a complaint with a supervisory authority, e.g. the North
          Rhine-Westphalia data protection authority.
        </p>
      </div>

      <div>
        <h2>IX. Data security</h2>
        <p>Your data is transmitted in encrypted form via SSL/TLS (https).</p>
      </div>

      <p className="text-white/40" style={{ fontSize: "var(--text-small)" }}>
        Last updated: September 2026
      </p>
    </>
  );
}

export function Datenschutz() {
  const { lang } = useLocale();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <LegalPage title={lang === "de" ? "Datenschutzerklärung" : "Privacy Policy"}>
      {lang === "de" ? <DatenschutzDe /> : <DatenschutzEn />}
    </LegalPage>
  );
}
