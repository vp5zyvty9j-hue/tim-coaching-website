# Google Search Console – timschneider.ch

## Einmalige Bestätigung

1. https://search.google.com/search-console öffnen und mit dem Google-Konto anmelden, das die Website verwalten soll.
2. Oben links die Property-Auswahl öffnen → „Property hinzufügen“.
3. „Domain“ wählen, `timschneider.ch` (ohne https:// und ohne Pfad) eingeben → „Weiter“.
4. Falls Google eine automatische Cloudflare-Bestätigung anbietet, den angezeigten Ablauf mit dem eigenen Cloudflare-Konto durchführen. Andernfalls den von Google erzeugten TXT-Wert kopieren.
5. Für die manuelle Variante: Cloudflare → timschneider.ch → DNS → Records/Einträge → Add record/Eintrag hinzufügen. Typ TXT, Name @, Inhalt exakt der Google-Wert `google-site-verification=…`, TTL Auto → Speichern. Bestehende TXT-Einträge, insbesondere SPF, nicht ersetzen.
6. Zu Search Console zurückkehren → „Bestätigen“. Falls Google den Eintrag noch nicht findet, nach DNS-Verteilung erneut versuchen. Den TXT-Eintrag dauerhaft stehen lassen.

Die Website allein kann die Domain-Property nicht bestätigen; Google muss den kontospezifischen Nachweis ausstellen. Es wurde kein Verifizierungscode erfunden und keine DNS-/Cloudflare-Kontoeinstellung verändert.

## Sitemap einreichen

Nach Bestätigung die Property `timschneider.ch` auswählen → „Sitemaps“ → „Neue Sitemap hinzufügen“ → `https://timschneider.ch/sitemap.xml` eintragen → „Senden“. Zeigt die Oberfläche bereits die Domain vor dem Eingabefeld, nur `sitemap.xml` eintragen. Danach den Status prüfen; „Erfolgreich“ bedeutet, dass Google die Sitemap lesen konnte, nicht dass jede URL indexiert ist.

## Erneute Indexierung beantragen

Oben in die URL-Prüfung `https://timschneider.ch/` eingeben → Enter → „Live-URL testen“. Bei erfolgreichem Test „Indexierung beantragen“ wählen. Entsprechend bei Bedarf für `/erfolge.html` und `/empfehlungen.html` vorgehen. Das Favicon wird über die neu gecrawlte Startseite entdeckt; es gibt keine separate garantierte Sofort-Aktualisierung des Symbols.

Unter „Seiten“ und „Core Web Vitals“ später Indexierungsgründe bzw. verfügbare Felddaten kontrollieren. Wiederholte Anträge beschleunigen die Verarbeitung nicht garantiert. Crawling, Indexierung, Darstellung von Titel/Snippet und Favicon entscheidet Google.

## Technischer Stand

- Hauptadresse und Canonicals: https://timschneider.ch/; Inhaltsseiten behalten ihre .html-URLs.
- Alternative Seitenpfade werden per 308 auf die Canonical-URL geleitet. Alternative Hosts, die tatsächlich diesen Worker erreichen, gehen auf timschneider.ch. Die bisher unverbundene www-Adresse benötigt weiterhin eine separate Cloudflare-Verbindung; Code allein verbindet keine Domain.
- Sitemap enthält alle drei indexierbaren HTML-Seiten. Impressum und Datenschutz sind öffentlich erreichbar, aber bewusst noindex.
- Favicon aus bestehendem TIM-SCHNEIDER-Logo: ICO mit 16/32/48 px, PNG 48/96 px, Apple Touch Icon 180 px, Browser-Icons 192/512 px. Kein neues Logo generiert.
- Keine erfundenen Bewertungen, Qualifikationen oder Unternehmensstandorte in Schema.org ergänzt.
- Mobile Darstellung und Routing werden geprüft. Die öffentliche PageSpeed-API meldete beim Versuch einen Quotenfehler; keine bestätigten Core-Web-Vitals-Feldwerte oder Lighthouse-Punktzahlen daraus ableitbar.

Offizielle Anleitungen:
- https://support.google.com/webmasters/answer/9008080
- https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl
- https://developers.google.com/search/docs/appearance/favicon-in-search
