/* ARCHIVO: js/directorio/directorio-15.js */

        function poblarSelectGrupoTipo() {
            const select = document.getElementById('directorio-tipo');
            if (!select) return;
            const grupos = [...GRUPOS_DIRECTORIO_BASE, ...configTema.gruposPersonalizados];
            select.innerHTML = grupos.map(g => `<option value="${escapeHtml(g)}" ${g === 'Persona' ? 'selected' : ''}>${escapeHtml(g)}</option>`).join('');
        }


        function actualizarTituloAppEnVivo(valor) {
            const nuevo = (valor || '').trim() || TITULO_APP_DEFECTO;
            configTema.tituloApp = nuevo;
            const appTitle = document.getElementById('app-title');
            if (appTitle) restaurarMarcaHeader();
            debounceSaveConfigTema();
        }


        function guardarTituloApp() {
            const input = document.getElementById('tema-titulo-app');
            if (!input) return;
            configTema.tituloApp = input.value.trim() || TITULO_APP_DEFECTO;
            const appTitle = document.getElementById('app-title');
            if (appTitle) restaurarMarcaHeader();
            saveData();
        }


        function actualizarTituloDirectorioEnVivo(valor) {
            const nuevo = (valor || '').trim() || TITULO_DIRECTORIO_DEFECTO;
            configTema.tituloDirectorio = nuevo;
            const titulo = document.getElementById('titulo-view-directorio');
            const total = document.getElementById('directorio-total');
            if (titulo && total) {
                titulo.innerHTML = `${nuevo} `;
                titulo.appendChild(total);
            }
            // Solo cambia la barra superior si el usuario ya está en la vista Directorio
            if (currentView === 'directorio') {
                const appTitle = document.getElementById('app-title');
                if (appTitle) restaurarMarcaHeader();
            }
            debounceSaveConfigTema();
        }


        function guardarTituloDirectorio() {
            const input = document.getElementById('tema-titulo-directorio');
            if (!input) return;
            configTema.tituloDirectorio = input.value.trim() || TITULO_DIRECTORIO_DEFECTO;
            initDirectorioView();
            saveData();
        }

        function debounceSaveConfigTema() {
            clearTimeout(debounceSaveTemaTimer);
            debounceSaveTemaTimer = setTimeout(() => saveData(), 300);
        }


        function agregarGrupoPersonalizado() {
            const input = document.getElementById('tema-nuevo-grupo');
            const nombre = (input.value || '').trim();
            if (!nombre) {
                showToast('Ingresá un nombre de grupo', 'warning');
                return;
            }
            const todos = [...GRUPOS_DIRECTORIO_BASE, ...configTema.gruposPersonalizados];
            if (todos.some(g => g.toLowerCase() === nombre.toLowerCase())) {
                showToast('Ese grupo ya existe', 'warning');
                return;
            }
            configTema.gruposPersonalizados.push(nombre);
            input.value = '';
            renderConfigTema();
            poblarSelectGrupoTipo();
            saveData();
        }


        function eliminarGrupoPersonalizado(index) {
            if (index < 0 || index >= configTema.gruposPersonalizados.length) return;
            configTema.gruposPersonalizados.splice(index, 1);
            renderConfigTema();
            poblarSelectGrupoTipo();
            saveData();
        }


        function renderConfigTema() {
            const contenedorColores = document.getElementById('contenedor-colores-tema');
            if (contenedorColores) {
                contenedorColores.innerHTML = Object.entries(TEMAS_DISPONIBLES).map(([key, tema]) => {
                    const activo = key === configTema.temaColor ? 'activo' : '';
                    const letra = tema.oscuro ? 'W' : 'C';
                    return `<div class="tema-swatch ${activo}" data-key="${key}" style="background-color: ${tema.primary};" onclick="aplicarTema('${key}'); guardarTemaColor('${key}');" title="${tema.nombre}"><span>${letra}</span></div>`;
                }).join('');
            }

            const inputApp = document.getElementById('tema-titulo-app');
            if (inputApp) inputApp.value = configTema.tituloApp;

            const inputDir = document.getElementById('tema-titulo-directorio');
            if (inputDir) inputDir.value = configTema.tituloDirectorio;

            const lista = document.getElementById('tema-lista-grupos');
            if (lista) {
                if (configTema.gruposPersonalizados.length === 0) {
                    lista.innerHTML = '<span class="text-muted small">No hay grupos personalizados</span>';
                } else {
                    lista.innerHTML = configTema.gruposPersonalizados.map((g, i) =>
                        `<span class="badge bg-secondary d-flex align-items-center gap-1" style="background-color: var(--primary-dark) !important;">${escapeHtml(g)} <i class="fas fa-times cursor-pointer" onclick="eliminarGrupoPersonalizado(${i})" title="Eliminar" style="cursor:pointer;"></i></span>`
                    ).join('');
                }
            }
        }


        function guardarTemaColor(colorKey) {
            configTema.temaColor = colorKey;
            saveData();
        }


        // --- FORMAS DE PAGO ---
        function renderFormasPago() {
            const listaSinpe = document.getElementById('lista-sinpe');
            const listaCuentas = document.getElementById('lista-cuentas');

            if (listaSinpe) {
                if (configTema.formasPago.sinpe.length === 0) {
                    listaSinpe.innerHTML = '<p class="text-muted small mb-0">No hay números SINPE registrados.</p>';
                } else {
                    listaSinpe.innerHTML = configTema.formasPago.sinpe.map((texto, i) => `
                        <div class="d-flex justify-content-between align-items-center py-1 border-bottom" style="border-color: #e5e7eb !important;">
                            <span class="small" style="white-space: pre-wrap;">${escapeHtml(texto)}</span>
                            <div class="d-flex gap-2 ms-2">
                                <button type="button" class="btn btn-link btn-sm p-0 text-decoration-none" style="font-size: 0.75rem;" onclick="editarFormaPago('sinpe', ${i})"><i class="fas fa-pen"></i></button>
                                <button type="button" class="btn btn-link btn-sm p-0 text-decoration-none text-danger" style="font-size: 0.75rem;" onclick="eliminarFormaPago('sinpe', ${i})"><i class="fas fa-trash"></i></button>
                            </div>
                        </div>
                    `).join('');
                }
            }

            if (listaCuentas) {
                if (configTema.formasPago.cuentas.length === 0) {
                    listaCuentas.innerHTML = '<p class="text-muted small mb-0">No hay cuentas registradas.</p>';
                } else {
                    listaCuentas.innerHTML = configTema.formasPago.cuentas.map((texto, i) => `
                        <div class="d-flex justify-content-between align-items-center py-1 border-bottom" style="border-color: #e5e7eb !important;">
                            <span class="small" style="white-space: pre-wrap;">${escapeHtml(texto)}</span>
                            <div class="d-flex gap-2 ms-2">
                                <button type="button" class="btn btn-link btn-sm p-0 text-decoration-none" style="font-size: 0.75rem;" onclick="editarFormaPago('cuentas', ${i})"><i class="fas fa-pen"></i></button>
                                <button type="button" class="btn btn-link btn-sm p-0 text-decoration-none text-danger" style="font-size: 0.75rem;" onclick="eliminarFormaPago('cuentas', ${i})"><i class="fas fa-trash"></i></button>
                            </div>
                        </div>
                    `).join('');
                }
            }
        }


        function agregarFormaPago(tipo) {
            const inputId = tipo === 'sinpe' ? 'nuevo-sinpe' : 'nueva-cuenta';
            const input = document.getElementById(inputId);
            const valor = (input.value || '').trim();
            if (!valor) return;
            if (!configTema.formasPago[tipo].some(x => x.toLowerCase() === valor.toLowerCase())) {
                configTema.formasPago[tipo].push(valor);
                saveData();
            }
            input.value = '';
            renderFormasPago();
        }


        function eliminarFormaPago(tipo, index) {
            if (index < 0 || index >= configTema.formasPago[tipo].length) return;
            const nombre = tipo === 'sinpe' ? 'SINPE' : 'cuenta bancaria';
            const valor = configTema.formasPago[tipo][index];

            showConfirm(
                `1/3 - Eliminar ${nombre}`,
                `¿Estás seguro de que querés borrar este ${nombre}?\n\n"${valor}"`,
                () => {
                    showConfirm(
                        `2/3 - Advertencia`,
                        `Esta acción no se puede deshacer. La información no se puede recuperar. ¿Continuar?`,
                        () => {
                            showConfirm(
                                `3/3 - Confirmación final`,
                                `¿Borrar definitivamente este ${nombre}?`,
                                () => {
                                    configTema.formasPago[tipo].splice(index, 1);
                                    saveData();
                                    renderFormasPago();
                                    showToast(`${nombre.charAt(0).toUpperCase() + nombre.slice(1)} eliminado`, 'success');
                                },
                                'Sí, borrar'
                            );
                        },
                        'Sí, continuar'
                    );
                },
                'Sí, estoy seguro'
            );
        }

