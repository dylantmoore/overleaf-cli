import { readFileSync, writeFileSync, mkdirSync, existsSync, chmodSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const CONFIG_DIR = join(homedir(), '.config', 'overleaf-cli');
const CONFIG_FILE = join(CONFIG_DIR, 'session.json');

export function getSession() {
  if (!existsSync(CONFIG_FILE)) return null;
  try {
    return JSON.parse(readFileSync(CONFIG_FILE, 'utf8'));
  } catch {
    return null;
  }
}

export function saveSession(session) {
  mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  writeFileSync(CONFIG_FILE, JSON.stringify(session, null, 2), { mode: 0o600 });
}

export function updateCookie(newCookie) {
  const session = getSession() || {};
  if (session.cookie === newCookie) return; // skip disk write if unchanged
  session.cookie = newCookie;
  session.updatedAt = new Date().toISOString();
  saveSession(session);
}

export function requireSession() {
  const session = getSession();
  if (!session?.cookie) {
    console.error(JSON.stringify({ error: 'Not authenticated. Run: overleaf login' }));
    process.exit(1);
  }
  return session;
}

export function findChrome() {
  const paths = {
    darwin: [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
    ],
    linux: [
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/snap/bin/chromium',
    ],
    win32: [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
    ],
  };
  for (const p of (paths[process.platform] || [])) {
    if (existsSync(p)) return p;
  }
  return null;
}

export async function interactiveLogin() {
  const puppeteer = await import('puppeteer-core');
  const chromePath = findChrome();
  if (!chromePath) {
    throw new Error('Chrome not found. Install Chrome or use: overleaf login --cookie "..."');
  }

  console.error('Opening Chrome for Overleaf sign-in...');
  console.error('Sign in to your Overleaf account. The window will close automatically.\n');

  const browser = await puppeteer.default.launch({
    executablePath: chromePath,
    headless: false,
    args: ['--no-first-run', '--no-default-browser-check'],
    defaultViewport: null,
  });

  const page = (await browser.pages())[0] || await browser.newPage();
  await page.goto('https://www.overleaf.com/login', { waitUntil: 'networkidle2' });

  const cookie = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Login timed out after 5 minutes')), 5 * 60 * 1000);

    const check = async () => {
      try {
        const cookies = await page.cookies('https://www.overleaf.com');
        const sessionCookie = cookies.find(c => c.name === 'overleaf_session2');
        const url = page.url();
        if (sessionCookie && (url.includes('/project') || url.includes('/dash'))) {
          // Navigate once more to ensure load balancer cookies (GCLB) are set
          await page.goto('https://www.overleaf.com/project', { waitUntil: 'networkidle2' });
          const allCookies = await page.cookies('https://www.overleaf.com');
          clearTimeout(timeout);
          // Grab session + any infrastructure cookies the socket needs
          resolve(allCookies
            .filter(c => c.value && (c.name === 'overleaf_session2' || c.name === 'GCLB'))
            .map(c => `${c.name}=${c.value}`)
            .join('; '));
        } else {
          setTimeout(check, 1000);
        }
      } catch {
        setTimeout(check, 1000);
      }
    };
    check();
  });

  await browser.close();
  return cookie;
}
