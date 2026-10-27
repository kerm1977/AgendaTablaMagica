/* AgendaTribu Sync Server — Node + Express + SQLite + WebSocket
 * npm install  →  node server.js
 * Expone a internet con: cloudflared tunnel --url http://localhost:8780
 */
const express = require('express');
const http = require('http');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');
const { DatabaseSync } = require('node:sqlite');
const zlib = require('node:zlib');

const PORT = process.env.PORT || 8780;
const db = new DatabaseSync('tribu-sync.db');
db.exec('PRAGMA journal_mode = WAL');
db.exec(`CREATE TABLE IF NOT EXISTS usuarios(
  usuario TEXT PRIMARY KEY, hash TEXT, salt TEXT, creado INTEGER);
 CREATE TABLE IF NOT EXISTS tokens(
  token TEXT PRIMARY KEY, usuario TEXT, creado INTEGER);
 CREATE TABLE IF NOT EXISTS items(
  coleccion TEXT, id TEXT, data TEXT, ts INTEGER, borrado INTEGER DEFAULT 0, autor TEXT,
  PRIMARY KEY(coleccion, id));
 CREATE INDEX IF NOT EXISTS ix_ts ON items(ts);`);
try { db.exec('ALTER TABLE items ADD COLUMN autor TEXT'); } catch {}
db.exec(`CREATE TABLE IF NOT EXISTS actividad(
  id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER, accion TEXT, usuario TEXT, detalle TEXT, ip TEXT)`);

const logAct = (req, accion, usuario, detalle) => {
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  const ua = String(req.headers['user-agent'] || '').slice(0, 90);
  db.prepare('INSERT INTO actividad(ts,accion,usuario,detalle,ip) VALUES(?,?,?,?,?)')
    .run(now(), accion, usuario || '-', (detalle || '') + ' · ' + ua, ip);
  db.prepare('DELETE FROM actividad WHERE id NOT IN (SELECT id FROM actividad ORDER BY id DESC LIMIT 200)').run();
};

const scrypt = (p, s) => crypto.scryptSync(p, s, 32).toString('hex');
const now = () => Date.now();
const auth = (req, res, next) => {
  const t = req.headers['x-token'];
  const row = t && db.prepare('SELECT usuario FROM tokens WHERE token=?').get(t);
  if (!row) return res.status(401).json({ error: 'sin sesion' });
  req.usuario = row.usuario; next();
};

const app = express();
app.use(express.json({ limit: '25mb' }));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-token, x-app');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.post('/registro', (req, res) => {
  const usuario = String((req.body||{}).usuario||'').trim().toUpperCase();
  const clave = String((req.body||{}).clave||'').toUpperCase();
  if (!usuario || !clave) return res.status(400).json({ error: 'faltan datos' });
  const salt = crypto.randomBytes(16).toString('hex');
  try {
    db.prepare('INSERT INTO usuarios VALUES(?,?,?,?)').run(usuario, scrypt(clave, salt), salt, now());
    logAct(req, 'registro', usuario, 'usuario creado');
    res.json({ ok: true });
  } catch { res.status(409).json({ error: 'usuario ya existe' }); }
});

app.post('/login', (req, res) => {
  const usuario = String((req.body||{}).usuario||'').trim().toUpperCase();
  const clave = String((req.body||{}).clave||'').toUpperCase();
  const u = db.prepare('SELECT * FROM usuarios WHERE usuario=? COLLATE NOCASE').get(usuario);
  if (!u || u.hash !== scrypt(clave || '', u.salt)) return res.status(401).json({ error: 'credenciales' });
  if (u.bloqueado) return res.status(403).json({ error: 'bloqueado' });
  const token = crypto.randomBytes(24).toString('hex');
  db.prepare('INSERT INTO tokens VALUES(?,?,?)').run(token, usuario, now());
  logAct(req, 'login', usuario, 'sesion iniciada');
  res.json({ ok: true, token, usuario });
  avisar({ tipo: 'conexion', usuario });
});

