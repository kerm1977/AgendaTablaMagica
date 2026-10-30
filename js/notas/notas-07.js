/* ARCHIVO: js/notas/notas-07.js */

        function confirmarEliminarNota(id) {
            const nota = notas.find(n => n.id === id);
            const titulo = nota ? nota.titulo : '';
            showConfirm(
                'Eliminar nota (1/3)',
                `¿Seguro que querés eliminar la nota "${titulo}"?`,
                () => {
                    setTimeout(() => {
                        showConfirm(
                            'Eliminar nota (2/3)',
                            'Una vez eliminada, no se puede recuperar. ¿Continuar?',
                            () => {
                                setTimeout(() => {
                                    showConfirm(
                                        'Eliminar nota (3/3)',
                                        'Confirmación final. ¿Eliminar definitivamente?',
                                        async () => {
                                            notas = notas.filter(n => n.id !== id);
                                            await saveData();
                                            renderNotas();
                                            showToast('Nota eliminada');
                                        },
                                        'Sí, eliminar',
                                        'btn-danger'
                                    );
                                }, 350);
                            },
                            'Continuar',
                            'btn-danger'
                        );
                    }, 350);
                },
                'Continuar',
                'btn-danger'
            );
        }


        function exportarNotasJSON() {
            const data = { notas: notas, exportDate: new Date().toISOString() };
            const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
            const link = document.createElement('a');
            link.href = dataStr;
            const dateStr = new Date().toISOString().split('T')[0];
            link.download = `Notas_${dateStr}.json`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            showToast('Notas exportadas');
        }


        async function exportarNotasWhatsApp() {
            const data = { notas: notas, exportDate: new Date().toISOString() };
            const content = JSON.stringify(data, null, 2);
            const blob = new Blob([content], { type: 'application/json' });
            const dateStr = new Date().toISOString().split('T')[0];
            const fileName = `Notas_${dateStr}.json`;

            if (navigator.canShare && navigator.canShare({ files: [new File([blob], fileName, { type: 'application/json' })] })) {
                const file = new File([blob], fileName, { type: 'application/json' });
                await navigator.share({ title: 'Respaldo de Notas', text: 'Respaldo JSON de notas', files: [file] });
            } else {
                const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(content);
                const link = document.createElement('a');
                link.href = dataStr;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                link.remove();
                showToast('Notas descargadas. Se abrió WhatsApp para que elijas con quién compartirlas.');
                abrirWhatsAppParaAdjuntar(fileName);
            }
        }


        // Exporta SOLO la nota abierta como JSON + abre WhatsApp con el archivo
        async function exportarNotaJSONWhatsApp() {
            const nota = notas.find(n => n.id === currentNotaId);
            if (!nota) { showToast('Guardá la nota antes de exportarla', 'warning'); return; }
            const titulo = (document.getElementById('nota-titulo')?.value || nota.titulo || 'nota').trim() || 'nota';
            const data = { tipo: 'nota-agendatribu', notas: [nota], exportDate: new Date().toISOString() };
            const content = JSON.stringify(data, null, 2);
            const fileName = 'Nota_' + titulo.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ _-]/g, '').trim().replace(/\s+/g, '_').slice(0, 40) + '.json';
            const file = new File([content], fileName, { type: 'application/json' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try { await navigator.share({ files: [file], title: 'Nota: ' + titulo, text: 'Nota de AgendaTribu: ' + titulo }); } catch (e) { if (e && e.name !== 'AbortError') throw e; }
                return;
            }
            const blob = new Blob([content], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob); a.download = fileName;
            document.body.appendChild(a); a.click(); a.remove();
            setTimeout(() => URL.revokeObjectURL(a.href), 1000);
            window.open('https://wa.me/?text=' + encodeURIComponent('Nota de AgendaTribu: ' + titulo + ' — adjunto el JSON para importarla'), '_blank');
            showToast('JSON descargado — adjuntalo en WhatsApp', 'success');
        }

        // NO MODIFICAR: Función para exportar notas a TXT
        function exportarNotasTXT() {
            if (!notas || notas.length === 0) {
                showToast('No hay notas para exportar', 'warning');
                return;
            }
            const lineas = [];
            [...notas].sort((a, b) => new Date(a.creada || 0) - new Date(b.creada || 0)).forEach((nota) => {
                const titulo = limpiarNbsp(nota.titulo || '') || 'Sin título';
                const creada = nota.creada ? new Date(nota.creada).toLocaleString() : '';
                const actualizada = nota.actualizada ? new Date(nota.actualizada).toLocaleString() : '';
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = limpiarNbsp(nota.contenido || '');
                const contenido = formatearContenidoNotaParaWhatsApp(tempDiv);
                lineas.push(`*${titulo}*`);
                if (creada) lineas.push(`- Creada: ${creada}`);
                if (actualizada) lineas.push(`- Actualizada: ${actualizada}`);
                if (contenido) {
                    lineas.push('');
                    lineas.push(contenido);
                }
                lineas.push('');
                lineas.push('────────────────────────────────────────');
                lineas.push('');
            });
            const texto = lineas.join('\n');
            const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' });
            const dateStr = new Date().toISOString().split('T')[0];
            const fileName = `Notas_${dateStr}.txt`;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            showToast('Notas exportadas a TXT');
        }


        function importarNotasJSON(event) {
            const file = event.target.files[0];
            if (!file) return;

            showConfirm(
                'Importar Notas',
                'Esto AGREGARÁ las notas del archivo a las notas actuales. ¿Continuar?',
                async () => {
                    const reader = new FileReader();
                    reader.onload = async (e) => {
                        try {
                            const data = JSON.parse(e.target.result);
                            if (data.notas && Array.isArray(data.notas)) {
                                data.notas.forEach(n => {
                                    if (!notas.find(x => x.id === n.id)) {
                                        notas.push(n);
                                    }
                                });
                                await saveData();
                                renderNotas();
                                event.target.value = '';
                                showToast('Notas importadas');
                            } else {
                                throw new Error('Formato inválido');
                            }
                        } catch (error) {
                            showToast('El archivo no es un respaldo de notas válido', 'danger');
                        }
                    };
                    reader.readAsText(file);
                }
            );
        }


        function initModalImagenNota() {
            if (!modalImagenNota) {
                modalImagenNota = new bootstrap.Modal(document.getElementById('modalImagenNota'));
            }
        }


        function pegarImagenNota(e) {
            const editor = document.getElementById('nota-contenido');
            if (!editor) return;
            const data = e.clipboardData || (e.originalEvent && e.originalEvent.clipboardData) || window.clipboardData;
            if (!data || !data.items) return;
            for (const item of data.items) {
                if (item.type.indexOf('image') !== -1) {
                    e.preventDefault();
                    const blob = item.getAsFile();
                    const reader = new FileReader();
                    reader.onload = function(evt) {
                        insertarImagenBase64Nota(evt.target.result);
                        guardarBorradorNota();
                        actualizarProgresoNota();
                    };
                    reader.readAsDataURL(blob);
                    return;
                }
            }
        }


        function insertarImagenBase64Nota(src) {
            const editor = document.getElementById('nota-contenido');
            const img = document.createElement('img');
            img.src = src;
            img.className = 'nota-img';
            img.style.opacity = '1';
            img.style.position = 'absolute';
            img.style.left = '0';
            img.style.top = '0';
            img.style.zIndex = '0';
            img.style.margin = '0';
            img.dataset.escala = '1';
            img.dataset.rotacion = '0';
            img.dataset.mirror = '0';
            img.dataset.mirrorv = '0';
            const pAntes = document.createElement('p');
            pAntes.innerHTML = '<br>';
            const pDespues = document.createElement('p');
            pDespues.innerHTML = '<br>';
            editor.appendChild(pAntes);
            editor.appendChild(img);
            editor.appendChild(pDespues);
            aplicarTransformImagenAElemento(img);
            img.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

