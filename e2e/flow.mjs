// Headless-Chrome end-to-end flow with DOM assertions. Requires a Chrome with
// --remote-debugging-port=9222, the dev frontend on :5174, and the backend on
// :8082. Exits non-zero on any failed assertion.
//
// State changes are driven through the API (reliable); the assertions verify the
// React UI renders that real backend state and that key interactions work. The
// order-entry form logic itself is covered by the Vitest tradingStore unit test.
const FRONT = 'http://localhost:5174';
const API = 'http://localhost:8082/api';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = false;
const ok = (cond, msg) => {
  console.log((cond ? 'ok   ' : 'FAIL ') + msg);
  if (!cond) failed = true;
};

async function main() {
  // 1. account + token, then seed some state via the API
  const email = `e2e${Date.now()}@demo.com`;
  await fetch(`${API}/auth/signup`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: 'pass1234' }) });
  const lr = await (await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: 'pass1234' }) })).json();
  const { token, user_id } = lr;
  const h = { 'content-type': 'application/json', authorization: `Bearer ${token}` };
  await fetch(`${API}/trade/`, { method: 'POST', headers: h, body: JSON.stringify({ symbol: 'BTC-USD', side: 'BUY', type: 'MARKET', quantity: 0.1 }) });
  await fetch(`${API}/trade/`, { method: 'POST', headers: h, body: JSON.stringify({ symbol: 'BTC-USD', side: 'BUY', type: 'LIMIT', tif: 'POST_ONLY', quantity: 0.3, limit_price: 1000 }) });

  // 2. CDP connect
  const page = (await (await fetch('http://localhost:9222/json')).json()).find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  await new Promise((r) => ws.addEventListener('open', r));
  ws.addEventListener('message', (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } });
  await send('Page.enable');
  await send('Runtime.enable');

  const evalJS = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error('eval error: ' + JSON.stringify(r.exceptionDetails.exception));
    return r.result.value;
  };
  const clickText = (t) =>
    evalJS(`(()=>{const el=[...document.querySelectorAll('button,a')].find(e=>e.textContent.replace(/\\s+/g,' ').trim()===${JSON.stringify(t)});if(el){el.click();return true}return false})()`);
  const body = () => evalJS('document.body.innerText');

  // 3. authenticate + open dashboard
  await send('Page.navigate', { url: FRONT + '/' });
  await sleep(1200);
  await evalJS(`localStorage.setItem('token',${JSON.stringify(token)});localStorage.setItem('userId','${user_id}');localStorage.setItem('email',${JSON.stringify(email)});localStorage.setItem('theme','dark')`);
  await send('Page.navigate', { url: FRONT + '/dashboard' });
  await sleep(5500);

  const dash = await body();
  ok(/ORDER BOOK/i.test(dash), 'dashboard shows the order book');
  ok(/PLACE ORDER/i.test(dash), 'dashboard shows the order entry panel');
  ok(/ALGORITHMIC/i.test(dash), 'dashboard shows the algo panel');
  ok(/BUY BTC-USD/i.test(dash), 'order entry shows a BUY action button');

  // 4. positions rendered from the API-seeded buy (CLOSE button only exists in positions)
  const closeBtns = await evalJS(`[...document.querySelectorAll('button')].filter(b=>b.textContent.trim()==='CLOSE').length`);
  ok(closeBtns > 0, 'positions tab renders the seeded position (has a CLOSE button)');

  // 5. open-orders tab shows the resting post-only limit count
  ok(/Open Orders \([1-9]/i.test(dash), 'open-orders tab shows a non-zero count for the resting order');

  // 6. theme toggle
  await evalJS(`(()=>{const b=document.querySelector('button[title^="Switch"]');if(b)b.click();})()`);
  await sleep(300);
  ok((await evalJS(`document.documentElement.classList.contains('light')`)) === true, 'theme toggled to light');
  await evalJS(`(()=>{const b=document.querySelector('button[title^="Switch"]');if(b)b.click();})()`);
  await sleep(300);
  ok((await evalJS(`document.documentElement.classList.contains('light')`)) === false, 'theme toggled back to dark');

  // 7. analytics renders real fills (TCA + history)
  await send('Page.navigate', { url: FRONT + '/analytics' });
  await sleep(3500);
  const an = await body();
  ok(/TRANSACTION COST ANALYSIS/i.test(an), 'analytics renders the TCA table from real fills');
  ok(/TOTAL TRADES/i.test(an), 'analytics shows metric tiles');
  ok(/TRADE HISTORY/i.test(an), 'analytics shows the trade history');

  // 8. sign out
  await clickText('Sign out');
  await sleep(1200);
  ok((await evalJS('location.pathname')) === '/login', 'sign out redirects to /login');

  ws.close();
  console.log(failed ? '\nE2E FAILED' : '\nE2E PASSED');
  process.exit(failed ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
