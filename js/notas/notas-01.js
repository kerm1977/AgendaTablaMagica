/* ARCHIVO: js/notas/notas-01.js */
        // === INICIO BLOQUE MODULAR PROTEGIDO: NOTAS ===
        // --- NOTAS ---
        // FLASK: Módulo de notas con editor WYSIWYG. El editor es un div
        //        contenteditable; conservar el JS de formato y checklist.
        //        CRÍTICO: formatNota(), guardarNota(), eliminarNota() y
        //        descartarNota() se llaman desde onclick del toolbar/modales.
        function abrirEditorNota(id = '') {
            currentNotaId = id;
            notaSavedRange = null;
            const titulo = document.getElementById('nota-titulo');
            const contenido = document.getElementById('nota-contenido');
            const borradorTitulo = localStorage.getItem('borrador_nota_titulo');
            const borradorContenido = localStorage.getItem('borrador_nota_contenido');
            const borradorId = localStorage.getItem('borrador_nota_id');

            notaRecordatorioFechaPendiente = null;
            notaRecordatorioFechaExistente = null;

            if (id) {
                const nota = notas.find(n => n.id === id);
                if (nota) {
                    if (borradorId === id && (borradorTitulo || borradorContenido)) {
                        titulo.value = borradorTitulo || '';
                        contenido.innerHTML = borradorContenido || '';
                        notaRecordatorioFechaExistente = nota.recordatorioFecha || null;
                    } else {
                        titulo.value = nota.titulo || '';
                        contenido.innerHTML = nota.contenido || '';
                        notaRecordatorioFechaExistente = nota.recordatorioFecha || null;
                    }
                } else {
                    titulo.value = borradorTitulo || '';
                    contenido.innerHTML = borradorContenido || '';
                }
            } else {
                if (borradorId === '' && (borradorTitulo || borradorContenido)) {
                    titulo.value = borradorTitulo || '';
                    contenido.innerHTML = borradorContenido || '';
                } else {
                    titulo.value = '';
                    contenido.innerHTML = '';
                }
            }

            actualizarBotonRecordatorio();
            titulo.oninput = guardarBorradorNota;
            contenido.oninput = function () {
                guardarBorradorNota();
                actualizarProgresoNota();
            };
            contenido.onclick = manejarClickNota;
            contenido.addEventListener('paste', pegarImagenNota);
            contenido.addEventListener('mousedown', function(e) {
                if (e.target.tagName === 'IMG' && e.target.classList.contains('nota-img') && e.button === 0) {
                    iniciarArrastreImagenNota(e, e.target);
                }
            });
            contenido.addEventListener('touchstart', function(e) {
                if (e.target.tagName === 'IMG' && e.target.classList.contains('nota-img')) {
                    iniciarArrastreImagenNota(e, e.target);
                }
            }, { passive: false });
            if (!notaImgArrastreListeners) {
                notaImgArrastreListeners = true;
                document.addEventListener('mousemove', arrastrarImagenNota);
                document.addEventListener('touchmove', arrastrarImagenNota, { passive: false });
                document.addEventListener('mouseup', finalizarArrastreImagenNota);
                document.addEventListener('touchend', finalizarArrastreImagenNota);
            }
            prepararImagenesNota();
            actualizarProgresoNota();
            modalNota.show();
        }


        function cerrarEditorNota() {
            currentNotaId = null;
        }


        function formatNota(command, value = null) {
            const editor = document.getElementById('nota-contenido');
            editor.focus();

            const ok = document.execCommand(command, false, value);
            if (ok) return;

            // Fallback manual para comandos que no se aplican
            const sel = window.getSelection();
            if (!sel.rangeCount || sel.isCollapsed) return;

            const range = sel.getRangeAt(0);
            const extract = range.extractContents();

            let tag;
            switch (command) {
                case 'bold': tag = 'strong'; break;
                case 'italic': tag = 'em'; break;
                case 'underline': tag = 'u'; break;
                case 'strikeThrough': tag = 's'; break;
                default: tag = null;
            }

            if (tag) {
                const wrapper = document.createElement(tag);
                wrapper.appendChild(extract);
                range.insertNode(wrapper);
            } else if (command === 'justifyLeft' || command === 'justifyCenter' || command === 'justifyRight' || command === 'justifyFull') {
                const alignment = command.replace('justify', '').toLowerCase();
                const div = document.createElement('div');
                div.style.textAlign = alignment === 'full' ? 'justify' : alignment;
                div.appendChild(extract);
                range.insertNode(div);
            }

            sel.removeAllRanges();
            editor.focus();
        }


        function aplicarInterlineadoNota(valor) {
            if (!valor) return;
            const editor = document.getElementById('nota-contenido');
            const sel = window.getSelection();
            let range = (sel.rangeCount && !sel.isCollapsed) ? sel.getRangeAt(0) : notaSavedRange;
            if (!range) { editor.focus(); return; }
            notaSavedRange = range.cloneRange();

            const bloques = Array.from(editor.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6, li'))
                .filter(b => {
                    try { return range.intersectsNode(b); } catch { return false; }
                });
            if (bloques.length > 0) {
                bloques.forEach(b => {
                    b.querySelectorAll('[style*="line-height"]').forEach(el => {
                        el.style.lineHeight = '';
                        if (!el.getAttribute('style')) el.removeAttribute('style');
                    });
                    b.style.lineHeight = (valor === 'normal' ? '' : valor);
                });
            } else {
                const extract = range.extractContents();
                if (extract.querySelectorAll) {
                    extract.querySelectorAll('[style*="line-height"]').forEach(el => {
                        el.style.lineHeight = '';
                        if (!el.getAttribute('style')) el.removeAttribute('style');
                    });
                }
                const span = document.createElement('span');
                span.style.lineHeight = (valor === 'normal' ? '' : valor);
                span.appendChild(extract);
                range.insertNode(span);
                range.selectNodeContents(span);
            }
            sel.removeAllRanges();
            sel.addRange(range);
            notaSavedRange = range.cloneRange();
            editor.focus();
            guardarBorradorNota();
        }


        function aplicarEspaciadoLetrasNota(valor) {
            if (!valor) return;
            const editor = document.getElementById('nota-contenido');
            const sel = window.getSelection();
            let range = (sel.rangeCount && !sel.isCollapsed) ? sel.getRangeAt(0) : notaSavedRange;
            if (!range) { editor.focus(); return; }
            notaSavedRange = range.cloneRange();

            const span = document.createElement('span');
            span.style.letterSpacing = (valor === 'normal' ? 'normal' : valor);
            try {
                range.surroundContents(span);
                span.querySelectorAll('[style*="letter-spacing"]').forEach(el => {
                    el.style.letterSpacing = '';
                    if (!el.getAttribute('style')) el.removeAttribute('style');
                });
                range.selectNodeContents(span);
            } catch (e) {
                const bloques = Array.from(editor.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6, li, span'))
                    .filter(b => {
                        try { return range.intersectsNode(b); } catch { return false; }
                    });
                bloques.forEach(b => {
                    b.querySelectorAll('[style*="letter-spacing"]').forEach(el => {
                        el.style.letterSpacing = '';
                        if (!el.getAttribute('style')) el.removeAttribute('style');
                    });
                    b.style.letterSpacing = (valor === 'normal' ? '' : valor);
                });
            }
            sel.removeAllRanges();
            sel.addRange(range);
            notaSavedRange = range.cloneRange();
            editor.focus();
            guardarBorradorNota();
        }

