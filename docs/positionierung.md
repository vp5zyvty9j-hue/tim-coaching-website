# Ausdauer × Kraft × Athletik

Die Startseite positioniert das Coaching über Ausdauer, Kraft und Athletik. Laufen bleibt ein konkreter Schwerpunkt, kein Synonym für alle Ausdauersportarten. Andere Sportarten werden im Erstgespräch auf Eignung abgeklärt; keine zusätzlichen Spezialisierungen werden behauptet.

## Spätere Inhaltsarchitektur

Die bestehende Paketübersicht unter /#coaching und das Erstgespräch unter /#contact bleiben zentrale Ziele. Neue eigenständige Seiten können über den bestehenden Static-Assets-Worker ergänzt werden. Jede Seite erhält eigene Inhalte, einen eindeutigen Canonical, Titel, Beschreibung und einen Link zur passenden Beratung. scripts/check-seo.mjs erstellt die Sitemap aus den indexierbaren HTML-Seiten. Für neue sprechende URLs müssen die bestehenden Worker-Aliase ausdrücklich erweitert und getestet werden. Noch keine leeren Routen oder Sitemap-Einträge anlegen.

- /ausdauer-coaching: Übergeordnete Betreuung, Planung, Belastungssteuerung und Grenzen des Angebots.
- /laufcoaching: Konkretes Lauftraining, Laufplan und Halbmarathon-/Marathonvorbereitung als Unterthema von Ausdauer.
- /hybrid-coaching: Abstimmung von Ausdauer, Kraft und Regeneration.
- /krafttraining: Kraftentwicklung und Muskelaufbau.
- /wettkampfvorbereitung: Zielplanung, Trainingsphasen und Betreuung im angebotenen Sportbereich.

Jede Seite braucht eine eigene Suchintention und substanziellen, fachlich belegbaren Inhalt. Keine duplizierten Orts- oder Sportartseiten. Bestehende Fotos und Laufleistungen bleiben unverändert.
