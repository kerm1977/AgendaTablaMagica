/* ARCHIVO: js/directorio/directorio-21.js */

        async function fusionarSimilitudesDuplicados(gruposNombre, gruposCedula, gruposPasaporte, gruposTelefono) {
            const sets = new Map();

            // Agrupar por todas las claves de duplicidad
            const agregarClave = (grupos, tipo) => {
                grupos.forEach(g => {
                    const clave = g.map(p => p.id).sort().join('_');
                    if (!sets.has(clave)) sets.set(clave, new Set());
                    g.forEach(p => sets.get(clave).add(p.id));
                });
            };

            // De nombre los contactos ya están agrupados
            const nombresPorClave = {};
            directorioPersonas.forEach(p => {
                const clave = dosPalabrasNombre(p.nombre);
                if (!clave) return;
                if (!nombresPorClave[clave]) nombresPorClave[clave] = [];
                nombresPorClave[clave].push(p.id);
            });

            const idsPorClave = {};
            Object.entries(nombresPorClave).forEach(([clave, ids]) => {
                if (ids.length > 1) idsPorClave[clave] = new Set(ids);
            });

            // Si hay duplicados por cédula/pasaporte/teléfono con distintos nombres, añadirlos a su respectivo set
            const agregarADuplicadosPorClave = (grupos) => {
                grupos.forEach(g => {
                    const idsG = new Set(g.map(p => p.id));
                    // Intentar fusionar con claves de nombre existentes
                    let agregado = false;
                    Object.entries(idsPorClave).forEach(([clave, setIds]) => {
                        for (const id of idsG) {
                            if (setIds.has(id)) {
                                idsG.forEach(id => setIds.add(id));
                                agregado = true;
                                break;
                            }
                        }
                    });
                    if (!agregado) {
                        const nuevaClave = 'extra_' + Date.now() + '_' + Math.random();
                        idsPorClave[nuevaClave] = idsG;
                    }
                });
            };

            agregarADuplicadosPorClave(gruposCedula);
            agregarADuplicadosPorClave(gruposPasaporte);
            agregarADuplicadosPorClave(gruposTelefono);

            let totalFusionados = 0;

            Object.values(idsPorClave).forEach(setIds => {
                const grupo = directorioPersonas.filter(p => setIds.has(p.id));
                if (grupo.length < 2) return;

                grupo.sort((a, b) => a.id.localeCompare(b.id));
                const base = grupo[0];
                const telefonos = new Set((base.telefono || '').trim() ? [base.telefono.trim()] : []);
                const cedulas = new Set((base.cedula || '').trim() ? [base.cedula.trim()] : []);
                const pasaportes = new Set((base.pasaporte || '').trim() ? [base.pasaporte.trim()] : []);
                const correos = new Set((base.correo || '').trim() ? [base.correo.trim()] : []);
                const notas = [(base.notas || '').trim()];

                for (let i = 1; i < grupo.length; i++) {
                    const p = grupo[i];
                    if ((p.telefono || '').trim()) telefonos.add(p.telefono.trim());
                    if ((p.cedula || '').trim()) cedulas.add(p.cedula.trim());
                    if ((p.pasaporte || '').trim()) pasaportes.add(p.pasaporte.trim());
                    if ((p.correo || '').trim()) correos.add(p.correo.trim());
                    if ((p.notas || '').trim()) notas.push(p.notas.trim());
                    totalFusionados++;
                }

                base.telefono = Array.from(telefonos).join(' / ');
                base.cedula = Array.from(cedulas).join(' / ');
                base.pasaporte = Array.from(pasaportes).join(' / ');
                base.correo = Array.from(correos).join(' / ');
                base.notas = notas.filter(n => n).join(' // ');

                const idsAEliminar = new Set(grupo.slice(1).map(p => p.id));
                directorioPersonas = directorioPersonas.filter(p => !idsAEliminar.has(p.id));
            });

            await saveData();
            renderDirectorioList();
            showToast(`Se fusionaron ${totalFusionados} contactos duplicados`, 'success');
        }


        function exportarDirectorioVCard() {
            if (!directorioPersonas || directorioPersonas.length === 0) {
                showToast('No hay contactos en el directorio para exportar', 'warning');
                return;
            }

            const escaparVCard = (texto) => (texto || '').toString()
                .replace(/\\/g, '\\\\')
                .replace(/;/g, '\\;')
                .replace(/,/g, '\\,')
                .replace(/\n/g, '\\n');

            const tarjetas = directorioPersonas.map(p => {
                const nombre = escaparVCard(p.nombre || 'Sin nombre');
                const notasPartes = [];
                if (p.tipo && p.tipo !== 'Persona') notasPartes.push(`Grupo: ${p.tipo}`);
                if (p.pais) notasPartes.push(`País: ${p.pais}`);
                if (p.lugar) notasPartes.push(`Lugar: ${p.lugar}`);
                if (p.cedula) notasPartes.push(`Cédula: ${p.cedula}`);
                if (p.pasaporte) notasPartes.push(`Pasaporte: ${p.pasaporte}`);
                if (p.tipoSangre) notasPartes.push(`Tipo de sangre: ${p.tipoSangre}`);
                if (p.contactoEmergenciaNombre) notasPartes.push(`Contacto de emergencia: ${p.contactoEmergenciaNombre}`);
                if (p.telefonoEmergencia) notasPartes.push(`Tel. emergencia: ${p.telefonoEmergencia}`);
                if (p.notas) notasPartes.push(`Notas: ${p.notas}`);

                let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
                vcard += `N:${nombre};;;;\n`;
                vcard += `FN:${nombre}\n`;
                if (p.telefono) vcard += `TEL;TYPE=CELL:${escaparVCard(p.telefono)}\n`;
                if (p.telefonoEmergencia) vcard += `TEL;TYPE=WORK:${escaparVCard(p.telefonoEmergencia)}\n`;
                if (p.correo) vcard += `EMAIL:${escaparVCard(p.correo)}\n`;
                if (p.fechaNacimiento) vcard += `BDAY:${p.fechaNacimiento}\n`;
                if (p.pais || p.lugar) vcard += `ADR;TYPE=HOME:;;${escaparVCard(p.lugar || '')};;;;${escaparVCard(p.pais || '')}\n`;
                if (notasPartes.length) vcard += `NOTE:${escaparVCard(notasPartes.join(' | '))}\n`;
                vcard += 'END:VCARD';
                return vcard;
            });

            const contenido = tarjetas.join('\n');
            const blob = new Blob([contenido], { type: 'text/vcard;charset=utf-8' });
            const dateStr = new Date().toISOString().split('T')[0];
            const fileName = `Directorio_${dateStr}.vcf`;
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            showToast('Respaldo VCard exportado');
        }


        // NO MODIFICAR: Función para exportar directorio a TXT
        function exportarDirectorioTXT() {
            if (!directorioPersonas || directorioPersonas.length === 0) {
                showToast('No hay contactos en el directorio para exportar', 'warning');
                return;
            }
            const personas = [...directorioPersonas].sort((a, b) => (a.nombre || '').toLowerCase().localeCompare((b.nombre || '').toLowerCase()));
            const lineas = [];
            const agregar = (etiqueta, valor) => {
                if (valor) lineas.push(`- ${etiqueta}: ${valor}`);
            };
            personas.forEach((p, i) => {
                lineas.push(p.nombre || 'Sin nombre');
                agregar('Cédula', p.cedula);
                agregar('Pasaporte', p.pasaporte);
                agregar('Teléfono', p.telefono);
                agregar('Correo', p.correo);
                agregar('Notas', p.notas);
                agregar('Tipo', p.tipo);
                agregar('País', p.pais);
                agregar('Lugar', p.lugar);
                agregar('Fecha de nacimiento', p.fechaNacimiento);
                agregar('Tipo de sangre', p.tipoSangre);
                agregar('Contacto de emergencia', p.contactoEmergenciaNombre);
                agregar('Teléfono de emergencia', p.telefonoEmergencia);
                if (i < personas.length - 1) lineas.push('---');
            });
            const contenido = lineas.join('\n');
            const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
            const dateStr = new Date().toISOString().split('T')[0];
            const fileName = `Directorio_${dateStr}.txt`;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            showToast('Directorio exportado a TXT');
        }


        function exportarDirectorioJSON() {
            const data = { directorioPersonas: directorioPersonas, exportDate: new Date().toISOString() };
            const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
            const link = document.createElement('a');
            link.href = dataStr;
            const dateStr = new Date().toISOString().split('T')[0];
            link.download = `Directorio_${dateStr}.json`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            showToast('Directorio exportado');
        }

