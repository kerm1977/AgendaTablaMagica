/* ARCHIVO: js/feriados/feriados-05.js */

    function eliminarActual() {
      if (!itemActual) return;
      pasoEliminar = 1;
      const nombre = escapar(itemActual.nombre);
      document.getElementById('tituloConfirmarEliminar').textContent = 'Confirmar eliminación';
      document.getElementById('cuerpoConfirmarEliminar').textContent = '¿Seguro que deseas eliminar "' + nombre + '" de la tribu?';
      document.getElementById('btnConfirmarEliminar').textContent = 'Sí, eliminar';
      const modal = new bootstrap.Modal(document.getElementById('modalConfirmarEliminar'));
      modal.show();
    }


    function procesarEliminacion() {
      if (pasoEliminar === 1) {
        pasoEliminar = 2;
        document.getElementById('tituloConfirmarEliminar').textContent = 'Última confirmación';
        document.getElementById('cuerpoConfirmarEliminar').textContent = '¿Estás completamente seguro? Esta acción no se puede deshacer. Confirma una segunda vez.';
        document.getElementById('btnConfirmarEliminar').textContent = 'Eliminar definitivamente';
      } else if (itemActual) {
        if (itemActual.tipo === 'reconocer') {
          datos.reconocer = datos.reconocer.filter(x => x.id !== itemActual.id);
        } else {
          datos.conocidos = datos.conocidos.filter(x => x.id !== itemActual.id);
        }
        guardarDatos();
        const modalConf = bootstrap.Modal.getInstance(document.getElementById('modalConfirmarEliminar'));
        if (modalConf) modalConf.hide();
        itemActual = null;
        cerrarModal('modalDetalle');
        renderizarLista();
        renderizarListaConocidos();
        renderizarCaminatasConFecha();
        mostrarAlerta('Éxito', 'Eliminado correctamente.');
      }
    }


    function abrirDetalle(id) {
      itemActual = null;
      const r = datos.reconocer.find(x => x.id === id) || datos.conocidos.find(x => x.id === id);
      if (!r) return;
      itemActual = r;
      const titulo = document.getElementById('modalTitulo');
      const cuerpo = document.getElementById('modalCuerpo');
      titulo.textContent = r.nombre;
      let html = '<p><strong>Provincia:</strong> ' + escapar(r.provincia) + '</p>';
      if (r.tipo === 'reconocer') {
        if (r.actividad) html += '<p><strong>Actividad:</strong> ' + escapar(ACTIVIDAD_LABELS[r.actividad] || r.actividad) + '</p>';
        html += '<p><strong>Fecha reconocimiento:</strong> ' + escapar(r.fechaReconocimiento) + '</p>';
        if (r.fechaCaminata) {
          const fcDetalle = parsearFechaISO(r.fechaCaminata);
          html += '<p><strong>Fecha caminata:</strong> ' + formatearFecha(fcDetalle) + ' (' + DIAS_SEMANA[fcDetalle.getDay()] + ')</p>';
          if (r.precioBuseta) html += '<p><strong>Precio de buseta:</strong> ₡' + parseFloat(r.precioBuseta).toFixed(2) + '</p>';
          const cercanoDetalle = feriadoCercano(r.fechaCaminata);
          if (cercanoDetalle) {
            const diasD = Math.abs(cercanoDetalle.diasDiferencia);
            const cuandoD = diasD === 0 ? 'coincide con' : (cercanoDetalle.diasDiferencia > 0 ? ('a ' + diasD + ' día(s) después de') : ('a ' + diasD + ' día(s) antes de'));
            html += '<p class="text-danger">⚠ Esta fecha ' + cuandoD + ' el feriado <strong>' + escapar(cercanoDetalle.feriado.nombre) + '</strong> (' + formatearFecha(cercanoDetalle.feriado.fecha) + ').</p>';
          }
        }
        html += '<p><strong>Tipo de ruta:</strong> ' + escapar(r.tipoRuta) + '</p>';
        if (r.mapa) html += '<p><a href="' + escapar(r.mapa) + '" target="_blank" rel="noopener">Ver en Google Maps</a></p>';
        if (r.mapaInicio) html += '<p><strong>Inicio:</strong> <a href="' + escapar(r.mapaInicio) + '" target="_blank" rel="noopener">Google Maps</a></p>';
        if (r.mapaFin) html += '<p><strong>Final:</strong> <a href="' + escapar(r.mapaFin) + '" target="_blank" rel="noopener">Google Maps</a></p>';
        html += '<p><strong>Contacto:</strong> ' + escapar(r.contacto) + '</p>';
      } else {
        html += '<p><strong>Cantidad de grupos:</strong> ' + escapar(r.cantidadGrupos) + '</p>';
      }
      if (r.dificultad) html += '<p><strong>Dificultad:</strong> ' + escapar(r.dificultad) + '</p>';
      if (r.kilometraje != null) html += '<p><strong>Kilometraje:</strong> ' + escapar(r.kilometraje) + ' km</p>';
      if (r.invierno) html += '<p><strong>Apto para invierno:</strong> ' + escapar(r.invierno) + '</p>';
      if (r.terreno) html += '<p><strong>Tipo de terreno:</strong> ' + escapar(r.terreno) + '</p>';
      if (r.descripcion) html += '<p><strong>Descripción:</strong> ' + escapar(r.descripcion).replace(/\n/g, '<br>') + '</p>';
      cuerpo.innerHTML = html;
      const modal = new bootstrap.Modal(document.getElementById('modalDetalle'));
      modal.show();
    }


    function textoItem(r) {
      let t = '*' + r.nombre + '*\n';
      t += 'Provincia: ' + r.provincia + '\n';
      if (r.tipo === 'reconocer') {
        if (r.actividad) t += 'Actividad: ' + (ACTIVIDAD_LABELS[r.actividad] || r.actividad) + '\n';
        t += 'Fecha reconocimiento: ' + r.fechaReconocimiento + '\n';
        if (r.fechaCaminata) {
          t += 'Fecha caminata: ' + r.fechaCaminata + '\n';
          if (r.precioBuseta) t += 'Precio de buseta: ₡' + parseFloat(r.precioBuseta).toFixed(2) + '\n';
        }
        t += 'Tipo de ruta: ' + r.tipoRuta + '\n';
        if (r.mapa) t += 'Google Maps: ' + r.mapa + '\n';
        if (r.mapaInicio) t += 'Inicio: ' + r.mapaInicio + '\n';
        if (r.mapaFin) t += 'Final: ' + r.mapaFin + '\n';
        t += 'Contacto: ' + r.contacto + '\n';
        if (r.descripcion) t += 'Descripción: ' + r.descripcion + '\n';
      } else {
        t += 'Cantidad de grupos: ' + r.cantidadGrupos + '\n';
      }
      if (r.dificultad) t += 'Dificultad: ' + r.dificultad + '\n';
      if (r.kilometraje != null) t += 'Kilometraje: ' + r.kilometraje + ' km\n';
      if (r.invierno) t += 'Apto para invierno: ' + r.invierno + '\n';
      if (r.terreno) t += 'Tipo de terreno: ' + r.terreno + '\n';
      return t;
    }


    function compartirWhatsApp() {
      if (!itemActual) return;
      const txt = encodeURIComponent(textoItem(itemActual));
      window.open('https://wa.me/?text=' + txt, '_blank');
    }


    function mostrarAlerta(titulo, mensaje) {
      document.getElementById('tituloAlerta').textContent = titulo;
      document.getElementById('cuerpoAlerta').textContent = mensaje;
      const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalAlerta'));
      modal.show();
    }


    function descargar(blob, nombre) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = nombre;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }


    function exportarTXT() {
      if (!itemActual) return;
      const b = new Blob([textoItem(itemActual)], { type: 'text/plain;charset=utf-8' });
      descargar(b, itemActual.nombre.replace(/[^a-z0-9\u00e1-\u00fa\u00f1\s-]/gi, '_') + '.txt');
    }


    function exportarItemJSON() {
      if (!itemActual) return;
      const b = new Blob([JSON.stringify(itemActual, null, 2)], { type: 'application/json' });
      descargar(b, itemActual.nombre.replace(/[^a-z0-9\u00e1-\u00fa\u00f1\s-]/gi, '_') + '.json');
    }


    function exportarPNG() {
      if (!itemActual) return;
      const el = document.querySelector('#modalDetalle .modal-content');
      html2canvas(el, { backgroundColor: '#ffffff', scale: 2 }).then(canvas => {
        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = itemActual.nombre.replace(/[^a-z0-9\u00e1-\u00fa\u00f1\s-]/gi, '_') + '.png';
        a.click();
      }).catch(err => { mostrarAlerta('Error', 'No se pudo generar PNG: ' + err.message); });
    }


    function exportarTodoJSON() {
      const b = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
      descargar(b, 'agenda_tribu_libres.json');
    }


    function compartirWhatsAppTodasReconocer() {
      if (datos.reconocer.length === 0) { mostrarAlerta('Aviso', 'No hay lugares por reconocer.'); return; }
      const porProvincia = {};
      datos.reconocer.forEach(item => {
        const p = item.provincia || 'Sin provincia';
        if (!porProvincia[p]) porProvincia[p] = [];
        porProvincia[p].push(item);
      });
      const provincias = Object.keys(porProvincia).sort();
      let t = '*Lugares por reconocer*\n\n';
      provincias.forEach(prov => {
        t += '*' + prov + '*\n';
        porProvincia[prov].forEach(item => {
          t += textoItem(item) + '\n\n';
        });
      });
      window.open('https://wa.me/?text=' + encodeURIComponent(t), '_blank');
    }


    function exportarReconocerPorProvinciaJSON() {
      if (datos.reconocer.length === 0) { mostrarAlerta('Aviso', 'No hay lugares por reconocer.'); return; }
      const porProvincia = {};
      datos.reconocer.forEach(item => {
        const p = item.provincia || 'Sin provincia';
        if (!porProvincia[p]) porProvincia[p] = [];
        porProvincia[p].push(item);
      });
      const provincias = Object.keys(porProvincia).sort();
      const ordenado = {};
      provincias.forEach(prov => { ordenado[prov] = porProvincia[prov]; });
      const b = new Blob([JSON.stringify(ordenado, null, 2)], { type: 'application/json' });
      descargar(b, 'reconocer_por_provincia.json');
    }


    function exportarCaminatasGuardadasJSON() {
      if (datos.reconocer.length === 0) { mostrarAlerta('Aviso', 'No hay caminatas guardadas por reconocer.'); return; }
      const b = new Blob([JSON.stringify({ reconocer: datos.reconocer }, null, 2)], { type: 'application/json' });
      descargar(b, 'caminatas_guardadas.json');
    }


    function exportarYaConocidosJSON() {
      if (datos.conocidos.length === 0) { mostrarAlerta('Aviso', 'No hay lugares ya conocidos.'); return; }
      const b = new Blob([JSON.stringify({ conocidos: datos.conocidos }, null, 2)], { type: 'application/json' });
      descargar(b, 'ya_conocidos.json');
    }

