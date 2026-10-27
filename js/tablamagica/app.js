    document.addEventListener('DOMContentLoaded', () => {
        
        // CONSTANTES Y CONFIGURACIÓN
        const DB_NAME = 'PagosAppDB';
        const DB_VERSION = 3;
        let db;
        let currentCurrency = 'CRC';
        let currentEventId = null;
        let eventToLoadId = null;
        let pendingNuevoEvento = false;
        const AUTOSAVE_INTERVAL=4*24*60*60*1000;
        let allEventsCache = []; // Almacenar eventos en memoria para búsqueda rápida

        // Variable global para la Tarjeta de Viaje (WhatsApp format)
        let currentWhatsAppText = '';

        // Variable global para controlar la alerta de pérdida
        let alertaPerdidaHabilitada = localStorage.getItem('alertaPerdida') !== 'false';

        const airlinesData = {
            "Arajet": "hablemos@arajet.com", "AeroMexico": "Call Center: 2440-1354 / 2440-1378, Web: www.aeromexico.com", "Air Canada": "Call Center: 0800-032-0066, Web: www.aircanada.com", "Air Transat": "Web: http://www.airtransat.com", "AirFrance": "Call Center: 2539-7413, Web: www.airfrance.cr", "Alaska": "Call Center: 1-800-252-7522, Web: www. alaskaair.com", "American Airlines": "Call Center: 2420-1217, Web: www.aa.com", "Avianca": "Call Center: 4002-3320, Web: www. avianca.com", "British Airlines": "Call Center: 2441-2537, Web: www.britishairways.com", "Costa Rica Green Airways": "Call Center: 4070-0771, Web: www. costaricagreenair.com", "Copa Airlines": "Call Center: 800-044-0005, Web: www.copa.com", "Delta Airlines": "Call Center: 2257-4141, Web: www.delta.com", "Frontier": "Call Center: 2435-9262, Web: www.flyfrontier.com", "GOL": "Call Center: +55 11 3471 2973, Web: www.voegol.com.br", "Edelweiss": "Call Center: 1-877-359-7947, Web: www.flyedelweiss.com", "Iberojet": "Call Center: 6414-1180, Web: www.iberojet.com", "Iberia": "Call Center: 2036-0069, Web: www.iberia.com", "LATAM": "Call Center: 2257-5745, Web: www.latamairlines.com", "Lufthansa": "Call Center: 2442-7502, Web: www.lufthansa.com", "KLM": "Call Center: 2430-4748, Web: www.klm.com", "jetBlue": "Call Center: 0-800-012-1666, Web: www.jetblue.com", "SANSA": "Call Center: 2290-4100, Web: www.flysansa.com", "Southwest": "Call Center: 0-800-012-1917, Web: www. espanol.southwest.com", "Spirit": "Call Center: 4000-1887, Web: www.spirit.com", "United": "Call Center: 0-800-044-0005, Web: www.united.com", "Volaris": "Call Center: 4002-7462, Web: www.volaris.com", "Wingo": "Call Center: 0-571-307-8133, Web: www.wingo.com"
        };

        // SELECTORES DEL DOM
        const tabs = document.querySelectorAll('.tab-link');
        const tabContents = document.querySelectorAll('.tab-content');
        const addItemBtns = document.querySelectorAll('.btn-add-item');
        const eventoNombre = document.getElementById('evento-nombre');
        const eventoPrecio = document.getElementById('evento-precio');
        const eventoCapacidadCG = document.getElementById('evento-capacidad-cg');
        const eventoCapacidadSG = document.getElementById('evento-capacidad-sg');
        const tipoCambioInput = document.getElementById('tipo-cambio');
        const tipoCambioWrapper = document.getElementById('tipo-cambio-wrapper');
        const totalConversionLabel = document.getElementById('total-conversion-label');
        const totalConversionDisplay = document.getElementById('total-conversion');
        const totalConversionContainer = document.getElementById('total-conversion-container');
        const currencySelector = document.getElementById('currency-selector');
        const deleteConfirmModal = document.getElementById('delete-confirm-modal');
        const deleteConfirmBtn = document.getElementById('delete-confirm-btn');
        const deleteCancelBtn = document.getElementById('delete-cancel-btn');
        const deleteConfirmMessage = document.getElementById('delete-confirm-message');
        const editConfirmModal = document.getElementById('edit-confirm-modal');
        const editConfirmBtn = document.getElementById('edit-confirm-btn');
        const editCancelBtn = document.getElementById('edit-cancel-btn');
        const editConfirmMessage = document.getElementById('edit-confirm-message');
        const addConfirmModal = document.getElementById('add-confirm-modal');
        const addConfirmBtn = document.getElementById('add-confirm-btn');
        const addCancelBtn = document.getElementById('add-cancel-btn');
        const exportExcelBtn = document.getElementById('export-excel-btn');
        
        // Selectores Modal Tarjeta Viaje
        const tarjetaViajeModal = document.getElementById('tarjeta-viaje-modal');
        const tarjetaViajeCloseBtn = document.getElementById('tarjeta-viaje-close-btn');
        const tarjetaViajeRenderArea = document.getElementById('tarjeta-viaje-render-area');
        const tarjetaViajePrintBtn = document.getElementById('tarjeta-viaje-print-btn');
        const tarjetaViajeDownloadBtn = document.getElementById('tarjeta-viaje-download-btn');
        const tarjetaViajeWhatsappBtn = document.getElementById('tarjeta-viaje-whatsapp-btn');

        const grandTotalNacionalesCrc = document.getElementById('grand-total-nacionales-crc');
        const diferenciaNacionalesCrc = document.getElementById('diferencia-nacionales-crc');
        const diferenciaGeneralNacionalesCrc = document.getElementById('diferencia-general-nacionales-crc');
        const crcConversionWrappers = document.querySelectorAll('.crc-conversion');
        const guardarEventoBtn = document.getElementById('guardar-evento-btn') || {addEventListener(){},style:{}};
        const nuevoEventoBtn = document.getElementById('nuevo-evento-btn');
        const eventosGuardadosList = document.getElementById('eventos-guardados-list');
        const reconocimientosGuardadosList = document.getElementById('reconocimientos-guardados-list');
        const cotizacionesGuardadosList = document.getElementById('cotizaciones-guardados-list');
        const cotizadosGuardadosList = document.getElementById('cotizados-guardados-list');
        const lossWarningModal = document.getElementById('loss-warning-modal');
        const lossWarningCloseBtn = document.getElementById('loss-warning-close-btn');
        const backupBtn = document.getElementById('backup-btn');
        const autosaveTimerDisplay = document.getElementById('autosave-timer');
        const addPagoFab = document.getElementById('add-pago-fab');
        const toggleAlertaBtn = document.getElementById('toggle-alerta-btn');
        
        // Selectores de Búsqueda
        const searchInput = document.getElementById('search-eventos');
        const toggleEventosListBtn = document.getElementById('toggle-eventos-list');
        const eventosGuardadosWrapper = document.getElementById('eventos-guardados-wrapper');

        let pendingDeleteAction = null;
        let pendingDeleteContext = '';

        function confirmarEliminacion(accion, contexto) {
            pendingDeleteAction = accion;
            pendingDeleteContext = contexto;
            document.getElementById('delete-confirm-message-1').textContent = `¿Está seguro de eliminar este ${contexto.toLowerCase()}?`;
            document.getElementById('delete-confirm-modal-1').classList.add('visible');
        }

        document.getElementById('delete-cancel-1').addEventListener('click', () => {
            document.getElementById('delete-confirm-modal-1').classList.remove('visible');
            pendingDeleteAction = null;
            pendingDeleteContext = '';
        });

        document.getElementById('delete-confirm-1').addEventListener('click', () => {
            document.getElementById('delete-confirm-modal-1').classList.remove('visible');
            document.getElementById('delete-confirm-message-2').textContent = `¿Realmente está seguro de eliminar este ${pendingDeleteContext.toLowerCase()}? Esta acción no se puede deshacer.`;
            document.getElementById('delete-confirm-modal-2').classList.add('visible');
        });

        document.getElementById('delete-cancel-2').addEventListener('click', () => {
            document.getElementById('delete-confirm-modal-2').classList.remove('visible');
            pendingDeleteAction = null;
            pendingDeleteContext = '';
        });

        document.getElementById('delete-confirm-2').addEventListener('click', () => {
            document.getElementById('delete-confirm-modal-2').classList.remove('visible');
            if (typeof pendingDeleteAction === 'function') {
                pendingDeleteAction();
            }
            pendingDeleteAction = null;
            pendingDeleteContext = '';
        });

        // Auto-ajustar Dificultad según Distancia
        function updateDificultadFromDistancia(distanciaInput) {
            const formGroup = distanciaInput.closest('.form-group');
            if (!formGroup) return;
            const dificultadSelect = formGroup.querySelector('.info-dificultad, .recon-dificultad');
            if (!dificultadSelect) return;
            const raw = String(distanciaInput.value).replace(/,/g, '.');
            const km = parseFloat(raw) || 0;
            let nivel = 'Paseo básico';
            if (km >= 20) nivel = 'Difícil avanzado';
            else if (km >= 15) nivel = 'Intermedio moderado';
            else if (km >= 10) nivel = 'Intermedio';
            dificultadSelect.value = nivel;
        }

        // Lógica del botón de Alerta de Pérdida Global y Locales
        function updateAlertaBtnUI() {
            if (alertaPerdidaHabilitada) {
                toggleAlertaBtn.textContent = 'Modo Escucha: ACTIVADO';
                toggleAlertaBtn.className = 'btn btn-exito';
                document.querySelectorAll('.local-alert-container').forEach(el => el.style.display = 'none');
            } else {
                toggleAlertaBtn.textContent = 'Modo Escucha: DESACTIVADO';
                toggleAlertaBtn.className = 'btn btn-secondary';
                document.querySelectorAll('.local-alert-container').forEach(el => el.style.display = 'block');
            }
        }
        
        if (toggleAlertaBtn) {
            toggleAlertaBtn.addEventListener('click', () => {
                alertaPerdidaHabilitada = !alertaPerdidaHabilitada;
                localStorage.setItem('alertaPerdida', alertaPerdidaHabilitada);
                updateAlertaBtnUI();
            });
            updateAlertaBtnUI(); // Configuración inicial
        }

        // CONFIGURACIÓN DE INDEXEDDB
        function initDB() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(DB_NAME, DB_VERSION);
                request.onerror = (event) => { console.error('Error al abrir IndexedDB:', event.target.error); reject('Error de base de datos'); };
                request.onsuccess = (event) => { 
                    db = event.target.result;
                    console.log('Base de datos abierta exitosamente.'); 
                    resolve(); 
                };
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains('eventos')) { 
                        db.createObjectStore('eventos', { keyPath: 'id', autoIncrement: true }); 
                    }
                    if (!db.objectStoreNames.contains('reconocimientos')) { 
                        db.createObjectStore('reconocimientos', { keyPath: 'id', autoIncrement: true }); 
                    }
                };
            });
        }

        // MANEJO DE FORMULARIOS Y UI
        document.body.addEventListener('keydown', (e) => {
            const isNumericField = e.target.type === 'number' || e.target.classList.contains('item-price-per-person') || e.target.classList.contains('item-price-grupal') || e.target.classList.contains('item-quantity') || e.target.classList.contains('airline-price') || e.target.id === 'evento-precio' || e.target.id === 'evento-capacidad-cg' || e.target.id === 'evento-capacidad-sg' || e.target.id === 'tipo-cambio' || e.target.id.startsWith('monto-');
            
            if (isNumericField) {
                if (!/[0-9]/.test(e.key) && e.key !== '.' && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
                    if (!(e.ctrlKey || e.metaKey) || (e.key !== 'a' && e.key !== 'c' && e.key !== 'v' && e.key !== 'x')) {
                        e.preventDefault();
                    }
                }
            }
        });

        document.body.addEventListener('input', (e) => {
            if (e.target.type === 'number' || e.target.classList.contains('item-price-per-person') || e.target.classList.contains('item-price-grupal') || e.target.classList.contains('item-quantity') || e.target.classList.contains('airline-price') || e.target.id === 'evento-precio' || e.target.id === 'evento-capacidad-cg' || e.target.id === 'evento-capacidad-sg' || e.target.id === 'tipo-cambio' || e.target.id.startsWith('monto-')) {
                let value = e.target.value.replace(/[^0-9.]/g, ''); 
                if (value.length > 1 && value.startsWith('0') && !value.startsWith('0.')) {
                    value = parseFloat(value);
                }
                e.target.value = value;
            }
            if (e.target === eventoNombre || e.target.classList.contains('item-nombre')) {
                e.target.value = e.target.value.toUpperCase();
            }

            if (e.target.matches('.phone-input')) {
                e.target.value = e.target.value.replace(/[^0-9]/g, '');
            }
            saveDraft();
        });

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(item => item.classList.remove('active'));
                tab.classList.add('active');
                const targetTab = document.getElementById(`tab-${tab.dataset.tab}`);
                if(targetTab) targetTab.classList.add('active');
                tabContents.forEach(content => content.classList.remove('active'));
                if(targetTab) targetTab.classList.add('active');
            });
        });
        
        function updateFieldSelectorsForCurrency() {
            const allFieldSelectors = document.querySelectorAll('.field-selector');
            allFieldSelectors.forEach(selector => {
                const airlineOption = selector.querySelector('option[value="aerolinea"]');
                const card = selector.closest('.item-card');
                if (currentCurrency === 'USD') {
                    if (!airlineOption) {
                        const option = document.createElement('option');
                        option.value = 'aerolinea';
                        option.textContent = 'Aerolínea';
                        selector.options[0].insertAdjacentElement('afterend', option);
                    }
                } else { 
                    if (airlineOption) {
                        airlineOption.remove();
                    }
                    const airlineField = card.querySelector('[data-field-name="aerolinea"]');
                    if (airlineField) {
                        airlineField.remove();
                        togglePriceVisibility(card);
                    }
                }
            });
        }
        
        currencySelector.addEventListener('change', (e) => {
            currentCurrency = e.target.value;
            tipoCambioWrapper.style.display = (currentCurrency === 'USD') ? 'block' : 'none';
            totalConversionContainer.style.display = (currentCurrency === 'USD') ? 'block' : 'none';
            totalConversionLabel.textContent = (currentCurrency === 'USD') ? 'Total en CRC' : 'Total en USD';
            
            updateFieldSelectorsForCurrency();
            updateAllTotals();
        });

        function updateCotizadorSelector(card, isCotizador) {
            const selector = card.querySelector('.field-selector');
            const label = card.querySelector('label[for^="field-selector-"]');
            if (!selector) return;
            const allowed = ['', 'descripcion', 'telefono', 'whatsapp', 'email', 'fecha', 'nota'];
            if (isCotizador) {
                if (label) label.textContent = 'Corregir Campo';
                Array.from(selector.options).forEach(opt => {
                    opt.hidden = !allowed.includes(opt.value);
                    opt.disabled = !allowed.includes(opt.value);
                });
            } else {
                if (label) label.textContent = 'Añadir Campo';
                Array.from(selector.options).forEach(opt => {
                    opt.hidden = false;
                    opt.disabled = false;
                });
            }
        }

        function updatePagoVisibility(card) {
            if (!card) return;
            const reconField = card.querySelector('[data-field-name="reconocimiento"]');
            const infoField = card.querySelector('[data-field-name="informacion"]');
            const cotizadorField = card.querySelector('[data-field-name="cotizador"]');
            let isRecon = !!reconField || !!infoField;
            if (infoField && infoField.dataset.informacion) {
                try {
                    const info = JSON.parse(infoField.dataset.informacion);
                    isRecon = isRecon || info.reconocimiento === true;
                } catch (e) {}
            }

            const nombreGroup = card.querySelector('.item-nombre')?.closest('.form-group');
            const priceTypeGroup = card.querySelector('.price-type-selector')?.closest('.form-group');
            const priceSection = card.querySelector('.price-section');
            const localAlertGroup = card.querySelector('.local-alert-container');
            const fieldSelectorGroup = card.querySelector('.field-selector')?.closest('.form-group');

            if (isRecon) {
                if (nombreGroup) nombreGroup.style.display = 'none';
                if (priceTypeGroup) priceTypeGroup.style.display = 'none';
                if (priceSection) priceSection.style.display = 'none';
                if (localAlertGroup) localAlertGroup.style.display = 'none';
                updateCotizadorSelector(card, false);
                return;
            }

            if (cotizadorField) {
                if (nombreGroup) nombreGroup.style.display = 'none';
                if (priceTypeGroup) priceTypeGroup.style.display = 'none';
                if (priceSection) priceSection.style.display = 'none';
                if (localAlertGroup) localAlertGroup.style.display = 'none';
                if (fieldSelectorGroup) fieldSelectorGroup.style.display = 'none';
                return;
            }

            if (nombreGroup) nombreGroup.style.display = '';
            if (priceTypeGroup) priceTypeGroup.style.display = '';
            if (priceSection) priceSection.style.display = '';
            if (fieldSelectorGroup) fieldSelectorGroup.style.display = '';
            if (localAlertGroup) localAlertGroup.style.display = alertaPerdidaHabilitada ? 'none' : 'block';
            updateCotizadorSelector(card, false);

            const airlineField = card.querySelector('[data-field-name="aerolinea"]');
            if (airlineField) {
                if (priceTypeGroup) priceTypeGroup.style.display = 'none';
                if (priceSection) priceSection.style.display = 'none';
            }
        }

        function togglePriceVisibility(card) {
            updatePagoVisibility(card);
        }

        // LÓGICA PARA AÑADIR Y ELIMINAR ITEMS Y PRECIOS DINÁMICOS
        function addNewPagoItem() {
            openAddModal(() => {
                const category = 'transporte-nacional';
                const listContainer = document.getElementById(`${category}-list`);
                if (listContainer) {
                    const lastItem = listContainer.lastElementChild;
                    if (lastItem) {
                        const nombreInput = lastItem.querySelector('input[required]');
                        if (nombreInput && nombreInput.value.trim() === '') {
                            showNotification('Por favor, completa el campo "Nombre" del último pago antes de agregar uno nuevo.');
                            return;
                        }
                    }

                    const itemsToCollapse = listContainer.querySelectorAll('.item-card');
                    itemsToCollapse.forEach(card => {
                        if (!card.classList.contains('collapsed')) {
                            card.classList.add('collapsed');
                            const collapseBtn = card.querySelector('.btn-collapse-item');
                            if (collapseBtn) collapseBtn.textContent = 'Mostrar';
                        }
                    });

                    const newItemWrapper = document.createElement('div');
                    newItemWrapper.innerHTML = createItemHTML();
                    const newItem = newItemWrapper.firstElementChild;
                    listContainer.appendChild(newItem);
                    calculateGrandTotal(category);
                    newItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        }

        addItemBtns.forEach(btn => {
            btn.addEventListener('click', addNewPagoItem);
        });

        if (addPagoFab) {
            addPagoFab.addEventListener('click', addNewPagoItem);
        }

        document.body.addEventListener('click', (e) => {
            const collapseBtn = e.target.closest('.btn-collapse-item');
            const deleteFieldBtn = e.target.closest('.btn-delete-field');
            const exportPagoBtn = e.target.closest('.export-pago-btn');

            if (collapseBtn) {
                const card = collapseBtn.closest('.item-card');
                if (card) {
                    card.classList.toggle('collapsed');
                    const isCollapsed = card.classList.contains('collapsed');
                    collapseBtn.textContent = isCollapsed ? 'Mostrar' : 'Ocultar';
                    if (isCollapsed) {
                        updateTotals(card.querySelector('input')); 
                    }
                }
            }
            if (deleteFieldBtn) {
                const formGroup = deleteFieldBtn.closest('.form-group');
                if (formGroup) {
                    const fieldName = formGroup.dataset.fieldName;
                    const itemCard = formGroup.closest('.item-card');
                    if (itemCard) {
                        if (fieldName) {
                            const selector = itemCard.querySelector('.field-selector');
                            const option = selector.querySelector(`option[value="${fieldName}"]`);
                            if (option) option.disabled = false;
                        }
                        formGroup.remove();
                        updatePagoVisibility(itemCard);
                        updateEventInfoVisibility();
                        updateTotals(itemCard.querySelector('input')); 
                    }
                }
            }
            if (exportPagoBtn) {
                const card = exportPagoBtn.closest('.item-card');
                if (card) {
                    const pagoData = getPagoDataFromCard(card);
                    const jsonString = JSON.stringify(pagoData, null, 2);
                    const blob = new Blob([jsonString], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    const nombrePago = (pagoData.nombre || 'pago').replace(/\s+/g, '_');
                    a.download = `pago_${nombrePago}_${new Date().toISOString().slice(0,10)}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }
            }
            // Control del botón de alerta local dentro de la tarjeta
            if (e.target.classList.contains('local-alert-btn')) {
                const btn = e.target;
                const isAlertOn = btn.dataset.alert === 'true';
                if (isAlertOn) {
                    btn.dataset.alert = 'false';
                    btn.textContent = 'Desactivada';
                    btn.classList.remove('btn-exito');
                    btn.classList.add('btn-secondary');
                } else {
                    btn.dataset.alert = 'true';
                    btn.textContent = 'Activada';
                    btn.classList.remove('btn-secondary');
                    btn.classList.add('btn-exito');
                }
            }
            if (e.target.classList.contains('reconocimiento-btn')) {
                const btn = e.target;
                const card = btn.closest('.item-card');
                const isActive = btn.dataset.reconocimiento === 'true';
                btn.dataset.reconocimiento = isActive ? 'false' : 'true';
                btn.textContent = isActive ? 'Reconocimiento: No' : 'Reconocimiento: Sí';
                btn.classList.toggle('btn-exito', !isActive);
                btn.classList.toggle('btn-secondary', isActive);
                updatePagoVisibility(card);
                updateTotals(card.querySelector('input'));
                saveDraft();
            }
            if (e.target.closest('.btn-delete-item')) {
                const element = e.target.closest('.item-card');
                openDeleteModal('¿Estás seguro de que deseas borrar este pago?', () => {
                    const category = element.parentElement.id;
                    element.remove();
                    calculateGrandTotal(category);
                    updateEventInfoVisibility();
                });
            }
        });



        function updateEventInfoVisibility() {
            const cards = document.querySelectorAll('.item-card');
            let hasReconocimiento = false;
            cards.forEach(card => {
                const reconField = card.querySelector('[data-field-name="reconocimiento"]');
                if (reconField) hasReconocimiento = true;
                const infoField = card.querySelector('[data-field-name="informacion"]');
                if (infoField && infoField.dataset.informacion) {
                    try {
                        const info = JSON.parse(infoField.dataset.informacion);
                        if (info.reconocimiento) hasReconocimiento = true;
                    } catch (e) {}
                }
            });
            const hasCotizador = document.querySelectorAll('[data-field-name="cotizador"]').length > 0;

            const precioGroup = document.getElementById('evento-precio')?.closest('.form-group');
            const cgGroup = document.getElementById('evento-capacidad-cg')?.closest('.form-group');
            const sgGroup = document.getElementById('evento-capacidad-sg')?.closest('.form-group');
            const miniExcedente = document.getElementById('mini-excedente-wrapper');
            const nombreEventoGroup = document.getElementById('evento-nombre')?.closest('.form-group');

            if (hasReconocimiento) {
                if (precioGroup) precioGroup.style.display = 'none';
                if (cgGroup) cgGroup.style.display = 'none';
                if (sgGroup) sgGroup.style.display = 'none';
                if (miniExcedente) miniExcedente.style.display = 'none';
                if (nombreEventoGroup) nombreEventoGroup.style.display = '';
                eventoPrecio.value = '0';
                eventoCapacidadCG.value = '0';
                eventoCapacidadSG.value = '1';
            } else if (hasCotizador) {
                if (precioGroup) precioGroup.style.display = 'none';
                if (cgGroup) cgGroup.style.display = 'none';
                if (sgGroup) sgGroup.style.display = 'none';
                if (miniExcedente) miniExcedente.style.display = 'none';
                if (nombreEventoGroup) nombreEventoGroup.style.display = 'none';

                for (const card of cards) {
                    const cotiField = card.querySelector('[data-field-name="cotizador"]');
                    if (cotiField) {
                        const cotiNombre = cotiField.querySelector('.cotizador-nombre')?.value;
                        if (cotiNombre !== undefined) {
                            eventoNombre.value = cotiNombre;
                            break;
                        }
                    }
                }
            } else {
                if (precioGroup) precioGroup.style.display = '';
                if (cgGroup) cgGroup.style.display = '';
                if (sgGroup) sgGroup.style.display = '';
                if (miniExcedente) miniExcedente.style.display = '';
                if (nombreEventoGroup) nombreEventoGroup.style.display = '';
            }
        }



        function createItemHTML() {
            const uniqueId = `item-${Date.now()}-${Math.random()}`;
            let airlineOptionHTML = (currentCurrency === 'USD') ? `<option value="aerolinea">Aerolínea</option>` : '';
            let localAlertDisplay = alertaPerdidaHabilitada ? 'none' : 'block';
            
            return `<div class="item-card" id="${uniqueId}"><button class="btn-collapse-item" aria-label="Colapsar pago">Ocultar</button><button class="btn-delete-item" aria-label="Eliminar pago"><svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg></button><div class="collapsed-summary"></div><div class="collapsible-content"><div class="card-top-row"><div class="form-group"><label for="tipo-gasto-${uniqueId}">Tipo de Gasto</label><select id="tipo-gasto-${uniqueId}" class="item-tipo-gasto" onchange="var n=this.parentElement.querySelector('.item-nombre');if(this.value==='Otros'){n.style.display='';n.value='';n.focus();}else{n.value=this.value;n.style.display='none';}"><option value="">— Seleccionar —</option><option value="Transporte">Transporte</option><option value="Estadía">Estadía</option><option value="Almuerzo">Almuerzo</option><option value="Desayuno">Desayuno</option><option value="Puntos">Puntos</option><option value="Café">Café</option><option value="Fiesta">Fiesta</option><option value="Lanchas">Lanchas</option><option value="Aéreo">Aéreo</option><option value="Acarreo">Acarreo</option><option value="Guía">Guía</option><option value="4x4">4x4</option><option value="Camping">Camping</option><option value="Scouting">Scouting</option><option value="Refrigerio">Refrigerio</option><option value="Entrada">Entrada</option><option value="Uber/Didi/Taxi">Uber/Didi/Taxi</option><option value="Bus">Bus</option><option value="Todo pegado al mismo lugar">Todo pegado al mismo lugar</option><option value="Donación">Donación</option><option value="Otros">Otros</option></select><input type="text" id="nombre-${uniqueId}" class="item-nombre" placeholder="Descripción" style="display:none"></div><div class="form-group"><label for="tipo-precio-${uniqueId}">Tipo de Precio</label><select id="tipo-precio-${uniqueId}" class="price-type-selector"><option value="persona">Precio por Persona</option><option value="grupal">Precio Grupal</option></select></div><div class="form-group"><label for="field-selector-${uniqueId}">Añadir Campo</label><select id="field-selector-${uniqueId}" class="field-selector" data-card-id="${uniqueId}"><option value="">Seleccionar...</option>${airlineOptionHTML}<option value="descripcion">Descripción</option><option value="telefono">Teléfono</option><option value="whatsapp">WhatsApp</option><option value="email">Email</option><option value="fecha">Fecha</option><option value="cantidad">Cantidad</option><option value="tipo_pago">Tipo de Pago</option><option value="guias">Guías</option><option value="nombre_encargado">Nombre Encargado</option><option value="telefono_encargado">Teléfono Encargado</option><option value="nota">Nota</option><option value="informacion">Información</option><option value="reconocimiento">Reconocimiento</option><option value="cotizador">Cotizador</option></select></div><div class="form-group local-alert-container" style="display: ${localAlertDisplay};"><label>Alerta Individual</label><button type="button" class="btn local-alert-btn btn-secondary" data-alert="false" style="width: 100%; margin-top: 0; padding: 0.8rem 0;">Desactivada</button></div></div><div class="dynamic-fields-container" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem"></div><div class="price-section" style="border-top:1px solid var(--color-secundario);margin-top:1rem;padding-top:1rem"><div class="price-details-container"><div class="form-group"><label for="precio-persona-${uniqueId}">Precio p/p</label><input type="number" id="precio-persona-${uniqueId}" class="item-price-per-person" min="0" value="0"></div><div class="total-display"><strong>TOTAL:</strong> <span class="total-amount">0</span></div></div></div><button class="btn btn-secondary export-pago-btn" style="margin-top:1rem;width:100%">Exportar Pago (JSON)</button></div></div>`;
        }
        
        // Función para crear un elemento de campo de forma programática
        function createFieldElement(fieldName, cardId) {
            const fieldId = `${fieldName}-${cardId}`;
            const formGroup = document.createElement('div');
            formGroup.className = 'form-group';
            formGroup.dataset.fieldName = fieldName;
            const deleteButton = `<button type="button" class="btn-delete-field" aria-label="Eliminar campo"><svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button>`;

            let labelText = '';
            let inputElement;

            switch (fieldName) {
                case 'aerolinea':
                    formGroup.style.gridColumn = '1 / -1';
                    const airlineSelect = document.createElement('select');
                    airlineSelect.id = `${fieldId}-selector`;
                    airlineSelect.className = 'airline-selector';
                    const defaultOption = document.createElement('option');
                    defaultOption.value = '';
                    defaultOption.textContent = 'Seleccione una aerolínea...';
                    airlineSelect.appendChild(defaultOption);
                    Object.keys(airlinesData).forEach(name => {
                        const option = document.createElement('option');
                        option.value = name;
                        option.textContent = name;
                        airlineSelect.appendChild(option);
                    });
                    const infoDisplay = document.createElement('p');
                    infoDisplay.id = `${fieldId}-info`;
                    infoDisplay.className = 'airline-info-display';
                    infoDisplay.style.cssText = 'margin-top: 0.5rem; background-color: var(--color-secundario); padding: 0.8rem; border-radius: 8px; min-height: 40px; color: var(--color-texto); font-size: 0.9rem;';

                    const airlineFieldsContainer = document.createElement('div');
                    airlineFieldsContainer.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-top: 1rem;';
                    
                    const fields = ['boleto-ida', 'boleto-vuelta', 'precio-asiento', 'equipaje-basico', 'equipaje-medio', 'equipaje-full', 'precio-opcional'];
                    fields.forEach(f => {
                        const subGroup = document.createElement('div');
                        subGroup.className = 'form-group';
                        const subLabel = document.createElement('label');
                        subLabel.setAttribute('for', `${fieldId}-${f}`);
                        subLabel.textContent = f.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                        const subInput = document.createElement('input');
                        subInput.type = 'number';
                        subInput.id = `${fieldId}-${f}`;
                        subInput.className = 'airline-price';
                        subInput.value = '0';
                        subInput.min = '0';
                        subGroup.append(subLabel, subInput);
                        airlineFieldsContainer.appendChild(subGroup);
                    });

                    formGroup.innerHTML = `<label for="${fieldId}-selector">Aerolínea</label>`;
                    formGroup.appendChild(airlineSelect);
                    formGroup.innerHTML += deleteButton;
                    formGroup.appendChild(infoDisplay);
                    formGroup.appendChild(airlineFieldsContainer);

                    airlineSelect.addEventListener('change', (e) => {
                        const selectedAirline = e.target.value;
                        infoDisplay.textContent = airlinesData[selectedAirline] || '';
                        updateTotals(e.target);
                    });
                    return formGroup;

                case 'descripcion': labelText = 'Descripción'; inputElement = document.createElement('input'); inputElement.type = 'text'; break;
                case 'telefono': labelText = 'Teléfono'; inputElement = document.createElement('input'); inputElement.type = 'tel'; inputElement.maxLength = 8; inputElement.className = 'phone-input'; break;
                case 'whatsapp': labelText = 'WhatsApp'; inputElement = document.createElement('input'); inputElement.type = 'tel'; inputElement.maxLength = 8; inputElement.className = 'phone-input'; break;
                case 'email': labelText = 'Email'; inputElement = document.createElement('input'); inputElement.type = 'email'; break;
                case 'fecha': labelText = 'Fecha'; inputElement = document.createElement('input'); inputElement.type = 'date'; break;
                case 'cantidad': labelText = 'Cantidad'; inputElement = document.createElement('input'); inputElement.type = 'number'; inputElement.value = '1'; inputElement.min = '1'; inputElement.className = 'item-quantity'; break;
                case 'tipo_pago':
                    labelText = 'Tipo de Pago';
                    inputElement = document.createElement('select');
                    ['Efectivo', 'SINPE', 'Transferencia'].forEach(op => {
                        const option = document.createElement('option');
                        option.value = op.toLowerCase();
                        option.textContent = op;
                        inputElement.appendChild(option);
                    });
                    break;
                case 'guias': labelText = 'Guías'; inputElement = document.createElement('input'); inputElement.type = 'text'; break;
                case 'nombre_encargado': labelText = 'Nombre Encargado'; inputElement = document.createElement('input'); inputElement.type = 'text'; break;
                case 'telefono_encargado': labelText = 'Teléfono Encargado'; inputElement = document.createElement('input'); inputElement.type = 'tel'; inputElement.maxLength = 8; inputElement.className = 'phone-input'; break;
                case 'nota': labelText = 'Nota'; inputElement = document.createElement('textarea'); inputElement.rows = 3; break;
                case 'cotizador': {
                    formGroup.style.gridColumn = '1 / -1';
                    formGroup.style.position = 'relative';

                    const createSubGroup = (label, inputOrSelect, classes = '') => {
                        const sub = document.createElement('div');
                        sub.className = 'form-group';
                        const subLabel = document.createElement('label');
                        subLabel.textContent = label;
                        if (inputOrSelect.id) subLabel.setAttribute('for', inputOrSelect.id);
                        sub.appendChild(subLabel);
                        if (classes) inputOrSelect.className = classes;
                        sub.appendChild(inputOrSelect);
                        return sub;
                    };

                    const getUrlLabel = (index) => {
                        if (index === 0) return 'Dirección de entrega';
                        if (index === 1) return 'Dirección de recogido';
                        return 'Dirección alternativa';
                    };

                    const getUrlTipo = (index) => {
                        if (index === 0) return 'entrega';
                        if (index === 1) return 'recogido';
                        return 'alternativa';
                    };

                    const nombreInput = document.createElement('input');
                    nombreInput.type = 'text';
                    nombreInput.id = `${fieldId}-nombre`;
                    nombreInput.className = 'cotizador-nombre';
                    nombreInput.placeholder = 'Nombre del lugar a cotizar';

                    const tipoSelect = document.createElement('select');
                    tipoSelect.id = `${fieldId}-tipo`;
                    tipoSelect.className = 'cotizador-tipo';
                    const defaultTipo = document.createElement('option');
                    defaultTipo.value = '';
                    defaultTipo.textContent = 'Seleccione tipo...';
                    tipoSelect.appendChild(defaultTipo);
                    ['Circular', 'Lineal'].forEach(t => {
                        const op = document.createElement('option');
                        op.value = t;
                        op.textContent = t;
                        tipoSelect.appendChild(op);
                    });
                    tipoSelect.value = 'Circular';

                    const provinciaSelect = document.createElement('select');
                    provinciaSelect.id = `${fieldId}-provincia`;
                    provinciaSelect.className = 'cotizador-provincia';
                    const defaultProv = document.createElement('option');
                    defaultProv.value = '';
                    defaultProv.textContent = 'Seleccione una provincia...';
                    provinciaSelect.appendChild(defaultProv);
                    ['San José', 'Cartago', 'Heredia', 'Alajuela', 'Guanacaste', 'Puntarenas', 'Limón'].forEach(p => {
                        const op = document.createElement('option');
                        op.value = p;
                        op.textContent = p;
                        provinciaSelect.appendChild(op);
                    });

                    const urlsContainer = document.createElement('div');
                    urlsContainer.className = 'cotizador-urls';

                    const addUrlInput = (value = '', descripcion = '') => {
                        const index = urlsContainer.querySelectorAll('.cotizador-url-wrapper').length;
                        const wrapper = document.createElement('div');
                        wrapper.className = 'form-group cotizador-url-wrapper';
                        wrapper.style.marginBottom = '0.5rem';
                        const label = document.createElement('label');
                        label.textContent = getUrlLabel(index);
                        const urlInput = document.createElement('input');
                        urlInput.type = 'url';
                        urlInput.className = 'cotizador-url';
                        urlInput.placeholder = 'URL';
                        urlInput.value = value;
                        urlInput.dataset.tipo = getUrlTipo(index);
                        wrapper.appendChild(label);
                        wrapper.appendChild(urlInput);
                        if (index >= 2) {
                            const descLabel = document.createElement('label');
                            descLabel.textContent = 'Descripción';
                            descLabel.style.marginTop = '0.5rem';
                            const descInput = document.createElement('textarea');
                            descInput.className = 'cotizador-url-desc';
                            descInput.placeholder = 'Indique por qué es una dirección alternativa';
                            descInput.rows = 2;
                            descInput.value = descripcion;
                            wrapper.appendChild(descLabel);
                            wrapper.appendChild(descInput);
                        }
                        urlsContainer.appendChild(wrapper);
                    };

                    const addUrlBtn = document.createElement('button');
                    addUrlBtn.type = 'button';
                    addUrlBtn.className = 'btn btn-agregar-url';
                    addUrlBtn.textContent = 'Agregar URL';
                    addUrlBtn.addEventListener('click', () => {
                        if (tipoSelect.value !== 'Circular') addUrlInput();
                    });

                    const syncUrls = () => {
                        const isCircular = tipoSelect.value === 'Circular';
                        if (isCircular) {
                            const wrappers = urlsContainer.querySelectorAll('.cotizador-url-wrapper');
                            for (let i = wrappers.length - 1; i >= 1; i--) {
                                wrappers[i].remove();
                            }
                            if (urlsContainer.querySelectorAll('.cotizador-url-wrapper').length === 0) addUrlInput();
                            addUrlBtn.style.display = 'none';
                        } else {
                            addUrlBtn.style.display = 'inline-flex';
                            while (urlsContainer.querySelectorAll('.cotizador-url-wrapper').length < 2) addUrlInput();
                        }
                        urlsContainer.querySelectorAll('.cotizador-url-wrapper').forEach((w, i) => {
                            const lbl = w.querySelector('label');
                            if (lbl) lbl.textContent = getUrlLabel(i);
                            const input = w.querySelector('.cotizador-url');
                            if (input) input.dataset.tipo = getUrlTipo(i);
                        });
                    };

                    tipoSelect.addEventListener('change', syncUrls);
                    syncUrls();

                    const delBtn = document.createElement('button');
                    delBtn.type = 'button';
                    delBtn.className = 'btn-delete-field';
                    delBtn.setAttribute('aria-label', 'Eliminar campo');
                    delBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
                    delBtn.style.position = 'absolute';
                    delBtn.style.top = '0';
                    delBtn.style.right = '0';

                    formGroup.append(
                        createSubGroup('Nombre de la cotización', nombreInput, 'cotizador-nombre'),
                        createSubGroup('Tipo de caminata', tipoSelect, 'cotizador-tipo'),
                        createSubGroup('Provincia', provinciaSelect, 'cotizador-provincia'),
                        urlsContainer,
                        addUrlBtn,
                        delBtn
                    );
                    return formGroup;
                }
                case 'reconocimiento': {
                    formGroup.style.gridColumn = '1 / -1';
                    formGroup.style.display = 'grid';
                    formGroup.style.gridTemplateColumns = 'repeat(auto-fit, minmax(200px, 1fr))';
                    formGroup.style.gap = '1rem';

                    const createSubGroup = (label, inputOrSelect, classes = '') => {
                        const sub = document.createElement('div');
                        sub.className = 'form-group';
                        const subLabel = document.createElement('label');
                        subLabel.textContent = label;
                        if (inputOrSelect.id) subLabel.setAttribute('for', inputOrSelect.id);
                        sub.appendChild(subLabel);
                        if (classes) inputOrSelect.className = classes;
                        sub.appendChild(inputOrSelect);
                        return sub;
                    };

                    const etapasCCR = [
                        { num: 1, inicio: 'Barra de Parismina / Barra del Pacuare', fin: 'Goshen', distancia: '17', mas: '10', menos: '10', provincia: 'Limón', provincias: 'Limón' },
                        { num: 2, inicio: 'Goshen', fin: 'Cimarrones (Siquirres)', distancia: '22,6', mas: '104', menos: '84', provincia: 'Limón', provincias: 'Limón' },
                        { num: 3, inicio: 'Cimarrones', fin: 'Brisas de Pacuarito (Siquirres / Matina)', distancia: '17,7', mas: '803', menos: '271', provincia: 'Limón', provincias: 'Limón' },
                        { num: 4, inicio: 'Brisas de Pacuarito', fin: 'Tsiobata (Territorio Indígena Nairi Awari)', distancia: '12', mas: '710', menos: '530', provincia: 'Limón', provincias: 'Limón' },
                        { num: 5, inicio: 'Tsiobata', fin: 'Tres Equis (Turrialba - límite hacia Cartago)', distancia: '10,6', mas: '392', menos: '499', provincia: 'Limón', provincias: 'Limón' },
                        { num: 6, inicio: 'Tres Equis', fin: 'Pacayitas → La Suiza (Turrialba)', distancia: '20', mas: '395', menos: '714', provincia: 'Cartago', provincias: 'Cartago' },
                        { num: 7, inicio: 'La Suiza', fin: 'Pejibaye → El Copal (Jiménez)', distancia: '18,5', mas: '670', menos: '350', provincia: 'Cartago', provincias: 'Cartago' },
                        { num: 8, inicio: 'El Copal', fin: 'Humedal / Reserva Tapantí (Paraíso)', distancia: '14,7', mas: '1125', menos: '548', provincia: 'Cartago', provincias: 'Cartago' },
                        { num: 9, inicio: 'Tapantí', fin: 'Muñeco de Navarro (Orosi / Paraíso)', distancia: '14', mas: '908', menos: '943', provincia: 'Cartago', provincias: 'Cartago' },
                        { num: 10, inicio: 'Muñeco de Navarro', fin: 'Palo Verde (El Guarco)', distancia: '15,2', mas: '847', menos: '463', provincia: 'Cartago', provincias: 'Cartago' },
                        { num: 11, inicio: 'Palo Verde (El Guarco)', fin: 'El Empalme / Casa de Mata (Desamparados)', distancia: '14,5', mas: '990', menos: '469', provincia: 'San José', provincias: 'San José, Puntarenas' },
                        { num: 12, inicio: 'El Empalme', fin: 'San Pablo de León Cortés', distancia: '20,5', mas: '455', menos: '969', provincia: 'San José', provincias: 'San José' },
                        { num: 13, inicio: 'San Pablo de León Cortés', fin: 'Nápoles (Tarrazú)', distancia: '11,8', mas: '574', menos: '512', provincia: 'San José', provincias: 'San José' },
                        { num: 14, inicio: 'Nápoles', fin: 'Naranjillo (Dota / Tarrazú)', distancia: '12,8', mas: '479', menos: '1448', provincia: 'San José', provincias: 'San José' },
                        { num: 15, inicio: 'Naranjillo', fin: 'Esquipulas / Villa Nueva (Límite Quepos)', distancia: '23', mas: '739', menos: '1209', provincia: 'San José', provincias: 'San José, Puntarenas' },
                        { num: 16, inicio: 'Villa Nueva / Esquipulas', fin: 'Quepos / Manuel Antonio', distancia: '24,8', mas: '30', menos: '50', provincia: 'Puntarenas', provincias: 'Puntarenas' }
                    ];

                    const etapaSelect = document.createElement('select');
                    etapaSelect.id = `${fieldId}-etapa`;
                    etapaSelect.className = 'recon-etapa';
                    const defaultEtapa = document.createElement('option');
                    defaultEtapa.value = '';
                    defaultEtapa.textContent = 'Seleccione una etapa...';
                    etapaSelect.appendChild(defaultEtapa);

                    const truncEtapaText = (s) => s.length > 45 ? s.slice(0, 45) + '...' : s;

                    etapasCCR.forEach(({ num, inicio, fin, mas, menos, provincia, provincias }) => {
                        const option = document.createElement('option');
                        option.value = `Etapa ${num}: ${inicio} → ${fin}`;
                        option.textContent = truncEtapaText(option.value);
                        option.dataset.provincia = provincia;
                        option.dataset.provincias = provincias;
                        option.dataset.desnivelMas = mas;
                        option.dataset.desnivelMenos = menos;
                        etapaSelect.appendChild(option);

                        if (num === 1) {
                            const comb1 = document.createElement('option');
                            comb1.value = 'Etapas 1A y 1B: Barra de Parismina / Barra del Pacuare → Cimarrones (Siquirres)';
                            comb1.textContent = truncEtapaText(comb1.value);
                            comb1.dataset.provincia = 'Limón';
                            comb1.dataset.provincias = 'Limón';
                            comb1.dataset.desnivelMas = '';
                            comb1.dataset.desnivelMenos = '';
                            etapaSelect.appendChild(comb1);
                        } else if (num === 4) {
                            const comb4 = document.createElement('option');
                            comb4.value = 'Etapas 3 y 4: Brisas de Pacuarito → Tsiobata (Territorio Indígena Nairi Awari)';
                            comb4.textContent = truncEtapaText(comb4.value);
                            comb4.dataset.provincia = 'Limón';
                            comb4.dataset.provincias = 'Limón';
                            comb4.dataset.desnivelMas = '';
                            comb4.dataset.desnivelMenos = '';
                            etapaSelect.appendChild(comb4);
                        } else if (num === 15) {
                            const comb15 = document.createElement('option');
                            comb15.value = 'Etapas 14 y 15: Naranjillo → Villa Nueva (Límite Quepos)';
                            comb15.textContent = truncEtapaText(comb15.value);
                            comb15.dataset.provincia = 'San José';
                            comb15.dataset.provincias = 'San José, Puntarenas';
                            comb15.dataset.desnivelMas = '';
                            comb15.dataset.desnivelMenos = '';
                            etapaSelect.appendChild(comb15);
                        }
                    });

                    const etapaInfo = document.createElement('div');
                    etapaInfo.className = 'recon-etapa-info';
                    etapaInfo.style.cssText = 'font-size: 0.85rem; color: var(--color-texto); margin-top: 0.25rem;';
                    const etapaSubGroup = createSubGroup('Etapa del Camino de Costa Rica', etapaSelect, 'recon-etapa');
                    etapaSubGroup.style.display = 'none';
                    etapaSubGroup.appendChild(etapaInfo);

                    const actividad = document.createElement('select');
                    actividad.id = `${fieldId}-actividad`;
                    actividad.className = 'recon-actividad';
                    const defaultActividad = document.createElement('option');
                    defaultActividad.value = '';
                    defaultActividad.textContent = 'Seleccione una actividad...';
                    actividad.appendChild(defaultActividad);
                    ['Caminata', 'Parques Nacionales', 'El Camino de Costa Rica', 'Viaje Internacional', 'Paseo'].forEach(a => {
                        const op = document.createElement('option');
                        op.value = a;
                        op.textContent = a;
                        actividad.appendChild(op);
                    });

                    const parque = document.createElement('select');
                    parque.id = `${fieldId}-parque`;
                    parque.className = 'recon-parque';
                    const defaultParque = document.createElement('option');
                    defaultParque.value = '';
                    defaultParque.textContent = 'Seleccione un parque...';
                    parque.appendChild(defaultParque);
                    const sourceParque = document.getElementById('info-parque');
                    if (sourceParque) {
                        sourceParque.querySelectorAll('option').forEach(op => {
                            const cloned = op.cloneNode(true);
                            parque.appendChild(cloned);
                        });
                    }

                    const provinciasDiv = document.createElement('div');
                    provinciasDiv.id = `${fieldId}-parque-provincias`;
                    provinciasDiv.className = 'recon-parque-provincias';
                    provinciasDiv.style.cssText = 'font-size: 0.85rem; color: var(--color-texto); margin-top: 0.25rem;';

                    const parqueGroup = createSubGroup('Parque Nacional', parque, 'recon-parque');
                    parqueGroup.style.display = 'none';
                    parqueGroup.appendChild(provinciasDiv);

                    const provincia = document.createElement('select');
                    provincia.id = `${fieldId}-provincia`;
                    provincia.className = 'recon-provincia';
                    provincia.required = true;
                    const defaultProv = document.createElement('option');
                    defaultProv.value = '';
                    defaultProv.textContent = 'Seleccione una provincia...';
                    provincia.appendChild(defaultProv);
                    ['San José', 'Cartago', 'Heredia', 'Alajuela', 'Guanacaste', 'Puntarenas', 'Limón'].forEach(p => {
                        const op = document.createElement('option');
                        op.value = p;
                        op.textContent = p;
                        provincia.appendChild(op);
                    });

                    const dificultad = document.createElement('select');
                    dificultad.id = `${fieldId}-dificultad`;
                    dificultad.className = 'recon-dificultad';
                    ['Paseo básico', 'Intermedio', 'Intermedio moderado', 'Difícil avanzado'].forEach(d => {
                        const op = document.createElement('option');
                        op.value = d;
                        op.textContent = d;
                        dificultad.appendChild(op);
                    });

                    const distancia = document.createElement('input');
                    distancia.type = 'text';
                    distancia.id = `${fieldId}-distancia`;
                    distancia.className = 'recon-distancia';
                    distancia.setAttribute('inputmode', 'numeric');
                    distancia.setAttribute('pattern', '[0-9]*');

                    formGroup.append(
                        createSubGroup('Actividad', actividad, 'recon-actividad'),
                        etapaSubGroup,
                        parqueGroup,
                        createSubGroup('Provincia', provincia, 'recon-provincia'),
                        createSubGroup('Dificultad', dificultad, 'recon-dificultad'),
                        createSubGroup('Distancia (km)', distancia, 'recon-distancia')
                    );

                    const delBtn = document.createElement('button');
                    delBtn.type = 'button';
                    delBtn.className = 'btn-delete-field';
                    delBtn.setAttribute('aria-label', 'Eliminar campo');
                    delBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
                    delBtn.style.position = 'absolute';
                    delBtn.style.top = '0';
                    delBtn.style.right = '0';
                    formGroup.appendChild(delBtn);

                    actividad.addEventListener('change', () => {
                        const isParques = actividad.value === 'Parques Nacionales';
                        const isCCR = actividad.value === 'El Camino de Costa Rica';
                        parqueGroup.style.display = isParques ? 'block' : 'none';
                        etapaSubGroup.style.display = isCCR ? 'block' : 'none';
                        if (!isParques) {
                            parque.value = '';
                            provinciasDiv.textContent = '';
                        }
                        if (!isCCR) {
                            etapaSelect.value = '';
                            etapaInfo.textContent = '';
                        }
                        updatePagoVisibility(formGroup.closest('.item-card'));
                        updateEventInfoVisibility();
                        saveDraft();
                    });

                    parque.addEventListener('change', () => {
                        const selected = parque.selectedOptions[0];
                        if (selected && selected.value) {
                            eventoNombre.value = selected.value;
                            if (provincia.value === '') {
                                provincia.value = selected.dataset.provincia || '';
                            }
                            const allProvincias = [];
                            const selValue = selected.value;
                            parque.querySelectorAll('option').forEach(opt => {
                                if (opt.value === selValue && opt.dataset.provincia) {
                                    allProvincias.push(opt.dataset.provincia);
                                }
                            });
                            const unique = [...new Set(allProvincias)];
                            provinciasDiv.textContent = unique.length ? 'Provincias: ' + unique.join(', ') : '';
                        } else {
                            provinciasDiv.textContent = '';
                        }
                        saveDraft();
                    });

                    const setProvincia = (valor) => {
                        if (!valor) return;
                        let opt = Array.from(provincia.options).find(o => o.value === valor);
                        if (!opt) {
                            opt = document.createElement('option');
                            opt.value = valor;
                            opt.textContent = valor;
                            provincia.appendChild(opt);
                        }
                        provincia.value = valor;
                    };

                    etapaSelect.addEventListener('change', () => {
                        const selected = etapaSelect.selectedOptions[0];
                        if (selected && selected.value) {
                            const prov = selected.dataset.provincias || selected.dataset.provincia || '';
                            setProvincia(prov);
                            eventoNombre.value = selected.value;
                            if (selected.value.startsWith('Etapas')) {
                                etapaInfo.textContent = `${selected.value} | Provincia(s): ${prov}`;
                            } else if (selected.value.startsWith('Etapa ')) {
                                etapaInfo.textContent = `Provincia(s): ${prov} | Desnivel +: ${selected.dataset.desnivelMas || ''} m | Desnivel -: ${selected.dataset.desnivelMenos || ''} m`;
                            }
                        } else {
                            etapaInfo.textContent = '';
                        }
                        saveDraft();
                    });

                    distancia.addEventListener('input', () => updateDificultadFromDistancia(distancia));

                    formGroup.querySelectorAll('input, select').forEach(el => {
                        el.addEventListener('input', saveDraft);
                        el.addEventListener('change', saveDraft);
                    });

                    updatePagoVisibility(formGroup.closest('.item-card'));
                    updateEventInfoVisibility();
                    saveDraft();
                    return formGroup;
                }

                case 'informacion': {
                    formGroup.style.gridColumn = '1 / -1';
                    formGroup.style.display = 'grid';
                    formGroup.style.gridTemplateColumns = 'repeat(auto-fit, minmax(200px, 1fr))';
                    formGroup.style.gap = '1rem';

                    const createSubGroup = (label, inputOrSelect, classes = '') => {
                        const sub = document.createElement('div');
                        sub.className = 'form-group';
                        const subLabel = document.createElement('label');
                        subLabel.textContent = label;
                        if (inputOrSelect.id) subLabel.setAttribute('for', inputOrSelect.id);
                        sub.appendChild(subLabel);
                        if (classes) inputOrSelect.className = classes;
                        sub.appendChild(inputOrSelect);
                        return sub;
                    };

                    const provincia = document.createElement('select');
                    provincia.id = `${fieldId}-provincia`;
                    provincia.className = 'info-provincia';
                    const defaultProv = document.createElement('option');
                    defaultProv.value = '';
                    defaultProv.textContent = 'Seleccione una provincia...';
                    provincia.appendChild(defaultProv);
                    ['San José', 'Cartago', 'Heredia', 'Alajuela', 'Guanacaste', 'Puntarenas', 'Limón'].forEach(p => {
                        const op = document.createElement('option');
                        op.value = p;
                        op.textContent = p;
                        provincia.appendChild(op);
                    });

                    const dificultad = document.createElement('select');
                    dificultad.id = `${fieldId}-dificultad`;
                    dificultad.className = 'info-dificultad';
                    ['Paseo básico', 'Intermedio', 'Intermedio moderado', 'Difícil avanzado'].forEach(d => {
                        const op = document.createElement('option');
                        op.value = d;
                        op.textContent = d;
                        dificultad.appendChild(op);
                    });

                    const distancia = document.createElement('input');
                    distancia.type = 'text';
                    distancia.id = `${fieldId}-distancia`;
                    distancia.className = 'info-distancia';
                    distancia.setAttribute('inputmode', 'numeric');
                    distancia.setAttribute('pattern', '[0-9]*');

                    const actividad = document.createElement('select');
                    actividad.id = `${fieldId}-actividad`;
                    actividad.className = 'info-actividad';
                    ['Caminata', 'Parques Nacionales', 'El Camino de Costa Rica', 'Viaje Internacional', 'Paseo'].forEach(a => {
                        const op = document.createElement('option');
                        op.value = a;
                        op.textContent = a;
                        actividad.appendChild(op);
                    });

                    const delBtn = document.createElement('button');
                    delBtn.type = 'button';
                    delBtn.className = 'btn-delete-field';
                    delBtn.setAttribute('aria-label', 'Eliminar campo');
                    delBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
                    delBtn.style.position = 'absolute';
                    delBtn.style.top = '0';
                    delBtn.style.right = '0';

                    formGroup.append(
                        createSubGroup('Actividad', actividad, 'info-actividad'),
                        createSubGroup('Provincia', provincia, 'info-provincia'),
                        createSubGroup('Dificultad', dificultad, 'info-dificultad'),
                        createSubGroup('Distancia (km)', distancia, 'info-distancia'),
                        delBtn
                    );

                    distancia.addEventListener('input', (e) => {
                        e.target.value = e.target.value.replace(/[^0-9]/g, '');
                        updateDificultadFromDistancia(e.target);
                    });

                    formGroup.querySelectorAll('input, select').forEach(el => {
                        el.addEventListener('input', saveDraft);
                        el.addEventListener('change', saveDraft);
                    });

                    updatePagoVisibility(formGroup.closest('.item-card'));
                    updateEventInfoVisibility();
                    saveDraft();
                    return formGroup;
                }

                default:
                    return null;
            }

            const label = document.createElement('label');
            label.setAttribute('for', fieldId);
            label.textContent = labelText;
            inputElement.id = fieldId;
            formGroup.append(label, inputElement);
            formGroup.innerHTML += deleteButton;

            return formGroup;
        }


        document.body.addEventListener('change', (e) => {
            const fieldSelector = e.target.matches('.field-selector');
            const priceTypeSelector = e.target.matches('.price-type-selector');
            const airlineSelector = e.target.matches('.airline-selector');

            if (fieldSelector) {
                const select = e.target;
                const fieldName = select.value;
                const cardId = select.dataset.cardId;
                if (!fieldName || !cardId) return;
                const card = document.getElementById(cardId);
                if (card) {
                    const container = card.querySelector('.dynamic-fields-container');
                    const newFieldElement = createFieldElement(fieldName, cardId);
                    if (newFieldElement) {
                        container.appendChild(newFieldElement);
                        const optionToDisable = select.querySelector(`option[value="${fieldName}"]`);
                        if (optionToDisable) optionToDisable.disabled = true;
                        select.value = '';
                        updatePagoVisibility(card);
                        updateEventInfoVisibility();
                        updateTotals(card.querySelector('input'));
                    }
                }
            }
            if (priceTypeSelector) {
                updatePriceFields(e.target);
            }
            if (airlineSelector) {
                const selectedAirline = e.target.value;
                const infoDisplay = e.target.closest('.form-group').querySelector('.airline-info-display');
                if (infoDisplay) {
                    infoDisplay.textContent = airlinesData[selectedAirline] || '';
                }
            }
            if (e.target.matches('.provincia-selector')) {
                const card = e.target.closest('.item-card');
                updatePagoVisibility(card);
            }
            saveDraft();
        });

        document.body.addEventListener('input', (e) => {
            const card = e.target.closest('.item-card');
            if (card) {
                updateTotals(e.target);
            } else {
                calculateGrandTotal('transporte-nacional-list');
            }
            saveDraft();
        });
        
        const globalCalculationFields = [eventoPrecio, eventoCapacidadCG, eventoCapacidadSG, tipoCambioInput];
        globalCalculationFields.forEach(field => {
            if (field) field.addEventListener('input', () => {
                updateAllTotals();
            });
        });

        function updatePriceFields(selectElement, shouldUpdateTotals = true) {
            const itemCard = selectElement.closest('.item-card');
            const priceSection = itemCard.querySelector('.price-section');
            const uniqueId = itemCard.id;
            const currencySymbol = currentCurrency === 'CRC' ? '₡' : '$';
            if (selectElement.value === 'persona') {
                priceSection.innerHTML = `<div class="price-details-container"><div class="form-group"><label for="precio-persona-${uniqueId}">Precio p/p</label><input type="number" id="precio-persona-${uniqueId}" class="item-price-per-person" min="0" value="0"></div><div class="total-display"><strong>TOTAL:</strong> <span class="total-amount">${currencySymbol}0</span></div></div>`;
            } else {
                priceSection.innerHTML = `<div class="price-details-container"><div class="form-group"><label for="precio-grupal-${uniqueId}">Precio Grupal</label><input type="number" id="precio-grupal-${uniqueId}" class="item-price-grupal" min="0" value="0"></div><div class="grupal-total-formula"><strong>TOTAL:</strong> <span class="grupal-amount">${currencySymbol}0</span></div></div>`;
            }
            togglePriceVisibility(itemCard);
            if (shouldUpdateTotals) {
                updateTotals(selectElement);
            }
        }
        
        function calculateBaseTotal(card, type) {
            if (card.querySelector('[data-field-name="cotizador"]')) return 0;
            const capacidadCG = parseFloat(eventoCapacidadCG?.value) || 0;
            const capacidadSG = parseFloat(eventoCapacidadSG?.value) || 0;
            const airlineField = card.querySelector('[data-field-name="aerolinea"]');

            if (capacidadSG === 0) return 0;

            if (airlineField) {
                let totalAerolineaCalculado = 0;
                card.querySelectorAll('.airline-price').forEach(input => {
                    totalAerolineaCalculado += parseFloat(input.value) || 0;
                });
                return totalAerolineaCalculado * capacidadCG / capacidadSG;
            }
            
            let precio = 0;
            if (type === 'persona') {
                precio = parseFloat(card.querySelector('.item-price-per-person')?.value) || 0;
                return precio * capacidadCG / capacidadSG;
            } else { // grupal
                precio = parseFloat(card.querySelector('.item-price-grupal')?.value) || 0;
                return precio / (capacidadSG || 1);
            }
        }

        function formatCurrency(amount,currency=currentCurrency){const symbol=currency==='CRC'?'₡':'$';const value=Math.round(amount);return`${symbol}${value.toLocaleString('es-CR')}`;}

        function updateTotals(element) {
            setTimeout(renderTablaResumenPagos,0);
            const card = element.closest('.item-card');
            if (!card) return;

            togglePriceVisibility(card); 

            const priceType = card.querySelector('.price-type-selector').value;
            const baseTotal = calculateBaseTotal(card, priceType);
            const cantidadInput = card.querySelector('.item-quantity');
            
            const totalDisplay = card.querySelector('.total-display, .grupal-total-formula');
            const totalSpan = card.querySelector('.total-amount, .grupal-amount');
            
            let finalTotal = baseTotal;
            let label = "TOTAL:";

            if (cantidadInput) {
                const cantidad = parseFloat(cantidadInput.value) || 1;
                finalTotal = baseTotal * cantidad;
                label = "TOTAL X CANTIDAD:";
            }

            if(totalDisplay && totalSpan) {
                totalDisplay.querySelector('strong').textContent = label;
                totalSpan.textContent = formatCurrency(finalTotal);
            }
            
            const summaryContainer = card.querySelector('.collapsed-summary');
            if (summaryContainer) {
                const tipoGasto = card.querySelector('.item-tipo-gasto')?.value;
                const nombre = tipoGasto && tipoGasto !== 'Otros' ? tipoGasto : card.querySelector('.item-nombre').value || tipoGasto || 'Sin Nombre';
                summaryContainer.innerHTML = '<div class="total-display" style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0;"><strong style="min-width:0;overflow-wrap:anywhere;"></strong><span style="flex-shrink:0;"></span></div>';
                summaryContainer.querySelector('strong').textContent = nombre;
                summaryContainer.querySelector('span').textContent = formatCurrency(finalTotal);
            }
            
            const category = card.parentElement.id;
            calculateGrandTotal(category, card);
        }

        function calculateGrandTotal(category, triggerCard = null) {
            if(!category)return;
            const list=document.getElementById(category);
            const categoryName='nacionales';
            const totalContainer=document.getElementById(`grand-total-${categoryName}`);
            const diferenciaContainer=document.getElementById(`diferencia-${categoryName}`);
            const diferenciaGeneralContainer=document.getElementById(`diferencia-general-${categoryName}`);
            
            const totalRecogerContainer = document.getElementById('total-por-recoger');
            const totalRecogerCrcContainer = document.getElementById('total-por-recoger-crc');
            const totalRecogerCrcWrapper = document.getElementById('total-por-recoger-crc-wrapper');

            if (!list || !totalContainer || !diferenciaContainer || !diferenciaGeneralContainer) return;

            let grandTotal = 0;
            list.querySelectorAll('.item-card').forEach(card => {
                const baseTotal = calculateBaseTotal(card, card.querySelector('.price-type-selector').value);
                const cantidadInput = card.querySelector('.item-quantity');
                grandTotal += (cantidadInput) ? (baseTotal * (parseFloat(cantidadInput.value) || 1)) : baseTotal;
            });

            const precioDelEvento = parseFloat(eventoPrecio.value) || 0;
            const capacidadCG = parseFloat(eventoCapacidadCG.value) || 0;
            const capacidadSG = parseFloat(eventoCapacidadSG.value) || 0; 
            
            const totalPorRecoger = precioDelEvento * capacidadSG;
            const diferencia = precioDelEvento - grandTotal;
            // Excedente General = Excedente P.P × capacidad SG
            const diferenciaGeneral = diferencia * capacidadSG;

            if (totalRecogerContainer) {
                totalRecogerContainer.textContent = formatCurrency(totalPorRecoger);
            }

            totalContainer.textContent = formatCurrency(grandTotal);
            diferenciaContainer.textContent = formatCurrency(diferencia);
            diferenciaGeneralContainer.textContent = formatCurrency(diferenciaGeneral);

            diferenciaContainer.classList.toggle('text-danger', diferencia < 0);
            diferenciaGeneralContainer.classList.toggle('text-danger', diferenciaGeneral < 0);

            // === Rediseño tarjetas de totales (fórmulas intactas) ===
            if(!document.getElementById('totcards-css')){
                const stc=document.createElement('style');stc.id='totcards-css';
                stc.textContent='.totcard{background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:10px 12px;margin:0 0 14px;box-shadow:0 1px 4px rgba(0,0,0,.05);}'+
                '.totcard .total-display{border:none;margin:0;padding:0;display:flex;justify-content:space-between;align-items:baseline;}'+
                '.totcard .total-display strong{font-size:78%;letter-spacing:.6px;text-transform:uppercase;color:#9a8a7a;font-weight:600;}'+
                '.totcard .total-display span{font-size:1.35rem;font-weight:800;color:var(--color-primario,#f97316);}'+
                '.totcard .totform{font-size:60%;color:#adb5bd;text-align:left;margin-top:4px;padding:0;line-height:1;opacity:.8;}';
                document.head.appendChild(stc);
            }
            const mkCard=(td,formId)=>{
                const disp=td?.parentElement;if(!disp)return null;
                let card=disp.closest('.totcard');
                if(!card){card=document.createElement('div');card.className='totcard';disp.before(card);card.appendChild(disp);}
                let f=document.getElementById(formId);
                if(formId&&!f){f=document.createElement('div');f.id=formId;f.className='totform';card.appendChild(f);}
                return f;
            };
            const formulaTR=mkCard(totalRecogerContainer,'formula-total-recoger');
            if(formulaTR)formulaTR.textContent=formatCurrency(precioDelEvento)+' × '+capacidadSG+' = '+formatCurrency(totalPorRecoger);
            mkCard(totalContainer,null);
            const formulaPP=mkCard(diferenciaContainer,'formula-excedente-pp');
            if(formulaPP)formulaPP.textContent=formatCurrency(precioDelEvento)+' − '+formatCurrency(grandTotal)+' = '+formatCurrency(diferencia);
            const formulaGen=mkCard(diferenciaGeneralContainer,'formula-excedente-general');
            if(formulaGen)formulaGen.textContent=formatCurrency(diferencia)+' × '+capacidadSG+' = '+formatCurrency(diferenciaGeneral);

            // ---> NUEVO: Actualizar el mini excedente debajo de Precio del Evento <---
            const miniExcedenteDisplay = document.getElementById('mini-excedente-display');
            const miniExcedenteWrapper = document.getElementById('mini-excedente-wrapper');
            if (miniExcedenteDisplay && miniExcedenteWrapper) {
                miniExcedenteDisplay.textContent = formatCurrency(diferenciaGeneral);
                miniExcedenteWrapper.style.color = diferenciaGeneral < 0 ? 'var(--color-error)' : 'var(--color-exito)';
            }

            const tipoCambio = parseFloat(tipoCambioInput.value) || 1;
            if (currentCurrency === 'USD') {
                totalConversionDisplay.textContent = formatCurrency(precioDelEvento * tipoCambio, 'CRC');
                grandTotalNacionalesCrc.textContent = formatCurrency(grandTotal * tipoCambio, 'CRC');
                diferenciaNacionalesCrc.textContent = formatCurrency(diferencia * tipoCambio, 'CRC');
                diferenciaGeneralNacionalesCrc.textContent = formatCurrency(diferenciaGeneral * tipoCambio, 'CRC');
                
                if (totalRecogerCrcContainer) {
                    totalRecogerCrcContainer.textContent = formatCurrency(totalPorRecoger * tipoCambio, 'CRC');
                }
                if (totalRecogerCrcWrapper) totalRecogerCrcWrapper.style.display = 'block';
                
                diferenciaNacionalesCrc.parentElement.classList.toggle('text-danger', diferencia * tipoCambio < 0);
                diferenciaGeneralNacionalesCrc.parentElement.classList.toggle('text-danger', diferenciaGeneral * tipoCambio < 0);

                crcConversionWrappers.forEach(wrapper => {
                    if(wrapper.id !== 'total-por-recoger-crc-wrapper') wrapper.style.display = 'block';
                });
            } else { 
                totalConversionDisplay.textContent = formatCurrency(precioDelEvento / tipoCambio, 'USD');
                crcConversionWrappers.forEach(wrapper => wrapper.style.display = 'none');
                if (totalRecogerCrcWrapper) totalRecogerCrcWrapper.style.display = 'none';
            }
            
            // Lógica combinada de alerta visual
            if (diferencia < 0) {
                if (alertaPerdidaHabilitada) {
                    showLossWarningModal();
                } else {
                    let shouldAlert = false;
                    if (triggerCard) {
                        const localBtn = triggerCard.querySelector('.local-alert-btn');
                        if (localBtn && localBtn.dataset.alert === 'true') {
                            shouldAlert = true;
                        }
                    } else {
                        const anyLocalAlertOn = Array.from(list.querySelectorAll('.local-alert-btn')).some(btn => btn.dataset.alert === 'true');
                        if (anyLocalAlertOn) shouldAlert = true;
                    }

                    if (shouldAlert) {
                        showLossWarningModal();
                    }
                }
            }
        }

        function updateAllTotals() {
            document.querySelectorAll('.item-card').forEach(card => {
                updateTotals(card.querySelector('input'));
            });
            calculateGrandTotal('transporte-nacional-list');
            renderTablaResumenPagos();
        }

        function getMontoFromCard(card) {
            const span = card.querySelector('.total-amount, .grupal-amount');
            if (!span) return 0;
            const text = span.textContent.replace(/[^0-9]/g, '');
            return parseFloat(text) || 0;
        }

        function sortPagoItems(order) {
            const list = document.getElementById('transporte-nacional-list');
            if (!list) return;
            const cards = Array.from(list.querySelectorAll('.item-card'));
            cards.sort((a, b) => {
                if (order.startsWith('nombre')) {
                    const nameA = (a.querySelector('.item-nombre')?.value || '').toLowerCase();
                    const nameB = (b.querySelector('.item-nombre')?.value || '').toLowerCase();
                    return nameA.localeCompare(nameB);
                }
                const totalA = getMontoFromCard(a);
                const totalB = getMontoFromCard(b);
                return totalA - totalB;
            });
            if (order.endsWith('desc')) cards.reverse();
            cards.forEach(card => list.appendChild(card));
            calculateGrandTotal('transporte-nacional-list');
        }

        function sortSavedEvents(order) {
            if (!order || order === 'default' || !allEventsCache) return;
            const sorted = [...allEventsCache];
            sorted.sort((a, b) => {
                if (order.startsWith('nombre')) {
                    const nameA = (a.nombre || '').toLowerCase();
                    const nameB = (b.nombre || '').toLowerCase();
                    return nameA.localeCompare(nameB);
                }
                if (order.startsWith('monto')) {
                    const montoA = parseFloat(a.precio) || 0;
                    const montoB = parseFloat(b.precio) || 0;
                    return montoA - montoB;
                }
                return 0;
            });
            if (order.endsWith('desc')) sorted.reverse();
            renderEventosGuardados(sorted);
        }

        function toggleAllEventAccordions(expand) {
            document.querySelectorAll('.provincia-accordion').forEach(detail => { detail.open = expand; });
        }

        function updateSortOptionText(select, value, text) {
            const option = select.querySelector(`option[value="${value}"]`);
            if (option) {
                option.textContent = text;
            }
        }

        const sortPagosSelect = document.getElementById('sort-pagos');
        if (sortPagosSelect) {
            sortPagosSelect.addEventListener('change', (e) => {
                const order = e.target.value;
                if (order === 'expandir') {
                    toggleAllEventAccordions(true);
                    e.target.value = 'colapsar';
                    updateSortOptionText(e.target, 'colapsar', 'Ocultar tarjetas');
                } else if (order === 'colapsar') {
                    toggleAllEventAccordions(false);
                    e.target.value = 'expandir';
                    updateSortOptionText(e.target, 'expandir', 'Expandir todas las tarjetas');
                } else {
                    sortSavedEvents(order);
                }
            });
        }
        
        // --- LÓGICA DE MODALES ---
        const notificationModal = document.getElementById('notification-modal');
        function showNotification(message) {
            notificationModal.querySelector('#notification-message').textContent = message;
            notificationModal.classList.add('visible');
        }
        notificationModal.querySelector('#notification-accept-btn').addEventListener('click', () => notificationModal.classList.remove('visible'));

        function showLossWarningModal() {
            lossWarningModal.classList.add('visible');
        }
        lossWarningCloseBtn.addEventListener('click', () => lossWarningModal.classList.remove('visible'));

        let deleteAction = null; 
        let addAction = null;

        function openDeleteModal(message, onConfirm) {
            deleteConfirmMessage.textContent = message;
            deleteAction = onConfirm;
            deleteConfirmModal.classList.add('visible');
        }

        function closeDeleteModal() {
            deleteConfirmModal.classList.remove('visible');
            deleteAction = null;
        }

        deleteCancelBtn.addEventListener('click', closeDeleteModal);
        deleteConfirmBtn.addEventListener('click', () => {
            if (deleteAction) {
                deleteAction();
            }
            closeDeleteModal();
        });

        function openAddModal(onConfirm) {
            addAction = onConfirm;
            addConfirmModal.classList.add('visible');
        }

        function closeAddModal() {
            addConfirmModal.classList.remove('visible');
            addAction = null;
        }
        addCancelBtn.addEventListener('click', closeAddModal);
        addConfirmBtn.addEventListener('click', () => {
            if (addAction) {
                addAction();
            }
            closeAddModal();
        });

        // Eventos Tarjeta Viaje
        tarjetaViajeCloseBtn.addEventListener('click', () => {
            tarjetaViajeModal.classList.remove('visible');
        });

        tarjetaViajePrintBtn.addEventListener('click', () => {
            const printContent = document.getElementById('exportable-travel-card').cloneNode(true);
            const printWindow = window.open('', '_blank');
            
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Imprimir Tarjeta de Viaje</title>
                    <style>
                        body { 
                            margin: 0; 
                            padding: 40px; 
                            font-family: Arial, sans-serif; 
                            display: flex; 
                            justify-content: center;
                        }
                        @media print { 
                            body { margin: 0; padding: 0; } 
                            /* Asegurar que se impriman los colores de fondo */
                            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        }
                    </style>
                </head>
                <body>
                    ${printContent.outerHTML}
                </body>
                </html>
            `);
            
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);
        });

        tarjetaViajeDownloadBtn.addEventListener('click', () => {
            const cardElement = document.getElementById('exportable-travel-card');
            if (!cardElement) return;
            
            html2canvas(cardElement, {
                scale: 2, 
                useCORS: true,
                backgroundColor: null 
            }).then(canvas => {
                const link = document.createElement('a');
                link.download = `tarjeta_viaje_${Date.now()}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
                showNotification('Tarjeta de Viaje exportada exitosamente');
            }).catch(error => {
                console.error('Error al exportar la tarjeta:', error);
                showNotification('Hubo un error al exportar la tarjeta. Inténtalo de nuevo.');
            });
        });

        tarjetaViajeWhatsappBtn.addEventListener('click', () => {
            if (!currentWhatsAppText) return;
            
            const encodedText = encodeURIComponent(currentWhatsAppText);
            const whatsappUrl = `https://wa.me/?text=${encodedText}`;
            
            // Intenta usar el Web Share API si está en móvil
            if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
                navigator.share({
                    text: currentWhatsAppText
                }).catch((error) => {
                    console.log('Error compartiendo, usando enlace alternativo', error);
                    window.open(whatsappUrl, '_blank');
                });
            } else {
                window.open(whatsappUrl, '_blank');
            }
        });

        // --- EXPORTAR A EXCEL TODOS LOS EVENTOS ---
        exportExcelBtn.addEventListener('click', () => {
            if (allEventsCache.length === 0) {
                showNotification('No hay eventos guardados para exportar.');
                return;
            }

            let table = `<table border="1">
                <thead>
                    <tr>
                        <th style="background-color:#8d6e63;color:white;font-weight:bold;">Nombre del Evento</th>
                        <th style="background-color:#8d6e63;color:white;font-weight:bold;">Moneda</th>
                        <th style="background-color:#8d6e63;color:white;font-weight:bold;">Precio Base</th>
                        <th style="background-color:#8d6e63;color:white;font-weight:bold;">Capacidad C/G</th>
                        <th style="background-color:#8d6e63;color:white;font-weight:bold;">Capacidad S/G</th>
                        <th style="background-color:#8d6e63;color:white;font-weight:bold;">Total Costos</th>
                        <th style="background-color:#8d6e63;color:white;font-weight:bold;">Excedente P.P</th>
                        <th style="background-color:#8d6e63;color:white;font-weight:bold;">Excedente General</th>
                    </tr>
                </thead>
                <tbody>`;

            let granExcedenteTotalCRC = 0;
            let granExcedenteTotalUSD = 0;

            allEventsCache.forEach(evento => {
                let granTotalCostos = 0;
                const capacidadCG = parseFloat(evento.capacidadCG) || 0;
                const capacidadSG = parseFloat(evento.capacidadSG) || 1;
                const precioDelEvento = parseFloat(evento.precio) || 0;

                if (evento.pagos && evento.pagos.length > 0) {
                    evento.pagos.forEach(pago => {
                        let precioUnitario = 0;
                        if (pago.tipoPrecio === 'persona') {
                            precioUnitario = (parseFloat(pago.precioPersona) || 0) * capacidadCG / capacidadSG;
                        } else {
                            precioUnitario = (parseFloat(pago.precioGrupal) || 0) / capacidadSG;
                        }
                        const cantidad = (pago.dynamicFields && pago.dynamicFields.cantidad) ? parseFloat(pago.dynamicFields.cantidad) : 1;
                        granTotalCostos += (precioUnitario * cantidad);
                    });
                }

                const diferencia = precioDelEvento - granTotalCostos;
                const diferenciaGeneral = diferencia * capacidadSG;

                if (evento.moneda === 'CRC') granExcedenteTotalCRC += diferenciaGeneral;
                else granExcedenteTotalUSD += diferenciaGeneral;

                table += `<tr>
                    <td>${evento.nombre}</td>
                    <td style="text-align:center;">${evento.moneda}</td>
                    <td style="text-align:right;">${precioDelEvento.toFixed(2)}</td>
                    <td style="text-align:center;">${capacidadCG}</td>
                    <td style="text-align:center;">${capacidadSG}</td>
                    <td style="text-align:right;">${granTotalCostos.toFixed(2)}</td>
                    <td style="text-align:right;">${diferencia.toFixed(2)}</td>
                    <td style="text-align:right; font-weight:bold; color:${diferenciaGeneral < 0 ? 'red' : 'green'}">${diferenciaGeneral.toFixed(2)}</td>
                </tr>`;
            });

            table += `<tr><td colspan="8"></td></tr>`;
            
            // Fila Total CRC
            table += `<tr>
                <td colspan="7" style="text-align:right;font-weight:bold;font-size:1.1em;">GRAN EXCEDENTE TOTAL GLOBAL (CRC):</td>
                <td style="text-align:right;font-weight:bold;font-size:1.1em;color:${granExcedenteTotalCRC < 0 ? 'red' : 'green'}">₡${granExcedenteTotalCRC.toFixed(2)}</td>
            </tr>`;
            // Fila Total USD
            table += `<tr>
                <td colspan="7" style="text-align:right;font-weight:bold;font-size:1.1em;">GRAN EXCEDENTE TOTAL GLOBAL (USD):</td>
                <td style="text-align:right;font-weight:bold;font-size:1.1em;color:${granExcedenteTotalUSD < 0 ? 'red' : 'green'}">$${granExcedenteTotalUSD.toFixed(2)}</td>
            </tr>`;

            table += `</tbody></table>`;

            // Construir HTML para el archivo .xls
            const htmlExcel = `
                <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
                <head>
                    <meta charset="UTF-8">
                    <!--[if gte mso 9]>
                    <xml>
                        <x:ExcelWorkbook>
                            <x:ExcelWorksheets>
                                <x:ExcelWorksheet>
                                    <x:Name>Eventos</x:Name>
                                    <x:WorksheetOptions>
                                        <x:DisplayGridlines/>
                                    </x:WorksheetOptions>
                                </x:ExcelWorksheet>
                            </x:ExcelWorksheets>
                        </x:ExcelWorkbook>
                    </xml>
                    <![endif]-->
                </head>
                <body>
                    ${table}
                </body>
                </html>
            `;

            const blob = new Blob([htmlExcel], { type: 'application/vnd.ms-excel' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Reporte_Eventos_JyK_${new Date().toISOString().slice(0, 10)}.xls`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showNotification('Reporte Excel descargado exitosamente.');
        });

        // --- NUEVA LÓGICA: TARJETA DE RESUMEN GLOBAL ---
        const generarResumenBtn = document.getElementById('generar-resumen-btn');
        const tarjetaResumenModal = document.getElementById('tarjeta-resumen-modal');
        const tarjetaResumenCloseBtn = document.getElementById('tarjeta-resumen-close-btn');
        const tarjetaResumenRenderArea = document.getElementById('tarjeta-resumen-render-area');
        const tarjetaResumenDownloadBtn = document.getElementById('tarjeta-resumen-download-btn');

        if (generarResumenBtn) {
            generarResumenBtn.addEventListener('click', () => {
                let totalEventos = allEventsCache.length;
                
                let excedenteCRC = 0;
                let excedenteUSD = 0;

                // Calcular rentabilidad global sumada
                allEventsCache.forEach(evento => {
                    let granTotalCostos = 0;
                    const capacidadCG = parseFloat(evento.capacidadCG) || 0;
                    const capacidadSG = parseFloat(evento.capacidadSG) || 1;
                    const precioDelEvento = parseFloat(evento.precio) || 0;

                    if (evento.pagos && evento.pagos.length > 0) {
                        evento.pagos.forEach(pago => {
                            let precioUnitario = 0;
                            if (pago.tipoPrecio === 'persona') {
                                precioUnitario = (parseFloat(pago.precioPersona) || 0) * capacidadCG / capacidadSG;
                            } else {
                                precioUnitario = (parseFloat(pago.precioGrupal) || 0) / capacidadSG;
                            }
                            const cantidad = (pago.dynamicFields && pago.dynamicFields.cantidad) ? parseFloat(pago.dynamicFields.cantidad) : 1;
                            granTotalCostos += (precioUnitario * cantidad);
                        });
                    }

                    const diferencia = precioDelEvento - granTotalCostos;
                    const diferenciaGeneral = diferencia * capacidadSG;

                    if (evento.moneda === 'CRC') {
                        excedenteCRC += diferenciaGeneral;
                    } else {
                        excedenteUSD += diferenciaGeneral;
                    }
                });

                const colorCRC = excedenteCRC < 0 ? 'var(--color-error)' : 'var(--color-exito)';

                const cardHTML = `
                    <div id="exportable-resumen-card" style="background-color: var(--color-blanco); color: var(--color-texto); width: 100%; max-width: 450px; padding: 30px; border-radius: 16px; border: 2px solid var(--color-primario); font-family: sans-serif; box-sizing: border-box; position: relative; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                        <div style="position: absolute; top: -30px; left: -30px; width: 120px; height: 120px; background-color: var(--color-primario); opacity: 0.15; border-radius: 50%;"></div>
                        <div style="position: absolute; bottom: -40px; right: -40px; width: 160px; height: 160px; background-color: var(--color-acento); opacity: 0.15; border-radius: 50%;"></div>
                        
                        <div style="position: relative; z-index: 2;">
                            <h2 style="text-align: center; color: var(--color-primario); margin: 0 0 5px 0; font-size: 1.6rem; text-transform: uppercase;">Resumen Global</h2>
                            <p style="text-align: center; margin: 0 0 25px 0; font-size: 0.9rem; opacity: 0.8;">Gestión de Pagos JyK</p>
                            
                            <div style="display: grid; grid-template-columns: 1fr; gap: 15px; margin-bottom: 25px;">
                                <div style="background-color: var(--color-fondo); border: 1px solid var(--color-secundario); padding: 15px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
                                    <div style="font-size: 2rem; font-weight: bold; color: var(--color-primario); line-height: 1;">${totalEventos}</div>
                                    <div style="font-size: 0.85rem; font-weight: 600; margin-top: 5px;">Eventos<br>Registrados</div>
                                </div>
                            </div>

                            <h3 style="color: var(--color-primario); margin: 0 0 10px 0; font-size: 1.1rem; border-bottom: 2px solid var(--color-secundario); padding-bottom: 5px;">Rentabilidad Acumulada</h3>
                            <div style="background: var(--color-fondo); padding: 15px; border-radius: 12px; border: 1px solid var(--color-secundario);">
                                <div style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 5px;">
                                    <strong style="font-size: 0.9rem;">Total Excedente (CRC):</strong>
                                    <span style="color: ${colorCRC}; font-weight: bold; font-size: 1.2rem; flex-grow: 1; text-align: right;">${formatCurrency(excedenteCRC, 'CRC')}</span>
                                </div>
                            </div>

                            <div style="text-align: center; margin-top: 30px; font-size: 0.75rem; opacity: 0.6; border-top: 1px solid var(--color-secundario); padding-top: 15px;">
                                Generado el ${new Date().toLocaleDateString('es-CR')} a las ${new Date().toLocaleTimeString('es-CR')}
                            </div>
                        </div>
                    </div>
                `;

                tarjetaResumenRenderArea.innerHTML = cardHTML;
                tarjetaResumenModal.classList.add('visible');
            });

            tarjetaResumenCloseBtn.addEventListener('click', () => {
                tarjetaResumenModal.classList.remove('visible');
            });

            tarjetaResumenDownloadBtn.addEventListener('click', () => {
                const cardElement = document.getElementById('exportable-resumen-card');
                if (!cardElement) return;
                
                html2canvas(cardElement, {
                    scale: 2, 
                    useCORS: true,
                    backgroundColor: null 
                }).then(canvas => {
                    const link = document.createElement('a');
                    link.download = `resumen_global_${Date.now()}.png`;
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                    showNotification('Resumen exportado exitosamente');
                }).catch(error => {
                    console.error('Error al exportar el resumen:', error);
                    showNotification('Hubo un error al exportar la tarjeta. Inténtalo de nuevo.');
                });
            });
        }


        // --- LÓGICA DE LISTA DE PRECIOS DE TRANSPORTE ---
        const btnListaTransportes = document.getElementById('btn-lista-transportes');
        const listaTransportes = document.getElementById('transporte-precios-lista');

        function renderListaPreciosTransporte() {
            if (!listaTransportes) return;
            let rows = [];
            allEventsCache.forEach(evento => {
                if (!evento.pagos) return;
                evento.pagos.forEach(pago => {
                    const nombrePago = (pago.nombre || '').trim().toLowerCase();
                    if (!['transavi', 'transporte'].includes(nombrePago)) return;

                    const tipoTexto = pago.tipoPrecio === 'persona'
                        ? 'Precio por Persona'
                        : (pago.tipoPrecio === 'grupal' ? 'Precio Grupal' : '');
                    const precio = pago.tipoPrecio === 'grupal'
                        ? (pago.precioGrupal || '')
                        : (pago.precioPersona || '');
                    rows.push({
                        actividad: evento.nombre,
                        transporte: pago.nombre,
                        precio: precio,
                        tipo: tipoTexto
                    });
                });
            });

            if (rows.length === 0) {
                listaTransportes.innerHTML = '<p style="text-align:center; color: var(--color-texto);">No hay transportes registrados.</p>';
                return;
            }

            let html = '<div style="display: grid; gap: 0.75rem;">';
            rows.forEach(row => {
                html += `
                    <div style="background-color: var(--color-fondo); border: 1px solid var(--color-secundario); border-radius: 8px; padding: 0.75rem;">
                        <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
                            <strong style="color: var(--color-primario);">${row.actividad}</strong>
                            <span>${row.precio}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.25rem; font-size: 0.9rem;">
                            <span>${row.tipo}</span>
                            <span>Transporte: ${row.transporte}</span>
                        </div>
                    </div>
                `;
            });
            html += '</div>';

            const textoLista = 'Lista de precios de transporte:\n\n' + rows.map(row => {
                return 'Actividad: ' + row.actividad + '\nTransporte: ' + row.transporte + '\nPrecio: ' + row.precio + '\nTipo: ' + row.tipo;
            }).join('\n--------------------\n');

            html += `
                <div style="display: flex; gap: 0.75rem; justify-content: center; margin-top: 1rem; flex-wrap: wrap;">
                    <button class="btn btn-success" id="btn-wa-lista-transporte">Enviar por WhatsApp</button>
                    <button class="btn btn-primary" id="btn-txt-lista-transporte">Descargar TXT</button>
                </div>
            `;

            listaTransportes.innerHTML = html;

            const btnWa = document.getElementById('btn-wa-lista-transporte');
            if (btnWa) {
                btnWa.addEventListener('click', (e) => {
                    e.stopPropagation();
                    window.open('https://wa.me/?text=' + encodeURIComponent(textoLista), '_blank');
                });
            }

            const btnTxt = document.getElementById('btn-txt-lista-transporte');
            if (btnTxt) {
                btnTxt.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const blob = new Blob([textoLista], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'lista_precios_transporte.txt';
                    a.click();
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                });
            }
        }

        if (btnListaTransportes && listaTransportes) {
            btnListaTransportes.addEventListener('click', () => {
                renderListaPreciosTransporte();
                listaTransportes.style.display = listaTransportes.style.display === 'none' ? 'block' : 'none';
            });
        }


        // --- LÓGICA DE CONFIRMACIÓN DE EDICIÓN ---
        function startEditConfirmation(id) {
            eventToLoadId = id;
            editConfirmMessage.textContent = '¿Estás seguro de que deseas editar este evento? (Se reemplazará la información actual en pantalla)';
            editConfirmModal.classList.add('visible');
        }

        editConfirmBtn.addEventListener('click', () => {
            editConfirmModal.classList.remove('visible');
            if (eventToLoadId !== null) {
                loadEventData(eventToLoadId);
                eventToLoadId = null;
            }
        });

        editCancelBtn.addEventListener('click', () => {
            editConfirmModal.classList.remove('visible');
            eventToLoadId = null;
        });

        function renderTarjetaViaje(evento) {
            if (!evento) return;

            let granTotal = 0;
                const capacidadCG = parseFloat(evento.capacidadCG) || 0;
                const capacidadSG = parseFloat(evento.capacidadSG) || 1;
                const precioDelEvento = parseFloat(evento.precio) || 0;

                let pagosHTML = '';
                let pagosParaWhatsApp = []; // Array para construir el texto de WA

                if (evento.pagos && evento.pagos.length > 0) {
                    evento.pagos.forEach(pago => {
                        let precioUnitario = 0;
                        let precioBaseMostrar = 0;
                        let etiquetaBase = '';

                        if (pago.tipoPrecio === 'persona') {
                            precioBaseMostrar = parseFloat(pago.precioPersona) || 0;
                            etiquetaBase = 'P/P';
                            precioUnitario = precioBaseMostrar * capacidadCG / capacidadSG;
                        } else {
                            precioBaseMostrar = parseFloat(pago.precioGrupal) || 0;
                            etiquetaBase = 'Grupal';
                            precioUnitario = precioBaseMostrar / capacidadSG;
                        }
                        
                        const cantidad = (pago.dynamicFields && pago.dynamicFields.cantidad) ? parseFloat(pago.dynamicFields.cantidad) : 1;
                        const totalPago = precioUnitario * cantidad;
                        granTotal += totalPago;

                        const precioBaseFormateado = formatCurrency(precioBaseMostrar, evento.moneda);
                        const totalPagoFormateado = formatCurrency(totalPago, evento.moneda);

                        // Agregamos al HTML de la tarjeta visual
                        // SE APLICÓ LA CORRECCIÓN DE FLEX-WRAP AQUÍ
                        pagosHTML += `
                            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 5px; border-bottom: 1px dashed var(--color-secundario); padding: 8px 0; font-size: 0.95rem;">
                                <span style="font-weight: 500; flex: 1 1 min-content; word-break: break-word; min-width: 60%;">${pago.nombre} ${cantidad > 1 ? `(x${cantidad})` : ''}</span>
                                <div style="display: flex; align-items: center; gap: 8px; text-align: right; flex: 1 0 auto; justify-content: flex-end;">
                                    <span style="font-size: 0.75rem; opacity: 0.6; white-space: nowrap;">(${etiquetaBase} ${precioBaseFormateado})</span>
                                    <span style="font-weight: bold; white-space: nowrap;">${totalPagoFormateado}</span>
                                </div>
                            </div>
                        `;

                        // Agregamos al Array para WhatsApp
                        pagosParaWhatsApp.push({
                            nombre: pago.nombre,
                            cantidad: cantidad,
                            etiquetaBase: etiquetaBase,
                            precioBaseStr: precioBaseFormateado,
                            totalPagoStr: totalPagoFormateado
                        });
                    });
                } else {
                    pagosHTML = '<div style="text-align: center; opacity: 0.8; padding: 10px;">No hay pagos registrados</div>';
                }

                const diferencia = precioDelEvento - granTotal;
                const diferenciaGeneral = diferencia * capacidadSG;
                const totalPorRecoger = precioDelEvento * capacidadSG;

                // Color dinámico según rentabilidad
                const colorDiferencia = diferencia < 0 ? '#e57373' : '#81c784';
                const colorDiferenciaG = diferenciaGeneral < 0 ? '#e57373' : '#81c784';

                // ============================================
                // GENERADOR DE TEXTO PARA WHATSAPP (FACTURA)
                // ============================================
                currentWhatsAppText = `🎫 *TARJETA DE VIAJE* 🎫\n\n`;
                currentWhatsAppText += `*Evento:* ${evento.nombre}\n`;
                currentWhatsAppText += `*Precio Base:* ${formatCurrency(precioDelEvento, evento.moneda)}\n`;
                currentWhatsAppText += `*Moneda:* ${evento.moneda}\n`;
                currentWhatsAppText += `*Capacidad:* ${evento.capacidadCG} C/G | ${evento.capacidadSG} S/G\n`;
                currentWhatsAppText += `\n*📋 DESGLOSE DE COSTOS:*\n`;
                currentWhatsAppText += `------------------------\n`;
                
                if (pagosParaWhatsApp.length > 0) {
                    pagosParaWhatsApp.forEach(p => {
                        currentWhatsAppText += `• ${p.nombre} ${p.cantidad > 1 ? `(x${p.cantidad})` : ''}\n`;
                        currentWhatsAppText += `  _(${p.etiquetaBase} ${p.precioBaseStr})_ ➡️ *${p.totalPagoStr}*\n`;
                    });
                } else {
                    currentWhatsAppText += `  _Sin pagos registrados_\n`;
                }
                currentWhatsAppText += `------------------------\n`;
                currentWhatsAppText += `\n*📊 RENTABILIDAD Y TOTALES:*\n`;
                currentWhatsAppText += `*TOTAL A RECOGER:* ${formatCurrency(totalPorRecoger, evento.moneda)}\n`;
                currentWhatsAppText += `*TOTAL COSTOS P.P:* ${formatCurrency(granTotal, evento.moneda)}\n`;
                currentWhatsAppText += `*EXCEDENTE P.P:* ${formatCurrency(diferencia, evento.moneda)}\n`;
                currentWhatsAppText += `*EXCEDENTE GENERAL:* ${formatCurrency(diferenciaGeneral, evento.moneda)}\n`;
                currentWhatsAppText += `\n_Generado automáticamente por Gestión de Pagos JyK_`;

                // ============================================
                // GENERADOR HTML DE LA TARJETA VISUAL
                // ============================================
                const cardHTML = `
                    <div id="exportable-travel-card" style="background-color: var(--color-fondo); color: var(--color-texto); width: 100%; max-width: 450px; padding: 25px; border-radius: 16px; border: 2px solid var(--color-primario); font-family: sans-serif; box-sizing: border-box; position: relative; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                        
                        <!-- Elementos de Decoración Visual -->
                        <div style="position: absolute; top: -30px; right: -30px; width: 120px; height: 120px; background-color: var(--color-primario); opacity: 0.15; border-radius: 50%;"></div>
                        <div style="position: absolute; bottom: -40px; left: -40px; width: 160px; height: 160px; background-color: var(--color-acento); opacity: 0.15; border-radius: 50%;"></div>
                        
                        <div style="position: relative; z-index: 2;">
                            <h2 style="text-align: center; color: var(--color-primario); margin: 0 0 5px 0; font-size: 1.6rem; text-transform: uppercase;">${evento.nombre}</h2>
                            <p style="text-align: center; margin: 0 0 20px 0; font-size: 0.9rem; opacity: 0.8;">Resumen Detallado de Viaje</p>
                            
                            <!-- Sección Resumen Principal -->
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: var(--color-blanco); padding: 15px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); font-size: 0.9rem;">
                                <div><strong>Precio Base:</strong><br/>${formatCurrency(precioDelEvento, evento.moneda)}</div>
                                <div><strong>Moneda:</strong><br/>${evento.moneda}</div>
                                <div><strong>Capacidad C/G:</strong><br/>${evento.capacidadCG} pax</div>
                                <div><strong>Capacidad S/G:</strong><br/>${evento.capacidadSG} pax</div>
                            </div>

                            <!-- Desglose de Pagos -->
                            <h3 style="color: var(--color-primario); margin: 0 0 10px 0; font-size: 1.1rem; border-bottom: 2px solid var(--color-secundario); padding-bottom: 5px;">Desglose de Costos</h3>
                            <div style="background: var(--color-blanco); padding: 10px 15px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                                ${pagosHTML}
                            </div>

                            <!-- Totales Finales -->
                            <h3 style="color: var(--color-primario); margin: 0 0 10px 0; font-size: 1.1rem; border-bottom: 2px solid var(--color-secundario); padding-bottom: 5px;">Rentabilidad y Totales</h3>
                            <div style="background: var(--color-blanco); padding: 15px; border-radius: 12px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                    <strong>TOTAL A RECOGER:</strong>
                                    <span style="font-weight: bold;">${formatCurrency(totalPorRecoger, evento.moneda)}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                    <strong>TOTAL COSTOS P.P:</strong>
                                    <span style="font-weight: bold;">${formatCurrency(granTotal, evento.moneda)}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                    <strong>EXCEDENTE P.P:</strong>
                                    <span style="color: ${colorDiferencia}; font-weight: bold;">${formatCurrency(diferencia, evento.moneda)}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--color-secundario); padding-top: 8px; margin-top: 8px;">
                                    <strong>EXCEDENTE GENERAL:</strong>
                                    <span style="color: ${colorDiferenciaG}; font-weight: bold; font-size: 1.2rem;">${formatCurrency(diferenciaGeneral, evento.moneda)}</span>
                                </div>
                            </div>
                            
                            <!-- Footer de tarjeta -->
                            <div style="text-align: center; margin-top: 20px; font-size: 0.75rem; opacity: 0.6;">
                                Generado el ${new Date().toLocaleDateString('es-CR')} a las ${new Date().toLocaleTimeString('es-CR')}
                            </div>
                        </div>
                    </div>
                `;

                tarjetaViajeRenderArea.innerHTML = cardHTML;
                tarjetaViajeModal.classList.add('visible');
        }

        function showTarjetaViaje(id) {
            db.transaction(['eventos'], 'readonly').objectStore('eventos').get(id).onsuccess = (e) => {
                const evento = e.target.result;
                if (!evento) return;
                renderTarjetaViaje(evento);
            };
        }

        function previewTarjetaViaje() {
            const nombre = eventoNombre.value.trim();
            if (!nombre) {
                showNotification('Por favor, ingresa un nombre para el evento antes de previsualizar.');
                return;
            }
            const pagos = [];
            document.querySelectorAll('#transporte-nacional-list .item-card').forEach(card => {
                pagos.push(getPagoDataFromCard(card));
            });
            const evento = {
                nombre,
                precio: eventoPrecio.value,
                capacidadCG: eventoCapacidadCG.value,
                capacidadSG: eventoCapacidadSG.value,
                tipoCambio: tipoCambioInput.value,
                moneda: currentCurrency,
                pagos
            };
            renderTarjetaViaje(evento);
        }

        const _ptb=document.getElementById('preview-tarjeta-btn'); if(_ptb) _ptb.addEventListener('click', previewTarjetaViaje);

        // --- LÓGICA DE TEMAS ---
        const themes = ['theme-sepia', 'theme-dark'];
        
        function applyTheme(theme) {
            document.body.className = theme;
            localStorage.setItem('theme', theme);
            const themeColor = getComputedStyle(document.body).getPropertyValue('--color-primario').trim();
            document.querySelector('meta[name="theme-color"]').setAttribute('content', themeColor);
        }

        function populateThemeSelector() {
            const themeGrid = document.getElementById('theme-selector-grid');
            themes.forEach(themeClass => {
                const swatch = document.createElement('div');
                swatch.className = `theme-swatch ${themeClass}`;
                swatch.dataset.theme = themeClass;
                const tempDiv = document.createElement('div');
                tempDiv.style.display = 'none';
                tempDiv.className = themeClass;
                document.body.appendChild(tempDiv);
                const color = getComputedStyle(tempDiv).getPropertyValue('--color-primario');
                document.body.removeChild(tempDiv);
                swatch.style.backgroundColor = color;
                
                themeGrid.appendChild(swatch);
            });
            
            themeGrid.addEventListener('click', (e) => {
                if (e.target.classList.contains('theme-swatch')) {
                    applyTheme(e.target.dataset.theme);
                }
            });
        }

        // --- LÓGICA DE EVENTOS (GUARDAR/CARGAR/BORRAR) ---
        
        function limpiarFormularioNuevo(mostrarNotificacion = true) {
            currentEventId = null;
            eventoNombre.value = '';
            eventoPrecio.value = '0';
            eventoCapacidadCG.value = '0';
            eventoCapacidadSG.value = '0';
            document.getElementById('transporte-nacional-list').innerHTML = '';
            updateAllTotals();
            clearDraft();
            document.querySelector('.tab-link[data-tab="nacionales"]').click();
            if (mostrarNotificacion) {
                showNotification('Formulario limpiado. Listo para un nuevo evento.');
            }
        }

        nuevoEventoBtn.addEventListener('click', () => {
            if (hasUnsavedChanges()) {
                showNuevoConfirmModal();
            } else {
                limpiarFormularioNuevo();
            }
        });

        const nuevoConfirmModal = document.getElementById('nuevo-confirm-modal');
        const nuevoConfirmSaveBtn = document.getElementById('nuevo-confirm-save-btn');
        const nuevoConfirmDiscardBtn = document.getElementById('nuevo-confirm-discard-btn');

        function showNuevoConfirmModal() {
            nuevoConfirmModal.classList.add('visible');
        }

        nuevoConfirmSaveBtn.addEventListener('click', () => {
            pendingNuevoEvento = true;
            nuevoConfirmModal.classList.remove('visible');
            guardarEventoBtn.click();
        });

        nuevoConfirmDiscardBtn.addEventListener('click', () => {
            nuevoConfirmModal.classList.remove('visible');
            limpiarFormularioNuevo();
        });

        function getPagoDataFromCard(card) {
            const pago = {
                nombre: card.querySelector('.item-nombre')?.value || '',
                alertaLocal: card.querySelector('.local-alert-btn')?.dataset.alert === 'true',
                provincia: '',
                reconocimiento: false,
                dynamicFields: {}
            };

            pago.tipoPrecio = card.querySelector('.price-type-selector')?.value || 'persona';
            pago.precioPersona = card.querySelector('.item-price-per-person')?.value || '0';
            pago.precioGrupal = card.querySelector('.item-price-grupal')?.value || '0';

            card.querySelectorAll('.dynamic-fields-container > .form-group').forEach(group => {
                const fieldName = group.dataset.fieldName;
                if (!fieldName) return;

                if (fieldName === 'aerolinea') {
                    const airlineData = { nombre: group.querySelector('.airline-selector')?.value || '' };
                    group.querySelectorAll('.airline-price').forEach(priceInput => {
                        const key = priceInput.id.replace(`aerolinea-${card.id}-`, '').replace(/-/g, '_');
                        airlineData[key] = priceInput.value;
                    });
                    pago.dynamicFields.aerolinea = airlineData;
                } else if (fieldName === 'reconocimiento') {
                    pago.reconocimiento = true;
                    const actividad = group.querySelector('.recon-actividad')?.value || '';
                    const parqueNacional = group.querySelector('.recon-parque')?.value || '';
                    const provincia = group.querySelector('.recon-provincia')?.value || '';
                    const dificultad = group.querySelector('.recon-dificultad')?.value || '';
                    const distancia = group.querySelector('.recon-distancia')?.value || '';
                    const etapa = group.querySelector('.recon-etapa')?.value || '';
                    pago.provincia = provincia;
                    pago.dynamicFields.reconocimiento = { actividad, parqueNacional, provincia, dificultad, distancia, etapa };
                } else if (fieldName === 'informacion') {
                    const provincia = group.querySelector('.info-provincia')?.value || '';
                    const dificultad = group.querySelector('.info-dificultad')?.value || '';
                    const distancia = group.querySelector('.info-distancia')?.value || '';
                    const actividad = group.querySelector('.info-actividad')?.value || '';
                    pago.provincia = provincia;
                    pago.dynamicFields.informacion = { provincia, dificultad, distancia, actividad };
                } else if (fieldName === 'cotizador') {
                    const nombre = group.querySelector('.cotizador-nombre')?.value || '';
                    const tipoCaminata = group.querySelector('.cotizador-tipo')?.value || '';
                    const provincia = group.querySelector('.cotizador-provincia')?.value || '';
                    const urls = [];
                    group.querySelectorAll('.cotizador-url-wrapper').forEach((wrapper, i) => {
                        const urlInput = wrapper.querySelector('.cotizador-url');
                        const descInput = wrapper.querySelector('.cotizador-url-desc');
                        const url = urlInput ? urlInput.value.trim() : '';
                        const descripcion = descInput ? descInput.value.trim() : '';
                        let tipo = 'entrega';
                        if (i === 1) tipo = 'recogido';
                        else if (i >= 2) tipo = 'alternativa';
                        urls.push({ url, descripcion, tipo });
                    });
                    pago.nombre = nombre;
                    pago.provincia = provincia;
                    pago.dynamicFields.cotizador = { nombre, tipoCaminata, provincia, urls };
                } else {
                    const input = group.querySelector('input, select, textarea');
                    if (input) pago.dynamicFields[fieldName] = input.value;
                }
            });
            return pago;
        }

        guardarEventoBtn.addEventListener('click', () => {
            let nombre = eventoNombre.value.trim();

            // Conjunto de claves de reconocimientos ya guardados para evitar duplicados
            const reconKeysExistentes = new Set();
            allEventsCache.forEach(ev => {
                if (currentEventId && ev.id === currentEventId) return;
                (ev.pagos || []).forEach(p => {
                    if (p.reconocimiento) {
                        const dr = p.dynamicFields && p.dynamicFields.reconocimiento;
                        const actividad = dr ? dr.actividad : p.provincia;
                        const etapa = dr ? dr.etapa : '';
                        const parque = dr ? dr.parqueNacional : '';
                        const key = [actividad, etapa, parque].filter(Boolean).join('|');
                        reconKeysExistentes.add(key);
                    }
                });
            });

            const pagosOriginales = [];
            document.querySelectorAll('#transporte-nacional-list .item-card').forEach(card => {
                pagosOriginales.push(getPagoDataFromCard(card));
            });

            const pagos = [];
            const nuevoReconKeys = new Set();
            pagosOriginales.forEach(pago => {
                if (pago.reconocimiento) {
                    const dr = pago.dynamicFields && pago.dynamicFields.reconocimiento;
                    const actividad = dr ? dr.actividad : pago.provincia;
                    const etapa = dr ? dr.etapa : '';
                    const parque = dr ? dr.parqueNacional : '';
                    const key = [actividad, etapa, parque].filter(Boolean).join('|');
                    if (reconKeysExistentes.has(key) || nuevoReconKeys.has(key)) {
                        showNotification(`Ya existe un reconocimiento para ${actividad}${etapa ? ' - ' + etapa : parque ? ' - ' + parque : ''}.`);
                        return;
                    }
                    nuevoReconKeys.add(key);
                }
                pagos.push(pago);
            });

            if (pagos.length === 0) {
                showNotification('No hay pagos válidos para guardar.');
                pendingNuevoEvento = false;
                return;
            }

            if (!nombre && pagos.length > 0) {
                const pagoCoti = pagos.find(p => p.dynamicFields?.cotizador?.nombre || p.dynamicFields?.cotizador);
                if (pagoCoti) {
                    const coti = typeof pagoCoti.dynamicFields.cotizador === 'object' ? pagoCoti.dynamicFields.cotizador : {};
                    nombre = coti.nombre || pagoCoti.nombre || '';
                }
            }
            if (!nombre) {
                nombre = pagos[0]?.nombre || '';
            }
            if (!nombre) {
                showNotification('Por favor, ingresa un nombre para el evento antes de guardar.');
                pendingNuevoEvento = false;
                return;
            }

            // Evitar duplicar eventos con reconocimiento por nombre
            const tieneReconocimiento = pagos.some(p => p.reconocimiento);
            if (tieneReconocimiento) {
                const existeReconConMismoNombre = allEventsCache.some(ev =>
                    ev.nombre === nombre &&
                    ev.id !== currentEventId &&
                    (ev.pagos || []).some(p => p.reconocimiento)
                );
                if (existeReconConMismoNombre) {
                    showNotification(`Ya existe un evento con reconocimientos bajo el nombre "${nombre}".`);
                    pendingNuevoEvento = false;
                    return;
                }
            }

            const evento = {
                nombre,
                precio: eventoPrecio.value,
                capacidadCG: eventoCapacidadCG.value,
                capacidadSG: eventoCapacidadSG.value,
                tipoCambio: tipoCambioInput.value,
                moneda: currentCurrency,
                pagos
            };

            const transaction = db.transaction(['eventos'], 'readwrite');
            const store = transaction.objectStore('eventos');
            if (currentEventId) evento.id = currentEventId;

            const request = currentEventId ? store.put(evento) : store.add(evento);

            request.onsuccess = () => {
                showNotification(`Evento "${nombre}" guardado exitosamente.`);
                loadEvents();
                const tieneCotizador = evento.pagos.some(p => p.dynamicFields && p.dynamicFields.cotizador);
                if (tieneCotizador) {
                    document.querySelector('.tab-link[data-tab=guardados]')?.click();
                    document.querySelectorAll('#tab-guardados details').forEach(d => d.open = false);
                    const cotizacionesAccordion = document.getElementById('cotizaciones-accordion');
                    if (cotizacionesAccordion) {
                        cotizacionesAccordion.open = true;
                        setTimeout(() => cotizacionesAccordion.scrollIntoView({ behavior: 'smooth' }), 0);
                    }
                }
                if (!currentEventId) currentEventId = request.result;
                clearDraft();
                if (pendingNuevoEvento) {
                    pendingNuevoEvento = false;
                    limpiarFormularioNuevo(false);
                }
            };
            request.onerror = (e) => {
                showNotification('Error al guardar el evento.');
                console.error('Error al guardar:', e.target.error);
                pendingNuevoEvento = false;
            };
        });

        function deleteEvent(id) {
            openDeleteModal('¿Estás seguro de que deseas eliminar este evento guardado?', () => {
                const transaction = db.transaction(['eventos'], 'readwrite');
                transaction.objectStore('eventos').delete(id).onsuccess = () => {
                    showNotification('Evento eliminado.');
                    loadEvents(); 
                };
            });
        }

        // --- LÓGICA DE BÚSQUEDA Y RENDERIZADO ---
        
        function renderEventosGuardados(events) {
            eventosGuardadosList.innerHTML = '';
            
            if (events.length === 0) {
                eventosGuardadosList.innerHTML = '<p style="color:var(--color-texto); width:100%; text-align:center;">No se encontraron eventos.</p>';
                return;
            }

            const provinciasOrder = ['San José', 'Cartago', 'Heredia', 'Alajuela', 'Guanacaste', 'Puntarenas', 'Limón'];
            const groups = {};
            events.forEach(evento => {
                const pagoConProvincia = (evento.pagos || []).find(p => p.provincia);
                const prov = (pagoConProvincia && pagoConProvincia.provincia) ? pagoConProvincia.provincia : 'Sin provincia';
                if (!groups[prov]) groups[prov] = [];
                groups[prov].push(evento);
            });

            const sortedProvinces = Object.keys(groups).sort((a, b) => {
                if (a === 'Sin provincia') return 1;
                if (b === 'Sin provincia') return -1;
                const idxA = provinciasOrder.indexOf(a);
                const idxB = provinciasOrder.indexOf(b);
                if (idxA === -1) return 1;
                if (idxB === -1) return -1;
                return idxA - idxB;
            });

            sortedProvinces.forEach(prov => {
                // HR + nombre de la provincia, sin cuadros anidados
                const hr = document.createElement('hr');
                hr.style.cssText = 'margin: 0.9rem 0 0.3rem; border: 0; border-top: 1px solid var(--color-secundario);';
                eventosGuardadosList.appendChild(hr);
                const h = document.createElement('div');
                h.style.cssText = 'font-weight: bold; color: var(--color-primario); margin-bottom: 0.4rem; font-size: 1rem;';
                h.textContent = prov;
                eventosGuardadosList.appendChild(h);

                // lista plana numerada — reinicia en 1 por provincia
                groups[prov].forEach((evento, idx) => {
                    const capacidadCG = parseFloat(evento.capacidadCG) || 0;
                    const capacidadSG = parseFloat(evento.capacidadSG) || 1;
                    const precioDelEvento = parseFloat(evento.precio) || 0;
                    let granTotal = 0;
                    if (evento.pagos) {
                        evento.pagos.forEach(pago => {
                            let baseTotal = 0;
                            if (pago.tipoPrecio === 'persona') {
                                baseTotal = (parseFloat(pago.precioPersona) || 0) * capacidadCG / capacidadSG;
                            } else {
                                baseTotal = (parseFloat(pago.precioGrupal) || 0) / capacidadSG;
                            }
                            const cantidad = (pago.dynamicFields && pago.dynamicFields.cantidad) ? parseFloat(pago.dynamicFields.cantidad) : 1;
                            granTotal += baseTotal * cantidad;
                        });
                    }
                    const ganancia = (precioDelEvento - granTotal) * capacidadSG;

                    const btn = document.createElement('div');
                    btn.className = 'evento-guardado-row';
                    btn.dataset.eventId = evento.id;
                    btn.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:0.35rem 0;border-bottom:1px solid #f0f0f0;cursor:pointer;';
                    btn.innerHTML = `
                        <div>
                            <strong>${idx + 1}. ${evento.nombre}</strong>
                            <small style="display:block;color:var(--color-exito);margin-top:2px;">PRECIO: ${formatCurrency(precioDelEvento, evento.moneda)} | EXCEDENTE: ${formatCurrency(ganancia, evento.moneda)}</small>
                        </div>
                        <div style="display:flex;gap:0.5rem;">
                            <button class="btn-tarjeta-evento" data-event-id="${evento.id}" aria-label="Ver Tarjeta de Viaje">
                                <svg viewBox="0 0 24 24"><path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zm-10-7h9v6h-9z"/></svg>
                            </button>
                            <button class="btn-delete-evento" data-event-id="${evento.id}" aria-label="Eliminar Evento">
                                <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                            </button>
                        </div>`;

                    btn.addEventListener('click', (e) => {
                        if (e.target.closest('.btn-delete-evento')) {
                            e.stopPropagation();
                            confirmarEliminacion(() => deleteEvent(evento.id), 'Evento');
                        } else if (e.target.closest('.btn-tarjeta-evento')) {
                            e.stopPropagation();
                            showTarjetaViaje(evento.id);
                        } else {
                            loadEventData(evento.id);
                        }
                    });

                    eventosGuardadosList.appendChild(btn);
                });
            });


        }

        function renderReconocimientosGuardados(events) {
            reconocimientosGuardadosList.innerHTML = '';

            const etapasCombinadasCCR = [
                { key: 'Etapas 1A y 1B: Barra de Parismina / Barra del Pacuare → Cimarrones (Siquirres)', despuesDe: 1 },
                { key: 'Etapas 3 y 4: Brisas de Pacuarito → Tsiobata (Territorio Indígena Nairi Awari)', despuesDe: 4 },
                { key: 'Etapas 14 y 15: Naranjillo → Villa Nueva (Límite Quepos)', despuesDe: 15 }
            ];

            let recCount = 0;
            const etapas = {};
            const etapasCombinadas = {};
            const sinEtapa = [];
            const otros = {};

            events.forEach(evento => {
                if (evento.pagos) {
                    evento.pagos.forEach((pago, pIndex) => {
                        if (pago.reconocimiento) {
                            recCount++;
                            const rec = pago.dynamicFields && pago.dynamicFields.reconocimiento ? pago.dynamicFields.reconocimiento : {};
                            const item = { evento, pIndex, pago, rec };
                            if (rec.actividad === 'El Camino de Costa Rica') {
                                if (rec.etapa && rec.etapa.startsWith('Etapas')) {
                                    const key = rec.etapa;
                                    if (!etapasCombinadas[key]) etapasCombinadas[key] = [];
                                    etapasCombinadas[key].push(item);
                                } else {
                                    const m = rec.etapa ? rec.etapa.match(/Etapa (\d+)/) : null;
                                    if (m) {
                                        const n = parseInt(m[1], 10);
                                        if (!etapas[n]) etapas[n] = [];
                                        etapas[n].push(item);
                                    } else {
                                        sinEtapa.push(item);
                                    }
                                }
                            } else {
                                const key = rec.actividad || rec.nombre || 'Otro';
                                if (!otros[key]) otros[key] = [];
                                otros[key].push(item);
                            }
                        }
                    });
                }
            });

            if (recCount === 0) {
                reconocimientosGuardadosList.innerHTML = '<p style="color:var(--color-texto); width:100%; text-align:center;">No hay reconocimientos registrados.</p>';
                return;
            }

            const crearAcordeon = (titulo, items) => {
                const details = document.createElement('details');
                details.className = 'provincia-accordion';
                details.style.cssText = 'margin-bottom: 1rem; border: 1px solid var(--color-secundario); border-radius: var(--borde-radio); overflow: hidden;';
                details.open = false;

                const summary = document.createElement('summary');
                summary.textContent = titulo;
                summary.style.cssText = 'background-color: var(--color-secundario); color: var(--color-primario); padding: 0.8rem 1rem; font-weight: bold; cursor: pointer; outline: none;';
                details.appendChild(summary);

                const content = document.createElement('div');
                content.style.cssText = 'padding: 0.5rem 1rem; background-color: var(--color-blanco);';

                items.forEach(({ rec, evento, pIndex }) => {
                    const item = document.createElement('div');
                    item.className = 'rec-item';
                    item.style.cssText = 'border-bottom: 1px solid var(--color-secundario); padding: 0.75rem 0; margin-bottom: 0.5rem;';
                    const etapa = rec.etapa || rec.parqueNacional || '—';
                    const detalle = `
                        ${rec.actividad ? `<div><strong>Actividad:</strong> ${rec.actividad}</div>` : ''}
                        <div><strong>${rec.actividad === 'El Camino de Costa Rica' ? 'Etapa' : 'Lugar'}:</strong> ${etapa}</div>
                        ${rec.provincia ? `<div><strong>Provincia:</strong> ${rec.provincia}</div>` : ''}
                        ${rec.dificultad ? `<div><strong>Dificultad:</strong> ${rec.dificultad}</div>` : ''}
                        ${rec.distancia ? `<div><strong>Distancia:</strong> ${rec.distancia} km</div>` : ''}
                    `;
                    item.innerHTML = `
                        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
                            <div>${detalle}</div>
                            <button type="button" class="btn-delete-rec" title="Eliminar reconocimiento" style="background-color:var(--color-error);color:white;border:none;border-radius:8px;padding:0.4rem 0.6rem;cursor:pointer;font-size:0.8rem;white-space:nowrap;">Eliminar</button>
                        </div>
                    `;
                    item.querySelector('.btn-delete-rec').addEventListener('click', () => confirmarEliminacion(() => eliminarReconocimiento(evento.id, pIndex), 'Reconocimiento'));
                    content.appendChild(item);
                });

                details.appendChild(content);
                reconocimientosGuardadosList.appendChild(details);
            };

            const stageNumbers = Object.keys(etapas).map(Number).sort((a, b) => a - b);
            const combinadasRenderizadas = new Set();

            stageNumbers.forEach(num => {
                crearAcordeon(`Etapa ${num}`, etapas[num]);
                etapasCombinadasCCR.forEach(g => {
                    if (g.despuesDe === num) {
                        const matchingKey = Object.keys(etapasCombinadas).find(k => k.startsWith(g.key));
                        if (matchingKey && !combinadasRenderizadas.has(matchingKey)) {
                            crearAcordeon(matchingKey, etapasCombinadas[matchingKey]);
                            combinadasRenderizadas.add(matchingKey);
                        }
                    }
                });
            });

            etapasCombinadasCCR.forEach(g => {
                const matchingKey = Object.keys(etapasCombinadas).find(k => k.startsWith(g.key));
                if (matchingKey && !combinadasRenderizadas.has(matchingKey)) {
                    crearAcordeon(matchingKey, etapasCombinadas[matchingKey]);
                }
            });

            Object.keys(otros).sort().forEach(key => {
                crearAcordeon(key, otros[key]);
            });

            if (sinEtapa.length) {
                crearAcordeon('Sin etapa', sinEtapa);
            }
        }

        function renderCotizacionesGuardadas(events) {
            cotizacionesGuardadosList.innerHTML = '';

            const provinciasOrder = ['San José', 'Cartago', 'Heredia', 'Alajuela', 'Guanacaste', 'Puntarenas', 'Limón'];
            const items = [];
            events.forEach(evento => {
                (evento.pagos || []).forEach((pago, pIndex) => {
                    if (pago.dynamicFields && pago.dynamicFields.cotizador) {
                        const coti = pago.dynamicFields.cotizador;
                        const precio = coti.precio === undefined ? '' : String(coti.precio);
                        if (!coti.cotizado && precio.trim() === '') {
                            items.push({ evento, pIndex, pago, coti });
                        }
                    }
                });
            });

            if (items.length === 0) {
                cotizacionesGuardadosList.innerHTML = '<p style="color:var(--color-texto); width:100%; text-align:center;">No hay cotizaciones registradas.</p>';
                renderCotizadosGuardados(events);
                return;
            }

            const groups = {};
            items.forEach(item => {
                const prov = item.pago.provincia || item.coti.provincia || 'Sin provincia';
                if (!groups[prov]) groups[prov] = [];
                groups[prov].push(item);
            });

            const sortedProvinces = Object.keys(groups).sort((a, b) => {
                if (a === 'Sin provincia') return 1;
                if (b === 'Sin provincia') return -1;
                const idxA = provinciasOrder.indexOf(a);
                const idxB = provinciasOrder.indexOf(b);
                if (idxA === -1) return 1;
                if (idxB === -1) return -1;
                return idxA - idxB;
            });

            const getUrlLabel = (i) => {
                if (i === 0) return 'Dirección de entrega';
                if (i === 1) return 'Dirección de recogido';
                return 'Dirección alternativa';
            };

            const formatUrl = (u) => {
                if (typeof u === 'string') return { url: u.trim(), descripcion: '', tipo: '' };
                if (u && typeof u === 'object') return { url: (u.url || '').trim(), descripcion: u.descripcion || '', tipo: u.tipo || '' };
                return { url: '', descripcion: '', tipo: '' };
            };

            const abreviaturaProvincia = (prov) => {
                const map = {
                    'San José': 'SJ',
                    'Cartago': 'CA',
                    'Heredia': 'HE',
                    'Alajuela': 'AL',
                    'Guanacaste': 'GU',
                    'Puntarenas': 'PU',
                    'Limón': 'LI'
                };
                return map[prov] || 'SIN';
            };

            const crearTextoCotizacion = (pago, coti, codigo) => {
                const nombre = pago.nombre || coti.nombre || '';
                const tipo = coti.tipoCaminata || '—';
                const provincia = pago.provincia || coti.provincia || '—';
                const esCircular = tipo.toString().toLowerCase() === 'circular';

                let texto = `*${codigo}*\n`;
                texto += `Nombre: ${nombre}\n`;
                texto += `Tipo: ${tipo}\n`;
                texto += `Provincia: ${provincia}\n`;

                const urls = (coti.urls || []).map(formatUrl).filter(u => u.url);
                if (urls.length === 0) {
                    texto += 'Sin URLs\n';
                } else {
                    urls.forEach((u, i) => {
                        if (esCircular && i > 0) return;
                        const label = getUrlLabel(i);
                        const desc = u.descripcion && i >= 2 ? ` (${u.descripcion})` : '';
                        texto += `${label}${desc}\n${u.url}\n`;
                    });
                }

                texto += `Precio ??\n`;
                texto += '\n--------------------\n\n';
                return texto;
            };

            sortedProvinces.forEach(prov => {
                const details = document.createElement('details');
                details.className = 'provincia-accordion';
                details.style.cssText = 'margin-bottom: 1rem; border: 1px solid var(--color-secundario); border-radius: var(--borde-radio); overflow: hidden;';
                details.open = false;

                const summary = document.createElement('summary');
                summary.textContent = prov;
                summary.style.cssText = 'background-color: var(--color-secundario); color: var(--color-primario); padding: 0.8rem 1rem; font-weight: bold; cursor: pointer; outline: none;';
                details.appendChild(summary);

                const content = document.createElement('div');
                content.style.cssText = 'padding: 0.5rem 1rem; background-color: var(--color-blanco);';

                groups[prov].forEach(({ evento, pIndex, pago, coti }, idx) => {
                    const item = document.createElement('div');
                    item.className = 'rec-item';
                    item.style.cssText = 'border-bottom: 1px solid var(--color-secundario); padding: 0.75rem 0; margin-bottom: 0.5rem;';

                    const urls = (coti.urls || []).map(formatUrl).filter(u => u.url);
                    const urlsHtml = urls.length ? `<div style="margin-top: 0.25rem;">${urls.map((u, i) => `<div style="margin: 0.15rem 0;"><a href="${u.url}" target="_blank">${getUrlLabel(i)}</a>${u.descripcion ? `<div style="font-size:0.85rem;opacity:0.8;">${u.descripcion}</div>` : ''}</div>`).join('')}</div>` : '<div style="font-size: 0.85rem; opacity: 0.8;">Sin URLs</div>';

                    const nombre = pago.nombre || coti.nombre || '';
                    const detalle = `
                        <div><strong>Nombre:</strong> ${nombre}</div>
                        <div><strong>Tipo de caminata:</strong> ${coti.tipoCaminata || '—'}</div>
                        <div><strong>Provincia:</strong> ${pago.provincia || coti.provincia || '—'}</div>
                        ${urlsHtml}
                        <div class="form-group" style="margin-top: 0.5rem; margin-bottom: 0;">
                            <label>Ingrese el precio</label>
                            <input type="text" inputmode="numeric" class="cotizador-precio-input" placeholder="Precio" value="">
                        </div>
                    `;

                    item.innerHTML = `
                        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
                            <div>${detalle}</div>
                            <div style="display:flex;gap:0.4rem;flex-direction:column;">
                                <button type="button" class="btn btn-success btn-compartir-coti" style="padding:0.4rem 0.6rem;font-size:0.8rem;white-space:nowrap;">Compartir</button>
                                <button type="button" class="btn btn-error btn-delete-coti" style="padding:0.4rem 0.6rem;font-size:0.8rem;white-space:nowrap;">Eliminar</button>
                                <button type="button" class="btn btn-primary btn-cotizar-precio" style="padding:0.4rem 0.6rem;font-size:0.8rem;white-space:nowrap;">Cotizar</button>
                            </div>
                        </div>
                    `;

                    item.querySelector('.btn-compartir-coti').addEventListener('click', () => {
                        const codigo = `${abreviaturaProvincia(prov)}-${String(idx + 1).padStart(3, '0')}`;
                        const texto = '*Cotización de rutas de Transavi para la tribu de los libres*\n\n' + crearTextoCotizacion(pago, coti, codigo);
                        window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
                    });
                    item.querySelector('.btn-delete-coti').addEventListener('click', () => confirmarEliminacion(() => eliminarReconocimiento(evento.id, pIndex), 'Cotización'));
                    item.querySelector('.btn-cotizar-precio').addEventListener('click', () => {
                        const input = item.querySelector('.cotizador-precio-input');
                        const valorLimpio = input.value.replace(/[^0-9]/g, '');
                        pago.dynamicFields.cotizador.precio = valorLimpio;
                        pago.dynamicFields.cotizador.cotizado = true;
                        guardarEventosEnDB();
                        renderCotizacionesGuardadas(allEventsCache);
                        renderCotizadosGuardados(allEventsCache);
                    });

                    content.appendChild(item);
                });

                details.appendChild(content);
                cotizacionesGuardadosList.appendChild(details);
            });

            const buildFullText = () => {
                let texto = '*Cotización de rutas de Transavi para la tribu de los libres*\n\n*COTIZACIONES AGRUPADAS POR PROVINCIA*\n\n';
                sortedProvinces.forEach(prov => {
                    const abrev = abreviaturaProvincia(prov);
                    texto += `*Provincia: ${prov}*\n`;
                    groups[prov].forEach(({ pago, coti }, i) => {
                        const codigo = `${abrev}-${String(i + 1).padStart(3, '0')}`;
                        texto += crearTextoCotizacion(pago, coti, codigo);
                    });
                    texto += '\n';
                });
                return texto;
            };

            const actions = document.createElement('div');
            actions.style.cssText = 'display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 1rem;';

            const btnWhatsapp = document.createElement('button');
            btnWhatsapp.type = 'button';
            btnWhatsapp.className = 'btn btn-success';
            btnWhatsapp.style.cssText = 'flex: 1 1 0; min-width: 120px;';
            btnWhatsapp.textContent = 'Enviar por WhatsApp';
            btnWhatsapp.addEventListener('click', () => {
                window.open(`https://wa.me/?text=${encodeURIComponent(buildFullText())}`, '_blank');
            });

            const btnTxt = document.createElement('button');
            btnTxt.type = 'button';
            btnTxt.className = 'btn btn-info';
            btnTxt.style.cssText = 'flex: 1 1 0; min-width: 120px;';
            btnTxt.textContent = 'Descargar TXT';
            btnTxt.addEventListener('click', () => {
                const blob = new Blob([buildFullText()], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `cotizaciones_${new Date().toISOString().slice(0,10)}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            });

            const btnJson = document.createElement('button');
            btnJson.type = 'button';
            btnJson.className = 'btn btn-secondary';
            btnJson.style.cssText = 'flex: 1 1 0; min-width: 120px;';
            btnJson.textContent = 'Descargar JSON';
            btnJson.addEventListener('click', () => {
                const data = items.map(({ pago, coti }) => ({ nombre: pago.nombre, tipoCaminata: coti.tipoCaminata, provincia: pago.provincia || coti.provincia, urls: coti.urls }));
                const jsonString = JSON.stringify(data, null, 2);
                const blob = new Blob([jsonString], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `cotizaciones_${new Date().toISOString().slice(0,10)}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            });

            actions.append(btnWhatsapp, btnTxt, btnJson);
            cotizacionesGuardadosList.appendChild(actions);
            renderCotizadosGuardados(events);
        }

        function renderCotizadosGuardados(events) {
            cotizadosGuardadosList.innerHTML = '';

            const provinciasOrder = ['San José', 'Cartago', 'Heredia', 'Alajuela', 'Guanacaste', 'Puntarenas', 'Limón'];
            const items = [];
            events.forEach(evento => {
                (evento.pagos || []).forEach((pago, pIndex) => {
                    if (pago.dynamicFields && pago.dynamicFields.cotizador) {
                        const coti = pago.dynamicFields.cotizador;
                        const precio = coti.precio === undefined ? '' : String(coti.precio);
                        if (coti.cotizado || precio.trim() !== '') {
                            items.push({ evento, pIndex, pago, coti });
                        }
                    }
                });
            });

            if (items.length === 0) {
                cotizadosGuardadosList.innerHTML = `<p style='color:var(--color-texto); width:100%; text-align:center;'>No hay cotizados registrados.</p>`;
                return;
            }

            const groups = {};
            items.forEach(item => {
                const prov = item.pago.provincia || item.coti.provincia || 'Sin provincia';
                if (!groups[prov]) groups[prov] = [];
                groups[prov].push(item);
            });

            const sortedProvinces = Object.keys(groups).sort((a, b) => {
                if (a === 'Sin provincia') return 1;
                if (b === 'Sin provincia') return -1;
                const idxA = provinciasOrder.indexOf(a);
                const idxB = provinciasOrder.indexOf(b);
                if (idxA === -1) return 1;
                if (idxB === -1) return -1;
                return idxA - idxB;
            });

            const getUrlLabel = (i) => {
                if (i === 0) return 'Dirección de entrega';
                if (i === 1) return 'Dirección de recogido';
                return 'Dirección alternativa';
            };

            const formatUrl = (u) => {
                if (typeof u === 'string') return { url: u.trim(), descripcion: '', tipo: '' };
                if (u && typeof u === 'object') return { url: (u.url || '').trim(), descripcion: u.descripcion || '', tipo: u.tipo || '' };
                return { url: '', descripcion: '', tipo: '' };
            };

            const abreviaturaProvincia = (prov) => {
                const map = {
                    'San José': 'SJ',
                    'Cartago': 'CA',
                    'Heredia': 'HE',
                    'Alajuela': 'AL',
                    'Guanacaste': 'GU',
                    'Puntarenas': 'PU',
                    'Limón': 'LI'
                };
                return map[prov] || 'SIN';
            };

            const crearTextoCotizado = (pago, coti, codigo) => {
                const nombre = pago.nombre || coti.nombre || '';
                const tipo = coti.tipoCaminata || '—';
                const provincia = pago.provincia || coti.provincia || '—';
                const esCircular = tipo.toString().toLowerCase() === 'circular';

                let texto = `*${codigo}*\n`;
                texto += `Nombre: ${nombre}\n`;
                texto += `Tipo: ${tipo}\n`;
                texto += `Provincia: ${provincia}\n`;

                const urls = (coti.urls || []).map(formatUrl).filter(u => u.url);
                if (urls.length === 0) {
                    texto += 'Sin URLs\n';
                } else {
                    urls.forEach((u, i) => {
                        if (esCircular && i > 0) return;
                        const label = getUrlLabel(i);
                        const desc = u.descripcion && i >= 2 ? ` (${u.descripcion})` : '';
                        texto += `${label}${desc}\n${u.url}\n`;
                    });
                }

                const precio = coti.precio === undefined ? '' : String(coti.precio);
                texto += `Precio: ${precio || '—'}\n`;
                texto += '\n--------------------\n\n';
                return texto;
            };

            sortedProvinces.forEach(prov => {
                const details = document.createElement('details');
                details.className = 'provincia-accordion';
                details.style.cssText = 'margin-bottom: 1rem; border: 1px solid var(--color-secundario); border-radius: var(--borde-radio); overflow: hidden;';
                details.open = false;

                const summary = document.createElement('summary');
                summary.textContent = prov;
                summary.style.cssText = 'background-color: var(--color-secundario); color: var(--color-primario); padding: 0.8rem 1rem; font-weight: bold; cursor: pointer; outline: none;';
                details.appendChild(summary);

                const content = document.createElement('div');
                content.style.cssText = 'padding: 0.5rem 1rem; background-color: var(--color-blanco);';

                groups[prov].forEach(({ evento, pIndex, pago, coti }, idx) => {
                    const item = document.createElement('div');
                    item.className = 'rec-item';
                    item.style.cssText = 'border-bottom: 1px solid var(--color-secundario); padding: 0.75rem 0; margin-bottom: 0.5rem;';

                    const urls = (coti.urls || []).map(formatUrl).filter(u => u.url);
                    const urlsHtml = urls.length ? `<div style='margin-top: 0.25rem;'>${urls.map((u, i) => `<div style='margin: 0.15rem 0;'><a href='${u.url}' target='_blank'>${getUrlLabel(i)}</a>${u.descripcion ? `<div style='font-size:0.85rem;opacity:0.8;'>${u.descripcion}</div>` : ''}</div>`).join('')}</div>` : `<div style='font-size: 0.85rem; opacity: 0.8;'>Sin URLs</div>`;

                    const nombre = pago.nombre || coti.nombre || '';
                    const precio = coti.precio === undefined ? '' : String(coti.precio);
                    const detalle = `
                        <div><strong>Código:</strong> ${abreviaturaProvincia(prov)}-${String(idx + 1).padStart(3, '0')}</div>
                        <div><strong>Nombre:</strong> ${nombre}</div>
                        <div><strong>Tipo:</strong> ${coti.tipoCaminata || '—'}</div>
                        <div><strong>Provincia:</strong> ${pago.provincia || coti.provincia || '—'}</div>
                        ${urlsHtml}
                        <div><strong>Precio:</strong> ${precio || '—'}</div>
                    `;

                    item.innerHTML = `
                        <div style='display:flex;justify-content:space-between;align-items:flex-start;gap:10px;'>
                            <div>${detalle}</div>
                            <div style='display:flex;gap:0.4rem;flex-direction:column;'>
                                <button type='button' class='btn btn-success btn-compartir-cotizado' style='padding:0.4rem 0.6rem;font-size:0.8rem;white-space:nowrap;'>Compartir</button>
                                <button type='button' class='btn btn-error btn-delete-cotizado' style='padding:0.4rem 0.6rem;font-size:0.8rem;white-space:nowrap;'>Eliminar</button>
                            </div>
                        </div>
                    `;

                    item.querySelector('.btn-compartir-cotizado').addEventListener('click', () => {
                        const codigo = `${abreviaturaProvincia(prov)}-${String(idx + 1).padStart(3, '0')}`;
                        const texto = '*Cotización de rutas de Transavi para la tribu de los libres*\n\n' + crearTextoCotizado(pago, coti, codigo);
                        window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
                    });
                    item.querySelector('.btn-delete-cotizado').addEventListener('click', () => confirmarEliminacion(() => eliminarReconocimiento(evento.id, pIndex), 'Cotizado'));

                    content.appendChild(item);
                });

                details.appendChild(content);
                cotizadosGuardadosList.appendChild(details);
            });

            const buildFullText = () => {
                let texto = '*Cotización de rutas de Transavi para la tribu de los libres*\n\n*COTIZADOS AGRUPADOS POR PROVINCIA*\n\n';
                sortedProvinces.forEach(prov => {
                    const abrev = abreviaturaProvincia(prov);
                    texto += `*Provincia: ${prov}*\n`;
                    groups[prov].forEach(({ pago, coti }, i) => {
                        const codigo = `${abrev}-${String(i + 1).padStart(3, '0')}`;
                        texto += crearTextoCotizado(pago, coti, codigo);
                    });
                    texto += '\n';
                });
                return texto;
            };

            const actions = document.createElement('div');
            actions.style.cssText = 'display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 1rem;';

            const btnWhatsapp = document.createElement('button');
            btnWhatsapp.type = 'button';
            btnWhatsapp.className = 'btn btn-success';
            btnWhatsapp.style.cssText = 'flex: 1 1 0; min-width: 120px;';
            btnWhatsapp.textContent = 'Enviar por WhatsApp';
            btnWhatsapp.addEventListener('click', () => {
                window.open(`https://wa.me/?text=${encodeURIComponent(buildFullText())}`, '_blank');
            });

            const btnTxt = document.createElement('button');
            btnTxt.type = 'button';
            btnTxt.className = 'btn btn-info';
            btnTxt.style.cssText = 'flex: 1 1 0; min-width: 120px;';
            btnTxt.textContent = 'Descargar TXT';
            btnTxt.addEventListener('click', () => {
                const blob = new Blob([buildFullText()], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `cotizados_${new Date().toISOString().slice(0,10)}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            });

            const btnJson = document.createElement('button');
            btnJson.type = 'button';
            btnJson.className = 'btn btn-secondary';
            btnJson.style.cssText = 'flex: 1 1 0; min-width: 120px;';
            btnJson.textContent = 'Descargar JSON';
            btnJson.addEventListener('click', () => {
                const data = items.map(({ pago, coti }) => ({ nombre: pago.nombre, tipoCaminata: coti.tipoCaminata, provincia: pago.provincia || coti.provincia, precio: coti.precio, urls: coti.urls }));
                const jsonString = JSON.stringify(data, null, 2);
                const blob = new Blob([jsonString], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `cotizados_${new Date().toISOString().slice(0,10)}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            });

            actions.append(btnWhatsapp, btnTxt, btnJson);
            cotizadosGuardadosList.appendChild(actions);
        }

        function guardarEventosEnDB() {
            const transaction = db.transaction(['eventos'], 'readwrite');
            const store = transaction.objectStore('eventos');
            store.clear();
            allEventsCache.forEach(evento => store.put(evento));
        }

        function eliminarReconocimiento(eventoId, pIndex) {
            const eventIndex = allEventsCache.findIndex(e => e.id === eventoId);
            if (eventIndex === -1) return;
            const evento = allEventsCache[eventIndex];
            evento.pagos.splice(pIndex, 1);
            if (evento.pagos.length === 0) {
                allEventsCache.splice(eventIndex, 1);
            }
            guardarEventosEnDB();
            showNotification('Reconocimiento eliminado.');
            renderEventosGuardados(allEventsCache);
            renderReconocimientosGuardados(allEventsCache);
            renderCotizacionesGuardadas(allEventsCache);
            renderCotizadosGuardados(allEventsCache);
        }

        // Listener de Búsqueda
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            
            if (searchTerm === '') {
                renderEventosGuardados(allEventsCache);
                renderReconocimientosGuardados(allEventsCache);
                renderCotizacionesGuardadas(allEventsCache);
                renderCotizadosGuardados(allEventsCache);
                eventosGuardadosWrapper.style.display = 'block';
                if (toggleEventosListBtn) toggleEventosListBtn.textContent = 'Mostrar Lista';
                return;
            }

            // Filtrar eventos
            const filteredEvents = allEventsCache.filter(evento => {
                const nombreMatch = evento.nombre.toLowerCase().includes(searchTerm);
                let grandTotal = 0;
                const capacidadCG = parseFloat(evento.capacidadCG) || 0;
                const capacidadSG = parseFloat(evento.capacidadSG) || 1;
                if (evento.pagos) {
                    evento.pagos.forEach(pago => {
                        let baseTotal = 0;
                        if (pago.tipoPrecio === 'persona') {
                            baseTotal = (parseFloat(pago.precioPersona) || 0) * capacidadCG / capacidadSG;
                        } else {
                            baseTotal = (parseFloat(pago.precioGrupal) || 0) / capacidadSG;
                        }
                        const cantidad = (pago.dynamicFields && pago.dynamicFields.cantidad) ? parseFloat(pago.dynamicFields.cantidad) : 1;
                        grandTotal += baseTotal * cantidad;
                    });
                }
                const precioMatch = grandTotal.toString().includes(searchTerm);
                
                return nombreMatch || precioMatch;
            });

            // Mostrar resultados y abrir contenedor
            renderEventosGuardados(filteredEvents);
            renderReconocimientosGuardados(allEventsCache);
            renderCotizacionesGuardadas(allEventsCache);
            renderCotizadosGuardados(allEventsCache);
            eventosGuardadosWrapper.style.display = 'block';
            toggleEventosListBtn.textContent = 'Ocultar Lista';
        });

        // Botón Toggle Manual
        toggleEventosListBtn.addEventListener('click', () => {
            if (eventosGuardadosWrapper.style.display === 'none') {
                // Mostrar todo
                renderEventosGuardados(allEventsCache);
                renderReconocimientosGuardados(allEventsCache);
                renderCotizacionesGuardadas(allEventsCache);
                renderCotizadosGuardados(allEventsCache);
                eventosGuardadosWrapper.style.display = 'block';
                toggleEventosListBtn.textContent = 'Ocultar Lista';
            } else {
                // Ocultar
                eventosGuardadosWrapper.style.display = 'none';
                toggleEventosListBtn.textContent = 'Mostrar Lista';
            }
        });

        function loadEvents() {
            const store = db.transaction(['eventos'], 'readonly').objectStore('eventos');
            store.getAll().onsuccess = (e) => {
                allEventsCache = e.target.result; 
                renderEventosGuardados(allEventsCache);
                renderReconocimientosGuardados(allEventsCache);
                renderCotizacionesGuardadas(allEventsCache);
                renderCotizadosGuardados(allEventsCache);
                eventosGuardadosWrapper.style.display = 'block';
                if (toggleEventosListBtn) toggleEventosListBtn.textContent = 'Mostrar Lista';
                searchInput.value = ''; 
            };
        }

        function loadEventData(id) {
            db.transaction(['eventos'], 'readonly').objectStore('eventos').get(id).onsuccess = (e) => {
                const evento = e.target.result;
                if (!evento) return;

                console.log("Cargando evento:", evento);

                currentEventId = evento.id;
                eventoNombre.value = evento.nombre;
                eventoPrecio.value = evento.precio;
                eventoCapacidadCG.value = evento.capacidadCG;
                eventoCapacidadSG.value = evento.capacidadSG;
                tipoCambioInput.value = evento.tipoCambio;
                currencySelector.value = evento.moneda;
                currencySelector.dispatchEvent(new Event('change'));

                const pagosList = document.getElementById('transporte-nacional-list');
                pagosList.innerHTML = '';

                if (evento.pagos) {
                    evento.pagos.forEach(pago => {
                        const cardWrapper = document.createElement('div');
                        cardWrapper.innerHTML = createItemHTML();
                        const cardElement = cardWrapper.firstElementChild;
                        
                        cardElement.querySelector('.item-nombre').value = pago.nombre;
                        const selGasto = cardElement.querySelector('.item-tipo-gasto'); if (selGasto) { const nom = pago.nombre || ''; const tiene = Array.from(selGasto.options).some(o => o.value === nom); selGasto.value = tiene ? nom : (nom ? 'Otros' : ''); if (!tiene && nom) { const inp = cardElement.querySelector('.item-nombre'); inp.style.display = ''; inp.value = nom; } }
                        const priceSelector = cardElement.querySelector('.price-type-selector');
                        priceSelector.value = pago.tipoPrecio;
                        updatePriceFields(priceSelector, false);

                        if (pago.tipoPrecio === 'persona') {
                            const priceInput = cardElement.querySelector('.item-price-per-person');
                            if(priceInput) priceInput.value = pago.precioPersona;
                        } else {
                            const priceInput = cardElement.querySelector('.item-price-grupal');
                            if(priceInput) priceInput.value = pago.precioGrupal;
                        }

                        // Restaurar el botón de la alerta local
                        const localAlertBtn = cardElement.querySelector('.local-alert-btn');
                        if (localAlertBtn) {
                            const isOn = pago.alertaLocal || false;
                            localAlertBtn.dataset.alert = isOn ? 'true' : 'false';
                            localAlertBtn.textContent = isOn ? 'Activada' : 'Desactivada';
                            localAlertBtn.className = `btn local-alert-btn ${isOn ? 'btn-exito' : 'btn-secondary'}`;
                        }

                        const dynamicFieldsContainer = cardElement.querySelector('.dynamic-fields-container');
                        const fieldSelector = cardElement.querySelector('.field-selector');

                        if (pago.dynamicFields) {
                            for (const fieldName in pago.dynamicFields) {
                                if (!Object.prototype.hasOwnProperty.call(pago.dynamicFields, fieldName)) continue;
                                if (fieldName === 'kilometros') continue;

                                const fieldKey = fieldName.toLowerCase();
                                const newFieldElement = createFieldElement(fieldKey, cardElement.id);
                                if (newFieldElement) {
                                    dynamicFieldsContainer.appendChild(newFieldElement);

                                    const optionToDisable = fieldSelector.querySelector(`option[value="${fieldKey}"]`);
                                    if (optionToDisable) optionToDisable.disabled = true;

                                    const fieldData = pago.dynamicFields[fieldName];

                                    if (fieldKey === 'aerolinea') {
                                        const airlineSelector = newFieldElement.querySelector('.airline-selector');
                                        if (airlineSelector) {
                                            airlineSelector.value = fieldData.nombre || '';
                                            airlineSelector.dispatchEvent(new Event('change'));
                                        }
                                        for (const key in fieldData) {
                                            if (key !== 'nombre' && fieldData[key] !== null && fieldData[key] !== undefined) {
                                                const inputId = `#aerolinea-${cardElement.id}-${key.replace(/_/g, '-')}`;
                                                const priceInput = newFieldElement.querySelector(inputId);
                                                if (priceInput) priceInput.value = fieldData[key];
                                            }
                                        }
                                    } else if (fieldKey === 'reconocimiento') {
                                        const rec = typeof fieldData === 'object' ? fieldData : {};
                                        if (rec.actividad === 'Camino de Costa Rica' || rec.actividad === 'el Camino de Costa Rica') rec.actividad = 'El Camino de Costa Rica';
                                        const actividad = newFieldElement.querySelector('.recon-actividad');
                                        const parque = newFieldElement.querySelector('.recon-parque');
                                        const provincia = newFieldElement.querySelector('.recon-provincia');
                                        const dificultad = newFieldElement.querySelector('.recon-dificultad');
                                        const distancia = newFieldElement.querySelector('.recon-distancia');
                                        const etapa = newFieldElement.querySelector('.recon-etapa');
                                        if (actividad) {
                                            actividad.value = rec.actividad || '';
                                            actividad.dispatchEvent(new Event('change'));
                                        }
                                        if (parque && rec.actividad === 'Parques Nacionales') {
                                            parque.value = rec.parqueNacional || '';
                                            parque.dispatchEvent(new Event('change'));
                                        }
                                        if (etapa && rec.actividad === 'El Camino de Costa Rica' && rec.etapa) {
                                            etapa.value = rec.etapa || '';
                                            etapa.dispatchEvent(new Event('change'));
                                        }
                                        if (provincia) provincia.value = rec.provincia || '';
                                        if (dificultad) dificultad.value = rec.dificultad || '';
                                        if (distancia) distancia.value = rec.distancia || '';
                                    } else if (fieldKey === 'informacion') {
                                        const info = fieldData || {};
                                        if (info.actividad === 'Camino de Costa Rica' || info.actividad === 'el Camino de Costa Rica') info.actividad = 'El Camino de Costa Rica';
                                        const provincia = newFieldElement.querySelector('.info-provincia');
                                        const dificultad = newFieldElement.querySelector('.info-dificultad');
                                        const distancia = newFieldElement.querySelector('.info-distancia');
                                        const actividad = newFieldElement.querySelector('.info-actividad');
                                        if (provincia) provincia.value = info.provincia || '';
                                        if (dificultad) dificultad.value = info.dificultad || 'Paseo básico';
                                        if (distancia) distancia.value = info.distancia || '';
                                        if (actividad) actividad.value = info.actividad || 'Caminata';
                                    } else if (fieldKey === 'cotizador') {
                                        const coti = typeof fieldData === 'object' ? fieldData : {};
                                        const nombre = newFieldElement.querySelector('.cotizador-nombre');
                                        if (nombre) nombre.value = coti.nombre || pago.nombre || '';
                                        const tipoSelect = newFieldElement.querySelector('.cotizador-tipo');
                                        const provincia = newFieldElement.querySelector('.cotizador-provincia');
                                        const urlsContainer = newFieldElement.querySelector('.cotizador-urls');
                                        const addUrlBtn = newFieldElement.querySelector('.btn-agregar-url');
                                        const esCircular = (coti.tipoCaminata === 'Circular');
                                        if (tipoSelect) tipoSelect.value = coti.tipoCaminata || 'Circular';
                                        if (provincia) provincia.value = coti.provincia || '';
                                        if (urlsContainer) {
                                            const urls = Array.isArray(coti.urls) ? coti.urls : [];
                                            const cantidad = esCircular ? 1 : Math.max(2, urls.length);
                                            urlsContainer.innerHTML = '';
                                            for (let i = 0; i < cantidad; i++) {
                                                const raw = urls[i];
                                                let url = '', desc = '', tipo = '';
                                                if (typeof raw === 'string') {
                                                    url = raw;
                                                    tipo = (i === 0) ? 'entrega' : (i === 1) ? 'recogido' : 'alternativa';
                                                } else if (raw && typeof raw === 'object') {
                                                    url = raw.url || '';
                                                    desc = raw.descripcion || '';
                                                    tipo = raw.tipo || ((i === 0) ? 'entrega' : (i === 1) ? 'recogido' : 'alternativa');
                                                }
                                                const wrapper = document.createElement('div');
                                                wrapper.className = 'form-group cotizador-url-wrapper';
                                                wrapper.style.marginBottom = '0.5rem';
                                                const labelText = (i === 0) ? 'Dirección de entrega' : (i === 1) ? 'Dirección de recogido' : 'Dirección alternativa';
                                                const label = document.createElement('label');
                                                label.textContent = labelText;
                                                const input = document.createElement('input');
                                                input.type = 'url';
                                                input.className = 'cotizador-url';
                                                input.placeholder = 'URL';
                                                input.value = url;
                                                input.dataset.tipo = tipo;
                                                wrapper.appendChild(label);
                                                wrapper.appendChild(input);
                                                if (i >= 2) {
                                                    const descLabel = document.createElement('label');
                                                    descLabel.textContent = 'Descripción';
                                                    descLabel.style.marginTop = '0.5rem';
                                                    const descInput = document.createElement('textarea');
                                                    descInput.className = 'cotizador-url-desc';
                                                    descInput.placeholder = 'Indique por qué es una dirección alternativa';
                                                    descInput.rows = 2;
                                                    descInput.value = desc;
                                                    wrapper.appendChild(descLabel);
                                                    wrapper.appendChild(descInput);
                                                }
                                                urlsContainer.appendChild(wrapper);
                                            }
                                        }
                                        if (addUrlBtn) addUrlBtn.style.display = esCircular ? 'none' : 'inline-flex';
                                    } else {
                                        const input = newFieldElement.querySelector(`[id^="${fieldKey}-"]`);
                                        if (input) input.value = fieldData;
                                    }
                                }
                            }
                        }

                        // Migrar datos antiguos si no existe información
                        const noInfoField = !dynamicFieldsContainer.querySelector('[data-field-name="informacion"]');
                        const hasOldInfo = pago.provincia || pago.reconocimiento ||
                            (pago.dynamicFields && (pago.dynamicFields.dificultad || pago.dynamicFields.kilometros));
                        if (noInfoField && hasOldInfo) {
                            const infoData = {
                                provincia: pago.provincia || '',
                                dificultad: (pago.dynamicFields && pago.dynamicFields.dificultad) || 'Paseo básico',
                                distancia: (pago.dynamicFields && pago.dynamicFields.kilometros) || '',
                                actividad: pago.reconocimiento ? 'Reconocimiento' : 'Caminata'
                            };
                            const infoField = createFieldElement('informacion', cardElement.id);
                            if (infoField) {
                                dynamicFieldsContainer.appendChild(infoField);
                                const infoOption = fieldSelector.querySelector('option[value="informacion"]');
                                if (infoOption) infoOption.disabled = true;
                                const provincia = infoField.querySelector('.info-provincia');
                                const dificultad = infoField.querySelector('.info-dificultad');
                                const distancia = infoField.querySelector('.info-distancia');
                                const actividad = infoField.querySelector('.info-actividad');
                                if (provincia) provincia.value = infoData.provincia;
                                if (dificultad) dificultad.value = infoData.dificultad;
                                if (distancia) distancia.value = infoData.distancia;
                                if (actividad) actividad.value = infoData.actividad;
                            }
                        }
                        
                        updatePagoVisibility(cardElement);
                        pagosList.appendChild(cardElement);
                    });
                }
                updateAllTotals(); 
                clearDraft();
                updateEventInfoVisibility();
                showNotification(`Evento "${evento.nombre}" cargado.`);
                
                // Ocultar lista para ver el formulario cargado
                if (toggleEventosListBtn) toggleEventosListBtn.textContent = 'Mostrar Lista';
                document.querySelector('.tab-link[data-tab="nacionales"]').click();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            };
        }
        
        // --- INICIALIZACIÓN DE LA APP ---
        async function initializeApp() {
            applyTheme(localStorage.getItem('theme') || 'theme-sepia');
            await initDB();
            loadEvents();
            checkAutosave();
            setInterval(updateAutosaveTimer, 1000);
            populateThemeSelector();
            const draft = localStorage.getItem('PagosAppDraft');
            if (draft) {
                showSessionRestoreModal();
            } else {
                currencySelector.dispatchEvent(new Event('change'));
            }
        }

        // --- Lógica de Respaldo y Restauración ---
        function checkAutosave() {
            const lastBackupStr = localStorage.getItem('lastBackupTimestamp');
            if (!lastBackupStr) {
                localStorage.setItem('lastBackupTimestamp', Date.now().toString());
                return;
            }
            if (Date.now() - parseInt(lastBackupStr, 10) > AUTOSAVE_INTERVAL) {
                console.log("Realizando respaldo automático...");
                backupData(true);
            }
        }

        function updateAutosaveTimer() {
            const lastBackup = parseInt(localStorage.getItem('lastBackupTimestamp') || Date.now());
            const nextBackupTime = lastBackup + AUTOSAVE_INTERVAL;
            const remainingTime = nextBackupTime - Date.now();

            if (remainingTime <= 0) {
                autosaveTimerDisplay.textContent = 'Iniciando respaldo...';
                checkAutosave();
                return;
            }

            const d = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
            const h = Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((remainingTime % (1000 * 60)) / 1000);
            autosaveTimerDisplay.textContent = `${d}d ${h}h ${m}m ${s}s`;
        }

        function formatDateTime() {
            return new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-');
        }

        async function backupData(isAuto = false) {
            if (window.parent !== window && typeof window.parent.exportData === 'function') {
                try {
                    if (window.parent.TribuRespaldos.restaurando) return;
                    saveDraft();
                    await window.parent.exportData();
                    localStorage.setItem('lastBackupTimestamp', Date.now().toString());
                    if (!isAuto) showNotification('Respaldo integral completado.');
                } catch (e) {
                    console.error('No se pudo generar el respaldo integral', e);
                    if (!isAuto) showNotification('No se pudo generar el respaldo integral.');
                }
                return;
            }
            if (!db) {
                if (!isAuto) showNotification('La base de datos no está lista.');
                return;
            }
            db.transaction(['eventos'], 'readonly').objectStore('eventos').getAll().onsuccess = (e) => {
                const data = {
                    events: e.target.result
                };
                const jsonString = JSON.stringify(data, null, 2);
                const fileName = `pagos_respaldo_${formatDateTime()}.json`;
                if (window.TribuRespaldos) {
                    TribuRespaldos.guardar(fileName, jsonString).then(ok => {
                        if (!ok) return; // fallback ya descargó
                    });
                } else {
                    const blob = new Blob([jsonString], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = fileName;
                    a.click();
                    URL.revokeObjectURL(url);
                }
                
                localStorage.setItem('lastBackupTimestamp', Date.now().toString());
                if (!isAuto) showNotification('Respaldo completado exitosamente.');
            };
        }
        
        backupBtn.addEventListener('click', () => backupData(false));

        const restoreInput = document.getElementById('restore-input');
        if (restoreInput) {
            restoreInput.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        if (data.respaldoIntegral) {
                            if (window.parent === window || !window.parent.TribuRespaldos) throw new Error('Importá este respaldo integral desde Ajustes de AgendaTribu.');
                            window.parent.TribuRespaldos.importarCompleto({ target: { files: [file] } });
                            return;
                        }
                        const eventsToRestore = data.events || (Array.isArray(data) ? data : null);
                        if (!Array.isArray(eventsToRestore)) throw new Error("Formato de eventos no válido.");

                        const transaction = db.transaction(['eventos'], 'readwrite');
                        const store = transaction.objectStore('eventos');
                        store.clear(); 
                        eventsToRestore.forEach(item => { if (item.id) delete item.id; store.add(item); });

                        transaction.oncomplete = () => {
                            showNotification('Restauración completada. La página se recargará.');
                            setTimeout(() => window.location.reload(), 2000);
                        };
                    } catch (error) {
                        showNotification(`Error al procesar el archivo: ${error.message}`);
                    }
                };
                reader.readAsText(file);
                restoreInput.value = ''; 
            });
        }

        // ==========================================
        // LÓGICA DE RECONOCIMIENTOS - BLOQUE ELIMINADO
        // ==========================================
        /*
        
        let allRecsCache = [];
        let recDeleteStep = 1;
        let recIdToDelete = null;

        const recForm = document.getElementById('rec-form');
        const recFormCancelBtn = document.getElementById('rec-form-cancel-btn');
        const nuevoRecBtn = document.getElementById('nuevo-rec-btn');
        const reconocimientosList = document.getElementById('reconocimientos-list');
        const searchRecInput = document.getElementById('search-rec');
        
        const recDeleteModal = document.getElementById('rec-delete-modal');
        const recDeleteConfirmBtn = document.getElementById('rec-delete-confirm-btn');
        const recDeleteCancelBtn = document.getElementById('rec-delete-cancel-btn');
        const recDeleteTitle = document.getElementById('rec-delete-title');
        const recDeleteMessage = document.getElementById('rec-delete-message');

        const tarjetaRecModal = document.getElementById('tarjeta-rec-modal');
        const tarjetaRecCloseBtn = document.getElementById('tarjeta-rec-close-btn');
        const tarjetaRecRenderArea = document.getElementById('tarjeta-rec-render-area');
        const tarjetaRecDownloadBtn = document.getElementById('tarjeta-rec-download-btn');
        const previewRecBtn = document.getElementById('preview-rec-btn');
        const exportRecBtn = document.getElementById('export-rec-btn');
        const importRecInput = document.getElementById('import-rec-input');

        // Formato para mostrar la moneda
        function formatRecCurrency(amount) {
            return `₡${parseFloat(amount).toLocaleString('es-CR')}`;
        }

        function loadReconocimientos(searchTerm = '') {
            const store = db.transaction(['reconocimientos'], 'readonly').objectStore('reconocimientos');
            store.getAll().onsuccess = (e) => {
                allRecsCache = e.target.result;
                renderReconocimientos(searchTerm);
            };
        }

        function renderReconocimientos(searchTerm = '') {
            reconocimientosList.innerHTML = '';
            
            let filteredRecs = allRecsCache;
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                filteredRecs = allRecsCache.filter(r => 
                    r.nombre.toLowerCase().includes(term) ||
                    r.provincia.toLowerCase().includes(term)
                );
            }

            if (filteredRecs.length === 0) {
                reconocimientosList.innerHTML = '<p style="text-align:center; color: var(--color-texto);">No hay reconocimientos registrados.</p>';
                return;
            }

            // Agrupar por provincia
            const grouped = filteredRecs.reduce((acc, rec) => {
                if (!acc[rec.provincia]) acc[rec.provincia] = [];
                acc[rec.provincia].push(rec);
                return acc;
            }, {});

            // Orden de provincias sugerido
            const provinciasOrder = ['San José', 'Alajuela', 'Cartago', 'Heredia', 'Guanacaste', 'Puntarenas', 'Limón'];
            const sortedProvinces = Object.keys(grouped).sort((a, b) => {
                let indexA = provinciasOrder.indexOf(a);
                let indexB = provinciasOrder.indexOf(b);
                if(indexA === -1) indexA = 999;
                if(indexB === -1) indexB = 999;
                return indexA - indexB;
            });

            sortedProvinces.forEach(prov => {
                const groupDiv = document.createElement('div');
                groupDiv.className = 'provincia-group';
                
                const title = document.createElement('div');
                title.className = 'provincia-title';
                title.textContent = prov;
                
                const listContainer = document.createElement('div');
                listContainer.className = 'rec-list-container';

                grouped[prov].forEach(rec => {
                    const card = document.createElement('div');
                    card.className = 'rec-card';
                    card.innerHTML = `
                        <div class="rec-header">
                            <h4 class="rec-title">${rec.nombre}</h4>
                            <div class="rec-actions">
                                <button class="btn btn-secondary btn-edit-rec" data-id="${rec.id}" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;">Editar</button>
                                <button class="btn btn-error btn-delete-rec" data-id="${rec.id}" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;">Eliminar</button>
                            </div>
                        </div>
                        ${rec.notas ? `<div class="rec-nota">Nota: ${rec.notas}</div>` : ''}
                    `;
                    listContainer.appendChild(card);
                });

                groupDiv.appendChild(title);
                groupDiv.appendChild(listContainer);
                reconocimientosList.appendChild(groupDiv);
            });

            // Listeners de editar y eliminar
            document.querySelectorAll('.btn-edit-rec').forEach(btn => {
                btn.addEventListener('click', () => openRecForm(Number(btn.dataset.id)));
            });
            document.querySelectorAll('.btn-delete-rec').forEach(btn => {
                btn.addEventListener('click', () => initiateDeleteRec(Number(btn.dataset.id)));
            });
        }

        searchRecInput.addEventListener('input', (e) => loadReconocimientos(e.target.value));

        // Gestión del Formulario Inline
        nuevoRecBtn.addEventListener('click', () => openRecForm());

        function openRecForm(id = null) {
            recForm.reset();
            document.getElementById('rec-id').value = '';
            document.getElementById('rec-form-title').textContent = 'Registrar Reconocimiento';
            
            if (id) {
                const rec = allRecsCache.find(r => r.id === id);
                if (rec) {
                    document.getElementById('rec-form-title').textContent = 'Editar Reconocimiento';
                    document.getElementById('rec-id').value = rec.id;
                    document.getElementById('rec-nombre').value = rec.nombre;
                    document.getElementById('rec-provincia').value = rec.provincia;
                    document.getElementById('rec-notas').value = rec.notas;
                    
                    // Hacer scroll suave hacia el formulario para que el usuario vea que se cargaron los datos
                    document.getElementById('rec-form-title').scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            } else {
                // Enfocar el primer input al limpiar
                document.getElementById('rec-nombre').focus();
            }
        }

        recFormCancelBtn.addEventListener('click', () => {
            openRecForm(); // Limpiar el formulario
        });

        recForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('rec-id').value;
            const recData = {
                nombre: document.getElementById('rec-nombre').value.trim(),
                provincia: document.getElementById('rec-provincia').value,
                notas: document.getElementById('rec-notas').value.trim()
            };

            const transaction = db.transaction(['reconocimientos'], 'readwrite');
            const store = transaction.objectStore('reconocimientos');

            if (id) {
                recData.id = Number(id);
                store.put(recData);
            } else {
                store.add(recData);
            }

            transaction.oncomplete = () => {
                showNotification(id ? 'Reconocimiento actualizado.' : 'Reconocimiento registrado exitosamente.');
                openRecForm(); // Limpiar el formulario automáticamente
                loadReconocimientos(searchRecInput.value.trim());
            };
        });

        // Proceso de Eliminación 3 Pasos
        function initiateDeleteRec(id) {
            recIdToDelete = id;
            recDeleteStep = 1;
            updateDeleteRecModal();
            recDeleteModal.classList.add('visible');
        }

        function updateDeleteRecModal() {
            if (recDeleteStep === 1) {
                recDeleteTitle.textContent = 'Paso 1/3: Confirmar';
                recDeleteMessage.textContent = '¿Estás seguro de que deseas eliminar este reconocimiento?';
                recDeleteConfirmBtn.textContent = 'Confirmar';
                recDeleteConfirmBtn.className = 'modal-btn btn-confirm';
            } else if (recDeleteStep === 2) {
                recDeleteTitle.textContent = 'Paso 2/3: Advertencia';
                recDeleteMessage.textContent = 'Esta acción borrará los datos permanentemente. ¿Deseas continuar?';
                recDeleteConfirmBtn.textContent = 'Sí, continuar';
                recDeleteConfirmBtn.className = 'modal-btn btn-confirm';
            } else if (recDeleteStep === 3) {
                recDeleteTitle.textContent = 'Paso 3/3: Última Oportunidad';
                recDeleteMessage.textContent = '¿Eliminar definitivamente el registro?';
                recDeleteConfirmBtn.textContent = 'Eliminar';
                recDeleteConfirmBtn.className = 'modal-btn btn-confirm';
            }
        }

        recDeleteConfirmBtn.addEventListener('click', () => {
            if (recDeleteStep < 3) {
                recDeleteStep++;
                updateDeleteRecModal();
            } else {
                const transaction = db.transaction(['reconocimientos'], 'readwrite');
                transaction.objectStore('reconocimientos').delete(recIdToDelete).onsuccess = () => {
                    recDeleteModal.classList.remove('visible');
                    showNotification('Reconocimiento eliminado definitivamente.');
                    loadReconocimientos(searchRecInput.value.trim());
                };
            }
        });

        recDeleteCancelBtn.addEventListener('click', () => recDeleteModal.classList.remove('visible'));

        // Exportar e Importar JSON (Reconocimientos)
        exportRecBtn.addEventListener('click', () => {
            if (allRecsCache.length === 0) {
                showNotification('No hay reconocimientos para exportar.');
                return;
            }
            const dataStr = JSON.stringify(allRecsCache, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `reconocimientos_jyk_${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });

        importRecInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    if (!Array.isArray(data)) throw new Error("Formato inválido.");
                    const transaction = db.transaction(['reconocimientos'], 'readwrite');
                    const store = transaction.objectStore('reconocimientos');
                    data.forEach(item => {
                        if (item.id) delete item.id;
                        store.add(item);
                    });
                    transaction.oncomplete = () => {
                        showNotification('Reconocimientos importados con éxito.');
                        loadReconocimientos();
                    };
                } catch (error) {
                    showNotification('Error al importar JSON.');
                }
            };
            reader.readAsText(file);
            importRecInput.value = '';
        });

        // Tarjeta PNG Reconocimientos
        previewRecBtn.addEventListener('click', () => {
            if (allRecsCache.length === 0) {
                showNotification('No hay reconocimientos para generar la tarjeta.');
                return;
            }

            const grouped = allRecsCache.reduce((acc, rec) => {
                if (!acc[rec.provincia]) acc[rec.provincia] = [];
                acc[rec.provincia].push(rec);
                return acc;
            }, {});

            let listHTML = '';

            const provinciasOrder = ['San José', 'Alajuela', 'Cartago', 'Heredia', 'Guanacaste', 'Puntarenas', 'Limón'];
            const sortedProvinces = Object.keys(grouped).sort((a, b) => {
                let indexA = provinciasOrder.indexOf(a);
                let indexB = provinciasOrder.indexOf(b);
                if(indexA === -1) indexA = 999;
                if(indexB === -1) indexB = 999;
                return indexA - indexB;
            });

            sortedProvinces.forEach(prov => {
                listHTML += `<div style="margin-bottom: 20px;">
                                <h3 style="color: var(--color-primario); margin: 0 0 10px 0; border-bottom: 2px solid var(--color-secundario); padding-bottom: 5px; font-size: 1.2rem;">${prov}</h3>
                                <div style="display: flex; flex-direction: column; gap: 10px;">`;
                grouped[prov].forEach((rec, index) => {
                    listHTML += `<div>
                                    <div style="font-size: 1rem; font-weight: bold; color: var(--color-texto);">${rec.nombre}</div>
                                    ${rec.notas ? `<div style="font-size: 0.85rem; opacity: 0.8; margin-top: 4px; font-style: italic;">${rec.notas}</div>` : ''}
                                 </div>`;
                    
                    // Separador <hr> para los elementos que no sean el último de la provincia
                    if (index < grouped[prov].length - 1) {
                        listHTML += `<hr style="border: none; border-top: 1px dashed var(--color-secundario); margin: 0;">`;
                    }
                });
                listHTML += `</div></div>`;
            });

            const cardHTML = `
                <div id="exportable-rec-card" style="background-color: var(--color-blanco); color: var(--color-texto); width: 100%; max-width: 450px; padding: 30px; border-radius: 16px; border: 2px solid var(--color-primario); font-family: sans-serif; box-sizing: border-box; position: relative; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                    <div style="position: absolute; top: -30px; left: -30px; width: 120px; height: 120px; background-color: var(--color-primario); opacity: 0.15; border-radius: 50%;"></div>
                    <div style="position: absolute; bottom: -40px; right: -40px; width: 160px; height: 160px; background-color: var(--color-acento); opacity: 0.15; border-radius: 50%;"></div>
                    
                    <div style="position: relative; z-index: 2;">
                        <h2 style="text-align: center; color: var(--color-primario); margin: 0 0 5px 0; font-size: 1.6rem; text-transform: uppercase;">Reconocimientos</h2>
                        <p style="text-align: center; margin: 0 0 25px 0; font-size: 0.9rem; opacity: 0.8;">Gestión de Pagos JyK</p>
                        
                        <div style="margin-bottom: 20px;">
                            ${listHTML}
                        </div>

                        <div style="text-align: center; margin-top: 30px; font-size: 0.75rem; opacity: 0.6; border-top: 1px solid var(--color-secundario); padding-top: 15px;">
                            Generado el ${new Date().toLocaleDateString('es-CR')}
                        </div>
                    </div>
                </div>
            `;

            tarjetaRecRenderArea.innerHTML = cardHTML;
            tarjetaRecModal.classList.add('visible');
        });

        tarjetaRecCloseBtn.addEventListener('click', () => {
            tarjetaRecModal.classList.remove('visible');
        });

        tarjetaRecDownloadBtn.addEventListener('click', () => {
            const cardElement = document.getElementById('exportable-rec-card');
            if (!cardElement) return;
            
            html2canvas(cardElement, {
                scale: 2, 
                useCORS: true,
                backgroundColor: null 
            }).then(canvas => {
                const link = document.createElement('a');
                link.download = `tarjeta_reconocimientos_${Date.now()}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
                showNotification('Tarjeta exportada exitosamente');
            }).catch(error => {
                console.error('Error al exportar la tarjeta:', error);
                showNotification('Hubo un error al exportar la tarjeta. Inténtalo de nuevo.');
            });
        });
        */

        // --- LÓGICA DE BORRADOR / PERSISTENCIA ---
        function saveDraft() {
            const evento = {
                nombre: eventoNombre.value,
                precio: eventoPrecio.value,
                capacidadCG: eventoCapacidadCG.value,
                capacidadSG: eventoCapacidadSG.value,
                tipoCambio: tipoCambioInput.value,
                moneda: currentCurrency
            };
            const draft = {
                currentEventId,
                evento,
                pagosHTML: document.getElementById('transporte-nacional-list').innerHTML
            };
            localStorage.setItem('PagosAppDraft', JSON.stringify(draft));
        }

        function loadDraft() {
            const draftData = localStorage.getItem('PagosAppDraft');
            if (!draftData) return;
            const draft = JSON.parse(draftData);
            currentEventId = draft.currentEventId || null;
            eventoNombre.value = draft.evento.nombre || '';
            eventoPrecio.value = draft.evento.precio || '0';
            eventoCapacidadCG.value = draft.evento.capacidadCG || '0';
            eventoCapacidadSG.value = draft.evento.capacidadSG || '0';
            tipoCambioInput.value = draft.evento.tipoCambio || '500';
            currencySelector.value = draft.evento.moneda || 'CRC';
            currencySelector.dispatchEvent(new Event('change'));
            document.getElementById('transporte-nacional-list').innerHTML = draft.pagosHTML || '';
            updateAllTotals();
        }

        function clearDraft() {
            localStorage.removeItem('PagosAppDraft');
        }

        function hasUnsavedChanges() {
            return !!localStorage.getItem('PagosAppDraft');
        }

        function showSessionRestoreModal() {
            const modal = document.getElementById('session-restore-modal');
            if (modal) modal.classList.add('visible');
        }

        const sessionRestoreModal = document.getElementById('session-restore-modal');
        const restoreDraftBtn = document.getElementById('restore-draft-btn');
        const discardDraftBtn = document.getElementById('discard-draft-btn');
        if (restoreDraftBtn) {
            restoreDraftBtn.addEventListener('click', () => {
                loadDraft();
                if (sessionRestoreModal) sessionRestoreModal.classList.remove('visible');
            });
        }
        if (discardDraftBtn) {
            discardDraftBtn.addEventListener('click', () => {
                clearDraft();
                if (sessionRestoreModal) sessionRestoreModal.classList.remove('visible');
                currencySelector.dispatchEvent(new Event('change'));
            });
        }

        window.addEventListener('beforeunload', (e) => {
            if (hasUnsavedChanges()) {
                e.preventDefault();
                e.returnValue = 'Tienes cambios sin guardar. ¿Seguro que deseas cerrar?';
            }
        });

        // Llamamos a initializeApp al final de todas las definiciones
        initializeApp();

        // Acordeones mutuamente excluyentes
        document.addEventListener('toggle', (e) => {
            const detail = e.target;
            if (detail.open && detail.tagName === 'DETAILS') {
                const parent = detail.parentElement;
                if (parent) {
                    parent.querySelectorAll(':scope > details').forEach(sibling => {
                        if (sibling !== detail) sibling.open = false;
                    });
                }
            }
        }, true);
        
    });
        

