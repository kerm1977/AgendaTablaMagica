# GUÍA COMPLETA — Montar el servidor en PythonAnywhere (para dummies)

Sirve para **cualquier cuenta** de PythonAnywhere.
Ejemplos: `kenth1977`, `lospatitosfeos` — donde dice CUENTA poné tu usuario.

Los archivos que necesitás están en `C:\Users\MINIOS\Desktop\app\server\`
(o los descargás desde la app → Sincronización Global → Guía B):
- `wsgi_app.py`  ← el servidor
- `APP-EN-COMUNICACION-CON-PYTHONANYWHERE.txt`  ← el marcador

---

## PASO 1 — Crear la cuenta (una sola vez)

1. Entrá a **https://www.pythonanywhere.com**
2. *Start running Python online in less than 60 seconds* → **Sign up**
3. Poné usuario (será tu URL: `usuario.pythonanywhere.com`), email y contraseña
4. Confirmá el email que te llega

## PASO 2 — Crear el Web App

1. Ya logueado → pestaña **Web** (arriba)
2. **Add a new web app** → Next → **Manual configuration** (NO Flask/Django)
3. Python **3.10** (o la más nueva) → Next → listo, te lleva a la página de configuración

## PASO 3 — Subir los archivos del servidor

1. Arriba → pestaña **Files**
2. Entrá a **home → CUENTA** → en "Enter new directory name" escribí **`syncapp`** → New directory
3. Entrá a `syncapp` → botón **Upload a file** → subí:
   - `wsgi_app.py`
   - `APP-EN-COMUNICACION-CON-PYTHONANYWHERE.txt`
4. Verificá que queden los 2 archivos listados

## PASO 4 — Configurar el archivo WSGI

1. Volve a **Web** → tu sitio `CUENTA.pythonanywhere.com`
2. En **Code → WSGI configuration file** → click en el link azul
   `/var/www/CUENTA_pythonanywhere_com_wsgi.py`
3. **Borrá TODO** el contenido que tenga y pegá solo esto (cambiando CUENTA):

```python
import sys
sys.path.insert(0, '/home/CUENTA/syncapp')
from wsgi_app import application
```

4. Botón **Save** (arriba a la derecha)

## PASO 5 — Ajustar "Source code"

En la misma página del web app → **Code → Source code**:
borrá lo que tenga y escribí: **`/home/CUENTA/syncapp`**

## PASO 6 — Reload

Botón verde grande arriba: **Reload CUENTA.pythonanywhere.com**

## PASO 7 — Verificar que vive

Abrí en el navegador: **`https://CUENTA.pythonanywhere.com/ping`**

- `{"ok":true,"ahora":…}` → **FUNCIONA** ✓
- Error 404/500 → revisá que `wsgi_app.py` esté en `/home/CUENTA/syncapp`
  y que el archivo WSGI diga exactamente las 3 líneas del Paso 4
- Más detalle del error: web app → **Error log**

## PASO 8 — Conectar la app

En el teléfono → Ajustes → Sincronización Global:

1. **Servidor preferido** → tocá **B · Nube (PythonAnywhere)**
2. **Cuenta nube** → escribí tu usuario PA (ej. `lospatitosfeos`)
   (o la URL completa — ambas funcionan)
3. **Usuario + Contraseña** (todo MAYÚSCULAS)
4. **Registrar** (una vez) → **Conectar** → `Conectado como…`
5. 📡 Probar → debe decir `En línea ✓`

## PASO 9 — Mantenerlo vivo (cuenta gratis)

**IMPORTANTE — cuentas gratis**: PythonAnywhere desactiva el sitio si no
entrás al menos una vez al mes y tocás **"Run until 1 month from today"**
en la página Web. Te manda email una semana antes de que se apague.
Cuenta paga = permanente, sin mantenimiento.

## PASO 10 — Verificar tráfico

La página `https://CUENTA.pythonanywhere.com` muestra:
`AgendaTribu Sync (respaldo) — N usuario(s), M item(s) — tribu_com_tribu_tablamagica.db`
Cada login/push/pull queda registrado y el `.db` se crea solo.

---

## Resumen en una línea

```
Crear cuenta → Web app manual → carpeta syncapp → subir wsgi_app.py →
pegar 3 líneas en el WSGI file → Source code → Reload → /ping ok →
en la app: Cuenta nube + B + Registrar + Conectar
```
