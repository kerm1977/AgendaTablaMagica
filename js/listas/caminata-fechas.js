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

            // Autocompletado (Buscar en base global)
            const query = input.value.toLowerCase().trim();
            const suggList = document.getElementById('suggestions-list');
            
            if (query.length > 1) {
                const matches = personasGlobales.filter(p => p.toLowerCase().includes(query) && p !== input.value);
                suggList.innerHTML = '';
                if(matches.length > 0) {
                    matches.slice(0, 5).forEach(match => { // max 5
                        const li = document.createElement('li');
                        li.className = 'list-group-item list-group-item-action py-2 px-3 small';
                        li.innerText = match;
                        li.onclick = () => {
                            input.value = match;
                            suggList.style.display = 'none';
                        };
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

