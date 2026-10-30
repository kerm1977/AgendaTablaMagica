/* ==========================================================================
 * ARCHIVO: js/listas/caminata-fechas.js — extraído del monolito (bloque LISTAS/CAMINATAS)
 * Funciones: formatDateString, formatDateStringShort, actualizarSugerenciasCaminatas, cargarSugerenciaCaminata, formatNameAndSearch
 * ========================================================================== */

        // Formato: 15 de Octubre de 2024
        function formatDateString(isoString) {
            if(!isoString) return "";
            const [year, month, day] = isoString.split('-');
            return `${parseInt(day, 10)} de ${MESES[parseInt(month, 10)-1]} del ${year}`;
        }

        
        // Formato corto: 15 Oct 2024
        function formatDateStringShort(isoString) {
            if(!isoString) return "";
            const [year, month, day] = isoString.split('-');
            return `${parseInt(day, 10)} ${MESES[parseInt(month, 10)-1].substring(0,3)} ${year}`;
        }


        // --- SUGERENCIAS DE CAMINATAS ---
        function actualizarSugerenciasCaminatas() {
            const datalist = document.getElementById('sug-caminatas');
            if (!datalist) return;
            datalist.innerHTML = '';

            const nombres = new Set();
            preciosBuseta.forEach(p => nombres.add(p.nombre));
            caminatas.forEach(c => nombres.add(c.nombre));

            nombres.forEach(nombre => {
                const option = document.createElement('option');
                option.value = nombre;
                datalist.appendChild(option);
            });
        }


        function cargarSugerenciaCaminata(input) {
            const nombre = input.value.trim();
            if (!nombre) return;

            const precio = preciosBuseta.find(p => p.nombre.toLowerCase() === nombre.toLowerCase());
            if (precio) {
                if (precio.provincia) document.getElementById('cam-provincia').value = precio.provincia;
                if (precio.monto && document.getElementById('cam-precio-buseta')) {
                    document.getElementById('cam-precio-buseta').value = precio.monto;
                }
                actualizarMonedaPorTipoPrecio();
                toggleDateFields();
                return;
            }

            const cam = caminatas.find(c => c.nombre.toLowerCase() === nombre.toLowerCase());
            if (cam) {
                if (cam.provincia) document.getElementById('cam-provincia').value = cam.provincia;
                actualizarMonedaPorTipoPrecio();
            }
        }


        // --- STREAMING_CHUNK: Caminantes Management ---
        function formatNameAndSearch(input) {
            const rawValue = input.value;
            const errorMsg = document.getElementById('name-error');
            
            // Validación: Solo letras y espacios
            const validRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/;
            if (!validRegex.test(rawValue)) {
                errorMsg.style.display = 'block';
                // Eliminar caracteres inválidos
                input.value = rawValue.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
            } else {
                errorMsg.style.display = 'none';
            }

            // Title Case: Primera letra mayúscula
            let words = input.value.split(' ');
            for (let i = 0; i < words.length; i++) {
                if (words[i]) {
                    words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1).toLowerCase();
                }
            }
            input.value = words.join(' ');

            // Autocompletado (Buscar en base global + directorio)
            const query = input.value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
            const suggList = document.getElementById('suggestions-list');
            const normN = n => String(n || '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
            if (query.length >= 1) {
                const cam = caminatas.find(c => c.id === currentCaminataId);
                const enLista = new Set((cam && cam.pasajeros ? cam.pasajeros.map(p => normN(p.nombre)) : []));
                const base = new Set(personasGlobales.filter(Boolean));
                directorioPersonas.forEach(p => { if (p && p.nombre) base.add(p.nombre); });
                const matches = Array.from(base)
                    .filter(n => normN(n).includes(query) && n !== input.value)
                    .sort((a, b) => {
                        const aI = normN(a).startsWith(query) ? 0 : 1;
                        const bI = normN(b).startsWith(query) ? 0 : 1;
                        return aI - bI || a.localeCompare(b);
                    });
                suggList.innerHTML = '';
                if (matches.length > 0) {
                    matches.slice(0, 8).forEach(match => {
                        const ya = enLista.has(normN(match));
                        const li = document.createElement('li');
                        li.className = 'list-group-item list-group-item-action py-2 px-3 small' + (ya ? ' text-muted' : '');
                        li.innerHTML = ya ? escapeHtml(match) + ' <span class="badge bg-secondary ms-1">ya está en la lista</span>' : escapeHtml(match);
                        if (!ya) {
                            li.onclick = () => {
                                input.value = match;
                                suggList.style.display = 'none';
                            };
                        } else {
                            li.style.cursor = 'default';
                        }
                        suggList.appendChild(li);
                    });
                    suggList.style.display = 'block';
                } else {
                    suggList.style.display = 'none';
                }
            } else {
                suggList.style.display = 'none';
            }
        }

