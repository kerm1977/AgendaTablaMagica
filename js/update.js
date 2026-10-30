/* AgendaTribu — sistema de actualizaciones (BLINDADO)
 * GitHub version.json + DownloadManager del sistema.
 * NO TOCAR sin orden explícita del usuario. */

        const APP_VERSION = '2026.10.30-21';
        const UPDATE_URL = 'https://raw.githubusercontent.com/kerm1977/AgendaTablaMagica/main/version.json';
        let updateInfo = null;

        function fetchConTimeout(url, ms) {
            return Promise.race([
                fetch(url, { cache: 'no-store' }),
                new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))
            ]);
        }
        async function consultarVersion() {
            const r = await fetchConTimeout(UPDATE_URL + '?t=' + Date.now(), 12000);
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return await r.json();
        }

        async function buscarActualizacion() {
            const msg = document.getElementById('app-version-msg');
            try {
                msg.textContent = 'Consultando GitHub…'; msg.className = 'small mb-2 text-muted';
                const j = await consultarVersion();
                updateInfo = j;
                if (j.version && j.version !== APP_VERSION) {
                    updateInfo = j;
                    showConfirm(
                        'Nueva actualización disponible',
                        ('Versión instalada: ' + APP_VERSION + String.fromCharCode(10) + 'Nueva versión: ' + j.version + (j.cambios ? String.fromCharCode(10) + j.cambios : '') + String.fromCharCode(10,10) + '¿Descargar e instalar ahora?'),
                        () => descargarActualizacion(),
                        'Sí, actualizar',
                        'btn-success'
                    );
                    msg.textContent = 'Hay nueva versión: ' + j.version; msg.className = 'small mb-2 text-success fw-bold';
                } else {
                    msg.textContent = 'La app está actualizada (v' + APP_VERSION + ')'; msg.className = 'small mb-2 text-muted';
                }
            } catch (e) {
                msg.textContent = 'Error al consultar: ' + (e && e.message ? e.message : e); msg.className = 'small mb-2 text-danger';
            }
        }

        async function verificarActualizacionAutomatica() {
            try {
                if (!navigator.onLine) return;
                const j = await consultarVersion();
                if (!j.version || j.version === APP_VERSION) return;
                const saltada = await localforage.getItem('update_skip_version');
                if (saltada === j.version) return;
                updateInfo = j;
                showConfirm(
                    'Nueva actualización disponible',
                    ('Versión instalada: ' + APP_VERSION + String.fromCharCode(10) + 'Nueva versión: ' + j.version + (j.cambios ? String.fromCharCode(10) + j.cambios : '') + String.fromCharCode(10,10) + '¿Descargar e instalar ahora?'),
                    () => descargarActualizacion(),
                    'Sí, actualizar',
                    'btn-success'
                );
                try {
                    const btnCancel = document.querySelector('#modalConfirm .btn-secondary, #modalConfirm [data-bs-dismiss]');
                    if (btnCancel) btnCancel.addEventListener('click', () => localforage.setItem('update_skip_version', j.version), { once: true });
                } catch (e) { }
            } catch (e) { }
        }

        async function probarConexionesUpdate() {
            const msg = document.getElementById('app-version-msg');
            msg.textContent = 'Probando conexiones…'; msg.className = 'small mb-2 text-muted';
            const ping = async (nombre, url) => {
                const t0 = Date.now();
                try {
                    const r = await fetch(url + (url.includes('?') ? '&' : '?') + 't=' + Date.now(), { cache: 'no-store', signal: AbortSignal.timeout(12000) });
                    return nombre + ': ' + (r.ok ? 'OK (' + (Date.now() - t0) + 'ms)' : 'ERROR ' + r.status);
                } catch (e) { return nombre + ': SIN RESPUESTA'; }
            };
            const gh = await ping('GitHub (versiones)', UPDATE_URL);
            const todoOk = !gh.includes('SIN RESPUESTA') && !gh.includes('ERROR');
            msg.innerHTML = gh + (todoOk ? '<br><b>Canal de actualizaciones operativo</b>' : '<br><b>Sin conexión con GitHub</b>');
            msg.className = 'small mb-2 ' + (todoOk ? 'text-success' : 'text-warning');
        }

        async function mostrarCambiosActualizacion() {
            try {
                const pend = await localforage.getItem('update_instalada_pendiente');
                if (!pend || pend.version !== APP_VERSION) return;
                await localforage.removeItem('update_instalada_pendiente');
                const cuando = pend.fecha ? new Date(pend.fecha).toLocaleString() : 'ahora';
                showConfirm(
                    'Actualización instalada',
                    `La app se actualizó a la versión ${APP_VERSION}.

Cambios aplicados:
${pend.cambios || 'Mejoras generales'}

Descargada: ${cuando}`,
                    () => {},
                    'Entendido',
                    'btn-success'
                );
            } catch (e) { }
        }

        function descargarActualizacion() {
            if (!updateInfo || !updateInfo.apk) return;
            const msg = document.getElementById('app-version-msg');
            // Ruta nativa APK: descarga en background, sin ventana del navegador
            try { localforage.setItem('update_instalada_pendiente', { version: updateInfo.version, cambios: updateInfo.cambios || '', fecha: new Date().toISOString() }); } catch (e) { }
            const a = document.createElement('a');
            a.href = updateInfo.apk + '?v=' + Date.now();
            a.download = 'agendatribu-update.apk';
            document.body.appendChild(a); a.click(); a.remove();
            msg.innerHTML = 'Descargando… Cuando termine, tocá la notificación de descarga e instalá — <b>se actualiza encima, no hace falta desinstalar</b>.';
        }

