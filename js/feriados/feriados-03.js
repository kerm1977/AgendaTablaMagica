/* ARCHIVO: js/feriados/feriados-03.js */

    function guardarReconocer(e) {
      e.preventDefault();
      const f = e.target;
      const conFechaCaminata = f.tieneFechaCaminata.value === 'si';
      if (conFechaCaminata && (!f.camAnio.value || !f.camMes.value || !f.camDia.value)) {
        mostrarAlerta('Falta información', 'Complete la fecha de caminata o indique que no la tiene.');
        return;
      }
      const obj = {
        id: editandoId || generarId(),
        tipo: 'reconocer',
        actividad: f.actividad.value,
        nombre: f.nombre.value.trim(),
        provincia: f.provincia.value,
        fechaReconocimiento: armarFecha(f.recAnio.value, f.recMes.value, f.recDia.value),
        fechaCaminata: conFechaCaminata ? armarFecha(f.camAnio.value, f.camMes.value, f.camDia.value) : null,
        tipoRuta: f.tipoRuta.value || null,
        contacto: f.contacto.value.trim() || null,
        dificultad: f.dificultad.value || null,
        kilometraje: f.kilometraje.value ? parseFloat(f.kilometraje.value) : null,
        invierno: f.invierno.value || null,
        terreno: f.terreno.value || null,
        descripcion: f.descripcion.value.trim() || null,
        precioBuseta: conFechaCaminata && f.precioBuseta.value ? parseFloat(f.precioBuseta.value) : null
      };
      if (f.tipoRuta.value === 'circular') {
        obj.mapa = f.mapa ? (f.mapa.value.trim() || null) : null;
      } else if (f.tipoRuta.value === 'lineal') {
        obj.mapaInicio = f.mapaInicio ? (f.mapaInicio.value.trim() || null) : null;
        obj.mapaFin = f.mapaFin ? (f.mapaFin.value.trim() || null) : null;
      }
      if (editandoId) {
        const i = datos.reconocer.findIndex(x => x.id === editandoId);
        if (i !== -1) datos.reconocer[i] = obj;
        editandoId = null;
      } else {
        datos.reconocer.push(obj);
      }
      guardarDatos();
      f.reset();
      inicializarFechas();
      actualizarEnlacesRuta('');
      actualizarCamposActividad('');
      document.getElementById('tituloModalPorReconocer').textContent = 'Registrar lugar por reconocer';
      cerrarModal('modalPorReconocer');
      renderizarLista();
      renderizarCaminatasConFecha();
      mostrarAlerta('Éxito', 'Lugar guardado correctamente.');
    }


    function guardarConocido(e) {
      e.preventDefault();
      const f = e.target;
      const obj = {
        id: editandoId || generarId(),
        tipo: 'conocido',
        nombre: f.nombre.value.trim(),
        provincia: f.provincia.value,
        cantidadGrupos: f.cantidadGrupos.value ? parseInt(f.cantidadGrupos.value) : null,
        dificultad: f.dificultad.value || null,
        kilometraje: f.kilometraje.value ? parseFloat(f.kilometraje.value) : null,
        invierno: f.invierno.value || null,
        terreno: f.terreno.value || null
      };
      if (editandoId) {
        const i = datos.conocidos.findIndex(x => x.id === editandoId);
        if (i !== -1) datos.conocidos[i] = obj;
        editandoId = null;
      } else {
        datos.conocidos.push(obj);
      }
      guardarDatos();
      f.reset();
      document.getElementById('tituloModalYaConocido').textContent = 'Registrar lugar ya conocido';
      cerrarModal('modalYaConocido');
      renderizarListaConocidos();
      renderizarLista();
      renderizarCaminatasConFecha();
      mostrarAlerta('Éxito', 'Lugar guardado correctamente.');
    }


    function escapar(texto) {
      if (texto == null) return '';
      return String(texto)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }


    function renderizarLista() {
      const lista = document.getElementById('listaCaminatas');
      const sin = document.getElementById('sinCaminatas');
      const contador = document.getElementById('contadorCaminatas');
      if (contador) contador.textContent = '(' + datos.reconocer.length + ')';
      const busq = document.getElementById('buscadorCaminatas');
      const busqueda = busq ? busq.value.trim().toLowerCase() : '';
      const todos = [...datos.reconocer, ...datos.conocidos].sort((a, b) => a.nombre.localeCompare(b.nombre));
      const filtrados = todos.filter(item => {
        if (!busqueda) return true;
        const campos = [
          item.nombre, item.provincia,
          item.tipo === 'reconocer' ? (ACTIVIDAD_LABELS[item.actividad] || item.actividad || '') : '',
          item.fechaReconocimiento || '', item.fechaCaminata || '',
          item.tipoRuta || '', item.contacto || '', item.dificultad || '',
          item.kilometraje != null ? item.kilometraje.toString() : '',
          item.invierno || '', item.terreno || '', item.descripcion || '',
          item.tipo === 'reconocer' ? 'Por reconocer' : 'Ya conocido'
        ].join(' ').toLowerCase();
        return campos.indexOf(busqueda) !== -1;
      });
      lista.innerHTML = '';
      if (filtrados.length === 0) {
        sin.style.display = 'block';
        sin.textContent = busqueda ? 'No hay coincidencias.' : 'No hay caminatas guardadas.';
        return;
      }
      sin.style.display = 'none';
      sin.textContent = 'No hay caminatas guardadas.';
      const porProvincia = {};
      filtrados.forEach(item => {
        const p = item.provincia || 'Sin provincia';
        if (!porProvincia[p]) porProvincia[p] = [];
        porProvincia[p].push(item);
      });
      const provincias = Object.keys(porProvincia).sort();
      let acordeonHtml = '';
      provincias.forEach(prov => {
        const items = porProvincia[prov];
        const id = 'prov-' + prov.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const encabezadoId = id + '-header';
        const cuerpoId = id + '-cuerpo';
        let cards = '';
        items.forEach(item => {
          const tipoLabel = item.tipo === 'reconocer' ? 'Por reconocer' : 'Ya conocido';
          const badgeClass = item.tipo === 'reconocer' ? 'bg-warning text-dark' : 'bg-success';
          let html = '<div class="walk-card p-2 mb-2" onclick="abrirDetalle(\'' + escapar(item.id) + '\')">' +
            '<div class="d-flex justify-content-between align-items-start">' +
              '<strong>' + escapar(item.nombre) + '</strong>' +
              '<span class="badge ' + badgeClass + '">' + escapar(tipoLabel) + '</span></div>' +
              '<div class="text-secondary">' + escapar(item.provincia) + '</div>' +
              (item.actividad ? '<div class="text-secondary small">' + escapar(ACTIVIDAD_LABELS[item.actividad] || item.actividad) + '</div>' : '');
          if (item.tipo === 'reconocer' && item.fechaCaminata) {
            const fc = parsearFechaISO(item.fechaCaminata);
            html += '<div class="text-secondary">Caminata: ' + formatearFecha(fc) + ' (' + DIAS_SEMANA[fc.getDay()] + ')</div>';
            const cercano = feriadoCercano(item.fechaCaminata);
            if (cercano) {
              const dias = Math.abs(cercano.diasDiferencia);
              const cuando = dias === 0 ? 'coincide con' : (cercano.diasDiferencia > 0 ? ('a ' + dias + ' día(s) después de') : ('a ' + dias + ' día(s) antes de'));
              html += '<div class="badge bg-danger align-self-start">⚠ ' + cuando + ' ' + escapar(cercano.feriado.nombre) + ' (' + formatearFecha(cercano.feriado.fecha) + ')</div>';
            }
          }
          html += '</div>';
          cards += html;
        });
        acordeonHtml += '<div class="accordion-item">' +
          '<h2 class="accordion-header" id="' + encabezadoId + '">' +
            '<button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#' + cuerpoId + '" aria-expanded="false" aria-controls="' + cuerpoId + '">' +
              escapar(prov) + ' <span class="badge bg-secondary ms-2">' + items.length + '</span>' +
            '</button>' +
          '</h2>' +
          '<div id="' + cuerpoId + '" class="accordion-collapse collapse" aria-labelledby="' + encabezadoId + '" data-bs-parent="#listaCaminatas">' +
            '<div class="accordion-body p-2 d-flex flex-column">' + cards + '</div>' +
          '</div>' +
        '</div>';
      });
      lista.className = 'accordion';
      lista.innerHTML = acordeonHtml;
    }

