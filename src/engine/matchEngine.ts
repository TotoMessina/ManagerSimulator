import { Equipo, Jugador, Formacion, Posicion, AtributosJugador } from '../types';

interface ResultadoPartido {
  golesLocal: number;
  golesVisitante: number;
  eventos: string[];
}

// Helper para obtener un elemento aleatorio de una lista
const obtenerAleatorio = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const FORMACION_MAPA_SLOTS: Record<Formacion, Record<string, Posicion>> = {
  '4-3-3': {
    'POR-0': 'POR',
    'DEF-0': 'LI',
    'DEF-1': 'DFC',
    'DEF-2': 'DFC',
    'DEF-3': 'LD',
    'MED-0': 'MC',
    'MED-1': 'MCO',
    'MED-2': 'MC',
    'DEL-0': 'EI',
    'DEL-1': 'DC',
    'DEL-2': 'ED'
  },
  '4-4-2': {
    'POR-0': 'POR',
    'DEF-0': 'LI',
    'DEF-1': 'DFC',
    'DEF-2': 'DFC',
    'DEF-3': 'LD',
    'MED-0': 'EI',
    'MED-1': 'MC',
    'MED-2': 'MC',
    'MED-3': 'ED',
    'DEL-0': 'DC',
    'DEL-1': 'DC'
  },
  '3-5-2': {
    'POR-0': 'POR',
    'DEF-0': 'DFC',
    'DEF-1': 'DFC',
    'DEF-2': 'DFC',
    'MED-0': 'LI',
    'MED-1': 'MC',
    'MED-2': 'MCO',
    'MED-3': 'MC',
    'MED-4': 'LD',
    'DEL-0': 'DC',
    'DEL-1': 'DC'
  },
  '5-3-2': {
    'POR-0': 'POR',
    'DEF-0': 'LI',
    'DEF-1': 'DFC',
    'DEF-2': 'DFC',
    'DEF-3': 'DFC',
    'DEF-4': 'LD',
    'MED-0': 'MC',
    'MED-1': 'MCO',
    'MED-2': 'MC',
    'DEL-0': 'DC',
    'DEL-1': 'DC'
  }
};

export const obtenerCategoriaPosicion = (pos: Posicion): string => {
  if (pos === 'POR') return 'POR';
  if (['DFC', 'LD', 'LI'].includes(pos)) return 'DEF';
  if (['MC', 'MCO'].includes(pos)) return 'MED';
  return 'DEL'; // ED, EI, DC
};

export function obtenerDebilidadEquipo(
  equipoId: string,
  todosJugadores: Jugador[]
): 'centrales_lentos' | 'debilidad_aerea' | 'laterales_proyectados' {
  const deEquipo = todosJugadores.filter(j => j.idEquipo === equipoId);
  const dfcs = deEquipo.filter(j => j.posicion === 'DFC');
  const laterales = deEquipo.filter(j => j.posicion === 'LD' || j.posicion === 'LI');

  const avgVel = dfcs.length > 0 ? dfcs.reduce((acc, j) => acc + j.atributos.velocidad, 0) / dfcs.length : 12;
  const avgFuerza = dfcs.length > 0 ? dfcs.reduce((acc, j) => acc + j.atributos.fuerza, 0) / dfcs.length : 12;
  const avgDefLaterales = laterales.length > 0 ? laterales.reduce((acc, j) => acc + j.atributos.defensa, 0) / laterales.length : 12;

  // Calcular promedios globales de jugadores activos (que pertenezcan a algún club y no estén libres)
  const todosDfcs = todosJugadores.filter(j => j.posicion === 'DFC' && j.idEquipo && j.idEquipo !== 'libre');
  const todosLaterales = todosJugadores.filter(j => (j.posicion === 'LD' || j.posicion === 'LI') && j.idEquipo && j.idEquipo !== 'libre');

  const globalAvgVel = todosDfcs.length > 0 ? todosDfcs.reduce((acc, j) => acc + j.atributos.velocidad, 0) / todosDfcs.length : 12;
  const globalAvgFuerza = todosDfcs.length > 0 ? todosDfcs.reduce((acc, j) => acc + j.atributos.fuerza, 0) / todosDfcs.length : 12;
  const globalAvgDefLaterales = todosLaterales.length > 0 ? todosLaterales.reduce((acc, j) => acc + j.atributos.defensa, 0) / todosLaterales.length : 12;

  // Calcular las desviaciones relativas frente al promedio global
  const devVel = avgVel - globalAvgVel;
  const devFuerza = avgFuerza - globalAvgFuerza;
  const devDefLaterales = avgDefLaterales - globalAvgDefLaterales;

  // Devolver la debilidad con la mayor desviación negativa (el atributo relativamente más débil frente a la media mundial)
  if (devVel <= devFuerza && devVel <= devDefLaterales) {
    return 'centrales_lentos';
  } else if (devFuerza <= devVel && devFuerza <= devDefLaterales) {
    return 'debilidad_aerea';
  } else {
    return 'laterales_proyectados';
  }
}