function esAdmin(req) { const u = db.prepare('SELECT admin FROM usuarios WHERE usuario=?').get(req.usuario); return !!(u && u.admin); }
app.get('/usuarios', auth, (req, res) => {
  if (!esAdmin(req)) return res.status(403).json({ error: 'no admin' });
  res.json({ ok: true, usuarios: db.prepare('SELECT usuario,bloqueado,admin,creado FROM usuarios ORDER BY usuario').all() });
});
app.post('/bloquear', auth, (req, res) => {
  if (!esAdmin(req)) return res.status(403).json({ error: 'no admin' });
  const u2 = String((req.body||{}).usuario||'').trim().toUpperCase();
  const bl = req.body.bloqueado ? 1 : 0;
  db.prepare('UPDATE usuarios SET bloqueado=? WHERE usuario=?').run(bl, u2);
  if (bl) db.prepare('DELETE FROM tokens WHERE usuario=?').run(u2);
  logAct(req, 'bloqueo', req.usuario, u2 + ' -> ' + (bl ? 'bloqueado' : 'activo'));
  res.json({ ok: true });
});
app.post('/eliminar-usuario', auth, (req, res) => {
  if (!esAdmin(req)) return res.status(403).json({ error: 'no admin' });
  const u2 = String((req.body||{}).usuario||'').trim().toUpperCase();
  db.prepare('DELETE FROM tokens WHERE usuario=?').run(u2);
  db.prepare('DELETE FROM usuarios WHERE usuario=? AND admin=0').run(u2);
  logAct(req, 'eliminar-usuario', req.usuario, u2);
  res.json({ ok: true });
});
// Subir items modificados: gana el ts más reciente por ítem
app.post('/push', auth, (req, res) => {
  const { coleccion, items } = req.body || {};
  if (!coleccion || !Array.isArray(items)) return res.status(400).json({ error: 'formato' });
  const up = db.prepare(`INSERT INTO items VALUES(?,?,?,?,0,?)
    ON CONFLICT(coleccion,id) DO UPDATE SET data=excluded.data, ts=excluded.ts, autor=excluded.autor
    WHERE excluded.ts >= items.ts`);
  const del = db.prepare(`INSERT INTO items VALUES(?,?,?,?,1,?)
    ON CONFLICT(coleccion,id) DO UPDATE SET borrado=1, ts=excluded.ts, autor=excluded.autor
    WHERE excluded.ts >= items.ts`);
  db.exec('BEGIN');
  try {
    for (const it of items) {
      if (!it.id) continue;
      const ts = it.ts || now();
      (it.borrado ? del : up).run(coleccion, String(it.id), JSON.stringify(it.data ?? it), ts, req.usuario);
    }
    db.exec('COMMIT');
  } catch (e) { db.exec('ROLLBACK'); throw e; }
  if (coleccion === 'chat') (items||[]).forEach(i => avisar({ tipo: 'chat', item: i }));
  else if ((items||[]).length <= 50) avisar({ tipo: 'items', coleccion, items });
  avisar({ tipo: 'cambio', coleccion, ts: now(), por: req.usuario });
  logAct(req, 'push', req.usuario, coleccion + ' +' + items.length + ' items');
  res.json({ ok: true, recibidos: items.length });
});

// Bajar todo lo cambiado desde un timestamp
app.get('/pull', auth, (req, res) => {
  const desde = Number(req.query.desde || 0);
  const limite = Math.min(Number(req.query.limit || 0) || 0, 500);
  const col = String(req.query.coleccion || '');
  let sql = 'SELECT coleccion,id,data,ts,borrado,autor FROM items WHERE ts>?';
  const args = [desde];
  if (col) { sql += ' AND coleccion=?'; args.push(col); }
  sql += ' ORDER BY ts';
  if (limite) sql += ' LIMIT ' + limite;
  const rows = db.prepare(sql).all(...args);
  if (rows.length) logAct(req, 'pull', req.usuario, rows.length + ' items');
  const body = Buffer.from(JSON.stringify({ ok: true, items: rows.map(r => ({ ...r, data: JSON.parse(r.data) })), ahora: now(), mas: limite ? rows.length === limite : false }));
  if ((req.headers['accept-encoding'] || '').includes('gzip')) {
    res.set({ 'Content-Type': 'application/json', 'Content-Encoding': 'gzip' });
    res.end(zlib.gzipSync(body));
  } else { res.set('Content-Type', 'application/json'); res.end(body); }
});

// Snapshot completo (primera sincronización)
app.get('/snapshot', auth, (req, res) => {
  const rows = db.prepare('SELECT coleccion,id,data,ts,borrado,autor FROM items').all();
  logAct(req, 'snapshot', req.usuario, rows.length + ' items');
  const body = Buffer.from(JSON.stringify({ ok: true, items: rows.map(r => ({ ...r, data: JSON.parse(r.data) })), ahora: now() }));
  if ((req.headers['accept-encoding'] || '').includes('gzip')) {
    res.set({ 'Content-Type': 'application/json', 'Content-Encoding': 'gzip' });
    res.end(zlib.gzipSync(body));
  } else { res.set('Content-Type', 'application/json'); res.end(body); }
});

