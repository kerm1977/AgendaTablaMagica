/* ARCHIVO: js/directorio/directorio-22.js */

        async function compartirDirectorioWhatsApp() {
            const data = { directorioPersonas: directorioPersonas, exportDate: new Date().toISOString() };
            const content = JSON.stringify(data, null, 2);
            const blob = new Blob([content], { type: 'application/json' });
            const dateStr = new Date().toISOString().split('T')[0];
            const fileName = `Directorio_${dateStr}.json`;

            if (navigator.canShare && navigator.canShare({ files: [new File([blob], fileName, { type: 'application/json' })] })) {
                const file = new File([blob], fileName, { type: 'application/json' });
                await navigator.share({ title: 'Respaldo de Directorio', text: 'Respaldo JSON de directorio', files: [file] });
            } else {
                const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(content);
                const link = document.createElement('a');
                link.href = dataStr;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                link.remove();
                showToast('Directorio descargado. Se abrió WhatsApp para que elijas con quién compartirlo.');
                abrirWhatsAppParaAdjuntar(fileName);
            }
        }


        function importarDirectorioJSON(event) {
            const file = event.target.files[0];
            if (!file) return;

            showConfirm(
                'Importar Directorio',
                'Esto AGREGARÁ los contactos del archivo al directorio actual. ¿Continuar?',
                async () => {
                    const reader = new FileReader();
                    reader.onload = async (e) => {
                        try {
                            const data = JSON.parse(e.target.result);
                            if (data.directorioPersonas && Array.isArray(data.directorioPersonas)) {
                                function claveNombre(n) {
                                    return (n || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, ' ').trim();
                                }
                                function palabras(n) {
                                    return new Set(claveNombre(n).split(/\s+/).filter(Boolean));
                                }
                                function esSimilar(a, b) {
                                    const wa = palabras(a), wb = palabras(b);
                                    if (!wa.size || !wb.size) return false;
                                    let comunes = 0;
                                    wa.forEach(w => { if (wb.has(w)) comunes++; });
                                    return comunes >= 2 || (wa.size === 1 && wb.has([...wa][0])) || (wb.size === 1 && wa.has([...wb][0]));
                                }
                                data.directorioPersonas.forEach(p => {
                                    p.nombre = p.nombre || '';
                                    p.cedula = p.cedula || '';
                                    p.correo = p.correo || '';
                                    p.notas = p.notas || '';
                                    p.pasaporte = p.pasaporte || '';
                                    p.telefono = p.telefono || '';
                                    const idx = directorioPersonas.findIndex(x => x.id === p.id || esSimilar(x.nombre || '', p.nombre));
                                    if (idx > -1) {
                                        const existente = directorioPersonas[idx];
                                        // Conservar teléfono existente
                                        if (!p.telefono) p.telefono = existente.telefono || '';
                                        // Unir cédulas sin duplicar
                                        if (p.cedula && !existente.cedula) {
                                            existente.cedula = p.cedula;
                                        } else if (p.cedula && !existente.cedula.includes(p.cedula)) {
                                            existente.cedula = (existente.cedula ? existente.cedula + '; ' : '') + p.cedula;
                                        }
                                        // Unir correos sin duplicar
                                        if (p.correo && !existente.correo) {
                                            existente.correo = p.correo;
                                        } else if (p.correo && !existente.correo.includes(p.correo)) {
                                            existente.correo = (existente.correo ? existente.correo + '; ' : '') + p.correo;
                                        }
                                        // Actualizar pasaporte y notas si están vacíos
                                        if (p.pasaporte && !existente.pasaporte) existente.pasaporte = p.pasaporte;
                                        if (p.notas) {
                                            existente.notas = existente.notas ? existente.notas + '; ' + p.notas : p.notas;
                                        }
                                        // Quedarse con el nombre más completo
                                        if (p.nombre.length > (existente.nombre || '').length) {
                                            existente.nombre = p.nombre;
                                        }
                                        // Fusionar teléfono: preferir el existente, pero si el nuevo trae uno y el existente no, usar el nuevo
                                        if (p.telefono && !existente.telefono) existente.telefono = p.telefono;
                                    } else {
                                        directorioPersonas.push(p);
                                    }
                                });
                                await saveData();
                                renderDirectorioList();
                                event.target.value = '';
                                showToast('Directorio importado');
                            } else {
                                throw new Error('Formato inválido');
                            }
                        } catch (error) {
                            showToast('El archivo no es un directorio válido', 'danger');
                        }
                    };
                    reader.readAsText(file);
                }
            );
        }


        function openFusionManualModal() {
            const origen = document.getElementById('fusion-origen');
            const destino = document.getElementById('fusion-destino');
            const opciones = directorioPersonas.slice().sort((a, b) => a.nombre.localeCompare(b.nombre)).map(p => `<option value="${p.id}">${p.nombre}${p.cedula ? ' — ' + p.cedula : ''}</option>`).join('');
            origen.innerHTML = '<option value="" selected>— Seleccionar contacto —</option>' + opciones;
            destino.innerHTML = '<option value="" selected>— Seleccionar contacto —</option>' + opciones;
            document.getElementById('fusion-vista-previa').innerHTML = 'Seleccioná los dos contactos para ver la vista previa.';
            if (!modalFusionManual) modalFusionManual = new bootstrap.Modal(document.getElementById('modalFusionManual'));
            modalFusionManual.show();
        }


        function actualizarVistaFusion() {
            const origenId = document.getElementById('fusion-origen').value;
            const destinoId = document.getElementById('fusion-destino').value;
            const o = directorioPersonas.find(p => p.id === origenId);
            const d = directorioPersonas.find(p => p.id === destinoId);
            const cont = document.getElementById('fusion-vista-previa');
            if (!o || !d) {
                cont.innerHTML = 'Seleccioná ambos contactos para ver la vista previa.';
                return;
            }
            const renderCampo = (label, val) => `<div class="mb-1"><b class="text-muted">${label}:</b> ${val ? val : '<span class="text-muted">—</span>'}</div>`;
            cont.innerHTML = `
                <div class="row g-2">
                    <div class="col-6 border-end pe-2">
                        <div class="fw-bold text-danger mb-2 small">Origen (se borrará)</div>
                        ${renderCampo('Nombre', o.nombre)}
                        ${renderCampo('Cédula', o.cedula)}
                        ${renderCampo('Pasaporte', o.pasaporte)}
                        ${renderCampo('Teléfono', o.telefono)}
                        ${renderCampo('Correo', o.correo)}
                        ${renderCampo('Notas', o.notas)}
                    </div>
                    <div class="col-6 ps-2">
                        <div class="fw-bold text-success mb-2 small">Destino (se conserva)</div>
                        ${renderCampo('Nombre', d.nombre)}
                        ${renderCampo('Cédula', d.cedula)}
                        ${renderCampo('Pasaporte', d.pasaporte)}
                        ${renderCampo('Teléfono', d.telefono)}
                        ${renderCampo('Correo', d.correo)}
                        ${renderCampo('Notas', d.notas)}
                    </div>
                </div>`;
        }


        async function ejecutarFusionManual() {
            const origenId = document.getElementById('fusion-origen').value;
            const destinoId = document.getElementById('fusion-destino').value;
            if (!origenId || !destinoId) { showToast('Seleccioná ambos contactos', 'warning'); return; }
            if (origenId === destinoId) { showToast('No podés fusionar el mismo contacto consigo mismo', 'warning'); return; }
            const o = directorioPersonas.find(p => p.id === origenId);
            const d = directorioPersonas.find(p => p.id === destinoId);
            if (!o || !d) return;
            ['cedula','pasaporte','correo','notas'].forEach(campo => {
                const val = (o[campo] || '').toString().trim();
                if (!val) return;
                const actuales = ((d[campo] || '').toString().split('; ').map(v => v.trim()).filter(Boolean));
                if (!actuales.length) {
                    d[campo] = val;
                } else if (!actuales.includes(val)) {
                    d[campo] = actuales.join('; ') + '; ' + val;
                }
            });
            // Teléfono: solo pasar si el destino no tiene (nunca sobrescribir ni duplicar)
            if ((o.telefono || '').toString().trim() && !(d.telefono || '').toString().trim()) {
                d.telefono = o.telefono.toString().trim();
            }
            directorioPersonas = directorioPersonas.filter(p => p.id !== origenId);
            await saveData();
            renderDirectorioList();
            modalFusionManual.hide();
            showToast('Contactos fusionados correctamente');
        }

