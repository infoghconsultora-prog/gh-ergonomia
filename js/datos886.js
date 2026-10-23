/* Definición del Protocolo de Ergonomía (Res. SRT 886/15, Anexo I).
 * Textos tomados del formulario editable oficial (res_srt_886_15-formulario-editable.xlsx),
 * con las celdas donde va cada respuesta para poder completar esa misma planilla. */
(function () {
  const MANIF = 'El trabajador presenta alguna manifestación temprana de las enfermedades mencionadas en el Artículo 1° de la presente Resolución.';
  const NOTA2 = 'Si todas las respuestas son NO se presume que el riesgo es tolerable. Si alguna respuesta es SI, el empleador no puede presumir que el riesgo sea tolerable. Por lo tanto, se debe realizar una Evaluación de Riesgos.';

  // Cada bloque: paso1/paso2 = [texto, fila del Excel]. critico = índice (0-based) de la pregunta de paso 1
  // que, si es SI, vuelve la tarea No tolerable sin más análisis.
  const FACTORES = [
    {
      id: 'A', nombre: 'Levantamiento y descenso', titulo: '2.A: LEVANTAMIENTO Y/O DESCENSO MANUAL DE CARGA SIN TRANSPORTE',
      hoja: 'Planilla 2.-a', fecha: 'H31', hojaN: 'H32', usaReba: true,
      bloques: [{
        id: 'A', critico: 2,
        paso1Titulo: 'PASO 1: Identificar si la tarea del puesto de trabajo implica:',
        paso1: [
          ['Levantar y/o bajar manualmente cargas de peso superior a 2 Kg. y hasta 25 Kg.', 9],
          ['Realizar diariamente y en forma cíclica operaciones de levantamiento / descenso con una frecuencia ≥ 1 por hora o ≤ 360 por hora (si se realiza de forma esporádica, consignar NO).', 10],
          ['Levantar y/o bajar manualmente cargas de peso superior a 25 Kg.', 11]
        ],
        nota1: ['Si todas las respuestas son NO, se considera que el riesgo es tolerable.', 'Si alguna de las respuestas 1 a 3 es SI, continuar con el paso 2.', 'Si la respuesta 3 es SI se considera que el riesgo de la tarea es No tolerable, debiendo solicitarse mejoras en tiempo prudencial.'],
        paso2: [
          ['El trabajador levanta, sostiene y deposita la carga sobrepasando con sus manos 30 cm. sobre la altura del hombro.', 19],
          ['El trabajador levanta, sostiene y deposita la carga sobrepasando con sus manos una distancia horizontal mayor de 80 cm. desde el punto medio entre los tobillos.', 20],
          ['Entre la toma y el depósito de la carga, el trabajador gira o inclina la cintura más de 30º a uno u otro lado (o a ambos) considerados desde el plano sagital.', 21],
          ['Las cargas poseen formas irregulares, son difíciles de asir, se deforman o hay movimiento en su interior.', 22],
          ['El trabajador levanta, sostiene y deposita la carga con un solo brazo.', 23],
          [MANIF, 24]
        ]
      }]
    },
    {
      id: 'B', nombre: 'Empuje / arrastre', titulo: '2.B: EMPUJE Y ARRASTRE MANUAL DE CARGA',
      hoja: 'Planilla 2.-b', fecha: 'H32', hojaN: 'H33', usaReba: true,
      bloques: [{
        id: 'B', critico: 2,
        paso1Titulo: 'PASO 1: Identificar si en puesto de trabajo:',
        paso1: [
          ['Se realizan diariamente tareas cíclicas, con una frecuencia ≥ 1 movimiento por jornada (si son esporádicas, consignar NO).', 9],
          ['El trabajador se desplaza empujando y/o arrastrando manualmente un objeto recorriendo una distancia mayor a los 60 metros.', 10],
          ['En el puesto de trabajo se empujan o arrastran cíclicamente objetos (bolsones, cajas, muebles, máquinas, etc.) cuyo esfuerzo medido con dinamómetro supera los 34 kgf.', 11]
        ],
        nota1: ['Si todas las respuestas son NO, se considera que el riesgo es tolerable.', 'Si alguna de las respuestas 1 a 3 es SI, continuar con el paso 2.', 'Si la respuesta 3 es SI debe considerarse que el riesgo de la tarea es No tolerable, debiendo solicitarse mejoras en tiempo prudencial.'],
        paso2: [
          ['Para empujar el objeto rodante se requiere un esfuerzo inicial medido con dinamómetro ≥ 12 Kgf para hombres o 10 Kgf para mujeres.', 19],
          ['Para arrastrar el objeto rodante se requiere un esfuerzo inicial medido con dinamómetro ≥ 10 Kgf para hombres o mujeres.', 20],
          ['El objeto rodante es empujado y/o arrastrado con dificultad (la superficie de deslizamiento es despareja, hay rampas que subir o bajar, hay roturas u obstáculos en el recorrido, ruedas en mal estado, mal diseño del asa, etc.).', 21],
          ['El objeto rodante no puede ser empujado y/o arrastrado con ambas manos, y en caso que lo permita, el apoyo de las manos se encuentra a una altura incómoda (por encima del pecho o por debajo de la cintura).', 22],
          ['En el movimiento de empujar y/o arrastrar, el esfuerzo inicial requerido se mantiene significativamente una vez puesto en movimiento el objeto (se produce atascamiento de las ruedas, tirones o falta de deslizamiento uniforme).', 23],
          ['El trabajador empuja o arrastra el objeto rodante asiéndolo con una sola mano.', 24],
          [MANIF, 25]
        ]
      }]
    },
    {
      id: 'C', nombre: 'Transporte', titulo: '2.C: TRANSPORTE MANUAL DE CARGAS',
      hoja: 'Planilla 2.-c', fecha: 'H31', hojaN: 'H32', usaReba: true,
      bloques: [{
        id: 'C', critico: 4,
        paso1Titulo: 'PASO 1: Identificar si la tarea del puesto de trabajo implica:',
        paso1: [
          ['Transportar manualmente cargas de peso superior a 2 Kg y hasta 25 Kg.', 9],
          ['El trabajador se desplaza sosteniendo manualmente la carga recorriendo una distancia mayor a 1 metro.', 10],
          ['Realizarla diariamente en forma cíclica (si es esporádica, consignar NO).', 11],
          ['Se transporta manualmente cargas a una distancia superior a 20 metros.', 12],
          ['Se transporta manualmente cargas de peso superior a 25 Kg.', 13]
        ],
        nota1: ['Si todas las respuestas son NO, se considera que el riesgo es tolerable.', 'Si alguna de las respuestas 1 a 5 es SI, continuar con el paso 2.', 'Si la respuesta 5 es SI debe considerarse que el riesgo de la tarea es No tolerable, debiendo solicitarse mejoras en tiempo prudencial.'],
        paso2: [
          ['En condiciones habituales de levantamiento el trabajador transporta la carga entre 1 y 10 metros con una masa acumulada (el producto de la masa por la frecuencia) mayor que 10.000 Kg durante la jornada habitual.', 21],
          ['En condiciones habituales de levantamiento el trabajador transporta la carga entre 10 y 20 metros con una masa acumulada (el producto de la masa por la frecuencia) mayor que 6.000 Kg durante la jornada habitual.', 22],
          ['Las cargas poseen formas irregulares, son difíciles de asir, se deforman o hay movimiento en su interior.', 23],
          [MANIF, 24]
        ]
      }]
    },
    {
      id: 'D', nombre: 'Bipedestación', titulo: '2.D: BIPEDESTACIÓN',
      hoja: 'Planilla 2.- d', fecha: 'H25', hojaN: 'H26', usaReba: true,
      bloques: [{
        id: 'D', critico: -1,
        paso1Titulo: 'PASO 1: Identificar si la tarea del puesto de trabajo implica:',
        paso1: [['El puesto de trabajo se desarrolla en posición de pie, sin posibilidad de sentarse, durante 2 horas seguidas o más.', 9]],
        nota1: ['Si la respuesta es NO, se considera que el riesgo es tolerable.', 'Si la respuesta es SI continuar con paso 2.'],
        paso2: [
          ['En el puesto se realizan tareas donde se permanece de pie durante 3 horas seguidas o más, sin posibilidades de sentarse con escasa deambulación (caminando no más de 100 metros/hora).', 16],
          ['En el puesto se realizan tareas donde se permanece de pie durante 2 horas seguidas o más, sin posibilidades de sentarse ni desplazarse o con escasa deambulación, levantando y/o transportando cargas > 2 Kg.', 17],
          ['Trabajos efectuados con bipedestación prolongada en ambientes donde la temperatura y la humedad del aire sobrepasan los límites legalmente admisibles y que demandan actividad física.', 18],
          [MANIF, 19]
        ]
      }]
    },
    {
      id: 'E', nombre: 'Movimientos repetitivos', titulo: '2.E: MOVIMIENTOS REPETITIVOS DE MIEMBROS SUPERIORES',
      hoja: 'Planilla 2.-e', fecha: 'H28', hojaN: 'H29', usaReba: true, borg: true,
      bloques: [{
        id: 'E', critico: -1, critico2: 2,
        paso1Titulo: 'PASO 1: Identificar si el puesto de trabajo implica:',
        paso1: [['Realizar diariamente, una o más tareas donde se utilizan las extremidades superiores, durante 4 o más horas en la jornada habitual de trabajo en forma cíclica (en forma continuada o alternada).', 9]],
        nota1: ['Si la respuesta es NO, se considera que el riesgo es tolerable.', 'Si la respuesta es SI, continuar con el paso 2.'],
        paso2: [
          ['Las extremidades superiores están activas por más del 40% del tiempo total del ciclo de trabajo.', 16],
          ['En el ciclo de trabajo se realiza un esfuerzo superior a moderado a 3 según la Escala de Borg, durante más de 6 segundos y más de una vez por minuto.', 17],
          ['Se realiza un esfuerzo superior a 7 según la escala de Borg.', 18],
          [MANIF, 19]
        ],
        nota2extra: 'Si la respuesta 3 es SI, se deben implementar mejoras en forma prudencial.'
      }]
    },
    {
      id: 'F', nombre: 'Postura forzada', titulo: '2.F: POSTURAS FORZADAS',
      hoja: 'Planilla 2.-f', fecha: 'H27', hojaN: 'H28', usaReba: true,
      bloques: [{
        id: 'F', critico: -1,
        paso1Titulo: 'PASO 1: Identificar si la tarea del puesto de trabajo implica:',
        paso1: [['Adoptar posturas forzadas en forma habitual durante la jornada de trabajo, con o sin aplicación de fuerza. (No se deben considerar si las posturas son ocasionales).', 9]],
        nota1: ['Si todas las respuestas son NO, se considera que el riesgo es tolerable.', 'Si la respuesta es SI, continuar con el paso 2.'],
        paso2: [
          ['Cuello en extensión, flexión, lateralización y/o rotación.', 16],
          ['Brazos por encima de los hombros o con movimientos de supinación, pronación o rotación.', 17],
          ['Muñecas y manos en flexión, extensión, desviación cubital o radial.', 18],
          ['Cintura en flexión, extensión, lateralización y/o rotación.', 19],
          ['Miembros inferiores: trabajo en posición de rodillas o en cuclillas.', 20],
          [MANIF, 21]
        ]
      }]
    },
    {
      id: 'G', nombre: 'Vibraciones', titulo: '2.G: VIBRACIONES',
      hoja: 'Paso 2.g', fecha: 'H41', hojaN: 'H42', usaReba: false,
      bloques: [{
        id: 'Gmb', subtitulo: '2.G VIBRACIONES MANO - BRAZO (entre 5 y 1500 Hz)', critico: -1,
        paso1Titulo: 'PASO 1: Identificar si la tarea del puesto de trabajo implica de forma habitual:',
        paso1: [
          ['Trabajar con herramientas que producen vibraciones (martillo neumático, perforadora, destornilladores, pulidoras, esmeriladoras, otros).', 9],
          ['Sujetar piezas con las manos mientras estas son mecanizadas.', 10],
          ['Sujetar palancas, volantes, etc. que transmiten vibraciones.', 11]
        ],
        nota1: ['Si todas las respuestas son NO, se considera que el riesgo es tolerable.', 'Si alguna de las respuestas es SI, continuar con el paso 2.'],
        paso2: [
          ['El valor de las vibraciones supera los límites establecidos en la Tabla I, de la parte correspondiente a Vibración (segmental) mano-brazo, del Anexo V, Resolución MTEySS N° 295/03.', 17],
          [MANIF, 18]
        ]
      }, {
        id: 'Gce', subtitulo: '2.G VIBRACIONES CUERPO ENTERO (entre 1 y 80 Hz)', critico: -1,
        paso1Titulo: 'PASO 1: Identificar si la tarea del puesto de trabajo implica de forma habitual:',
        paso1: [
          ['Conducir vehículos industriales, camiones, máquinas agrícolas, transporte público y otros.', 26],
          ['Trabajar próximo a maquinarias generadoras de impacto.', 27]
        ],
        nota1: ['Si todas las respuestas son NO, se considera que el riesgo es tolerable.', 'Si alguna de las respuestas es SI, continuar con el paso 2.'],
        paso2: [
          ['El valor de las vibraciones supera los límites establecidos en la parte correspondiente a Vibración Cuerpo Entero, del Anexo V, Resolución MTEySS N° 295/03.', 34],
          [MANIF, 35]
        ]
      }]
    },
    {
      id: 'H', nombre: 'Confort térmico', titulo: '2.H: CONFORT TÉRMICO',
      hoja: 'Planilla 2.h', fecha: 'H29', hojaN: 'H30', usaReba: false, fanger: true,
      bloques: [{
        id: 'H', critico: -1,
        paso1Titulo: 'PASO 1: Identificar si la tarea del puesto de trabajo implica:',
        paso1: [['En el puesto de trabajo se perciben temperaturas no confortables para la realización de las tareas.', 9]],
        nota1: ['Si la respuesta es NO, se considera que el riesgo es tolerable.', 'Si la respuesta es SI, continuar con el paso 2.'],
        paso2: [['El resultado del uso de la Curva de Confort de Fanger, se encuentra por fuera de la zona de confort.', 15]],
        nota2: 'Si la respuesta es NO se presume que el riesgo es tolerable.'
      }]
    },
    {
      id: 'I', nombre: 'Estrés de contacto', titulo: '2.I: ESTRÉS DE CONTACTO',
      hoja: 'Planilla 2,I', fecha: 'H28', hojaN: 'H29', usaReba: false,
      bloques: [{
        id: 'I', critico: -1,
        paso1Titulo: 'PASO 1: Identificar si la tarea del puesto de trabajo implica de forma habitual:',
        paso1: [['Mantener apoyada alguna parte del cuerpo ejerciendo una presión, contra una herramienta, plano de trabajo, máquina herramienta o partes y materiales.', 9]],
        nota1: ['Si la respuesta es NO, se considera que el riesgo es tolerable.', 'Si la respuesta es SI, continuar con el paso 2.'],
        paso2: [
          ['El trabajador mantiene apoyada la muñeca, antebrazo, axila o muslo u otro segmento corporal sobre una superficie aguda o con canto.', 15],
          ['El trabajador utiliza herramientas de mano o manipula piezas que presionan sobre sus dedos y/o palma de la mano hábil.', 16],
          ['El trabajador realiza movimientos de percusión sobre partes o herramientas.', 17],
          [MANIF, 18]
        ]
      }]
    }
  ];

  const BORG = [
    ['Ausencia de esfuerzo', '0'], ['Esfuerzo muy bajo, apenas perceptible', '0,5'], ['Esfuerzo muy débil', '1'],
    ['Esfuerzo débil / ligero', '2'], ['Esfuerzo moderado / regular', '3'], ['Esfuerzo algo fuerte', '4'],
    ['Esfuerzo fuerte', '5 y 6'], ['Esfuerzo muy fuerte', '7, 8 y 9'], ['Esfuerzo extremadamente fuerte (máximo que una persona puede aguantar)', '10']
  ];

  const GENERALES = [
    'Se ha informado al trabajador/es, supervisor/es, ingeniero/s y directivo/s relacionados con el puesto de trabajo, sobre el riesgo que tiene la tarea de desarrollar TME.',
    'Se ha capacitado al trabajador/es y supervisor/es relacionados con el puesto de trabajo, sobre la identificación de síntomas relacionados con el desarrollo de TME.',
    'Se ha capacitado al trabajador/es y supervisor/es relacionados con el puesto de trabajo, sobre las medidas y/o procedimientos para prevenir el desarrollo de TME.'
  ];

  // Biblioteca de medidas (las primeras son las que GH viene usando en los informes).
  const MEDIDAS = [
    { t: 'Se recomienda el dictado de capacitación sobre Ergonomía, al personal vinculado a la actividad analizada.', tipo: 'Adm', grupo: 'General', nivel: [1] },
    { t: 'Es obligatoria una capacitación periódica sobre Ergonomía, al personal vinculado a la actividad analizada.', tipo: 'Adm', grupo: 'General', nivel: [2, 3] },
    { t: 'Se recomienda la realización de exámenes ocupacionales periódicos para la detección temprana de patologías vinculadas al estrés ergonómico ocasionado al trabajador por el puesto de trabajo.', tipo: 'Adm', grupo: 'General', nivel: [1, 2, 3] },
    { t: 'Se deberá realizar capacitaciones diarias al comienzo de las tareas. Registrar.', tipo: 'Adm', grupo: 'General', nivel: [3] },
    { t: 'Se recomienda implementar pausas activas con ejercicios de elongación durante la jornada. Registrar.', tipo: 'Adm', grupo: 'General', nivel: [2, 3] },
    { t: 'Se recomienda implementar rotación de tareas entre puestos con distintas exigencias posturales.', tipo: 'Adm', grupo: 'General', nivel: [2, 3] },
    { t: 'Se recomienda verificación periódica de la correcta regulación de butacas del conductor. Registrar.', tipo: 'Ing', grupo: 'Operación de equipos', nivel: [1, 2, 3] },
    { t: 'Se recomienda el mantenimiento periódico de la suspensión de cabina y del asiento del equipo para reducir la transmisión de vibraciones. Registrar.', tipo: 'Ing', grupo: 'Operación de equipos', nivel: [1, 2, 3] },
    { t: 'Se recomienda que el ascenso y descenso del equipo se realice utilizando los tres puntos de apoyo.', tipo: 'Adm', grupo: 'Operación de equipos', nivel: [1, 2, 3] },
    { t: 'Se recomienda el uso de ayudas mecánicas (carros, aparejos, zorras) para la manipulación de cargas mayores a 25 kg.', tipo: 'Ing', grupo: 'Manipulación de cargas', nivel: [2, 3] },
    { t: 'Se recomienda que las cargas mayores a 25 kg sean manipuladas entre dos personas.', tipo: 'Adm', grupo: 'Manipulación de cargas', nivel: [2, 3] },
    { t: 'Se recomienda capacitar al personal en técnicas correctas de levantamiento manual de cargas.', tipo: 'Adm', grupo: 'Manipulación de cargas', nivel: [1, 2, 3] },
    { t: 'Se recomienda ubicar los materiales de uso frecuente entre la altura de los nudillos y la de los hombros.', tipo: 'Ing', grupo: 'Manipulación de cargas', nivel: [2, 3] },
    { t: 'Se recomienda adecuar la altura del plano de trabajo para evitar la flexión del tronco y la elevación de los brazos.', tipo: 'Ing', grupo: 'Taller / mantenimiento', nivel: [2, 3] },
    { t: 'Se recomienda el uso de herramientas con mango ergonómico y antivibratorio.', tipo: 'Ing', grupo: 'Taller / mantenimiento', nivel: [2, 3] },
    { t: 'Se recomienda proveer rodilleras o banquetas para tareas que se realizan a nivel del piso.', tipo: 'Ing', grupo: 'Taller / mantenimiento', nivel: [2, 3] },
    { t: 'Se recomienda proveer alfombras antifatiga y un asiento de descanso en puestos de pie prolongado.', tipo: 'Ing', grupo: 'Bipedestación', nivel: [2, 3] },
    { t: 'Se recomienda proveer silla ergonómica regulable en altura con apoyo lumbar.', tipo: 'Ing', grupo: 'Oficina', nivel: [1, 2, 3] },
    { t: 'Se recomienda ubicar el borde superior del monitor a la altura de los ojos y a una distancia de 50 a 70 cm.', tipo: 'Ing', grupo: 'Oficina', nivel: [1, 2, 3] },
    { t: 'Se recomienda proveer apoyapiés al personal que no alcance a apoyar los pies en el suelo.', tipo: 'Ing', grupo: 'Oficina', nivel: [1, 2, 3] }
  ];

  // Observación de la Planilla 3 / informe según el nivel de riesgo (1 a 3) del puesto.
  function observacion(nivel, riesgoReba) {
    if (nivel >= 3) return 'Las medidas preventivas dictadas deben ser realizadas inmediatamente, debido que el nivel de riesgo es "' + (riesgoReba || 'No tolerable') + '". La aplicación es obligatoria.';
    if (nivel === 2) return 'Las medidas preventivas dictadas deben ser implementadas, debido que el nivel de riesgo es 2 (Riesgo Moderado). La aplicación es obligatoria.';
    return 'Las medidas preventivas dictadas son a modo "sugerencia", debido que el nivel de riesgo es 1 (Riesgo Tolerable) en todas las tareas. La aplicación no es obligatoria.';
  }

  window.P886 = { FACTORES, BORG, GENERALES, MEDIDAS, NOTA2, observacion };
})();
