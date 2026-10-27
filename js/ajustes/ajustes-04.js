/* ARCHIVO: js/ajustes/ajustes-04.js */

        function eliminarEquipoRequerido(index) {
            if (!configTema.equipoRequerido || !configTema.equipoRequerido[index]) return;
            const item = configTema.equipoRequerido[index];

            showConfirm(
                `1/3 - Eliminar equipo`,
                `¿Estás seguro de que querés borrar este ítem del equipo requerido?\n\n"${item}"`,
                () => {
                    showConfirm(
                        `2/3 - Advertencia`,
                        `Esta acción no se puede deshacer. La información no se puede recuperar. ¿Continuar?`,
                        () => {
                            showConfirm(
                                `3/3 - Confirmación final`,
                                `¿Borrar definitivamente este ítem del equipo requerido?`,
                                () => {
                                    configTema.equipoRequerido.splice(index, 1);
                                    saveData();
                                    renderInstruccionesAjustes();
                                    showToast('Equipo eliminado', 'success');
                                },
                                'Sí, borrar'
                            );
                        },
                        'Sí, continuar'
                    );
                },
                'Sí, estoy seguro'
            );
        }


        function openWhatsAppPreview() {
            const cam = caminatas.find(c => c.id === currentCaminataId);
            if (!cam) {
                showToast("Caminata no encontrada", "warning");
                return;
            }

            currentWhatsAppText = generarMensajeWhatsApp(cam);
            document.getElementById('whatsapp-text-preview').innerText = currentWhatsAppText;
            modalWhatsApp.show();
        }


        function copyToClipboard() {
            if (!currentWhatsAppText) return;
            navigator.clipboard.writeText(currentWhatsAppText).then(() => {
                showToast("Mensaje copiado al portapapeles");
            }).catch(() => {
                showToast("No se pudo copiar", "danger");
            });
        }


        function enviarPorWhatsApp() {
            const cam = caminatas.find(c => c.id === currentCaminataId);
            if (!cam) {
                showToast("Caminata no encontrada", "warning");
                return;
            }
            const texto = generarMensajeWhatsApp(cam);
            const encodedText = encodeURIComponent(texto);
            const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
            window.open(whatsappUrl, '_blank');
        }