/* __feat_swipe_resumen_collapse */
function renderTablaResumenPagos(){
  const tot=[...document.querySelectorAll('.content-section')].find(s=>s.querySelector('h3.section-title')?.textContent.trim().startsWith('Totales'));
  if(!tot)return;
  let tbl=document.getElementById('tabla-resumen-pagos');
  if(!tbl){tbl=document.createElement('div');tbl.id='tabla-resumen-pagos';tbl.style.cssText='margin-bottom:12px;font-size:80%;';tot.querySelector('.total-display')?.before(tbl);}

  const filas=[...document.querySelectorAll('#transporte-nacional-list .item-card')].filter(card=>{
    const tieneNombre=(card.querySelector('.item-tipo-gasto')?.value||card.querySelector('.item-nombre')?.value||'').trim()!=='';
    const tienePrecio=[...card.querySelectorAll('input')].some(i=>parseFloat(i.value)>0);
    return tieneNombre&&tienePrecio;
  }).map(card=>{
    const selGasto=card.querySelector('.item-tipo-gasto');
    const nombre=selGasto?.value||card.querySelector('.item-nombre')?.value||selGasto?.options[selGasto.selectedIndex]?.text||'(item)';
    const tipo=card.querySelector('.price-type-selector')?.value==='grupal'?'P/G':'P/P';
    const capSG_=parseFloat(document.getElementById("evento-capacidad-sg")?.value)||1;
    const capCG_=parseFloat(document.getElementById("evento-capacidad-cg")?.value)||0;
    const numInputs=[...card.querySelectorAll('input')].filter(i=>parseFloat(i.value)>0);
    const grupalRaw=parseFloat(card.querySelector(".item-price-grupal")?.value)||parseFloat(numInputs[0]?.value)||0;
    const ppRaw=parseFloat(card.querySelector(".item-price-per-person")?.value)||parseFloat(numInputs[0]?.value)||0;
    const pp=tipo==='P/G'?grupalRaw/capSG_:ppRaw*capCG_/capSG_;
    const precio=tipo==='P/G'?grupalRaw:pp*capSG_;
    return {nombre,tipo,monto:Math.round(precio),pp:Math.round(pp)};
  });

  // ===== FLEXBOX RESPONSIVO: columnas por % fijo, totales siempre debajo =====
  const HEAD=['40%','14%','23%','23%'];
  const cell=(i,txt,extra)=>'<div style="flex:0 0 '+HEAD[i]+';min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'+(extra||'')+'">'+txt+'</div>';
  const fila=(cells)=>'<div style="display:flex;width:100%;align-items:center;padding:4px 8px;box-sizing:border-box;border-bottom:1px solid #eee;">'+cells+'</div>';

  const encabezado='<div style="display:flex;width:100%;background:var(--color-primario,#f97316);color:#fff;padding:6px 8px;box-sizing:border-box;border-radius:6px 6px 0 0;font-size:100%;font-weight:bold;">'
    +cell(0,'Tipo de Gasto')+cell(1,'Tipo')+cell(2,'Monto por Pagar','text-align:right')+cell(3,'Precio PP','text-align:right')+'</div>';

  const cuerpo=filas.map(f=>fila(cell(0,f.nombre)+cell(1,f.tipo)+cell(2,f.monto.toLocaleString(),'text-align:right')+cell(3,f.pp.toLocaleString(),'text-align:right'))).join('');

  const sumM=filas.reduce((s,f)=>s+f.monto,0), sumPP=filas.reduce((s,f)=>s+f.pp,0);
  const totales='<hr style="margin:0;border:0;border-top:1px solid var(--color-secundario,#ddd);">'
    +'<div style="display:flex;width:100%;align-items:center;padding:6px 8px;box-sizing:border-box;font-weight:bold;background:#fff8f0;border-radius:0 0 6px 6px;">'
    +cell(0,'TOTAL')+cell(1,'')+cell(2,sumM.toLocaleString(),'text-align:right')+cell(3,sumPP.toLocaleString(),'text-align:right')+'</div>';

  tbl.innerHTML='<div style="display:flex;flex-direction:column;width:100%;background:#fafafa;border-radius:6px;overflow:hidden;box-sizing:border-box;">'+encabezado+cuerpo+totales+'</div>';
}
let _tx=0,_ty=0;
document.addEventListener('touchstart',e=>{_tx=e.changedTouches[0].clientX;_ty=e.changedTouches[0].clientY;},{passive:true});
document.addEventListener('touchend',e=>{
  const dx=e.changedTouches[0].clientX-_tx,dy=e.changedTouches[0].clientY-_ty;
  if(Math.abs(dx)>90&&Math.abs(dy)<60){
    if(dx<0)document.querySelector('.tab-link[data-tab="divisas"]')?.click();
    else document.querySelector('.tab-link[data-tab="nacionales"]')?.click();
  }
},{passive:true});
function initDivisasCollapse(){
  const tab=document.getElementById('tab-divisas');
  if(!tab||tab.dataset.collapsedDone)return;
  tab.dataset.collapsedDone='1';
  const sec=tab.querySelector('.content-section');if(!sec)return;
  const makeHeader=(txt,el)=>{
    const h=document.createElement('h3');
    h.textContent=txt;h.style.cssText='cursor:pointer;display:flex;justify-content:space-between;align-items:center;padding:8px 0;margin:8px 0 0;user-select:none;font-size:1rem;font-weight:bold;color:var(--color-primario,#f97316)';
    const a=document.createElement('span');a.textContent='▾';h.appendChild(a);
    h.onclick=()=>{const on=el.style.display==='none';el.style.display=on?'':'none';a.textContent=on?'▾':'▸';};
    return h;
  };
  const ctrl=document.createElement('div');
  const fxRef=sec.querySelector('#fx-ref'),fxSearch=sec.querySelector('.fx-search');
  if(fxRef)ctrl.appendChild(fxRef);
  const tcw=document.getElementById('tipo-cambio-wrapper');if(tcw)ctrl.appendChild(tcw);
  if(fxSearch)ctrl.appendChild(fxSearch);
  if(ctrl.children.length){sec.insertBefore(makeHeader('Información de las divisas',ctrl),sec.firstChild);sec.insertBefore(ctrl,sec.children[1]);}
}
document.addEventListener('click',e=>{if(e.target.closest('.tab-link[data-tab="divisas"]'))setTimeout(initDivisasCollapse,50);});
if(document.getElementById('tab-divisas')?.classList.contains('active'))setTimeout(initDivisasCollapse,300);

