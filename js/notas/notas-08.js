/* ARCHIVO: js/notas/notas-08.js */

        function insertarImagenNotaDesdeArchivo(event) {
            const file = event.target.files[0];
            if (!file) return;
            const tipos = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!tipos.includes(file.type.toLowerCase())) {
                showToast('Formato no soportado. Usá JPG, PNG, GIF o WEBP', 'warning');
                event.target.value = '';
                return;
            }
            const reader = new FileReader();
            reader.onload = function(evt) {
                insertarImagenBase64Nota(evt.target.result);
                guardarBorradorNota();
                actualizarProgresoNota();
                event.target.value = '';
            };
            reader.readAsDataURL(file);
        }


        function mostrarMenuImagenNota(img) {
            notaImgActiva = img;
            const menu = document.getElementById('nota-img-contextmenu');
            if (!menu) return;
            menu.style.display = 'flex';
        }


        function cerrarMenuImagenNota() {
            const menu = document.getElementById('nota-img-contextmenu');
            if (menu) menu.style.display = 'none';
        }


        function eliminarImagenNota() {
            if (!notaImgActiva) return;
            notaImgActiva.remove();
            notaImgActiva = null;
            cerrarMenuImagenNota();
            guardarBorradorNota();
        }


        function togglePreferenciasImagenNota() {
            const menu = document.getElementById('nota-img-contextmenu');
            if (!menu) return;
            if (menu.style.display === 'flex') {
                cerrarMenuImagenNota();
            } else {
                // Seleccionar la última imagen tocada o la primera imagen del editor
                const img = notaImgActiva || document.querySelector('#nota-contenido img.nota-img');
                if (!img) {
                    showToast('No hay imagen para editar', 'warning');
                    return;
                }
                mostrarMenuImagenNota(img);
            }
        }


        function escalarImagenNota(delta) {
            if (!notaImgActiva) return;
            let escala = parseFloat(notaImgActiva.dataset.escala || '1');
            escala = Math.max(0.2, Math.min(3, escala + delta));
            notaImgActiva.dataset.escala = escala;
            aplicarTransformImagenNota();
            guardarBorradorNota();
        }


        function rotarImagenNota(deg) {
            if (!notaImgActiva) return;
            let rotacion = parseInt(notaImgActiva.dataset.rotacion || '0', 10);
            rotacion = (rotacion + deg) % 360;
            notaImgActiva.dataset.rotacion = rotacion;
            aplicarTransformImagenNota();
            guardarBorradorNota();
        }


        function opacidadImagenNota(delta) {
            if (!notaImgActiva) return;
            let op = parseFloat(notaImgActiva.style.opacity || '1');
            op = Math.max(0.1, Math.min(1, op + delta));
            notaImgActiva.style.opacity = op;
            guardarBorradorNota();
        }


        function alinearImagenNota(align) {
            if (!notaImgActiva) return;
            const wrap = notaImgActiva.parentElement;
            if (wrap) wrap.style.textAlign = align;
            guardarBorradorNota();
        }


        function zIndexImagenNota(z) {
            if (!notaImgActiva) return;
            notaImgActiva.style.zIndex = z;
            guardarBorradorNota();
        }


        function posicionarImagenNota(pos) {
            if (!notaImgActiva) return;
            const editor = document.getElementById('nota-contenido');
            const editorRect = editor.getBoundingClientRect();
            const imgRect = notaImgActiva.getBoundingClientRect();
            if (pos === 'izquierda') {
                notaImgActiva.style.left = '0';
                notaImgActiva.style.right = 'auto';
                notaImgActiva.style.top = (imgRect.top - editorRect.top) + 'px';
            } else if (pos === 'derecha') {
                notaImgActiva.style.left = 'auto';
                notaImgActiva.style.right = '0';
                notaImgActiva.style.top = (imgRect.top - editorRect.top) + 'px';
            } else if (pos === 'arriba') {
                notaImgActiva.style.left = (imgRect.left - editorRect.left) + 'px';
                notaImgActiva.style.right = 'auto';
                notaImgActiva.style.top = '0';
            } else if (pos === 'abajo') {
                notaImgActiva.style.left = (imgRect.left - editorRect.left) + 'px';
                notaImgActiva.style.right = 'auto';
                notaImgActiva.style.bottom = '0';
                notaImgActiva.style.top = 'auto';
            } else if (pos === 'fondo') {
                notaImgActiva.style.zIndex = '0';
            } else if (pos === 'encima') {
                notaImgActiva.style.zIndex = '10';
            }
            guardarBorradorNota();
        }


        function mirrorImagenNota(direccion = 'horizontal') {
            if (!notaImgActiva) return;
            if (direccion === 'vertical') {
                let mirrorV = parseInt(notaImgActiva.dataset.mirrorv || '0', 10);
                mirrorV = mirrorV ? 0 : 1;
                notaImgActiva.dataset.mirrorv = mirrorV;
            } else {
                let mirror = parseInt(notaImgActiva.dataset.mirror || '0', 10);
                mirror = mirror ? 0 : 1;
                notaImgActiva.dataset.mirror = mirror;
            }
            aplicarTransformImagenNota();
            guardarBorradorNota();
        }


        function aplicarTransformImagenAElemento(img) {
            if (!img) return;
            const escala = img.dataset.escala || '1';
            const rotacion = img.dataset.rotacion || '0';
            const mirror = img.dataset.mirror === '1' ? -1 : 1;
            const mirrorV = img.dataset.mirrorv === '1' ? -1 : 1;
            img.style.transform = `scale(${escala}) rotate(${rotacion}deg) scaleX(${mirror}) scaleY(${mirrorV})`;
        }


        function aplicarTransformImagenNota() {
            if (!notaImgActiva) return;
            aplicarTransformImagenAElemento(notaImgActiva);
        }


        function mostrarImagenCompletaNota(src) {
            initModalImagenNota();
            const img = document.getElementById('nota-imagen-ampliada');
            if (img) img.src = src;
            if (modalImagenNota) modalImagenNota.show();
        }


        function seleccionarImagenNota(img) {
            const editor = document.getElementById('nota-contenido');
            if (editor) {
                editor.querySelectorAll('img.nota-img').forEach(i => i.classList.remove('seleccionada'));
            }
            if (img) {
                img.classList.add('seleccionada');
                notaImgActiva = img;
            }
        }


        function iniciarArrastreImagenNota(e, img) {
            if (!img) return;
            e.preventDefault();
            e.stopPropagation();
            notaImgDrag = img;
            seleccionarImagenNota(img);
            notaImgDragMoved = false;

            const rect = img.getBoundingClientRect();
            let clientX, clientY;
            if (e.type === 'touchstart') {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }
            notaImgDragOffsetX = clientX - rect.left;
            notaImgDragOffsetY = clientY - rect.top;
            notaImgDragStartX = clientX;
            notaImgDragStartY = clientY;

            img.classList.add('arrastrando');
        }

