/* ARCHIVO: js/ajustes/ajustes-02.js */

        function agregarRequerimientoCotizador() {
            const tipo = document.getElementById('cot-tipo-requerimiento').value;
            if (!tipo) {
                showToast('Seleccioná un tipo de requerimiento', 'warning');
                return;
            }
            if (tipo === 'hospedaje') {
                const sencilla = Number(document.getElementById('cot-hab-sencilla').value || 0);
                const doble = Number(document.getElementById('cot-hab-doble').value || 0);
                const triple = Number(document.getElementById('cot-hab-triple').value || 0);
                const cuadruple = Number(document.getElementById('cot-hab-cuadruple').value || 0);
                const pareja = Number(document.getElementById('cot-hab-pareja').value || 0);
                if (sencilla + doble + triple + cuadruple + pareja === 0) {
                    showToast('Indicá al menos una habitación', 'warning');
                    return;
                }
                cotRequerimientos.push({
                    id: Date.now().toString(),
                    tipo,
                    sencilla,
                    doble,
                    triple,
                    cuadruple,
                    pareja
                });
                document.getElementById('cot-hab-sencilla').value = 0;
                document.getElementById('cot-hab-doble').value = 0;
                document.getElementById('cot-hab-triple').value = 0;
                document.getElementById('cot-hab-cuadruple').value = 0;
                document.getElementById('cot-hab-pareja').value = 0;
            } else if (tipo === 'nota') {
                const nota = document.getElementById('cot-req-nota').value.trim();
                if (!nota) {
                    showToast('Escribí una nota', 'warning');
                    return;
                }
                cotRequerimientos.push({ id: Date.now().toString(), tipo, nota });
                document.getElementById('cot-req-nota').value = '';
            } else {
                const cantidad = Number(document.getElementById('cot-trans-cantidad').value || 0);
                let url = document.getElementById('cot-trans-url').value.trim();
                if (url && !/^https?:\/\//i.test(url)) url = 'https://' + url;
                if (cantidad <= 0) {
                    showToast('Indicá una cantidad de personas', 'warning');
                    return;
                }
                cotRequerimientos.push({ id: Date.now().toString(), tipo, cantidad, url });
                document.getElementById('cot-trans-cantidad').value = 1;
                document.getElementById('cot-trans-url').value = '';
            }
            document.getElementById('cot-tipo-requerimiento').value = '';
            mostrarCamposRequerimientoCotizador();
            renderRequerimientosCotizador();
            showToast('Requerimiento agregado', 'success');
        }


        function eliminarRequerimientoCotizador(id) {
            cotRequerimientos = cotRequerimientos.filter(r => r.id !== id);
            renderRequerimientosCotizador();
        }


        function renderRequerimientosCotizador() {
            const cont = document.getElementById('cot-lista-requerimientos');
            if (!cont) return;
            if (cotRequerimientos.length === 0) {
                cont.innerHTML = '<p class="text-muted small mb-0">Aún no hay requerimientos agregados.</p>';
                return;
            }
            cont.innerHTML = cotRequerimientos.map(req => {
                let detalle = '';
                if (req.tipo === 'hospedaje') {
                    const partes = [];
                    if (req.sencilla > 0) partes.push(`Sencilla: ${req.sencilla}`);
                    if (req.doble > 0) partes.push(`Doble: ${req.doble}`);
                    if (req.triple > 0) partes.push(`Triple: ${req.triple}`);
                    if (req.cuadruple > 0) partes.push(`Cuádruple: ${req.cuadruple}`);
                    if (req.pareja > 0) partes.push(`Pareja: ${req.pareja}`);
                    detalle = partes.join(' · ');
                } else if (req.tipo === 'nota') {
                    detalle = escapeHtml(req.nota);
                } else {
                    detalle = `Cantidad de personas: ${req.cantidad}`;
                    if (req.url) detalle += ` · URL: ${escapeHtml(req.url)}`;
                }
                return `
                    <div class="d-flex justify-content-between align-items-center bg-light rounded px-2 py-1 mb-1">
                        <span class="small text-muted"><b>${etiquetaTipoCotizador(req.tipo)}</b> — ${detalle}</span>
                        <button type="button" class="btn btn-sm text-danger" onclick="eliminarRequerimientoCotizador('${req.id}')" title="Eliminar"><i class="fas fa-trash-alt"></i></button>
                    </div>
                `;
            }).join('');
            actualizarResumenCotizador();
        }


        function actualizarResumenCotizador() {
            const personas = document.getElementById('cot-personas').value || '1';
            const dias = Number(document.getElementById('cot-dias').value || 1);
            let fechas = '';
            if (dias > 1) {
                const ingreso = document.getElementById('cot-fecha-ingreso').value;
                const salida = document.getElementById('cot-fecha-salida').value;
                fechas = `Fecha ingreso: ${ingreso || '—'} | Fecha salida: ${salida || '—'} (${dias} días)`;
            } else {
                const fecha = document.getElementById('cot-fecha-unica').value;
                fechas = `Fecha del requerimiento: ${fecha || '—'}`;
            }

            const resumenEl = document.getElementById('cot-resumen');
            if (!resumenEl) return;

            if (cotRequerimientos.length === 0) {
                resumenEl.innerText = `Personas: ${personas}\nDías: ${dias}\n${fechas}\nAún no hay requerimientos.`;
                return;
            }

            let lineas = [`Personas: ${personas}`, `Días: ${dias}`, fechas, ''];
            cotRequerimientos.forEach(req => {
                if (req.tipo === 'hospedaje') {
                    const total = (req.sencilla || 0) + (req.doble || 0) + (req.triple || 0) + (req.cuadruple || 0) + (req.pareja || 0);
                    lineas.push(`Hospedaje — Total: ${total} habitaciones`);
                    if (req.sencilla > 0) lineas.push(`  · Sencilla: ${req.sencilla}`);
                    if (req.doble > 0) lineas.push(`  · Doble: ${req.doble}`);
                    if (req.triple > 0) lineas.push(`  · Triple: ${req.triple}`);
                    if (req.cuadruple > 0) lineas.push(`  · Cuádruple: ${req.cuadruple}`);
                    if (req.pareja > 0) lineas.push(`  · Pareja: ${req.pareja}`);
                } else if (req.tipo === 'nota') {
                    lineas.push(`Nota: ${req.nota}`);
                } else {
                    lineas.push(`${etiquetaTipoCotizador(req.tipo)}: ${req.cantidad} personas`);
                    if (req.url) lineas.push(`  URL: ${req.url}`);
                }
            });
            resumenEl.innerText = lineas.join('\n');
        }

