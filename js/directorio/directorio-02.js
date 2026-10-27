/* ARCHIVO: js/directorio/directorio-02.js */

        async function guardarPersonaDirectorio() {
            const nombre = document.getElementById('directorio-nombre').value.trim();
            const tipo = document.getElementById('directorio-tipo').value || 'Persona';
            const esPersona = tipo === 'Persona';
            const esCamino = tipo === 'El Camino de Costa Rica';
            const ocultarContacto = !esPersona && ['Parque Nacional', 'Bosque Nuboso', 'Reserva Biológica'].includes(tipo);
            const etapaCamino = esCamino ? (document.getElementById('directorio-etapa').value || '') : '';
            const pais = esCamino ? 'Costa Rica' : (document.getElementById('directorio-pais').value || 'Costa Rica');
            const lugar = esCamino
                ? (document.getElementById('directorio-lugar-camino').value.trim() || '')
                : ((pais === 'Costa Rica'
                    ? document.getElementById('directorio-lugar').value
                    : document.getElementById('directorio-lugar-texto').value.trim()) || '');
            const telefono = document.getElementById('directorio-telefono').value.trim();
            const correo = document.getElementById('directorio-correo').value.trim();
            const notas = document.getElementById('directorio-notas').value.trim();
            const cedula = esPersona ? document.getElementById('directorio-cedula').value.trim() : '';
            const pasaporte = esPersona ? document.getElementById('directorio-pasaporte').value.trim() : '';
            const fechaNacimiento = esPersona ? (document.getElementById('directorio-nacimiento').value || '') : '';
            const tipoSangre = esPersona ? (document.getElementById('directorio-tipo-sangre').value || '') : '';
            const nivel = esPersona ? (document.getElementById('directorio-nivel').value || '') : '';
            const contactoEmergenciaNombre = esPersona ? document.getElementById('directorio-contacto-emergencia-nombre').value.trim() : '';
            const telefonoEmergencia = esPersona ? document.getElementById('directorio-telefono-emergencia').value.trim() : '';

            // Campos exclusivos de lugares / organizaciones
            const telefono2 = !esPersona && !esCamino ? document.getElementById('directorio-telefono2').value.trim() : '';
            const telefono3 = !esPersona && !esCamino ? document.getElementById('directorio-telefono3').value.trim() : '';
            const nombreContacto = (!esPersona && !ocultarContacto) ? document.getElementById('directorio-nombre-contacto').value.trim() : '';
            const telefonoContacto = (!esPersona && !ocultarContacto && !esCamino) ? document.getElementById('directorio-telefono-contacto').value.trim() : '';
            const urlMapa = !esPersona && !esCamino ? document.getElementById('directorio-url-mapa').value.trim() : '';
            const horario = !esPersona && !esCamino ? document.getElementById('directorio-horario').value.trim() : '';
            const precio = !esPersona && !esCamino ? (document.getElementById('directorio-precio').value || '') : '';
            const terreno = !esPersona && !esCamino ? terrenoDirectorioSeleccionado() : [];

            const idExcluir = document.getElementById('directorio-editar-id').value;
            const extra = {
                tipoSangre,
                nivel,
                contactoEmergenciaNombre,
                telefonoEmergencia,
                telefono2,
                telefono3,
                nombreContacto,
                telefonoContacto,
                urlMapa,
                horario,
                terreno,
                precio,
                etapaCamino
            };

            if (!nombre) {
                showToast('El nombre es obligatorio', 'warning');
                return;
            }

            const duplicado = validarDuplicadoDirectorio(nombre, cedula, pasaporte, telefono, correo, idExcluir);
            if (duplicado) {
                showConfirm(
                    'Dato duplicado',
                    `Ya existe una persona con ese ${duplicado.tipo}: "${duplicado.valor}". ¿Querés guardar de todos modos?`,
                    async () => await guardarPersonaDirectorioConfirmado(nombre, cedula, pasaporte, telefono, correo, notas, idExcluir, tipo, pais, lugar, fechaNacimiento, extra),
                    'Sí, guardar',
                    'btn-warning'
                );
                return;
            }

            await guardarPersonaDirectorioConfirmado(nombre, cedula, pasaporte, telefono, correo, notas, idExcluir, tipo, pais, lugar, fechaNacimiento, extra);
        }


        async function guardarPersonaDirectorioConfirmado(nombre, cedula, pasaporte, telefono, correo, notas, idExcluir, tipo = 'Persona', pais = 'Costa Rica', lugar = '', fechaNacimiento = '', extra = {}) {
            const formattedName = nombre.split(' ').filter(w => w).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
            const {
                tipoSangre = '',
                contactoEmergenciaNombre = '',
                telefonoEmergencia = '',
                telefono2 = '',
                telefono3 = '',
                nombreContacto = '',
                telefonoContacto = '',
                urlMapa = '',
                horario = '',
                terreno = [],
                precio = '',
                etapaCamino = ''
            } = extra;

            if (idExcluir) {
                const index = directorioPersonas.findIndex(p => p.id === idExcluir);
                if (index > -1) {
                    const oldNombre = directorioPersonas[index].nombre;
                    directorioPersonas[index].nombre = formattedName;
                    directorioPersonas[index].cedula = cedula;
                    directorioPersonas[index].pasaporte = pasaporte;
                    directorioPersonas[index].telefono = telefono;
                    directorioPersonas[index].correo = correo;
                    directorioPersonas[index].notas = notas;
                    directorioPersonas[index].tipo = tipo;
                    directorioPersonas[index].pais = pais;
                    directorioPersonas[index].lugar = lugar;
                    directorioPersonas[index].fechaNacimiento = fechaNacimiento;
                    directorioPersonas[index].tipoSangre = tipoSangre;
                    directorioPersonas[index].nivel = nivel;
                    directorioPersonas[index].contactoEmergenciaNombre = contactoEmergenciaNombre;
                    directorioPersonas[index].telefonoEmergencia = telefonoEmergencia;
                    directorioPersonas[index].telefono2 = telefono2;
                    directorioPersonas[index].telefono3 = telefono3;
                    directorioPersonas[index].nombreContacto = nombreContacto;
                    directorioPersonas[index].telefonoContacto = telefonoContacto;
                    directorioPersonas[index].urlMapa = urlMapa;
                    directorioPersonas[index].horario = horario;
                    directorioPersonas[index].terreno = terreno;
                    directorioPersonas[index].precio = precio;
                    directorioPersonas[index].etapaCamino = etapaCamino;

                    // Actualizar personasGlobales y caminatas si cambió el nombre
                    if (oldNombre !== formattedName) {
                        const pIndex = personasGlobales.indexOf(oldNombre);
                        if (pIndex > -1) personasGlobales[pIndex] = formattedName;
                        caminatas.forEach(cam => {
                            if (cam.pasajeros) {
                                cam.pasajeros.forEach(pas => {
                                    if (pas.nombre === oldNombre) pas.nombre = formattedName;
                                });
                            }
                        });
                    }
                }
            } else {
                directorioPersonas.push({
                    id: Date.now().toString(),
                    nombre: formattedName,
                    cedula,
                    pasaporte,
                    telefono,
                    correo,
                    notas,
                    tipo,
                    pais,
                    lugar,
                    fechaNacimiento,
                    tipoSangre,
                    nivel,
                    contactoEmergenciaNombre,
                    telefonoEmergencia,
                    telefono2,
                    telefono3,
                    nombreContacto,
                    telefonoContacto,
                    urlMapa,
                    horario,
                    terreno,
                    precio,
                    etapaCamino
                });
                if (!personasGlobales.includes(formattedName)) {
                    personasGlobales.push(formattedName);
                }
            }

            await saveData();
            modalAgregarDirectorio.hide();
            renderDirectorioList(document.getElementById('search-directorio').value);
            if (currentView === 'caminata') {
                renderCaminantes(document.getElementById('search-caminante').value);
            }
            showToast('Contacto guardado en el directorio');
        }