export function aplicarRolYEntrenamiento(
  j: Jugador,
  equipo: Equipo
): AtributosJugador {
  const attrs = { ...j.atributos };

  // 1. Roles Tácticos (solo si está en su posición natural o compatible)
  const cat = obtenerCategoriaPosicion(j.posicion);
  if (j.rolTactico) {
    if (cat === 'DEL' && j.rolTactico === 'Hombre de Área') {
      attrs.remate = Math.min(20, attrs.remate + 3);
      attrs.velocidad = Math.max(1, attrs.velocidad - 3);
    } else if (cat === 'DEL' && j.rolTactico === 'Delantero Avanzado') {
      attrs.velocidad = Math.min(20, attrs.velocidad + 3);
    } else if (cat === 'MED' && j.rolTactico === 'Pivote Defensivo') {
      attrs.defensa = Math.min(20, attrs.defensa + 3);
    } else if (cat === 'MED' && j.rolTactico === 'Organizador') {
      attrs.pase = Math.min(20, attrs.pase + 3);
      attrs.vision = Math.min(20, attrs.vision + 3);
    }
  }

  // 2. Enfoque Táctico de Entrenamiento (boost mental de +2)
  if (equipo.enfoqueEntrenamiento === 'Táctico') {
    attrs.decisiones = Math.min(20, attrs.decisiones + 2);
    attrs.posicionamiento = Math.min(20, attrs.posicionamiento + 2);
    attrs.vision = Math.min(20, attrs.vision + 2);
    attrs.determinacion = Math.min(20, attrs.determinacion + 2);
  }

  return attrs;
}

export function calcularCompatibilidadPosicion(natural: Posicion, asignada: Posicion): number {
  if (natural === asignada) return 1.0;

  const catNatural = obtenerCategoriaPosicion(natural);
  const catAsignada = obtenerCategoriaPosicion(asignada);

  if (catNatural === 'POR' || catAsignada === 'POR') {
    return 0.15; // Jugar de portero sin serlo, o viceversa, es fatal
  }

  if (catNatural === catAsignada) {
    return 0.85; // Misma línea táctica (ej. DFC de lateral)
  }

  // Categorías adyacentes: DEF <-> MED or MED <-> DEL
  const esAdyacente =
    (catNatural === 'DEF' && catAsignada === 'MED') ||
    (catNatural === 'MED' && catAsignada === 'DEF') ||
    (catNatural === 'MED' && catAsignada === 'DEL') ||
    (catNatural === 'DEL' && catAsignada === 'MED');

  if (esAdyacente) {
    return 0.65; // Desplazamiento moderado
  }

  return 0.40; // Desplazamiento extremo (ej. DEF en la delantera)
}

export function asignarRolesTacticos(
  jugadoresTitulares: Jugador[],
  formacion: Formacion
): { jugador: Jugador; posicionAsignada: Posicion; compatibilidad: number }[] {
  const activeSlots = FORMACION_MAPA_SLOTS[formacion] || FORMACION_MAPA_SLOTS['4-3-3'];

  // Mapear slots disponibles a un array modificable
  const slotsDisponibles = Object.entries(activeSlots).map(([slotKey, label]) => ({
    slotKey,
    label,
    linea: slotKey.split('-')[0],
    jugadorId: null as string | null
  }));

  const asignaciones: { jugador: Jugador; posicionAsignada: Posicion; compatibilidad: number }[] = [];
  const jugadoresSinPosicion: Jugador[] = [];

  // 1. Asignar primero los jugadores que ya tienen una posicionTactica válida
  jugadoresTitulares.forEach(j => {
    if (j.posicionTactica) {
      const slot = slotsDisponibles.find(s => s.slotKey === j.posicionTactica);
      if (slot && !slot.jugadorId) {
        slot.jugadorId = j.id;
        const comp = calcularCompatibilidadPosicion(j.posicion, slot.label);
        asignaciones.push({
          jugador: j,
          posicionAsignada: slot.label,
          compatibilidad: comp
        });
        return;
      }
    }
    jugadoresSinPosicion.push(j);
  });

  // 2. Para los jugadores restantes, los asignamos con el algoritmo codicioso
  slotsDisponibles.forEach(slot => {
    if (slot.jugadorId) return; // ya ocupado

    if (jugadoresSinPosicion.length === 0) return;

    // Buscar la mejor coincidencia exacta por label
    let bestIdx = jugadoresSinPosicion.findIndex(p => p.posicion === slot.label);

    // Si no hay, buscar coincidencia por categoría de línea táctica (DEF, MED, DEL)
    if (bestIdx === -1) {
      bestIdx = jugadoresSinPosicion.findIndex(p => {
        const catP = obtenerCategoriaPosicion(p.posicion);
        return catP === slot.linea;
      });
    }

    // Si no hay, tomar el primero disponible
    if (bestIdx === -1) {
      bestIdx = 0;
    }

    const player = jugadoresSinPosicion[bestIdx];
    slot.jugadorId = player.id;
    jugadoresSinPosicion.splice(bestIdx, 1);

    const comp = calcularCompatibilidadPosicion(player.posicion, slot.label);
    asignaciones.push({
      jugador: player,
      posicionAsignada: slot.label,
      compatibilidad: comp
    });
  });

  return asignaciones;
}