/* secciones colapsables + espaciado compacto */
function initSeccionesColapsables(){
  const estilo=document.createElement('style');
  estilo.textContent='.content-section .form-group{margin-bottom:0.5rem;}.content-section label{margin-bottom:0.2rem;}.sec-col-head{cursor:pointer;user-select:none;display:flex;align-items:center;justify-content:space-between;}';
  document.head.appendChild(estilo);
  document.querySelectorAll('.content-section').forEach(sec=>{
    const h3=sec.querySelector('h3.section-title');
    if(!h3||sec.dataset.colDone)return;
    sec.dataset.colDone='1';
    const header=h3.closest('.section-header')||h3;
    const cuerpo=document.createElement('div');
    cuerpo.className='sec-col-body';
    [...sec.children].slice([...sec.children].indexOf(header)+1).forEach(el=>cuerpo.appendChild(el));
    sec.appendChild(cuerpo);
    // excedentes que quedan visibles aunque la sección esté colapsada
    const titulo=h3.textContent.trim();
    const sacar=(el)=>{if(el&&cuerpo.contains(el)){el.remove();sec.insertBefore(el,cuerpo);}};
    if(titulo==='Información General del Evento'){
      const m=sec.querySelector('#mini-excedente-wrapper');
      if(m){const wrap=document.createElement('div');wrap.style.cssText='padding:4px 0;text-align:right;';wrap.appendChild(m);sec.insertBefore(wrap,cuerpo);}
      const tcw=sec.querySelector('#tipo-cambio-wrapper');if(tcw){sec.insertBefore(tcw,cuerpo);window.__tcwHome={parent:sec,pos:cuerpo};}
    }
    if(titulo==='Totales'){
      const excPP=sec.querySelector('#diferencia-nacionales')?.closest('.total-display');
      const excPPcrc=sec.querySelector('#diferencia-nacionales-crc-wrapper');
      sacar(excPP);if(excPPcrc)sacar(excPPcrc);
      const exc=sec.querySelector('#diferencia-general-nacionales')?.closest('.total-display');
      const excCrc=sec.querySelector('#diferencia-general-nacionales-crc-wrapper');
      sacar(exc);if(excCrc)sacar(excCrc);
    }
    h3.classList.add('sec-col-head');
    const arrow=document.createElement('span');
    arrow.textContent='▾';
    h3.appendChild(arrow);
    h3.onclick=(e)=>{e.stopPropagation();const on=cuerpo.style.display==='none';cuerpo.style.display=on?'':'none';arrow.textContent=on?'▾':'▸';};
  });
}
document.addEventListener('DOMContentLoaded',initSeccionesColapsables);
setTimeout(initSeccionesColapsables,500);

/* __colapsar_todos */
document.addEventListener('click',e=>{
  const btn=e.target.closest('#colapsar-todos-pagos');
  if(!btn)return;
  const cards=document.querySelectorAll('#transporte-nacional-list .item-card');
  const algunaAbierta=[...cards].some(c=>!c.classList.contains('collapsed'));
  cards.forEach(c=>{
    c.classList.toggle('collapsed',algunaAbierta);
    const b=c.querySelector('.btn-collapse-item');if(b)b.textContent=algunaAbierta?'Mostrar':'Ocultar';
  });
  const i=btn.querySelector('i');if(i)i.className=algunaAbierta?'fas fa-expand-alt':'fas fa-compress-alt';
});
