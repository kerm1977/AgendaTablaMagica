/* ARCHIVO: js/feriados/feriados-01.js */

    function abrirDB() {
      return new Promise((resolve, reject) => {
        if (db) return resolve(db);
        if (!('indexedDB' in window)) return reject(new Error('IndexedDB no soportado'));
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = (e) => {
          const d = e.target.result;
          if (!d.objectStoreNames.contains(STORE_NAME)) {
            d.createObjectStore(STORE_NAME, { keyPath: 'id' });
          }
        };
        req.onsuccess = (e) => { db = e.target.result; resolve(db); };
        req.onerror = (e) => reject(e);
      });
    }


    function cargarDatosAsync() {
      return abrirDB().then(() => new Promise((resolve) => {
        const tx = db.transaction([STORE_NAME], 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const r = store.get(DB_KEY);
        r.onsuccess = (e) => {
          const res = e.target.result;
          if (res && res.datos) datos = res.datos;
          resolve();
        };
        r.onerror = () => { fallbackCargarLocal(); resolve(); };
      })).catch(() => { fallbackCargarLocal(); });
    }


    function fallbackCargarLocal() {
      const s = localStorage.getItem(LS_KEY);
      if (s) { try { datos = JSON.parse(s); } catch (e) { datos = { reconocer: [], conocidos: [] }; } }
    }


    function notificarDatosAParent() {
      try { localStorage.setItem('agendaDatos', JSON.stringify(datos)); } catch (e) {}
      if (window.parent === window) return;
      const hoy = new Date();
      const anioFin = 2030;
      const feriados = [];
      for (let a = hoy.getFullYear(); a <= anioFin; a++) {
        feriados.push(...obtenerFeriados(a, a));
      }
      window.parent.postMessage({
        type: 'agendaDatosActualizados',
        payload: {
          reconocer: (datos && datos.reconocer) ? datos.reconocer : [],
          conocidos: (datos && datos.conocidos) ? datos.conocidos : [],
          feriados: feriados.map(f => ({ nombre: f.nombre, fecha: formatearFecha(f.fecha) }))
        }
      }, '*');
    }


    function guardarDatos() {
      try { localStorage.setItem('agendaDatos', JSON.stringify(datos)); } catch (e) {}
      if (!('indexedDB' in window)) { localStorage.setItem(LS_KEY, JSON.stringify(datos)); notificarDatosAParent(); return; }
      abrirDB().then(() => {
        const tx = db.transaction([STORE_NAME], 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put({ id: DB_KEY, datos: datos });
      }).catch(() => { localStorage.setItem(LS_KEY, JSON.stringify(datos)); });
      notificarDatosAParent();
    }

    function generarId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }


    function diasEnMes(anio, mes) {
      return new Date(anio, mes, 0).getDate();
    }


    function armarFecha(a, m, d) {
      return a + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    }


    function actualizarDias(grupo) {
      const prefix = grupo === 'reconocer' ? 'fRec' : 'fCam';
      const anioSel = document.getElementById(prefix + 'Anio');
      const mesSel = document.getElementById(prefix + 'Mes');
      const diaSel = document.getElementById(prefix + 'Dia');
      if (!anioSel || !anioSel.value) return;
      const anio = parseInt(anioSel.value);
      const mesActual = mesSel.value ? parseInt(mesSel.value) : null;
      const diaActual = diaSel.value ? parseInt(diaSel.value) : null;
      let mesHtml = '';
      for (let m = 1; m <= 12; m++) {
        const selected = (mesActual === m) ? 'selected' : '';
        mesHtml += '<option value="' + m + '" ' + selected + '>' + String(m).padStart(2, '0') + '</option>';
      }
      mesSel.innerHTML = mesHtml;
      if (!mesSel.value) mesSel.value = 1;
      const selM = parseInt(mesSel.value);
      const maxD = new Date(anio, selM, 0).getDate();
      let diaHtml = '';
      for (let d = 1; d <= maxD; d++) {
        const selected = (diaActual === d) ? 'selected' : '';
        diaHtml += '<option value="' + d + '" ' + selected + '>' + String(d).padStart(2, '0') + '</option>';
      }
      diaSel.innerHTML = diaHtml;
      if ((diaActual || 0) > maxD || !diaSel.value) diaSel.value = 1;
    }


    function inicializarFechas() {
      const hoy = new Date();
      const hoyY = hoy.getFullYear();
      const anioInicio = Math.max(2026, hoyY);
      const anioFin = anioInicio + 10;
      let anioHtml = '';
      for (let a = anioInicio; a <= anioFin; a++) {
        const selected = (a === anioInicio) ? 'selected' : '';
        anioHtml += '<option value="' + a + '" ' + selected + '>' + a + '</option>';
      }
      ['fRecAnio', 'fCamAnio'].forEach(id => {
        document.getElementById(id).innerHTML = '<option value="" disabled selected>Año</option>' + anioHtml;
      });
      document.getElementById('fRecAnio').value = anioInicio.toString();
      actualizarDias('reconocer');
      mostrarFechaCaminata('no');
    }


    function cambiarFuente(delta) {
      fuente = Math.max(12, Math.min(24, fuente + delta));
      document.documentElement.style.setProperty('--font-size-base', fuente + 'px');
    }


    function mostrarVista(id, btn) {
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      document.getElementById(id).classList.add('active');
      document.querySelectorAll('#tabs .nav-link').forEach(n => n.classList.remove('active'));
      if (btn) btn.classList.add('active');
      if (id === 'verCaminatas') renderizarLista();
      if (id === 'caminatasConFecha') renderizarCaminatasConFecha();
      if (id === 'yaConocidos') renderizarListaConocidos();
      if (id === 'diasFestivos') renderizarFeriados();
    }


    function cerrarModal(id) {
      const el = document.getElementById(id);
      const instancia = bootstrap.Modal.getInstance(el);
      if (instancia) instancia.hide();
    }


    function calcularPascua(anio) {
      const a = anio % 19;
      const b = Math.floor(anio / 100);
      const c = anio % 100;
      const d = Math.floor(b / 4);
      const e = b % 4;
      const f = Math.floor((b + 8) / 25);
      const g = Math.floor((b - f + 1) / 3);
      const h = (19 * a + b - d - g + 15) % 30;
      const i = Math.floor(c / 4);
      const k = c % 4;
      const l = (32 + 2 * e + 2 * i - h - k) % 7;
      const m = Math.floor((a + 11 * h + 22 * l) / 451);
      const mes = Math.floor((h + l - 7 * m + 114) / 31);
      const dia = ((h + l - 7 * m + 114) % 31) + 1;
      return new Date(anio, mes - 1, dia);
    }


    function obtenerFeriados(anioInicio, anioFin) {
      const feriados = [];
      for (let anio = anioInicio; anio <= anioFin; anio++) {
        FERIADOS_FIJOS.forEach(f => {
          feriados.push({ fecha: new Date(anio, f.mes - 1, f.dia), nombre: f.nombre });
        });
        const pascua = calcularPascua(anio);
        const juevesSanto = new Date(pascua); juevesSanto.setDate(pascua.getDate() - 3);
        const viernesSanto = new Date(pascua); viernesSanto.setDate(pascua.getDate() - 2);
        feriados.push({ fecha: juevesSanto, nombre: 'Jueves Santo' });
        feriados.push({ fecha: viernesSanto, nombre: 'Viernes Santo' });
      }
      feriados.sort((a, b) => a.fecha - b.fecha);
      return feriados;
    }


    function formatearFecha(d) {
      return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
    }


    function parsearFechaISO(fechaStr) {
      const p = fechaStr.split('-').map(Number);
      return new Date(p[0], p[1] - 1, p[2]);
    }

