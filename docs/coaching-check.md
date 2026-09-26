# Coaching-Check

Der Einstieg liegt unmittelbar nach dem bestehenden Hero auf der Startseite (`/#coaching-check`). Der Fragebogen öffnet als nativer modaler Dialog, ohne Fremdtool, neue öffentliche URL oder Seitenwechsel. Hero, Pakete, Canonicals und Sitemap bleiben erhalten.

## Zehn Schritte

1. Hauptziel
2. Trainingsschwerpunkt
3. Trainingsstand, einschliesslich Wettkampforientierung / Leistungssport
4. Lauf-/Wettkampfziel; alternativ Ausstattung, Ernährungsalltag oder Richtungsfrage
5. Kraftziel; alternativ Lauf-Schwerpunkt, Ernährungsschwerpunkt oder Hindernis
6. Trainingszeit
7. Bisherige Planung
8. Gewünschte Ernährungsunterstützung
9. Gewünschte Betreuung
10. Wichtigste Priorität

Frage 4 und 5 passen sich dem Schwerpunkt an. Eine ausdrückliche Trainingsauswahl hat Vorrang vor dem allgemeineren Hauptziel. Unpassende Folgeantworten werden bei einem Wechsel entfernt, kompatible Antworten bleiben erhalten. Schliessen/Escape unterbricht den Check; erneutes Öffnen setzt ihn innerhalb desselben Tabs fort. Neuladen löscht diesen Zwischenstand.

## Empfehlung und Premium

| Schwerpunkt | Beste Übereinstimmung |
|---|---|
| Laufen | Basic, CHF 179 / Monat |
| Laufen + Kraft / Hybrid | Basic Plus, CHF 249 / Monat |
| Laufen + Kraft + ausdrücklich gewünschte Ernährung | Premium, CHF 349 / Monat |
| Krafttraining | Kraftplan, CHF 149 / Monat |
| Nur Ernährung | Ernährung, CHF 149 / Monat |

Premium wird bei jedem Ergebnis angezeigt. Ohne entsprechenden Bedarf trägt es „Umfassendste Betreuung“, nicht „Beste Übereinstimmung“. Die Begründung nennt die zusätzlich enthaltenen, bisher nicht gewählten Bereiche. Die Bezeichnung bezieht sich auf den Leistungsumfang aus Laufen, Kraft und Ernährung, nicht auf zusätzliche Kontaktzeiten. Die bestehenden Betreuungsbedingungen bleiben unverändert.

Bis zu drei Optionen. Hoher Trainingsstand, viele Trainingsstunden oder Betreuungswunsch allein führen nicht zu Premium als bester Übereinstimmung. „Vielleicht“ bei Ernährung reicht ebenfalls nicht aus. Bei offenen oder widersprüchlichen Angaben wird keine beste Übereinstimmung erzwungen; das Paket kann im Erstgespräch geklärt werden. Bei Ernährungs-Hauptthema und passendem Körper-/Ernährungsziel kann Ernährung vorrangig sein.

Paketdaten stehen in `public/coaching-packages.js`; ein Test gleicht Namen, Preise und Leistungen mit den weiterhin crawlbaren Paketkarten ab.

## Formular und Datum

Die Übergabe wählt das Paket vor und ergänzt leere beziehungsweise zuvor automatisch ausgefüllte Felder (Ziel, Trainingsstand, Zeit, Laufziel, Kraftziel, Ausstattung, Ernährungsalltag). Eigene Änderungen werden nicht überschrieben. Empfehlung und tatsächliche Paketauswahl sind getrennt.

Zusätzliche Formulardaten:

- Coaching-Check: Abgeschlossen
- Beste Übereinstimmung
- Gewähltes Funnel-Paket (synchron zum aktuellen Paketfeld)
- Funnel-Antworten: lesbare Fragen und Antworten
- Funnel-Daten: JSON mit version, recommended, selected, alternatives und answers (id, question, answer)

Diese Daten gehen mit derselben FormSubmit-Anfrage wie die übrigen Felder heraus, nicht schon während des Checks. Der Nutzer kann sie einsehen und entfernen. Beim Entfernen werden unveränderte automatisch übernommene Werte auch aus dem Paket-Zwischenspeicher gelöscht; eigene Bearbeitungen bleiben erhalten. Erfolgreicher Versand setzt Formulardaten und Funnel-Zwischenstand zurück; Fehler erhalten die Angaben.

„Gewünschter Start“ verwendet einen nativen Datepicker (`type=date`). Minimum ist das heutige lokale Kalenderdatum, aktualisiert bei Fokus, Eingabe und Absenden. Der Versandwert ist ISO YYYY-MM-DD (z. B. 2026-10-15); die Anzeige richtet sich nach Browser und Sprache. Das Datum bleibt freiwillig. Keine physische iPhone-/Android-Geräteprüfung; native Steuerelemente und mobile Browseransicht wurden verwendet.

Die grosse E-Mail-Adresse im Kontaktbereich entfällt. Die sichtbare Mailadresse steht dezent im Footer der drei Marketingseiten; Impressum/Datenschutz behalten erforderliche Angaben. Der Formularfehler verweist auf den Footer.

## Datenschutz und Dashboard-Anschluss

Keine Gesundheitsfragen, Cookies, Local Storage oder neuen Drittanbieter-Tracker. Antworten verbleiben bis zur Formularübermittlung nur im Tab. Datenschutz- und Formularhinweise beschreiben die Übergabe. Die bisherigen offenen Betreiberangaben in der Datenschutzerklärung werden hierdurch nicht als geklärt ausgegeben.

Vorbereitete lokale DOM-Ereignisse über `tim:coaching-check`, jeweils version: 1:

- funnel_viewed
- funnel_started (resumed/restart)
- question_reached (step, question-ID)
- funnel_abandoned (step, reason: closed/escape/pagehide)
- funnel_completed (recommended)
- package_recommended (package)
- package_selected (package)
- consultation_opened (recommended, selected)
- request_submitted (package, recommended), nur nach bestätigter Annahme durch FormSubmit

Es gibt noch keinen Statistikempfänger und keine App-Anbindung. Ereignisse enthalten keine Kontaktangaben oder Antworten. Ein pagehide-Ereignis ist kein verlässlicher Nachweis jedes Abbruchs und wird derzeit nicht gespeichert. Für echte Statistiken braucht es später ein gesondertes Messkonzept und einen Empfänger.

Das Dashboard kann später aus einer tatsächlich abgesendeten Anfrage strukturierte Ziele, Schwerpunkt, Trainingsstand, Lauf-/Kraftziel, Zeit, Planung, Ernährung, Betreuung, Priorität, Empfehlung und gewähltes Paket übernehmen. Kontaktname, E-Mail und Startdatum stehen in den normalen Formularfeldern. Das JSON ist eine Eingabedatenstruktur, keine vertrauenswürdige Berechtigungs- oder Preisquelle; serverseitig validieren.

## Prüfung

35 automatisierte Tests inklusive fünf Pflichtszenarien, Premium-Matrix, adaptive Fragen, Datumssperre und tatsächlicher JSON-Erstellung im bestehenden Versandhandler mit kontrolliertem Testtransport. Browser: Desktop-Laufanfänger, mobiler Hybrid-Athlet mit Ernährung und mobiler Kraft-Pfad vollständig durchlaufen; Tastaturauswahl, Zurück, Paketwechsel, Übergabe und Datenentfernung geprüft. Kein echter Testversand an das Postfach durchgeführt. Bestehender FormSubmit-Endpunkt bleibt unverändert.