export function simularPartido(
  local: Equipo,
  visitante: Equipo,
  jugadores: Jugador[],
  climaParam?: 'Soleado' | 'Lluvia Torrencial' | 'Nieve',
  presionLocal?: boolean,
  presionVisitante?: boolean
): ResultadoPartido {
  const eventos: string[] = [];
  const clima = climaParam || 'Soleado';

  // 1. FILTRAR Y OBTENER LOS JUGADORES TITULARES (Alineación inicial)
  const plantelLocal = jugadores.filter(j => j.idEquipo === local.id);
  const plantelVisitante = jugadores.filter(j => j.idEquipo === visitante.id);

  // Intentar usar los jugadores marcados como titulares
  let inicialLocal = plantelLocal.filter(j => j.titular);
  let inicialVisitante = plantelVisitante.filter(j => j.titular);

  // Chequeo de huelga/negativa a jugar por contrato cercano a vencer y moral baja o vencido
  inicialLocal = inicialLocal.filter(j => {
    const contratoCercano = j.mesesContrato !== undefined && j.mesesContrato <= 6;
    const moralBaja = j.moral < 55; // Mayor rango de sensibilidad para huelgas
    const sinContrato = j.mesesContrato !== undefined && j.mesesContrato <= 0;

    if (sinContrato) {
      j.titular = false;
      eventos.push(`🚨 [Sin Contrato] ${j.nombre} (${local.nombreCorto}) se niega rotundamente a jugar hoy porque su contrato ha vencido.`);
      return false;
    }

    if (contratoCercano && moralBaja && Math.random() < 0.70) {
      j.titular = false; // Desmarcar como titular
      eventos.push(`⚠️ [Conflicto Contractual] ${j.nombre} (${local.nombreCorto}) se niega a jugar hoy debido a su situación de contrato y baja moral.`);
      return false; // Excluir del partido
    }
    return true;
  });

  inicialVisitante = inicialVisitante.filter(j => {
    const contratoCercano = j.mesesContrato !== undefined && j.mesesContrato <= 6;
    const moralBaja = j.moral < 55;
    const sinContrato = j.mesesContrato !== undefined && j.mesesContrato <= 0;

    if (sinContrato) {
      j.titular = false;
      eventos.push(`🚨 [Sin Contrato] ${j.nombre} (${visitante.nombreCorto}) se niega rotundamente a jugar hoy porque su contrato ha vencido.`);
      return false;
    }

    if (contratoCercano && moralBaja && Math.random() < 0.70) {
      j.titular = false; // Desmarcar como titular
      eventos.push(`⚠️ [Conflicto Contractual] ${j.nombre} (${visitante.nombreCorto}) se niega a jugar hoy debido a su situación de contrato y baja moral.`);
      return false; // Excluir del partido
    }
    return true;
  });

  // Mecanismo de Respaldo Seguro (Fallback): Si no hay titulares definidos, se toman los 11 con mayor CA
  if (inicialLocal.length === 0) {
    inicialLocal = [...plantelLocal].sort((a, b) => b.ca - a.ca).slice(0, 11);
  }
  if (inicialVisitante.length === 0) {
    inicialVisitante = [...plantelVisitante].sort((a, b) => b.ca - a.ca).slice(0, 11);
  }

  // Si algún equipo no tiene suficientes jugadores, tomamos los que estén disponibles
  const numLocal = inicialLocal.length || 1;
  const numVisitante = inicialVisitante.length || 1;

  // 2. ASIGNAR ROLES TÁCTICOS Y AJUSTAR ATRIBUTOS POR COMPATIBILIDAD
  const rolesLocal = asignarRolesTacticos(inicialLocal, local.formacion || '4-3-3');
  const rolesVisitante = asignarRolesTacticos(inicialVisitante, visitante.formacion || '4-3-3');

  const localAjustados = rolesLocal.map(r => {
    const j = r.jugador;
    const comp = r.compatibilidad;
    const baseAttrs = aplicarRolYEntrenamiento(j, local);
    const atributosAjustados = { ...baseAttrs };
    for (const key of Object.keys(atributosAjustados) as (keyof AtributosJugador)[]) {
      atributosAjustados[key] = Math.max(1, Math.round(atributosAjustados[key] * comp));
    }

    // --- QUÍMICA DE SOCIEDAD ---
    const lineaActual = obtenerCategoriaPosicion(r.posicionAsignada);
    const tieneQuimicaActiva = rolesLocal.some(otroRole => {
      if (otroRole.jugador.id === j.id) return false;
      const lineaOtro = obtenerCategoriaPosicion(otroRole.posicionAsignada);
      if (lineaActual !== lineaOtro || lineaActual === 'POR') return false;
      const q = j.quimicaPosicional?.[otroRole.jugador.id] || 0;
      return q >= 5;
    });

    if (tieneQuimicaActiva) {
      atributosAjustados.pase = Math.min(20, Math.round(atributosAjustados.pase * 1.10));
      atributosAjustados.defensa = Math.min(20, Math.round(atributosAjustados.defensa * 1.10));
      atributosAjustados.posicionamiento = Math.min(20, Math.round(atributosAjustados.posicionamiento * 1.10));
    }

    // --- LOCALÍA ---
    // El equipo local recibe un bonus del +10% en sus atributos mentales (Moral y Determinación) debido al apoyo de la hinchada.
    atributosAjustados.determinacion = Math.min(20, Math.round(atributosAjustados.determinacion * 1.10));
    const moralConBonus = Math.min(100, Math.round(j.moral * 1.10));

    // --- LLUVIA TORRENCIAL ---
    // Baja un 20% la precisión del atributo Pase de todos los jugadores.
    if (clima === 'Lluvia Torrencial') {
      atributosAjustados.pase = Math.max(1, Math.round(atributosAjustados.pase * 0.80));
    }

    // --- NIEVE ---
    // Reduce la Velocidad general de los extremos y delanteros un 15%, y aumenta la fuerza general de todos un 10%.
    if (clima === 'Nieve') {
      if (['ED', 'EI', 'DC'].includes(j.posicion)) {
        atributosAjustados.velocidad = Math.max(1, Math.round(atributosAjustados.velocidad * 0.85));
        atributosAjustados.aceleracion = Math.max(1, Math.round(atributosAjustados.aceleracion * 0.85));
      }
      atributosAjustados.fuerza = Math.min(20, Math.round(atributosAjustados.fuerza * 1.10));
    }

    // --- MODO PRESIÓN ---
    if (presionLocal) {
      const mp = j.manejoPresion !== undefined ? j.manejoPresion : 10;
      if (mp < 12) {
        atributosAjustados.decisiones = Math.max(1, Math.round(atributosAjustados.decisiones * 0.85));
        atributosAjustados.remate = Math.max(1, Math.round(atributosAjustados.remate * 0.85));
      } else if (mp >= 16 || j.personalidad === 'Líder') {
        atributosAjustados.decisiones = Math.min(20, Math.round(atributosAjustados.decisiones * 1.10));
        atributosAjustados.remate = Math.min(20, Math.round(atributosAjustados.remate * 1.10));
      }
    }

    return { ...j, moral: moralConBonus, atributos: atributosAjustados };
  });

  const visitanteAjustados = rolesVisitante.map(r => {
    const j = r.jugador;
    const comp = r.compatibilidad;
    const baseAttrs = aplicarRolYEntrenamiento(j, visitante);
    const atributosAjustados = { ...baseAttrs };
    for (const key of Object.keys(atributosAjustados) as (keyof AtributosJugador)[]) {
      atributosAjustados[key] = Math.max(1, Math.round(atributosAjustados[key] * comp));
    }

    // --- QUÍMICA DE SOCIEDAD ---
    const lineaActual = obtenerCategoriaPosicion(r.posicionAsignada);
    const tieneQuimicaActiva = rolesVisitante.some(otroRole => {
      if (otroRole.jugador.id === j.id) return false;
      const lineaOtro = obtenerCategoriaPosicion(otroRole.posicionAsignada);
      if (lineaActual !== lineaOtro || lineaActual === 'POR') return false;
      const q = j.quimicaPosicional?.[otroRole.jugador.id] || 0;
      return q >= 5;
    });

    if (tieneQuimicaActiva) {
      atributosAjustados.pase = Math.min(20, Math.round(atributosAjustados.pase * 1.10));
      atributosAjustados.defensa = Math.min(20, Math.round(atributosAjustados.defensa * 1.10));
      atributosAjustados.posicionamiento = Math.min(20, Math.round(atributosAjustados.posicionamiento * 1.10));
    }

    // --- LLUVIA TORRENCIAL ---
    if (clima === 'Lluvia Torrencial') {
      atributosAjustados.pase = Math.max(1, Math.round(atributosAjustados.pase * 0.80));
    }

    // --- NIEVE ---
    if (clima === 'Nieve') {
      if (['ED', 'EI', 'DC'].includes(j.posicion)) {
        atributosAjustados.velocidad = Math.max(1, Math.round(atributosAjustados.velocidad * 0.85));
        atributosAjustados.aceleracion = Math.max(1, Math.round(atributosAjustados.aceleracion * 0.85));
      }
      atributosAjustados.fuerza = Math.min(20, Math.round(atributosAjustados.fuerza * 1.10));
    }

    // --- MODO PRESIÓN ---
    if (presionVisitante) {
      const mp = j.manejoPresion !== undefined ? j.manejoPresion : 10;
      if (mp < 12) {
        atributosAjustados.decisiones = Math.max(1, Math.round(atributosAjustados.decisiones * 0.85));
        atributosAjustados.remate = Math.max(1, Math.round(atributosAjustados.remate * 0.85));
      } else if (mp >= 16 || j.personalidad === 'Líder') {
        atributosAjustados.decisiones = Math.min(20, Math.round(atributosAjustados.decisiones * 1.10));
        atributosAjustados.remate = Math.min(20, Math.round(atributosAjustados.remate * 1.10));
      }
    }

    return { ...j, atributos: atributosAjustados };
  });

  // 2.1 CALCULAR PODER DE ATAQUE Y DE DEFENSA BASE
  // Ataque: Velocidad, Aceleración, Remate, Regate, Pase, Técnica y Visión
  let ataqueLocal = localAjustados.reduce((acc, j) =>
    acc + (j.atributos.remate * 1.5 + j.atributos.regate * 1.2 + j.atributos.pase * 1.2 + j.atributos.velocidad * 1.0 + j.atributos.aceleracion * 1.0 + j.atributos.tecnica * 1.2 + j.atributos.vision * 1.2), 0
  ) / numLocal;

  let ataqueVisitante = visitanteAjustados.reduce((acc, j) =>
    acc + (j.atributos.remate * 1.5 + j.atributos.regate * 1.2 + j.atributos.pase * 1.2 + j.atributos.velocidad * 1.0 + j.atributos.aceleracion * 1.0 + j.atributos.tecnica * 1.2 + j.atributos.vision * 1.2), 0
  ) / numVisitante;

  // Defensa: Defensa, Fuerza, Posicionamiento, Decisiones y Reflejos (para arqueros)
  let defensaLocal = localAjustados.reduce((acc, j) =>
    acc + (j.atributos.defensa * 1.8 + j.atributos.fuerza * 1.4 + j.atributos.posicionamiento * 1.4 + j.atributos.decisiones * 1.2 + j.atributos.reflejos * 1.5), 0
  ) / numLocal;

  let defensaVisitante = visitanteAjustados.reduce((acc, j) =>
    acc + (j.atributos.defensa * 1.8 + j.atributos.fuerza * 1.4 + j.atributos.posicionamiento * 1.4 + j.atributos.decisiones * 1.2 + j.atributos.reflejos * 1.5), 0
  ) / numVisitante;

  // Aplicar modificador de Química del Vestuario (rango 0.85 a 1.15)
  const chemL = local.quimicaVestuario !== undefined ? local.quimicaVestuario : 70;
  const chemV = visitante.quimicaVestuario !== undefined ? visitante.quimicaVestuario : 70;
  const chemModL = 0.85 + (chemL / 100) * 0.3;
  const chemModV = 0.85 + (chemV / 100) * 0.3;

  ataqueLocal *= chemModL;
  defensaLocal *= chemModL;
  ataqueVisitante *= chemModV;
  defensaVisitante *= chemModV;

  // 2.5 APLICAR MODIFICADORES TÁCTICOS POR ESTILO DE JUEGO
  // Si es 'Ofensivo': Poder de Ataque +15%, Poder de Defensa -10%
  // Si es 'Defensivo': Poder de Ataque -10%, Poder de Defensa +15%
  const estiloLocal = local.estiloJuego || 'Equilibrado';
  if (estiloLocal === 'Ofensivo') {
    ataqueLocal *= 1.15;
    defensaLocal *= 0.90;
  } else if (estiloLocal === 'Defensivo') {
    ataqueLocal *= 0.90;
    defensaLocal *= 1.15;
  }

  const estiloVisitante = visitante.estiloJuego || 'Equilibrado';
  if (estiloVisitante === 'Ofensivo') {
    ataqueVisitante *= 1.15;
    defensaVisitante *= 0.90;
  } else if (estiloVisitante === 'Defensivo') {
    ataqueVisitante *= 0.90;
    defensaVisitante *= 1.15;
  }

  // 2.6 APLICAR BONUS DE BALÓN PARADO Y SCOUTING DEL RIVAL
  const debilidadLocalOpp = obtenerDebilidadEquipo(visitante.id, jugadores);
  const localUsaEstrategiaValida = local.estrategiaPases === 'Largos al espacio' && local.estrategiaCorner === 'Atacar el primer palo';
  const localTieneBonus = debilidadLocalOpp === 'centrales_lentos' && localUsaEstrategiaValida;

  const debilidadVisitanteOpp = obtenerDebilidadEquipo(local.id, jugadores);
  const visitanteUsaEstrategiaValida = visitante.estrategiaPases === 'Largos al espacio' && visitante.estrategiaCorner === 'Atacar el primer palo';
  const visitanteTieneBonus = debilidadVisitanteOpp === 'centrales_lentos' && visitanteUsaEstrategiaValida;

  if (localTieneBonus) {
    ataqueLocal *= 1.20;
  }
  if (visitanteTieneBonus) {
    ataqueVisitante *= 1.20;
  }

  // --- MODIFICADORES DE CLIMA AL ATAQUE ---
  // Lluvia Torrencial: Favorece a las tácticas de juego directo ("Largos al espacio") con +15% de ataque
  if (clima === 'Lluvia Torrencial') {
    if (local.estrategiaPases === 'Largos al espacio') {
      ataqueLocal *= 1.15;
    }
    if (visitante.estrategiaPases === 'Largos al espacio') {
      ataqueVisitante *= 1.15;
    }
  }

  // Nieve: Reduce el ataque de ambos un 10% para simular juego trabado
  if (clima === 'Nieve') {
    ataqueLocal *= 0.90;
    ataqueVisitante *= 0.90;
  }

  // 3. GENERAR ENTRE 2 Y 3 CHANCES DE GOL (más realista, partidos menos prolíficos)
  const totalChances = Math.floor(Math.random() * 2) + 2; // 2 o 3 chances

  // Generar minutos aleatorios en orden cronológico
  const minutos = Array.from({ length: totalChances }, () => Math.floor(Math.random() * 90) + 1).sort((a, b) => a - b);

  // Inicializar marcador
  let golesLocal = 0;
  let golesVisitante = 0;

  const climaTexto = clima === 'Lluvia Torrencial' ? 'bajo una lluvia torrencial' : clima === 'Nieve' ? 'bajo una intensa nevada' : 'con un clima soleado';
  eventos.push(`⚽ ¡Comienza el partido en el estadio ${local.estadio} ${climaTexto}! Asistencia: ${(local.capacidadEstadio * (0.8 + Math.random() * 0.2)).toFixed(0)} espectadores.`);

  // 3.5 APLICAR FATIGA Y CHEQUEO DE LESIONES (Alineación inicial)
  inicialLocal.forEach(j => {
    // Registrar partido jugado
    j.partidosJugados = (j.partidosJugados || 0) + 1;

    // Probabilidad de lesión muy baja por partido — aumenta 5% en Lluvia Torrencial
    const baseProb = j.formaFisica < 60 ? 0.04 : j.formaFisica < 80 ? 0.015 : 0.003;
    const probLesion = clima === 'Lluvia Torrencial' ? baseProb + 0.05 : baseProb;
    if (Math.random() < probLesion) {
      const semanasOriginal = Math.floor(Math.random() * 4) + 1;
      const nivelMed = local.nivelInstalacionesMedicas ?? 1;
      const factorReduccion = 1 - (nivelMed - 1) * 0.15;
      const semanas = Math.max(1, Math.round(semanasOriginal * factorReduccion));
      j.lesionado = true;
      j.semanasLesion = semanas;
      j.semanasLesionado = semanas;
      j.titular = false; // Ya no puede ser titular

      const minLesion = Math.floor(Math.random() * 88) + 1;
      eventos.push(`Minuto ${minLesion}: 🚑 ¡Preocupación en el banquillo de ${local.nombreCorto}! ${j.nombre} sufre una dolorosa lesión y debe retirarse del campo.`);
    }

    // Desgaste físico del partido
    const esDesgasteAlto = ['MC', 'MCO', 'ED', 'EI'].includes(j.posicion);
    const fatiga = esDesgasteAlto
      ? Math.floor(Math.random() * 5) + 11 // 11% a 15%
      : Math.floor(Math.random() * 4) + 8;  // 8% a 11%
    j.formaFisica = Math.max(1, j.formaFisica - fatiga);
  });

  inicialVisitante.forEach(j => {
    // Registrar partido jugado
    j.partidosJugados = (j.partidosJugados || 0) + 1;

    // Aumenta 5% en Lluvia Torrencial
    const baseProb = j.formaFisica < 85 ? 0.15 : 0.02;
    const probLesion = clima === 'Lluvia Torrencial' ? baseProb + 0.05 : baseProb;
    if (Math.random() < probLesion) {
      const semanasOriginal = Math.floor(Math.random() * 4) + 1;
      const nivelMed = visitante.nivelInstalacionesMedicas ?? 1;
      const factorReduccion = 1 - (nivelMed - 1) * 0.15;
      const semanas = Math.max(1, Math.round(semanasOriginal * factorReduccion));
      j.lesionado = true;
      j.semanasLesion = semanas;
      j.semanasLesionado = semanas;
      j.titular = false; // Ya no puede ser titular

      const minLesion = Math.floor(Math.random() * 88) + 1;
      eventos.push(`Minuto ${minLesion}: 🚑 ¡Preocupación en el banquillo de ${visitante.nombreCorto}! ${j.nombre} sufre una dolorosa lesión y debe retirarse del campo.`);
    }

    const esDesgasteAlto = ['MC', 'MCO', 'ED', 'EI'].includes(j.posicion);
    const fatiga = esDesgasteAlto
      ? Math.floor(Math.random() * 5) + 11 // 11% a 15%
      : Math.floor(Math.random() * 4) + 8;  // 8% a 11%
    j.formaFisica = Math.max(1, j.formaFisica - fatiga);
  });

  // 4. DISTRIBUIR CHANCES SEGÚN PODER DE ATAQUE
  const ataqueGlobal = ataqueLocal + ataqueVisitante;
  const probabilidadLocal = ataqueLocal / ataqueGlobal;

  // Helpers para seleccionar futbolistas que destaquen en la acción ofensiva
  const elegirGoleador = (inicial: Jugador[]): Jugador => {
    // Evitamos al arquero en los remates si hay más jugadores disponibles
    const deCampo = inicial.filter(j => j.posicion !== 'POR');
    const elegibles = deCampo.length > 0 ? deCampo : inicial;

    // Selección ponderada según el atributo de remate
    const sumaRemate = elegibles.reduce((acc, j) => acc + j.atributos.remate, 0);
    let rand = Math.random() * sumaRemate;
    for (const j of elegibles) {
      rand -= j.atributos.remate;
      if (rand <= 0) return j;
    }
    return elegibles[0];
  };

  const elegirAsistidor = (inicial: Jugador[], goleadorId: string): Jugador | null => {
    const elegibles = inicial.filter(j => j.id !== goleadorId);
    if (elegibles.length === 0) return null;

    // 30% de los goles ocurren sin asistencia directa (jugada individual)
    if (Math.random() < 0.30) return null;

    // Selección ponderada por el valor de pase y visión de juego
    const sumaCreacion = elegibles.reduce((acc, j) => acc + (j.atributos.pase + j.atributos.vision), 0);
    let rand = Math.random() * sumaCreacion;
    for (const j of elegibles) {
      rand -= (j.atributos.pase + j.atributos.vision);
      if (rand <= 0) return j;
    }
    return elegibles[0];
  };

  // 5. RESOLVER CADA CHANCE USANDO RNG
  minutos.forEach((minuto) => {
    const esLocalAtacando = Math.random() < probabilidadLocal;

    if (esLocalAtacando) {
      // Ataca Local vs Defiende Visitante
      const factorAtaque = ataqueLocal * (0.4 + Math.random() * 0.8);
      // Las defensas tienen un multiplicador ligeramente mayor para evitar marcadores abultados e irreales
      const factorDefensa = defensaVisitante * (0.5 + Math.random() * 0.9);

      const tiradorAjustado = elegirGoleador(localAjustados);
      const tirador = inicialLocal.find(j => j.id === tiradorAjustado.id)!;

      if (factorAtaque > factorDefensa) {
        // ¡GOL del Local!
        golesLocal++;
        const asistidorAjustado = elegirAsistidor(localAjustados, tirador.id);
        const asistidor = asistidorAjustado ? inicialLocal.find(j => j.id === asistidorAjustado.id)! : null;

        // Incrementar estadísticas individuales del jugador original
        tirador.goles = (tirador.goles || 0) + 1;

        if (asistidor) {
          asistidor.asistencias = (asistidor.asistencias || 0) + 1;
          eventos.push(`Minuto ${minuto}: 🔴 ¡GOOOL de ${local.nombre}! ${tirador.nombre} define con clase tras una habilitación milimétrica de ${asistidor.nombre}. (Marcador: ${golesLocal}-${golesVisitante})`);
        } else {
          eventos.push(`Minuto ${minuto}: 🔴 ¡GOOOL de ${local.nombre}! Una fantástica galopada individual de ${tirador.nombre} culmina en un disparo inalcanzable. (Marcador: ${golesLocal}-${golesVisitante})`);
        }
      } else {
        // Oportunidad fallada del Local
        const fallos = [
          `Minuto ${minuto}: ¡Aviso del ${local.nombre}! El remate potente de ${tirador.nombre} se estrella espectacularmente contra el poste.`,
          `Minuto ${minuto}: Ocasión clara para ${tirador.nombre} (${local.nombre}), pero el arquero visitante vuela de forma magnífica y ataja el balón.`,
          `Minuto ${minuto}: ${tirador.nombre} se crea el espacio en el área, pero saca un tiro desviado por encima del travesaño.`,
          `Minuto ${minuto}: La zaga del ${visitante.nombre} se impone y bloquea con lo justo un peligroso disparo de ${tirador.nombre}.`
        ];
        eventos.push(obtenerAleatorio(fallos));
      }
    } else {
      // Ataca Visitante vs Defiende Local
      const factorAtaque = ataqueVisitante * (0.4 + Math.random() * 0.8);
      const factorDefensa = defensaLocal * (0.5 + Math.random() * 0.9);

      const tiradorAjustado = elegirGoleador(visitanteAjustados);
      const tirador = inicialVisitante.find(j => j.id === tiradorAjustado.id)!;

      if (factorAtaque > factorDefensa) {
        // ¡GOL del Visitante!
        golesVisitante++;
        const asistidorAjustado = elegirAsistidor(visitanteAjustados, tirador.id);
        const asistidor = asistidorAjustado ? inicialVisitante.find(j => j.id === asistidorAjustado.id)! : null;

        // Incrementar estadísticas individuales del jugador original
        tirador.goles = (tirador.goles || 0) + 1;

        if (asistidor) {
          asistidor.asistencias = (asistidor.asistencias || 0) + 1;
          eventos.push(`Minuto ${minuto}: 🔵 ¡GOOOL de ${visitante.nombre}! ${tirador.nombre} conecta un disparo cruzado espectacular gracias a un centro preciso de ${asistidor.nombre}. (Marcador: ${golesLocal}-${golesVisitante})`);
        } else {
          eventos.push(`Minuto ${minuto}: 🔵 ¡GOOOL de ${visitante.nombre}! ${tirador.nombre} saca un bombazo lejano que sorprende al guardameta. ¡Una genialidad de gol! (Marcador: ${golesLocal}-${golesVisitante})`);
        }
      } else {
        // Oportunidad fallada del Visitante
        const fallos = [
          `Minuto ${minuto}: ¡Alarma en el área del ${local.nombre}! El tiro raso de ${tirador.nombre} pasa besando el palo derecho.`,
          `Minuto ${minuto}: Gran oportunidad para ${tirador.nombre} (${visitante.nombre}), pero el portero local realiza una estirada soberbia.`,
          `Minuto ${minuto}: ${tirador.nombre} cabecea un centro llovido pero el balón sale rozando la cruceta.`,
          `Minuto ${minuto}: Un corte providencial de la defensa del ${local.nombre} le quita el grito de gol a ${tirador.nombre}.`
        ];
        eventos.push(obtenerAleatorio(fallos));
      }
    }
  });

  eventos.push(`🏁 ¡Final del partido! Resultado definitivo: ${local.nombre} ${golesLocal} - ${golesVisitante} ${visitante.nombre}.`);

  return {
    golesLocal,
    golesVisitante,
    eventos
  };
}
