/* ARCHIVO: js/core/init.js — núcleo Agenda Tribu */
        document.addEventListener('DOMContentLoaded', async () => {
            // Inicializar instancias de modales
            modalCaminante = new bootstrap.Modal(document.getElementById('modalCaminante'));
            modalMultiCaminantes = new bootstrap.Modal(document.getElementById('modalMultiCaminantes'));
            modalConfirm = new bootstrap.Modal(document.getElementById('modalConfirm'));
            modalWhatsApp = new bootstrap.Modal(document.getElementById('modalWhatsApp'));
            modalBuseta = new bootstrap.Modal(document.getElementById('modalBuseta'));
            modalReversion = new bootstrap.Modal(document.getElementById('modalReversion'));
            modalFactura = new bootstrap.Modal(document.getElementById('modalFactura'));
            modalPago = new bootstrap.Modal(document.getElementById('modalPago'));
            modalPrecioBuseta = new bootstrap.Modal(document.getElementById('modalPrecioBuseta'));
            modalAgregarDirectorio = new bootstrap.Modal(document.getElementById('modalAgregarDirectorio'));
            modalFusionManual = new bootstrap.Modal(document.getElementById('modalFusionManual'));
            modalNota = new bootstrap.Modal(document.getElementById('modalNota'));
            modalCancelarNota = new bootstrap.Modal(document.getElementById('modalCancelarNota'));
            modalRecordatorioNota = new bootstrap.Modal(document.getElementById('modalRecordatorioNota'));
            modalRecordatoriosHoy = new bootstrap.Modal(document.getElementById('modalRecordatoriosHoy'));
            modalOracionTribu = new bootstrap.Modal(document.getElementById('modalOracionTribu'));
            modalSalir = new bootstrap.Modal(document.getElementById('modalSalir'));
            modalSeleccionarCaminata = new bootstrap.Modal(document.getElementById('modalSeleccionarCaminata'));
            modalVerDirectorio = new bootstrap.Modal(document.getElementById('modalVerDirectorio'));
            modalCotizador = new bootstrap.Modal(document.getElementById('modalCotizador'));
            modalHistorialRetiros = new bootstrap.Modal(document.getElementById('modalHistorialRetiros'));
            modalHistorialParticipacion = new bootstrap.Modal(document.getElementById('modalHistorialParticipacion'));

            // Prevenir cierre accidental con botón atrás
            history.pushState({ page: 'app' }, '', location.href);
            window.addEventListener('popstate', manejarBotonAtras);

            // Configurar LocalForage (preferir IndexedDB)
            localforage.config({
                name: 'WhatsAppListManager',
                storeName: 'data',
                driver: [localforage.INDEXEDDB, localforage.LOCALSTORAGE, localforage.WEBSQL]
            });

            // Listeners
            document.getElementById('cam-moneda').addEventListener('change', updateCurrencySymbols);
            document.getElementById('cam-precio-buseta').addEventListener('input', updateTotalTransporte);
            document.getElementById('cam-cantidad-busetas').addEventListener('change', updateTotalTransporte);
            document.getElementById('cam-cantidad-guias').addEventListener('input', updateTotalDineroCaminata);
            document.getElementById('cam-precio').addEventListener('input', updateTotalDineroCaminata);
            document.getElementById('form-caminata').addEventListener('submit', saveCaminataHeader);
            document.getElementById('confirm-action-btn').addEventListener('click', executeConfirmAction);
            document.getElementById('nota-contenido').addEventListener('keydown', manejarEnterChecklist);

            document.addEventListener('selectionchange', () => {
                const sel = window.getSelection();
                const editor = document.getElementById('nota-contenido');
                if (sel.rangeCount && !sel.isCollapsed && editor && editor.contains(sel.anchorNode)) {
                    notaSavedRange = sel.getRangeAt(0).cloneRange();
                }
            });

            // Cargar Datos
            await loadData();
            if (window.TribuDB) {
                TribuDB.init().then(() => TribuDB.syncFromState(collectDbState())).catch(e => console.warn('TribuDB init', e));
            }
            aplicarTema(configTema.temaColor);
            const escalaGuardada = parseFloat(localStorage.getItem('escala_fuente_app'));
            if (!isNaN(escalaGuardada) && escalaGuardada > 0) {
                escalaFuenteApp = escalaGuardada;
                aplicarEscalaAccesibilidad();
            }
            poblarSelectGrupoTipo();
            iniciarRespaldoAutomatico();
            renderHome();
            revisarCumpleanos();
            verificarRecordatorios();
            setInterval(verificarRecordatorios, 60 * 1000); // Revisar recordatorios cada minuto
            
            // Cerrar dropdown de sugerencias al hacer click fuera
            document.addEventListener('click', function(e) {
                const suggList = document.getElementById('suggestions-list');
                const inputPas = document.getElementById('cam-usu-nombre');
                if (e.target !== inputPas && e.target !== suggList) {
                    suggList.style.display = 'none';
                }
            });

        });

        // --- DATABASE OPERATIONS ---
        // FLASK: Reemplazar por carga desde SQLAlchemy. Mantener la estructura
        //        de normalización (normalizarCaminata, normalizarDirectorioPersona,
        //        normalizarNota, normalizarPrecioBuseta) como helpers de validación.
        // NO MODIFICAR: Carga y normalización exacta de todos los datos
        async function loadData() {
            try {
                const caminatasRaw = await localforage.getItem(DB_KEY_CAMINATAS) || [];
                caminatas = caminatasRaw.map(c => normalizarCaminata(c));
                personasGlobales = await localforage.getItem(DB_KEY_PERSONAS) || [];
                const directorioRaw = await localforage.getItem(DB_KEY_DIRECTORIO) || [];
                directorioPersonas = directorioRaw.map(p => normalizarDirectorioPersona(p));
                // Compatibilidad: si no hay directorio, generarlo desde nombres globales
                if (directorioPersonas.length === 0 && personasGlobales.length > 0) {
                    directorioPersonas = personasGlobales.map((n, i) => ({
                        id: 'dir_' + Date.now() + '_' + i,
                        nombre: n,
                        cedula: '',
                        pasaporte: '',
                        telefono: '',
                        correo: '',
                        notas: ''
                    }));
                    await localforage.setItem(DB_KEY_DIRECTORIO, directorioPersonas);
                }
                consecutivoFactura = await localforage.getItem(DB_KEY_CONSECUTIVO) || 1;
                ultimoRespaldo = await localforage.getItem(DB_KEY_ULTIMO_RESPALDO) || 0;
                const preciosRaw = await localforage.getItem(DB_KEY_PRECIOS) || [];
                preciosBuseta = preciosRaw.map(p => normalizarPrecioBuseta(p));
                const notasRaw = await localforage.getItem(DB_KEY_NOTAS) || [];
                notas = notasRaw.map(n => normalizarNota(n));
                const retirosRaw = await localforage.getItem(DB_KEY_HISTORIAL_RETIROS) || [];
                historialRetiros = retirosRaw.map(r => normalizarRetiro(r));
                const asistenciaRaw = await localforage.getItem(DB_KEY_HISTORIAL_ASISTENCIA) || [];
                historialAsistencia = asistenciaRaw;
                const cotizacionesRaw = await localforage.getItem(DB_KEY_COTIZACIONES) || [];
                cotizacionesGuardadas = cotizacionesRaw.map(c => ({ ...c, fecha: c.fecha || new Date().toISOString() }));
                const configTemaGuardada = await localforage.getItem(DB_KEY_CONFIG_TEMA);
                if (configTemaGuardada) {
                    configTema = {
                        ...configTemaGuardada,
                        tituloApp: configTemaGuardada.tituloApp || TITULO_APP_DEFECTO,
                        tituloDirectorio: configTemaGuardada.tituloDirectorio || TITULO_DIRECTORIO_DEFECTO,
                        gruposPersonalizados: configTemaGuardada.gruposPersonalizados || [],
                        temaColor: configTemaGuardada.temaColor || 'naranja',
                        formasPago: {
                            sinpe: (configTemaGuardada.formasPago && configTemaGuardada.formasPago.sinpe) ? configTemaGuardada.formasPago.sinpe : [...FORMAS_PAGO_DEFAULT.sinpe],
                            cuentas: (configTemaGuardada.formasPago && configTemaGuardada.formasPago.cuentas) ? configTemaGuardada.formasPago.cuentas : [...FORMAS_PAGO_DEFAULT.cuentas]
                        },
                        equipoRequerido: (configTemaGuardada.equipoRequerido && configTemaGuardada.equipoRequerido.length) ? configTemaGuardada.equipoRequerido : [...EQUIPO_REQUERIDO_DEFAULT],
                        instrucciones: {
                            otrasRecomendaciones: (configTemaGuardada.instrucciones && configTemaGuardada.instrucciones.otrasRecomendaciones && configTemaGuardada.instrucciones.otrasRecomendaciones.length) ? configTemaGuardada.instrucciones.otrasRecomendaciones : [...INSTRUCCIONES_DEFAULT.otrasRecomendaciones],
                            normasGenerales: (configTemaGuardada.instrucciones && configTemaGuardada.instrucciones.normasGenerales && configTemaGuardada.instrucciones.normasGenerales.length) ? configTemaGuardada.instrucciones.normasGenerales : [...INSTRUCCIONES_DEFAULT.normasGenerales],
                            indicacionesSeguridad: (configTemaGuardada.instrucciones && configTemaGuardada.instrucciones.indicacionesSeguridad && configTemaGuardada.instrucciones.indicacionesSeguridad.length) ? configTemaGuardada.instrucciones.indicacionesSeguridad : [...INSTRUCCIONES_DEFAULT.indicacionesSeguridad]
                        },
                        membreteCotizador: (configTemaGuardada.membreteCotizador) ? {
                            telefono1: configTemaGuardada.membreteCotizador.telefono1 || '+506 86227500 - Kenneth Ruiz Matamoros',
                            telefono2: configTemaGuardada.membreteCotizador.telefono2 || '+506 86529837 - Jenny Ceciliano Cordoba',
                            facebook: configTemaGuardada.membreteCotizador.facebook || 'https://facebook.com/LaTribuDeLosLibres',
                            web: configTemaGuardada.membreteCotizador.web || 'www.latribu.top',
                            precioFrase: configTemaGuardada.membreteCotizador.precioFrase || 'Por favor requerimos el precio desglosado por persona y el global en Dólares USD',
                            horarioFrase: configTemaGuardada.membreteCotizador.horarioFrase || 'El horario de Atención y con quien conversamos',
                            banosFrase: configTemaGuardada.membreteCotizador.banosFrase || 'Por favor, requerimos indicar si las habitaciones tienen baños independientes o si son baños compartidos.',
                            cortesiaFrase: configTemaGuardada.membreteCotizador.cortesiaFrase || 'Por favor, indicar si el guía y el chofer del bus tienen el beneficio de estancia llamado cortesía.',
                            cierreFrase: configTemaGuardada.membreteCotizador.cierreFrase || 'Muchísimas gracias'
                        } : {
                            telefono1: '+506 86227500 - Kenneth Ruiz Matamoros',
                            telefono2: '+506 86529837 - Jenny Ceciliano Cordoba',
                            facebook: 'https://facebook.com/LaTribuDeLosLibres',
                            web: 'www.latribu.top',
                            precioFrase: 'Por favor requerimos el precio desglosado por persona y el global en Dólares USD',
                            horarioFrase: 'El horario de Atención y con quien conversamos',
                            banosFrase: 'Por favor, requerimos indicar si las habitaciones tienen baños independientes o si son baños compartidos.',
                            cortesiaFrase: 'Por favor, indicar si el guía y el chofer del bus tienen el beneficio de estancia llamado cortesía.',
                            cierreFrase: 'Muchísimas gracias'
                        }
                    };
                }
            } catch (err) {
                console.error("Error loading data:", err);
                showToast("Error al cargar la base de datos", "danger");
            }
        }

        // NO MODIFICAR: Guardado de todos los datos
        async function saveData() {
            try {
                await localforage.setItem(DB_KEY_CAMINATAS, caminatas);
                await localforage.setItem(DB_KEY_PERSONAS, personasGlobales);
                await localforage.setItem(DB_KEY_DIRECTORIO, directorioPersonas);
                await localforage.setItem(DB_KEY_CONSECUTIVO, consecutivoFactura);
                await localforage.setItem(DB_KEY_ULTIMO_RESPALDO, ultimoRespaldo);
                await localforage.setItem(DB_KEY_PRECIOS, preciosBuseta);
                await localforage.setItem(DB_KEY_NOTAS, notas);
                await localforage.setItem(DB_KEY_HISTORIAL_RETIROS, historialRetiros);
                await localforage.setItem(DB_KEY_HISTORIAL_ASISTENCIA, historialAsistencia);
                await localforage.setItem(DB_KEY_COTIZACIONES, cotizacionesGuardadas);
                await localforage.setItem(DB_KEY_CONFIG_TEMA, configTema);
                // Espejo SQLite local (no bloqueante)
                if (window.TribuDB && TribuDB.ready) {
                    try { TribuDB.syncFromState(collectDbState()); }
                    catch (e) { console.warn('TribuDB sync', e); }
                }
            } catch (err) {
                console.error("Error saving data:", err);
                showToast("Error al guardar en el dispositivo", "danger");
            }
        }

        // Estado completo para el espejo SQLite
        function collectDbState() {
            return {
                caminatas, personasGlobales, directorioPersonas, notas,
                consecutivoFactura, preciosBuseta, ultimoRespaldo,
                historialRetiros, historialAsistencia,
                cotizacionesGuardadas, configTema
            };
        }

        // === FIN BLOQUE MODULAR: CONSTANTS & STATE ===