/* ARCHIVO: js/ajustes/ajustes-01.js */
        // === INICIO BLOQUE MODULAR PROTEGIDO: AJUSTES ===
        // --- AJUSTES: Normas e Instrucciones ---
        // FLASK: Módulo de ajustes: tema, títulos, formas de pago, instrucciones,
        //        equipo, respaldos, estadísticas y tarjeta de cuentas. La mayoría
        //        de funciones actualizan configTema y llaman saveData(). En Flask
        //        estas funciones deberían hacer POST al endpoint /api/config y
        //        luego re-renderizar la sección de ajustes parcial.
        function renderInstruccionesAjustes() {
            document.getElementById('ajustes-otras').value = (configTema.instrucciones.otrasRecomendaciones || []).join('\n');
            document.getElementById('ajustes-normas').value = (configTema.instrucciones.normasGenerales || []).join('\n');
            document.getElementById('ajustes-seguridad').value = (configTema.instrucciones.indicacionesSeguridad || []).join('\n');

            const cont = document.getElementById('ajustes-equipo-lista');
            if (!cont) return;
            const equipos = configTema.equipoRequerido || [];
            if (equipos.length === 0) {
                cont.innerHTML = '<p class="text-muted small mb-0">No hay equipo configurado.</p>';
                return;
            }
            cont.innerHTML = equipos.map((item, index) => `
                <div class="d-flex justify-content-between align-items-center bg-light rounded px-2 py-1 mb-1">
                    <span class="small text-muted">${escapeHtml(item)}</span>
                    <button type="button" class="btn btn-sm text-danger" onclick="eliminarEquipoRequerido(${index})" title="Eliminar"><i class="fas fa-trash-alt"></i></button>
                </div>
            `).join('');
        }


        function guardarInstruccionesAjustes() {
            const parseLines = (id) => {
                const el = document.getElementById(id);
                return el ? el.value.split('\n').map(l => l.trim()).filter(l => l.length > 0) : [];
            };
            configTema.instrucciones = {
                otrasRecomendaciones: parseLines('ajustes-otras'),
                normasGenerales: parseLines('ajustes-normas'),
                indicacionesSeguridad: parseLines('ajustes-seguridad')
            };
            saveData();
            showToast('Normas e instrucciones guardadas', 'success');
        }


        function renderMembreteCotizador() {
            const m = configTema.membreteCotizador || {};
            const t1 = document.getElementById('ajustes-cot-telefono1');
            const t2 = document.getElementById('ajustes-cot-telefono2');
            const fb = document.getElementById('ajustes-cot-facebook');
            const wb = document.getElementById('ajustes-cot-web');
            const pf = document.getElementById('ajustes-cot-precio');
            const hf = document.getElementById('ajustes-cot-horario');
            const bf = document.getElementById('ajustes-cot-banos');
            const cf = document.getElementById('ajustes-cot-cortesia');
            const cif = document.getElementById('ajustes-cot-cierre');
            if (t1) t1.value = m.telefono1 || '';
            if (t2) t2.value = m.telefono2 || '';
            if (fb) fb.value = m.facebook || '';
            if (wb) wb.value = m.web || '';
            if (pf) pf.value = m.precioFrase || '';
            if (hf) hf.value = m.horarioFrase || '';
            if (bf) bf.value = m.banosFrase || '';
            if (cf) cf.value = m.cortesiaFrase || '';
            if (cif) cif.value = m.cierreFrase || '';
        }


        function guardarMembreteCotizador() {
            const t1 = document.getElementById('ajustes-cot-telefono1');
            const t2 = document.getElementById('ajustes-cot-telefono2');
            const fb = document.getElementById('ajustes-cot-facebook');
            const wb = document.getElementById('ajustes-cot-web');
            const pf = document.getElementById('ajustes-cot-precio');
            const hf = document.getElementById('ajustes-cot-horario');
            const bf = document.getElementById('ajustes-cot-banos');
            const cf = document.getElementById('ajustes-cot-cortesia');
            const cif = document.getElementById('ajustes-cot-cierre');
            if (!t1 || !t2 || !fb || !wb || !pf || !hf || !bf || !cf || !cif) return;
            configTema.membreteCotizador = {
                telefono1: t1.value,
                telefono2: t2.value,
                facebook: fb.value,
                web: wb.value,
                precioFrase: pf.value,
                horarioFrase: hf.value,
                banosFrase: bf.value,
                cortesiaFrase: cf.value,
                cierreFrase: cif.value
            };
            saveData();
            showToast('Membrete del cotizador guardado', 'success');
        }


        function abrirCotizador() {
            document.getElementById('cot-personas').value = 1;
            document.getElementById('cot-dias').value = 1;
            document.getElementById('cot-fecha-unica').value = '';
            document.getElementById('cot-fecha-ingreso').value = '';
            document.getElementById('cot-fecha-salida').value = '';
            document.getElementById('cot-tipo-requerimiento').value = '';
            document.getElementById('cot-hab-sencilla').value = 0;
            document.getElementById('cot-hab-doble').value = 0;
            document.getElementById('cot-hab-triple').value = 0;
            document.getElementById('cot-hab-cuadruple').value = 0;
            document.getElementById('cot-hab-pareja').value = 0;
            document.getElementById('cot-trans-cantidad').value = 1;
            document.getElementById('cot-trans-url').value = '';
            document.getElementById('cot-req-nota').value = '';
            cotRequerimientos = [];
            mostrarCamposRequerimientoCotizador();
            renderRequerimientosCotizador();
            actualizarResumenCotizador();
            toggleFechasCotizador();
            if (modalCotizador) modalCotizador.show();
        }


        function toggleFechasCotizador() {
            const dias = Number(document.getElementById('cot-dias').value || 1);
            const grupoUnica = document.getElementById('cot-grupo-fecha-unica');
            const grupoRango = document.getElementById('cot-grupo-fechas');
            if (dias > 1) {
                grupoUnica.classList.add('d-none');
                grupoRango.classList.remove('d-none');
            } else {
                grupoUnica.classList.remove('d-none');
                grupoRango.classList.add('d-none');
            }
        }


        function etiquetaTipoCotizador(tipo) {
            const map = {
                'hospedaje': 'Hospedaje',
                'lancha': 'Transporte Marítimo (Lancha)',
                'terrestre': 'Transporte Terrestre',
                'aereo': 'Transporte Aéreo',
                'guiado': 'Transporte Guiado',
                'nota': 'Nota / Descripción'
            };
            return map[tipo] || tipo;
        }


        function mostrarCamposRequerimientoCotizador() {
            const tipo = document.getElementById('cot-tipo-requerimiento').value;
            const camposHab = document.getElementById('cot-campos-habitacion');
            const camposTrans = document.getElementById('cot-campos-transporte');
            const camposNota = document.getElementById('cot-campos-nota');
            camposHab.classList.add('d-none');
            camposTrans.classList.add('d-none');
            camposNota.classList.add('d-none');
            if (tipo === 'hospedaje') camposHab.classList.remove('d-none');
            if (['lancha', 'terrestre', 'aereo', 'guiado'].includes(tipo)) camposTrans.classList.remove('d-none');
            if (tipo === 'nota') camposNota.classList.remove('d-none');
        }