app.get('/ping', (req, res) => res.json({ ok: true, ahora: now() }));
app.get('/online', auth, (req, res) => res.json({ ok: true, usuarios: [...new Set([...wss.clients].filter(c => c.readyState === 1 && c._usuario).map(c => c._usuario))] }));

const SYNC_PUBLIC_URL = process.env.SYNC_PUBLIC_URL || 'https://latribu.tailb81e5f.ts.net';

app.get('/server.js', (req, res) => res.sendFile(__dirname + '/server.js'));
app.get('/package.json', (req, res) => res.sendFile(__dirname + '/package.json'));

function batInstalador() {
  return `@echo off
title AgendaTribu Sync Server - Instalador portable
cd /d "%USERPROFILE%"
if not exist tribu-sync mkdir tribu-sync
cd tribu-sync
echo ============================================================
echo   AgendaTribu Sync Server - Instalador portable
echo ============================================================
echo.
set SRV=${SYNC_PUBLIC_URL}
set /p SRVIN="URL del servidor origen [%SRV%]: "
if not "%SRVIN%"=="" set SRV=%SRVIN%
echo.
echo [1/5] Descargando servidor desde %SRV% ...
curl -fsSL -o server.js "%SRV%/server.js" || ( echo [X] No se pudo bajar server.js & pause & exit /b 1 )
curl -fsSL -o package.json "%SRV%/package.json" || ( echo [X] No se pudo bajar package.json & pause & exit /b 1 )
echo      OK
echo [2/5] Verificando Node.js...
where node >nul 2>nul
if errorlevel 1 ( echo [X] Instala Node.js de https://nodejs.org y volve a correr & pause & exit /b 1 )
node --version
echo [3/5] Instalando dependencias...
if not exist node_modules ( call npm install --no-audit --no-fund || (echo [X] npm fallo & pause & exit /b 1) )
echo      OK
echo [4/5] Verificando Tailscale...
where tailscale >nul 2>nul
if errorlevel 1 ( echo [X] Instala Tailscale y entra con kenth1977@gmail.com, volve a correr & pause & exit /b 1 )
tailscale status | findstr /C:"Logged out" >nul && tailscale login
tailscale funnel --bg 8780
echo [5/5] Autoarranque + arranque...
(echo @echo off& echo cd /d "%cd%"& echo node server.js& echo pause) > server.bat
schtasks /create /tn "AgendaTribuSync" /sc onlogon /f /tr "\\"%cd%\\server.bat\\"" >nul 2>nul
start "AgendaTribuSync" /min cmd /c "node server.js > server.log 2>&1"
timeout /t 2 >nul
curl -s localhost:8780/ping >nul 2>nul && echo [OK] SERVIDOR ACTIVO || echo [X] No arranco, ver server.log
echo.
echo   URL del servidor para la app:
tailscale serve status | findstr "ts.net"
echo.
pause
exit /b 0`;
}

app.get('/actividad', (req, res) => {
  const rows = db.prepare('SELECT ts,accion,usuario,detalle,ip FROM actividad ORDER BY id DESC LIMIT 60').all();
  res.json({ ok: true, actividad: rows });
});

app.get('/instalador-offline.zip', (req, res) => {
  const f = __dirname + '/instalador-offline.zip';
  require('fs').existsSync(f) ? res.sendFile(f) : res.status(404).send('no hay paquete offline');
});
app.get('/instalar-servidor.bat', (req, res) => {
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', 'attachment; filename="instalar-servidor.bat"');
  res.end(batInstalador());
});

