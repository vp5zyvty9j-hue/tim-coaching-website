# TIM COACHING Website

Marketing-Website mit allen Bildern, Paketpreisen, dynamischem Fragebogen und Kontaktformular. Die Trainings-App läuft separat unter https://tim-coaching-app.timliam-schneider.chatgpt.site.

## Cloudflare Workers

Dieses Repository nutzt Workers Static Assets und einen Worker für HTTPS, Sicherheitsheader und bestehende App-Weiterleitungen. Es benötigt weder Next.js/OpenNext noch Vinext, D1 oder Supabase für die Auslieferung der Website.

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

- `public/`: Startseite, Erfolge, Empfehlungen, Impressum, Datenschutz, freigegebene Fotos, Styles, Skripte sowie robots.txt, sitemap.xml und llms.txt.
- `worker/index.mjs`: `/konto` und `/coach` leiten zur App-Verwaltung weiter; `/training` öffnet die App. Unbekannte URLs liefern 404.
- `scripts/check-site.mjs`: Prüfung vor dem Deployment.
- `tests/website.test.mjs`: Routing und Schutz vor Nutzung der entfernten Alt-APIs.

Die Website stellt keine eigenen Kundenkonten- oder Datenbank-APIs mehr bereit. Der zuvor ungenutzte App-, D1- und Framework-Code wurde aus diesem Website-Repository entfernt. Der Stand vor der Bereinigung bleibt unter `backup/before-cloudflare-cleanup-20260926` und in der Git-Historie erhalten. Die separate App und ihre Daten wurden nicht verändert.

## Externe Funktionen und offene Inhalte

Das Kontaktformular sendet an FormSubmit. Der Empfänger muss die Aktivierungsmail bestätigen. Eine lokal geprüfte Formularfunktion beweist keine E-Mail-Zustellung; dazu ist ein echter Versandtest mit Kontrolle des Empfängerpostfachs nötig. Die CAPTCHA-Prüfung und Versandbestätigung öffnen in einem neuen Tab bei FormSubmit. Das Ausgangsformular behält seine Eingaben; es zeigt keine unbestätigte Erfolgsmeldung.

Die bestätigte Geschäftsadresse ist eingetragen; offene Datenschutz-/Anbieterfragen stehen in docs/datenschutz-pruefstand.md. Rechnungsautomatisierung gehört nicht zu dieser Marketing-Website. Die Funktionsfähigkeit der separaten App und externer Dienste ist nicht Teil des Website-Builds.

Keine Zugangsschlüssel, echten Kundendaten oder lokalen Datenbanken committen.

## Sicherheitsfreigabe 26.09.2026

- Übernahme des gespeicherten Work-Quellstands fd79fcd, abgeglichen gegen main e4a27b5. Bereits vorhandene Dateien unverändert erhalten, soweit kein beauftragtes Update vorlag.
- HTTP wird vor jeder produktiven Route auf HTTPS umgeleitet, einschliesslich statischer Assets (`run_worker_first`). Lokal bleibt HTTP für Entwicklung möglich.
- CSP mit Hashes für JSON-LD, HSTS nur für den jeweiligen Host, Frame-/MIME-/Permissions-Schutz. Header werden bei Build aus `scripts/security-headers.mjs` generiert.
- Normale FormSubmit-Übermittlung mit Anbieter-CAPTCHA, Honeypot und expliziter Formular-URL. Kein eigener serverseitiger Rate Limiter; Provider-Endpunkte bleiben ausserhalb unserer Kontrolle.
- Keine Cloudflare-Domain-Einstellungen geändert. www.timschneider.ch muss separat verbunden bzw. weitergeleitet werden.
- FormSubmit bei Bedarf per Aktivierungsmail bestätigen, anschliessend realen Versand und Eingang im Empfängerpostfach prüfen. Lokale Tests bestätigen keine E-Mail-Zustellung.
- Private Work-Konfiguration und deren noindex-/Testversand-Modus wurden nicht in die Produktion übernommen.
