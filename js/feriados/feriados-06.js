/* ARCHIVO: js/feriados/feriados-06.js */

    function exportarConFechaAsignadaJSON() {
      const todos = [...datos.reconocer, ...datos.conocidos].filter(item => item.fechaCaminata)
        .sort((a, b) => a.provincia.localeCompare(b.provincia) || a.fechaCaminata.localeCompare(b.fechaCaminata));
      if (todos.length === 0) { mostrarAlerta('Aviso', 'No hay caminatas con fecha asignada.'); return; }
      const porProvincia = {};
      todos.forEach(item => {
        const p = item.provincia || 'Sin provincia';
        if (!porProvincia[p]) porProvincia[p] = [];
        porProvincia[p].push(item);
      });
      const provincias = Object.keys(porProvincia).sort();
      const ordenado = {};
      provincias.forEach(prov => { ordenado[prov] = porProvincia[prov]; });
      const b = new Blob([JSON.stringify(ordenado, null, 2)], { type: 'application/json' });
      descargar(b, 'caminatas_con_fecha.json');
    }


    function importarTodoJSON(input) {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const data = JSON.parse(e.target.result);
          if (data && Array.isArray(data.reconocer) && Array.isArray(data.conocidos)) {
            datos = data;
            guardarDatos();
            try { localStorage.setItem('agendaDatos', JSON.stringify(datos)); } catch (e) {}
            renderizarLista();
            renderizarListaConocidos();
            mostrarAlerta('Éxito', 'Importación completada.');
          } else {
            throw new Error('El archivo no tiene la estructura esperada.');
          }
        } catch (err) {
          mostrarAlerta('Error', 'Error al importar: ' + err.message);
        }
        input.value = '';
      };
      reader.readAsText(file);
    }