app.get('/', (req, res) => {
  const items = db.prepare('SELECT COUNT(*) c FROM items').get().c;
  const usuarios = db.prepare('SELECT COUNT(*) c FROM usuarios').get().c;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`<!DOCTYPE html><html><body style="font-family:sans-serif;background:#1a1a1a;color:#eee;display:flex;justify-content:center;align-items:center;height:100vh;margin:0">
<div style="text-align:center"><h2 style="color:#f97316">AgendaTribu Sync Server</h2>
<p>Servidor activo ✓ — ${usuarios} usuario(s), ${items} item(s) sincronizados</p>
<a href="/instalador-offline.zip" style="display:inline-block;background:#4ade80;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:0 0 10px 0">⬇ Paquete OFFLINE completo (~66 MB — Node+Tailscale incluidos)</a><br>
<a href="/instalar-servidor.bat" style="display:inline-block;background:#f97316;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">⬇ Descargar instalador de servidor</a>
<p style="color:#888;font-size:.9em">Descargalo en cualquier PC → doble clic → el servidor se instala solo</p>
<div style="margin:8px 0">
<a href="https://nodejs.org/es/download" target="_blank" style="color:#7dd3fc;font-size:.85em;margin:0 10px">⬇ Node.js</a>
<a href="https://tailscale.com/download" target="_blank" style="color:#7dd3fc;font-size:.85em;margin:0 10px">⬇ Tailscale</a>
<span style="color:#666;font-size:.85em">(Tailscale: entrar con la cuenta del grupo)</span>
</div>
<p style="color:#666;font-size:.8em">Endpoints: /registro · /login · /push · /pull · /snapshot · /ping · /ws</p>
<h5 style="color:#f97316;margin-top:24px">Consola de actividad</h5>
<div id="log" style="background:#000;border:1px solid #333;border-radius:8px;padding:12px;max-height:260px;overflow-y:auto;text-align:left;font-family:monospace;font-size:.8em;min-width:340px"></div>
<script>
async function tick(){
  try{
    const r=await fetch('/actividad');const j=await r.json();
    const el=document.getElementById('log');
    el.innerHTML=j.actividad.map(a=>{
      const d=new Date(a.ts).toLocaleTimeString('es-CR');
      const col=a.accion==='login'?'#4ade80':a.accion==='registro'?'#facc15':a.accion==='push'?'#60a5fa':a.accion==='pull'?'#c084fc':'#888';
      return '<div style="margin:2px 0"><span style="color:#666">'+d+'</span> <span style="color:'+col+';font-weight:bold">'+a.accion.toUpperCase()+'</span> <span style="color:#eee">'+a.usuario+'</span> <span style="color:#999">'+a.detalle+'</span> <span style="color:#555;font-size:.85em">'+a.ip+'</span></div>';
    }).join('')||'<span style="color:#555">Sin actividad aún…</span>';
  }catch(e){}
}
tick();setInterval(tick,3000);
</script></div></body></html>`);
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });
const avisar = (msg) => {
  const s = JSON.stringify(msg);
  wss.clients.forEach(c => c.readyState === 1 && c.send(s));
};
wss.on('connection', (ws, req) => {
  const t = new URL(req.url, 'http://x').searchParams.get('token');
  const row = db.prepare('SELECT usuario FROM tokens WHERE token=?').get(t || '');
  if (!row) return ws.close();
  ws._usuario = row.usuario;
  logAct(req, 'ws', row.usuario, 'canal en vivo abierto');
  ws.on('message', (buf) => {
    try {
      const m = JSON.parse(buf);
      if (m.tipo === 'items' && m.coleccion && Array.isArray(m.items) && m.items.length <= 200) {
        const ts = now();
        for (const i of m.items) {
          if (!i || !i.id) continue;
          db.prepare('INSERT OR REPLACE INTO items VALUES(?,?,?,?,?,?)').run(m.coleccion, String(i.id), JSON.stringify(i.data || i), i.ts || ts, i.borrado ? 1 : 0, ws._usuario);
        }
        avisar({ tipo: 'items', coleccion: m.coleccion, items: m.items.map(i => ({ ...i, ts: i.ts || ts, autor: ws._usuario })) });
        logAct(req, 'ws-items', ws._usuario, m.coleccion + ' x' + m.items.length);
        return;
      }
      if (m.tipo === 'chat' && m.item && m.item.id && m.item.id.length < 100) {
        const it = { id: String(m.item.id), de: ws._usuario, texto: String(m.item.texto || ''), archivo: m.item.archivo };
        const ts = now();
        db.prepare('INSERT OR REPLACE INTO items VALUES(?,?,?,?,?,?)').run('chat', it.id, JSON.stringify(it), ts, m.item.borrado ? 1 : 0, ws._usuario);
        avisar({ tipo: 'chat', item: { ...it, ts, borrado: m.item.borrado ? 1 : 0 } });
      }
    } catch (e) { }
  });
  ws.on('close', () => avisar({ tipo: 'desconexion', usuario: row.usuario }));
});
server.listen(PORT, () => console.log(`Sync server en http://localhost:${PORT}`));
