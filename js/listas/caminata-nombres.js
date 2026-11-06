/* ==========================================================================
 * ARCHIVO: js/listas/caminata-nombres.js — extraído del monolito (bloque LISTAS/CAMINATAS)
 * Funciones: asignarNombreDesdeParque, asegurarOpcionProvincia, asignarNombreDesdeEtapa, asignarProvinciaPorEtapa, toggleDateFields
 * ========================================================================== */

        function asignarNombreDesdeParque(guardarNombre = true) {
            const parque = document.getElementById('cam-parque');
            const nombre = document.getElementById('cam-nombre');
            if (parque.value && document.getElementById('cam-actividad').value === 'Parque Nacional') {
                const dato = PARQUES_NACIONALES.find(p => p.nombre === parque.value);
                if (dato) {
                    if (guardarNombre) nombre.value = dato.nombre;
                    asegurarOpcionProvincia(dato.provincia);
                }
            }
        }


        function asegurarOpcionProvincia(provincia) {
            const select = document.getElementById('cam-provincia');
            if (!select || !provincia) return;
            let option = Array.from(select.options).find(o => o.value === provincia);
            if (!option) {
                option = document.createElement('option');
                option.value = provincia;
                option.innerText = provincia;
                select.appendChild(option);
            }
            select.value = provincia;

            const pais = document.getElementById('cam-pais');
            if (pais) {
                let optPais = Array.from(pais.options).find(o => o.value === provincia);
                if (!optPais) {
                    optPais = document.createElement('option');
                    optPais.value = provincia;
                    optPais.innerText = provincia;
                    pais.appendChild(optPais);
                }
            }
        }


        // Datos oficiales de las etapas del Camino de Costa Rica:
        // nombre de la etapa (ruta), distancia en km y dificultad.
        const ETAPAS_CAMINO = {
            'Etapa 1A':         { nombre: 'Parismina a Laguna Perlas',                 km: '5.13',  dificultad: 'Fácil' },
            'Etapa 1B':         { nombre: 'Muelle Goshen a Cimarrones',                km: '24.2',  dificultad: 'Moderada-Difícil' },
            'Etapas 1A y 1B':   { nombre: 'Parismina a Cimarrones',                    km: '29.33', dificultad: 'Moderada-Difícil' },
            'Etapa 2':          { nombre: 'Cimarrones a Brisas de Pacuarito',          km: '15.9',  dificultad: 'Difícil' },
            'Etapa 3':          { nombre: 'Brisas de Pacuarito a Tsiobata',            km: '15.5',  dificultad: 'Muy difícil' },
            'Etapa 4':          { nombre: 'Tsiobata a Hacienda Tres Equis',            km: '6.85',  dificultad: 'Difícil' },
            'Etapas 3 y 4':     { nombre: 'Brisas de Pacuarito a Hacienda Tres Equis', km: '22.35', dificultad: 'Muy difícil' },
            'Etapa 5':          { nombre: 'Hacienda Tres Equis a Pacayitas',           km: '13.30', dificultad: 'Moderada' },
            'Etapa 6':          { nombre: 'Pacayitas a La Suiza',                      km: '12.58', dificultad: 'Moderada' },
            'Etapa 7':          { nombre: 'La Suiza a El Humo de Pejibaye',            km: '18.68', dificultad: 'Difícil' },
            'Etapa 8':          { nombre: 'Humo de Pejibaye a Tapantí',                km: '16.58', dificultad: 'Difícil' },
            'Etapa 9':          { nombre: 'Tapantí a Navarro de Muñeco',               km: '24.40', dificultad: 'Difícil' },
            'Etapa 10':         { nombre: 'Navarro de Muñeco a Palo Verde',            km: '11.89', dificultad: 'Difícil' },
            'Etapa 11':         { nombre: 'Palo Verde a Cerro Alto',                   km: '8.90',  dificultad: 'Difícil' },
            'Etapa 12':         { nombre: 'Cerro Alto a San Pablo de León Cortés',     km: '18.36', dificultad: 'Moderada' },
            'Etapa 13':         { nombre: 'San Pablo de León Cortés a Nápoles',        km: '18.60', dificultad: 'Difícil' },
            'Etapa 14':         { nombre: 'Nápoles a Naranjillo',                      km: '13.35', dificultad: 'Fácil' },
            'Etapa 15':         { nombre: 'Naranjillo a Esquipulas',                   km: '12.1',  dificultad: 'Moderada' },
            'Etapas 14 y 15':   { nombre: 'Nápoles a Esquipulas',                      km: '25.38', dificultad: 'Difícil' },
            'Etapa 16 (Final)': { nombre: 'Esquipulas a Quepos',                       km: '22.72', dificultad: 'Moderada' }
        };

        // pinta el nombre de la etapa y, si completar=true, autollenado de
        // dificultad y km (al ELEGIR la etapa — al abrir una caminata
        // guardada solo se muestra el nombre, nunca se toca lo guardado)
        function aplicarDatosEtapa(etapaVal, completar) {
            const info = ETAPAS_CAMINO[etapaVal];
            const nomEl = document.getElementById('cam-etapa-nombre');
            if (nomEl) nomEl.value = info ? info.nombre : '';
            if (!info || !completar) return;
            const dif = document.getElementById('cam-dificultad');
            if (dif && info.dificultad) {
                let opt = Array.from(dif.options).find(o => o.value === info.dificultad);
                if (!opt) {
                    opt = document.createElement('option');
                    opt.value = opt.innerText = info.dificultad;
                    dif.appendChild(opt);
                }
                dif.value = info.dificultad;
            }
            const km = document.getElementById('cam-kilometros');
            if (km) km.value = info.km;
        }

        function asignarNombreDesdeEtapa() {
            const etapa = document.getElementById('cam-etapa');
            const nombre = document.getElementById('cam-nombre');
            if (etapa.value && document.getElementById('cam-actividad').value === 'El Camino de Costa Rica') {
                nombre.value = etapa.value;
                asignarProvinciaPorEtapa(etapa.value);
                aplicarDatosEtapa(etapa.value, true);
            } else {
                aplicarDatosEtapa('', false);
            }
        }


        function provinciaDeEtapa(etapa) {
            const limon = ['Etapa 1A', 'Etapa 1B', 'Etapas 1A y 1B', 'Etapa 2', 'Etapa 3'];
            const cartago = ['Etapa 4', 'Etapa 5', 'Etapa 6', 'Etapa 7', 'Etapa 8', 'Etapa 9', 'Etapa 10', 'Etapa 11'];
            const sanJose = ['Etapa 13'];
            const puntarenas = ['Etapa 16 (Final)'];
            if (limon.includes(etapa)) return 'Limón';
            if (cartago.includes(etapa)) return 'Cartago';
            if (sanJose.includes(etapa)) return 'San José';
            if (etapa === 'Etapas 3 y 4') return 'Limón - Cartago';
            if (etapa === 'Etapa 12') return 'Cartago - San José';
            if (etapa === 'Etapa 14' || etapa === 'Etapa 15' ||
                etapa === 'Etapas 14 y 15') return 'San José - Puntarenas';
            if (puntarenas.includes(etapa)) return 'Puntarenas';
            return '';
        }

        function asignarProvinciaPorEtapa(etapa) {
            const provincia = provinciaDeEtapa(etapa);
            if (provincia) asegurarOpcionProvincia(provincia);
        }

        // ---------- Modal: lista completa del Camino de Costa Rica ---------
        function mostrarListaCamino() {
            let ov = document.getElementById('camino-lista-overlay');
            if (ov) ov.remove();
            const filas = Object.keys(ETAPAS_CAMINO).map(function (k) {
                const i = ETAPAS_CAMINO[k];
                return '<div style="padding:10px 2px">' +
                    '<div style="font-size:.95rem"><b>' + k + '</b> — ' +
                    i.nombre + '</div>' +
                    '<div style="font-size:.82rem;color:#6b7280;margin-top:2px">' +
                    provinciaDeEtapa(k) + ' · ' + i.dificultad + ' · ' +
                    i.km + ' km</div></div><hr style="margin:0;opacity:.18">';
            }).join('');
            ov = document.createElement('div');
            ov.id = 'camino-lista-overlay';
            ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);' +
                'display:flex;align-items:center;justify-content:center;' +
                'z-index:10000;padding:14px';
            ov.innerHTML =
                '<div style="background:#fff;border-radius:14px;max-width:480px;' +
                'width:100%;max-height:86vh;display:flex;flex-direction:column;' +
                'overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,.4)">' +
                '<div id="camino-lista-body" style="overflow-y:auto;padding:18px">' +
                '<h6 class="fw-bold text-center mb-1">El Camino de Costa Rica — Etapas</h6>' +
                '<div>' + filas + '</div></div>' +
                '<div class="d-flex gap-2 p-3 border-top">' +
                '<button class="btn btn-sm btn-success flex-fill" onclick="exportarListaCaminoPNG()">' +
                '<i class="fas fa-file-image me-1"></i> Exportar PNG</button>' +
                '<button class="btn btn-sm btn-outline-secondary flex-fill" onclick="document.getElementById(\'camino-lista-overlay\').remove()">' +
                'Cerrar</button></div></div>';
            document.body.appendChild(ov);
            ov.addEventListener('click', function (e) {
                if (e.target === ov) ov.remove();
            });
        }

        function exportarListaCaminoPNG() {
            const el = document.getElementById('camino-lista-body');
            if (!el || typeof html2canvas !== 'function') return;
            html2canvas(el, { backgroundColor: '#ffffff', scale: 2 })
                .then(function (cv) {
                    const data = cv.toDataURL('image/png');
                    const b64 = data.split(',')[1];
                    const nombre = 'camino-costa-rica-etapas.png';
                    if (window.TribuShare && TribuShare.sharePng) {
                        TribuShare.sharePng(b64, nombre);
                    } else {
                        const a = document.createElement('a');
                        a.href = data; a.download = nombre;
                        document.body.appendChild(a); a.click(); a.remove();
                    }
                })
                .catch(function (e) { showToast('No se pudo exportar', 'danger'); });
        }


        function toggleDateFields() {
            const esInternacional = document.getElementById('cam-actividad').value === 'Internacional';
            const localDiv = document.getElementById('fecha-local-container');
            const intDiv = document.getElementById('fecha-internacional-container');

            if (!esInternacional) {
                localDiv.style.display = 'block';
                document.getElementById('cam-fecha-local').required = true;

                intDiv.style.display = 'none';
                document.getElementById('cam-fecha-ida').required = false;
                document.getElementById('cam-fecha-regreso').required = false;
            } else {
                localDiv.style.display = 'none';
                document.getElementById('cam-fecha-local').required = false;

                intDiv.style.display = 'block';
                document.getElementById('cam-fecha-ida').required = true;
                document.getElementById('cam-fecha-regreso').required = true;
            }
        }

