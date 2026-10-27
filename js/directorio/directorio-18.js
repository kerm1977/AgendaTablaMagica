/* ARCHIVO: js/directorio/directorio-18.js */

        // NO MODIFICAR: Respaldo completo con todos los campos
        async function obtenerRespaldoCompleto() {
            const raw = localStorage.getItem('agendaDatos');
            let agendaDatos = null;
            if (raw) { try { agendaDatos = JSON.parse(raw); } catch (e) { agendaDatos = null; } }
            const completo = await TribuRespaldos.capturar();
            return {
                ...collectDbState(),
                calendarioCaminatas,
                diasFestivos,
                respaldoIntegral: completo,
                caminatas: caminatas,
                personasGlobales: [...(personasGlobales || [])],
                directorioPersonas: (directorioPersonas || []).map(p => normalizarDirectorioPersona(p)),
                notas: (notas || []).map(n => normalizarNota(n)),
                consecutivoFactura: consecutivoFactura || 1,
                preciosBuseta: (preciosBuseta || []).map(p => normalizarPrecioBuseta(p)),
                ultimoRespaldo: ultimoRespaldo || 0,
                historialRetiros: (historialRetiros || []).map(r => normalizarRetiro(r)),
                preferenciasCumpleanos: obtenerPreferenciasCumpleanos() || {},
                configTema: normalizarConfigTema(configTema),
                agenda: agendaDatos || { reconocer: [], conocidos: [], feriados: [] },
                exportDate: new Date().toISOString()
            };
        }


        async function exportData() {
            const dataToExport = await obtenerRespaldoCompleto();

            const content = JSON.stringify(dataToExport, null, 2);
            await localforage.setItem('respaldo_integral_ultimo_json', content);
            const dateStr = hoyStrCR();
            const fileName = `Respaldo_Caminatas_${dateStr}_${Date.now()}.json`;

            // Guarda en la carpeta "respaldos" si está elegida; si no, descarga normal.
            if (window.TribuRespaldos) {
                await TribuRespaldos.guardar(fileName, content);
                TribuRespaldos.renderPanel();
                return;
            }
            const blob = new Blob([content], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }


        // Importa un .json que el usuario dejó manualmente en la carpeta "respaldos".
        async function importarDesdeRespaldos(nombreArchivo) {
            if (!window.TribuRespaldos) return;
            const file = await TribuRespaldos.leerArchivo(nombreArchivo);
            if (!file) { showToast('No se pudo leer el respaldo', 'danger'); return; }
            if (/\.(db|sqlite)$/i.test(file.name)) await TribuRespaldos.importarDB({ target: { files: [file] } });
            else await importData({ target: { files: [file] } });
        }


        async function exportDataWhatsApp() {
            const dataToExport = await obtenerRespaldoCompleto();

            const content = JSON.stringify(dataToExport, null, 2);
            const blob = new Blob([content], { type: 'application/json' });
            const dateStr = new Date().toISOString().split('T')[0];
            const fileName = `Respaldo_Caminatas_${dateStr}_${Date.now()}.json`;
            const file = new File([blob], fileName, { type: 'application/json' });

            if (navigator.share) {
                try {
                    await navigator.share({
                        title: 'Respaldo Caminatas',
                        text: 'Respaldo completo de la aplicación Caminatas de la Tribu de Los Libres',
                        files: [file]
                    });
                    showToast('Respaldo listo para compartir', 'success');
                    return;
                } catch (err) {
                    if (err.name !== 'AbortError') {
                        console.error('Error compartiendo:', err);
                    }
                }
            }

            // Fallback: descargar el archivo para que lo comparta manualmente
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            showToast('No se pudo compartir automáticamente. Se descargó el archivo; compartilo manualmente.', 'warning');
        }


        // NO MODIFICAR: Función para exportar respaldo completo a TXT (contiene JSON exacto para importación)
        async function exportarRespaldoTXT() {
            const dataToExport = await obtenerRespaldoCompleto();
            const content = JSON.stringify(dataToExport, null, 2);
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            const dateStr = new Date().toISOString().split('T')[0];
            const fileName = `Respaldo_Caminatas_${dateStr}.txt`;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            showToast('Respaldo TXT completo exportado (contiene JSON)', 'success');
        }


        function mergeByIdOrProps(existing, incoming, props = ['id']) {
            const result = [...(existing || [])];
            if (!incoming || !Array.isArray(incoming)) return result;
            incoming.forEach(item => {
                if (!item || typeof item !== 'object') return;
                const exists = result.some(e => props.every(p => e[p] === item[p]));
                if (!exists) result.push(item);
            });
            return result;
        }


        function mergeUniqueStrings(existing, incoming) {
            const set = new Set(existing || []);
            (incoming || []).forEach(s => { if (s) set.add(s); });
            return Array.from(set);
        }


        // NO MODIFICAR: Fusión de caminatas importadas
        function mergeCaminatas(existing, incoming) {
            const result = [...(existing || [])];
            if (!incoming || !Array.isArray(incoming)) return result;
            incoming.forEach(cam => {
                if (!cam) return;
                const existsById = result.some(c => c.id === cam.id);
                if (existsById) return;
                const existsByData = result.some(c =>
                    c.id !== cam.id &&
                    c.nombre === cam.nombre &&
                    (c.fechaLocal === cam.fechaLocal || c.fechaIda === cam.fechaIda) &&
                    c.tipo === cam.tipo
                );
                if (existsByData) return;

                // Normalizar campos de respaldos antiguos
                if (!cam.lugaresRecoger && cam.recoger) {
                    cam.lugaresRecoger = String(cam.recoger).split(',').map(l => l.trim()).filter(Boolean);
                }
                if (!Array.isArray(cam.lugaresRecoger)) cam.lugaresRecoger = [];
                if (cam.incluye === undefined) cam.incluye = [];
                if (cam.formasPago === undefined) cam.formasPago = [];
                if (cam.otrosDescripcion === undefined) cam.otrosDescripcion = '';
                if (cam.horaSalida === undefined) cam.horaSalida = '';
                if (cam.lugarSalida === undefined) cam.lugarSalida = '';
                if (cam.notasAdicionales === undefined) cam.notasAdicionales = '';
                if (!cam.equipo || !Array.isArray(cam.equipo)) {
                    cam.equipo = (configTema.equipoRequerido || []).map(item => ({ item, estado: 'Si' }));
                }
                if (!cam.pasajeros || !Array.isArray(cam.pasajeros)) cam.pasajeros = [];
                cam.pasajeros.forEach(p => {
                    if (!p.id) p.id = Date.now().toString();
                    if (!p.estado) p.estado = 'pendiente';
                    if (!p.abonos) p.abonos = '';
                    if (!p.historialMontos) p.historialMontos = [];
                    if (p.nota === undefined) p.nota = '';
                    if (p.notaPublica === undefined) p.notaPublica = false;
                    if (p.mostrarTotalEnLista === undefined) p.mostrarTotalEnLista = true;
                });

                if (cam.dificultad === undefined) cam.dificultad = '';
                if (cam.kilometros === undefined) cam.kilometros = '';
                if (cam.modoTransporte === undefined) cam.modoTransporte = 'Terrestre';
                if (cam.aerolinea === undefined) cam.aerolinea = '';
                if (cam.tieneVuelo === undefined) cam.tieneVuelo = false;
                if (cam.tieneFechaVuelo === undefined) cam.tieneFechaVuelo = false;
                if (cam.numeroVuelo === undefined) cam.numeroVuelo = '';
                if (cam.vueloFechaSalida === undefined) cam.vueloFechaSalida = '';
                if (cam.vueloHoraSalida === undefined) cam.vueloHoraSalida = '';
                if (cam.vueloFechaRegreso === undefined) cam.vueloFechaRegreso = '';
                if (cam.vueloHoraRegreso === undefined) cam.vueloHoraRegreso = '';
                if (cam.incluirVueloWhatsApp === undefined) cam.incluirVueloWhatsApp = false;
                if (!Array.isArray(cam.urls)) cam.urls = (cam.url ? [cam.url] : []);
                if (cam.mostrarIncluye === undefined) cam.mostrarIncluye = true;
                if (cam.mostrarFormasPago === undefined) cam.mostrarFormasPago = true;
                if (cam.mostrarInstrucciones === undefined) cam.mostrarInstrucciones = true;
                if (cam.mostrarUrls === undefined) cam.mostrarUrls = true;
                if (cam.mostrarCaminantes === undefined) cam.mostrarCaminantes = true;

                result.push(cam);
            });
            return result;
        }

