/* ARCHIVO: js/notas/notas-09.js */

        function arrastrarImagenNota(e) {
            if (!notaImgDrag) return;
            e.preventDefault();
            let clientX, clientY;
            if (e.type === 'touchmove') {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }
            if (Math.abs(clientX - notaImgDragStartX) > 3 || Math.abs(clientY - notaImgDragStartY) > 3) {
                notaImgDragMoved = true;
            }
            const editor = document.getElementById('nota-contenido');
            const editorRect = editor.getBoundingClientRect();
            let x = clientX - editorRect.left - notaImgDragOffsetX;
            let y = clientY - editorRect.top - notaImgDragOffsetY;
            notaImgDrag.style.left = x + 'px';
            notaImgDrag.style.top = y + 'px';
        }


        function finalizarArrastreImagenNota() {
            if (!notaImgDrag) return;
            notaImgDrag.classList.remove('arrastrando');
            if (notaImgDragMoved) {
                notaImgDragClickBlocked = true;
                guardarBorradorNota();
            }
            notaImgDrag = null;
        }


        function prepararImagenesNota() {
            const contenido = document.getElementById('nota-contenido');
            if (!contenido) return;
            const contenidoRect = contenido.getBoundingClientRect();
            contenido.querySelectorAll('img').forEach(img => {
                img.classList.add('nota-img');
                if (img.dataset.escala === undefined) img.dataset.escala = '1';
                if (img.dataset.rotacion === undefined) img.dataset.rotacion = '0';
                if (img.dataset.mirror === undefined) img.dataset.mirror = '0';
                if (img.dataset.mirrorv === undefined) img.dataset.mirrorv = '0';
                img.style.position = 'absolute';
                img.style.zIndex = '0';
                img.style.margin = '0';

                const wrap = img.parentElement;
                if (wrap && wrap.classList.contains('nota-img-wrap')) {
                    // Convertir imágenes de párrafo contenedor a posición libre en el editor
                    const wrapRect = wrap.getBoundingClientRect();
                    const currentLeft = parseFloat(img.style.left || 0);
                    const currentTop = parseFloat(img.style.top || 0);
                    img.style.left = (wrapRect.left - contenidoRect.left + currentLeft) + 'px';
                    img.style.top = (wrapRect.top - contenidoRect.top + currentTop) + 'px';
                    contenido.appendChild(img);
                    if (!wrap.textContent.trim() && !wrap.querySelector('img')) wrap.remove();
                }

                if (img.style.left === '' || img.style.left === '0px') img.style.left = '0';
                if (img.style.top === '' || img.style.top === '0px') img.style.top = '0';
                aplicarTransformImagenAElemento(img);
            });
        }

