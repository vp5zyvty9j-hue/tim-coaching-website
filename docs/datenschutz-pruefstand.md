# Datenschutz-Prüfstand – 26.09.2026

Keine anwaltliche Rechtsberatung, keine Konformitätsbescheinigung. Geprüft: Website-Repository und öffentlich verfügbare Rechts-/Anbieterquellen. Nicht geprüft: tatsächliches Cloudflare-Konto, Google-Vertrag, App-Backend, E-Mail-Zustellung, operative Löschungen.

## Umgesetzt

- Unzutreffende Angaben zur ChatGPT-Anmeldung, D1-Kundenverwaltung und künftigen Rechnungsfunktionen aus der Website-Erklärung entfernt.
- Erklärung an den vorhandenen Datenfluss angepasst: Browser → FormSubmit → Gmail; Hosting Cloudflare; separate App nur verlinkt.
- Gewicht und KFA nicht mehr abgefragt; Sporterfahrung und Trainingszeit freiwillig.
- Erzwungene pauschale Datenschutz-Zustimmung durch einen direkt sichtbaren Verarbeitungshinweis ersetzt. Ein Kontaktauftrag ist keine Werbeeinwilligung.
- Browserseitig keine FormSubmit-Cookies/Zugangsdaten und kein Referrer im AJAX-Request; Referrer-Policy auch in HTML und Cloudflare-Headern.
- Nach Formular-Reset auch zwischengespeicherte Paketantworten aus dem JS-Arbeitsspeicher entfernt.
- Angaben zu Rechtsgrundlagen, Zweckbindung, Rechten und offenen Punkten ergänzt; keine erfundenen Adressen, Vertragsabschlüsse, Länderlisten oder Zertifizierungen.

## Vor abschliessender Freigabe vom Inhaber zu klären

1. Vollständiger rechtlicher Name, genaue Firma, Geschäftsanschrift, Sitz, Telefon (falls veröffentlicht), Handelsregisterstelle/-eintrag, UID und MWST-Status. Nicht vorhandene Einträge ausdrücklich als nicht vorhanden bestätigen; nichts erfinden.
2. Tatsächliche öffentliche Website-URL; separate App-URL; Angebot nur Schweiz oder gezielt EU/EWR? Bei EU-Angeboten Art. 3 und gegebenenfalls Vertretung nach Art. 27 DSGVO prüfen.
3. Kundenalter und Coaching-Leistungen: Erwachsene/Minderjährige; Umgang mit Gesundheitsdaten, Ernährungsprotokollen und Fotos separat festlegen. Das Entfernen einzelner Felder verhindert keine freiwillige Eingabe sensibler Daten in Freitext.
4. Cloudflare-Vertragspartner, DPA, aktivierte Analyse-/Logging-/Sicherheitsfunktionen, Unterauftragsbearbeiter und Länder. Den Einsatz von Standardvertragsklauseln oder DPF nicht ohne konkrete Prüfung behaupten.
5. FormSubmit: Anbieteridentität, Auftragsbearbeitungsvereinbarung, Unterauftragnehmer, Verarbeitungsstaaten, Übermittlungsgrundlagen, Lösch- und Backupfristen. Die am Prüftag gelesene öffentliche Erklärung beantwortet diese Punkte nicht hinreichend. Falls nicht belegbar, Anbieter vor Datenschutzfreigabe ersetzen.
6. Gmail: privates Google-Konto oder geeigneter Workspace-Vertrag? Aktueller Vertragspartner, geschäftliche Eignung/AVV und tatsächliche Zugriffe klären. Keine Behauptung, ein Gmail-Konto sei ohne weitere Prüfung zulässig oder unzulässig.
7. Löschkonzept tatsächlich umsetzen, inklusive E-Mail-Archiv, Spam, Backups, Formularanbieter und Anfragen ohne Vertrag. Vorschlag zur Prüfung: solche Anfragen 90 Tage nach Abschluss löschen, wenn kein anderer dokumentierter Aufbewahrungsgrund besteht. Das ist eine vorgeschlagene Betriebsregel, keine gesetzliche Standardfrist und derzeit nicht automatisiert.
8. Website-/App-Zugriffsberechtigte, Mehrfaktor-Anmeldung, Geräte-/Passwortschutz, Auskunfts- und Löschablauf sowie Reaktion auf Datenschutzvorfälle dokumentieren. Aufbewahrungspflichten für Rechnungen getrennt von Kontaktanfragen behandeln.
9. Vor Verkäufen Vertrag/AGB, Leistungsumfang, Kündigung, Preis-/Steuerdarstellung, Haftung, Berufsqualifikation und gegebenenfalls EU-Verbraucherinformationen prüfen. Kein universeller Haftungsausschluss ergänzt.

## Double-Opt-in / E-Mail-Bestätigung

Die Website hat ein Kontaktformular, kein Newsletter- oder eigenes Kontoregistrierungsformular. Eine Kontaktanfrage begründet keine Newsletter-Einwilligung. Die FormSubmit-Aktivierung bestätigt das Betreiberpostfach, nicht die Adresse jedes Interessenten.

Die DSGVO schreibt nicht pauschal Double-Opt-in für jedes Formular vor. Für E-Mail-Werbung muss eine einschlägige Erlaubnis vorliegen und erforderliche Einwilligung nachweisbar sein. Ein sauber eingerichtetes DOI-Verfahren ist dafür ein zweckmässiges Nachweisverfahren. Bestätigung eines App-Kontos ist davon zu unterscheiden und erlaubt keine Werbung.

Wenn Newsletter oder bestätigungspflichtige Anfragen gewünscht sind, braucht es vor Aktivierung:
- festgelegten Zweck und vollständigen transparenten Einwilligungstext;
- freigegebenen Versanddienst/Vertrag, authentifizierte Absenderdomain und sichere serverseitige Konfiguration;
- unbestätigten Status, zufälligen einmaligen Bestätigungstoken mit Ablauf, serverseitige Bestätigung und Schutz gegen Missbrauch;
- Nachweis von Erklärungsversion, Anmeldung und Bestätigung bei begrenzter Aufbewahrung; keine unnötigen Daten sammeln;
- bis zur Bestätigung keinen Werbeversand, jederzeitige Abmeldung und dokumentierte Löschung abgelaufener Anmeldungen;
- End-to-End-Test für Anmeldung, Bestätigung, Ablauf, Wiederverwendung, Abmeldung und Rechteprüfung.

Nichts davon wird als bereits eingerichtetes DOI dargestellt. In der separaten App müssen E-Mail-Bestätigung im Backend und Sperre unbestätigter Konten mit echten Testkonten geprüft werden. Die App wurde hier nicht verändert.

## Quellen

- DSGVO (insbesondere Art. 3, 5, 6, 7, 9, 13, 15–21, 27, 28, 32, 44 ff.): https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32016R0679
- EDÖB Informationspflicht: https://www.edoeb.admin.ch/de/informationspflicht
- EDÖB Ausland: https://www.edoeb.admin.ch/de/bekanntgabe-von-personendaten-ins-ausland
- EDÖB Werbung: https://www.edoeb.admin.ch/de/werbung-marketing
- SECO/KMU E-Commerce: https://www.kmu.admin.ch/de/die-gesetze-der-schweiz-und-der-eu
- FormSubmit: https://formsubmit.co/privacy.pdf und https://formsubmit.co/
- Cloudflare DPA: https://www.cloudflare.com/cloudflare-customer-dpa/

Anbieterseiten sind Eigenaussagen und beweisen weder einen Vertrag mit Tim noch die konkrete Konfiguration.
