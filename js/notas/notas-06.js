/* ARCHIVO: js/notas/notas-06.js */

        function flyerExportarPDF() {
            const canvas = document.getElementById('flyer-canvas');
            if (!canvas) return;
            const { jsPDF } = window.jspdf;
            const ratio = flyerGetSelectedAspect();
            const w = canvas.width;
            const h = canvas.height;
            const pxToMm = 0.264583;
            const pageW = w * pxToMm;
            const pageH = h * pxToMm;
            const orientation = w > h ? 'l' : 'p';
            const doc = new jsPDF({ orientation: orientation, unit: 'mm', format: [pageW, pageH] });
            const data = canvas.toDataURL('image/jpeg', 1.0);
            doc.addImage(data, 'JPEG', 0, 0, pageW, pageH);
            doc.save(flyerCurrentFileName + '_' + ratio.replace(':', 'x') + '.pdf');
        }


        async function guardarNota() {
            try {
                sincronizarChecksNota();
                const titulo = limpiarNbsp(document.getElementById('nota-titulo').value) || 'Sin título';
                const contenido = limpiarNbsp(document.getElementById('nota-contenido').innerHTML);
                const fecha = new Date().toISOString();

                const recordatorioFecha = notaRecordatorioFechaPendiente || notaRecordatorioFechaExistente || null;

                if (currentNotaId) {
                const index = notas.findIndex(n => n.id === currentNotaId);
                if (index > -1) {
                    const notaExistente = notas[index];
                    const oldRecordatorioFecha = notaExistente.recordatorioFecha;
                    const oldRecordatorioVisto = notaExistente.recordatorioVisto;

                    notaExistente.titulo = titulo;
                    notaExistente.contenido = contenido;
                    notaExistente.actualizada = fecha;
                    notaExistente.recordatorioFecha = recordatorioFecha;

                    if (!recordatorioFecha) {
                        // Recordatorio desactivado: se conserva el visto anterior por si se reactiva
                        notaExistente.recordatorioVisto = oldRecordatorioVisto;
                    } else if (recordatorioFecha === oldRecordatorioFecha) {
                        // Misma fecha: se conserva el visto anterior
                        notaExistente.recordatorioVisto = oldRecordatorioVisto;
                    } else {
                        // Fecha distinta: se reinicia el visto
                        notaExistente.recordatorioVisto = false;
                    }
                }
            } else {
                notas.push({
                    id: Date.now().toString(),
                    titulo,
                    contenido,
                    creada: fecha,
                    actualizada: fecha,
                    recordatorioFecha: recordatorioFecha,
                    recordatorioVisto: false,
                    creadoPor: (typeof syncCfg !== 'undefined' && syncCfg.usuario) || 'YO'
                });
            }

                await saveData();
                localStorage.removeItem('borrador_nota_titulo');
                localStorage.removeItem('borrador_nota_contenido');
                localStorage.removeItem('borrador_nota_id');
                modalNota.hide();
                renderNotas();
                showToast('Nota guardada');
            } catch (err) {
                console.error('Error guardando nota:', err);
                showToast('Error al guardar la nota', 'danger');
            }
        }


        function guardarBorradorNota() {
            sincronizarChecksNota();
            const titulo = limpiarNbsp(document.getElementById('nota-titulo').value || '');
            const contenido = limpiarNbsp(document.getElementById('nota-contenido').innerHTML || '');
            localStorage.setItem('borrador_nota_titulo', titulo);
            localStorage.setItem('borrador_nota_contenido', contenido);
            localStorage.setItem('borrador_nota_id', currentNotaId || '');
        }


        function confirmarCancelarNota() {
            const titulo = document.getElementById('nota-titulo').value.trim();
            const contenido = document.getElementById('nota-contenido').innerHTML.trim();
            const hayContenido = titulo !== '' || (contenido !== '' && contenido !== '<br>' && contenido !== '<p><br></p>');

            if (!hayContenido) {
                limpiarBorradorNota();
                modalNota.hide();
                return;
            }

            modalCancelarNota.show();
        }


        function descartarNota() {
            modalCancelarNota.hide();
            limpiarBorradorNota();
            setTimeout(() => modalNota.hide(), 300);
        }


        function limpiarBorradorNota() {
            localStorage.removeItem('borrador_nota_titulo');
            localStorage.removeItem('borrador_nota_contenido');
            localStorage.removeItem('borrador_nota_id');
            document.getElementById('nota-titulo').value = '';
            document.getElementById('nota-contenido').innerHTML = '';
            currentNotaId = null;
        }


        function filterNotas() {
            const val = document.getElementById('search-notas').value;
            renderNotas(val);
        }


        function renderNotas(filterText = '') {
            const cont = document.getElementById('lista-notas');
            cont.innerHTML = '';

            let lista = [...notas].sort((a, b) => new Date(b.actualizada) - new Date(a.actualizada));

            if (filterText.trim()) {
                const lower = filterText.toLowerCase();
                lista = lista.filter(n => {
                    const creada = n.creada ? new Date(n.creada).toLocaleString().toLowerCase() : '';
                    const actualizada = n.actualizada ? new Date(n.actualizada).toLocaleString().toLowerCase() : '';
                    const titulo = (n.titulo || '').toLowerCase();
                    const contenidoTexto = (n.contenido || '').replace(/<[^>]*>?/gm, ' ').toLowerCase();
                    return titulo.includes(lower) ||
                           creada.includes(lower) ||
                           actualizada.includes(lower) ||
                           contenidoTexto.includes(lower);
                });
            }

            if (lista.length === 0) {
                cont.innerHTML = '<p class="text-muted small text-center my-5">No hay notas. Tocá el botón + para crear una.</p>';
                return;
            }

            lista.forEach(nota => {
                const col = document.createElement('div');
                col.className = 'col-12 col-md-6';

                const preview = nota.contenido
                    ? nota.contenido.replace(/<[^>]*>?/gm, ' ').substring(0, 120) + (nota.contenido.length > 120 ? '...' : '')
                    : '';

                const titulo = nota.titulo || 'Sin título';
                const actualizada = nota.actualizada ? new Date(nota.actualizada).toLocaleString() : '';

                const imgMatch = (nota.contenido || '').match(/<img[^>]+src=["']([^"']+)["']/i);
                const thumbnail = imgMatch ? `
                    <div class="ms-auto" style="width: 56px; height: 56px; flex-shrink: 0;">
                        <img src="${imgMatch[1].replace(/"/g, '&quot;')}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px; border: 1px solid #ddd;" alt="">
                    </div>
                ` : '';

                col.innerHTML = `
                    <div class="card border-0 shadow-sm" style="cursor: pointer;" onclick="abrirEditorNota('${escapeJsString(nota.id)}')">
                        <div class="card-body p-3">
                            <div class="d-flex justify-content-between align-items-start gap-2">
                                <div class="flex-grow-1">
                                    <h6 class="card-title fw-bold mb-1">${escapeHtml(titulo)}</h6>
                                    <p class="text-muted small mb-1" style="font-size: 0.8rem; min-height: 1.2em;">${escapeHtml(preview)}</p>
                                    <div class="text-muted" style="font-size: 0.7rem;">${actualizada}${(nota.creadoPor || nota._por) ? ` · <i class="fas fa-user"></i> ${escapeHtml(nota.creadoPor || nota._por)}` : ''}</div>
                                </div>
                                ${thumbnail}
                            </div>
                            <div class="d-flex justify-content-end">
                                <i class="fas fa-trash text-danger" style="cursor: pointer; opacity: 0.7;" onclick="event.stopPropagation(); confirmarEliminarNota('${escapeJsString(nota.id)}')" title="Eliminar nota"></i>
                            </div>
                        </div>
                    </div>
                `;

                cont.appendChild(col);
            });
        }

