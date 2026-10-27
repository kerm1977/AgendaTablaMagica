/* ARCHIVO: js/directorio/directorio-12.js */
        
        function exportarEstadisticasWhatsApp() {
            let texto = "📊 ESTADÍSTICAS DEL SITIO\n\n";
            
            // Estadísticas generales
            texto += "📈 ESTADÍSTICAS GENERALES\n";
            texto += `🏕️ Listas activas: ${caminatas.length}\n`;
            texto += `👥 Contactos en directorio: ${directorioPersonas.length}\n`;
            texto += `📝 Notas: ${notas.length}\n`;
            texto += `✅ Personas que han participado: ${new Set(obtenerTodasParticipaciones().map(p => (p.nombre || '').toLowerCase().trim())).size}\n`;
            texto += `❌ Personas que se han retirado: ${new Set(historialRetiros.map(r => (r.nombre || '').toLowerCase().trim())).size}\n`;
            texto += `💰 Total en precios de buseta: ₡${preciosBuseta.reduce((acc, p) => acc + Number(p.monto || 0), 0)}\n`;
            
            let asistenciaParticiparon = 0;
            let asistenciaNoParticiparon = 0;
            historialAsistencia.forEach(reg => {
                if (reg.asistencia === 'participo') asistenciaParticiparon++;
                else if (reg.asistencia === 'no-participo') asistenciaNoParticiparon++;
            });
            texto += `✅ Asistencias: participaron: ${asistenciaParticiparon}\n`;
            texto += `❌ Asistencias: no participaron: ${asistenciaNoParticiparon}\n\n`;
            
            // Estadísticas por actividad
            texto += "📊 CAMINATAS Y PARTICIPANTES POR ACTIVIDAD\n\n";
            
            const actividadesOrden = ['Caminata', 'Internacional', 'Parque Nacional', 'El Camino de Costa Rica', 'Fiesta', 'Convivio', 'Reunión', 'Otro'];
            const porActividad = {};
            const participantesPorActividad = {};
            const retiradosPorActividad = {};
            actividadesOrden.forEach(a => { 
                porActividad[a] = 0; 
                participantesPorActividad[a] = new Set(); 
                retiradosPorActividad[a] = new Set();
            });

            caminatas.forEach(cam => {
                const act = cam.actividad || 'Otro';
                const agrupado = actividadesOrden.includes(act) ? act : 'Otro';
                porActividad[agrupado] = (porActividad[agrupado] || 0) + 1;
                (cam.pasajeros || []).forEach(pas => {
                    const nombre = (pas.nombre || '').toLowerCase().trim();
                    if (nombre) participantesPorActividad[agrupado].add(nombre);
                });
                
                const retiradosEnCaminata = historialRetiros.filter(r => r.camId === cam.id);
                retiradosEnCaminata.forEach(r => {
                    const nombre = (r.nombre || '').toLowerCase().trim();
                    if (nombre) retiradosPorActividad[agrupado].add(nombre);
                });
            });
            
            actividadesOrden.forEach(act => {
                const total = porActividad[act] || 0;
                const participantes = (participantesPorActividad[act] || new Set()).size;
                const retirados = (retiradosPorActividad[act] || new Set()).size;
                
                if (total === 0) return;
                
                texto += `🏕️ ${act} (${participantes}) (${retirados})\n`;
                texto += `   🥾 Caminatas: ${total}\n`;
                texto += `   ✅ Participantes: ${participantes}\n`;
                texto += `   ❌ Retirados: ${retirados}\n`;
                
                const caminatasActividad = caminatas.filter(c => (c.actividad || 'Otro') === act);
                
                if (act === 'Internacional') {
                    const porPais = {};
                    caminatasActividad.forEach(cam => {
                        const pais = cam.pais || 'Otro';
                        if (!porPais[pais]) {
                            porPais[pais] = { caminatas: [], participantes: new Set(), retirados: new Set() };
                        }
                        porPais[pais].caminatas.push(cam);
                        (cam.pasajeros || []).forEach(pas => {
                            const nombre = (pas.nombre || '').toLowerCase().trim();
                            if (nombre) porPais[pais].participantes.add(nombre);
                        });
                        const retiradosEnCaminata = historialRetiros.filter(r => r.camId === cam.id);
                        retiradosEnCaminata.forEach(r => {
                            const nombre = (r.nombre || '').toLowerCase().trim();
                            if (nombre) porPais[pais].retirados.add(nombre);
                        });
                    });
                    
                    Object.keys(porPais).forEach(pais => {
                        const data = porPais[pais];
                        texto += `   🌍 ${pais}\n`;
                        texto += `      🥾 ${data.caminatas.length} caminatas\n`;
                        texto += `      ✅ ${data.participantes.size} participantes\n`;
                        texto += `      ❌ ${data.retirados.size} retirados\n`;
                    });
                } else if (act === 'El Camino de Costa Rica') {
                    const porEtapa = {};
                    caminatasActividad.forEach(cam => {
                        const etapa = cam.etapa || 'Sin etapa';
                        if (!porEtapa[etapa]) {
                            porEtapa[etapa] = { caminatas: [], participantes: new Set(), retirados: new Set() };
                        }
                        porEtapa[etapa].caminatas.push(cam);
                        (cam.pasajeros || []).forEach(pas => {
                            const nombre = (pas.nombre || '').toLowerCase().trim();
                            if (nombre) porEtapa[etapa].participantes.add(nombre);
                        });
                        const retiradosEnCaminata = historialRetiros.filter(r => r.camId === cam.id);
                        retiradosEnCaminata.forEach(r => {
                            const nombre = (r.nombre || '').toLowerCase().trim();
                            if (nombre) porEtapa[etapa].retirados.add(nombre);
                        });
                    });
                    
                    Object.keys(porEtapa).forEach(etapa => {
                        const data = porEtapa[etapa];
                        texto += `   🚶 ${etapa}\n`;
                        texto += `      🥾 ${data.caminatas.length} caminatas\n`;
                        texto += `      ✅ ${data.participantes.size} participantes\n`;
                        texto += `      ❌ ${data.retirados.size} retirados\n`;
                    });
                } else if (act === 'Parque Nacional') {
                    caminatasActividad.forEach(cam => {
                        const participantesCam = new Set();
                        const retiradosCam = new Set();
                        (cam.pasajeros || []).forEach(pas => {
                            const nombre = (pas.nombre || '').toLowerCase().trim();
                            if (nombre) participantesCam.add(nombre);
                        });
                        const retiradosEnCaminata = historialRetiros.filter(r => r.camId === cam.id);
                        retiradosEnCaminata.forEach(r => {
                            const nombre = (r.nombre || '').toLowerCase().trim();
                            if (nombre) retiradosCam.add(nombre);
                        });
                        
                        texto += `   🌲 ${cam.nombre}\n`;
                        texto += `      ✅ ${participantesCam.size} participantes\n`;
                        texto += `      ❌ ${retiradosCam.size} retirados\n`;
                    });
                } else {
                    caminatasActividad.forEach(cam => {
                        const participantesCam = new Set();
                        const retiradosCam = new Set();
                        (cam.pasajeros || []).forEach(pas => {
                            const nombre = (pas.nombre || '').toLowerCase().trim();
                            if (nombre) participantesCam.add(nombre);
                        });
                        const retiradosEnCaminata = historialRetiros.filter(r => r.camId === cam.id);
                        retiradosEnCaminata.forEach(r => {
                            const nombre = (r.nombre || '').toLowerCase().trim();
                            if (nombre) retiradosCam.add(nombre);
                        });
                        
                        texto += `   🏔️ ${cam.nombre}\n`;
                        texto += `      ✅ ${participantesCam.size} participantes\n`;
                        texto += `      ❌ ${retiradosCam.size} retirados\n`;
                    });
                }
                
                texto += "\n";
            });
            
            // Inactivos
            const inactivos = calcularInactivos();
            texto += `⏰ INACTIVOS 8 MESES O MÁS: ${inactivos.length}\n`;
            
            const encodedText = encodeURIComponent(texto.trim());
            window.open(`https://wa.me/?text=${encodedText}`, '_blank');
        }

