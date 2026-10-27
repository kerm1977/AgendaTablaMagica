/* ARCHIVO: js/core/tail.js — núcleo Agenda Tribu */

        // === FIN MÓDULO JS: AJUSTES ===
        // === INICIO BLOQUE MODULAR PROTEGIDO: LISTAS / CAMINATAS ===
        // --- STREAMING_CHUNK: Caminata Management (Home) ---
        // FLASK: Este módulo genera HTML dinámico. Recomendación: endpoint
        //        /api/caminatas con JSON + plantilla Jinja2. Conservar filtro
        //        y paginación en backend. CRÍTICO: createNewCaminata, openCaminata,
        //        confirmarBorradoCaminata y marcarAsistencia usan onclick en HTML.
        let caminatasPaginaActual = 1;
        const CAMINATAS_POR_PAGINA = 5;

        // === FIN BLOQUE MODULAR: LISTAS / CAMINATAS ===

        let directorioEnEdicion = null;

        const ICONOS_DIRECTORIO = {
            'Persona': 'fa-user',
            'Restaurante': 'fa-utensils',
            'Transporte Terrestre': 'fa-bus',
            'Lancha': 'fa-ship',
            'Hotel': 'fa-hotel',
            'Cabina': 'fa-bed',
            'Guía': 'fa-map-signs',
            'Finca': 'fa-tractor',
            'Parque Nacional': 'fa-tree',
            'Bosque Nuboso': 'fa-cloud',
            'Reserva Biológica': 'fa-leaf',
            'El Camino de Costa Rica': 'fa-hiking'
        };

        let confettiAnimId = null;

        const RETIROS_POR_PAGINA = 10;
        let historialRetirosOrdenado = [];
        let historialRetirosPaginaActual = 1;

        const PARTICIPACION_POR_PAGINA = 10;
        let historialParticipacionOrdenado = [];
        let historialParticipacionPaginaActual = 1;

        let directorioViendoId = null;
        let verContactoParticipacionesPagina = 1;
        let verContactoRetirosPagina = 1;
        const VER_CONTACTO_POR_PAGINA = 10;

        // --- CONFIGURACIÓN DE TEMA ---
        let escalaFuenteApp = 16;

        let debounceSaveTemaTimer = null;

        window.addEventListener('message', (e) => {
            if (e.data && e.data.type === 'agendaDatosActualizados' && e.data.payload) {
                try { localStorage.setItem('agendaDatos', JSON.stringify(e.data.payload)); } catch (err) {}
            }
        });

        // === FIN BLOQUE MODULAR: DIRECTORIO ===

        // Recorre las notas y muestra un modal con los recordatorios de hoy.
        let recordatoriosActuales = [];

        // --- ORACIÓN DE LA TRIBU ---
        const ORACION_TRIBU = `Oración de La Tribu

GRACIAS SEÑOR POR ESTE HERMOSO DÍA QUE NOS HAS REGALADO.

POR NUESTROS AMIGOS Y AMIGAS QUE NOS ACOMPAÑAN EN ESTA ACTIVIDAD Y AQUELLOS QUE NO PUDIERON ESTAR HOY CON NOSOTROS.

NOS AMPARAMOS A TU PROTECCIÓN Y LA DE NUESTROS FAMILIARES QUE NOS ESPERAN EN CASA.

PROTEGE A LOS INDEFENSOS QUE SUFREN LA AGRESIÓN Y ABANDONO DE CUALQUIER TIPO.

PONEMOS A TODAS LAS PERSONAS QUE ESTÁN EN LOS HOSPITALES, A LOS PRIVADOS DE LIBERTAD Y DE MOVIMIENTO QUE DESEAN TENER LA OPORTUNIDAD QUE NOSOTROS TENEMOS EN ESTE DÍA... ACOMPÁÑALOS Y DALES FUERZA PARA VENCER SU ANGUSTIA.

QUE TU PROTECCIÓN LLEGUE A LOS DEMÁS GRUPOS Y SENDERISTAS DEL MUNDO QUE COMPARTEN NUESTRA MISMA PASIÓN PARA QUE LLEVEMOS UN CORAZÓN PASIVO, ALEGRE Y SERENO CON UN ESPÍRITU PROTECTOR DE LA NATURALEZA Y NUESTRO ENTORNO, DISFRUTANDO ASÍ CADA PASO QUE DAMOS EN NUESTRA NACIÓN Y NUESTRA TIERRA.

QUE HOY LA NATURALEZA Y LA MONTAÑA SE SOMETAN A TU ORDEN Y A TU PROTECCIÓN..... PARA QUE CONVIVAMOS CON ELLA DE MANERA PASIVA Y ARMONIOSA.

FORTALECE NUESTRA AMISTAD, NUESTRA HERMANDAD Y DIOS CUBRA CON SU SANGRE PRECIOSA A ESTE GRUPO LLAMADO LA TRIBU.`;

        let tamanioOracion = 1.25;

        // --- EDITOR DE FLYERS ---
        const FLYER_RATIOS = { '9:16': [1080, 1920], '16:9': [1920, 1080] };
        let flyerImg = null;
        let flyerCurrentFileName = 'flyer';
        let flyerListenersAdded = false;

        // --- IMÁGENES EN NOTAS: PORTAPAPELES, MENÚ CONTEXTUAL, MODAL Y ARRASTRE ---
        let notaImgActiva = null;
        let modalImagenNota = null;
        let notaImgDrag = null;
        let notaImgDragOffsetX = 0;
        let notaImgDragOffsetY = 0;
        let notaImgDragStartX = 0;
        let notaImgDragStartY = 0;
        let notaImgDragOrigenX = 0;
        let notaImgDragOrigenY = 0;
        let notaImgDragMoved = false;
        let notaImgDragClickBlocked = false;
        let notaImgArrastreListeners = false;
        let notaImgLongPressTimer = null;

        // === FIN MÓDULO JS: NOTAS / FLYER / UTILIDADES DE NOTAS ===
