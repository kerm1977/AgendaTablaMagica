# wsgi_app.py — AgendaTribu Sync (espejo PythonAnywhere, SQLite, cero dependencias)
# Subir como la WSGI app de kenth1977.pythonanywhere.com
# Cada app queda aislada en su propio .db: tribu_<identificador>.db (cabecera x-app)
import sqlite3, os, re, json, time, hmac, secrets
from urllib.parse import parse_qs

BASE = os.path.dirname(os.path.abspath(__file__))
def appid_from(env):
    a = env.get('HTTP_X_APP', 'app').strip().lower()
    return re.sub(r'[^a-z0-9]+', '_', a) or 'app'
def dbpath(env):
    return os.path.join(BASE, 'tribu_' + appid_from(env) + '.db')
def db_of(env):
    d = sqlite3.connect(dbpath(env))
    d.executescript('''CREATE TABLE IF NOT EXISTS usuarios(usuario TEXT PRIMARY KEY,hash TEXT,salt TEXT,creado INTEGER);
      CREATE TABLE IF NOT EXISTS tokens(token TEXT PRIMARY KEY,usuario TEXT,creado INTEGER);
      CREATE TABLE IF NOT EXISTS items(coleccion TEXT,id TEXT,data TEXT,ts INTEGER,borrado INTEGER DEFAULT 0,autor TEXT,PRIMARY KEY(coleccion,id));
      CREATE TABLE IF NOT EXISTS actividad(id INTEGER PRIMARY KEY AUTOINCREMENT,ts INTEGER,accion TEXT,usuario TEXT,detalle TEXT,ip TEXT);''')
    return d
def scrypt(p, s):
    import hashlib
    return hashlib.scrypt(p.encode(), salt=bytes.fromhex(s), n=16384, r=8, p=1, dklen=32).hex()
def now(): return int(time.time() * 1000)
def log(d, req, accion, usuario, detalle):
    ip = req.get('HTTP_X_FORWARDED_FOR', req.get('REMOTE_ADDR', '')).split(',')[0].strip()
    ua = (req.get('HTTP_USER_AGENT', '') or '')[:90]
    d.execute('INSERT INTO actividad(ts,accion,usuario,detalle,ip) VALUES(?,?,?,?,?)',
              (now(), accion, usuario or '-', (detalle or '') + ' · ' + ua, ip))
    d.execute('DELETE FROM actividad WHERE id NOT IN (SELECT id FROM actividad ORDER BY id DESC LIMIT 200)')
    d.commit()
def auth(d, req):
    t = req.get('HTTP_X_TOKEN', '')
    r = d.execute('SELECT usuario FROM tokens WHERE token=?', (t,)).fetchone()
    return r[0] if r else None
def body(env):
    try: return json.loads(env['wsgi.input'].read(int(env.get('CONTENT_LENGTH') or 0)) or b'{}')
    except Exception: return {}

