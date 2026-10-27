/* ARCHIVO: js/directorio/directorio-01.js */
        // === INICIO BLOQUE MODULAR PROTEGIDO: DIRECTORIO ===
        // --- STREAMING_CHUNK: Directorio y Multiselección ---
        // FLASK: Módulo de CRUD de directorio. CRÍTICO: verInformacionContacto,
        //        editarDesdeVerDirectorio, exportarVerContactoWhatsApp y
        //        borrarDirectorio tienen onclick en tarjetas/modales. El buscador
        //        'search-directorio' filtra en cliente; en Flask mover lógica al
        //        backend o conservar búsqueda con JS sobre datos precargados.
        function initDirectorioView() {
            // Refuerzo defensivo: asegurar que el botón flotante (+) quede oculto
            // en esta vista sin importar cómo se llegó a ella.
            const fabBtn = document.getElementById('main-fab');
            if (fabBtn) fabBtn.style.display = 'none';

            const titulo = document.getElementById('titulo-view-directorio');
            const total = document.getElementById('directorio-total');
            if (titulo && total) {
                titulo.innerHTML = `${configTema.tituloDirectorio || TITULO_DIRECTORIO_DEFECTO} `;
                titulo.appendChild(total);
            }

            const barra = document.getElementById('directorio-agregar-lista-bar');
            if (barra) barra.style.display = currentCaminataId ? 'flex' : 'none';
            filterDirectorio();
        }


        function filterDirectorio() {
            const search = document.getElementById('search-directorio').value;
            renderDirectorioList(search);
        }

        function openAgregarDirectorioModal(persona = null) {
            directorioEnEdicion = persona;
            document.getElementById('directorio-editar-id').value = persona ? persona.id : '';
            document.getElementById('directorio-nombre').value = persona ? persona.nombre : '';
            document.getElementById('directorio-cedula').value = persona ? (persona.cedula || '') : '';
            document.getElementById('directorio-pasaporte').value = persona ? (persona.pasaporte || '') : '';
            document.getElementById('directorio-telefono').value = persona ? (persona.telefono || '') : '';
            document.getElementById('directorio-correo').value = persona ? (persona.correo || '') : '';
            document.getElementById('directorio-nacimiento').value = persona ? (persona.fechaNacimiento || '') : '';
            document.getElementById('directorio-tipo-sangre').value = persona ? (persona.tipoSangre || '') : '';
            document.getElementById('directorio-nivel').value = persona ? (persona.nivel || '') : '';
            document.getElementById('directorio-contacto-emergencia-nombre').value = persona ? (persona.contactoEmergenciaNombre || '') : '';
            document.getElementById('directorio-telefono-emergencia').value = persona ? (persona.telefonoEmergencia || '') : '';
            document.getElementById('directorio-notas').value = persona ? (persona.notas || '') : '';
            document.getElementById('directorio-tipo').value = persona ? (persona.tipo || 'Persona') : 'Persona';
            document.getElementById('directorio-pais').value = persona ? (persona.pais || 'Costa Rica') : 'Costa Rica';
            const paisCargado = persona ? (persona.pais || 'Costa Rica') : 'Costa Rica';
            document.getElementById('directorio-lugar').value = (persona && paisCargado === 'Costa Rica') ? (persona.lugar || '') : '';
            document.getElementById('directorio-lugar-texto').value = (persona && paisCargado !== 'Costa Rica') ? (persona.lugar || '') : '';

            // Campos de El Camino de Costa Rica
            document.getElementById('directorio-etapa').value = persona ? (persona.etapaCamino || '') : '';
            document.getElementById('directorio-lugar-camino').value = (persona && persona.tipo === 'El Camino de Costa Rica') ? (persona.lugar || '') : '';

            // Campos de lugares / organizaciones
            document.getElementById('directorio-telefono2').value = persona ? (persona.telefono2 || '') : '';
            document.getElementById('directorio-telefono3').value = persona ? (persona.telefono3 || '') : '';
            document.getElementById('directorio-nombre-contacto').value = persona ? (persona.nombreContacto || '') : '';
            document.getElementById('directorio-telefono-contacto').value = persona ? (persona.telefonoContacto || '') : '';
            document.getElementById('directorio-url-mapa').value = persona ? (persona.urlMapa || '') : '';
            document.getElementById('directorio-horario').value = persona ? (persona.horario || '') : '';
            document.getElementById('directorio-precio').value = persona ? (persona.precio || '') : '';

            const terreno = persona ? (persona.terreno || []) : [];
            marcarTerrenoDirectorio(terreno);

            document.getElementById('agregar-directorio-titulo').innerText = persona ? 'Editar contacto' : 'Agregar contacto';
            const exportarDiv = document.getElementById('directorio-exportar');
            if (exportarDiv) exportarDiv.className = persona ? 'd-flex flex-column gap-2 px-3 pb-2' : 'd-none';
            toggleCamposDirectorioPorTipo();
            modalAgregarDirectorio.show();
        }


        // --- VALIDACIONES DE CAMPOS ---
        // Campos "nombre": solo letras y espacios (sin números ni caracteres especiales)
        function soloLetrasInput(input) {
            const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/;
            if (!regex.test(input.value)) {
                input.value = input.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
            }
        }


        // Campos "teléfono": solo números (sin letras, espacios ni caracteres especiales)
        function soloNumerosInput(input) {
            input.value = input.value.replace(/[^0-9]/g, '');
        }


        // Campos "correo electrónico": sin mayúsculas
        function soloMinusculasInput(input) {
            const cursor = input.selectionStart;
            input.value = input.value.toLowerCase();
            input.setSelectionRange(cursor, cursor);
        }


        function toggleTerrenoDirectorio(btn) {
            btn.classList.toggle('active');
            btn.classList.toggle('btn-primary');
            btn.classList.toggle('btn-outline-secondary');
        }


        function terrenoDirectorioSeleccionado() {
            const btns = document.querySelectorAll('#directorio-terreno-botones .terreno-btn.active');
            return Array.from(btns).map(b => b.dataset.value);
        }


        function marcarTerrenoDirectorio(valores = []) {
            document.querySelectorAll('#directorio-terreno-botones .terreno-btn').forEach(btn => {
                const activo = valores.includes(btn.dataset.value);
                btn.classList.toggle('active', activo);
                btn.classList.toggle('btn-primary', activo);
                btn.classList.toggle('btn-outline-secondary', !activo);
            });
        }


        function toggleCamposDirectorioPorTipo() {
            const tipo = document.getElementById('directorio-tipo').value;
            const pais = document.getElementById('directorio-pais').value;
            const esPersona = tipo === 'Persona';
            const esCamino = tipo === 'El Camino de Costa Rica';
            const esCostaRica = pais === 'Costa Rica';
            const ocultarContacto = ['Parque Nacional', 'Bosque Nuboso', 'Reserva Biológica'].includes(tipo);

            const campoPais = document.getElementById('directorio-campo-pais');
            const campoLugar = document.getElementById('directorio-campo-lugar');
            const campoLugarTexto = document.getElementById('directorio-campo-lugar-texto');
            const camposPersona = document.getElementById('directorio-campos-persona');
            const camposLugar = document.getElementById('directorio-campos-lugar');
            const camposCamino = document.getElementById('directorio-campos-camino');
            const camposContacto = document.getElementById('directorio-campos-contacto-entidad');
            const telefonoLabel = document.getElementById('directorio-telefono-label');

            // Usamos classList (d-none) en vez de style.display para que no
            // choque con el !important de las utilidades de Bootstrap.
            if (campoPais) campoPais.classList.toggle('d-none', esPersona || esCamino);
            if (camposPersona) camposPersona.classList.toggle('d-none', !esPersona);
            if (camposLugar) camposLugar.classList.toggle('d-none', esPersona || esCamino);
            if (camposCamino) camposCamino.classList.toggle('d-none', !esCamino);
            if (camposContacto) camposContacto.classList.toggle('d-none', ocultarContacto);
            if (telefonoLabel) telefonoLabel.innerText = esPersona ? 'Teléfono' : 'Teléfono principal';

            if (esPersona) {
                if (campoLugar) campoLugar.classList.add('d-none');
                if (campoLugarTexto) campoLugarTexto.classList.add('d-none');
            } else if (esCostaRica && !esCamino) {
                if (campoLugar) campoLugar.classList.remove('d-none');
                if (campoLugarTexto) campoLugarTexto.classList.add('d-none');
            } else if (!esCamino) {
                if (campoLugar) campoLugar.classList.add('d-none');
                if (campoLugarTexto) campoLugarTexto.classList.remove('d-none');
            }
        }


        function validarDuplicadoDirectorio(nombre, cedula, pasaporte, telefono, correo, idExcluir = '') {
            const n = (nombre || '').toLowerCase().trim();
            const c = (cedula || '').toLowerCase().trim();
            const pas = (pasaporte || '').toLowerCase().trim();
            const t = (telefono || '').toLowerCase().trim();
            const m = (correo || '').toLowerCase().trim();

            // Función para obtener primeras dos palabras
            const dosPalabras = (texto) => {
                const partes = texto.split(/\s+/).filter(w => w);
                return partes.slice(0, 2).join(' ');
            };

            const n2 = dosPalabras(n);

            // Duplicado por nombre: igual completo o mismo primeras dos palabras
            const duplicadoNombre = n && directorioPersonas.find(p => {
                if (p.id === idExcluir) return false;
                const pn = (p.nombre || '').toLowerCase().trim();
                const pn2 = dosPalabras(pn);
                return pn === n || pn2 === n2;
            });
            if (duplicadoNombre) {
                return { tipo: 'nombre similar', valor: duplicadoNombre.nombre };
            }

            // Duplicado por cédula
            const duplicadoCedula = c && directorioPersonas.find(p => p.id !== idExcluir && (p.cedula || '').toLowerCase() === c);
            if (duplicadoCedula) return { tipo: 'cédula', valor: duplicadoCedula.nombre || duplicadoCedula.cedula };

            // Duplicado por pasaporte
            const duplicadoPasaporte = pas && directorioPersonas.find(p => p.id !== idExcluir && (p.pasaporte || '').toLowerCase() === pas);
            if (duplicadoPasaporte) return { tipo: 'pasaporte', valor: duplicadoPasaporte.nombre || duplicadoPasaporte.pasaporte };

            // Duplicado por teléfono
            const duplicadoTelefono = t && directorioPersonas.find(p => p.id !== idExcluir && (p.telefono || '').toLowerCase() === t);
            if (duplicadoTelefono) return { tipo: 'teléfono', valor: duplicadoTelefono.nombre || duplicadoTelefono.telefono };

            // Duplicado por correo
            const duplicadoCorreo = m && directorioPersonas.find(p => p.id !== idExcluir && (p.correo || '').toLowerCase() === m);
            if (duplicadoCorreo) return { tipo: 'correo', valor: duplicadoCorreo.nombre || duplicadoCorreo.correo };

            return null;
        }

