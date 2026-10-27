/* ARCHIVO: js/directorio/directorio-23.js */

        async function descargarTarjetaDirectorio() {
            if (!directorioEnEdicion) return;
            if (typeof html2canvas === 'undefined') {
                showToast('No se pudo cargar el generador de imágenes', 'danger');
                return;
            }
            const p = directorioEnEdicion;
            if (!p) {
                showToast('Abrí una persona del directorio para generar la tarjeta', 'warning');
                return;
            }

            const card = document.createElement('div');
            card.style.width = '420px';
            card.style.minHeight = '260px';
            card.style.padding = '0';
            card.style.background = '#ffffff';
            card.style.borderRadius = '16px';
            card.style.fontFamily = '"Segoe UI", Arial, sans-serif';
            card.style.boxShadow = '0 10px 30px rgba(0,0,0,0.15)';
            card.style.color = '#2c3e50';
            card.style.overflow = 'hidden';

            const colorAcento = '#ea580c';
            const colorGradienteFin = '#c2410c';
            const tipo = p.tipo || 'Persona';
            const pais = p.pais || 'Costa Rica';
            const lugar = p.lugar || '';
            const nombre = `<h2 style="margin: 0 0 4px 0; color: #ffffff; font-size: 1.6rem; font-weight: 600; letter-spacing: 0.5px;">${escapeHtml(p.nombre || 'Sin nombre')}</h2>`;
            const subtitulo = `<p style="margin: 0; color: rgba(255,255,255,0.85); font-size: 0.9rem;"><i class="fas ${iconoTipoDirectorio(tipo)}" style="margin-right: 6px;"></i>${escapeHtml(tipo)}</p>`;

            const filas = [];
            filas.push(filaTarjeta('fa-globe', 'País', pais));
            if (lugar) filas.push(filaTarjeta('fa-map-marker-alt', 'Lugar', lugar));
            filas.push(filaTarjeta('fa-id-card', 'Cédula', p.cedula));
            filas.push(filaTarjeta('fa-passport', 'Pasaporte', p.pasaporte));
            filas.push(filaTarjeta('fa-phone', 'Teléfono', p.telefono));
            filas.push(filaTarjeta('fa-envelope', 'Correo', p.correo));
            filas.push(filaTarjeta('fa-cake-candles', 'Fecha de nacimiento', p.fechaNacimiento));
            filas.push(filaTarjeta('fa-tint', 'Tipo de sangre', p.tipoSangre));
            filas.push(filaTarjeta('fa-user-shield', 'Contacto de emergencia', p.contactoEmergenciaNombre));
            filas.push(filaTarjeta('fa-phone-volume', 'Teléfono de emergencia', p.telefonoEmergencia));
            filas.push(filaTarjeta('fa-sticky-note', 'Notas adicionales', p.notas));

            card.innerHTML = `
                <div style="background: linear-gradient(135deg, ${colorAcento} 0%, ${colorGradienteFin} 100%); padding: 28px 30px;">
                    ${nombre}${subtitulo}
                </div>
                <div style="padding: 24px 30px;">
                    ${filas.join('')}
                    <div style="margin-top: 20px; text-align: right; font-size: 0.7rem; color: #aaa;">Generado por La Tribu de Los Libres</div>
                </div>
            `;
            card.style.position = 'fixed';
            card.style.left = '-9999px';
            document.body.appendChild(card);

            try {
                const canvas = await html2canvas(card, { scale: 2, backgroundColor: '#ffffff' });
                const fileName = `tarjeta-${(p.nombre || 'persona').replace(/\s+/g, '_')}.png`;
                canvas.toBlob((blob) => {
                    if (navigator.canShare && navigator.canShare({ files: [new File([blob], fileName, { type: 'image/png' })] })) {
                        const file = new File([blob], fileName, { type: 'image/png' });
                        navigator.share({ title: `Tarjeta ${p.nombre}`, text: 'Tarjeta de presentación', files: [file] });
                    } else {
                        const link = document.createElement('a');
                        link.download = fileName;
                        link.href = URL.createObjectURL(blob);
                        link.click();
                        showToast('Tarjeta descargada');
                    }
                }, 'image/png');
            } catch (err) {
                showToast('Error al generar tarjeta', 'danger');
            } finally {
                document.body.removeChild(card);
            }
        }


        function filaTarjeta(icono, label, valor) {
            const tieneValor = (valor || '').trim() !== '';
            const texto = tieneValor ? escapeHtml(valor) : '<span style="color: #adb5bd; font-style: italic;">Falta información</span>';
            return `
                <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
                    <div style="width: 28px; color: #0d6efd; font-size: 1rem; text-align: center; margin-top: 2px;"><i class="fas ${icono}"></i></div>
                    <div style="flex-grow: 1; min-width: 0;">
                        <div style="font-size: 0.75rem; color: #6c757d; text-transform: uppercase; letter-spacing: 0.5px;">${label}</div>
                        <div style="font-size: 1rem; color: #2c3e50; font-weight: 500; word-break: break-word;">${texto}</div>
                    </div>
                </div>
            `;
        }

