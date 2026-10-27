/* ==========================================================================
 * ARCHIVO: js/listas/caminata-toggles.js — extraído del monolito (bloque LISTAS/CAMINATAS)
 * Funciones: toggleDetallesVuelo, toggleLugarSalidaAeropuerto, togglePaisCaminata, toggleTipoYFechasCaminata, toggleActividadCaminata
 * ========================================================================== */

        function toggleDetallesVuelo() {
            const tieneVuelo = document.getElementById('cam-tiene-vuelo')?.checked;
            const numeroContainer = document.getElementById('cam-numero-vuelo-container');
            const tieneFecha = document.getElementById('cam-tiene-fecha-vuelo')?.checked;
            const fechasContainer = document.getElementById('cam-fechas-vuelo-container');

            if (numeroContainer) numeroContainer.classList.toggle('d-none', !tieneVuelo);
            if (fechasContainer) fechasContainer.classList.toggle('d-none', !tieneFecha);

            // Aéreo con fechas de vuelo → Fecha Ida/Regreso del acordeón ya no se piden
            const tipo = document.getElementById('cam-actividad')?.value;
            const fechasInternacional = document.getElementById('fecha-internacional-container');
            if (fechasInternacional && tipo === 'Internacional') {
                fechasInternacional.style.display = tieneFecha ? 'none' : '';
            }
        }

        function toggleFechaRegreso() {
            const chk = document.getElementById('cam-tiene-regreso');
            const col = document.getElementById('cam-regreso-col');
            if (col) col.style.display = (chk && chk.checked) ? '' : 'none';
        }


        function toggleLugarSalidaAeropuerto() {
            const actividad = document.getElementById('cam-actividad').value;
            const tieneLugarSalida = document.getElementById('cam-tiene-lugar-salida')?.checked;
            const lugarContainer = document.getElementById('cam-lugar-salida-container');
            const lugaresRecogerContainer = document.getElementById('cam-lugares-recoger-container');
            const lugarSelect = document.getElementById('cam-lugar-salida');

            if (actividad !== 'Internacional') {
                if (lugarContainer) lugarContainer.classList.remove('d-none');
                if (lugaresRecogerContainer) lugaresRecogerContainer.classList.remove('d-none');
                return;
            }

            if (tieneLugarSalida) {
                if (lugarContainer) lugarContainer.classList.remove('d-none');
                if (lugaresRecogerContainer) lugaresRecogerContainer.classList.remove('d-none');
                if (lugarSelect && lugarSelect.value === 'Cada quien llega por sus propios medios') lugarSelect.value = '';
            } else {
                if (lugarContainer) lugarContainer.classList.add('d-none');
                if (lugaresRecogerContainer) lugaresRecogerContainer.classList.add('d-none');
                if (lugarSelect) lugarSelect.value = 'Cada quien llega por sus propios medios';
                if (document.getElementById('cam-lugares-recoger')) document.getElementById('cam-lugares-recoger').value = '';
            }
        }


        function togglePaisCaminata() {
            const actividad = document.getElementById('cam-actividad').value;
            const pais = document.getElementById('cam-pais').value;
            const modoTransporte = document.getElementById('cam-modo-transporte')?.value || 'Terrestre';
            const aerolineaContainer = document.getElementById('cam-aerolinea-container');
            const modoTransporteContainer = document.getElementById('cam-modo-transporte-container');
            const busetaMini = document.getElementById('buseta-mini-form');
            const usarBuseta = document.getElementById('cam-usar-buseta');
            const aerolinea = document.getElementById('cam-aerolinea');

            if (actividad !== 'Internacional') {
                aerolineaContainer.classList.add('d-none');
                if (modoTransporteContainer) modoTransporteContainer.classList.add('d-none');
                if (aerolinea) aerolinea.value = '';
                busetaMini.classList.remove('d-none');
                if (usarBuseta) toggleBusetaSection(usarBuseta);
                else toggleBusetaSection({ checked: true });
                toggleDetallesVuelo();
                toggleLugarSalidaAeropuerto();
                return;
            }

            if (modoTransporteContainer) modoTransporteContainer.classList.remove('d-none');

            if (modoTransporte === 'Terrestre') {
                aerolineaContainer.classList.add('d-none');
                if (aerolinea) aerolinea.value = '';
                busetaMini.classList.remove('d-none');
                if (usarBuseta) { usarBuseta.checked = true; toggleBusetaSection(usarBuseta); }
                else toggleBusetaSection({ checked: true });
            } else {
                busetaMini.classList.add('d-none');
                aerolineaContainer.classList.remove('d-none');
                if (usarBuseta) { usarBuseta.checked = false; toggleBusetaSection(usarBuseta); }
                else toggleBusetaSection({ checked: false });
            }

            toggleDetallesVuelo();
            toggleLugarSalidaAeropuerto();
        }


        function toggleTipoYFechasCaminata() {
            const actividad = document.getElementById('cam-actividad').value;
            const localDiv = document.getElementById('fecha-local-container');
            const intDiv = document.getElementById('fecha-internacional-container');
            const horaSalidaContainer = document.getElementById('cam-hora-salida-container');

            if (actividad === 'Internacional') {
                if (localDiv) {
                    localDiv.classList.add('d-none');
                    const fechaLocal = document.getElementById('cam-fecha-local');
                    if (fechaLocal) fechaLocal.required = false;
                }
                if (intDiv) {
                    intDiv.classList.remove('d-none');
                }
                if (horaSalidaContainer) horaSalidaContainer.classList.remove('d-none');
                const regOpt = document.getElementById('fecha-regreso-opcional');
                if (regOpt) regOpt.style.display = '';
                toggleDateFields();
            } else {
                if (horaSalidaContainer) horaSalidaContainer.classList.remove('d-none');
                if (localDiv) localDiv.classList.remove('d-none');
                if (intDiv) intDiv.classList.add('d-none');
                // nacional (Caminata) → solo una fecha; otros tipos → check de regreso opcional
                const regOpt2 = document.getElementById('fecha-regreso-opcional');
                if (regOpt2) regOpt2.style.display = (actividad === 'Caminata') ? 'none' : '';
                toggleDateFields();
            }
        }


        function toggleActividadCaminata() {
            const actividad = document.getElementById('cam-actividad').value;
            const etapaContainer = document.getElementById('cam-etapa-container');
            const parqueContainer = document.getElementById('cam-parque-container');
            const nombreContainer = document.getElementById('cam-nombre-container');
            const etapa = document.getElementById('cam-etapa');
            const parque = document.getElementById('cam-parque');
            const nombre = document.getElementById('cam-nombre');
            const nombreLabel = document.getElementById('cam-nombre-label');
            const ubicacionLabel = document.getElementById('cam-ubicacion-label');
            const provincia = document.getElementById('cam-provincia');
            const pais = document.getElementById('cam-pais');

            if (actividad === 'Internacional') {
                etapaContainer.classList.add('d-none');
                parqueContainer.classList.add('d-none');
                nombreContainer.classList.remove('d-none');
                nombre.required = true;
                etapa.required = false;
                parque.required = false;
                nombreLabel.innerText = 'Nombre del lugar';
                nombre.placeholder = 'Ej: Machu Picchu, Tikal, Ciudad de México';
                ubicacionLabel.innerText = 'País';
                provincia.classList.add('d-none');
                pais.classList.remove('d-none');
                togglePaisCaminata();
                if (etapa.value) etapa.value = '';
                if (parque.value) parque.value = '';
            } else if (actividad === 'El Camino de Costa Rica') {
                parqueContainer.classList.add('d-none');
                etapaContainer.classList.remove('d-none');
                nombreContainer.classList.add('d-none');
                nombre.required = false;
                parque.required = false;
                etapa.required = true;
                if (etapa.value) {
                    nombre.value = etapa.value;
                    asignarProvinciaPorEtapa(etapa.value);
                }
                if (parque.value) parque.value = '';
                nombreLabel.innerText = 'Nombre de La Caminata';
                nombre.placeholder = 'Ej: Volcán Arenal';
                ubicacionLabel.innerText = 'Provincia';
                provincia.classList.remove('d-none');
                pais.classList.add('d-none');
                pais.value = provincia.value || '';
                togglePaisCaminata();
            } else if (actividad === 'Parque Nacional') {
                poblarSelectParquesNacionales();
                etapaContainer.classList.add('d-none');
                parqueContainer.classList.remove('d-none');
                nombreContainer.classList.add('d-none');
                nombre.required = false;
                etapa.required = false;
                parque.required = true;
                if (etapa.value) etapa.value = '';
                if (parque.value) {
                    nombre.value = parque.value;
                    asignarNombreDesdeParque(false);
                }
                nombreLabel.innerText = 'Nombre de La Caminata';
                nombre.placeholder = 'Ej: Volcán Arenal';
                ubicacionLabel.innerText = 'Provincia';
                provincia.classList.remove('d-none');
                pais.classList.add('d-none');
                pais.value = provincia.value || '';
                togglePaisCaminata();
            } else {
                etapaContainer.classList.add('d-none');
                parqueContainer.classList.add('d-none');
                nombreContainer.classList.remove('d-none');
                nombre.required = true;
                etapa.required = false;
                parque.required = false;
                if (etapa.value) etapa.value = '';
                if (parque.value) parque.value = '';
                nombreLabel.innerText = 'Nombre de La Caminata';
                nombre.placeholder = 'Ej: Volcán Arenal';
                ubicacionLabel.innerText = 'Provincia';
                provincia.classList.remove('d-none');
                pais.classList.add('d-none');
                pais.value = provincia.value || '';
                togglePaisCaminata();
            }
            toggleTipoYFechasCaminata();
        }

