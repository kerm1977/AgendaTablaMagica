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


        function asignarNombreDesdeEtapa() {
            const etapa = document.getElementById('cam-etapa');
            const nombre = document.getElementById('cam-nombre');
            if (etapa.value && document.getElementById('cam-actividad').value === 'El Camino de Costa Rica') {
                nombre.value = etapa.value;
                asignarProvinciaPorEtapa(etapa.value);
            }
        }


        function asignarProvinciaPorEtapa(etapa) {
            const limon = ['Etapa 1A', 'Etapas 1A y B', 'Etapa 2', 'Etapa 3 y 4'];
            const cartago = ['Etapa 5', 'Etapa 6', 'Etapa 7', 'Etapa 8', 'Etapa 9', 'Etapa 10', 'Etapa 11'];
            const sanJose = ['Etapa 12', 'Etapa 13'];
            const puntarenas = ['Etapas 13 y 14', 'Etapa 14', 'Etapa 15', 'Etapa 16 (Final)'];

            let provincia = '';
            if (limon.includes(etapa)) provincia = 'Limón';
            else if (cartago.includes(etapa)) provincia = 'Cartago';
            else if (sanJose.includes(etapa)) provincia = 'San José';
            else if (puntarenas.includes(etapa)) provincia = 'Puntarenas';

            if (provincia) asegurarOpcionProvincia(provincia);
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

