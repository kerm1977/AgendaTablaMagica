/* ARCHIVO: js/directorio/directorio-16.js */

        function editarFormaPago(tipo, index) {
            const actual = configTema.formasPago[tipo][index];
            if (actual === undefined) return;
            const nuevo = prompt(tipo === 'sinpe' ? 'Editar número SINPE:' : 'Editar cuenta bancaria:', actual);
            if (nuevo === null) return;
            const valor = nuevo.trim();
            if (!valor) return;
            configTema.formasPago[tipo][index] = valor;
            saveData();
            renderFormasPago();
        }


        function llenarTarjetaCuentas() {
            const sinpeLista = configTema.formasPago?.sinpe || [];
            const cuentasLista = configTema.formasPago?.cuentas || [];
            
            const sinpeCont = document.getElementById('tarjeta-cuentas-sinpe-lista');
            const cuentasCont = document.getElementById('tarjeta-cuentas-bancarias-lista');
            
            if (sinpeCont) {
                sinpeCont.innerHTML = sinpeLista.map(s => `
                    <div style="background: #ffffff; border: 1px solid #fed7aa; border-radius: 8px; padding: 10px 12px; margin-bottom: 8px; color: #111b21; font-size: 13px; font-weight: 500; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                        <i class="fas fa-mobile-alt" style="color: #25D366; margin-right: 8px;"></i>${escapeHtml(s)}
                    </div>
                `).join('') || '<p style="color: #6c757d; font-size: 12px; font-style: italic;">Sin SINPE registrado</p>';
            }
            
            if (cuentasCont) {
                cuentasCont.innerHTML = cuentasLista.map(c => `
                    <div style="background: #ffffff; border: 1px solid #dbeafe; border-radius: 8px; padding: 10px 12px; margin-bottom: 8px; color: #111b21; font-size: 13px; font-weight: 500; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                        <i class="fas fa-university" style="color: #2563eb; margin-right: 8px;"></i>${escapeHtml(c)}
                    </div>
                `).join('') || '<p style="color: #6c757d; font-size: 12px; font-style: italic;">Sin cuentas registradas</p>';
            }
        }


        async function descargarTarjetaCuentasPNG() {
            llenarTarjetaCuentas();
            
            const preview = document.getElementById('tarjeta-cuentas-preview');
            if (!preview) return;
            
            try {
                // Hacer visible temporalmente para capturar
                const originalOpacity = preview.style.opacity;
                preview.style.opacity = '1';
                
                const canvas = await html2canvas(preview.firstElementChild, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: null,
                    logging: false
                });
                
                preview.style.opacity = originalOpacity;
                
                const a = document.createElement('a');
                a.href = canvas.toDataURL('image/png');
                a.download = `cuentas_tribu_de_los_libres_${new Date().toISOString().split('T')[0]}.png`;
                a.click();
                
                showToast('Tarjeta descargada como PNG');
            } catch (err) {
                console.error('Error generando PNG:', err);
                showToast('Error al generar la imagen PNG', 'danger');
            }
        }


        function compartirTarjetaCuentasWhatsApp() {
            const sinpeLista = configTema.formasPago?.sinpe || [];
            const cuentasLista = configTema.formasPago?.cuentas || [];
            
            let texto = '💳 *CUENTAS DE LA TRIBU DE LOS LIBRES*\n\n';
            
            if (sinpeLista.length > 0) {
                texto += '📱 *SINPE Móvil:*\n';
                sinpeLista.forEach(s => {
                    texto += `• ${s}\n`;
                });
                texto += '\n';
            }
            
            if (cuentasLista.length > 0) {
                texto += '🏦 *Cuentas Bancarias:*\n';
                cuentasLista.forEach(c => {
                    texto += `• ${c}\n`;
                });
            }
            
            if (sinpeLista.length === 0 && cuentasLista.length === 0) {
                texto += 'No hay formas de pago configuradas.';
            }
            
            const encodedText = encodeURIComponent(texto.trim());
            window.open(`https://wa.me/?text=${encodedText}`, '_blank');
        }


        function descargarTarjetaCuentasTXT() {
            const sinpeLista = configTema.formasPago?.sinpe || [];
            const cuentasLista = configTema.formasPago?.cuentas || [];
            
            let texto = 'CUENTAS DE LA TRIBU DE LOS LIBRES\n';
            texto += '====================================\n\n';
            
            if (sinpeLista.length > 0) {
                texto += 'SINPE Móvil:\n';
                texto += '------------\n';
                sinpeLista.forEach(s => {
                    texto += `• ${s}\n`;
                });
                texto += '\n';
            }
            
            if (cuentasLista.length > 0) {
                texto += 'Cuentas Bancarias:\n';
                texto += '------------------\n';
                cuentasLista.forEach(c => {
                    texto += `• ${c}\n`;
                });
            }
            
            if (sinpeLista.length === 0 && cuentasLista.length === 0) {
                texto += 'No hay formas de pago configuradas.';
            }
            
            const blob = new Blob([texto], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `cuentas_tribu_de_los_libres_${new Date().toISOString().split('T')[0]}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showToast('Tarjeta descargada como TXT');
        }


        function iniciarRespaldoAutomatico() {
            verificarRespaldoAutomatico();
            setInterval(() => {
                verificarRespaldoAutomatico();
            }, 60 * 60 * 1000); // Revisar cada hora
            setInterval(actualizarCuentaRegresivaRespaldo, 60 * 1000); // Actualizar cuenta regresiva cada minuto
        }


        // Las preferencias de "no volver a ver este cumpleaños" viven en localStorage
        // (separado de localforage). Se incluyen aquí para que el respaldo sea 100% completo.
        function obtenerPreferenciasCumpleanos() {
            const obj = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('cumple_no_ver_')) {
                    obj[key] = localStorage.getItem(key);
                }
            }
            return obj;
        }


        function restaurarPreferenciasCumpleanos(obj) {
            if (!obj) return;
            Object.entries(obj).forEach(([key, value]) => localStorage.setItem(key, value));
        }


        // Cuando el dispositivo no soporta compartir archivos directamente (Web Share API),
        // igual abrimos WhatsApp para que el usuario elija con quién enviarlo y adjunte
        // manualmente el archivo que se acaba de descargar.
        function normalizarMonto(m) {
            return {
                ...m,
                monto: m.monto || 0,
                montoOriginal: m.montoOriginal || '',
                monedaPago: m.monedaPago || 'Colones',
                tipoCambio: m.tipoCambio || '',
                fecha: m.fecha || '',
                reversado: m.reversado === true,
                descripcionPago: m.descripcionPago || '',
                formaPago: m.formaPago || '',
                destinoPago: m.destinoPago || '',
                pagadoPor: m.pagadoPor || '',
                abonos: m.abonos || '',
                estadoPago: m.estadoPago || '',
                descripcionReversion: m.descripcionReversion || '',
                fechaEdicionReversion: m.fechaEdicionReversion || '',
                fechaEdicionPago: m.fechaEdicionPago || ''
            };
        }

