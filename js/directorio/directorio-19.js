/* ARCHIVO: js/directorio/directorio-19.js */

        function mergeConfigTema(existing, incoming) {
            const merged = { ...existing, ...incoming };
            if (!incoming) return merged;

            if (merged.tituloApp === TITULO_APP_DEFECTO && incoming.tituloApp) merged.tituloApp = incoming.tituloApp;
            if (merged.tituloDirectorio === TITULO_DIRECTORIO_DEFECTO && incoming.tituloDirectorio) merged.tituloDirectorio = incoming.tituloDirectorio;
            if (merged.temaColor === 'naranja' && incoming.temaColor) merged.temaColor = incoming.temaColor;

            merged.gruposPersonalizados = mergeUniqueStrings(merged.gruposPersonalizados, incoming.gruposPersonalizados);

            merged.formasPago = {
                sinpe: mergeUniqueStrings(merged.formasPago && merged.formasPago.sinpe, incoming.formasPago && incoming.formasPago.sinpe),
                cuentas: mergeUniqueStrings(merged.formasPago && merged.formasPago.cuentas, incoming.formasPago && incoming.formasPago.cuentas)
            };

            merged.equipoRequerido = mergeUniqueStrings(merged.equipoRequerido, incoming.equipoRequerido);

            const ins = merged.instrucciones || { otrasRecomendaciones: [], normasGenerales: [], indicacionesSeguridad: [] };
            const inIns = (incoming.instrucciones || {});
            merged.instrucciones = {
                otrasRecomendaciones: mergeUniqueStrings(ins.otrasRecomendaciones, inIns.otrasRecomendaciones),
                normasGenerales: mergeUniqueStrings(ins.normasGenerales, inIns.normasGenerales),
                indicacionesSeguridad: mergeUniqueStrings(ins.indicacionesSeguridad, inIns.indicacionesSeguridad)
            };

            return merged;
        }


        function mergePreferenciasCumpleanos(existing, incoming) {
            if (!incoming) return;
            Object.entries(incoming).forEach(([key, value]) => {
                if (!localStorage.getItem(key)) {
                    localStorage.setItem(key, value);
                }
            });
        }


        // NO MODIFICAR: Importación de respaldos completa
        async function importData(event) {
            const file = event.target.files[0];
            if (!file) return;
            if (window.TribuRespaldos && await TribuRespaldos.importarCompleto(event)) return;

            showConfirm(
                "Importar Respaldo",
                "Se combinarán los datos del respaldo con los actuales. No se sobrescribirán registros iguales. ¿Continuar?",
                () => {
                    const reader = new FileReader();
                    reader.onload = async (e) => {
                        try {
                            const importedData = JSON.parse(e.target.result);

                            if (!importedData.caminatas || !Array.isArray(importedData.caminatas)) {
                                throw new Error("Formato inválido");
                            }

                            consecutivoFactura = Math.max(consecutivoFactura, importedData.consecutivoFactura || 1);
                            ultimoRespaldo = Math.max(ultimoRespaldo, importedData.ultimoRespaldo || 0);

                            if (importedData.configTema) {
                                configTema = mergeConfigTema(configTema, importedData.configTema);
                                aplicarTema(configTema.temaColor);
                                poblarSelectGrupoTipo();
                            }

                            caminatas = mergeCaminatas(caminatas, importedData.caminatas).map(c => normalizarCaminata(c));
                            personasGlobales = mergeUniqueStrings(personasGlobales, importedData.personasGlobales);
                            directorioPersonas = mergeByIdOrProps(directorioPersonas, importedData.directorioPersonas || []).map(p => normalizarDirectorioPersona(p));
                            notas = mergeByIdOrProps(notas, importedData.notas || []).map(n => normalizarNota(n));
                            preciosBuseta = mergeByIdOrProps(preciosBuseta, importedData.preciosBuseta || []).map(p => normalizarPrecioBuseta(p));
                            historialRetiros = mergeByIdOrProps(
                                historialRetiros,
                                importedData.historialRetiros || [],
                                ['nombre', 'camNombre', 'fecha']
                            ).map(r => normalizarRetiro(r));

                            mergePreferenciasCumpleanos(obtenerPreferenciasCumpleanos(), importedData.preferenciasCumpleanos);

                            // Restaurar datos de la agenda (reconocer, conocidos, feriados)
                            if (importedData.agenda) {
                                localStorage.setItem('agendaDatos', JSON.stringify(importedData.agenda));
                            }

                            // Compatibilidad: si no hay directorio, regenerarlo desde nombres globales
                            if (directorioPersonas.length === 0 && personasGlobales.length > 0) {
                                directorioPersonas = personasGlobales.map((n, i) => ({
                                    id: 'imp_' + Date.now() + '_' + i,
                                    nombre: n,
                                    cedula: '',
                                    pasaporte: '',
                                    telefono: '',
                                    correo: '',
                                    notas: ''
                                }));
                            }

                            await saveData();
                            showToast("¡Respaldo combinado con éxito!");

                            // Reset file input
                            event.target.value = '';
                            renderHome();
                        } catch (error) {
                            console.error("Error importando JSON:", error);
                            showToast("El archivo no es un respaldo válido", "danger");
                        }
                    };
                    reader.readAsText(file);
                },
                "Sí, Combinar"
            );
        }


        function confirmarBorradoTotal() {
            showConfirm(
                "1/5 - ADVERTENCIA",
                "Lo que vas a hacer es PELIGROSO. Esta acción borra TODO el sistema.",
                () => {
                    showConfirm(
                        "2/5 - INFORMACIÓN",
                        "Toda la información será eliminada: caminatas, caminantes, pagos, reversiones, descripciones, facturas y configuraciones.",
                        () => {
                            showConfirm(
                                "3/5 - ATENCIÓN",
                                "No hay forma de deshacer esta acción. Una vez borrado, los datos no se pueden recuperar.",
                                () => {
                                    showConfirm(
                                        "4/5 - ESTÁS SEGURO?",
                                        "Última pregunta: ¿si se borra todo el sistema no se vuelve a recuperar?",
                                        () => {
                                            showConfirm(
                                                "5/5 - CONFIRMACIÓN FINAL",
                                                "¿Seguro que querés borrar ABSOLUTAMENTE TODO?",
                                                async () => {
                                                    caminatas = [];
                                                    personasGlobales = [];
                                                    directorioPersonas = [];
                                                    notas = [];
                                                    consecutivoFactura = 1;
                                                    preciosBuseta = [];
                                                    await localforage.clear();
                                                    showToast("Sistema reiniciado");
                                                    navigate('home');
                                                },
                                                "SÍ, BORRAR TODO",
                                                "btn-danger"
                                            );
                                        },
                                        "Sí, no se recupera",
                                        "btn-danger"
                                    );
                                },
                                "Entendido",
                                "btn-danger"
                            );
                        },
                        "Continuar",
                        "btn-danger"
                    );
                },
                "Entiendo el riesgo",
                "btn-danger"
            );
        }


        function manejarBotonAtras(e) {
            if (currentView === 'home' && !currentCaminataId) {
                history.pushState({ page: 'app' }, '', location.href);
                modalSalir.show();
            } else {
                // Si no estamos en home, el botón atrás funciona como navegación interna
                if (currentView === 'caminatas' || currentView === 'caminantes' || currentView === 'notas' || currentView === 'precios' || currentView === 'directorio') {
                    navigate('home');
                } else {
                    history.back();
                }
            }
        }


        function confirmarSalir() {
            modalSalir.hide();
            // Volver a la entrada anterior; si es la primera, la app se cierra
            setTimeout(() => history.back(), 300);
        }


        function cancelarSalir() {
            modalSalir.hide();
            // Reponer el estado para seguir atrapando el botón atrás
            history.pushState({ page: 'app' }, '', location.href);
        }

