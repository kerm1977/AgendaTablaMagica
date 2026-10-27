/* ARCHIVO: js/notas/notas-03.js */

        function manejarEnterChecklist(e) {
            const editor = document.getElementById('nota-contenido');
            const sel = window.getSelection();
            if (!sel.rangeCount) return;

            const nodo = sel.getRangeAt(0).startContainer;
            let li = nodo.nodeType === Node.ELEMENT_NODE ? nodo : nodo.parentElement;

            while (li && li.tagName !== 'LI') {
                li = li.parentElement;
                if (li && li.id === 'nota-contenido') {
                    li = null;
                    break;
                }
            }

            if (!li) return;

            const ul = li.parentElement;
            if (!ul || !ul.classList.contains('checklist-nota')) return;

            const textoSpan = li.querySelector('span[contenteditable="true"]');
            const estaVacio = !textoSpan || (textoSpan.innerText || '').trim() === '';

            if (e.key === 'Enter') {
                e.preventDefault();
                const esUltimo = !li.nextElementSibling;

                if (estaVacio && esUltimo) {
                    // Salir del checklist al final
                    const p = document.createElement('p');
                    p.innerHTML = '<br>';
                    ul.after(p);
                    li.remove();
                    if (ul.children.length === 0) ul.remove();

                    const range = document.createRange();
                    range.selectNodeContents(p);
                    range.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(range);
                    editor.focus();
                    return;
                }

                const nuevoLi = document.createElement('li');
                nuevoLi.style.marginBottom = '6px';
                nuevoLi.appendChild(crearCasillaChecklist());
                const texto = document.createElement('span');
                texto.contentEditable = 'true';
                texto.style.outline = 'none';
                texto.innerHTML = '<br>';
                nuevoLi.appendChild(texto);
                li.after(nuevoLi);

                const range = document.createRange();
                range.selectNodeContents(texto);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
                editor.focus();
            }

            if (e.key === 'Backspace' && estaVacio) {
                e.preventDefault();
                const prevLi = li.previousElementSibling;
                li.remove();
                if (ul.children.length === 0) {
                    ul.remove();
                    const p = document.createElement('p');
                    p.innerHTML = '<br>';
                    editor.appendChild(p);
                    const range = document.createRange();
                    range.selectNodeContents(p);
                    range.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(range);
                } else if (prevLi) {
                    const span = prevLi.querySelector('span[contenteditable="true"]');
                    if (span) {
                        const range = document.createRange();
                        range.selectNodeContents(span);
                        range.collapse(false);
                        sel.removeAllRanges();
                        sel.addRange(range);
                    }
                }
                editor.focus();
            }
        }


        function transformarTextoNota(tipo) {
            const editor = document.getElementById('nota-contenido');
            const sel = window.getSelection();
            let range = (sel.rangeCount && !sel.isCollapsed) ? sel.getRangeAt(0) : notaSavedRange;
            if (!range) { editor.focus(); return; }
            notaSavedRange = range.cloneRange();

            const texto = range.toString();
            let nuevoTexto = texto;

            if (tipo === 'uppercase') nuevoTexto = texto.toUpperCase();
            if (tipo === 'lowercase') nuevoTexto = texto.toLowerCase();
            if (tipo === 'titlecase') nuevoTexto = texto.toLowerCase().replace(/(?:^|\s)\S/g, s => s.toUpperCase());

            range.deleteContents();
            const newNode = document.createTextNode(nuevoTexto);
            range.insertNode(newNode);
            const newRange = document.createRange();
            newRange.selectNode(newNode);
            sel.removeAllRanges();
            sel.addRange(newRange);
            notaSavedRange = newRange.cloneRange();
            editor.focus();
        }


        function manejarClickNota(e) {
            actualizarProgresoNota();
        }


        function sincronizarChecksNota() {
            const editor = document.getElementById('nota-contenido');
            if (!editor) return;
            editor.querySelectorAll('.casilla-checklist').forEach(cb => {
                if (cb.checked) cb.setAttribute('checked', 'checked');
                else cb.removeAttribute('checked');
            });
        }


        function actualizarProgresoNota() {
            const editor = document.getElementById('nota-contenido');
            const total = editor.querySelectorAll('.checklist-nota li').length;
            const completados = editor.querySelectorAll('.checklist-nota input[type="checkbox"]:checked').length;
            const cont = document.getElementById('nota-progreso-container');
            const barra = document.getElementById('nota-progreso-barra');
            const texto = document.getElementById('nota-progreso-texto');
            if (total === 0) {
                cont.style.display = 'none';
                return;
            }

            cont.style.display = 'flex';
            const porcentaje = Math.round((completados / total) * 100);
            barra.style.width = porcentaje + '%';
            texto.innerText = `${completados}/${total} (${porcentaje}%)`;
        }


        function actualizarBotonRecordatorio() {
            const btn = document.getElementById('btn-toggle-recordatorio');
            const icon = document.getElementById('icon-recordatorio');
            const text = document.getElementById('text-recordatorio');
            const fecha = notaRecordatorioFechaPendiente || notaRecordatorioFechaExistente;
            if (fecha) {
                btn.classList.remove('btn-light');
                btn.classList.add('btn-warning');
                icon.classList.remove('far');
                icon.classList.add('fas');
                text.innerText = `Recordatorio: ${formatearFechaRecordatorio(fecha)}`;
            } else {
                btn.classList.remove('btn-warning');
                btn.classList.add('btn-light');
                icon.classList.remove('fas');
                icon.classList.add('far');
                text.innerText = 'Recordatorio';
            }
        }


        function formatearFechaRecordatorio(fechaStr) {
            if (!fechaStr) return '';
            const [anio, mes, dia] = fechaStr.split('-');
            return `${dia}/${mes}/${anio}`;
        }

