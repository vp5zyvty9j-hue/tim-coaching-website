import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
export function localDB(filename=':memory:'){
 const sqlite=new DatabaseSync(filename);sqlite.exec(readFileSync(new URL('../../worker/analytics/schema.sql',import.meta.url),'utf8'));
 if(!sqlite.prepare('PRAGMA table_info(events)').all().some(x=>x.name==='is_entry'))sqlite.exec('ALTER TABLE events ADD COLUMN is_entry INTEGER NOT NULL DEFAULT 0');
 return {sqlite,prepare(sql){let args=[];const api={bind(...v){args=v;return api},async run(){return sqlite.prepare(sql).run(...args)},async all(){return {results:sqlite.prepare(sql).all(...args)}},async first(){return sqlite.prepare(sql).get(...args)||null}};return api}};
}
