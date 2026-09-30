import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const publicDir = new URL('../public/', import.meta.url);
const html = await readFile(new URL('erfolge.html', publicDir), 'utf8');
const pagesCss = await readFile(new URL('pages.css', publicDir), 'utf8');

// Text of a markup fragment, so copy can be compared word by word.
const visible = fragment => fragment.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const spaced = fragment => fragment.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const pick = (body, pattern) => body.match(pattern)?.[1] ?? '';
const storyOf = body => [...pick(body, /<div class="race-story">([\s\S]*?)<\/div>/).matchAll(/<p>([\s\S]*?)<\/p>/g)].map(([, paragraph]) => visible(paragraph));
const numberOf = body => spaced(pick(body, /<div class="milestone-number">([\s\S]*?)<\/div>/));
const photoOf = body => pick(body, /<figure class="milestone-photo">[\s\S]*?<img ([^>]*)>/);
const attributesOf = tag => Object.fromEntries([...tag.matchAll(/([a-z-]+)="([^"]*)"/g)].map(([, name, value]) => [name, value]));
const entries = [...html.matchAll(/<article class="milestone milestone-with-photo">([\s\S]*?)<\/article>/g)].map(([, body]) => body);
const titles = entries.map(body => visible(pick(body, /<h3>([\s\S]*?)<\/h3>/)));

const fiveKmStory = [
  'Die 5 Kilometer in 19:36 Minuten waren für mich ein wichtiger Meilenstein in meiner Entwicklung als Läufer. Lange Zeit war es eines meiner grossen Ziele, die 20-Minuten-Marke zu durchbrechen. Mit gezieltem Intervalltraining, Tempoläufen und einer konstanten Trainingsstruktur konnte ich mich Schritt für Schritt verbessern und dieses Ziel schliesslich erreichen.',
  'Für mich steht diese Bestzeit nicht nur für eine Zahl, sondern vor allem für den Fortschritt, der durch konsequentes Training entsteht. Gerade auf einer kurzen und intensiven Distanz wie den 5 Kilometern zählt jede Sekunde. Die 19:36 zeigen mir, wie stark sich kontinuierliche Arbeit an Geschwindigkeit, Ausdauer und Belastbarkeit auszahlen kann – und motivieren mich, meine Grenzen weiter zu verschieben.',
];
const halfMarathonStory = [
  'Mein erster Halbmarathon dauerte noch 2:09 Stunden. Heute liegt meine Bestzeit bei 1:39 Stunden – eine Verbesserung von rund 30 Minuten über dieselbe Distanz.',
  'Dieser Fortschritt zeigt für mich besonders deutlich, was mit konsequentem und strukturiertem Training möglich ist. Schritt für Schritt konnte ich meine Ausdauer, mein Tempo und meine Fähigkeit verbessern, eine hohe Belastung über 21,1 Kilometer konstant zu halten.',
  'Der Halbmarathon verbindet für mich Geschwindigkeit und Ausdauer auf eine besondere Weise. Es reicht nicht, nur schnell zu sein – man muss das Tempo kontrollieren, konstant bleiben und auch dann weiterarbeiten, wenn die Belastung zunehmend spürbar wird.',
  'Die Entwicklung von 2:09 auf 1:39 Stunden ist deshalb eine meiner bisher deutlichsten Leistungssteigerungen und gleichzeitig Motivation, weiter an neuen persönlichen Bestzeiten zu arbeiten.',
];
// Baseline of the existing 100 km entry; it must survive this extension unchanged.
const hundredKm = {
  story: [
    'Mit 19 Jahren bin ich beim 100-km-Lauf in Biel an den Start gegangen und nach 12 Stunden und 55 Minuten ins Ziel gekommen. Am Ende bedeutete das den 5. Platz bei den Junioren.',
    'Die 100 Kilometer waren für mich weit mehr als nur eine körperliche Herausforderung. Es war das mental härteste Rennen, das ich bis dahin erlebt hatte. Über so viele Stunden weiterzumachen, obwohl der Körper müde wird und der Kopf immer wieder Gründe findet aufzuhören, hat mir eine neue Seite des Ausdauersports gezeigt.',
    'Dieser Lauf hat mir gezeigt, dass die eigenen Grenzen oft nicht dort liegen, wo man sie zunächst vermutet. Mit Vorbereitung, Geduld und der Bereitschaft weiterzumachen, wenn es schwierig wird, kann man sie Schritt für Schritt verschieben.',
  ],
  h3: '100-km-Lauf',
  number: '100<span>km</span>',
  graphic: '100',
  unit: 'km',
  result: '<span>100 KM</span> · <span>12:55 h</span> · <span>5. Platz Junioren</span> · <span>19 Jahre</span>',
  statement: '„100 Kilometer haben mir nicht gezeigt, wo meine Grenze liegt – sondern dass ich sie weiter verschieben kann.“',
  caption: '100 Kilometer geschafft. Ein Moment, der bleibt.',
  src: '/assets/tim-lauffinish.webp',
  srcset: '/assets/tim-lauffinish-400.webp 400w, /assets/tim-lauffinish-720.webp 720w, /assets/tim-lauffinish.webp 1086w',
  alt: 'Tim nach dem 100-km-Lauf mit Medaille und Finisher-Shirt',
  width: '1086',
  height: '1448',
};

test('Bestzeiten stehen in der Reihenfolge 5 km, Halbmarathon, 100 km', () => {
  assert.equal(entries.length, 3);
  assert.deepEqual(titles, ['5 KM — 19:36', 'HALBMARATHON — 1:39', '100-km-Lauf']);
  assert.deepEqual(entries.map(numberOf), ['5 km', '21,1 km', '100 km']);
});

test('neue Texte stimmen wortgetreu mit dem Auftrag überein', () => {
  assert.deepEqual(storyOf(entries[0]), fiveKmStory);
  assert.deepEqual(storyOf(entries[1]), halfMarathonStory);
  assert.equal(spaced(pick(entries[0], /<p class="race-result">([\s\S]*?)<\/p>/)), '5 KM · 19:36');
  assert.equal(spaced(pick(entries[1], /<p class="race-result">([\s\S]*?)<\/p>/)), '21,1 KM · 1:39 h');
});

test('der 100-km-Eintrag bleibt inhaltlich unverändert', () => {
  const body = entries[2];
  const image = attributesOf(photoOf(body));
  assert.deepEqual(storyOf(body), hundredKm.story);
  assert.equal(visible(pick(body, /<h3>([\s\S]*?)<\/h3>/)), hundredKm.h3);
  assert.equal(pick(body, /<div class="milestone-number">([\s\S]*?)<\/div>/), hundredKm.number);
  assert.equal(pick(body, /<p class="race-result">([\s\S]*?)<\/p>/), hundredKm.result);
  assert.equal(pick(body, /<blockquote class="race-statement">([\s\S]*?)<\/blockquote>/), hundredKm.statement);
  assert.equal(pick(body, /<figcaption>([\s\S]*?)<\/figcaption>/), hundredKm.caption);
  assert.equal(image.src, hundredKm.src);
  assert.equal(image.srcset, hundredKm.srcset);
  assert.equal(image.alt, hundredKm.alt);
  assert.equal(image.width, hundredKm.width);
  assert.equal(image.height, hundredKm.height);
});

test('beide neuen Bilder sind dem passenden Eintrag zugeordnet und beschrieben', () => {
  const fiveKm = attributesOf(photoOf(entries[0]));
  const halfMarathon = attributesOf(photoOf(entries[1]));
  assert.match(fiveKm.src, /^\/assets\/tim-5km-nacht\.webp$/);
  assert.match(halfMarathon.src, /^\/assets\/tim-halbmarathon\.webp$/);
  // The night photo shows Tim during the 5 km run, not after it.
  assert.match(fiveKm.alt, /5-km-Lauf/);
  assert.doesNotMatch(fiveKm.alt, /nach dem/);
  assert.match(halfMarathon.alt, /Halbmarathon/);
  for (const image of [fiveKm, halfMarathon]) assert.ok(image.alt.trim().length > 12);
});

test('jede Bestzeit lädt deklarierte, dekodierbare Bilder in Originalgrösse', async () => {
  for (const [index, body] of entries.entries()) {
    const image = attributesOf(photoOf(body));
    assert.equal(image.loading, 'lazy', titles[index]);
    assert.match(image.srcset, /w(, |$)/, titles[index]);
    const candidates = image.srcset.split(',').map(entry => { const [url, width] = entry.trim().split(/\s+/); return { url, width: Number(width.replace('w', '')) }; });
    assert.ok(candidates.some(candidate => candidate.url === image.src), titles[index]);
    for (const candidate of candidates) {
      const file = fileURLToPath(new URL('.' + candidate.url, publicDir));
      const meta = await sharp(file).metadata();
      assert.equal(meta.width, candidate.width, candidate.url + ' width');
      assert.equal(meta.orientation, undefined, candidate.url + ' must not need EXIF rotation');
      if (candidate.url !== image.src) assert.ok(meta.width < Number(image.width), candidate.url + ' must be smaller than the full-size file');
    }
    const full = await sharp(fileURLToPath(new URL('.' + image.src, publicDir))).metadata();
    assert.equal(full.width, Number(image.width), titles[index] + ' width attribute');
    assert.equal(full.height, Number(image.height), titles[index] + ' height attribute');
  }
});

test('alle drei Bestzeiten nutzen denselben Bildrahmen ohne Verzerrung', () => {
  const frame = /\.milestone-with-photo \.milestone-photo img\{[^}]*aspect-ratio:3\/4[^}]*object-fit:contain[^}]*\}/.exec(pagesCss);
  assert.ok(frame, 'shared 3:4 photo frame with object-fit:contain expected in pages.css');
  assert.equal(entries.filter(body => photoOf(body)).length, 3);
});
