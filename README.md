# TIM COACHING Website

Marketing-Website mit allen Bildern, Paketpreisen, dynamischem Fragebogen und Kontaktformular. Die Trainings-App läuft separat unter https://tim-coaching-app.timliam-schneider.chatgpt.site.

## Cloudflare Workers

Dieses Repository nutzt Workers Static Assets und einen kleinen Worker für bestehende App-Weiterleitungen. Es benötigt weder Next.js/OpenNext noch Vinext, D1 oder Supabase für die Auslieferung der Website.

Cloudflare Workers Builds:
- Repository: `vp5zyvty9j-hue/tim-coaching-website`
- Produktionsbranch: `main`
- Stammverzeichnis: `/`
- Build-Befehl: `pnpm run build` (optional; Wrangler führt die Prüfung ebenfalls aus)
- Deploy-Befehl: `pnpm run deploy` oder `npx wrangler deploy`
- Preview-Versionen, sofern aktiviert: `pnpm exec wrangler versions upload`

`wrangler.jsonc` liegt absichtlich im Repository. Dadurch startet Wrangler keine automatische Next.js-/OpenNext-Konfiguration mehr. Ein alter expliziter OpenNext-Befehl oder `--config dist/server/wrangler.json` muss in den Cloudflare-Build-Einstellungen durch die obigen Befehle ersetzt werden.

## Entwicklung und Prüfung

Node.js >= 22.13.0 und pnpm 11.25.0:

```sh
pnpm install --frozen-lockfile
pnpm run build
pnpm test
pnpm exec wrangler deploy --dry-run
pnpm dev
```

Der Build prüft lokale HTML-Verweise, Sprungmarken, strukturierte Daten und JavaScript-Syntax. Er erzeugt kein `.next`-Verzeichnis; Cloudflare lädt die Dateien aus `public/` direkt hoch.

## Dateien und Verhalten

- `public/`: Startseite, Impressum, Datenschutz, Logo, Trainingsbild, Styles, Skripte sowie robots.txt und llms.txt.
- `worker/index.mjs`: `/konto` und `/coach` leiten zur App-Verwaltung weiter; `/training` öffnet die App. Unbekannte URLs liefern 404.
- `scripts/check-site.mjs`: Prüfung vor dem Deployment.
- `tests/website.test.mjs`: Routing und Schutz vor Nutzung der entfernten Alt-APIs.

Die Website stellt keine eigenen Kundenkonten- oder Datenbank-APIs mehr bereit. Der zuvor ungenutzte App-, D1- und Framework-Code wurde aus diesem Website-Repository entfernt. Der Stand vor der Bereinigung bleibt unter `backup/before-cloudflare-cleanup-20260926` und in der Git-Historie erhalten. Die separate App und ihre Daten wurden nicht verändert.

## Externe Funktionen und offene Inhalte

Das Kontaktformular sendet an FormSubmit. Der Empfänger muss die Aktivierungsmail bestätigen. Eine lokal geprüfte Formularfunktion beweist keine E-Mail-Zustellung; dazu ist ein echter Versandtest mit Kontrolle des Empfängerpostfachs nötig. Bei Fehlern bleiben Eingaben erhalten.

Geschäftsadresse und rechtliche Pflichtangaben sind noch zu ergänzen. Rechnungsautomatisierung gehört nicht zu dieser Marketing-Website. Die Funktionsfähigkeit der separaten App und externer Dienste ist nicht Teil des Website-Builds.

Keine Zugangsschlüssel, echten Kundendaten oder lokalen Datenbanken committen.
