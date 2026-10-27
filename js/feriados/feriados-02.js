/* ARCHIVO: js/feriados/feriados-02.js */

    function renderizarFeriados() {
      const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
      const anioFin = 2030;
      const feriados = obtenerFeriados(hoy.getFullYear(), anioFin).filter(f => f.fecha >= hoy);
      const cont = document.getElementById('listaFeriados');
      cont.innerHTML = '';
      if (feriados.length === 0) { cont.innerHTML = '<p class="text-muted text-center mt-4">No hay días festivos a partir de hoy.</p>'; return; }
      const porAnio = {};
      feriados.forEach(f => {
        const a = f.fecha.getFullYear();
        if (!porAnio[a]) porAnio[a] = [];
        porAnio[a].push(f);
      });
      const anios = Object.keys(porAnio).sort((a, b) => Number(a) - Number(b));
      let html = '';
      anios.forEach((anio, idx) => {
        html += '<section class="mb-3" aria-labelledby="festivos-' + anio + '">' +
          (idx ? '<hr class="my-3">' : '') +
          '<h6 id="festivos-' + anio + '" class="fw-bold mb-2">' + anio + '</h6><ul class="list-unstyled mb-0">';
        porAnio[anio].forEach(f => {
          html += '<li class="py-2"><strong>' + escapar(f.nombre) + '</strong>' +
            '<div class="small text-secondary">' + DIAS_SEMANA[f.fecha.getDay()] + ' · ' + formatearFecha(f.fecha) + '</div></li>';
        });
        html += '</ul></section>';
      });
      cont.innerHTML = html;
    }


    function textoFeriados() {
      const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
      const anioFin = 2030;
      const feriados = obtenerFeriados(hoy.getFullYear(), anioFin).filter(f => f.fecha >= hoy);
      let t = '*Días festivos de Costa Rica (desde hoy hasta 2030)*\n\n';
      const porAnio = {};
      feriados.forEach(f => {
        const a = f.fecha.getFullYear();
        if (!porAnio[a]) porAnio[a] = [];
        porAnio[a].push(f);
      });
      const anios = Object.keys(porAnio).sort((a, b) => Number(a) - Number(b));
      anios.forEach(anio => {
        t += '*' + anio + '*\n';
        porAnio[anio].forEach(f => {
          const esDomingo = f.fecha.getDay() === 0;
          t += formatearFecha(f.fecha) + ' (' + DIAS_SEMANA[f.fecha.getDay()] + ')' + (esDomingo ? ' - Domingo' : '') + ': ' + f.nombre + '\n';
        });
        t += '\n';
      });
      return t;
    }


    function compartirWhatsAppFeriados() {
      const txt = encodeURIComponent(textoFeriados());
      window.open('https://wa.me/?text=' + txt, '_blank');
    }


    function exportarFeriadosTXT() {
      const b = new Blob([textoFeriados()], { type: 'text/plain;charset=utf-8' });
      descargar(b, 'dias_festivos_cr.txt');
    }


    function actualizarCamposActividad(actividad) {
      const contNombre = document.getElementById('contenedorNombre');
      const contProvincia = document.getElementById('contenedorProvincia');
      if (actividad === 'parques') {
        contNombre.innerHTML = '<label class="form-label">Parque Nacional</label>' +
          '<select class="form-select" name="nombre" id="inputNombre" onchange="autoProvinciaParque(this.value)" required>' +
          '<option value="" disabled selected>Seleccione...</option>' +
          PARQUES_NACIONALES.map(p => '<option value="' + p.nombre + '">' + p.nombre + '</option>').join('') +
          '</select>';
        contProvincia.classList.remove('d-none');
        contProvincia.innerHTML = '<label class="form-label">Provincia(s)</label>' +
          '<input type="text" class="form-control" name="provincia" id="selProvincia" readonly placeholder="Se completa automáticamente">';
      } else if (actividad === 'camino') {
        contNombre.innerHTML = '<label class="form-label">Etapa</label>' +
          '<select class="form-select" name="nombre" id="inputNombre" required>' +
          '<option value="" disabled selected>Seleccione...</option>' +
          ETAPAS_CAMINO.map(et => '<option value="' + et + '">' + et + '</option>').join('') +
          '</select>';
        contProvincia.classList.add('d-none');
        contProvincia.innerHTML = '<input type="hidden" name="provincia" id="selProvincia" value="Camino de Costa Rica">';
      } else {
        contNombre.innerHTML = '<label class="form-label">Nombre del lugar</label>' +
          '<input type="text" class="form-control" name="nombre" id="inputNombre" required placeholder="Ej: Volcán Arenal">';
        contProvincia.classList.remove('d-none');
        contProvincia.innerHTML = '<label class="form-label">Provincia</label>' +
          '<select class="form-select" name="provincia" id="selProvincia" required>' +
          '<option value="" disabled selected>Seleccione...</option>' +
          PROVINCIAS_CR.map(p => '<option>' + p + '</option>').join('') +
          '</select>';
      }
    }


    function autoProvinciaParque(nombreParque) {
      const parque = PARQUES_NACIONALES.find(p => p.nombre === nombreParque);
      const inp = document.getElementById('selProvincia');
      if (inp && parque) inp.value = parque.provincias.join(', ');
    }


    function verificarFeriadoCampo(prefix) {
      const anioSel = document.getElementById(prefix + 'Anio');
      const mesSel = document.getElementById(prefix + 'Mes');
      const diaSel = document.getElementById(prefix + 'Dia');
      if (!anioSel || !mesSel || !diaSel || !anioSel.value || !mesSel.value || !diaSel.value) return;
      const fecha = parsearFechaISO(armarFecha(anioSel.value, mesSel.value, diaSel.value));
      const feriados = obtenerFeriados(fecha.getFullYear(), fecha.getFullYear());
      const match = feriados.find(f => f.fecha.getTime() === fecha.getTime());
      if (match) {
        mostrarAlerta('Aviso', 'Cuidado, esta fecha (' + formatearFecha(fecha) + ') es día festivo en Costa Rica: ' + match.nombre + '.');
      }
    }


    function mostrarPrecioBuseta() {
      const anio = document.getElementById('fCamAnio').value;
      const mes = document.getElementById('fCamMes').value;
      const dia = document.getElementById('fCamDia').value;
      const cont = document.getElementById('contenedorBuseta');
      if (anio && mes && dia) {
        cont.classList.remove('d-none');
      } else {
        cont.classList.add('d-none');
        document.getElementById('inputPrecioBuseta').value = '';
      }
    }


    function mostrarFechaCaminata(valor) {
      const cont = document.getElementById('contenedorFechaCaminata');
      if (valor === 'si') {
        cont.classList.remove('d-none');
        const anio = document.getElementById('fCamAnio');
        if (!anio.value) {
          const hoy = new Date();
          const anioInicio = Math.max(2026, hoy.getFullYear());
          anio.value = anioInicio.toString();
          actualizarDias('caminata');
        }
        mostrarPrecioBuseta();
      } else {
        cont.classList.add('d-none');
        document.getElementById('contenedorBuseta').classList.add('d-none');
        document.getElementById('inputPrecioBuseta').value = '';
      }
    }


    function feriadoCercano(fechaStr) {
      if (!fechaStr) return null;
      const fecha = parsearFechaISO(fechaStr);
      const feriados = obtenerFeriados(fecha.getFullYear() - 1, fecha.getFullYear() + 1);
      let mejor = null, mejorDiff = Infinity;
      feriados.forEach(f => {
        const diffDias = Math.round((fecha - f.fecha) / 86400000);
        const abs = Math.abs(diffDias);
        if (abs <= 3 && abs < mejorDiff) {
          mejor = f; mejorDiff = abs;
        }
      });
      if (!mejor) return null;
      const diasDiferencia = Math.round((fecha - mejor.fecha) / 86400000);
      return { feriado: mejor, diasDiferencia: diasDiferencia };
    }


    function actualizarEnlacesRuta(tipo) {
      const c = document.getElementById('contenedorEnlaces');
      if (!tipo) { c.innerHTML = ''; return; }
      if (tipo === 'circular') {
        c.innerHTML = '<label class="form-label">Enlace de Google Maps del lugar</label>' +
          '<input type="url" class="form-control" name="mapa" placeholder="https://maps.app.goo.gl/...">';
      } else {
        c.innerHTML = '<label class="form-label">Enlace de Google Maps (inicio)</label>' +
          '<input type="url" class="form-control mb-2" name="mapaInicio" placeholder="Inicio">' +
          '<label class="form-label">Enlace de Google Maps (final)</label>' +
          '<input type="url" class="form-control" name="mapaFin" placeholder="Final">';
      }
    }

