/* ARCHIVO: js/notas/notas-02.js */

        function aplicarFormatoTitulo(value) {
            if (!value) return;
            if (value === 'HR') {
                insertarLineaHorizontalNota();
                return;
            }
            formatNota('formatBlock', value);
        }


        function insertarLineaHorizontalNota() {
            const editor = document.getElementById('nota-contenido');
            const hr = document.createElement('hr');
            hr.style.border = '0';
            hr.style.borderTop = '1px solid #ccc';
            hr.style.margin = '16px 0';
            editor.appendChild(hr);
            const p = document.createElement('p');
            p.innerHTML = '<br>';
            editor.appendChild(p);
            editor.focus();
            const range = document.createRange();
            range.selectNodeContents(p);
            range.collapse(true);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }


        function crearCasillaChecklist() {
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.className = 'casilla-checklist';
            input.addEventListener('change', function() {
                if (this.checked) this.setAttribute('checked', 'checked');
                else this.removeAttribute('checked');
                actualizarProgresoNota();
            });
            return input;
        }


        function insertarChecklistNota() {
            const editor = document.getElementById('nota-contenido');
            const ul = document.createElement('ul');
            ul.className = 'checklist-nota';
            ul.style.listStyle = 'none';
            ul.style.paddingLeft = '0';

            const li = document.createElement('li');
            li.style.marginBottom = '6px';
            li.appendChild(crearCasillaChecklist());
            const texto = document.createElement('span');
            texto.contentEditable = 'true';
            texto.style.outline = 'none';
            texto.innerText = 'Tarea';
            li.appendChild(texto);
            ul.appendChild(li);

            editor.appendChild(ul);

            const range = document.createRange();
            range.selectNodeContents(texto);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
            editor.focus();
        }


        function convertirSeleccionAChecklist() {
            const sel = window.getSelection();
            if (!sel.rangeCount) {
                insertarChecklistNota();
                return;
            }

            const editor = document.getElementById('nota-contenido');
            const range = sel.getRangeAt(0);
            if (range.collapsed) {
                insertarChecklistNota();
                return;
            }

            const fragment = range.extractContents();
            const ul = document.createElement('ul');
            ul.className = 'checklist-nota';
            ul.style.listStyle = 'none';
            ul.style.paddingLeft = '0';

            const div = document.createElement('div');
            div.appendChild(fragment);
            const lineas = div.innerText.split('\n').filter(l => l.trim() !== '');

            if (lineas.length === 0) {
                insertarChecklistNota();
                return;
            }

            lineas.forEach(texto => {
                const li = document.createElement('li');
                li.style.marginBottom = '6px';
                li.appendChild(crearCasillaChecklist());
                const span = document.createElement('span');
                span.contentEditable = 'true';
                span.style.outline = 'none';
                span.innerText = texto.trim();
                li.appendChild(span);
                ul.appendChild(li);
            });

            range.insertNode(ul);
            sel.removeAllRanges();
            editor.focus();
        }

