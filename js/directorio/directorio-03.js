/* ARCHIVO: js/directorio/directorio-03.js */

        function borrarDirectorio(id) {
            const persona = directorioPersonas.find(p => p.id === id);
            const nombre = persona ? persona.nombre : '';
            showConfirm(
                "Eliminar (1/3)",
                `¿Estás seguro de que deseas borrar a "${nombre}" del directorio global? (No se borrará de las caminatas donde ya esté agregado)`,
                () => {
                    setTimeout(() => {
                        showConfirm(
                            "Eliminar (2/3)",
                            "Esta acción borra el registro del directorio. ¿Continuar?",
                            () => {
                                setTimeout(() => {
                                    showConfirm(
                                        "Eliminar (3/3)",
                                        "Una vez eliminado, el registro no se puede recuperar. ¿Confirmar?",
                                        async () => {
                                            directorioPersonas = directorioPersonas.filter(p => p.id !== id);
                                            personasGlobales = personasGlobales.filter(p => p !== nombre);
                                            await saveData();
                                            renderDirectorioList(document.getElementById('search-directorio').value);
                                            showToast("Persona eliminada del directorio");
                                        },
                                        "Sí, eliminar",
                                        "btn-danger"
                                    );
                                }, 350);
                            },
                            "Continuar",
                            "btn-danger"
                        );
                    }, 350);
                },
                "Continuar",
                "btn-danger"
            );
        }


        function iconoTipoDirectorio(tipo) {
            return ICONOS_DIRECTORIO[tipo] || 'fa-user';
        }


        function colorTipoDirectorio(tipo) {
            const map = {
                'Restaurante': '#dc2626',
                'Transporte Terrestre': '#2563eb',
                'Lancha': '#0891b2',
                'Hotel': '#7c3aed',
                'Cabina': '#0d9488',
                'Guía': '#ea580c',
                'Finca': '#65a30d',
                'Parque Nacional': '#15803d',
                'Bosque Nuboso': '#5f6c79',
                'Reserva Biológica': '#15803d',
                'El Camino de Costa Rica': '#0ea5e9',
                'Persona': '#6b7280'
            };
            return map[tipo] || '#6b7280';
        }


        function enlaceWhatsAppDirectorio(telefono) {
            const soloDigitos = (telefono || '').replace(/\D/g, '');
            if (!soloDigitos) return '';
            let numero = soloDigitos;
            if (/^[678]\d{7}$/.test(numero)) {
                numero = '506' + numero;
            }
            return `https://wa.me/${numero}`;
        }


        // --- CUMPLEAÑOS ---
        function parsearFechaNacimiento(fechaStr) {
            if (!fechaStr) return null;
            const partes = fechaStr.split('-');
            if (partes.length !== 3) return null;
            const mes = parseInt(partes[1], 10);
            const dia = parseInt(partes[2], 10);
            if (!mes || !dia) return null;
            return { mes, dia };
        }


        // Devuelve la fecha de HOY (a medianoche) según la hora de Costa Rica,
        // sin importar en qué zona horaria esté configurado el dispositivo.
        function obtenerFechaCRString() {
            try {
                return new Intl.DateTimeFormat('en-CA', {
                    timeZone: 'America/Costa_Rica',
                    year: 'numeric', month: '2-digit', day: '2-digit'
                }).format(new Date());
            } catch (e) {
                const hoy = new Date();
                const anio = hoy.getFullYear();
                const mes = String(hoy.getMonth() + 1).padStart(2, '0');
                const dia = String(hoy.getDate()).padStart(2, '0');
                return `${anio}-${mes}-${dia}`;
            }
        }


        function obtenerHoyCR() {
            try {
                const partes = new Intl.DateTimeFormat('en-CA', {
                    timeZone: 'America/Costa_Rica',
                    year: 'numeric', month: '2-digit', day: '2-digit'
                }).format(new Date());
                const [anio, mes, dia] = partes.split('-').map(n => parseInt(n, 10));
                return new Date(anio, mes - 1, dia);
            } catch (e) {
                const hoy = new Date();
                hoy.setHours(0, 0, 0, 0);
                return hoy;
            }
        }


        function esCumpleHoy(fechaStr) {
            const f = parsearFechaNacimiento(fechaStr);
            if (!f) return false;
            const hoy = obtenerHoyCR();
            return (hoy.getMonth() + 1) === f.mes && hoy.getDate() === f.dia;
        }


        function esCumpleManana(fechaStr) {
            const f = parsearFechaNacimiento(fechaStr);
            if (!f) return false;
            const manana = obtenerHoyCR();
            manana.setDate(manana.getDate() + 1);
            return (manana.getMonth() + 1) === f.mes && manana.getDate() === f.dia;
        }


        // Devuelve cuántos días faltan para el próximo cumpleaños (0 = hoy), o null si no hay fecha.
        function diasParaCumpleanos(fechaStr) {
            const f = parsearFechaNacimiento(fechaStr);
            if (!f) return null;
            const hoy = obtenerHoyCR();
            let proximo = new Date(hoy.getFullYear(), f.mes - 1, f.dia);
            if (proximo < hoy) proximo = new Date(hoy.getFullYear() + 1, f.mes - 1, f.dia);
            const msPorDia = 24 * 60 * 60 * 1000;
            return Math.round((proximo - hoy) / msPorDia);
        }


        // Del día del cumpleaños hasta 7 días antes se muestra el pastelito.
        function esCumpleProximo(fechaStr) {
            const dias = diasParaCumpleanos(fechaStr);
            return dias !== null && dias >= 0 && dias <= 7;
        }


        function revisarCumpleanos() {
            if (!Array.isArray(directorioPersonas) || directorioPersonas.length === 0) return;
            const anioActual = obtenerHoyCR().getFullYear();
            const cumpleaneros = directorioPersonas.filter(p => {
                if (!esCumpleHoy(p.fechaNacimiento)) return false;
                const key = `cumple_no_ver_${p.id}_${anioActual}`;
                return localStorage.getItem(key) !== 'true';
            });

            if (cumpleaneros.length === 0) return;

            const nombres = cumpleaneros.map(p => p.nombre).join(', ');
            document.getElementById('banner-cumpleanos-texto').innerText =
                `Hoy es el cumpleaños de ${nombres}. ¡Mandale saludos de cumpleaños desde el directorio!`;

            const banner = document.getElementById('banner-cumpleanos');
            banner.style.display = 'flex';
            banner.dataset.personasIds = JSON.stringify(cumpleaneros.map(p => p.id));
            lanzarConfetti();
        }


        function cerrarBannerCumpleanos(noVerMasEsteAnio) {
            const banner = document.getElementById('banner-cumpleanos');
            if (noVerMasEsteAnio) {
                const anioActual = obtenerHoyCR().getFullYear();
                let ids = [];
                try { ids = JSON.parse(banner.dataset.personasIds || '[]'); } catch (e) { ids = []; }
                ids.forEach(id => localStorage.setItem(`cumple_no_ver_${id}_${anioActual}`, 'true'));
            }
            banner.style.display = 'none';
            detenerConfetti();
        }

