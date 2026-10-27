/* ARCHIVO: js/directorio/directorio-09.js */

        function editarDesdeVerDirectorio() {
            const id = directorioViendoId;
            modalVerDirectorio.hide();
            setTimeout(() => openEditarDirectorio(id), 300);
        }


        // Exportar por WhatsApp TODA la información visible en "Ver Contacto":
        // datos del contacto, listas de caminata, historial de retiros y participaciones.
        function exportarVerContactoWhatsApp() {
            const persona = directorioPersonas.find(p => p.id === directorioViendoId);
            if (!persona) return;

            let texto = generarTextoDirectorio(persona);

            const listas = listasDeCaminataDePersona(persona);
            texto += `\n\nListas de caminata (${listas.length}):\n`;
            texto += listas.length ? listas.map(l => `- ${l.camNombre}`).join('\n') : 'Sin registrar';

            const retiros = historialRetirosDePersona(persona.nombre);
            texto += `\n\nHistorial de retiros (${retiros.length}):\n`;
            texto += retiros.length ? retiros.map(r => `- ${r.camNombre} (${formatearFechaRetiro(r.fecha)})`).join('\n') : 'Sin registrar';

            const participaciones = participacionesDePersona(persona.nombre);
            texto += `\n\nParticipación en caminatas (${participaciones.length}):\n`;
            texto += participaciones.length ? participaciones.map(p2 => `- ${p2.camNombre} (${formatearFechaRetiro(p2.fecha)})`).join('\n') : 'Sin registrar';

            window.open(`https://wa.me/?text=${encodeURIComponent(texto.trim())}`, '_blank');
        }


        // Exportar a PNG: captura EXACTA del contenido del modal "Ver Contacto"
        // tal como se ve en pantalla (no una tarjeta de diseño aparte).
        async function exportarVerContactoPNG() {
            const persona = directorioPersonas.find(p => p.id === directorioViendoId);
            if (!persona) return;
            if (typeof html2canvas === 'undefined') {
                showToast('No se pudo cargar el generador de imágenes', 'danger');
                return;
            }

            const el = document.getElementById('ver-directorio-contenido');
            try {
                const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff' });
                const fileName = `contacto-${(persona.nombre || 'contacto').replace(/\s+/g, '_')}.png`;
                canvas.toBlob((blob) => {
                    if (navigator.canShare && navigator.canShare({ files: [new File([blob], fileName, { type: 'image/png' })] })) {
                        const file = new File([blob], fileName, { type: 'image/png' });
                        navigator.share({ title: `Contacto ${persona.nombre}`, files: [file] });
                    } else {
                        const link = document.createElement('a');
                        link.download = fileName;
                        link.href = URL.createObjectURL(blob);
                        link.click();
                        showToast('Imagen descargada');
                    }
                }, 'image/png');
            } catch (err) {
                showToast('Error al generar la imagen', 'danger');
            }
        }


        function mostrarSelectorListasDirectorio(nombre, coincidencias) {
            document.getElementById('seleccionar-caminata-titulo').innerText = `${nombre} pertenece a ${coincidencias.length} listas`;
            const cont = document.getElementById('lista-seleccionar-caminata');
            cont.innerHTML = '';
            coincidencias.forEach(match => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
                btn.innerHTML = `${escapeHtml(match.camNombre)} <i class="fas fa-chevron-right text-muted"></i>`;
                btn.onclick = () => {
                    modalSeleccionarCaminata.hide();
                    irACaminanteDesdeDirectorio(match);
                };
                cont.appendChild(btn);
            });
            modalSeleccionarCaminata.show();
        }


        function irACaminanteDesdeDirectorio(match) {
            openCaminata(match.camId);
            setTimeout(() => openCaminanteModal(match.pasId), 300);
        }


        function updateDirectorioCount() {
            const checked = document.querySelectorAll('.directorio-cb:checked').length;
            document.getElementById('directorio-count').innerText = `${checked} seleccionado${checked !== 1 ? 's' : ''}`;
        }


        async function agregarDesdeDirectorio() {
            const checkedBoxes = document.querySelectorAll('.directorio-cb:checked');
            if(checkedBoxes.length === 0) {
                showToast("No has seleccionado a nadie", "warning");
                return;
            }

            const camIndex = caminatas.findIndex(c => c.id === currentCaminataId);
            if(camIndex === -1) return;
            if(!caminatas[camIndex].pasajeros) caminatas[camIndex].pasajeros = [];

            let addedCount = 0;
            
            Array.from(checkedBoxes).forEach((cb, index) => {
                caminatas[camIndex].pasajeros.push({
                    id: Date.now().toString() + "-" + index,
                    nombre: cb.value,
                    estado: 'pendiente', // Por defecto cuando viene de directorio
                    abonos: '',
                    nota: '',
                    notaPublica: false // Privado por defecto
                });
                addedCount++;
            });

            ajustarCantidadBusetas(camIndex);
            await saveData();
            renderCaminantes(document.getElementById('search-caminante').value);
            const camActual = caminatas.find(c => c.id === currentCaminataId);
            navigate('caminata', camActual ? camActual.nombre : undefined);
            showToast(`${addedCount} caminante${addedCount > 1 ? 's' : ''} agregado${addedCount > 1 ? 's' : ''}`);
        }


        function confirmarBorradoCaminante() {
            showConfirm(
                "Retirar Caminante (1/2)",
                "¿Seguro que deseas retirar a esta persona de la caminata?",
                () => {
                    setTimeout(() => {
                        showConfirm(
                            "Última Advertencia (2/2)",
                            "Presiona 'Sí, proceder' para retirarlo definitivamente de esta lista.",
                            async () => {
                                const pasId = document.getElementById('caminante-id').value;
                                const camIndex = caminatas.findIndex(c => c.id === currentCaminataId);
                                if(camIndex > -1) {
                                    const pasRetirado = caminatas[camIndex].pasajeros.find(p => p.id === pasId);
                                    caminatas[camIndex].pasajeros = caminatas[camIndex].pasajeros.filter(p => p.id !== pasId);
                                    ajustarCantidadBusetas(camIndex);
                                    if (pasRetirado) {
                                        historialRetiros.push({
                                            nombre: pasRetirado.nombre,
                                            camNombre: caminatas[camIndex].nombre,
                                            camId: caminatas[camIndex].id,
                                            fecha: new Date().toISOString()
                                        });
                                    }
                                    await saveData();
                                    renderCaminantes(document.getElementById('search-caminante').value);
                                    modalCaminante.hide();
                                    showToast("Caminante retirado exitosamente");
                                }
                            }
                        );
                    }, 400); // Pequeño delay para asegurar que el modal tenga tiempo de hacer la animación
                }
            );
        }


        // --- STREAMING_CHUNK: WhatsApp Export ---
        function parseHtmlForWhatsApp(html) {
            if (!html) return "";
            let text = html;
            // Reemplazar quiebres de línea HTML y divs
            text = text.replace(/<br\s*[\/]?>/gi, "\n");
            text = text.replace(/<\/div>\s*<div[^>]*>/gi, "\n");
            text = text.replace(/<div[^>]*>/gi, "");
            text = text.replace(/<\/div>/gi, "\n");
            text = text.replace(/<\/p>/gi, "\n");
            // Reemplazar viñetas y números (aproximación rápida)
            text = text.replace(/<li>(.*?)<\/li>/gi, "- $1\n");
            // Reemplazar negritas
            text = text.replace(/<b>(.*?)<\/b>/gi, "*$1*");
            text = text.replace(/<strong>(.*?)<\/strong>/gi, "*$1*");
            // Quitar el resto de etiquetas HTML que WhatsApp no soporta (incluyendo alineaciones)
            text = text.replace(/<[^>]+>/g, '');
            
            // Decodificar entidades especiales (ej. &nbsp; a espacio)
            let doc = new DOMParser().parseFromString(text, "text/html");
            let cleanText = doc.documentElement.textContent || "";

            // Limpiar espacios no separables y dobles espacios
            cleanText = limpiarNbsp(cleanText);

            // Limpiar dobles saltos de línea innecesarios al inicio y final
            return cleanText.trim();
        }


        function enviarPorWhatsAppDirecto() {
            const cam = caminatas.find(c => c.id === currentCaminataId);
            if(!cam || !cam.pasajeros || cam.pasajeros.length === 0) {
                showToast("No hay caminantes para enviar", "warning");
                return;
            }
            const texto = generarMensajeWhatsApp(cam);
            const encodedText = encodeURIComponent(texto);
            const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
            window.open(whatsappUrl, '_blank');
        }

