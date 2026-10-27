/* ARCHIVO: js/directorio/directorio-17.js */

        function normalizarPasajero(p) {
            return {
                ...p,
                id: p.id || Date.now().toString(),
                nombre: p.nombre || '',
                estado: p.estado || 'pendiente',
                abonos: p.abonos || '',
                historialMontos: (p.historialMontos || []).map(m => normalizarMonto(m)),
                nota: p.nota || '',
                notaPublica: p.notaPublica === true,
                mostrarDescReversion: p.mostrarDescReversion !== false,
                mostrarDescPago: p.mostrarDescPago !== false,
                mostrarReversiones: p.mostrarReversiones !== false,
                mostrarPagosActivos: p.mostrarPagosActivos !== false,
                mostrarTotalEnLista: p.mostrarTotalEnLista !== false,
                mostrarSaldoPendiente: p.mostrarSaldoPendiente === true,
                dolarizar: p.dolarizar === true,
                tipoCambioDolar: p.tipoCambioDolar || '',
                asistencia: p.asistencia || ''
            };
        }


        // NO MODIFICAR: Normalización completa de caminatas
        function normalizarCaminata(cam) {
            const pasajeros = (cam.pasajeros || []).map(p => normalizarPasajero(p));
            return {
                ...cam,
                id: cam.id || '',
                nombre: cam.nombre || '',
                provincia: cam.provincia || '',
                tipo: cam.tipo || 'Local',
                actividad: cam.actividad || 'Caminata',
                fechaLocal: cam.fechaLocal || '',
                fechaIda: cam.fechaIda || '',
                fechaRegreso: cam.fechaRegreso || '',
                moneda: cam.moneda || '₡',
                precio: cam.precio || '',
                reservaMonto: cam.reservaMonto || '',
                precioBuseta: cam.precioBuseta || '0',
                cantidadBuses: cam.cantidadBuses || '1',
                cantidadGuias: cam.cantidadGuias || '2',
                usarBuseta: cam.usarBuseta !== false,
                reservaFecha: cam.reservaFecha || '',
                horaSalida: cam.horaSalida || '',
                lugarSalida: cam.lugarSalida || '',
                url: cam.url || '',
                incluye: Array.isArray(cam.incluye) ? [...cam.incluye] : [],
                otrosDescripcion: cam.otrosDescripcion || '',
                formasPago: Array.isArray(cam.formasPago) ? [...cam.formasPago] : [],
                lugaresRecoger: Array.isArray(cam.lugaresRecoger) ? [...cam.lugaresRecoger] : (cam.recoger ? String(cam.recoger).split(',').map(l => l.trim()).filter(Boolean) : []),
                equipo: Array.isArray(cam.equipo) ? [...cam.equipo] : (configTema.equipoRequerido || []).map(item => ({ item, estado: 'Si' })),
                notasAdicionales: cam.notasAdicionales || '',
                pasajeros: pasajeros,

                dificultad: cam.dificultad || '',
                kilometros: cam.kilometros || '',
                modoTransporte: cam.modoTransporte || 'Terrestre',
                aerolinea: cam.aerolinea || '',
                tieneVuelo: cam.tieneVuelo === true,
                tieneFechaVuelo: cam.tieneFechaVuelo === true,
                numeroVuelo: cam.numeroVuelo || '',
                vueloFechaSalida: cam.vueloFechaSalida || '',
                vueloHoraSalida: cam.vueloHoraSalida || '',
                vueloFechaRegreso: cam.vueloFechaRegreso || '',
                vueloHoraRegreso: cam.vueloHoraRegreso || '',
                incluirVueloWhatsApp: cam.incluirVueloWhatsApp === true,
                urls: Array.isArray(cam.urls) ? [...cam.urls] : (cam.url ? [cam.url] : []),
                mostrarIncluye: cam.mostrarIncluye !== false,
                mostrarFormasPago: cam.mostrarFormasPago !== false,
                mostrarInstrucciones: cam.mostrarInstrucciones !== false,
                mostrarUrls: cam.mostrarUrls !== false,
                mostrarCaminantes: cam.mostrarCaminantes !== false
            };
        }


        function normalizarDirectorioPersona(p) {
            return {
                ...p,
                id: p.id || '',
                nombre: p.nombre || '',
                cedula: p.cedula || '',
                pasaporte: p.pasaporte || '',
                telefono: p.telefono || '',
                telefono2: p.telefono2 || '',
                telefono3: p.telefono3 || '',
                correo: p.correo || '',
                notas: p.notas || '',
                tipo: p.tipo || '',
                pais: p.pais || '',
                lugar: p.lugar || '',
                fechaNacimiento: p.fechaNacimiento || '',
                tipoSangre: p.tipoSangre || '',
                contactoEmergenciaNombre: p.contactoEmergenciaNombre || '',
                telefonoEmergencia: p.telefonoEmergencia || '',
                nombreContacto: p.nombreContacto || '',
                telefonoContacto: p.telefonoContacto || '',
                urlMapa: p.urlMapa || '',
                horario: p.horario || '',
                terreno: p.terreno || [],
                precio: p.precio || '',
                etapaCamino: p.etapaCamino || '',
                nivel: p.nivel || ''
            };
        }


        function normalizarNota(n) {
            return {
                ...n,
                id: n.id || '',
                titulo: n.titulo || '',
                contenido: n.contenido || '',
                creada: n.creada || '',
                actualizada: n.actualizada || '',
                recordatorioFecha: n.recordatorioFecha || '',
                recordatorioVisto: n.recordatorioVisto === true
            };
        }


        function normalizarPrecioBuseta(p) {
            return {
                ...p,
                id: p.id || '',
                tipo: p.tipo || 'Local',
                provincia: p.provincia || '',
                nombre: p.nombre || '',
                monto: p.monto || 0
            };
        }


        function normalizarRetiro(r) {
            return {
                ...r,
                nombre: r.nombre || '',
                camNombre: r.camNombre || '',
                camId: r.camId || '',
                fecha: r.fecha || ''
            };
        }


        function normalizarConfigTema(ct) {
            const base = {
                tituloApp: TITULO_APP_DEFECTO,
                tituloDirectorio: TITULO_DIRECTORIO_DEFECTO,
                gruposPersonalizados: [],
                temaColor: 'naranja',
                formasPago: { sinpe: [...FORMAS_PAGO_DEFAULT.sinpe], cuentas: [...FORMAS_PAGO_DEFAULT.cuentas] },
                equipoRequerido: [...EQUIPO_REQUERIDO_DEFAULT],
                instrucciones: JSON.parse(JSON.stringify(INSTRUCCIONES_DEFAULT))
            };
            if (!ct) return base;
            return {
                ...ct,
                tituloApp: ct.tituloApp || base.tituloApp,
                tituloDirectorio: ct.tituloDirectorio || base.tituloDirectorio,
                gruposPersonalizados: Array.isArray(ct.gruposPersonalizados) ? [...ct.gruposPersonalizados] : base.gruposPersonalizados,
                temaColor: ct.temaColor || base.temaColor,
                formasPago: {
                    sinpe: (ct.formasPago && Array.isArray(ct.formasPago.sinpe)) ? [...ct.formasPago.sinpe] : [...base.formasPago.sinpe],
                    cuentas: (ct.formasPago && Array.isArray(ct.formasPago.cuentas)) ? [...ct.formasPago.cuentas] : [...base.formasPago.cuentas]
                },
                equipoRequerido: Array.isArray(ct.equipoRequerido) ? [...ct.equipoRequerido] : base.equipoRequerido,
                instrucciones: {
                    otrasRecomendaciones: (ct.instrucciones && Array.isArray(ct.instrucciones.otrasRecomendaciones)) ? [...ct.instrucciones.otrasRecomendaciones] : [...base.instrucciones.otrasRecomendaciones],
                    normasGenerales: (ct.instrucciones && Array.isArray(ct.instrucciones.normasGenerales)) ? [...ct.instrucciones.normasGenerales] : [...base.instrucciones.normasGenerales],
                    indicacionesSeguridad: (ct.instrucciones && Array.isArray(ct.instrucciones.indicacionesSeguridad)) ? [...ct.instrucciones.indicacionesSeguridad] : [...base.instrucciones.indicacionesSeguridad]
                }
            };
        }


        async function obtenerDatosAgenda() {
            return new Promise((resolve) => {
                const frame = document.getElementById('frameCaminatas');
                if (!frame) { resolve(null); return; }
                let resolved = false;
                const onMsg = (e) => {
                    if (e.data && e.data.type === 'agendaDatos') {
                        resolved = true;
                        window.removeEventListener('message', onMsg);
                        resolve(e.data.payload);
                    }
                };
                window.addEventListener('message', onMsg);
                const cleanup = () => {
                    if (!resolved) {
                        resolved = true;
                        window.removeEventListener('message', onMsg);
                        resolve(null);
                    }
                };
                const interval = setInterval(() => {
                    try { frame.contentWindow.postMessage({ type: 'getAgendaDatos' }, '*'); } catch (e) { clearInterval(interval); cleanup(); }
                }, 400);
                setTimeout(() => { clearInterval(interval); cleanup(); }, 3000);
            });
        }

