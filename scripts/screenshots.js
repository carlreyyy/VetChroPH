// Phone screenshots of every important VetChroPH screen (390 x 844, 3x), used for the Screen Catalogue.
// Usage: npm run screenshots   (builds the app, then saves PNGs to ./screenshots)
// Needs Google Chrome installed; set CHROME_PATH if it is not in the default Windows location.
const http = require('http'), fs = require('fs'), path = require('path');
const puppeteer = require('puppeteer-core');
const ROOT = path.join(__dirname, '..');
const [dist, out, samples] = [path.join(ROOT, 'dist'), process.argv[2] || path.join(ROOT, 'screenshots'), path.join(__dirname, 'screenshot-fixtures')];
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.ttf': 'font/ttf', '.json': 'application/json', '.ico': 'image/x-icon', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  let p = path.join(dist, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(path.resolve(dist)) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) p = path.join(dist, 'index.html');
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
}).listen(8765);
const BASE = 'http://localhost:8765';
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--hide-scrollbars'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  const shot = async (name) => { await sleep(900); await page.screenshot({ path: path.join(out, name + '.png') }); console.log('saved', name); };
  const go = async (url) => { await page.goto(BASE + url, { waitUntil: 'networkidle0' }); await sleep(600); };
  const clickText = async (text, nth = 0) => {
    const ok = await page.evaluate((t, n) => {
      const els = [...document.querySelectorAll('[role=button],[role=link],[role=tab],[role=radio],button,a,div[tabindex]')].filter(e => e.innerText && e.innerText.trim().startsWith(t) && e.offsetParent !== null);
      const el = els[n]; if (el) { el.click(); return true; } return false;
    }, text, nth);
    if (!ok) console.log('NOT FOUND', text); await sleep(700); return ok;
  };
  const clickLabel = async (label) => { const el = await page.$(`[aria-label="${label}"]`); if (!el) { console.log('NO LABEL', label); return; } await el.click(); await sleep(700); };
  const upload = async (file, trigger) => {
    const [chooser] = await Promise.all([page.waitForFileChooser({ timeout: 5000 }), trigger()]);
    await chooser.accept([path.join(samples, file)]); await sleep(1200);
  };
  const login = async (role) => {
    await page.evaluate(() => localStorage.clear()); await go('/login');
    await clickText('Explore demo accounts'); await clickLabel('Sign in as ' + role); await sleep(1500);
    console.log('after login', role, page.url());
  };

  // Sign-in
  await go('/'); await page.evaluate(() => localStorage.clear()); await go('/'); await shot('01-welcome');
  await go('/login'); await shot('02-login');
  await go('/signup'); await shot('03-signup');

  // Pet owner
  await login('Pet Owner');
  await go('/home'); await shot('10-owner-home');
  await go('/pets'); await shot('11-owner-pets');
  await go('/pets/p1'); await shot('12-owner-pet-profile');
  await go('/pets/p1?tab=docs'); await page.evaluate(() => { const el = [...document.querySelectorAll('div')].find(d => d.innerText && d.innerText.startsWith('JPEG, PNG or PDF')); el && el.scrollIntoView({ block: 'start' }); }); await sleep(300); await page.evaluate(() => document.querySelectorAll('div').forEach(d => { if (d.scrollHeight > d.clientHeight + 50 && d.scrollTop > 0) d.scrollTop -= 75; })); await shot('13-owner-pet-files');
  await clickText('Upload a file'); await clickText('Laboratory result');
  await upload('lab-result-sample.pdf', () => clickText('Choose a file or photo')); await shot('14-owner-upload-sheet');
  await go('/pets/p1?tab=docs'); await clickText('vaccination-card.jpg'); await shot('15-owner-file-preview');
  await go('/book'); await shot('16-owner-book');
  await go('/appointments'); await shot('17-owner-appointments');
  await go('/messages'); await shot('18-owner-messages');
  await go('/bills'); await shot('19-owner-bills');
  await go('/pay?id=b2'); await shot('20-owner-paybill');
  await page.evaluate(() => window.scrollTo(0, 99999)); await page.evaluate(() => document.querySelectorAll('div').forEach(d => { if (d.scrollHeight > d.clientHeight + 50) d.scrollTop = d.scrollHeight; }));
  await upload('ewallet-proof.png', () => clickText('Upload payment screenshot')); await shot('21-owner-paybill-proof');

  // Staff
  await login('Clinic Staff');
  await go('/home'); await shot('30-staff-today');
  await go('/appointments'); await shot('31-staff-schedule');
  await go('/patients'); await shot('32-staff-patients');
  await go('/visits/v2'); await page.evaluate(() => document.querySelectorAll('div').forEach(d => { if (d.scrollHeight > d.clientHeight + 50) d.scrollTop = d.scrollHeight; })); await shot('33-staff-visit-attachments');
  await go('/bills/b6'); await shot('34-staff-verify-payment');
  await page.evaluate(() => document.querySelectorAll('div').forEach(d => { if (d.scrollHeight > d.clientHeight + 50) d.scrollTop = d.scrollHeight; })); await shot('35-staff-verify-payment-proof');
  await go('/documents'); await shot('36-staff-documents');

  // Administrator
  await login('Administrator');
  await go('/home'); await shot('40-admin-overview');
  await go('/reports'); await shot('41-admin-reports');
  await go('/admin/users'); await shot('42-admin-users');
  await go('/admin/payments'); await shot('43-admin-payment-accounts');
  await clickText('GCash'); await upload('clinic-qr.png', () => clickText('Upload QR image')); await shot('44-admin-qr-upload');
  await go('/admin/activity'); await shot('45-admin-activity');

  await browser.close(); server.close();
})().catch(e => { console.error(e); process.exit(1); });
