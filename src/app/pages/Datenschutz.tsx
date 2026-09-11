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
      </div>

      <div>
        <h2>IV. Kontaktaufnahme</h2>
        <p>
          Das Kontaktformular auf dieser Seite verarbeitet Ihre Angaben ausschließlich lokal in Ihrem Browser. Beim
          Absenden öffnet sich Ihr eigenes E-Mail-Programm mit einer vorausgefüllten Nachricht an
          contact@venturelabs.team. Eine Übermittlung an unsere Server findet dabei nicht statt — wir erhalten nur
          die Angaben, die Sie anschließend aktiv per E-Mail versenden, und nutzen diese ausschließlich zur
          Bearbeitung Ihrer Anfrage. Rechtsgrundlage ist die Durchführung vorvertraglicher Maßnahmen auf Ihre
          Anfrage hin (Art. 6 Abs. 1 lit. b DSGVO).
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
        <h2>VI. Adobe Fonts</h2>
        <p>
          Diese Seite bindet Schriftarten über Adobe Fonts ein, einen Dienst der Adobe Inc. (345 Park Avenue, San
          Jose, CA 95110, USA). Beim Aufruf der Seite wird dazu eine Verbindung zu Servern von Adobe hergestellt,
          wobei Ihre IP-Adresse übertragen werden kann. Weitere Informationen:{" "}
          <a href="https://www.adobe.com/privacy/policy.html">adobe.com/privacy/policy.html</a>.
        </p>
      </div>

      <div>
        <h2>VII. Weitergabe an Dritte</h2>
        <p>
          Eine Weitergabe Ihrer Daten an Dritte erfolgt nur, soweit dies zur Erbringung der von Ihnen angefragten
          Leistung erforderlich ist — insbesondere an Netlify, Inc. als Hosting-Dienstleister (siehe Abschnitt III.)
          und Adobe Inc. im Rahmen der eingebundenen Schriftarten (siehe Abschnitt VI.) — oder wir gesetzlich dazu
          verpflichtet sind. Eine Verarbeitung Ihrer Daten in den USA findet im Rahmen dieser Verbindungen statt;
          beide Anbieter sind nach dem EU-U.S. Data Privacy Framework zertifiziert bzw. setzen
          EU-Standardvertragsklauseln ein.
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
      </div>

      <div>
        <h2>IV. Getting in touch</h2>
        <p>
          The contact form on this site processes your input entirely in your browser. On submission, it opens your
          own email application with a pre-filled message to contact@venturelabs.team. No data is transmitted to
          our servers in the process — we only receive the information you actively choose to send us afterwards by
          email, and use it solely to handle your inquiry. The legal basis is the performance of pre-contractual
          measures taken at your request (Art. 6(1)(b) GDPR).
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
        <h2>VI. Adobe Fonts</h2>
        <p>
          This site embeds typefaces via Adobe Fonts, a service of Adobe Inc. (345 Park Avenue, San Jose, CA 95110,
          USA). Loading the page establishes a connection to Adobe's servers, which may transmit your IP address.
          More information:{" "}
          <a href="https://www.adobe.com/privacy/policy.html">adobe.com/privacy/policy.html</a>.
        </p>
      </div>

      <div>
        <h2>VII. Disclosure to third parties</h2>
        <p>
          We only disclose your data to third parties where necessary to provide the service you requested — in
          particular to Netlify, Inc. as our hosting provider (see section III) and Adobe Inc. for the embedded
          fonts (see section VI) — or where we are legally required to do so. Your data is processed in the USA
          through these connections; both providers are certified under the EU-U.S. Data Privacy Framework and/or
          apply EU Standard Contractual Clauses.
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
