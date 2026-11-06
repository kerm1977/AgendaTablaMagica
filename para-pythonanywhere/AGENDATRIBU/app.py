# -*- coding: utf-8 -*-
# AgendaTribu — nodo de actualizaciones en PythonAnywhere
# Autocontenido: SOLO lee/escribe dentro de /home/kenth1977/AGENDATRIBU/
# Sin dependencias externas (WSGI puro, stdlib).
import os, json, time

BASE = os.path.dirname(os.path.abspath(__file__))  # /home/kenth1977/AGENDATRIBU

HEAD = [('Content-Type', 'application/json; charset=utf-8'),
        ('Access-Control-Allow-Origin', '*')]

def _leer(nombre, binario=False):
    ruta = os.path.join(BASE, nombre)
    if not os.path.isfile(ruta):
        return None
    with open(ruta, 'rb' if binario else 'r', encoding=None if binario else 'utf-8') as f:
        return f.read()

def application(env, start):
    path = (env.get('PATH_INFO') or '/').rstrip('/') or '/'
    if path == '/ping':
        start('200 OK', HEAD)
        return [json.dumps({'ok': True, 'nodo': 'AGENDATRIBU', 'ts': int(time.time())}).encode()]
    if path == '/version.json':
        data = _leer('version.json')
        if data is None:
            start('404 Not Found', HEAD); return [b'{"ok":false}']
        start('200 OK', HEAD); return [data.encode()]
    if path == '/agendatribu.apk':
        data = _leer('agendatribu.apk', binario=True)
        if data is None:
            start('404 Not Found', HEAD); return [b'{"ok":false}']
        start('200 OK', [('Content-Type', 'application/vnd.android.package-archive'),
                         ('Content-Length', str(len(data))),
                         ('Access-Control-Allow-Origin', '*')])
        return [data]
    # raíz: tarjeta de estado
    ver = _leer('version.json')
    v = json.loads(ver).get('version', '?') if ver else 'sin version.json'
    apk = 'SÍ' if os.path.isfile(os.path.join(BASE, 'agendatribu.apk')) else 'NO'
    html = f"""<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>AgendaTribu</title>
<style>body{{font-family:-apple-system,'Segoe UI',sans-serif;background:#0f0f0f;color:#eee;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}}
.card{{background:#1c1c1c;border:1px solid #333;border-radius:14px;padding:32px 40px;text-align:center}}
.ok{{color:#4ade80;font-size:2rem}}h1{{font-size:1.2rem;margin:10px 0 6px}}p{{color:#888;font-size:.85rem;margin:4px 0}}</style></head>
<body><div class="card"><div class="ok">●</div><h1>AgendaTribu — Nodo en línea</h1>
<p>Versión publicada: <b>{v}</b></p><p>APK disponible: <b>{apk}</b></p>
<p>Endpoints: /ping · /version.json · /agendatribu.apk</p></div></body></html>"""
    start('200 OK', [('Content-Type', 'text/html; charset=utf-8')])
    return [html.encode()]