def app(env, start):
    path = env['PATH_INFO']; m = env['REQUEST_METHOD']
    cors = [('Access-Control-Allow-Origin', '*'),
            ('Access-Control-Allow-Headers', 'Content-Type, x-token, x-app'),
            ('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')]
    def out(code, data, ctype='application/json'):
        b = data if isinstance(data, str) else json.dumps(data)
        start(code, [('Content-Type', ctype)] + cors)
        return [b.encode()]
    if m == 'OPTIONS': return out('204 No Content', '')
    d = db_of(env)
    try:
        if path == '/ping' and m == 'GET': return out('200 OK', {'ok': True, 'ahora': now()})
        if path == '/' and m == 'GET':
            it = d.execute('SELECT COUNT(*) FROM items').fetchone()[0]
            us = d.execute('SELECT COUNT(*) FROM usuarios').fetchone()[0]
            dbname = os.path.basename(dbpath(env))
            html = f"<!DOCTYPE html><html><body style='font-family:sans-serif;background:#1a1a1a;color:#eee;display:flex;justify-content:center;align-items:center;height:100vh;margin:0'><div style='text-align:center'><h2 style='color:#f97316'>AgendaTribu Sync (respaldo)</h2><p>Servidor activo ✓ — {us} usuario(s), {it} item(s) — {dbname}</p><p style='color:#888;font-size:.9em'>Espejo PythonAnywhere · /registro /login /push /pull /snapshot /ping /actividad</p></div></body></html>"
            return out('200 OK', html, 'text/html; charset=utf-8')
        if path == '/actividad' and m == 'GET':
            rows = d.execute('SELECT ts,accion,usuario,detalle,ip FROM actividad ORDER BY id DESC LIMIT 60').fetchall()
            return out('200 OK', {'ok': True, 'actividad': [dict(zip(('ts','accion','usuario','detalle','ip'), r)) for r in rows]})
        if path == '/registro' and m == 'POST':
            b = body(env)
            u = str(b.get('usuario', '')).strip().upper(); c = str(b.get('clave', '')).upper()
            if not u or not c: return out('400 Bad Request', {'error': 'faltan datos'})
            salt = secrets.token_hex(16)
            try:
                d.execute('INSERT INTO usuarios VALUES(?,?,?,?)', (u, scrypt(c, salt), salt, now())); d.commit()
            except sqlite3.IntegrityError:
                return out('409 Conflict', {'error': 'usuario existe'})
            log(d, env, 'registro', u, 'usuario creado')
            return out('200 OK', {'ok': True})
        if path == '/login' and m == 'POST':
            b = body(env)
            u = str(b.get('usuario', '')).strip().upper(); c = str(b.get('clave', '')).upper()
            r = d.execute('SELECT hash,salt FROM usuarios WHERE usuario=? COLLATE NOCASE', (u,)).fetchone()
            if not r or not hmac.compare_digest(r[0], scrypt(c, r[1])): return out('401 Unauthorized', {'error': 'credenciales'})
            t = secrets.token_hex(24)
            d.execute('INSERT INTO tokens VALUES(?,?,?)', (t, u, now())); d.commit()
            log(d, env, 'login', u, 'sesion iniciada')
            return out('200 OK', {'ok': True, 'token': t, 'usuario': u})
        if path == '/actividad': pass
        usuario = auth(d, env)
        if not usuario: return out('401 Unauthorized', {'error': 'token inválido'})
        if path == '/push' and m == 'POST':
            b = body(env); col = b.get('coleccion', ''); items = b.get('items') or []
            up = 'INSERT INTO items VALUES(?,?,?,?,0,?) ON CONFLICT(coleccion,id) DO UPDATE SET data=excluded.data,ts=excluded.ts,autor=excluded.autor WHERE excluded.ts>=items.ts'
            dl = 'INSERT INTO items VALUES(?,?,?,?,1,?) ON CONFLICT(coleccion,id) DO UPDATE SET borrado=1,ts=excluded.ts,autor=excluded.autor WHERE excluded.ts>=items.ts'
            for it in items:
                ts = int(it.get('ts') or now())
                d.execute(dl if it.get('borrado') else up, (col, str(it.get('id')), json.dumps(it.get('data', it)), ts, usuario))
            d.commit(); log(d, env, 'push', usuario, f"{col} +{len(items)} items")
            return out('200 OK', {'ok': True, 'recibidos': len(items)})
        if path == '/pull' and m == 'GET':
            desde = int((parse_qs(env.get('QUERY_STRING', '')).get('desde') or ['0'])[0] or 0)
            rows = d.execute('SELECT coleccion,id,data,ts,borrado,autor FROM items WHERE ts>?', (desde,)).fetchall()
            if rows: log(d, env, 'pull', usuario, f'{len(rows)} items')
            return out('200 OK', {'ok': True, 'items': [dict(zip(('coleccion','id','data','ts','borrado','autor'), (r[0], r[1], json.loads(r[2]), r[3], r[4], r[5]))) for r in rows]})
        if path == '/snapshot' and m == 'GET':
            rows = d.execute('SELECT coleccion,id,data,ts,borrado,autor FROM items').fetchall()
            log(d, env, 'snapshot', usuario, f'{len(rows)} items')
            return out('200 OK', {'ok': True, 'items': [dict(zip(('coleccion','id','data','ts','borrado','autor'), (r[0], r[1], json.loads(r[2]), r[3], r[4], r[5]))) for r in rows]})
        return out('404 Not Found', {'error': 'no existe'})
    finally:
        d.close()

application = app
