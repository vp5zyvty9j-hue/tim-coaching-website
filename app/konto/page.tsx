import { getChatGPTUser,chatGPTSignInPath,chatGPTSignOutPath } from '../chatgpt-auth';
import Portal from './portal';
export const dynamic='force-dynamic';
export default async function AccountPage(){
 const user=await getChatGPTUser();
 return <div className="portal"><header className="portal-header"><a className="wordmark" href="/index.html">TIM<span> COACHING</span></a><nav><a href="/index.html">Zur Website</a>{user&&<a target="_top" href={chatGPTSignOutPath('/konto')}>Abmelden</a>}</nav></header>{user?<Portal displayName={user.fullName||''} email={user.email}/>:<main className="login-card"><p className="eyebrow">DEIN PERSÖNLICHER BEREICH</p><h1>Dein Coaching.<br/><span>Alles im Blick.</span></h1><p>Melde dich an, um dein Paket und den Status deiner Betreuung zu sehen. Tim verwaltet hier seine Athleten.</p><a className="primary" target="_top" href={chatGPTSignInPath('/konto')}>Mit ChatGPT anmelden ↗</a><p className="muted">Für diese Vorschau nutzt du dein ChatGPT-Konto. Die Registrierung schliesst kein kostenpflichtiges Abo ab.</p><a href="/datenschutz.html">Datenschutz</a></main>}</div>;
}
