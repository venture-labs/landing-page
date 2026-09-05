import { useEffect } from "react";
import { LegalPage } from "@/app/components/LegalPage";
import { useLocale } from "@/app/locale";

function ImpressumDe() {
  return (
    <>
      <div>
        <h2>Angaben gemäß § 5 TMG</h2>
        <address>
          Venture Labs GmbH
          <br />
          Breite Str. 27
          <br />
          40213 Düsseldorf
          <br />
          Deutschland
        </address>
        <p className="mt-3">Vertreten durch den Geschäftsführer: Christian Wenzel</p>
      </div>

      <div>
        <h2>Kontakt</h2>
        <p>
          Telefon: +49 156 78 387064
          <br />
          E-Mail: <a href="mailto:contact@venturelabs.team">contact@venturelabs.team</a>
          <br />
          Web: <a href="https://venturelabs.team">venturelabs.team</a>
        </p>
      </div>

      <div>
        <h2>Registereintrag</h2>
        <p>
          Registergericht: Amtsgericht Düsseldorf
          <br />
          Registernummer: HRB 90623
        </p>
      </div>

      <div>
        <h2>Umsatzsteuer-ID</h2>
        <p>Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: DE 332848146</p>
      </div>

      <div>
        <h2>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
        <p>Christian Wenzel, Anschrift wie oben</p>
      </div>

      <div>
        <h2>1. Haftung für Inhalte</h2>
        <p>
          Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen
          Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet,
          übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf
          eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung von
          Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist
          jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von
          entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
        </p>
      </div>

      <div>
        <h2>2. Haftung für Links</h2>
        <p>
          Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben.
          Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten
          Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten
          wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum
          Zeitpunkt der Verlinkung nicht erkennbar. Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist
          jedoch ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von
          Rechtsverletzungen werden wir derartige Links umgehend entfernen.
        </p>
      </div>

      <div>
        <h2>3. Urheberrecht</h2>
        <p>
          Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen
          Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der
          Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
          Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.
        </p>
      </div>

      <p className="text-white/40" style={{ fontSize: "var(--text-small)" }}>
        Details zur Verarbeitung personenbezogener Daten finden Sie in unserer{" "}
        <a href="/de/datenschutz">Datenschutzerklärung</a>.
      </p>
    </>
  );
}

function ImpressumEn() {
  return (
    <>
      <div>
        <h2>Information according to § 5 TMG (German Telemedia Act)</h2>
        <address>
          Venture Labs GmbH
          <br />
          Breite Str. 27
          <br />
          40213 Düsseldorf
          <br />
          Germany
        </address>
        <p className="mt-3">Represented by the managing director: Christian Wenzel</p>
      </div>

      <div>
        <h2>Contact</h2>
        <p>
          Phone: +49 156 78 387064
          <br />
          Email: <a href="mailto:contact@venturelabs.team">contact@venturelabs.team</a>
          <br />
          Web: <a href="https://venturelabs.team">venturelabs.team</a>
        </p>
      </div>

      <div>
        <h2>Register entry</h2>
        <p>
          Registration court: District Court of Düsseldorf
          <br />
          Registration number: HRB 90623
        </p>
      </div>

      <div>
        <h2>VAT ID</h2>
        <p>VAT identification number according to § 27a of the German VAT Act: DE 332848146</p>
      </div>

      <div>
        <h2>Responsible for content pursuant to § 55 (2) RStV</h2>
        <p>Christian Wenzel, address as above</p>
      </div>

      <div>
        <h2>1. Liability for content</h2>
        <p>
          As a service provider, we are responsible for our own content on these pages in accordance with general
          law pursuant to § 7 (1) TMG. However, pursuant to §§ 8 to 10 TMG, we as a service provider are not
          obligated to monitor transmitted or stored third-party information or to investigate circumstances that
          indicate illegal activity. Obligations to remove or block the use of information under general law remain
          unaffected. Liability in this regard is only possible from the point in time at which knowledge of a
          specific infringement becomes known. Upon becoming aware of any such infringements, we will remove the
          relevant content immediately.
        </p>
      </div>

      <div>
        <h2>2. Liability for links</h2>
        <p>
          Our offer contains links to external third-party websites, over whose content we have no influence.
          Therefore, we cannot assume any liability for this external content. The respective provider or operator
          of the linked pages is always responsible for their content. The linked pages were checked for possible
          legal violations at the time of linking. No illegal content was identifiable at the time of linking.
          Permanent monitoring of the linked pages is not reasonable without concrete evidence of an infringement.
          We will remove such links immediately upon becoming aware of any infringements.
        </p>
      </div>

      <div>
        <h2>3. Copyright</h2>
        <p>
          The content and works created by the site operators on these pages are subject to German copyright law.
          Reproduction, editing, distribution, and any kind of use outside the limits of copyright law require the
          written consent of the respective author or creator. Downloads and copies of this page are only permitted
          for private, non-commercial use.
        </p>
      </div>

      <p className="text-white/40" style={{ fontSize: "var(--text-small)" }}>
        For details on the processing of personal data, see our{" "}
        <a href="/en/datenschutz">privacy policy</a>.
      </p>
    </>
  );
}

export function Impressum() {
  const { lang } = useLocale();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <LegalPage title={lang === "de" ? "Impressum" : "Imprint"}>
      {lang === "de" ? <ImpressumDe /> : <ImpressumEn />}
    </LegalPage>
  );
}
