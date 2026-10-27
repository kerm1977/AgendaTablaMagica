/* ARCHIVO: js/directorio/directorio-08.js */

        // ¡IMPORTANTE! Construye la ficha completa del contacto (modalVerDirectorio).
        // Diseño aprobado por el usuario: no simplificar ni quitar secciones sin confirmar.
        function verInformacionContacto(id) {
            const persona = directorioPersonas.find(p => p.id === id);
            if (!persona) return;
            directorioViendoId = id;

            const tipo = persona.tipo || 'Persona';
            const esPersona = tipo === 'Persona';
            const icono = iconoTipoDirectorio(tipo);
            const color = colorTipoDirectorio(tipo);
            const waLink = enlaceWhatsAppDirectorio(persona.telefono);
            const telefonoHtml = persona.telefono
                ? (waLink
                    ? `<a href="${waLink}" target="_blank" rel="noopener" class="directorio-telefono-link whatsapp-activo"><i class="fab fa-whatsapp me-1"></i>${escapeHtml(persona.telefono)}</a>`
                    : `<span class="directorio-telefono-link">${escapeHtml(persona.telefono)}</span>`)
                : '<span class="text-muted fst-italic">Sin registrar</span>';

            const retiros = historialRetirosDePersona(persona.nombre);
            const participaciones = participacionesDePersona(persona.nombre);

            const filas = [];
            const fila = (icono2, label, valor, esHtml = false) => {
                const tieneValor = (valor || '').toString().trim() !== '';
                const contenido = esHtml ? valor.toString() : escapeHtml(valor.toString());
                filas.push(`
                    <div class="d-flex align-items-start mb-2">
                        <div style="width:26px; color:#6c757d;"><i class="fas ${icono2}"></i></div>
                        <div class="flex-grow-1">
                            <div class="small text-muted" style="font-size:0.7rem; text-transform:uppercase; letter-spacing:0.5px;">${label}</div>
                            <div>${tieneValor ? contenido : '<span class="text-muted fst-italic">Sin registrar</span>'}</div>
                        </div>
                    </div>
                `);
            };

            const esCamino = tipo === 'El Camino de Costa Rica';
            const ocultarContacto = !esPersona && ['Parque Nacional', 'Bosque Nuboso', 'Reserva Biológica'].includes(tipo);

            if (esCamino) {
                if (persona.etapaCamino) fila('fa-flag', 'Etapa', persona.etapaCamino);
                if (persona.lugar) fila('fa-map-marker-alt', 'Nombre del lugar', persona.lugar);
                fila('fa-user', 'Nombre de contacto', persona.nombreContacto);
            } else if (!esPersona) {
                fila('fa-globe', 'País', persona.pais || 'Costa Rica');
                if (persona.lugar) fila('fa-map-marker-alt', 'Lugar (provincia)', persona.lugar);
                if (!ocultarContacto) fila('fa-user', 'Nombre de contacto', persona.nombreContacto);
                if (!ocultarContacto) fila('fa-phone', 'Teléfono de contacto', persona.telefonoContacto);
                if (persona.telefono2) fila('fa-phone', 'Teléfono 2', persona.telefono2);
                if (persona.telefono3) fila('fa-phone', 'Teléfono 3', persona.telefono3);
                if (persona.urlMapa) fila('fa-map-marked-alt', 'URL de Google Maps', enlaceUrlClickeable(persona.urlMapa), true);
                if (persona.horario) fila('fa-clock', 'Horario de atención', persona.horario);
                if (persona.terreno && persona.terreno.length) fila('fa-road', 'Terreno', persona.terreno.join(', '));
                if (persona.precio) fila('fa-coins', 'Precio de ingreso', `₡${persona.precio} por persona`);
            } else {
                fila('fa-id-card', 'Cédula', persona.cedula);
                fila('fa-passport', 'Pasaporte', persona.pasaporte);
                fila('fa-cake-candles', 'Fecha de nacimiento', persona.fechaNacimiento);
                fila('fa-tint', 'Tipo de sangre', persona.tipoSangre);
                fila('fa-signal', 'Nivel de caminante', persona.nivel);
                fila('fa-user-shield', 'Contacto de emergencia', persona.contactoEmergenciaNombre);
                fila('fa-phone-volume', 'Teléfono de emergencia', persona.telefonoEmergencia);
            }
            fila('fa-envelope', 'Correo electrónico', persona.correo);
            fila('fa-sticky-note', 'Notas', convertirUrlsEnNotas(persona.notas), true);
            // NO MODIFICAR: Contadores de retiros y participaciones en ficha de contacto
            fila('fa-user-minus text-danger', 'Total de retiros', retiros.length);
            fila('fa-check-circle text-success', 'Total de participaciones', participaciones.length);

            const coincidencias = listasDeCaminataDePersona(persona);
            const listasHtml = coincidencias.length === 0
                ? '<p class="text-muted small fst-italic mb-0">No pertenece a ninguna lista de caminata todavía.</p>'
                : `<div class="list-group" id="ver-directorio-listas"></div>`;

            // Retiros con paginación
            const totalPaginasRetiros = Math.max(1, Math.ceil(retiros.length / VER_CONTACTO_POR_PAGINA));
            verContactoRetirosPagina = Math.min(verContactoRetirosPagina, totalPaginasRetiros);
            const inicioRetiros = (verContactoRetirosPagina - 1) * VER_CONTACTO_POR_PAGINA;
            const finRetiros = inicioRetiros + VER_CONTACTO_POR_PAGINA;
            const retirosPagina = retiros.slice(inicioRetiros, finRetiros);
            
            const retirosHtml = retiros.length === 0
                ? '<p class="text-muted small fst-italic mb-0">No tiene retiros registrados.</p>'
                : `<div class="list-group" id="ver-directorio-retiros">
                    ${retirosPagina.map(r => `
                        <div class="list-group-item d-flex justify-content-between align-items-center">
                            <span><i class="fas fa-user-minus text-danger me-2"></i>${escapeHtml(r.camNombre)}</span>
                            <span class="small text-muted">${formatearFechaRetiro(r.fecha)}</span>
                        </div>
                    `).join('')}
                   </div>
                   <div class="d-flex justify-content-between align-items-center mt-2" id="ver-directorio-retiros-paginacion">
                        <button type="button" class="btn btn-outline-secondary btn-sm" ${verContactoRetirosPagina <= 1 ? 'disabled' : ''} onclick="cambiarPaginaVerContactoRetiros(-1)">
                            <i class="fas fa-chevron-left"></i> Anterior
                        </button>
                        <span class="small text-muted">Página ${verContactoRetirosPagina} de ${totalPaginasRetiros}</span>
                        <button type="button" class="btn btn-outline-secondary btn-sm" ${verContactoRetirosPagina >= totalPaginasRetiros ? 'disabled' : ''} onclick="cambiarPaginaVerContactoRetiros(1)">
                            Siguiente <i class="fas fa-chevron-right"></i>
                        </button>
                   </div>`;

            // Participaciones con paginación
            const totalPaginasParticipaciones = Math.max(1, Math.ceil(participaciones.length / VER_CONTACTO_POR_PAGINA));
            verContactoParticipacionesPagina = Math.min(verContactoParticipacionesPagina, totalPaginasParticipaciones);
            const inicioParticipaciones = (verContactoParticipacionesPagina - 1) * VER_CONTACTO_POR_PAGINA;
            const finParticipaciones = inicioParticipaciones + VER_CONTACTO_POR_PAGINA;
            const participacionesPagina = participaciones.slice(inicioParticipaciones, finParticipaciones);
            
            const participacionesHtml = participaciones.length === 0
                ? '<p class="text-muted small fst-italic mb-0">Todavía no tiene participaciones registradas.</p>'
                : `<div class="list-group" id="ver-directorio-participaciones">
                    ${participacionesPagina.map(p2 => `
                        <div class="list-group-item d-flex justify-content-between align-items-center">
                            <span><i class="fas fa-check-circle text-success me-2"></i>${escapeHtml(p2.camNombre)}</span>
                            <span class="small text-muted">${formatearFechaRetiro(p2.fecha)}</span>
                        </div>
                    `).join('')}
                   </div>
                   <div class="d-flex justify-content-between align-items-center mt-2" id="ver-directorio-participaciones-paginacion">
                        <button type="button" class="btn btn-outline-secondary btn-sm" ${verContactoParticipacionesPagina <= 1 ? 'disabled' : ''} onclick="cambiarPaginaVerContactoParticipaciones(-1)">
                            <i class="fas fa-chevron-left"></i> Anterior
                        </button>
                        <span class="small text-muted">Página ${verContactoParticipacionesPagina} de ${totalPaginasParticipaciones}</span>
                        <button type="button" class="btn btn-outline-secondary btn-sm" ${verContactoParticipacionesPagina >= totalPaginasParticipaciones ? 'disabled' : ''} onclick="cambiarPaginaVerContactoParticipaciones(1)">
                            Siguiente <i class="fas fa-chevron-right"></i>
                        </button>
                   </div>`;

            document.getElementById('ver-directorio-contenido').innerHTML = `
                <div class="d-flex align-items-center gap-3 mb-3">
                    <div class="directorio-tipo-icon" style="width:56px; height:56px; font-size:1.5rem; color:${color}; background:${color}0d;">
                        <i class="fas ${icono}"></i>
                    </div>
                    <div>
                        <h5 class="mb-0">${escapeHtml(persona.nombre || '')}</h5>
                        <span class="badge" style="background:${color};">${escapeHtml(tipo)}</span>
                    </div>
                </div>
                <div class="mb-2">
                    <div class="small text-muted" style="font-size:0.7rem; text-transform:uppercase; letter-spacing:0.5px;">Teléfono</div>
                    <div>${telefonoHtml}</div>
                </div>
                ${filas.join('')}
                <hr>
                <div class="small text-muted mb-2" style="font-size:0.7rem; text-transform:uppercase; letter-spacing:0.5px;">
                    <i class="fas fa-list-alt"></i> Pertenece a ${coincidencias.length} lista${coincidencias.length !== 1 ? 's' : ''} de caminata
                </div>
                ${listasHtml}
                <hr>
                <div class="small text-muted mb-2" style="font-size:0.7rem; text-transform:uppercase; letter-spacing:0.5px;">
                    <i class="fas fa-history"></i> Historial de retiros (${retiros.length})
                </div>
                ${retirosHtml}
                <hr>
                <div class="small text-muted mb-2" style="font-size:0.7rem; text-transform:uppercase; letter-spacing:0.5px;">
                    <i class="fas fa-check-circle"></i> Participación en caminatas (${participaciones.length})
                </div>
                ${participacionesHtml}
            `;

            const listasCont = document.getElementById('ver-directorio-listas');
            if (listasCont) {
                coincidencias.forEach(match => {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
                    btn.innerHTML = `${escapeHtml(match.camNombre)} <i class="fas fa-chevron-right text-muted"></i>`;
                    btn.onclick = () => {
                        modalVerDirectorio.hide();
                        irACaminanteDesdeDirectorio(match);
                    };
                    listasCont.appendChild(btn);
                });
            }
            
            // Ocultar paginación si no es necesario
            const retirosPaginacion = document.getElementById('ver-directorio-retiros-paginacion');
            if (retirosPaginacion && retiros.length <= VER_CONTACTO_POR_PAGINA) {
                retirosPaginacion.style.display = 'none';
            }
            
            const participacionesPaginacion = document.getElementById('ver-directorio-participaciones-paginacion');
            if (participacionesPaginacion && participaciones.length <= VER_CONTACTO_POR_PAGINA) {
                participacionesPaginacion.style.display = 'none';
            }

            modalVerDirectorio.show();
        }


        function cambiarPaginaVerContactoRetiros(delta) {
            verContactoRetirosPagina += delta;
            verInformacionContacto(directorioViendoId);
        }


        function cambiarPaginaVerContactoParticipaciones(delta) {
            verContactoParticipacionesPagina += delta;
            verInformacionContacto(directorioViendoId);
        }

