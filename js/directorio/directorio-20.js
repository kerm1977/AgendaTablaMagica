/* ARCHIVO: js/directorio/directorio-20.js */

        // Construye el texto de WhatsApp de un contacto incluyendo SIEMPRE todos
        // los campos; los que estén vacíos se muestran como "Sin registrar".
        function generarTextoDirectorio(persona) {
            if (!persona) return '';
            const sr = (valor) => {
                const v = (valor === null || valor === undefined) ? '' : valor.toString().trim();
                return v !== '' ? v : 'Sin registrar';
            };
            const tipo = persona.tipo || 'Persona';
            const esPersona = tipo === 'Persona';
            const esCamino = tipo === 'El Camino de Costa Rica';
            const ocultarContacto = !esPersona && ['Parque Nacional', 'Bosque Nuboso', 'Reserva Biológica'].includes(tipo);

            let texto = `*${sr(persona.nombre)}*\n`;
            texto += `Grupo: ${sr(tipo)}\n`;
            if (esCamino) {
                texto += `Etapa: ${sr(persona.etapaCamino)}\n`;
                texto += `Nombre del lugar: ${sr(persona.lugar)}\n`;
                texto += `Nombre de contacto: ${sr(persona.nombreContacto)}\n`;
            } else if (!esPersona) {
                texto += `País: ${sr(persona.pais || 'Costa Rica')}\n`;
                texto += `Lugar: ${sr(persona.lugar)}\n`;
            }
            if (esPersona) {
                texto += `Cédula: ${sr(persona.cedula)}\n`;
                texto += `Pasaporte: ${sr(persona.pasaporte)}\n`;
            }
            texto += `Teléfono: ${sr(persona.telefono)}\n`;
            if (!esPersona && !esCamino && persona.telefono2) texto += `Teléfono 2: ${sr(persona.telefono2)}\n`;
            if (!esPersona && !esCamino && persona.telefono3) texto += `Teléfono 3: ${sr(persona.telefono3)}\n`;
            texto += `Correo electrónico: ${sr(persona.correo)}\n`;
            if (esPersona) {
                texto += `Fecha de nacimiento: ${sr(persona.fechaNacimiento)}\n`;
                texto += `Tipo de sangre: ${sr(persona.tipoSangre)}\n`;
                texto += `Contacto de emergencia: ${sr(persona.contactoEmergenciaNombre)}\n`;
                texto += `Teléfono de emergencia: ${sr(persona.telefonoEmergencia)}\n`;
            } else if (!esCamino) {
                if (!ocultarContacto) texto += `Nombre de contacto: ${sr(persona.nombreContacto)}\n`;
                if (!ocultarContacto) texto += `Teléfono de contacto: ${sr(persona.telefonoContacto)}\n`;
                texto += `URL de Google Maps: ${sr(persona.urlMapa)}\n`;
                if (persona.horario) texto += `Horario de atención: ${sr(persona.horario)}\n`;
                if (persona.terreno && persona.terreno.length) texto += `Terreno: ${persona.terreno.join(', ')}\n`;
                if (persona.precio) texto += `Precio de ingreso: ₡${persona.precio} por persona\n`;
            }
            texto += `Notas: ${sr(persona.notas)}\n`;
            return texto.trim();
        }


        function compartirWhatsAppDirectorio() {
            if (!directorioEnEdicion) return;
            const waLink = enlaceWhatsAppDirectorio(directorioEnEdicion.telefono);
            if (waLink) {
                window.open(waLink, '_blank');
            } else {
                const texto = generarTextoDirectorio(directorioEnEdicion);
                window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
            }
        }


        function dosPalabrasNombre(nombre) {
            const partes = (nombre || '').toLowerCase().trim().split(/\s+/).filter(w => w);
            return partes.slice(0, 2).join(' ');
        }


        async function buscarSimilitudesDuplicados() {
            if (directorioPersonas.length < 2) {
                showToast('No hay suficientes contactos para comparar', 'warning');
                return;
            }

            const gruposNombre = {};
            const duplicadosCedula = [];
            const duplicadosPasaporte = [];
            const duplicadosTelefono = [];

            directorioPersonas.forEach(p => {
                const clave = dosPalabrasNombre(p.nombre);
                if (!clave) return;
                if (!gruposNombre[clave]) gruposNombre[clave] = [];
                gruposNombre[clave].push(p);
            });

            const gruposNombreDup = Object.values(gruposNombre).filter(g => g.length > 1);
            const contactosPorNombre = new Set();
            gruposNombreDup.forEach(g => g.forEach(p => contactosPorNombre.add(p.id)));

            const encontrarDuplicados = (campo) => {
                const mapa = {};
                directorioPersonas.forEach(p => {
                    const val = (p[campo] || '').trim().toLowerCase();
                    if (!val) return;
                    if (!mapa[val]) mapa[val] = [];
                    mapa[val].push(p);
                });
                return Object.values(mapa).filter(g => g.length > 1);
            };

            const gruposCedula = encontrarDuplicados('cedula');
            const gruposPasaporte = encontrarDuplicados('pasaporte');
            const gruposTelefono = encontrarDuplicados('telefono');

            const totalNombres = contactosPorNombre.size;
            const totalCedulas = gruposCedula.reduce((acc, g) => acc + g.length, 0);
            const totalPasaportes = gruposPasaporte.reduce((acc, g) => acc + g.length, 0);
            const totalTelefonos = gruposTelefono.reduce((acc, g) => acc + g.length, 0);
            const totalDuplicados = totalNombres + totalCedulas + totalPasaportes + totalTelefonos;

            if (totalDuplicados === 0) {
                showToast('No se encontraron similitudes ni duplicados', 'success');
                return;
            }

            const detalles = [];
            if (totalNombres > 0) detalles.push(`${totalNombres} por nombre`);
            if (totalCedulas > 0) detalles.push(`${totalCedulas} por cédula`);
            if (totalPasaportes > 0) detalles.push(`${totalPasaportes} por pasaporte`);
            if (totalTelefonos > 0) detalles.push(`${totalTelefonos} por teléfono`);

            const mensaje = `Se encontraron ${totalDuplicados} contactos duplicados:\n${detalles.join('\n')}\n\n¿Querés fusionarlos ahora?`;

            showConfirm(
                'Duplicados encontrados',
                mensaje,
                async () => await fusionarSimilitudesDuplicados(gruposNombreDup, gruposCedula, gruposPasaporte, gruposTelefono),
                'Fusionar',
                'btn-warning'
            );
        }

