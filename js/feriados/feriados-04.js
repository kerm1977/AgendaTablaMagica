/* ARCHIVO: js/feriados/feriados-04.js */

    function renderizarListaConocidos() {
      const lista = document.getElementById('listaConocidos');
      const sin = document.getElementById('sinConocidos');
      const contador = document.getElementById('contadorConocidos');
      if (contador) contador.textContent = '(' + datos.conocidos.length + ')';
      const busq = document.getElementById('buscadorConocidos');
      const busqueda = busq ? busq.value.trim().toLowerCase() : '';
      const conocidos = [...datos.conocidos].sort((a, b) => a.nombre.localeCompare(b.nombre));
      const filtrados = conocidos.filter(item => {
        if (!busqueda) return true;
        const campos = [
          item.nombre, item.provincia,
          item.cantidadGrupos != null ? item.cantidadGrupos.toString() : '',
          item.dificultad || '',
          item.kilometraje != null ? item.kilometraje.toString() : '',
          item.invierno || '', item.terreno || '',
          'Ya conocido'
        ].join(' ').toLowerCase();
        return campos.indexOf(busqueda) !== -1;
      });
      lista.innerHTML = '';
      if (filtrados.length === 0) {
        sin.style.display = 'block';
        sin.textContent = busqueda ? 'No hay coincidencias.' : 'No hay lugares ya conocidos.';
        return;
      }
      sin.style.display = 'none';
      sin.textContent = 'No hay lugares ya conocidos.';
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
        const id = 'con-' + prov.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const encabezadoId = id + '-header';
        const cuerpoId = id + '-cuerpo';
        let cards = '';
        items.forEach(item => {
          let html = '<div class="walk-card p-2 mb-2" onclick="abrirDetalle(\'' + escapar(item.id) + '\')">' +
            '<div class="d-flex justify-content-between align-items-start">' +
              '<strong>' + escapar(item.nombre) + '</strong>' +
              '<span class="badge bg-success">Ya conocido</span></div>' +
              '<div class="text-secondary">' + escapar(item.provincia) + '</div>' +
              '<div class="text-secondary small">Grupos: ' + escapar(item.cantidadGrupos) + ' | Dificultad: ' + escapar(item.dificultad) + '</div>';
          html += '</div>';
          cards += html;
        });
        acordeonHtml += '<div class="accordion-item">' +
          '<h2 class="accordion-header" id="' + encabezadoId + '">' +
            '<button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#' + cuerpoId + '" aria-expanded="false" aria-controls="' + cuerpoId + '">' +
              escapar(prov) + ' <span class="badge bg-secondary ms-2">' + items.length + '</span>' +
            '</button>' +
          '</h2>' +
          '<div id="' + cuerpoId + '" class="accordion-collapse collapse" aria-labelledby="' + encabezadoId + '" data-bs-parent="#listaConocidos">' +
            '<div class="accordion-body p-2 d-flex flex-column">' + cards + '</div>' +
          '</div>' +
        '</div>';
      });
      lista.className = 'accordion';
      lista.innerHTML = acordeonHtml;
    }


    function renderizarCaminatasConFecha() {
      const lista = document.getElementById('listaCaminatasConFecha');
      const sin = document.getElementById('sinCaminatasConFecha');
      const contador = document.getElementById('contadorConFecha');
      const todos = [...datos.reconocer, ...datos.conocidos]
        .filter(item => item.fechaCaminata)
        .sort((a, b) => a.provincia.localeCompare(b.provincia) || a.fechaCaminata.localeCompare(b.fechaCaminata));
      if (contador) contador.textContent = '(' + todos.length + ')';
      lista.innerHTML = '';
      if (todos.length === 0) { sin.style.display = 'block'; return; }
      sin.style.display = 'none';
      const porProvincia = {};
      todos.forEach(item => {
        const p = item.provincia || 'Sin provincia';
        if (!porProvincia[p]) porProvincia[p] = [];
        porProvincia[p].push(item);
      });
      const provincias = Object.keys(porProvincia).sort();
      let acordeonHtml = '';
      provincias.forEach(prov => {
        const items = porProvincia[prov].sort((a, b) => a.fechaCaminata.localeCompare(b.fechaCaminata));
        const id = 'conf-' + prov.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const encabezadoId = id + '-header';
        const cuerpoId = id + '-cuerpo';
        let cards = '';
        items.forEach(item => {
          const tipoLabel = item.tipo === 'reconocer' ? 'Por reconocer' : 'Ya conocido';
          const badgeClass = item.tipo === 'reconocer' ? 'bg-warning text-dark' : 'bg-success';
          const fc = parsearFechaISO(item.fechaCaminata);
          let html = '<div class="walk-card p-2 mb-2" onclick="abrirDetalle(\'' + escapar(item.id) + '\')">' +
            '<div class="d-flex justify-content-between align-items-start">' +
              '<strong>' + escapar(item.nombre) + '</strong>' +
              '<span class="badge ' + badgeClass + '">' + escapar(tipoLabel) + '</span></div>' +
              '<div class="text-secondary">' + escapar(item.provincia) + '</div>' +
              '<div class="text-secondary small">Fecha caminata: ' + formatearFecha(fc) + ' (' + DIAS_SEMANA[fc.getDay()] + ')</div>' +
              (item.actividad ? '<div class="text-secondary small">' + escapar(ACTIVIDAD_LABELS[item.actividad] || item.actividad) + '</div>' : '');
          html += '</div>';
          cards += html;
        });
        acordeonHtml += '<div class="accordion-item">' +
          '<h2 class="accordion-header" id="' + encabezadoId + '">' +
            '<button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#' + cuerpoId + '" aria-expanded="false" aria-controls="' + cuerpoId + '">' +
              escapar(prov) + ' <span class="badge bg-secondary ms-2">' + items.length + '</span>' +
            '</button>' +
          '</h2>' +
          '<div id="' + cuerpoId + '" class="accordion-collapse collapse" aria-labelledby="' + encabezadoId + '" data-bs-parent="#listaCaminatasConFecha">' +
            '<div class="accordion-body p-2 d-flex flex-column">' + cards + '</div>' +
          '</div>' +
        '</div>';
      });
      lista.className = 'accordion';
      lista.innerHTML = acordeonHtml;
    }


    function cargarFechaEnSelects(prefix, fechaStr, grupo) {
      if (!fechaStr) return;
      const [a, m, d] = fechaStr.split('-');
      const mes = parseInt(m, 10).toString();
      const dia = parseInt(d, 10).toString();
      document.getElementById(prefix + 'Anio').value = a;
      document.getElementById(prefix + 'Mes').value = mes;
      document.getElementById(prefix + 'Dia').value = dia;
      actualizarDias(grupo);
    }


    function cargarFormularioReconocer(item) {
      const f = document.getElementById('formReconocer');
      f.actividad.value = item.actividad;
      actualizarCamposActividad(item.actividad);
      const inpNombre = document.getElementById('inputNombre');
      if (inpNombre) inpNombre.value = item.nombre;
      const selProv = document.getElementById('selProvincia');
      if (selProv) selProv.value = item.provincia;
      if (item.actividad === 'parques') autoProvinciaParque(item.nombre);
      cargarFechaEnSelects('fRec', item.fechaReconocimiento, 'reconocer');
      if (item.fechaCaminata) {
        f.tieneFechaCaminata.value = 'si';
        cargarFechaEnSelects('fCam', item.fechaCaminata, 'caminata');
        mostrarFechaCaminata('si');
        document.getElementById('inputPrecioBuseta').value = item.precioBuseta != null ? item.precioBuseta : '';
      } else {
        f.tieneFechaCaminata.value = 'no';
        mostrarFechaCaminata('no');
      }
      f.tipoRuta.value = item.tipoRuta || '';
      actualizarEnlacesRuta(item.tipoRuta || '');
      if (item.tipoRuta === 'circular' && f.mapa) f.mapa.value = item.mapa || '';
      if (item.tipoRuta === 'lineal') {
        if (f.mapaInicio) f.mapaInicio.value = item.mapaInicio || '';
        if (f.mapaFin) f.mapaFin.value = item.mapaFin || '';
      }
      f.contacto.value = item.contacto || '';
      f.dificultad.value = item.dificultad || '';
      f.kilometraje.value = item.kilometraje != null ? item.kilometraje : '';
      f.invierno.value = item.invierno || '';
      f.terreno.value = item.terreno || '';
      f.descripcion.value = item.descripcion || '';
      document.getElementById('tituloModalPorReconocer').textContent = 'Editar lugar por reconocer';
    }


    function cargarFormularioConocido(item) {
      const f = document.getElementById('formConocidos');
      f.nombre.value = item.nombre;
      f.provincia.value = item.provincia;
      f.cantidadGrupos.value = item.cantidadGrupos != null ? item.cantidadGrupos : '';
      f.dificultad.value = item.dificultad || '';
      f.kilometraje.value = item.kilometraje != null ? item.kilometraje : '';
      f.invierno.value = item.invierno || '';
      f.terreno.value = item.terreno || '';
      document.getElementById('tituloModalYaConocido').textContent = 'Editar lugar ya conocido';
    }


    function editarActual() {
      if (!itemActual) return;
      editandoId = itemActual.id;
      cerrarModal('modalDetalle');
      if (itemActual.tipo === 'reconocer') {
        cargarFormularioReconocer(itemActual);
        const modal = new bootstrap.Modal(document.getElementById('modalPorReconocer'));
        modal.show();
      } else {
        cargarFormularioConocido(itemActual);
        const modal = new bootstrap.Modal(document.getElementById('modalYaConocido'));
        modal.show();
      }
    }

