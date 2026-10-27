/* ARCHIVO: js/directorio/directorio-07.js */

        function compartirHistorialParticipacionWhatsApp() {
            const todas = obtenerTodasParticipaciones();
            if (todas.length === 0) {
                showToast('No hay participaciones registradas para exportar', 'warning');
                return;
            }

            const porPersona = {};
            todas.forEach(r => {
                const key = r.nombre || 'Desconocido';
                if (!porPersona[key]) porPersona[key] = 0;
                porPersona[key]++;
            });

            let texto = '*Historial de Participación*\n\n';
            Object.entries(porPersona)
                .sort((a, b) => b[1] - a[1])
                .forEach(([nombre, cantidad]) => {
                    texto += `- ${nombre}: ${cantidad} participación${cantidad !== 1 ? 'es' : ''}\n`;
                });

            texto += '\n*Detalle*\n';
            const ordenado = [...todas].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
            ordenado.forEach(r => {
                texto += `- ${r.nombre || 'Desconocido'} | ${r.camNombre || 'Caminata eliminada'} | ${formatearFechaRetiro(r.fecha)}\n`;
            });

            window.open(`https://wa.me/?text=${encodeURIComponent(texto.trim())}`, '_blank');
        }


        function historialRetirosDePersona(nombre) {
            const nombreLower = (nombre || '').toLowerCase().trim();
            return historialRetiros
                .filter(r => (r.nombre || '').toLowerCase().trim() === nombreLower)
                .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        }


        // --- PARTICIPACIÓN EN CAMINATAS ---
        // Fecha "de cierre" de una caminata: la fecha local si es Local,
        // o la fecha de regreso (o ida si no hay regreso) si es Internacional.
        function fechaFinCaminata(cam) {
            if (!cam) return '';
            if (cam.tipo === 'Local') return cam.fechaLocal || '';
            return cam.fechaRegreso || cam.fechaIda || '';
        }


        function fechaYaPaso(fechaStr) {
            if (!fechaStr) return false;
            const fecha = new Date(fechaStr);
            if (isNaN(fecha.getTime())) return false;
            return fecha < obtenerHoyCR();
        }


        // Una persona "participó" en una caminata si sigue en la lista de
        // pasajeros (no fue retirada) y la fecha de la caminata ya pasó.
        function participacionesDePersona(nombre) {
            const nombreLower = (nombre || '').toLowerCase().trim();
            const resultado = [];
            caminatas.forEach(cam => {
                if (!cam.pasajeros) return;
                const pas = cam.pasajeros.find(p => (p.nombre || '').toLowerCase().trim() === nombreLower);
                if (!pas) return;
                const fechaFin = fechaFinCaminata(cam);
                if (fechaYaPaso(fechaFin)) {
                    resultado.push({ camId: cam.id, camNombre: cam.nombre, fecha: fechaFin });
                }
            });
            return resultado.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        }


        // Todas las participaciones de todas las personas (para estadística global)
        function obtenerTodasParticipaciones() {
            // Usar historial permanente de asistencia en lugar de caminatas actuales
            // Esto garantiza que las participaciones se mantengan aunque se elimine la caminata
            const resultado = [];
            historialAsistencia.forEach(reg => {
                resultado.push({ 
                    nombre: reg.nombre, 
                    camId: reg.camId, 
                    camNombre: reg.camNombre, 
                    fecha: reg.fecha 
                });
            });
            return resultado;
        }


        function formatearFechaRetiro(fechaIso) {
            try {
                const f = new Date(fechaIso);
                return f.toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' });
            } catch (e) {
                return fechaIso || '';
            }
        }


        function listasDeCaminataDePersona(persona) {
            const nombreLower = (persona.nombre || '').toLowerCase().trim();
            const coincidencias = [];
            caminatas.forEach(cam => {
                if (cam.pasajeros) {
                    const pas = cam.pasajeros.find(p => (p.nombre || '').toLowerCase().trim() === nombreLower);
                    if (pas) coincidencias.push({ camId: cam.id, camNombre: cam.nombre, pasId: pas.id });
                }
            });
            return coincidencias;
        }


        function enlaceUrlClickeable(url) {
            const u = (url || '').trim();
            if (!u) return '';
            let href = u;
            if (!/^https?:\/\//i.test(href)) href = 'https://' + href;
            return `<a href="${href}" target="_blank" rel="noopener" class="text-primary text-decoration-underline small text-break d-inline-block" style="max-width:100%; word-break:break-all;">${escapeHtml(u)}</a>`;
        }


        function convertirUrlsEnNotas(texto) {
            const t = (texto || '').toString();
            if (!t.trim()) return '';
            // Escapamos HTML primero y luego convertimos URLs en enlaces clickables.
            const esc = escapeHtml(t);
            return esc.replace(/(https?:\/\/[^\s<]+)/g, (match) => {
                return `<a href="${match}" target="_blank" rel="noopener" class="text-primary text-decoration-underline text-break d-inline-block" style="max-width:100%; word-break:break-all;">${match}</a>`;
            });
        }

