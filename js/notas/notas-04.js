/* ARCHIVO: js/notas/notas-04.js */

        function formatearContenidoNotaParaWhatsApp(element) {
            if (!element) return '';
            let texto = '';

            function recorrer(nodo) {
                if (nodo.nodeType === Node.TEXT_NODE) {
                    texto += nodo.textContent;
                    return;
                }
                if (nodo.nodeType !== Node.ELEMENT_NODE) return;
                const tag = nodo.tagName.toLowerCase();

                if (tag === 'br') {
                    texto += '\n';
                    return;
                }
                if (tag === 'img') {
                    texto += '[IMAGEN]\n';
                    return;
                }
                if (tag === 'p' || tag === 'div') {
                    for (const hijo of nodo.childNodes) recorrer(hijo);
                    texto += '\n';
                    return;
                }
                if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4' || tag === 'h5' || tag === 'h6') {
                    texto += '*';
                    for (const hijo of nodo.childNodes) recorrer(hijo);
                    texto += '*\n';
                    return;
                }
                if (tag === 'ul') {
                    if (nodo.classList.contains('checklist-nota')) {
                        for (const hijo of nodo.childNodes) {
                            if (hijo.tagName === 'LI') {
                                const cb = hijo.querySelector('input[type="checkbox"]');
                                const checked = cb && cb.checked;
                                texto += (checked ? '[x] ' : '[ ] ');
                                for (const n of hijo.childNodes) {
                                    if (n.nodeType === Node.ELEMENT_NODE && (n.tagName === 'INPUT' || n.tagName === 'SPAN')) {
                                        if (n.tagName === 'SPAN') recorrer(n);
                                    } else {
                                        recorrer(n);
                                    }
                                }
                                texto += '\n';
                            } else {
                                recorrer(hijo);
                            }
                        }
                    } else {
                        for (const hijo of nodo.childNodes) {
                            if (hijo.tagName === 'LI') {
                                texto += '• ';
                                for (const n of hijo.childNodes) recorrer(n);
                                texto += '\n';
                            } else {
                                recorrer(hijo);
                            }
                        }
                    }
                    return;
                }
                if (tag === 'ol') {
                    let idx = 1;
                    for (const hijo of nodo.childNodes) {
                        if (hijo.tagName === 'LI') {
                            texto += `${idx}. `;
                            for (const n of hijo.childNodes) recorrer(n);
                            texto += '\n';
                            idx++;
                        } else {
                            recorrer(hijo);
                        }
                    }
                    return;
                }
                if (tag === 'li') {
                    for (const hijo of nodo.childNodes) recorrer(hijo);
                    return;
                }
                // strong, em, span, etc.
                for (const hijo of nodo.childNodes) recorrer(hijo);
            }

            for (const hijo of element.childNodes) recorrer(hijo);
            return limpiarNbsp(texto.replace(/\n{3,}/g, '\n\n')).trim();
        }


        function compartirNotaWhatsApp() {
            const tituloInput = document.getElementById('nota-titulo');
            const contenidoEl = document.getElementById('nota-contenido');
            const titulo = (tituloInput ? tituloInput.value : '').trim() || 'Sin título';
            const contenido = formatearContenidoNotaParaWhatsApp(contenidoEl);
            const texto = `*${titulo}*\n\n${contenido}`;
            window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
        }


        function toggleRecordatorioNota() {
            const fecha = notaRecordatorioFechaPendiente || notaRecordatorioFechaExistente;
            if (fecha) {
                // Si ya tiene recordatorio, lo desactiva
                notaRecordatorioFechaPendiente = null;
                notaRecordatorioFechaExistente = null;
                actualizarBotonRecordatorio();
            } else {
                const input = document.getElementById('nota-fecha-recordatorio');
                input.value = obtenerFechaCRString();
                modalRecordatorioNota.show();
            }
        }


        function guardarFechaRecordatorio() {
            const input = document.getElementById('nota-fecha-recordatorio');
            const fecha = input.value;
            if (!fecha) {
                showToast('Seleccioná una fecha', 'warning');
                return;
            }
            notaRecordatorioFechaPendiente = fecha;
            notaRecordatorioFechaExistente = fecha;
            actualizarBotonRecordatorio();
            modalRecordatorioNota.hide();
        }

        function verificarRecordatorios() {
            const hoy = obtenerFechaCRString();
            const pendientes = notas.filter(n => n.recordatorioFecha === hoy && !n.recordatorioVisto);
            const modalAbierto = document.getElementById('modalRecordatoriosHoy').classList.contains('show');
            if (!modalAbierto && Date.now() < recordatoriosSnoozeHasta) return;

            if (pendientes.length === 0) {
                if (modalAbierto && modalRecordatoriosHoy) modalRecordatoriosHoy.hide();
                return;
            }

            recordatoriosActuales = pendientes;
            mostrarModalRecordatorios();
        }


        function mostrarModalRecordatorios() {
            if (!modalRecordatoriosHoy) return;
            const contenedor = document.getElementById('recordatorios-contenido');
            if (!contenedor) return;

            let html = '';
            recordatoriosActuales.forEach(n => {
                const contenidoTexto = (n.contenido || '').replace(/<[^>]+>/g, ' ').trim();
                html += `
                    <div class="alert alert-light border-start border-4 border-warning" style="border-color: var(--primary-dark) !important;">
                        <div class="d-flex justify-content-between align-items-start gap-2 mb-1">
                            <strong class="d-block"><i class="far fa-bell me-1 text-warning"></i> ${escapeHtml(n.titulo)}</strong>
                            <button type="button" class="btn btn-sm btn-outline-primary py-0 px-2" onclick="irANotaRecordatorio('${n.id}')" style="font-size: 0.75rem;">Ir a nota</button>
                        </div>
                        <p class="mb-0 small" style="white-space: pre-wrap;">${escapeHtml(contenidoTexto)}</p>
                    </div>`;
            });
            contenedor.innerHTML = html;
            modalRecordatoriosHoy.show();
        }


        async function irANotaRecordatorio(notaId) {
            const nota = notas.find(n => n.id === notaId);
            if (!nota) return;
            nota.recordatorioVisto = true;
            await saveData();
            if (modalRecordatoriosHoy) modalRecordatoriosHoy.hide();
            recordatoriosSnoozeHasta = Date.now() + 5 * 60 * 1000;
            recordatoriosActuales = recordatoriosActuales.filter(n => n.id !== notaId);
            setTimeout(() => abrirEditorNota(notaId), 300);
        }


        async function descartarRecordatoriosModal() {
            recordatoriosActuales.forEach(n => n.recordatorioVisto = true);
            await saveData();
            if (modalRecordatoriosHoy) modalRecordatoriosHoy.hide();
            recordatoriosActuales = [];
        }


        function verRecordatoriosDespues() {
            if (modalRecordatoriosHoy) modalRecordatoriosHoy.hide();
            // Pospone 30 minutos el recordatorio; tras ese tiempo vuelve a aparecer.
            recordatoriosSnoozeHasta = Date.now() + 30 * 60 * 1000;
        }

        function abrirOracionTribu() {
            const contenedor = document.getElementById('oracion-contenido');
            if (!contenedor) return;
            const guardada = localStorage.getItem('tribu_oracion') || ORACION_TRIBU;
            contenedor.innerText = guardada;
            contenedor.style.fontSize = tamanioOracion + 'rem';
            modalOracionTribu.show();
        }


        function guardarOracionTribu() {
            const contenedor = document.getElementById('oracion-contenido');
            if (contenedor) {
                localStorage.setItem('tribu_oracion', contenedor.innerText);
            }
        }

