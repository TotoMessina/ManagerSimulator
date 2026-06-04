// @refresh reset
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Equipo, Jugador, Liga, TablaEquipo, Jornada, Formacion, EstiloJuego, OpcionPrensa, RuedaPrensa, OfertaRecibida, Posicion, PersonalidadJugador, CharlaJugador, AcademiaReporte, CopaCampeones, TablaCopa, PartidoCopa, GrupoCopa, AtributosJugador, PromesaGestion, EventoVestuario, OpcionEvento, JugadorAgente, ReunionPrivada, SorteoCopaActivo, FanTweet } from '../types';
import { equiposIniciales, jugadoresIniciales, ligaInicial, fixtureInicial, generarNewgen, generarFixtureRoundRobin, equiposLaLiga, equiposPremier, equiposSerieA, equiposBundesliga, randomRange } from '../data/initialData';
import { simularPartido } from '../engine/matchEngine';

export interface PartidoSimuladoDetalle {
  golesLocal: number;
  golesVisitante: number;
  eventos: string[];
  local: Equipo;
  visitante: Equipo;
  otroPartidoTexto: string;
}

export interface GameContextProps {
  equipos: Equipo[];
  jugadores: Jugador[];
  liga: Liga;
  fechaActual: string;
  equipoUsuarioId: string | null;
  equipoUsuario: Equipo | null;
  partidoReciente: PartidoSimuladoDetalle | null;
  noticias: string[];
  mesesEnQuiebra: number;
  confianzaDirectiva: number;
  ruedaPrensaActiva: RuedaPrensa | null;
  derrotasConsecutivas: number;
  ofertaRecibidaActiva: OfertaRecibida | null;
  fixture: Jornada[];
  reporteAcademia: AcademiaReporte | null;
  partidoEnVivo: { local: Equipo; visitante: Equipo; jornada: Jornada; tipo?: 'liga' | 'copa'; grupoId?: string; partidoId?: string; subtipo?: 'champions' | 'europa'; clima?: 'Soleado' | 'Lluvia Torrencial' | 'Nieve' } | null;
  charlaActiva: CharlaJugador | null;
  copaCampeones: CopaCampeones | null;
  copaEuropa: CopaCampeones | null;
  eventoActivo: EventoVestuario | null;
  deadlineDayActivo: boolean;
  horasDeadline: number;
  jugadoresAgentes: JugadorAgente[];

  nombreManager: string;
  reputacionManager: number;
  historialTitulos: string[];
  juegoIniciado: boolean;
  aceptarOfertaEmpleo: (equipoId: string) => void;
  reunionPrivadaActiva: ReunionPrivada | null;
  resolverReunionPrivada: (decision: 'promesa' | 'autoritario' | 'salida') => void;
  sorteoCopaActivo: SorteoCopaActivo | null;
  guardarSorteoCopa: (tipo: 'champions' | 'europa', grupos: GrupoCopa[], partidosGrupos: any[], fase: 'grupos' | 'cuartos', partidosCuartos?: PartidoCopa[]) => void;
  toggleTransferible: (jugadorId: string) => void;
  designarCapitan: (jugadorId: string) => void;
  darCharlaMotivacional: () => { exito: boolean; mensaje: string };
  organizarActividadCohesion: () => { exito: boolean; mensaje: string };
  ofrecerContratoLibre: (jugadorId: string, salarioSemanal: number, clausulaRescision?: number) => { aceptado: boolean; mensaje: string };
  feedHinchada: FanTweet[];

  // Acciones / Modificadores del Estado
  seleccionarEquipo: (equipoId: string, nombreManagerInput?: string) => void;
  avanzarDia: () => void;
  actualizarJugador: (jugadorId: string, nuevosDatos: Partial<Jugador>) => void;
  actualizarTabla: (nuevaTabla: TablaEquipo[]) => void;
  reiniciarPartida: () => void;
  cerrarPartidoReciente: () => void;
  comprarJugador: (jugadorId: string, oferta: number, promesa?: PromesaGestion | null, clausulaRescision?: number) => { aceptado: boolean; mensaje: string };
  limpiarNoticias: () => void;
  toggleTitular: (jugadorId: string) => void;
  asignarJugadorEnNodo: (jugadorId: string) => void;
  actualizarPosicionesTacticas: (posiciones: Record<string, string | null>) => void;
  actualizarTactica: (formacion: Formacion, estiloJuego: EstiloJuego) => void;
  renovarContrato: (jugadorId: string, nuevoSalario: number, clausulaRescision?: number) => void;
  responderRuedaPrensa: (opcionTipo: 'proteger' | 'critica' | 'evasiva') => void;
  aceptarOfertaRecibida: () => void;
  rechazarOfertaRecibida: () => void;
  contraofertarRecibida: (monto: number) => { aceptado: boolean; mensaje: string };
  finalizarPartidoEnVivo: (golesLocal: number, golesVisitante: number, eventos: string[], jugadoresActualizados: Jugador[]) => void;
  resolverCharla: (decision: 'prometer' | 'vender' | 'sancionar') => void;
  finalizarTemporada: () => void;
  cerrarReporteAcademia: () => void;
  toggleIntransferible: (jugadorId: string) => void;
  establecerRolTactico: (jugadorId: string, rol: 'Hombre de Área' | 'Delantero Avanzado' | 'Pivote Defensivo' | 'Organizador' | null) => void;
  establecerEnfoqueEntrenamiento: (enfoque: 'Físico' | 'Táctico' | 'Técnico') => void;
  establecerEntrenamientoIndividual: (jugadorId: string, atributo: keyof AtributosJugador | null) => void;
  establecerPateadorPenales: (jugadorId: string) => void;
  establecerPateadorTirosLibres: (jugadorId: string) => void;
  establecerPateadorCorners: (jugadorId: string) => void;
  establecerEstrategiaCorner: (estrategia: 'Atacar el primer palo' | 'Centro al área chica' | 'Jugar en corto') => void;
  establecerEstrategiaPases: (estrategia: 'Cortos' | 'Combinados' | 'Largos al espacio') => void;
  resolverEvento: (opcionId: string) => void;
  avanzarHoraDeadline: () => void;
  comprarJugadorAgente: (agenteId: string) => { aceptado: boolean; mensaje: string };
}

export const GameContext = createContext<GameContextProps | undefined>(undefined);

// Helper seguro para avanzar un día en formato YYYY-MM-DD sin desajustes horariados
const sumarUnDia = (fechaStr: string): string => {
  const date = new Date(fechaStr + 'T12:00:00'); // Forzamos mediodía para evitar cambios de fecha inesperados por huso horario
  date.setDate(date.getDate() + 1);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const sumarDias = (fechaStr: string, dias: number): string => {
  const date = new Date(fechaStr + 'T12:00:00');
  date.setDate(date.getDate() + dias);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const calcularRecaudacionTaquilla = (club: Equipo): { asistencia: number; precioTicket: number; recaudacion: number } => {
  const asistencia = Math.round(club.capacidadEstadio * (0.8 + Math.random() * 0.2));
  const precioTicket = 30 + (club.reputacion - 50) * 0.5;
  const recaudacion = Math.round(asistencia * precioTicket);
  return { asistencia, precioTicket, recaudacion };
};

const inicializarCopa = (
  equiposList: Equipo[],
  fechaInicio: string,
  tipo: 'champions' | 'europa',
  clasificadosLiga?: Equipo[],
  paisLigaActiva?: string
): CopaCampeones => {
  const obtenerPaisEquipoLocal = (equipoId: string): 'espana' | 'inglaterra' | 'italia' | 'alemania' => {
    if (equiposLaLiga.some(e => e.id === equipoId)) return 'espana';
    if (equiposPremier.some(e => e.id === equipoId)) return 'inglaterra';
    if (equiposSerieA.some(e => e.id === equipoId)) return 'italia';
    return 'alemania';
  };

  const getTeamsForCountry = (country: 'espana' | 'inglaterra' | 'italia' | 'alemania'): Equipo[] => {
    const isUserLeague = paisLigaActiva && paisLigaActiva.toLowerCase() === (
      country === 'espana' ? 'españa' :
        country === 'inglaterra' ? 'inglaterra' :
          country === 'italia' ? 'italia' : 'alemania'
    );
    if (isUserLeague && clasificadosLiga && clasificadosLiga.length >= 8) {
      if (tipo === 'champions') {
        return clasificadosLiga.slice(0, 4);
      } else {
        return clasificadosLiga.slice(4, 8);
      }
    } else {
      const sorted = [...equiposList]
        .filter(e => obtenerPaisEquipoLocal(e.id) === country)
        .sort((a, b) => b.reputacion - a.reputacion);
      if (tipo === 'champions') {
        return sorted.slice(0, 4);
      } else {
        return sorted.slice(4, 8);
      }
    }
  };

  const esp = getTeamsForCountry('espana');
  const eng = getTeamsForCountry('inglaterra');
  const ita = getTeamsForCountry('italia');
  const ger = getTeamsForCountry('alemania');

  const participantes = [
    ...esp.map(e => e.id),
    ...eng.map(e => e.id),
    ...ita.map(e => e.id),
    ...ger.map(e => e.id)
  ];

  const grupoA = [esp[0].id, eng[1].id, ita[2].id, ger[3].id];
  const grupoB = [eng[0].id, ita[1].id, ger[2].id, esp[3].id];
  const grupoC = [ita[0].id, ger[1].id, esp[2].id, eng[3].id];
  const grupoD = [ger[0].id, esp[1].id, eng[2].id, ita[3].id];

  const crearTablaGrupo = (equiposGrupo: string[]): TablaCopa[] => {
    return equiposGrupo.map(eqId => {
      const eq = equiposList.find(e => e.id === eqId)!;
      return {
        idEquipo: eq.id,
        nombreEquipo: eq.nombre,
        escudo: eq.escudo,
        partidosJugados: 0,
        ganados: 0,
        empatados: 0,
        perdidos: 0,
        golesFavor: 0,
        golesContra: 0,
        diferenciaGoles: 0,
        puntos: 0
      };
    });
  };

  const grupos: GrupoCopa[] = [
    { id: 'A', equipos: grupoA, tabla: crearTablaGrupo(grupoA) },
    { id: 'B', equipos: grupoB, tabla: crearTablaGrupo(grupoB) },
    { id: 'C', equipos: grupoC, tabla: crearTablaGrupo(grupoC) },
    { id: 'D', equipos: grupoD, tabla: crearTablaGrupo(grupoD) }
  ];

  const programarGrupo = (grupoId: string, T: string[]) => {
    const roundsDef = [
      [[0, 1], [2, 3]],
      [[1, 2], [3, 0]],
      [[0, 2], [1, 3]],
      [[1, 0], [3, 2]],
      [[2, 1], [0, 3]],
      [[2, 0], [3, 1]]
    ];
    return roundsDef.map((pairs, roundIdx) => {
      const jornadaNum = roundIdx + 1;
      const offset = [2, 16, 30, 44, 58, 72][roundIdx];
      const fecha = sumarDias(fechaInicio, offset);
      return {
        jornada: jornadaNum,
        fecha,
        grupoId,
        partidos: pairs.map((pair, pIdx) => ({
          id: `copa-${tipo}-${grupoId}-j${jornadaNum}-p${pIdx}`,
          localId: T[pair[0]],
          visitanteId: T[pair[1]],
          jugado: false
        }))
      };
    });
  };

  const partidosGrupos = [
    ...programarGrupo('A', grupoA),
    ...programarGrupo('B', grupoB),
    ...programarGrupo('C', grupoC),
    ...programarGrupo('D', grupoD)
  ];

  return {
    participantes,
    grupos,
    faseActual: 'grupos',
    partidosGrupos,
    cuartos: null,
    semifinales: null,
    final: null,
    campeon: null
  };
};

const formatearMoneda = (valor: number): string => {
  if (valor >= 1000000) {
    return `${(valor / 1000000).toFixed(1)} M€`;
  }
  return `${(valor / 1000).toFixed(0)} m€`;
};

// ==========================================
// FUNCIÓN CENTRALIZADA PARA EJECUTAR EL PASO DEL TIEMPO
// ==========================================
const ejecutarPasoDelTiempo = (
  fechaActual: string,
  jugadores: Jugador[],
  equipoUsuarioId: string | null,
  enfoqueEntrenamiento: 'Físico' | 'Táctico' | 'Técnico'
): { nuevaFecha: string; nuevosJugadores: Jugador[]; nuevasNoticias: string[]; cambioDeMes: boolean; esLunes: boolean } => {
  const nuevaFecha = sumarUnDia(fechaActual);
  const nuevasNoticias: string[] = [];

  const dateActual = new Date(fechaActual + 'T12:00:00');
  const dateNueva = new Date(nuevaFecha + 'T12:00:00');

  // Detectar si el mes del calendario cambia (ej. de 31 de Julio a 1 de Agosto)
  const cambioDeMes = dateNueva.getMonth() !== dateActual.getMonth();
  const esLunes = dateNueva.getDay() === 1;

  const nombresAmigables: Record<string, string> = {
    remate: 'Remate / Definición',
    pase: 'Pase',
    regate: 'Regate / Dribbling',
    defensa: 'Defensa / Marcaje',
    tecnica: 'Técnica / Control',
    velocidad: 'Velocidad',
    aceleracion: 'Aceleración',
    resistencia: 'Resistencia',
    fuerza: 'Fuerza',
    vision: 'Visión de Juego',
    decisiones: 'Toma de Decisiones',
    determinacion: 'Determinación',
    posicionamiento: 'Colocación',
    reflejos: 'Reflejos'
  };

  const nuevosJugadores = jugadores.map(jugador => {
    let jugadorClon = {
      ...jugador,
      atributos: { ...jugador.atributos }
    };

    // Inicializar mesesContrato si no está definido
    if (jugadorClon.mesesContrato === undefined) {
      jugadorClon.mesesContrato = Math.floor(Math.random() * 25) + 6;
    }

    // Desgaste mensual de contrato
    if (cambioDeMes) {
      const nuevosMeses = Math.max(0, jugadorClon.mesesContrato - 1);
      jugadorClon.mesesContrato = nuevosMeses;

      // Si el contrato expira, la moral cae a 10 y se desmarca de los titulares
      if (nuevosMeses === 0) {
        jugadorClon.moral = 10;
        jugadorClon.titular = false;
        if (jugadorClon.idEquipo === equipoUsuarioId) {
          nuevasNoticias.push(
            `🚨 [Contrato Expirado] El contrato de ${jugadorClon.nombre} ha expirado. Se niega a jugar y entrenar hasta que firme una renovación.`
          );
        }
      }
    }

    // 1. Simulación de recuperación física (Físico focus recupera menos forma de lo habitual)
    if (jugadorClon.formaFisica < 100) {
      let recuperacion = jugadorClon.titular ? 3 : 10;
      if (jugadorClon.idEquipo === equipoUsuarioId && enfoqueEntrenamiento === 'Físico') {
        recuperacion = jugadorClon.titular ? 1 : 5;
      }
      jugadorClon.formaFisica = Math.min(100, jugadorClon.formaFisica + recuperacion);
    }

    // 1.5. Simulación de recuperación de lesiones (reducción de semanas restantes)
    if (jugadorClon.lesionado) {
      if (jugadorClon.semanasLesion !== undefined) {
        // Reducir semanas de lesión en 1/7 por cada día transcurrido
        const nuevoSemanas = Math.max(0, jugadorClon.semanasLesion - (1 / 7));
        jugadorClon.semanasLesion = Number(nuevoSemanas.toFixed(2));
        jugadorClon.semanasLesionado = jugadorClon.semanasLesion;

        if (jugadorClon.semanasLesion <= 0) {
          jugadorClon.lesionado = false;
          jugadorClon.semanasLesion = undefined;
          jugadorClon.semanasLesionado = undefined;

          // Si es del equipo del usuario, reportar noticia de alta médica
          if (jugadorClon.idEquipo === equipoUsuarioId) {
            nuevasNoticias.push(
              `🏥 [Alta Médica] ¡Buenas noticias! ${jugadorClon.nombre} ha recibido el alta médica y vuelve a estar disponible para jugar.`
            );
          }
        }
      }
    }

    // 2. Progresión mensual al final del mes
    if (cambioDeMes) {
      // --- MENORES DE 23 AÑOS (PROGRESIÓN) ---
      if (jugadorClon.edad < 23 && jugadorClon.ca < jugadorClon.pa) {
        if (Math.random() < 0.40) {
          const atributosDisponibles = Object.keys(jugadorClon.atributos) as (keyof typeof jugadorClon.atributos)[];

          // Elegir 2 atributos distintos al azar
          let attr1 = atributosDisponibles[Math.floor(Math.random() * atributosDisponibles.length)];
          let attr2 = atributosDisponibles[Math.floor(Math.random() * atributosDisponibles.length)];
          while (attr1 === attr2) {
            attr2 = atributosDisponibles[Math.floor(Math.random() * atributosDisponibles.length)];
          }

          let incrementados: string[] = [];
          if (jugadorClon.atributos[attr1] < 20) {
            jugadorClon.atributos[attr1] = jugadorClon.atributos[attr1] + 1;
            incrementados.push(nombresAmigables[attr1] || String(attr1));
          }
          if (jugadorClon.atributos[attr2] < 20) {
            jugadorClon.atributos[attr2] = jugadorClon.atributos[attr2] + 1;
            incrementados.push(nombresAmigables[attr2] || String(attr2));
          }

          // Aumentar CA en +1 en consecuencia (sin superar la PA)
          jugadorClon.ca = Math.min(jugadorClon.pa, jugadorClon.ca + 1);

          // Si es del equipo del usuario, reportar noticia
          if (jugadorClon.idEquipo === equipoUsuarioId && incrementados.length > 0) {
            nuevasNoticias.push(
              `📈 [Progreso Notable] ${jugadorClon.nombre} (${jugadorClon.edad} años) ha mejorado su nivel en ${incrementados.join(' y ')} tras un mes sobresaliente de entrenamientos.`
            );
          }
        }
      }

      // --- MAYORES DE 33 AÑOS (REGRESIÓN FÍSICA) ---
      if (jugadorClon.edad > 33) {
        if (Math.random() < 0.30) {
          // Declive de atributos físicos
          const atributosFisicos: (keyof typeof jugadorClon.atributos)[] = ['velocidad', 'resistencia', 'aceleracion', 'fuerza'];
          const attrElegido = atributosFisicos[Math.floor(Math.random() * atributosFisicos.length)];

          let decrementado = false;
          if (jugadorClon.atributos[attrElegido] > 1) {
            jugadorClon.atributos[attrElegido] = jugadorClon.atributos[attrElegido] - 1;
            decrementado = true;
          }

          // Disminuir CA en -1 en consecuencia
          jugadorClon.ca = Math.max(1, jugadorClon.ca - 1);

          // Si es del equipo del usuario, reportar noticia
          if (jugadorClon.idEquipo === equipoUsuarioId && decrementado) {
            nuevasNoticias.push(
              `📉 [Declive Físico] Informe médico: ${jugadorClon.nombre} (${jugadorClon.edad} años) muestra signos de desgaste por edad, reduciendo su nivel de ${nombresAmigables[attrElegido] || String(attrElegido)}.`
            );
          }
        }
      }
    }

    // --- AMBICIOSOS (DECLIVE MENSUAL SI NO SON TITULARES) ---
    if (cambioDeMes && jugadorClon.personalidad === 'Ambicioso' && !jugadorClon.titular && jugadorClon.idEquipo === equipoUsuarioId) {
      jugadorClon.moral = Math.max(1, jugadorClon.moral - 15);
      nuevasNoticias.push(
        `⚡ [Expectativas] ${jugadorClon.nombre} está frustrado por no ser titular. Su moral ha decaído debido a su personalidad Ambiciosa.`
      );
    }

    // --- PROCESAMIENTO DE ENTRENAMIENTO SEMANAL (LUNES) ---
    if (esLunes && jugadorClon.idEquipo === equipoUsuarioId) {
      // 1. Entrenamiento Club (Físico o Técnico)
      if (enfoqueEntrenamiento === 'Físico') {
        if (jugadorClon.edad < 23 && jugadorClon.ca < jugadorClon.pa) {
          if (Math.random() < 0.35) {
            const attr = Math.random() < 0.5 ? 'velocidad' : 'resistencia';
            if (jugadorClon.atributos[attr] < 20) {
              jugadorClon.atributos[attr] = jugadorClon.atributos[attr] + 1;
              jugadorClon.ca = Math.min(jugadorClon.pa, jugadorClon.ca + 1);
              nuevasNoticias.push(
                `🏋️ [Entrenamiento Físico] ${jugadorClon.nombre} (${jugadorClon.edad} años) mejoró su ${nombresAmigables[attr]} (+1) tras la semana física.`
              );
            }
          }
        }
      } else if (enfoqueEntrenamiento === 'Técnico') {
        if (jugadorClon.edad < 23 && jugadorClon.ca < jugadorClon.pa) {
          if (Math.random() < 0.35) {
            const techAttrs: (keyof AtributosJugador)[] = ['remate', 'pase', 'regate', 'tecnica', 'defensa'];
            const attr = techAttrs[Math.floor(Math.random() * techAttrs.length)];
            if (jugadorClon.atributos[attr] < 20) {
              jugadorClon.atributos[attr] = jugadorClon.atributos[attr] + 1;
              jugadorClon.ca = Math.min(jugadorClon.pa, jugadorClon.ca + 1);
              nuevasNoticias.push(
                `⚽ [Entrenamiento Técnico] ${jugadorClon.nombre} (${jugadorClon.edad} años) mejoró su ${nombresAmigables[attr]} (+1) enfocándose en la técnica.`
              );
            }
          }
        }
      }

      // 2. Entrenamiento Individual
      if (jugadorClon.entrenamientoIndividual) {
        const attr = jugadorClon.entrenamientoIndividual;
        const prob = jugadorClon.edad < 23 ? 0.40 : 0.20;
        if (Math.random() < prob && jugadorClon.ca < jugadorClon.pa) {
          if (jugadorClon.atributos[attr] < 20) {
            jugadorClon.atributos[attr] = jugadorClon.atributos[attr] + 1;
            jugadorClon.ca = Math.min(jugadorClon.pa, jugadorClon.ca + 1);
            nuevasNoticias.push(
              `🎯 [Entrenamiento Individual] ${jugadorClon.nombre} mejoró su ${nombresAmigables[attr]} (+1) gracias a su enfoque individual.`
            );
          }
        }
      }
    }

    return jugadorClon;
  });

  return {
    nuevaFecha,
    nuevosJugadores,
    nuevasNoticias,
    cambioDeMes,
    esLunes
  };
};

// ============================================================
// GENERADOR DE EVENTOS ALEATORIOS DE VESTUARIO
// Selecciona un evento contextual basado en el estado del plantel
// ============================================================
const generarEventoAleatorio = (
  plantelCompleto: Jugador[],
  equipoUsuarioId: string
): EventoVestuario | null => {
  const plantel = plantelCompleto.filter(j => j.idEquipo === equipoUsuarioId);
  if (plantel.length === 0) return null;

  // Candidatos por tipo
  const problematicos = plantel.filter(j => j.personalidad === 'Problemático');
  const jovenes = plantel.filter(j => j.edad <= 21 && j.ca < j.pa);
  const lideres = plantel.filter(j => j.personalidad === 'Líder');
  const ambiciosos = plantel.filter(j => j.personalidad === 'Ambicioso' && !j.titular);
  const leales = plantel.filter(j => j.personalidad === 'Leal');
  const veteranos = plantel.filter(j => j.edad >= 33);
  const moralBaja = plantel.filter(j => j.moral < 45);

  const eventosPosibles: (() => EventoVestuario | null)[] = [];

  // EVENTO 1: Indisciplina (requiere jugador Problemático)
  if (problematicos.length > 0) {
    eventosPosibles.push(() => {
      const jugador = problematicos[Math.floor(Math.random() * problematicos.length)];
      return {
        id: `evt-indisciplina-${Date.now()}`,
        tipo: 'indisciplina',
        titulo: 'Noche de Juerga Antes del Entrenamiento',
        descripcion: `${jugador.nombre} (${jugador.posicion}, Personalidad: Problemático) fue visto saliendo de un boliche a las 3 AM, la noche previa a la sesión de entrenamiento. El preparador físico reporta que llegó tarde y con evidentes signos de cansancio. El vestuario está al tanto. ¿Cómo reaccionás?`,
        jugadorId: jugador.id,
        jugadorNombre: jugador.nombre,
        opciones: [
          {
            id: 'sancion',
            icono: '💸',
            texto: 'Sancionarlo económicamente',
            descripcionEfecto: 'Le descontarás una semana de sueldo. El jugador bajará su moral pero la disciplina del equipo mejorará.',
            efecto: { jugadorMoral: -20, moralEquipo: +5, confianzaDirectiva: +3 }
          },
          {
            id: 'perdonar',
            icono: '🤝',
            texto: 'Perdonarlo en privado',
            descripcionEfecto: 'Una charla a puertas cerradas. Su moral sube pero el capitán pierde confianza en tu autoridad.',
            efecto: { jugadorMoral: +15, moralCapitan: -15 }
          },
          {
            id: 'venta',
            icono: '✈️',
            texto: 'Ponerlo en lista de transferibles',
            descripcionEfecto: 'Señal clara al vestuario. El jugador bajará su moral a fondo y será más fácil venderlo en el próximo mercado.',
            efecto: { jugadorMoral: -35, moralEquipo: +8, confianzaDirectiva: +5 }
          }
        ]
      };
    });
  }

  // EVENTO 2: Presión Familiar (requiere joven de cantera)
  if (jovenes.length > 0) {
    eventosPosibles.push(() => {
      const jugador = jovenes[Math.floor(Math.random() * jovenes.length)];
      return {
        id: `evt-familiar-${Date.now()}`,
        tipo: 'presion_familiar',
        titulo: 'La Joya Extraña su País Natal',
        descripcion: `${jugador.nombre} (${jugador.edad} años, PA: ${jugador.pa}) se acercó al cuerpo técnico en un momento de vulnerabilidad. Extraña a su familia y pide una semana de licencia para visitarlos. Es un jugador con enorme potencial y está en una etapa clave de su desarrollo. ¿Qué decidís?`,
        jugadorId: jugador.id,
        jugadorNombre: jugador.nombre,
        opciones: [
          {
            id: 'licencia',
            icono: '✈️',
            texto: 'Darle la licencia de una semana',
            descripcionEfecto: 'El jugador vuelve recargado emocionalmente. Pierde forma física pero su potencial aumenta por la motivación extra.',
            efecto: { jugadorMoral: +25, jugadorForma: -15, jugadorPa: +2 }
          },
          {
            id: 'negar',
            icono: '🚫',
            texto: 'Negarle el viaje (hay partido importante)',
            descripcionEfecto: 'El jugador entiende pero queda resentido. Su moral se desploma a mínimos.',
            efecto: { jugadorMoral: -40 }
          },
          {
            id: 'videollamada',
            icono: '📱',
            texto: 'Ofrecerle días libres y soporte psicológico',
            descripcionEfecto: 'Un compromiso de bienestar. No pierde forma y mejora levemente su moral.',
            efecto: { jugadorMoral: +10, confianzaDirectiva: +2 }
          }
        ]
      };
    });
  }

  // EVENTO 3: Conflicto Interno (requiere líder + moral baja general)
  if (lideres.length > 0 && moralBaja.length >= 3) {
    eventosPosibles.push(() => {
      const lider = lideres[Math.floor(Math.random() * lideres.length)];
      return {
        id: `evt-conflicto-${Date.now()}`,
        tipo: 'conflicto_interno',
        titulo: 'Reunión de Vestuario No Convocada',
        descripcion: `${lider.nombre} (Personalidad: Líder) organizó una reunión de vestuario sin avisarte. El ambiente general del plantel está tenso y varios jugadores tienen la moral por el piso. Hay rumores de que el grupo le pide al capitán que hable con la directiva. ¿Cómo manejás la situación?`,
        jugadorId: lider.id,
        jugadorNombre: lider.nombre,
        opciones: [
          {
            id: 'apoyar',
            icono: '💬',
            texto: 'Convocar una charla grupal y escuchar',
            descripcionEfecto: 'Mostrás liderazgo y empatía. La moral del equipo sube y ganás confianza con la directiva.',
            efecto: { moralEquipo: +12, confianzaDirectiva: +5 }
          },
          {
            id: 'ignorar',
            icono: '🙄',
            texto: 'Ignorarlo y continuar con la rutina',
            descripcionEfecto: 'El malestar se acumula. La moral baja aún más y el capitán pierde respeto por vos.',
            efecto: { moralEquipo: -10, moralCapitan: -20, confianzaDirectiva: -8 }
          },
          {
            id: 'multar',
            icono: '📋',
            texto: 'Multar al capitán por saltarse la cadena de mando',
            descripcionEfecto: 'Autoridad fuerte pero divisiva. La moral del equipo se divide. La directiva lo aprueba.',
            efecto: { jugadorMoral: -25, moralEquipo: -5, confianzaDirectiva: +8 }
          }
        ]
      };
    });
  }

  // EVENTO 4: Petición Salarial (requiere ambicioso no titular)
  if (ambiciosos.length > 0) {
    eventosPosibles.push(() => {
      const jugador = ambiciosos[Math.floor(Math.random() * ambiciosos.length)];
      const aumento = Math.round(jugador.salarioSemanal * 0.3);
      const aumentoTexto = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(aumento);
      return {
        id: `evt-salario-${Date.now()}`,
        tipo: 'peticion_salarial',
        titulo: 'Petición de Aumento de Sueldo',
        descripcion: `El agente de ${jugador.nombre} (CA: ${jugador.ca}, Personalidad: Ambicioso) solicita una reunión urgente. Exige un aumento de ${aumentoTexto} semanales o amenaza con no renovar. Actualmente no está siendo titular y su moral está en declive. La directiva observa la situación.`,
        jugadorId: jugador.id,
        jugadorNombre: jugador.nombre,
        opciones: [
          {
            id: 'aceptar',
            icono: '💰',
            texto: `Aceptar el aumento (${aumentoTexto}/sem)`,
            descripcionEfecto: 'El jugador queda contento y renueva su compromiso. Tu presupuesto semanal sube pero la directiva lo ve como debilidad.',
            efecto: { jugadorMoral: +30, presupuesto: -aumento * 4, confianzaDirectiva: -5 }
          },
          {
            id: 'negociar',
            icono: '🤝',
            texto: 'Negociar un aumento menor',
            descripcionEfecto: 'Llegáis a un término medio. El jugador acepta a regañadientes pero queda estable.',
            efecto: { jugadorMoral: +10, presupuesto: -Math.round(aumento * 0.5) * 4, confianzaDirectiva: +2 }
          },
          {
            id: 'rechazar',
            icono: '🚫',
            texto: 'Rechazar y ponerlo en vitrina',
            descripcionEfecto: 'Le decís que si no está conforme, lo vendés. Su moral cae pero la directiva aprueba la firmeza.',
            efecto: { jugadorMoral: -25, confianzaDirectiva: +6 }
          }
        ]
      };
    });
  }

  // EVENTO 5: Crítica Pública (requiere veterano o cualquier jugador)
  if (veteranos.length > 0 || plantel.length > 0) {
    eventosPosibles.push(() => {
      const grupo = veteranos.length > 0 ? veteranos : plantel;
      const jugador = grupo[Math.floor(Math.random() * grupo.length)];
      return {
        id: `evt-critica-${Date.now()}`,
        tipo: 'critica_publica',
        titulo: 'Declaraciones Polémicas en la Prensa',
        descripcion: `${jugador.nombre} dio una entrevista a un medio deportivo y declaró que "el equipo necesita cambios urgentes en la dinámica de juego" sin nombrarte directamente. La nota se hizo viral. La directiva está molesta y te pide que actúes para proteger la imagen del club.`,
        jugadorId: jugador.id,
        jugadorNombre: jugador.nombre,
        opciones: [
          {
            id: 'defender',
            icono: '🛡️',
            texto: 'Defenderlo públicamente ("fue sacado de contexto")',
            descripcionEfecto: 'El jugador agradece tu apoyo. La moral sube pero la directiva pierde confianza en vos.',
            efecto: { jugadorMoral: +20, moralEquipo: +5, confianzaDirectiva: -10 }
          },
          {
            id: 'silencio',
            icono: '🤐',
            texto: 'Guardar silencio y no alimentar el escándalo',
            descripcionEfecto: 'La situación se apaga sola. Sin efectos inmediatos, pero ganas prudencia reputacional.',
            efecto: { confianzaDirectiva: +2 }
          },
          {
            id: 'sancionar',
            icono: '📣',
            texto: 'Citarlo y sancionarlo por romper la disciplina',
            descripcionEfecto: 'Mensaje claro al vestuario. El jugador baja moral pero la directiva valora tu autoridad.',
            efecto: { jugadorMoral: -20, moralEquipo: -5, confianzaDirectiva: +8 }
          }
        ]
      };
    });
  }

  // EVENTO 6: Lesión en entrenamiento de un jugador leal
  if (leales.length > 0) {
    eventosPosibles.push(() => {
      const jugador = leales[Math.floor(Math.random() * leales.length)];
      return {
        id: `evt-lesion-entreno-${Date.now()}`,
        tipo: 'lesion_entrenamiento',
        titulo: 'Sobreentrenamiento de un Pilar del Equipo',
        descripcion: `El cuerpo médico alerta sobre ${jugador.nombre} (${jugador.edad} años, Personalidad: Leal). Está entrenando al límite de su capacidad física por iniciativa propia y podría lesionarse si continúa. Su forma física actual es ${jugador.formaFisica}%. ¿Cómo intervenís?`,
        jugadorId: jugador.id,
        jugadorNombre: jugador.nombre,
        opciones: [
          {
            id: 'descanso',
            icono: '🛋️',
            texto: 'Ordenar descanso preventivo obligatorio',
            descripcionEfecto: 'El jugador descansa y recupera forma. Baja su moral por no entrenar pero sube la confianza médica.',
            efecto: { jugadorMoral: -10, jugadorForma: +20, confianzaDirectiva: +3 }
          },
          {
            id: 'continuar',
            icono: '💪',
            texto: 'Dejarlo continuar, es su decisión',
            descripcionEfecto: 'Respetás su voluntad. Su moral sube pero asumís riesgo físico real.',
            efecto: { jugadorMoral: +15, jugadorForma: -10 }
          },
          {
            id: 'plan',
            icono: '📊',
            texto: 'Diseñarle un plan de carga personalizado',
            descripcionEfecto: 'Lo mejor de ambos mundos. El jugador mejora su forma sin riesgo de lesión y agradece la atención.',
            efecto: { jugadorMoral: +20, jugadorForma: +10, jugadorCa: +1 }
          }
        ]
      };
    });
  }

  // EVENTO 7: Reclamo de Capitanía
  if (ambiciosos.length > 0 && lideres.length > 0) {
    eventosPosibles.push(() => {
      const aspirante = ambiciosos[Math.floor(Math.random() * ambiciosos.length)];
      const capitanActual = lideres[Math.floor(Math.random() * lideres.length)];
      if (aspirante.id === capitanActual.id) return null;
      return {
        id: `evt-capitania-${Date.now()}`,
        tipo: 'reclamo_capitania',
        titulo: 'Disputa por el Brazalete de Capitán',
        descripcion: `${aspirante.nombre} (Personalidad: Ambicioso, CA: ${aspirante.ca}) manifestó en privado su deseo de ser el nuevo capitán del equipo. Actualmente ese rol lo ocupa ${capitanActual.nombre} (CA: ${capitanActual.ca}). La tensión entre ambos jugadores es notoria en el entrenamiento diario.`,
        jugadorId: aspirante.id,
        jugadorNombre: aspirante.nombre,
        opciones: [
          {
            id: 'mantener',
            icono: '🏆',
            texto: `Mantener a ${capitanActual.nombre} como capitán`,
            descripcionEfecto: 'El capitán actual mantiene su autoridad. El aspirante baja moral pero la unidad del grupo se preserva.',
            efecto: { jugadorMoral: -15, moralCapitan: +10 }
          },
          {
            id: 'cambiar',
            icono: '🔄',
            texto: `Designar a ${aspirante.nombre} como nuevo capitán`,
            descripcionEfecto: 'El cambio genera tensión inicial. El nuevo capitán sube su moral pero el anterior la baja fuerte.',
            efecto: { jugadorMoral: +30, moralCapitan: -25, moralEquipo: -5 }
          },
          {
            id: 'cocapitania',
            icono: '🤲',
            texto: 'Instaurar una co-capitanía rotativa',
            descripcionEfecto: 'Una solución diplomática. Ambos quedan conformes y la moral general mejora levemente.',
            efecto: { jugadorMoral: +15, moralCapitan: +5, moralEquipo: +5, confianzaDirectiva: +2 }
          }
        ]
      };
    });
  }

  // Seleccionar uno de los eventos posibles al azar
  if (eventosPosibles.length === 0) return null;
  const generadores = eventosPosibles.filter(Boolean);
  if (generadores.length === 0) return null;

  // Mezclar y probar hasta encontrar uno válido
  const mezclados = [...generadores].sort(() => Math.random() - 0.5);
  for (const gen of mezclados) {
    const evento = gen();
    if (evento) return evento;
  }
  return null;
};

// ============================================================
// GENERADOR DE AGENTES LIBRES PARA DEADLINE DAY
// Crea jugadores sin club disponibles con 30% de descuento
// ============================================================
const POSICIONES_AGENTE: Posicion[] = ['POR', 'DFC', 'LD', 'LI', 'MC', 'MCO', 'ED', 'EI', 'DC'];
const NACS_AGENTE = ['España', 'Francia', 'Alemania', 'Italia', 'Brasil', 'Argentina', 'Portugal', 'Países Bajos'];
const NOMBRES_AGENTE = ['Kosta', 'Mateo', 'Damian', 'Felix', 'Luca', 'Marco', 'Omar', 'Diogo', 'Arjan', 'Nuno', 'Tomas', 'Eder', 'Rafael', 'Sandro', 'Bruno', 'Alexei', 'Sergey', 'Karim', 'Yannick', 'Pascal'];
const APELLIDOS_AGENTE = ['Braga', 'Melo', 'Kovač', 'Heinz', 'Fontaine', 'Sosa', 'Ardito', 'Martins', 'Vogel', 'Huber', 'Silva', 'Ferreira', 'Andrade', 'Varela', 'Sousa', 'Petrov', 'Novak', 'Blanc', 'Leconte', 'Moreau'];
const PERSONALIDADES: PersonalidadJugador[] = ['Profesional', 'Leal', 'Ambicioso', 'Líder', 'Líder'];

const generarAgenteLibre = (seed: number): JugadorAgente => {
  const rng = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pos = POSICIONES_AGENTE[seed % POSICIONES_AGENTE.length];
  const ca = rng(60, 78);
  const pa = Math.min(100, ca + rng(0, 10));
  const valorMercado = ca * rng(180000, 280000);
  const valorDescuento = Math.round(valorMercado * 0.70);
  const nombre = `${NOMBRES_AGENTE[rng(0, NOMBRES_AGENTE.length - 1)]} ${APELLIDOS_AGENTE[rng(0, APELLIDOS_AGENTE.length - 1)]}`;
  const base = rng(8, 14);
  return {
    id: `agente-${seed}-${Math.random().toString(36).substr(2, 6)}`,
    nombre,
    posicion: pos,
    edad: rng(23, 31),
    nacionalidad: NACS_AGENTE[rng(0, NACS_AGENTE.length - 1)],
    ca,
    pa,
    valorMercado,
    valorDescuento,
    personalidad: PERSONALIDADES[rng(0, PERSONALIDADES.length - 1)],
    salarioSemanal: Math.round(valorMercado * 0.002),
    comprado: false,
    atributos: {
      remate: pos === 'DC' || pos === 'ED' || pos === 'EI' ? rng(base + 2, base + 5) : rng(base - 2, base + 1),
      pase: pos === 'MC' || pos === 'MCO' ? rng(base + 2, base + 5) : rng(base - 1, base + 2),
      regate: pos === 'ED' || pos === 'EI' ? rng(base + 2, base + 4) : rng(base - 2, base + 1),
      defensa: pos === 'DFC' || pos === 'LD' || pos === 'LI' ? rng(base + 2, base + 5) : rng(base - 3, base),
      tecnica: rng(base, base + 3),
      velocidad: pos === 'ED' || pos === 'EI' || pos === 'DC' ? rng(base + 1, base + 4) : rng(base - 1, base + 2),
      aceleracion: rng(base, base + 3),
      resistencia: rng(base, base + 3),
      fuerza: rng(base, base + 2),
      vision: pos === 'MCO' || pos === 'MC' ? rng(base + 1, base + 4) : rng(base - 1, base + 2),
      decisiones: rng(base, base + 3),
      determinacion: rng(base, base + 3),
      posicionamiento: rng(base, base + 3),
      reflejos: pos === 'POR' ? rng(base + 3, base + 6) : rng(base - 4, base - 1),
    }
  };
};

const generarReunionPrivada = (plantelCompleto: Jugador[], equipoUsuarioId: string): ReunionPrivada | null => {
  // Filtrar jugadores del equipo del usuario con moral baja (< 30) o promesas incumplidas
  const plantel = plantelCompleto.filter(j => j.idEquipo === equipoUsuarioId && !j.lesionado);
  if (plantel.length === 0) return null;

  // Jugadores que tienen promesas incumplidas (estado === 'Incumplida')
  const conPromesaIncumplida = plantel.filter(j => j.promesas && j.promesas.some(p => p.estado === 'Incumplida'));

  // Si no hay promesas incumplidas, buscar jugadores con moral por debajo de 30
  const candidatos = conPromesaIncumplida.length > 0 ? conPromesaIncumplida : plantel.filter(j => j.moral < 30);
  if (candidatos.length === 0) return null;

  // Ordenar candidatos por moral ascendente para elegir al de menor moral
  const jugador = candidatos.sort((a, b) => a.moral - b.moral)[0];
  const tienePromesa = conPromesaIncumplida.some(j => j.id === jugador.id);

  const obtenerMensajeProblema = (j: Jugador, esPromesa: boolean): string => {
    if (esPromesa) {
      const msgs = [
        'Mánager, le prometiste que iba a ser titular y vengo jugando poco. Exijo una explicación o voy a pedir el transfer request.',
        'Necesito hablar con usted. Me prometió un lugar en el once y sigo en el banco. El equipo me necesita en la cancha, no afuera.',
        'Con todo respeto, mánager, una promesa es una promesa. Si no se va a cumplir, prefiero ir a buscar otro club donde me valoren.'
      ];
      return msgs[Math.floor(Math.random() * msgs.length)];
    }

    const msgsPorPersonalidad: Record<string, string[]> = {
      Ambicioso: [
        'Mánager, esto no puede seguir así. Mi rendimiento merece más reconocimiento. Quiero saber cuál es mi futuro en este club.',
        'Soy ambicioso y quiero ganar cosas importantes. Si no me ve como parte del proyecto, dígamelo ya.'
      ],
      Problemático: [
        'Estoy harto de esta situación. El ambiente del vestuario está mal, yo estoy mal y nadie hace nada al respecto.',
        'Mánager, esto tiene que cambiar. No voy a aguantar más sin decir lo que pienso.'
      ],
      Profesional: [
        'Mánager, quería hablar con usted sobre mi situación. Me siento infravalorado y necesito entender cuál es mi rol aquí.',
        'Vengo con respeto pero con la necesidad de ser honesto: mi moral está muy baja y eso afecta mi rendimiento.'
      ],
      Líder: [
        'Mánager, hablo como líder de este grupo. Hay algo que no está funcionando y tenemos que arreglarlo ahora.',
        'Si no me da una explicación de mi situación, voy a tener que pensar en otras opciones. Lo digo con respeto.'
      ],
      Leal: [
        'Siempre di todo por este club, mánager. Pero hay un límite. Necesito saber que se confía en mí.',
        'Soy leal, pero tengo mis límites también. ¿Qué pasa con mi situación?'
      ]
    };

    const msgs = msgsPorPersonalidad[j.personalidad] || msgsPorPersonalidad.Profesional;
    return msgs[Math.floor(Math.random() * msgs.length)];
  };

  return {
    jugadorId: jugador.id,
    jugadorNombre: jugador.nombre,
    posicion: jugador.posicion,
    edad: jugador.edad,
    personalidad: jugador.personalidad,
    moral: jugador.moral,
    tienePromesaIncumplida: tienePromesa,
    mensajeProblema: obtenerMensajeProblema(jugador, tienePromesa),
    tipoProblem: tienePromesa ? 'promesa_incumplida' : 'moral_baja'
  };
};

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- ESTADOS DE LA PARTIDA ---
  const [equipos, setEquipos] = useState<Equipo[]>(() => {
    return equiposIniciales.map(e => ({
      ...e,
      formacion: e.formacion || '4-3-3',
      estiloJuego: e.estiloJuego || 'Equilibrado'
    }));
  });
  const [jugadores, setJugadores] = useState<Jugador[]>(() => {
    const playersWithTitular = jugadoresIniciales.map(j => ({
      ...j,
      titular: false,
      mesesContrato: j.mesesContrato !== undefined ? j.mesesContrato : Math.floor(Math.random() * 25) + 6
    }));
    const teamIds = Array.from(new Set(playersWithTitular.map(p => p.idEquipo)));
    teamIds.forEach(teamId => {
      const teamPlayers = playersWithTitular.filter(p => p.idEquipo === teamId);
      const sorted = [...teamPlayers].sort((a, b) => b.ca - a.ca);
      const starterIds = sorted.slice(0, 11).map(p => p.id);
      playersWithTitular.forEach(p => {
        if (p.idEquipo === teamId) {
          p.titular = starterIds.includes(p.id);
        }
      });
    });
    return playersWithTitular;
  });
  const [liga, setLiga] = useState<Liga>(ligaInicial);
  const [fechaActual, setFechaActual] = useState<string>('2026-07-01'); // Inicio de pretemporada
  const [equipoUsuarioId, setEquipoUsuarioId] = useState<string | null>(null);
  const [partidoReciente, setPartidoReciente] = useState<PartidoSimuladoDetalle | null>(null);
  const [mesesEnQuiebra, setMesesEnQuiebra] = useState<number>(0);
  const [confianzaDirectiva, setConfianzaDirectiva] = useState<number>(75);
  const [ruedaPrensaActiva, setRuedaPrensaActiva] = useState<RuedaPrensa | null>(null);
  const [derrotasConsecutivas, setDerrotasConsecutivas] = useState<number>(0);
  const [ofertaRecibidaActiva, setOfertaRecibidaActiva] = useState<OfertaRecibida | null>(null);
  const [fixture, setFixture] = useState<Jornada[]>(() => fixtureInicial);
  const [reporteAcademia, setReporteAcademia] = useState<AcademiaReporte | null>(null);
  const [partidoEnVivo, setPartidoEnVivo] = useState<{ local: Equipo; visitante: Equipo; jornada: Jornada; tipo?: 'liga' | 'copa'; grupoId?: string; partidoId?: string; subtipo?: 'champions' | 'europa'; clima?: 'Soleado' | 'Lluvia Torrencial' | 'Nieve' } | null>(null);
  const [charlaActiva, setCharlaActiva] = useState<CharlaJugador | null>(null);
  const [copaCampeones, setCopaCampeones] = useState<CopaCampeones | null>(() => {
    return inicializarCopa(equiposIniciales, '2026-08-17', 'champions');
  });
  const [copaEuropa, setCopaEuropa] = useState<CopaCampeones | null>(() => {
    return inicializarCopa(equiposIniciales, '2026-08-17', 'europa');
  });
  const [eventoActivo, setEventoActivo] = useState<EventoVestuario | null>(null);
  const [deadlineDayActivo, setDeadlineDayActivo] = useState<boolean>(false);
  const [horasDeadline, setHorasDeadline] = useState<number>(24);
  const [jugadoresAgentes, setJugadoresAgentes] = useState<JugadorAgente[]>([]);

  const [nombreManager, setNombreManager] = useState<string>('DT Mánager');
  const [reputacionManager, setReputacionManager] = useState<number>(50);
  const [historialTitulos, setHistorialTitulos] = useState<string[]>([]);
  const [juegoIniciado, setJuegoIniciado] = useState<boolean>(false);
  const [reunionPrivadaActiva, setReunionPrivadaActiva] = useState<ReunionPrivada | null>(null);
  const [sorteoCopaActivo, setSorteoCopaActivo] = useState<SorteoCopaActivo | null>(null);

  const [sorteoCampeonesGruposVisto, setSorteoCampeonesGruposVisto] = useState<boolean>(false);
  const [sorteoCampeonesCuartosVisto, setSorteoCampeonesCuartosVisto] = useState<boolean>(false);
  const [sorteoEuropaGruposVisto, setSorteoEuropaGruposVisto] = useState<boolean>(false);
  const [sorteoEuropaCuartosVisto, setSorteoEuropaCuartosVisto] = useState<boolean>(false);

  const [feedHinchada, setFeedHinchada] = useState<FanTweet[]>(() => [
    {
      id: 'tweet-init-1',
      avatar: '🦁',
      usuario: 'Termo de la Tribuna',
      handle: '@TermoDeLaTribuna',
      color: 'bg-orange-500',
      mensaje: '¡Arranca una nueva temporada! Con fe en que este año peleamos arriba. #VamosClub 💪🔥',
      likes: 142,
      retweets: 24,
      hashtag: '#VamosClub',
      tiempo: 'Hace 2h'
    },
    {
      id: 'tweet-init-2',
      avatar: '🧠',
      usuario: 'DT de Sillón',
      handle: '@DT_DeSillon',
      color: 'bg-blue-500',
      mensaje: 'A ver qué tácticas mete el mánager este año. Exigimos buen fútbol y refuerzos de calidad. #PasionFutbolera',
      likes: 98,
      retweets: 15,
      hashtag: '#PasionFutbolera',
      tiempo: 'Hace 3h'
    }
  ]);

  // Estado para las noticias de prensa del vestuario
  const [noticias, setNoticias] = useState<string[]>([
    '📰 Oficina de Prensa: ¡Te damos la bienvenida a tu nueva carrera! Planificá los entrenamientos y prepará tus fichajes en el mercado.'
  ]);

  // ============================================================
  // GENERAR FEED DE LA HINCHADA
  // ============================================================
  const generarFeedHinchada = useCallback((tipo: 'partido' | 'fichaje', datos: any) => {
    if (!equipoUsuarioId) return;

    const handles = ['@TermoDeLaTribuna', '@DT_DeSillon', '@Futbolero99', '@HinchaFiel', '@ScoutAnonimo', '@LaVozDelTablon', '@SentimientoFutbol', '@EstadioVacio'];
    const nombres = ['Termo de la Tribuna', 'DT de Sillón', 'Futbolero 99', 'Hincha Fiel', 'Scout Anónimo', 'La Voz del Tablón', 'Sentimiento Fútbol', 'Estadio Vacío'];
    const avatares = ['🦁', '⚽', '🕵️‍♂️', '🧠', '🔥', '📢', '🏟️', '⚡'];
    const colores = ['bg-orange-500', 'bg-blue-500', 'bg-emerald-500', 'bg-red-500', 'bg-indigo-500', 'bg-teal-500', 'bg-pink-500', 'bg-yellow-500'];

    const tweets: FanTweet[] = [];

    const getRndUser = () => {
      const idx = Math.floor(Math.random() * handles.length);
      return {
        handle: handles[idx],
        usuario: nombres[idx],
        avatar: avatares[idx],
        color: colores[idx]
      };
    };

    if (tipo === 'partido') {
      const { local, visitante, golesLocal, golesVisitante, eventos, clima } = datos;
      const esLocal = local.id === equipoUsuarioId;
      const miGoles = esLocal ? golesLocal : golesVisitante;
      const rivalGoles = esLocal ? golesVisitante : golesLocal;
      const rivalNombre = esLocal ? visitante.nombre : local.nombre;

      const gano = miGoles > rivalGoles;
      const empato = miGoles === rivalGoles;
      const perdio = miGoles < rivalGoles;

      const victoriaSobreLaHora = gano && eventos.some((evt: string) => {
        const match = evt.match(/Minuto (\d+)/);
        if (match) {
          const min = parseInt(match[1]);
          return min >= 85 && (evt.includes('GOL') || evt.includes('Gol'));
        }
        return false;
      });

      const miEquipoObj = esLocal ? local : visitante;
      const estiloDefensivo = miEquipoObj.estiloJuego === 'Defensivo' || miEquipoObj.formacion.startsWith('5');

      const hashtag = esLocal
        ? `#${local.nombreCorto.replace(/\s+/g, '')} vs #${visitante.nombreCorto.replace(/\s+/g, '')}`
        : `#${visitante.nombreCorto.replace(/\s+/g, '')} vs #${local.nombreCorto.replace(/\s+/g, '')}`;

      if (victoriaSobreLaHora) {
        tweets.push({
          id: `tweet-match-${Date.now()}-1`,
          ...getRndUser(),
          mensaje: `¡Qué locura de equipo! No apto para cardíacos. Qué huevos para ganarlo sobre la hora, metan a los titulares siempre 🤩🔥 ${hashtag}`,
          likes: Math.floor(Math.random() * 500) + 200,
          retweets: Math.floor(Math.random() * 150) + 50,
          hashtag,
          tiempo: 'Hace 1 min'
        });
      } else if (perdio && estiloDefensivo) {
        tweets.push({
          id: `tweet-match-${Date.now()}-1`,
          ...getRndUser(),
          mensaje: `Qué planteo cagón metió el mánager hoy. Jugamos como equipo chico, renunciá ya. ${hashtag} #FueraDT`,
          likes: Math.floor(Math.random() * 400) + 150,
          retweets: Math.floor(Math.random() * 100) + 30,
          hashtag: '#FueraDT',
          tiempo: 'Hace 1 min'
        });
      } else if (gano) {
        tweets.push({
          id: `tweet-match-${Date.now()}-1`,
          ...getRndUser(),
          mensaje: `Gran triunfo contra ${rivalNombre}. Así se juega, paso a paso demostrando quién manda. Excelente planteo táctico! ${hashtag}`,
          likes: Math.floor(Math.random() * 300) + 100,
          retweets: Math.floor(Math.random() * 60) + 10,
          hashtag,
          tiempo: 'Hace 1 min'
        });
      } else if (perdio) {
        tweets.push({
          id: `tweet-match-${Date.now()}-1`,
          ...getRndUser(),
          mensaje: `No te puede ganar ${rivalNombre} de esa manera... Hay jugadores que no sienten la camiseta. A levantar cabeza la próxima semana. ${hashtag}`,
          likes: Math.floor(Math.random() * 250) + 80,
          retweets: Math.floor(Math.random() * 50) + 15,
          hashtag,
          tiempo: 'Hace 1 min'
        });
      } else {
        tweets.push({
          id: `tweet-match-${Date.now()}-1`,
          ...getRndUser(),
          mensaje: `Partido trabado hoy. Un punto sirve, pero hay que arriesgar un poco más de locales. Bien luchado igual. ${hashtag}`,
          likes: Math.floor(Math.random() * 150) + 30,
          retweets: Math.floor(Math.random() * 20) + 5,
          hashtag,
          tiempo: 'Hace 1 min'
        });
      }

      const tweetsAdicionalesPartidos = [
        `¡Qué bien está rindiendo la química del vestuario últimamente! Se nota la cohesión. #VamosClub`,
        `¿Alguien vio la taquilla de hoy? El estadio estaba explotado. Qué lindo es ser hincha de este club. #Pasion`,
        `Hay que afilar la definición para el próximo encuentro. Generamos mucho pero concretamos poco. ${hashtag}`,
        `Buen partido del equipo en líneas generales, a seguir sumando. El mánager la tiene clara. #Futbol`
      ];

      const shuffled = tweetsAdicionalesPartidos.sort(() => Math.random() - 0.5);
      tweets.push({
        id: `tweet-match-${Date.now()}-2`,
        ...getRndUser(),
        mensaje: shuffled[0],
        likes: Math.floor(Math.random() * 100) + 20,
        retweets: Math.floor(Math.random() * 30) + 2,
        hashtag: '#VamosClub',
        tiempo: 'Hace 2 min'
      });
      tweets.push({
        id: `tweet-match-${Date.now()}-3`,
        ...getRndUser(),
        mensaje: shuffled[1],
        likes: Math.floor(Math.random() * 80) + 15,
        retweets: Math.floor(Math.random() * 20) + 1,
        hashtag: '#Pasion',
        tiempo: 'Hace 3 min'
      });
    } else if (tipo === 'fichaje') {
      const { jugador } = datos;
      const esNewgen = jugador.id.startsWith('newgen-') || jugador.id.startsWith('agente-');
      const nombre = jugador.nombre;
      const valor = jugador.valorMercado;

      const formatVal = (v: number) => {
        if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
        return `${(v / 1e3).toFixed(0)}k`;
      };

      if (esNewgen) {
        tweets.push({
          id: `tweet-signing-${Date.now()}-1`,
          ...getRndUser(),
          mensaje: `@ScoutAnonimo: Ojo con el pibe ${nombre} que compramos, tiene cositas de crack. Proyecto a futuro total! #Fichaje #Newgen`,
          likes: Math.floor(Math.random() * 600) + 250,
          retweets: Math.floor(Math.random() * 180) + 40,
          hashtag: '#Newgen',
          tiempo: 'Hace 1 min'
        });
      } else {
        tweets.push({
          id: `tweet-signing-${Date.now()}-1`,
          ...getRndUser(),
          mensaje: `¡Qué gran incorporación la de ${nombre}! Refuerzo clave para lo que se viene. La directiva gastó fuerte pero vale cada euro. #Fichaje #Refuerzo`,
          likes: Math.floor(Math.random() * 450) + 150,
          retweets: Math.floor(Math.random() * 100) + 25,
          hashtag: '#Refuerzo',
          tiempo: 'Hace 1 min'
        });
      }

      tweets.push({
        id: `tweet-signing-${Date.now()}-2`,
        ...getRndUser(),
        mensaje: `Bienvenido ${nombre} al club más grande del país! A dejar la vida en la cancha y a sudar la camiseta. #VamosClub`,
        likes: Math.floor(Math.random() * 300) + 50,
        retweets: Math.floor(Math.random() * 50) + 8,
        hashtag: '#VamosClub',
        tiempo: 'Hace 3 min'
      });
      tweets.push({
        id: `tweet-signing-${Date.now()}-3`,
        ...getRndUser(),
        color: 'bg-teal-600',
        usuario: 'Scout Anónimo',
        handle: '@ScoutAnonimo',
        avatar: '🕵️‍♂️',
        mensaje: `Analizando los números de ${nombre}: CA ${jugador.ca}, PA ${jugador.pa}. Una apuesta de ${formatVal(valor)}€ que puede salir muy bien si tiene continuidad. #Scouting`,
        likes: Math.floor(Math.random() * 200) + 40,
        retweets: Math.floor(Math.random() * 60) + 12,
        hashtag: '#Scouting',
        tiempo: 'Hace 5 min'
      });
    }

    setFeedHinchada(tweets);
  }, [equipoUsuarioId]);

  // Derivado: Datos completos del equipo del usuario
  const equipoUsuario = equipos.find(e => e.id === equipoUsuarioId) || null;

  const obtenerJornadaCopaHoy = useCallback((fecha: string, copa: CopaCampeones | null): { tipo: 'grupos' | 'cuartos' | 'semifinales' | 'final'; matchdays: { fecha: string; partidos: PartidoCopa[]; grupoId?: string }[] } | null => {
    if (!copa) return null;
    if (copa.faseActual === 'grupos') {
      const matchdays = copa.partidosGrupos.filter(jg => jg.fecha === fecha);
      if (matchdays.length > 0 && matchdays.some(jg => jg.partidos.some(p => !p.jugado))) {
        return { tipo: 'grupos', matchdays };
      }
    } else if (copa.faseActual === 'cuartos') {
      const q = copa.cuartos;
      if (q && q.fecha === fecha && q.partidos.some(p => !p.jugado)) {
        return { tipo: 'cuartos', matchdays: [q] };
      }
    } else if (copa.faseActual === 'semifinales') {
      const semi = copa.semifinales;
      if (semi && semi.fecha === fecha && semi.partidos.some(p => !p.jugado)) {
        return { tipo: 'semifinales', matchdays: [semi] };
      }
    } else if (copa.faseActual === 'final') {
      const fin = copa.final;
      if (fin && fin.fecha === fecha && !fin.partido.jugado) {
        return { tipo: 'final', matchdays: [{ fecha, partidos: [fin.partido] }] };
      }
    }
    return null;
  }, []);

  const procesarTransicionCopa = useCallback((copa: CopaCampeones, tipo: 'champions' | 'europa'): CopaCampeones => {
    const copiaCopa = { ...copa };
    const label = tipo === 'champions' ? 'Copa de Campeones' : 'Copa Continental';

    if (copiaCopa.faseActual === 'grupos') {
      const totalJugados = copiaCopa.partidosGrupos.reduce((sum, jg) => sum + jg.partidos.filter(p => p.jugado).length, 0);
      if (totalJugados === 48) {
        const winners: Record<string, string> = {};
        const runnersUp: Record<string, string> = {};

        copiaCopa.grupos.forEach(grupo => {
          const tablaOrdenada = [...grupo.tabla].sort((a, b) => {
            if (b.puntos !== a.puntos) return b.puntos - a.puntos;
            if (b.diferenciaGoles !== a.diferenciaGoles) return b.diferenciaGoles - a.diferenciaGoles;
            return b.golesFavor - a.golesFavor;
          });
          winners[grupo.id] = tablaOrdenada[0].idEquipo;
          runnersUp[grupo.id] = tablaOrdenada[1].idEquipo;
        });

        const wA = winners['A'];
        const rA = runnersUp['A'];
        const wB = winners['B'];
        const rB = runnersUp['B'];
        const wC = winners['C'];
        const rC = runnersUp['C'];
        const wD = winners['D'];
        const rD = runnersUp['D'];

        const fechaRound6 = copiaCopa.partidosGrupos.find(jg => jg.jornada === 6)!.fecha;
        const fechaCuartos = sumarDias(fechaRound6, 21);

        copiaCopa.cuartos = {
          fecha: fechaCuartos,
          partidos: [
            { id: `copa-${tipo}-cuartos-1`, localId: wA, visitanteId: rB, jugado: false },
            { id: `copa-${tipo}-cuartos-2`, localId: wB, visitanteId: rA, jugado: false },
            { id: `copa-${tipo}-cuartos-3`, localId: wC, visitanteId: rD, jugado: false },
            { id: `copa-${tipo}-cuartos-4`, localId: wD, visitanteId: rC, jugado: false }
          ]
        };
        copiaCopa.faseActual = 'cuartos';

        const nameWA = equipos.find(e => e.id === wA)?.nombre || wA;
        const nameRB = equipos.find(e => e.id === rB)?.nombre || rB;
        const nameWB = equipos.find(e => e.id === wB)?.nombre || wB;
        const nameRA = equipos.find(e => e.id === rA)?.nombre || rA;
        const nameWC = equipos.find(e => e.id === wC)?.nombre || wC;
        const nameRD = equipos.find(e => e.id === rD)?.nombre || rD;
        const nameWD = equipos.find(e => e.id === wD)?.nombre || wD;
        const nameRC = equipos.find(e => e.id === rC)?.nombre || rC;

        setNoticias(prev => [
          `🏆 [${label}] ¡Definidos los Cuartos de Final! Cruces: ${nameWA} vs ${nameRB}, ${nameWB} vs ${nameRA}, ${nameWC} vs ${nameRD}, y ${nameWD} vs ${nameRC}. Programados para el ${fechaCuartos}.`,
          ...prev
        ]);
      }
    } else if (copiaCopa.faseActual === 'cuartos') {
      if (copiaCopa.cuartos && copiaCopa.cuartos.partidos.every(p => p.jugado)) {
        const q1 = copiaCopa.cuartos.partidos[0];
        const q2 = copiaCopa.cuartos.partidos[1];
        const q3 = copiaCopa.cuartos.partidos[2];
        const q4 = copiaCopa.cuartos.partidos[3];

        const obtenerGanador = (p: PartidoCopa): string => {
          if (p.golesLocal! > p.golesVisitante!) return p.localId;
          if (p.golesLocal! < p.golesVisitante!) return p.visitanteId;
          if (p.penalesLocal! > p.penalesVisitante!) return p.localId;
          return p.visitanteId;
        };

        const wQ1 = obtenerGanador(q1);
        const wQ2 = obtenerGanador(q2);
        const wQ3 = obtenerGanador(q3);
        const wQ4 = obtenerGanador(q4);

        const fechaCuartos = copiaCopa.cuartos.fecha;
        const fechaSemi = sumarDias(fechaCuartos, 21);

        copiaCopa.semifinales = {
          fecha: fechaSemi,
          partidos: [
            { id: `copa-${tipo}-semi-1`, localId: wQ1, visitanteId: wQ3, jugado: false },
            { id: `copa-${tipo}-semi-2`, localId: wQ2, visitanteId: wQ4, jugado: false }
          ]
        };
        copiaCopa.faseActual = 'semifinales';

        const nameQ1 = equipos.find(e => e.id === wQ1)?.nombre || wQ1;
        const nameQ3 = equipos.find(e => e.id === wQ3)?.nombre || wQ3;
        const nameQ2 = equipos.find(e => e.id === wQ2)?.nombre || wQ2;
        const nameQ4 = equipos.find(e => e.id === wQ4)?.nombre || wQ4;

        setNoticias(prev => [
          `🏆 [${label}] ¡Definidas las Semifinales! Cruces: ${nameQ1} vs ${nameQ3} y ${nameQ2} vs ${nameQ4}. Programados para el ${fechaSemi}.`,
          ...prev
        ]);
      }
    } else if (copiaCopa.faseActual === 'semifinales') {
      if (copiaCopa.semifinales && copiaCopa.semifinales.partidos.every(p => p.jugado)) {
        const s1 = copiaCopa.semifinales.partidos[0];
        const s2 = copiaCopa.semifinales.partidos[1];

        const obtenerGanador = (p: PartidoCopa): string => {
          if (p.golesLocal! > p.golesVisitante!) return p.localId;
          if (p.golesLocal! < p.golesVisitante!) return p.visitanteId;
          if (p.penalesLocal! > p.penalesVisitante!) return p.localId;
          return p.visitanteId;
        };

        const wSemi1 = obtenerGanador(s1);
        const wSemi2 = obtenerGanador(s2);

        const fechaSemi = copiaCopa.semifinales.fecha;
        const fechaFinal = sumarDias(fechaSemi, 14);

        copiaCopa.final = {
          fecha: fechaFinal,
          partido: { id: `copa-${tipo}-final`, localId: wSemi1, visitanteId: wSemi2, jugado: false }
        };
        copiaCopa.faseActual = 'final';

        const nameSemi1 = equipos.find(e => e.id === wSemi1)?.nombre || wSemi1;
        const nameSemi2 = equipos.find(e => e.id === wSemi2)?.nombre || wSemi2;

        setNoticias(prev => [
          `🏆 [${label}] ¡Llegó la Gran Final! Se enfrentarán ${nameSemi1} vs ${nameSemi2} el día ${fechaFinal}.`,
          ...prev
        ]);
      }
    } else if (copiaCopa.faseActual === 'final') {
      if (copiaCopa.final && copiaCopa.final.partido.jugado) {
        const p = copiaCopa.final.partido;
        const obtenerGanador = (partido: PartidoCopa): string => {
          if (partido.golesLocal! > partido.golesVisitante!) return partido.localId;
          if (partido.golesLocal! < partido.golesVisitante!) return partido.visitanteId;
          if (partido.penalesLocal! > partido.penalesVisitante!) return partido.localId;
          return partido.visitanteId;
        };
        const campeonId = obtenerGanador(p);
        copiaCopa.campeon = campeonId;
        copiaCopa.faseActual = 'finalizada';

        const nameCampeon = equipos.find(e => e.id === campeonId)?.nombre || campeonId;

        setNoticias(prev => [
          `🏆 [${label}] ¡HISTÓRICO! El ${nameCampeon} se corona campeón de la ${label}. ¡Felicidades!`,
          ...prev
        ]);
      }
    }
    return copiaCopa;
  }, [equipos]);

  // --- ACCIONES ---

  // Seleccionar club para dirigir
  const seleccionarEquipo = useCallback((equipoId: string, nombreManagerInput?: string) => {
    setEquipoUsuarioId(equipoId);
    if (nombreManagerInput) {
      setNombreManager(nombreManagerInput);
    }
    setJuegoIniciado(true);

    // Sincronizar liga y fixture según el país del equipo seleccionado
    let leagueId = 'la-liga';
    let leagueName = 'La Liga EA Sports';
    let leagueCountry = 'España';
    let leagueTeams = equiposLaLiga;

    if (equiposPremier.some(e => e.id === equipoId)) {
      leagueId = 'premier-league';
      leagueName = 'Premier League';
      leagueCountry = 'Inglaterra';
      leagueTeams = equiposPremier;
    } else if (equiposSerieA.some(e => e.id === equipoId)) {
      leagueId = 'rose-a'; // Note: actually 'serie-a' is correct but let's follow the standard
      leagueId = 'serie-a';
      leagueName = 'Serie A';
      leagueCountry = 'Italia';
      leagueTeams = equiposSerieA;
    } else if (equiposBundesliga.some(e => e.id === equipoId)) {
      leagueId = 'bundesliga';
      leagueName = 'Bundesliga';
      leagueCountry = 'Alemania';
      leagueTeams = equiposBundesliga;
    }

    const newTabla: TablaEquipo[] = leagueTeams.map(e => ({
      idEquipo: e.id,
      nombreEquipo: e.nombre,
      partidosJugados: 0,
      ganados: 0,
      empatados: 0,
      perdidos: 0,
      golesFavor: 0,
      golesContra: 0,
      diferenciaGoles: 0,
      puntos: 0,
      forma: []
    }));

    setLiga({
      id: leagueId,
      nombre: leagueName,
      pais: leagueCountry,
      temporada: '2026/2027',
      equipos: leagueTeams,
      tabla: newTabla
    });

    const newFixture = generarFixtureRoundRobin(
      leagueTeams.map(e => e.id),
      '2026-08-17'
    );
    setFixture(newFixture);
  }, []);

  // Limpiar el historial de noticias
  const limpiarNoticias = useCallback(() => {
    setNoticias([]);
  }, []);

  // Procesar finanzas semanales al finalizar cada semana (lunes)
  const procesarFinanzasSemanales = useCallback((nuevosJugadores: Jugador[], nuevasNoticias: string[]) => {
    if (!equipoUsuarioId) return;

    setEquipos(prevEquipos => {
      const clubIndex = prevEquipos.findIndex(e => e.id === equipoUsuarioId);
      if (clubIndex === -1) return prevEquipos;

      const club = prevEquipos[clubIndex];
      // Egresos: Sueldos semanales del plantel
      const plantelUsuario = nuevosJugadores.filter(j => j.idEquipo === equipoUsuarioId);
      const egresosSueldos = plantelUsuario.reduce((sum, j) => sum + j.salarioSemanal, 0);

      // Ingresos: Sponsors semanales = (Reputación * 150000) / 4
      const ingresosSponsors = Math.round((club.reputacion * 150000) / 4);
      const totalIngresos = ingresosSponsors;

      const balanceSemanal = totalIngresos - egresosSueldos;
      const nuevoPresupuesto = club.presupuestoFichajes + balanceSemanal;

      // Generar noticia
      const formatearEuros = (val: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);
      };
      const balanceTexto = balanceSemanal >= 0
        ? `🟢 Superávit de ${formatearEuros(balanceSemanal)}`
        : `🔴 Déficit de ${formatearEuros(Math.abs(balanceSemanal))}`;

      const quiebraAlerta = nuevoPresupuesto < 0
        ? ` ⚠️ ¡ALERTA FINANCIERA! Presupuesto en negativo. Evitá terminar el mes en quiebra para no ser despedido.`
        : '';

      nuevasNoticias.unshift(
        `📊 [Balance Financiero Semanal] Sponsors: +${formatearEuros(ingresosSponsors)} | Sueldos Plantel: -${formatearEuros(egresosSueldos)} | Resultado: ${balanceTexto}.${quiebraAlerta}`
      );

      const nuevosEquipos = [...prevEquipos];
      nuevosEquipos[clubIndex] = {
        ...club,
        presupuestoFichajes: nuevoPresupuesto
      };
      return nuevosEquipos;
    });
  }, [equipoUsuarioId]);

  // Intentar generar oferta de transferencia por parte de la IA
  const intentarGenerarOfertaIA = useCallback((nuevaFecha: string, actualesJugadores: Jugador[]): OfertaRecibida | null => {
    if (!equipoUsuarioId) return null;

    // Verificar si es periodo de pases (Julio [6], Agosto [7], Enero [0])
    const dateObj = new Date(nuevaFecha + 'T12:00:00');
    const mes = dateObj.getMonth();
    const esPeriodoFichajes = mes === 6 || mes === 7 || mes === 0;

    if (!esPeriodoFichajes) return null;

    // Filtrar jugadores del usuario
    const plantelUsuario = actualesJugadores.filter(j => j.idEquipo === equipoUsuarioId);
    if (plantelUsuario.length === 0) return null;

    // Rastrear si hay un jugador con transferidoForzado
    const forzado = plantelUsuario.find(j => j.transferidoForzado === true);

    // Si no hay jugador forzado, aplicamos probabilidad normal (15%)
    if (!forzado && Math.random() >= 0.15) return null;

    // Seleccionar el jugador (jamás a un jugador marcado como intransferible por el DT)
    const jugadorElegido = forzado ? forzado : (() => {
      // Excluir jugadores protegidos manualmente
      const plantelDisponible = plantelUsuario.filter(j => !j.intransferible);
      if (plantelDisponible.length === 0) return null;
      // Priorizar estrellas: ordenar por CA descendente y tomar top 60%
      const plantelOrdenado = [...plantelDisponible].sort((a, b) => b.ca - a.ca);
      const limiteTop = Math.max(1, Math.ceil(plantelOrdenado.length * 0.6));
      const plantelTop = plantelOrdenado.slice(0, limiteTop);
      return plantelTop[Math.floor(Math.random() * plantelTop.length)];
    })();

    // Si fue forzado, limpiar el flag
    if (forzado) {
      setTimeout(() => {
        setJugadores(prev => prev.map(j => j.id === forzado.id ? { ...j, transferidoForzado: false } : j));
      }, 0);
    }

    // Si todos los jugadores están protegidos, no hay candidatos
    if (!jugadorElegido) return null;

    // Elegir club comprador IA al azar
    const clubsIA = equipos.filter(e => e.id !== equipoUsuarioId);
    if (clubsIA.length === 0) return null;
    const clubComprador = clubsIA[Math.floor(Math.random() * clubsIA.length)];

    // Calcular multiplicador y oferta
    const factorReputacion = clubComprador.reputacion / 100;
    const multiplicador = Number((0.9 + factorReputacion * 0.3 + Math.random() * 0.2).toFixed(2));
    const montoOfrecido = Math.round(jugadorElegido.valorMercado * multiplicador);

    const oferta: OfertaRecibida = {
      id: Math.random().toString(36).substr(2, 9),
      jugadorId: jugadorElegido.id,
      jugadorNombre: jugadorElegido.nombre,
      jugadorValorMercado: jugadorElegido.valorMercado,
      clubCompradorId: clubComprador.id,
      clubCompradorNombre: clubComprador.nombre,
      clubCompradorEscudo: clubComprador.escudo,
      clubCompradorReputacion: clubComprador.reputacion,
      montoOfrecido,
      multiplicador
    };

    return oferta;
  }, [equipoUsuarioId, equipos]);

  // Ejecutar scouting e inteligencia artificial de fichajes de la CPU (CPU-to-CPU)
  const procesarMercadoFichajesIA = useCallback((fechaParaAnalizar: string, actualesJugadores: Jugador[], actualesEquipos: Equipo[]) => {
    // 1. Verificar si es período de pases (Julio [6], Agosto [7], Enero [0])
    const dateObj = new Date(fechaParaAnalizar + 'T12:00:00');
    const mes = dateObj.getMonth();
    const esPeriodoFichajes = mes === 6 || mes === 7 || mes === 0;
    if (!esPeriodoFichajes) return { nuevosJugadores: actualesJugadores, nuevosEquipos: actualesEquipos, nuevasNoticiasTransfer: [] };

    // Obtener los clubes de la IA (excluir el club del usuario)
    const clubesIA = actualesEquipos.filter(e => e.id !== equipoUsuarioId);
    if (clubesIA.length === 0) return { nuevosJugadores: actualesJugadores, nuevosEquipos: actualesEquipos, nuevasNoticiasTransfer: [] };

    const categorizarPosicionLocal = (pos: string): 'DEF' | 'MED' | 'DEL' | 'POR' => {
      if (pos === 'POR') return 'POR';
      if (['DFC', 'LD', 'LI'].includes(pos)) return 'DEF';
      if (['MC', 'MCO'].includes(pos)) return 'MED';
      return 'DEL';
    };

    let nuevosJugadores = [...actualesJugadores];
    let nuevosEquipos = [...actualesEquipos];
    const nuevasNoticiasTransfer: string[] = [];

    // Iteramos por cada club IA
    clubesIA.forEach(club => {
      // 2. Probabilidad del 3% diario para que este club intente un fichaje
      if (Math.random() > 0.03) return;

      const clubActualizado = nuevosEquipos.find(e => e.id === club.id)!;
      const clubPlayers = nuevosJugadores.filter(j => j.idEquipo === club.id);
      if (clubPlayers.length === 0) return;

      // --- A. ANÁLISIS DE PLANTEL (Prioridades) ---
      const posicionesPosibles: Posicion[] = ['POR', 'DFC', 'LD', 'LI', 'MC', 'MCO', 'ED', 'EI', 'DC'];
      const prioridades: Posicion[] = [];

      // 1. Déficit Numérico (menos de 2 jugadores en el puesto)
      posicionesPosibles.forEach(pos => {
        const count = clubPlayers.filter(j => j.posicion === pos).length;
        if (count < 2) {
          prioridades.push(pos);
        }
      });

      // 2. Deficiencia de Calidad en Línea (promedio de CA < reputación del club)
      const defPlayers = clubPlayers.filter(j => ['DFC', 'LD', 'LI'].includes(j.posicion));
      const medPlayers = clubPlayers.filter(j => ['MC', 'MCO'].includes(j.posicion));
      const delPlayers = clubPlayers.filter(j => ['ED', 'EI', 'DC'].includes(j.posicion));

      const calcPromedioCA = (players: Jugador[]) => {
        if (players.length === 0) return 0;
        const totalCA = players.reduce((sum, p) => sum + p.ca, 0);
        return totalCA / players.length;
      };

      const reputacionClub = clubActualizado.reputacion;

      if (defPlayers.length > 0 && calcPromedioCA(defPlayers) < reputacionClub) {
        ['DFC', 'LD', 'LI'].forEach(pos => {
          if (!prioridades.includes(pos as Posicion)) prioridades.push(pos as Posicion);
        });
      }
      if (medPlayers.length > 0 && calcPromedioCA(medPlayers) < reputacionClub) {
        ['MC', 'MCO'].forEach(pos => {
          if (!prioridades.includes(pos as Posicion)) prioridades.push(pos as Posicion);
        });
      }
      if (delPlayers.length > 0 && calcPromedioCA(delPlayers) < reputacionClub) {
        ['ED', 'EI', 'DC'].forEach(pos => {
          if (!prioridades.includes(pos as Posicion)) prioridades.push(pos as Posicion);
        });
      }

      if (prioridades.length === 0) return;

      // Elegir una posición prioritaria al azar
      const posicionObjetivo = prioridades[Math.floor(Math.random() * prioridades.length)];

      // --- B. BÚSQUEDA Y SCOUTING ---
      // Filtrar candidatos del mercado global (que pertenecen a OTRO club IA y no están lesionados)
      let candidatos = nuevosJugadores.filter(j =>
        j.idEquipo !== club.id &&
        j.idEquipo !== equipoUsuarioId &&
        j.posicion === posicionObjetivo &&
        !j.lesionado
      );

      // Limitar por presupuesto del club comprador
      candidatos = candidatos.filter(j => j.valorMercado <= clubActualizado.presupuestoFichajes);
      if (candidatos.length === 0) return;

      // Ordenar por CA descendente para tomar el mejor asequible
      candidatos.sort((a, b) => b.ca - a.ca);
      const candidatoElegido = candidatos[0];

      // --- C. NEGOCIACIÓN DE TRANSFERENCIA ---
      const clubVendedor = nuevosEquipos.find(e => e.id === candidatoElegido.idEquipo)!;
      const vendedorPlayersEnPuesto = nuevosJugadores.filter(j =>
        j.idEquipo === clubVendedor.id &&
        j.posicion === posicionObjetivo
      );

      // El vendedor acepta si la oferta es razonable Y le quedan al menos 2 jugadores en ese puesto
      if (vendedorPlayersEnPuesto.length >= 2) {
        // Oferta económica realista con un multiplicador entre 1.0x y 1.15x
        const multiplicador = 1.0 + Math.random() * 0.15;
        const precioTraspaso = Math.round(candidatoElegido.valorMercado * multiplicador);

        if (clubActualizado.presupuestoFichajes >= precioTraspaso) {
          // --- REALIZAR TRASPASO EN SEGUNDO PLANO ---
          // 1. Actualizar presupuestos de fichajes de ambos clubes
          nuevosEquipos = nuevosEquipos.map(e => {
            if (e.id === clubActualizado.id) {
              return { ...e, presupuestoFichajes: e.presupuestoFichajes - precioTraspaso };
            }
            if (e.id === clubVendedor.id) {
              return { ...e, presupuestoFichajes: e.presupuestoFichajes + precioTraspaso };
            }
            return e;
          });

          // 2. Traspasar la ficha del jugador
          nuevosJugadores = nuevosJugadores.map(j => {
            if (j.id === candidatoElegido.id) {
              return {
                ...j,
                idEquipo: clubActualizado.id,
                titular: false,
                posicionTactica: null
              };
            }
            return j;
          });

          // 3. Generar la noticia en el portal de prensa
          const montoFormateado = formatearMoneda(precioTraspaso);
          nuevasNoticiasTransfer.push(
            `💸 [BOMBAZO] El ${clubActualizado.nombre} ha fichado a ${candidatoElegido.nombre} del ${clubVendedor.nombre} por ${montoFormateado}.`
          );
        }
      }
    });

    return { nuevosJugadores, nuevosEquipos, nuevasNoticiasTransfer };
  }, [equipoUsuarioId]);

  const simularTandaPenales = (): { penLocal: number; penVisitante: number } => {
    let penLocal = 0;
    let penVisitante = 0;
    let ronda = 1;
    while (true) {
      const localAcierta = Math.random() < 0.75;
      const visitanteAcierta = Math.random() < 0.75;

      if (localAcierta) penLocal++;
      if (visitanteAcierta) penVisitante++;

      if (ronda >= 5) {
        if (penLocal !== penVisitante) {
          break;
        }
      }
      ronda++;
      if (ronda > 15) {
        if (Math.random() < 0.5) penLocal++; else penVisitante++;
        break;
      }
    }
    return { penLocal, penVisitante };
  };

  const simularPartidosCopaEnFondo = (
    copa: CopaCampeones,
    partidos: PartidoCopa[],
    tipo: 'champions' | 'europa',
    grupoId?: string
  ): { updatedCopa: CopaCampeones; noticiasCopa: string[]; recaudaciones: Record<string, number> } => {
    const copiaCopa = { ...copa };
    const noticiasCopa: string[] = [];
    const recaudaciones: Record<string, number> = {};
    const cupLabel = tipo === 'champions' ? 'Copa de Campeones' : 'Copa Continental';

    partidos.forEach(p => {
      if (p.jugado) return;

      const lObj = equipos.find(e => e.id === p.localId)!;
      const vObj = equipos.find(e => e.id === p.visitanteId)!;
      const res = simularPartido(lObj, vObj, jugadores);

      p.golesLocal = res.golesLocal;
      p.golesVisitante = res.golesVisitante;
      p.jugado = true;
      p.eventos = res.eventos;

      // Calcular taquilla para el equipo local
      const { recaudacion } = calcularRecaudacionTaquilla(lObj);
      recaudaciones[p.localId] = (recaudaciones[p.localId] || 0) + recaudacion;

      if (copiaCopa.faseActual !== 'grupos' && res.golesLocal === res.golesVisitante) {
        const { penLocal, penVisitante } = simularTandaPenales();
        p.penalesLocal = penLocal;
        p.penalesVisitante = penVisitante;
        p.eventos.push(`🏆 [Definición por Penales] ${lObj.nombreCorto} (${penLocal}) - (${penVisitante}) ${vObj.nombreCorto}.`);
        noticiasCopa.push(
          `🏆 [${cupLabel}] ${lObj.nombre} avanzó tras vencer a ${vObj.nombre} en la tanda de penales por (${penLocal}-${penVisitante}) luego de empatar ${res.golesLocal}-${res.golesVisitante} en los 90 minutos.`
        );
      } else {
        noticiasCopa.push(
          `🏆 [${cupLabel}] ${lObj.nombre} ${res.golesLocal} - ${res.golesVisitante} ${vObj.nombre}.`
        );
      }

      if (copiaCopa.faseActual === 'grupos' && grupoId) {
        const grupo = copiaCopa.grupos.find(g => g.id === grupoId)!;
        const tLocal = grupo.tabla.find(t => t.idEquipo === p.localId)!;
        const tVisitante = grupo.tabla.find(t => t.idEquipo === p.visitanteId)!;

        tLocal.partidosJugados++;
        tLocal.golesFavor += res.golesLocal;
        tLocal.golesContra += res.golesVisitante;
        tLocal.diferenciaGoles = tLocal.golesFavor - tLocal.golesContra;

        tVisitante.partidosJugados++;
        tVisitante.golesFavor += res.golesVisitante;
        tVisitante.golesContra += res.golesLocal;
        tVisitante.diferenciaGoles = tVisitante.golesFavor - tVisitante.golesContra;

        if (res.golesLocal > res.golesVisitante) {
          tLocal.ganados++;
          tLocal.puntos += 3;
          tVisitante.perdidos++;
        } else if (res.golesLocal === res.golesVisitante) {
          tLocal.empatados++;
          tLocal.puntos += 1;
          tVisitante.empatados++;
          tVisitante.puntos += 1;
        } else {
          tVisitante.ganados++;
          tVisitante.puntos += 3;
          tLocal.perdidos++;
        }
      }
    });

    return { updatedCopa: copiaCopa, noticiasCopa, recaudaciones };
  };

  // Avanzar al día siguiente e implementar el descanso físico / simulación de partidos
  const avanzarDia = useCallback(() => {
    // Interceptor: Reuniones Privadas en la Oficina
    if (equipoUsuarioId && !eventoActivo) {
      if (reunionPrivadaActiva) return;
      const meeting = generarReunionPrivada(jugadores, equipoUsuarioId);
      if (meeting) {
        setReunionPrivadaActiva(meeting);
        setNoticias(prev => [
          `🚪 [Oficina del Mánager] ${meeting.jugadorNombre} está esperando en tu oficina para hablar. Debes atenderlo antes de continuar.`,
          ...prev
        ]);
        return;
      }
    }

    // Interceptor de Sorteo Copa de Campeones (Fase de Grupos)
    if (copaCampeones && copaCampeones.faseActual === 'grupos' && !sorteoCampeonesGruposVisto) {
      const date = new Date(fechaActual + 'T12:00:00');
      if (date.getMonth() === 7 && date.getDate() >= 15) {
        setSorteoCopaActivo({
          tipo: 'champions',
          fase: 'grupos',
          copa: copaCampeones,
          participantes: copaCampeones.participantes
        });
        setNoticias(prev => [
          "🏆 [UEFA Gala] Comienza la ceremonia del sorteo de la Copa de Campeones de la UEFA. El fixture de grupos quedará definido a continuación.",
          ...prev
        ]);
        return;
      }
    }

    // Interceptor de Sorteo Copa Europa (Fase de Grupos)
    if (copaEuropa && copaEuropa.faseActual === 'grupos' && sorteoCampeonesGruposVisto && !sorteoEuropaGruposVisto) {
      const date = new Date(fechaActual + 'T12:00:00');
      if (date.getMonth() === 7 && date.getDate() >= 15) {
        setSorteoCopaActivo({
          tipo: 'europa',
          fase: 'grupos',
          copa: copaEuropa,
          participantes: copaEuropa.participantes
        });
        setNoticias(prev => [
          "🏆 [UEFA Gala] Comienza la ceremonia del sorteo de la Copa Europa. El fixture de grupos quedará definido a continuación.",
          ...prev
        ]);
        return;
      }
    }

    // Interceptor de Sorteo Copa de Campeones (Fase de Cuartos)
    if (copaCampeones && copaCampeones.faseActual === 'cuartos' && !sorteoCampeonesCuartosVisto) {
      const winners: string[] = [];
      const runners: string[] = [];
      copaCampeones.grupos.forEach(grupo => {
        const sorted = [...grupo.tabla].sort((a, b) => {
          if (b.puntos !== a.puntos) return b.puntos - a.puntos;
          if (b.diferenciaGoles !== a.diferenciaGoles) return b.diferenciaGoles - a.diferenciaGoles;
          return b.golesFavor - a.golesFavor;
        });
        winners.push(sorted[0].idEquipo);
        runners.push(sorted[1].idEquipo);
      });
      setSorteoCopaActivo({
        tipo: 'champions',
        fase: 'cuartos',
        copa: copaCampeones,
        participantes: [...winners, ...runners]
      });
      setNoticias(prev => [
        "🏆 [UEFA Gala] Definida la fase de grupos. Comienza el sorteo de los Cuartos de Final de la Copa de Campeones.",
        ...prev
      ]);
      return;
    }

    // Interceptor de Sorteo Copa Europa (Fase de Cuartos)
    if (copaEuropa && copaEuropa.faseActual === 'cuartos' && sorteoCampeonesCuartosVisto && !sorteoEuropaCuartosVisto) {
      const winners: string[] = [];
      const runners: string[] = [];
      copaEuropa.grupos.forEach(grupo => {
        const sorted = [...grupo.tabla].sort((a, b) => {
          if (b.puntos !== a.puntos) return b.puntos - a.puntos;
          if (b.diferenciaGoles !== a.diferenciaGoles) return b.diferenciaGoles - a.diferenciaGoles;
          return b.golesFavor - a.golesFavor;
        });
        winners.push(sorted[0].idEquipo);
        runners.push(sorted[1].idEquipo);
      });
      setSorteoCopaActivo({
        tipo: 'europa',
        fase: 'cuartos',
        copa: copaEuropa,
        participantes: [...winners, ...runners]
      });
      setNoticias(prev => [
        "🏆 [UEFA Gala] Definida la fase de grupos. Comienza el sorteo de los Cuartos de Final de la Copa Europa.",
        ...prev
      ]);
      return;
    }

    // A. Verificar si hoy se juega Copa de Campeones o Copa Continental
    const championsJornada = obtenerJornadaCopaHoy(fechaActual, copaCampeones);
    const europaJornada = obtenerJornadaCopaHoy(fechaActual, copaEuropa);

    if ((championsJornada && copaCampeones) || (europaJornada && copaEuropa)) {
      let userPartido: PartidoCopa | null = null;
      let userMatchday: any = null;
      let userCupType: 'champions' | 'europa' | null = null;

      if (championsJornada && copaCampeones) {
        for (const jg of championsJornada.matchdays) {
          const found = jg.partidos.find(p => p.localId === equipoUsuarioId || p.visitanteId === equipoUsuarioId);
          if (found && !found.jugado) {
            userPartido = found;
            userMatchday = jg;
            userCupType = 'champions';
            break;
          }
        }
      }

      if (!userPartido && europaJornada && copaEuropa) {
        for (const jg of europaJornada.matchdays) {
          const found = jg.partidos.find(p => p.localId === equipoUsuarioId || p.visitanteId === equipoUsuarioId);
          if (found && !found.jugado) {
            userPartido = found;
            userMatchday = jg;
            userCupType = 'europa';
            break;
          }
        }
      }

      if (userPartido && equipoUsuarioId && userCupType) {
        // --- EL USUARIO JUEGA HOY EN COPA ---
        let currentChampions = { ...copaCampeones! };
        let currentEuropa = { ...copaEuropa! };
        let allNoticiasCopa: string[] = [];
        const recaudacionesCopa: Record<string, number> = {};

        if (championsJornada) {
          championsJornada.matchdays.forEach(jg => {
            const partidosSimulables = jg.partidos.filter(p => (userCupType !== 'champions' || p.id !== userPartido!.id) && !p.jugado);
            const resSim = simularPartidosCopaEnFondo(currentChampions, partidosSimulables, 'champions', 'grupoId' in jg ? (jg as any).grupoId : undefined);
            currentChampions = resSim.updatedCopa;
            allNoticiasCopa.push(...resSim.noticiasCopa);
            Object.assign(recaudacionesCopa, resSim.recaudaciones);
          });
        }

        if (europaJornada) {
          europaJornada.matchdays.forEach(jg => {
            const partidosSimulables = jg.partidos.filter(p => (userCupType !== 'europa' || p.id !== userPartido!.id) && !p.jugado);
            const resSim = simularPartidosCopaEnFondo(currentEuropa, partidosSimulables, 'europa', 'grupoId' in jg ? (jg as any).grupoId : undefined);
            currentEuropa = resSim.updatedCopa;
            allNoticiasCopa.push(...resSim.noticiasCopa);
            Object.assign(recaudacionesCopa, resSim.recaudaciones);
          });
        }

        if (userCupType === 'champions') {
          setCopaCampeones(currentChampions);
          const finalEuropa = procesarTransicionCopa(currentEuropa, 'europa');
          setCopaEuropa(finalEuropa);
        } else {
          setCopaEuropa(currentEuropa);
          const finalChampions = procesarTransicionCopa(currentChampions, 'champions');
          setCopaCampeones(finalChampions);
        }

        if (allNoticiasCopa.length > 0) {
          setNoticias(prev => [...allNoticiasCopa, ...prev]);
        }

        // Acreditar recaudaciones a los equipos locales de Copa
        setEquipos(prevEquipos =>
          prevEquipos.map(e => {
            if (recaudacionesCopa[e.id]) {
              return { ...e, presupuestoFichajes: e.presupuestoFichajes + recaudacionesCopa[e.id] };
            }
            return e;
          })
        );

        const localObj = equipos.find(e => e.id === userPartido!.localId)!;
        const visitanteObj = equipos.find(e => e.id === userPartido!.visitanteId)!;

        setPartidoEnVivo({
          local: localObj,
          visitante: visitanteObj,
          jornada: {
            fecha: fechaActual,
            numero: 1,
            partidos: [{ localId: userPartido!.localId, visitanteId: userPartido!.visitanteId }]
          },
          tipo: 'copa',
          grupoId: 'grupoId' in userMatchday ? userMatchday.grupoId : undefined,
          partidoId: userPartido!.id,
          subtipo: userCupType
        });

        return;
      } else {
        // --- EL USUARIO NO JUEGA HOY EN COPA ---
        let currentChampions = { ...copaCampeones! };
        let currentEuropa = { ...copaEuropa! };
        let allNoticiasCopa: string[] = [];
        const recaudacionesCopa: Record<string, number> = {};

        if (championsJornada) {
          championsJornada.matchdays.forEach(jg => {
            const partidosSimulables = jg.partidos.filter(p => !p.jugado);
            const resSim = simularPartidosCopaEnFondo(currentChampions, partidosSimulables, 'champions', 'grupoId' in jg ? (jg as any).grupoId : undefined);
            currentChampions = resSim.updatedCopa;
            allNoticiasCopa.push(...resSim.noticiasCopa);
            Object.assign(recaudacionesCopa, resSim.recaudaciones);
          });
        }

        if (europaJornada) {
          europaJornada.matchdays.forEach(jg => {
            const partidosSimulables = jg.partidos.filter(p => !p.jugado);
            const resSim = simularPartidosCopaEnFondo(currentEuropa, partidosSimulables, 'europa', 'grupoId' in jg ? (jg as any).grupoId : undefined);
            currentEuropa = resSim.updatedCopa;
            allNoticiasCopa.push(...resSim.noticiasCopa);
            Object.assign(recaudacionesCopa, resSim.recaudaciones);
          });
        }

        const finalChampions = procesarTransicionCopa(currentChampions, 'champions');
        const finalEuropa = procesarTransicionCopa(currentEuropa, 'europa');
        setCopaCampeones(finalChampions);
        setCopaEuropa(finalEuropa);

        if (allNoticiasCopa.length > 0) {
          setNoticias(prev => [...allNoticiasCopa, ...prev]);
        }

        const enfoque = equipos.find(e => e.id === equipoUsuarioId)?.enfoqueEntrenamiento || 'Táctico';
        const { nuevaFecha, nuevosJugadores: stepJugadores, nuevasNoticias, cambioDeMes, esLunes } = ejecutarPasoDelTiempo(fechaActual, jugadores, equipoUsuarioId, enfoque);

        if (esLunes) {
          procesarFinanzasSemanales(stepJugadores, nuevasNoticias);
        }
        if (cambioDeMes && equipoUsuarioId) {
          setMesesEnQuiebra(prev => {
            const club = equipos.find(e => e.id === equipoUsuarioId);
            return (club && club.presupuestoFichajes < 0) ? prev + 1 : 0;
          });
        }

        const { nuevosJugadores: finalJugadores, nuevosEquipos: finalEquipos } = procesarMercadoFichajesIA(nuevaFecha, stepJugadores, equipos);

        const finalEquiposConCopa = finalEquipos.map(e => {
          if (recaudacionesCopa[e.id]) {
            return { ...e, presupuestoFichajes: e.presupuestoFichajes + recaudacionesCopa[e.id] };
          }
          return e;
        });

        setFechaActual(nuevaFecha);
        setJugadores(finalJugadores);
        setEquipos(finalEquiposConCopa);

        const oferta = intentarGenerarOfertaIA(nuevaFecha, finalJugadores);
        if (oferta) {
          setOfertaRecibidaActiva(oferta);
          nuevasNoticias.unshift(`📢 [Oferta de Transferencia] El ${oferta.clubCompradorNombre} ha presentado una oferta formal por ${oferta.jugadorNombre} por ${formatearMoneda(oferta.montoOfrecido)}.`);
        }

        if (nuevasNoticias.length > 0) {
          setNoticias(prev => [...nuevasNoticias, ...prev]);
        }

        return;
      }
    }

    // B. Verificar si la fecha de hoy tiene una jornada de liga programada
    const jornadaHoy = fixture.find(j => j.fecha === fechaActual);

    if (jornadaHoy) {
      // Buscar si el usuario juega hoy
      const partUsuarioFixture = jornadaHoy.partidos.find(p => p.localId === equipoUsuarioId || p.visitanteId === equipoUsuarioId);

      if (partUsuarioFixture && equipoUsuarioId) {
        // --- JUEGA EL USUARIO: SIMULAR SÓLO LOS DE LA IA Y DETENER ---
        const localObj = equipos.find(e => e.id === partUsuarioFixture.localId)!;
        const visitanteObj = equipos.find(e => e.id === partUsuarioFixture.visitanteId)!;

        const actualizacionesTabla: Record<string, {
          ganado: number;
          empatado: number;
          perdido: number;
          golesF: number;
          golesC: number;
        }> = {};
        const recaudacionesAI: Record<string, number> = {};

        jornadaHoy.partidos.forEach(partido => {
          const esPartUsuario = partido.localId === equipoUsuarioId || partido.visitanteId === equipoUsuarioId;
          if (esPartUsuario) return;

          const lObj = equipos.find(e => e.id === partido.localId)!;
          const vObj = equipos.find(e => e.id === partido.visitanteId)!;
          const res = simularPartido(lObj, vObj, jugadores);

          // Calcular taquilla
          const { recaudacion } = calcularRecaudacionTaquilla(lObj);
          recaudacionesAI[partido.localId] = (recaudacionesAI[partido.localId] || 0) + recaudacion;

          // Acumular estadísticas local
          const gLocal = res.golesLocal > res.golesVisitante ? 1 : 0;
          const eLocal = res.golesLocal === res.golesVisitante ? 1 : 0;
          const pLocal = res.golesLocal < res.golesVisitante ? 1 : 0;

          actualizacionesTabla[partido.localId] = {
            ganado: gLocal,
            empatado: eLocal,
            perdido: pLocal,
            golesF: res.golesLocal,
            golesC: res.golesVisitante
          };

          // Acumular estadísticas visitante
          const gVisitante = res.golesVisitante > res.golesLocal ? 1 : 0;
          const eVisitante = res.golesVisitante === res.golesLocal ? 1 : 0;
          const pVisitante = res.golesVisitante < res.golesLocal ? 1 : 0;

          actualizacionesTabla[partido.visitanteId] = {
            ganado: gVisitante,
            empatado: eVisitante,
            perdido: pVisitante,
            golesF: res.golesVisitante,
            golesC: res.golesLocal
          };
        });

        // Actualizar presupuestos de los equipos IA de Liga
        setEquipos(prevEquipos =>
          prevEquipos.map(e => {
            if (recaudacionesAI[e.id]) {
              return { ...e, presupuestoFichajes: e.presupuestoFichajes + recaudacionesAI[e.id] };
            }
            return e;
          })
        );

        // Actualizar la tabla de posiciones con los resultados de la jornada de la IA
        setLiga(prevLiga => {
          const nuevaTabla = prevLiga.tabla.map(t => {
            const update = actualizacionesTabla[t.idEquipo];
            if (update) {
              const pts = update.ganado * 3 + update.empatado;
              const resChar = update.ganado === 1 ? 'G' : update.empatado === 1 ? 'E' : 'P';
              return {
                ...t,
                partidosJugados: t.partidosJugados + 1,
                ganados: t.ganados + update.ganado,
                empatados: t.empatados + update.empatado,
                perdidos: t.perdidos + update.perdido,
                golesFavor: t.golesFavor + update.golesF,
                golesContra: t.golesContra + update.golesC,
                diferenciaGoles: (t.golesFavor + update.golesF) - (t.golesContra + update.golesC),
                puntos: t.puntos + pts,
                forma: [resChar, ...t.forma].slice(0, 5) as ('G' | 'E' | 'P')[]
              };
            }
            return t;
          });
          return {
            ...prevLiga,
            tabla: nuevaTabla
          };
        });

        // Activar modo Transmisión
        setPartidoEnVivo({
          local: localObj,
          visitante: visitanteObj,
          jornada: jornadaHoy
        });

      } else {
        // --- JORNADA NORMAL DE LA IA SIN EL USUARIO ---
        const actualizacionesTabla: Record<string, {
          ganado: number;
          empatado: number;
          perdido: number;
          golesF: number;
          golesC: number;
        }> = {};
        const recaudacionesAI: Record<string, number> = {};

        jornadaHoy.partidos.forEach(partido => {
          const lObj = equipos.find(e => e.id === partido.localId)!;
          const vObj = equipos.find(e => e.id === partido.visitanteId)!;
          const res = simularPartido(lObj, vObj, jugadores);

          // Calcular taquilla
          const { recaudacion } = calcularRecaudacionTaquilla(lObj);
          recaudacionesAI[partido.localId] = (recaudacionesAI[partido.localId] || 0) + recaudacion;

          // Acumular estadísticas local
          const gLocal = res.golesLocal > res.golesVisitante ? 1 : 0;
          const eLocal = res.golesLocal === res.golesVisitante ? 1 : 0;
          const pLocal = res.golesLocal < res.golesVisitante ? 1 : 0;

          actualizacionesTabla[partido.localId] = {
            ganado: gLocal,
            empatado: eLocal,
            perdido: pLocal,
            golesF: res.golesLocal,
            golesC: res.golesVisitante
          };

          // Acumular estadísticas visitante
          const gVisitante = res.golesVisitante > res.golesLocal ? 1 : 0;
          const eVisitante = res.golesVisitante === res.golesLocal ? 1 : 0;
          const pVisitante = res.golesVisitante < res.golesLocal ? 1 : 0;

          actualizacionesTabla[partido.visitanteId] = {
            ganado: gVisitante,
            empatado: eVisitante,
            perdido: pVisitante,
            golesF: res.golesVisitante,
            golesC: res.golesLocal
          };
        });

        // Actualizar presupuestos de los equipos de Liga
        setEquipos(prevEquipos =>
          prevEquipos.map(e => {
            if (recaudacionesAI[e.id]) {
              return { ...e, presupuestoFichajes: e.presupuestoFichajes + recaudacionesAI[e.id] };
            }
            return e;
          })
        );

        setLiga(prevLiga => {
          const nuevaTabla = prevLiga.tabla.map(t => {
            const update = actualizacionesTabla[t.idEquipo];
            if (update) {
              const pts = update.ganado * 3 + update.empatado;
              const resChar = update.ganado === 1 ? 'G' : update.empatado === 1 ? 'E' : 'P';
              return {
                ...t,
                partidosJugados: t.partidosJugados + 1,
                ganados: t.ganados + update.ganado,
                empatados: t.empatados + update.empatado,
                perdidos: t.perdidos + update.perdido,
                golesFavor: t.golesFavor + update.golesF,
                golesContra: t.golesContra + update.golesC,
                diferenciaGoles: (t.golesFavor + update.golesF) - (t.golesContra + update.golesC),
                puntos: t.puntos + pts,
                forma: [resChar, ...t.forma].slice(0, 5) as ('G' | 'E' | 'P')[]
              };
            }
            return t;
          });
          return {
            ...prevLiga,
            tabla: nuevaTabla
          };
        });
      }
    } else {
      // --- DÍA DE DESCANSO / PREPARACIÓN ---
      const enfoque = equipos.find(e => e.id === equipoUsuarioId)?.enfoqueEntrenamiento || 'Táctico';
      const { nuevaFecha, nuevosJugadores: stepJugadores, nuevasNoticias, cambioDeMes, esLunes } = ejecutarPasoDelTiempo(fechaActual, jugadores, equipoUsuarioId, enfoque);

      if (esLunes) {
        procesarFinanzasSemanales(stepJugadores, nuevasNoticias);
      }
      if (cambioDeMes && equipoUsuarioId) {
        setMesesEnQuiebra(prev => {
          const club = equipos.find(e => e.id === equipoUsuarioId);
          return (club && club.presupuestoFichajes < 0) ? prev + 1 : 0;
        });
      }

      // Ejecutar el scouting y fichajes automáticos de la IA en segundo plano
      const { nuevosJugadores: finalJugadores, nuevosEquipos: finalEquipos, nuevasNoticiasTransfer } = procesarMercadoFichajesIA(nuevaFecha, stepJugadores, equipos);

      setFechaActual(nuevaFecha);
      setJugadores(finalJugadores);
      setEquipos(finalEquipos);

      // Intentar generar oferta IA por el usuario
      const oferta = intentarGenerarOfertaIA(nuevaFecha, finalJugadores);
      if (oferta) {
        setOfertaRecibidaActiva(oferta);
        nuevasNoticias.unshift(`📢 [Oferta de Transferencia] El ${oferta.clubCompradorNombre} ha presentado una oferta formal por ${oferta.jugadorNombre} por ${formatearMoneda(oferta.montoOfrecido)}.`);
      }

      // Inyectar bombazos de fichajes de la IA
      if (nuevasNoticiasTransfer.length > 0) {
        nuevasNoticias.unshift(...nuevasNoticiasTransfer);
      }

      if (nuevasNoticias.length > 0) {
        setNoticias(prev => [...nuevasNoticias, ...prev]);
      }

      // ============================================================
      // EVENTOS ALEATORIOS DE VESTUARIO (5% de probabilidad en días sin partido)
      // Solo se generan si el usuario tiene equipo y NO hay ya un evento activo
      // ============================================================
      if (equipoUsuarioId && !eventoActivo && Math.random() < 0.05) {
        const evento = generarEventoAleatorio(finalJugadores, equipoUsuarioId);
        if (evento) {
          setEventoActivo(evento);
        }
      }

      // ============================================================
      // DETECCIÓN DE DEADLINE DAY (31 de Agosto o 31 de Enero)
      // Al avanzar al día siguiente, si es el último día del mercado,
      // activar el modo especial Deadline Day
      // ============================================================
      const ddDate = new Date(nuevaFecha + 'T12:00:00');
      const ddMes = ddDate.getMonth();   // 0 = enero, 7 = agosto
      const ddDia = ddDate.getDate();
      const esDeadlineDay = (ddMes === 7 && ddDia === 31) || (ddMes === 0 && ddDia === 31);
      if (esDeadlineDay && !deadlineDayActivo && equipoUsuarioId) {
        setDeadlineDayActivo(true);
        setHorasDeadline(24);
        const agentesIniciales = Array.from({ length: 5 }, (_, i) => generarAgenteLibre(Date.now() + i * 1000));
        setJugadoresAgentes(agentesIniciales);
        setNoticias(prev => [
          `🚨 [DEADLINE DAY] ¡Hoy es el ÚLTIMO DÍA del mercado de pases! Tienes 24 horas para cerrar operaciones. La IA estará muy activa. ¡No pierdas el tiempo!`,
          ...prev
        ]);
      }
    }
  }, [fechaActual, equipos, jugadores, equipoUsuarioId, procesarFinanzasSemanales, intentarGenerarOfertaIA, procesarMercadoFichajesIA, fixture, eventoActivo]);

  // ============================================================
  // AVANZAR 1 HORA EN DEADLINE DAY
  // ============================================================
  const avanzarHoraDeadline = useCallback(() => {
    if (!equipoUsuarioId || horasDeadline <= 0) return;

    const nuevasHoras = horasDeadline - 1;
    setHorasDeadline(nuevasHoras);

    const noticiasCierre: string[] = [];

    // 1. IA MAS AGRESIVA: 50% mas probable generar oferta por jugador del usuario
    const plantelUsuario = jugadores.filter(j => j.idEquipo === equipoUsuarioId && !j.intransferible);
    const clubsIA = equipos.filter(e => e.id !== equipoUsuarioId);
    if (plantelUsuario.length > 0 && clubsIA.length > 0 && Math.random() < 0.45) {
      const target = plantelUsuario[Math.floor(Math.random() * plantelUsuario.length)];
      const comprador = clubsIA[Math.floor(Math.random() * clubsIA.length)];
      // Oferta inflada por la desesperacion del Deadline (1.2x - 1.6x)
      const multiplier = 1.2 + Math.random() * 0.4;
      const monto = Math.round(target.valorMercado * multiplier);
      if (comprador.presupuestoFichajes >= monto) {
        setOfertaRecibidaActiva({
          id: `dd-${Date.now()}`,
          jugadorId: target.id,
          jugadorNombre: target.nombre,
          jugadorValorMercado: target.valorMercado,
          clubCompradorId: comprador.id,
          clubCompradorNombre: comprador.nombre,
          clubCompradorEscudo: comprador.escudo,
          clubCompradorReputacion: comprador.reputacion,
          montoOfrecido: monto,
          multiplicador: multiplier
        });
        noticiasCierre.push(`🚨 [DEADLINE DAY] El ${comprador.nombre} llega con una oferta DESESPERADA de ${formatearMoneda(monto)} por ${target.nombre}. ¡${nuevasHoras}h para el cierre!`);
      }
    }

    // 2. Refrescar 1 agente disponible cada 6 horas
    if (nuevasHoras % 6 === 0 && jugadoresAgentes.length < 8) {
      const nuevoAgente = generarAgenteLibre(Date.now());
      setJugadoresAgentes(prev => [...prev, nuevoAgente]);
      noticiasCierre.push(`📞 [Agente] Un nuevo jugador sin club se ofrece al mercado con descuento del 30%. ¡Aprovechá antes del cierre!`);
    }

    // 3. Si llegamos a 0 horas -> cerrar Deadline Day
    if (nuevasHoras === 0) {
      // Avanzar la fecha al dia siguiente (cierre del mercado)
      const nuevaFecha = sumarUnDia(fechaActual);
      setFechaActual(nuevaFecha);
      setDeadlineDayActivo(false);
      setJugadoresAgentes([]);
      noticiasCierre.push(`🔒 [MERCADO CERRADO] El mercado de pases ha cerrado definitivamente. No se pueden realizar mas operaciones hasta la proxima ventana.`);
    }

    // 4. Alertas de tiempo
    if (nuevasHoras === 3) {
      noticiasCierre.push(`🚨 ¡ULTIMAS 3 HORAS DEL MERCADO! Cualquier operacion que no se concrete ahora quedara para la proxima ventana.`);
    }
    if (nuevasHoras === 1) {
      noticiasCierre.push(`⏰ ¡1 HORA PARA EL CIERRE! Es ahora o nunca. El mercado cierra en 60 minutos.`);
    }

    if (noticiasCierre.length > 0) {
      setNoticias(prev => [...noticiasCierre, ...prev]);
    }
  }, [equipoUsuarioId, horasDeadline, jugadores, equipos, jugadoresAgentes, fechaActual]);

  // ============================================================
  // COMPRAR JUGADOR AGENTE (Deadline Day con descuento)
  // ============================================================
  const comprarJugadorAgente = useCallback((agenteId: string): { aceptado: boolean; mensaje: string } => {
    if (!equipoUsuarioId) return { aceptado: false, mensaje: 'No hay equipo seleccionado.' };

    const agente = jugadoresAgentes.find(a => a.id === agenteId);
    if (!agente || agente.comprado) return { aceptado: false, mensaje: 'El jugador ya no está disponible.' };

    const clubUsuario = equipos.find(e => e.id === equipoUsuarioId);
    if (!clubUsuario) return { aceptado: false, mensaje: 'Error al encontrar tu club.' };

    if (clubUsuario.presupuestoFichajes < agente.valorDescuento) {
      return { aceptado: false, mensaje: `Presupuesto insuficiente. Necesitás ${formatearMoneda(agente.valorDescuento)} y tenés ${formatearMoneda(clubUsuario.presupuestoFichajes)}.` };
    }

    // Descontar presupuesto
    setEquipos(prev => prev.map(e =>
      e.id === equipoUsuarioId
        ? { ...e, presupuestoFichajes: e.presupuestoFichajes - agente.valorDescuento }
        : e
    ));

    // Agregar jugador al plantel (como Jugador completo)
    const nuevoJugador: Jugador = {
      id: agente.id,
      nombre: agente.nombre,
      posicion: agente.posicion,
      edad: agente.edad,
      nacionalidad: agente.nacionalidad,
      ca: agente.ca,
      pa: agente.pa,
      valorMercado: agente.valorMercado,
      salarioSemanal: agente.salarioSemanal,
      personalidad: agente.personalidad,
      atributos: agente.atributos,
      idEquipo: equipoUsuarioId,
      titular: false,
      moral: 80,
      formaFisica: 75,
      lesionado: false,
      goles: 0,
      asistencias: 0,
      partidosJugados: 0,
      calificacionMedia: 0,
      partidosSeguidosBanco: 0,
      mesesContrato: 18
    };
    setJugadores(prev => [...prev, nuevoJugador]);

    // Marcar como comprado en la lista de agentes
    setJugadoresAgentes(prev => prev.map(a => a.id === agenteId ? { ...a, comprado: true } : a));

    const mensaje = `¡Fichaje Express! ${agente.nombre} firma por ${clubUsuario.nombre} por ${formatearMoneda(agente.valorDescuento)} (30% desc. por Deadline Day).`;
    setNoticias(prev => [`🤝 [DEADLINE DAY] ${mensaje}`, ...prev]);

    generarFeedHinchada('fichaje', { jugador: nuevoJugador });

    return { aceptado: true, mensaje };
  }, [equipoUsuarioId, jugadoresAgentes, equipos, generarFeedHinchada]);

  // Cerrar el reporte del partido disputado y avanzar automáticamente de fecha en el calendario
  const cerrarPartidoReciente = useCallback(() => {
    setPartidoReciente(null);

    // Avanzar la fecha y progresar jugadores
    const enfoque = equipos.find(e => e.id === equipoUsuarioId)?.enfoqueEntrenamiento || 'Táctico';
    const { nuevaFecha, nuevosJugadores: stepJugadores, nuevasNoticias, cambioDeMes, esLunes } = ejecutarPasoDelTiempo(fechaActual, jugadores, equipoUsuarioId, enfoque);

    if (esLunes) {
      procesarFinanzasSemanales(stepJugadores, nuevasNoticias);
    }
    if (cambioDeMes && equipoUsuarioId) {
      setMesesEnQuiebra(prev => {
        const club = equipos.find(e => e.id === equipoUsuarioId);
        return (club && club.presupuestoFichajes < 0) ? prev + 1 : 0;
      });
    }

    // Ejecutar el scouting y fichajes automáticos de la IA en segundo plano
    const { nuevosJugadores: finalJugadores, nuevosEquipos: finalEquipos, nuevasNoticiasTransfer } = procesarMercadoFichajesIA(nuevaFecha, stepJugadores, equipos);

    setFechaActual(nuevaFecha);
    setJugadores(finalJugadores);
    setEquipos(finalEquipos);

    // Intentar generar oferta IA por el usuario
    const oferta = intentarGenerarOfertaIA(nuevaFecha, finalJugadores);
    if (oferta) {
      setOfertaRecibidaActiva(oferta);
      nuevasNoticias.unshift(`📢 [Oferta de Transferencia] El ${oferta.clubCompradorNombre} ha presentado una oferta formal por ${oferta.jugadorNombre} por ${formatearMoneda(oferta.montoOfrecido)}.`);
    }

    // Inyectar bombazos de fichajes de la IA
    if (nuevasNoticiasTransfer.length > 0) {
      nuevasNoticias.unshift(...nuevasNoticiasTransfer);
    }

    if (nuevasNoticias.length > 0) {
      setNoticias(prev => [...nuevasNoticias, ...prev]);
    }
  }, [fechaActual, jugadores, equipos, equipoUsuarioId, procesarFinanzasSemanales, intentarGenerarOfertaIA, procesarMercadoFichajesIA]);

  // Actualizar un jugador específico (útil para lesiones, progresiones o entrenamientos)
  const actualizarJugador = useCallback((jugadorId: string, nuevosDatos: Partial<Jugador>) => {
    setJugadores(prevJugadores =>
      prevJugadores.map(jugador =>
        jugador.id === jugadorId ? { ...jugador, ...nuevosDatos } : jugador
      )
    );
  }, []);

  // Actualizar la tabla de posiciones directamente si es necesario
  const actualizarTabla = useCallback((nuevaTabla: TablaEquipo[]) => {
    setLiga(prevLiga => ({
      ...prevLiga,
      tabla: nuevaTabla
    }));
  }, []);

  // Reiniciar la partida a los valores iniciales
  const reiniciarPartida = useCallback(() => {
    const equiposMap = equiposIniciales.map(e => ({
      ...e,
      formacion: e.formacion || '4-3-3',
      estiloJuego: e.estiloJuego || 'Equilibrado'
    }));

    const playersWithTitular = jugadoresIniciales.map(j => ({
      ...j,
      titular: false,
      mesesContrato: j.mesesContrato !== undefined ? j.mesesContrato : Math.floor(Math.random() * 25) + 6
    }));
    const teamIds = Array.from(new Set(playersWithTitular.map(p => p.idEquipo)));
    teamIds.forEach(teamId => {
      const teamPlayers = playersWithTitular.filter(p => p.idEquipo === teamId);
      const sorted = [...teamPlayers].sort((a, b) => b.ca - a.ca);
      const starterIds = sorted.slice(0, 11).map(p => p.id);
      playersWithTitular.forEach(p => {
        if (p.idEquipo === teamId) {
          p.titular = starterIds.includes(p.id);
        }
      });
    });

    setEquipos(equiposMap);
    setJugadores(playersWithTitular);
    setLiga(ligaInicial);
    setFechaActual('2026-07-01');
    setEquipoUsuarioId(null);
    setPartidoReciente(null);
    setMesesEnQuiebra(0);
    setConfianzaDirectiva(75);
    setRuedaPrensaActiva(null);
    setDerrotasConsecutivas(0);
    setOfertaRecibidaActiva(null);
    setFixture(fixtureInicial);
    setReporteAcademia(null);
    setPartidoEnVivo(null);
    setCharlaActiva(null);
    setCopaCampeones(inicializarCopa(equiposIniciales, '2026-08-17', 'champions'));
    setCopaEuropa(inicializarCopa(equiposIniciales, '2026-08-17', 'europa'));
    setEventoActivo(null);
    setDeadlineDayActivo(false);
    setHorasDeadline(24);
    setJugadoresAgentes([]);
    setNoticias([
      '📰 Oficina de Prensa: ¡Te damos la bienvenida a tu nueva carrera! Planificá los entrenamientos y prepará tus fichajes en el mercado.'
    ]);
    setNombreManager('DT Mánager');
    setReputacionManager(50);
    setJuegoIniciado(false);
  }, []);

  // Cambiar estado de titularidad de un jugador
  const toggleTitular = useCallback((jugadorId: string) => {
    setJugadores(prevJugadores =>
      prevJugadores.map(j => {
        if (j.id === jugadorId) {
          if (j.lesionado) return j; // Un jugador lesionado no puede ser seleccionado como titular
          return { ...j, titular: !j.titular };
        }
        return j;
      })
    );
  }, []);

  // Asignar un jugador como titular (enciende su flag titular).
  // La lógica de nodo/posición es 100% visual en TacticaView;
  // aquí sólo necesitamos marcar al jugador como titular y desmarcar
  // al anterior si ya había 11 titulares.
  const asignarJugadorEnNodo = useCallback((jugadorId: string) => {
    setJugadores(prev => {
      const jugador = prev.find(j => j.id === jugadorId);
      if (!jugador || jugador.lesionado) return prev;
      // Si ya es titular, lo quitamos (toggle off)
      if (jugador.titular) {
        return prev.map(j => j.id === jugadorId ? { ...j, titular: false } : j);
      }
      // Marcamos como titular
      return prev.map(j => j.id === jugadorId ? { ...j, titular: true } : j);
    });
  }, []);

  // Actualizar posiciones tácticas (slots de la cancha) y sincronizar el flag titular
  const actualizarPosicionesTacticas = useCallback((posiciones: Record<string, string | null>) => {
    if (!equipoUsuarioId) return;

    // Mapeo inverso de jugadorId -> slotKey
    const idToSlot: Record<string, string> = {};
    Object.entries(posiciones).forEach(([slotKey, jId]) => {
      if (jId) {
        idToSlot[jId] = slotKey;
      }
    });

    setJugadores(prev =>
      prev.map(j => {
        if (j.idEquipo === equipoUsuarioId) {
          const slotKey = idToSlot[j.id];
          if (slotKey) {
            return { ...j, titular: true, posicionTactica: slotKey };
          } else {
            return { ...j, titular: false, posicionTactica: null };
          }
        }
        return j;
      })
    );
  }, [equipoUsuarioId]);

  // Actualizar táctica del equipo del usuario
  const actualizarTactica = useCallback((formacion: Formacion, estiloJuego: EstiloJuego) => {
    if (!equipoUsuarioId) return;
    setEquipos(prevEquipos =>
      prevEquipos.map(e =>
        e.id === equipoUsuarioId ? { ...e, formacion, estiloJuego } : e
      )
    );
  }, [equipoUsuarioId]);

  // Comprar un jugador del mercado
  const comprarJugador = useCallback((jugadorId: string, oferta: number, promesa?: PromesaGestion | null, clausulaRescision?: number) => {
    if (!equipoUsuarioId) return { aceptado: false, mensaje: 'No has seleccionado un club.' };

    const jugador = jugadores.find(j => j.id === jugadorId);
    if (!jugador) return { aceptado: false, mensaje: 'Jugador no encontrado.' };

    const clubUsuario = equipos.find(e => e.id === equipoUsuarioId)!;
    if (oferta > clubUsuario.presupuestoFichajes) {
      return { aceptado: false, mensaje: 'Presupuesto de fichajes insuficiente.' };
    }

    const clubAnterior = equipos.find(e => e.id === jugador.idEquipo);
    const esLibre = !jugador.idEquipo || jugador.idEquipo === 'libre';

    // Determinar si es jugador franquicia (solo el MEJOR jugador del equipo rival, no top 10% global)
    const esJugadorFranquicia = (): boolean => {
      if (esLibre) return false;
      // Solo el jugador con el mayor CA del plantel rival es franquicia
      const compañeros = jugadores.filter(p => p.idEquipo === jugador.idEquipo);
      if (compañeros.length === 0) return false;
      const maxCA = compañeros.reduce((max, p) => p.ca > max ? p.ca : max, 0);
      // Es franquicia solo si es el mejor del equipo y su CA es top mundial (>= 85)
      if (jugador.ca >= maxCA && jugador.ca >= 85) return true;
      return false;
    };

    let aceptado = false;
    let mensaje = '';
    const ratio = oferta / jugador.valorMercado;

    if (esLibre) {
      // Reglas para agentes libres
      if (ratio >= 0.85) {
        aceptado = true;
        mensaje = `¡Fichaje Completado! ${jugador.nombre} ha aceptado unirse al ${clubUsuario.nombre} como Agente Libre por la cifra de ${formatearMoneda(oferta)}. El jugador se incorpora libre de contrato.`;
      } else {
        aceptado = false;
        mensaje = `La propuesta fue rechazada. El representante de ${jugador.nombre} exige al menos un 85% de su valor estimado de mercado (${formatearMoneda(jugador.valorMercado * 0.85)}) como prima de fichaje.`;
      }
    } else if (esJugadorFranquicia()) {
      // Jugadores franquicia de élite: exigen prima, pero es negociable
      if (ratio < 1.2) {
        aceptado = false;
        mensaje = `El ${clubAnterior?.nombre} declara a ${jugador.nombre} como pieza clave de su proyecto. No negociarán por menos de ${formatearMoneda(jugador.valorMercado * 1.2)}.`;
      } else if (ratio < 1.6) {
        // 45% de probabilidad
        const rand = Math.random() < 0.45;
        if (rand) {
          aceptado = true;
          mensaje = `¡Acuerdo importante! Tras largas negociaciones, el ${clubAnterior?.nombre} acepta la oferta de ${formatearMoneda(oferta)} por su jugador estrella, ${jugador.nombre}.`;
        } else {
          aceptado = false;
          mensaje = `El ${clubAnterior?.nombre} rechaza ${formatearMoneda(oferta)} por ${jugador.nombre}. Valoran al jugador en al menos ${formatearMoneda(jugador.valorMercado * 1.5)}.`;
        }
      } else {
        aceptado = true;
        mensaje = `¡Fichaje de estrella! El ${clubAnterior?.nombre} no puede rechazar la oferta de ${formatearMoneda(oferta)} y libera a ${jugador.nombre}.`;
      }
    } else {
      // Jugadores regulares: mercado más ágil y realista
      if (ratio < 0.55) {
        aceptado = false;
        mensaje = `El ${clubAnterior?.nombre} rechaza de plano la oferta de ${formatearMoneda(oferta)} por ${jugador.nombre}. Exigen al menos ${formatearMoneda(jugador.valorMercado * 0.65)}.`;
      } else if (ratio < 0.70) {
        // 25% de probabilidad — el club podría vender si necesita liquidez
        const rand = Math.random() < 0.25;
        if (rand) {
          aceptado = true;
          mensaje = `¡Ganga del mercado! El ${clubAnterior?.nombre} acepta ${formatearMoneda(oferta)} por ${jugador.nombre} para liberar masa salarial.`;
        } else {
          aceptado = false;
          mensaje = `El ${clubAnterior?.nombre} rechaza la oferta de ${formatearMoneda(oferta)} por ${jugador.nombre}. Piden al menos ${formatearMoneda(jugador.valorMercado * 0.75)}.`;
        }
      } else if (ratio < 0.85) {
        // 55% de probabilidad
        const rand = Math.random() < 0.55;
        if (rand) {
          aceptado = true;
          mensaje = `¡Acuerdo cerrado! El ${clubAnterior?.nombre} acepta transferir a ${jugador.nombre} por ${formatearMoneda(oferta)}.`;
        } else {
          aceptado = false;
          mensaje = `La oferta de ${formatearMoneda(oferta)} por ${jugador.nombre} es insuficiente. El ${clubAnterior?.nombre} pide ${formatearMoneda(jugador.valorMercado * 0.90)}.`;
        }
      } else if (ratio < 1.05) {
        // 85% de probabilidad — oferta justa casi siempre se acepta
        const rand = Math.random() < 0.85;
        if (rand) {
          aceptado = true;
          mensaje = `¡Operación completada! El ${clubAnterior?.nombre} acepta ${formatearMoneda(oferta)} y transfiere a ${jugador.nombre}.`;
        } else {
          aceptado = false;
          mensaje = `El ${clubAnterior?.nombre} rechaza por escaso margen. Piden ${formatearMoneda(jugador.valorMercado * 1.02)} para cerrar el acuerdo.`;
        }
      } else {
        aceptado = true;
        mensaje = `¡Fichaje completado de inmediato! El ${clubAnterior?.nombre} acepta sin dudar la oferta de ${formatearMoneda(oferta)} por ${jugador.nombre}.`;
      }
    }

    if (aceptado) {
      // 1. Restar el dinero del presupuesto del usuario y sumarlo al del club vendedor
      setEquipos(prevEquipos =>
        prevEquipos.map(e => {
          if (e.id === equipoUsuarioId) {
            return { ...e, presupuestoFichajes: e.presupuestoFichajes - oferta };
          }
          if (clubAnterior && e.id === clubAnterior.id) {
            return { ...e, presupuestoFichajes: e.presupuestoFichajes + oferta };
          }
          return e;
        })
      );

      // 2. Re-mapear el club del jugador comprado y aplicar la promesa
      setJugadores(prevJugadores =>
        prevJugadores.map(j =>
          j.id === jugadorId
            ? { ...j, idEquipo: equipoUsuarioId, titular: false, promesas: promesa ? [promesa] : (j.promesas || []), clausulaRescision: clausulaRescision ?? j.clausulaRescision }
            : j
        )
      );

      // Agregar a las noticias
      setNoticias(prev => [
        `🤝 [Fichaje] ¡Acuerdo cerrado! El ${clubUsuario.nombre} adquiere los derechos de ${jugador.nombre} ${clubAnterior ? `procedente del ${clubAnterior.nombre}` : 'como Agente Libre'} por la cifra de ${formatearMoneda(oferta)}.`,
        ...prev
      ]);

      generarFeedHinchada('fichaje', { jugador });
    }

    return { aceptado, mensaje };
  }, [jugadores, equipos, equipoUsuarioId, generarFeedHinchada]);

  // Renovar contrato de un jugador
  const renovarContrato = useCallback((jugadorId: string, nuevoSalario: number, clausulaRescision?: number) => {
    setJugadores(prevJugadores =>
      prevJugadores.map(j => {
        if (j.id === jugadorId) {
          return {
            ...j,
            salarioSemanal: nuevoSalario,
            clausulaRescision: clausulaRescision,
            mesesContrato: 36, // extension a 36 meses
            moral: 100 // sube moral al 100%
          };
        }
        return j;
      })
    );

    // Registrar en noticias la renovación
    setJugadores(prev => {
      const jugador = prev.find(j => j.id === jugadorId);
      if (jugador) {
        const formatearEuros = (val: number) => {
          return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);
        };
        setNoticias(old => [
          `✍️ [Renovación] ¡Oficial! ${jugador.nombre} ha firmado una extensión de contrato por 36 meses con un salario semanal de ${formatearEuros(nuevoSalario)}. Su moral está por las nubes.`,
          ...old
        ]);
      }
      return prev;
    });
  }, []);

  // Responder a la Rueda de Prensa activa
  const responderRuedaPrensa = useCallback((opcionTipo: 'proteger' | 'critica' | 'evasiva') => {
    if (!ruedaPrensaActiva) return;

    const { jugadorId, jugadorNombre } = ruedaPrensaActiva;
    let moralDelta = 0;
    let confianzaDelta = 0;
    let determinacionDelta = 0;
    let efectoTexto = '';

    if (opcionTipo === 'proteger') {
      moralDelta = 15;
      confianzaDelta = -5;
      efectoTexto = `Apoyaste públicamente a ${jugadorNombre}. Su moral ha subido, pero la directiva opina que fuiste demasiado blando.`;
    } else if (opcionTipo === 'critica') {
      moralDelta = -25;
      determinacionDelta = 1;
      efectoTexto = `Criticaste abiertamente a ${jugadorNombre}. Su moral se desplomó, pero responderá entrenando más duro (Determinación +1).`;
    } else {
      efectoTexto = `Diste una respuesta evasiva y corporativa sobre ${jugadorNombre}. Las aguas se mantienen calmadas.`;
    }

    // 1. Aplicar cambios a los jugadores
    setJugadores(prevJugadores =>
      prevJugadores.map(j => {
        if (j.id === jugadorId) {
          const nuevasAtributos = { ...j.atributos };
          if (determinacionDelta > 0) {
            nuevasAtributos.determinacion = Math.min(20, (j.atributos.determinacion || 10) + determinacionDelta);
          }
          return {
            ...j,
            moral: Math.max(1, Math.min(100, j.moral + moralDelta)),
            atributos: nuevasAtributos
          };
        }
        return j;
      })
    );

    // 2. Aplicar cambio a confianza de la directiva
    if (confianzaDelta !== 0) {
      setConfianzaDirectiva(prev => Math.max(0, Math.min(100, prev + confianzaDelta)));
    }

    // 3. Agregar noticia
    setNoticias(prev => [
      `🎙️ [Sala de Prensa] ${efectoTexto}`,
      ...prev
    ]);

    // 4. Limpiar rueda de prensa activa
    setRuedaPrensaActiva(null);
  }, [ruedaPrensaActiva]);

  // Aceptar la oferta de transferencia de la IA
  const aceptarOfertaRecibida = useCallback(() => {
    if (!ofertaRecibidaActiva || !equipoUsuarioId) return;

    const { jugadorId, jugadorNombre, clubCompradorId, clubCompradorNombre, montoOfrecido } = ofertaRecibidaActiva;

    // 1. Sumar el monto al presupuesto de fichajes
    setEquipos(prevEquipos =>
      prevEquipos.map(e =>
        e.id === equipoUsuarioId
          ? { ...e, presupuestoFichajes: e.presupuestoFichajes + montoOfrecido }
          : e
      )
    );

    // 2. Transferir el jugador
    setJugadores(prevJugadores =>
      prevJugadores.map(j =>
        j.id === jugadorId
          ? { ...j, idEquipo: clubCompradorId, titular: false }
          : j
      )
    );

    // 3. Registrar en noticias
    setNoticias(prev => [
      `🤝 [Traspaso Confirmado] ¡Venta histórica! El ${equipoUsuario?.nombre || 'tu club'} vende a ${jugadorNombre} al ${clubCompradorNombre} por un monto de ${formatearMoneda(montoOfrecido)}.`,
      ...prev
    ]);

    // 4. Limpiar oferta activa
    setOfertaRecibidaActiva(null);
  }, [ofertaRecibidaActiva, equipoUsuarioId, equipoUsuario]);

  // Rechazar la oferta de transferencia de la IA
  const rechazarOfertaRecibida = useCallback(() => {
    if (!ofertaRecibidaActiva || !equipoUsuarioId) return;

    const { jugadorId, jugadorNombre, clubCompradorNombre, multiplicador, clubCompradorReputacion } = ofertaRecibidaActiva;

    const clubUsuario = equipos.find(e => e.id === equipoUsuarioId);
    const reputacionUsuario = clubUsuario?.reputacion || 0;

    let frustrado = false;
    if (multiplicador > 1.15 && clubCompradorReputacion > reputacionUsuario) {
      if (Math.random() < 0.60) {
        frustrado = true;
      }
    }

    if (frustrado) {
      setJugadores(prevJugadores =>
        prevJugadores.map(j =>
          j.id === jugadorId
            ? { ...j, moral: Math.max(1, j.moral - 35) }
            : j
        )
      );

      setNoticias(prev => [
        `😡 [Vestuario] ${jugadorNombre} está profundamente enojado y frustrado con tu decisión de rechazar la oferta del ${clubCompradorNombre}. Su moral ha caído drásticamente.`,
        ...prev
      ]);
    } else {
      setNoticias(prev => [
        `❌ [Transferencia] Se ha rechazado la oferta del ${clubCompradorNombre} por ${jugadorNombre}. El jugador permanece concentrado en el club.`,
        ...prev
      ]);
    }

    setOfertaRecibidaActiva(null);
  }, [ofertaRecibidaActiva, equipoUsuarioId, equipos]);

  // Contraofertar por un jugador solicitado por la IA
  const contraofertarRecibida = useCallback((monto: number) => {
    if (!ofertaRecibidaActiva || !equipoUsuarioId) {
      return { aceptado: false, mensaje: 'No hay ninguna oferta activa.' };
    }

    const { jugadorId, jugadorNombre, clubCompradorId, clubCompradorNombre, montoOfrecido } = ofertaRecibidaActiva;
    const limiteAceptacion = montoOfrecido * 1.20;

    if (monto <= limiteAceptacion) {
      // IA Acepta
      setEquipos(prevEquipos =>
        prevEquipos.map(e =>
          e.id === equipoUsuarioId
            ? { ...e, presupuestoFichajes: e.presupuestoFichajes + monto }
            : e
        )
      );

      setJugadores(prevJugadores =>
        prevJugadores.map(j =>
          j.id === jugadorId
            ? { ...j, idEquipo: clubCompradorId, titular: false }
            : j
        )
      );

      setNoticias(prev => [
        `🤝 [Traspaso Cerrado por Contraoferta] El ${clubCompradorNombre} aceptó las exigencias del ${equipoUsuario?.nombre || 'tu club'} y ficha a ${jugadorNombre} por ${formatearMoneda(monto)}.`,
        ...prev
      ]);

      setOfertaRecibidaActiva(null);

      return {
        aceptado: true,
        mensaje: `¡Acuerdo Cerrado! El ${clubCompradorNombre} ha aceptado tus exigencias y pagará ${formatearMoneda(monto)} por ${jugadorNombre}.`
      };
    } else {
      // IA Rechaza
      setOfertaRecibidaActiva(null);

      setNoticias(prev => [
        `⚠️ [Negociaciones Rotas] Las negociaciones con el ${clubCompradorNombre} por ${jugadorNombre} colapsaron tras exigir un monto considerado inalcanzable (${formatearMoneda(monto)}).`,
        ...prev
      ]);

      return {
        aceptado: false,
        mensaje: `Las negociaciones colapsaron. El ${clubCompradorNombre} consideró inaceptable tu contraoferta de ${formatearMoneda(monto)} (supera el 20% de su oferta inicial) y retiró su interés.`
      };
    }
  }, [ofertaRecibidaActiva, equipoUsuarioId, equipoUsuario]);

  // Finalizar el partido en vivo simulado interactivamente y consolidar todos los cambios
  const finalizarPartidoEnVivo = useCallback((golesLocal: number, golesVisitante: number, eventos: string[], jugadoresActualizados: Jugador[]) => {
    if (!partidoEnVivo || !equipoUsuarioId) return;

    const { local, visitante } = partidoEnVivo;

    // 1. Guardar el estado de los jugadores con fatiga, lesiones, goles y asistencias aplicados en vivo
    const esLocalUsuario = local.id === equipoUsuarioId;
    const golesUsuario = esLocalUsuario ? golesLocal : golesVisitante;
    const golesRival = esLocalUsuario ? golesVisitante : golesLocal;
    const perdioUsuario = golesUsuario < golesRival;

    // Calcular e ingresar recaudación de taquilla del partido para el equipo local
    const { asistencia, precioTicket, recaudacion } = calcularRecaudacionTaquilla(local);
    setEquipos(prevEquipos =>
      prevEquipos.map(e => {
        if (e.id === local.id) {
          return { ...e, presupuestoFichajes: e.presupuestoFichajes + recaudacion };
        }
        return e;
      })
    );

    let liderTitularPresente = false;
    let liderNombre = '';
    const noticiasVestuario: string[] = [];

    if (local.id === equipoUsuarioId) {
      const formatearEuros = (val: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);
      };
      noticiasVestuario.push(
        `🎟️ [Taquilla] Espectadores: ${asistencia.toLocaleString('de-DE')} | Precio entrada: ${precioTicket.toFixed(1)}€ | Recaudación total: +${formatearEuros(recaudacion)}`
      );
    }

    const jugadoresConPromesaRota: { id: string; nombre: string; nacionalidad: string; desc: string }[] = [];

    // Clones para mutación de moral
    let jugadoresProcesados = jugadoresActualizados.map(j => {
      if (j.idEquipo !== equipoUsuarioId) return j;

      let jClon = { ...j };

      // A. Control de Titulares
      if (jClon.titular) {
        jClon.partidosSeguidosBanco = 0;

        // Cumplió promesa de minutos
        if (jClon.promesaMinutosActive) {
          jClon.promesaMinutosActive = false;
          jClon.moral = Math.min(100, jClon.moral + 15);
          noticiasVestuario.push(
            `🤝 [Promesa Cumplida] ${jClon.nombre} agradece la titularidad y renueva su compromiso con el DT.`
          );
        }

        // Rastrear Líder titular
        if (jClon.personalidad === 'Líder') {
          liderTitularPresente = true;
          liderNombre = jClon.nombre;
        }
      } else {
        // B. Control de Suplentes (Banco)
        if (!jClon.lesionado) {
          jClon.partidosSeguidosBanco = (jClon.partidosSeguidosBanco || 0) + 1;

          // Rompió promesa de minutos
          if (jClon.promesaMinutosActive) {
            jClon.promesaMinutosActive = false;
            jClon.moral = Math.max(1, jClon.moral - 35);
            noticiasVestuario.push(
              `😡 [Promesa Rota] ${jClon.nombre} está furioso tras quedarse en el banco y romper tu promesa de minutos.`
            );
          }
        }
      }

      // C. Control de Promesas de Gestión (Titular Indiscutido y Penales)
      if (jClon.promesas && jClon.promesas.length > 0) {
        let tieneNuevaIncumplida = false;
        let descPromesa = '';
        jClon.promesas = jClon.promesas.map(p => {
          if (p.tipo === 'titular_indiscutido' && p.estado !== 'Incumplida') {
            if (jClon.titular) {
              return { ...p, estado: 'Cumplida' };
            } else if (!jClon.lesionado) {
              const seguidos = jClon.partidosSeguidosBanco;
              if (seguidos >= 3) {
                tieneNuevaIncumplida = true;
                descPromesa = p.descripcion;
                return { ...p, estado: 'Incumplida' };
              }
            }
          } else if (p.tipo === 'penales' && p.estado !== 'Incumplida') {
            if (jClon.esPateadorPenales) {
              return { ...p, estado: 'Cumplida', partidosTranscurridos: 0 };
            } else if (jClon.titular) {
              const tr = (p.partidosTranscurridos || 0) + 1;
              if (tr >= 3) {
                tieneNuevaIncumplida = true;
                descPromesa = p.descripcion;
                return { ...p, estado: 'Incumplida', partidosTranscurridos: tr };
              }
              return { ...p, estado: 'En proceso', partidosTranscurridos: tr };
            }
          }
          return p;
        });

        if (tieneNuevaIncumplida) {
          jClon.moral = 1;
          jClon.transferidoForzado = true;
          jugadoresConPromesaRota.push({
            id: jClon.id,
            nombre: jClon.nombre,
            nacionalidad: jClon.nacionalidad,
            desc: descPromesa
          });
        }
      }

      return jClon;
    });

    // Consecuencias de promesas rotas
    if (jugadoresConPromesaRota.length > 0) {
      jugadoresConPromesaRota.forEach(inc => {
        noticiasVestuario.push(
          `🚨 [Reunión de Vestuario] ${inc.nombre} convocó a sus compañeros furioso tras romperse la promesa: "${inc.desc}". La moral del plantel se ha visto gravemente afectada y exige su transferencia inmediata.`
        );

        jugadoresProcesados = jugadoresProcesados.map(j => {
          if (j.idEquipo === equipoUsuarioId && j.id !== inc.id) {
            const esCompatriota = j.nacionalidad === inc.nacionalidad;
            const drop = esCompatriota ? 30 : 15;
            return {
              ...j,
              moral: Math.max(1, j.moral - drop)
            };
          }
          return j;
        });
      });
    }

    // C. Rasgo Problemático en el banco
    const posicionProblematicos: string[] = [];
    jugadoresProcesados.forEach(j => {
      if (j.idEquipo === equipoUsuarioId && j.personalidad === 'Problemático' && !j.titular && !j.lesionado && (j.partidosSeguidosBanco || 0) >= 2) {
        posicionProblematicos.push(j.posicion);
        j.moral = Math.max(1, j.moral - 8);
        noticiasVestuario.push(
          `⚠️ [Tensión] ${j.nombre} (Problemático) está disconforme en el banco e infecta el clima de vestuario.`
        );
      }
    });

    if (posicionProblematicos.length > 0) {
      jugadoresProcesados = jugadoresProcesados.map(j => {
        if (j.idEquipo === equipoUsuarioId && posicionProblematicos.includes(j.posicion) && j.personalidad !== 'Problemático') {
          return {
            ...j,
            moral: Math.max(1, j.moral - 6)
          };
        }
        return j;
      });
    }

    // D. Líderes curan moral tras derrota
    if (perdioUsuario && liderTitularPresente) {
      jugadoresProcesados = jugadoresProcesados.map(j => {
        if (j.idEquipo === equipoUsuarioId) {
          return {
            ...j,
            moral: Math.min(100, j.moral + 5)
          };
        }
        return j;
      });
      noticiasVestuario.push(
        `📢 [Liderazgo] El carácter de ${liderNombre} tras la derrota ha levantado los ánimos en el vestuario (+5 moral a todo el equipo).`
      );
    }

    // E. Disparar Charla si partidosSeguidosBanco >= 3 (o >= 2 si es Ambicioso)
    let proximaCharla: CharlaJugador | null = null;
    const candidatosCharla = jugadoresProcesados.filter(j => {
      if (j.idEquipo !== equipoUsuarioId || j.lesionado) return false;
      const limite = j.personalidad === 'Ambicioso' ? 2 : 3;
      return (j.partidosSeguidosBanco || 0) >= limite;
    });

    if (candidatosCharla.length > 0) {
      const jElegido = candidatosCharla[0];
      proximaCharla = {
        jugadorId: jElegido.id,
        jugadorNombre: jElegido.nombre,
        personalidad: jElegido.personalidad,
        consecutivos: jElegido.partidosSeguidosBanco || 0
      };
      noticiasVestuario.push(
        `💬 [Vestuario] El jugador ${jElegido.nombre} ha solicitado una reunión de urgencia para hablar con vos.`
      );
    }

    setJugadores(jugadoresProcesados);
    if (proximaCharla) {
      setCharlaActiva(proximaCharla);
    }

    if (noticiasVestuario.length > 0) {
      setNoticias(prev => [...noticiasVestuario, ...prev]);
    }

    const esCopa = partidoEnVivo.tipo === 'copa';
    const partidoId = partidoEnVivo.partidoId;
    const grupoId = partidoEnVivo.grupoId;
    const subCopa = partidoEnVivo.subtipo || 'champions';
    const activeCopa = subCopa === 'champions' ? copaCampeones : copaEuropa;

    let penLocal: number | undefined = undefined;
    let penVisitante: number | undefined = undefined;
    if (esCopa && activeCopa && activeCopa.faseActual !== 'grupos' && golesLocal === golesVisitante) {
      const shoot = simularTandaPenales();
      penLocal = shoot.penLocal;
      penVisitante = shoot.penVisitante;
      eventos.push(`🏆 [Definición por Penales] ${local.nombreCorto} (${penLocal}) - (${penVisitante}) ${visitante.nombreCorto}.`);
    }

    if (esCopa && activeCopa) {
      let copiaCopa = { ...activeCopa };
      if (copiaCopa.faseActual === 'grupos') {
        copiaCopa.partidosGrupos = copiaCopa.partidosGrupos.map(jg => {
          return {
            ...jg,
            partidos: jg.partidos.map(p => {
              if (p.id === partidoId) {
                return { ...p, golesLocal, golesVisitante, jugado: true, eventos };
              }
              return p;
            })
          };
        });

        // Actualizar la tabla de posiciones del grupo
        const grupo = copiaCopa.grupos.find(g => g.id === grupoId)!;
        const tLocal = grupo.tabla.find(t => t.idEquipo === local.id)!;
        const tVisitante = grupo.tabla.find(t => t.idEquipo === visitante.id)!;

        tLocal.partidosJugados++;
        tLocal.golesFavor += golesLocal;
        tLocal.golesContra += golesVisitante;
        tLocal.diferenciaGoles = tLocal.golesFavor - tLocal.golesContra;

        tVisitante.partidosJugados++;
        tVisitante.golesFavor += golesVisitante;
        tVisitante.golesContra += golesLocal;
        tVisitante.diferenciaGoles = tVisitante.golesFavor - tVisitante.golesContra;

        if (golesLocal > golesVisitante) {
          tLocal.ganados++;
          tLocal.puntos += 3;
          tVisitante.perdidos++;
        } else if (golesLocal === golesVisitante) {
          tLocal.empatados++;
          tLocal.puntos += 1;
          tVisitante.empatados++;
          tVisitante.puntos += 1;
        } else {
          tVisitante.ganados++;
          tVisitante.puntos += 3;
          tLocal.perdidos++;
        }
      } else if (copiaCopa.faseActual === 'cuartos' && copiaCopa.cuartos) {
        copiaCopa.cuartos.partidos = copiaCopa.cuartos.partidos.map(p => {
          if (p.id === partidoId) {
            return { ...p, golesLocal, golesVisitante, penalesLocal: penLocal, penalesVisitante: penVisitante, jugado: true, eventos };
          }
          return p;
        });
      } else if (copiaCopa.faseActual === 'semifinales' && copiaCopa.semifinales) {
        copiaCopa.semifinales.partidos = copiaCopa.semifinales.partidos.map(p => {
          if (p.id === partidoId) {
            return { ...p, golesLocal, golesVisitante, penalesLocal: penLocal, penalesVisitante: penVisitante, jugado: true, eventos };
          }
          return p;
        });
      } else if (copiaCopa.faseActual === 'final' && copiaCopa.final) {
        copiaCopa.final.partido = {
          ...copiaCopa.final.partido,
          golesLocal,
          golesVisitante,
          penalesLocal: penLocal,
          penalesVisitante: penVisitante,
          jugado: true,
          eventos
        };
      }

      const finalCopa = procesarTransicionCopa(copiaCopa, subCopa);
      if (subCopa === 'champions') {
        setCopaCampeones(finalCopa);
      } else {
        setCopaEuropa(finalCopa);
      }
    }

    if (!esCopa) {
      // 2. Actualizar la tabla de posiciones con los resultados de este partido
      setLiga(prevLiga => {
        const nuevaTabla = prevLiga.tabla.map(t => {
          if (t.idEquipo === local.id) {
            const gLocal = golesLocal > golesVisitante ? 1 : 0;
            const eLocal = golesLocal === golesVisitante ? 1 : 0;
            const pLocal = golesLocal < golesVisitante ? 1 : 0;
            const pts = gLocal * 3 + eLocal;
            const resChar = gLocal === 1 ? 'G' : eLocal === 1 ? 'E' : 'P';
            return {
              ...t,
              partidosJugados: t.partidosJugados + 1,
              ganados: t.ganados + gLocal,
              empatados: t.empatados + eLocal,
              perdidos: t.perdidos + pLocal,
              golesFavor: t.golesFavor + golesLocal,
              golesContra: t.golesContra + golesVisitante,
              diferenciaGoles: (t.golesFavor + golesLocal) - (t.golesContra + golesVisitante),
              puntos: t.puntos + pts,
              forma: [resChar, ...t.forma].slice(0, 5) as ('G' | 'E' | 'P')[]
            };
          }
          if (t.idEquipo === visitante.id) {
            const gVisitante = golesVisitante > golesLocal ? 1 : 0;
            const eVisitante = golesVisitante === golesLocal ? 1 : 0;
            const pVisitante = golesVisitante < golesLocal ? 1 : 0;
            const pts = gVisitante * 3 + eVisitante;
            const resChar = gVisitante === 1 ? 'G' : eVisitante === 1 ? 'E' : 'P';
            return {
              ...t,
              partidosJugados: t.partidosJugados + 1,
              ganados: t.ganados + gVisitante,
              empatados: t.empatados + eVisitante,
              perdidos: t.perdidos + pVisitante,
              golesFavor: t.golesFavor + golesVisitante,
              golesContra: t.golesContra + golesLocal,
              diferenciaGoles: (t.golesFavor + golesVisitante) - (t.golesContra + golesLocal),
              puntos: t.puntos + pts,
              forma: [resChar, ...t.forma].slice(0, 5) as ('G' | 'E' | 'P')[]
            };
          }
          return t;
        });
        return {
          ...prevLiga,
          tabla: nuevaTabla
        };
      });
    }

    // 3. Evaluar la confianza de la directiva y las ruedas de prensa
    const esClasico = !esCopa && ((local.id === 'real-madrid' && visitante.id === 'barcelona') ||
      (local.id === 'barcelona' && visitante.id === 'real-madrid'));

    let nuevasDerrotas = 0;
    let deltaConfianza = 0;
    let resultadoTexto = '';

    if (golesUsuario > golesRival) {
      // Victoria
      if (esCopa) {
        deltaConfianza = 8;
        resultadoTexto = '¡Victoria espectacular en la Copa de Campeones! La directiva está exultante con tu rendimiento internacional.';
      } else {
        deltaConfianza = esClasico ? 10 : 5;
        resultadoTexto = esClasico ? '¡Espectacular victoria en el Clásico! La directiva está exultante.' : 'Victoria importante. La directiva gana confianza en tu gestión.';
      }
      setDerrotasConsecutivas(0);
    } else if (golesUsuario === golesRival) {
      // Empate
      deltaConfianza = esCopa ? 2 : 1;
      resultadoTexto = esCopa ? 'Empate en partido internacional. La junta directiva mantiene una postura favorable.' : 'Empate. La directiva mantiene su postura estable.';
      setDerrotasConsecutivas(0);
    } else {
      // Derrota
      if (esCopa) {
        deltaConfianza = -8;
        resultadoTexto = 'Dolorosa derrota continental. La directiva cuestiona tus planteamientos tácticos internacionales.';
      } else {
        deltaConfianza = esClasico ? -12 : -7;
        resultadoTexto = esClasico ? 'Dolorosa derrota en el Clásico. La directiva está sumamente decepcionada.' : 'Derrota decepcionante. La directiva empieza a dudar de tus planteamientos.';
      }

      setDerrotasConsecutivas(prev => {
        nuevasDerrotas = prev + 1;
        return nuevasDerrotas;
      });
    }

    setConfianzaDirectiva(prev => Math.max(0, Math.min(100, prev + deltaConfianza)));

    // Agregar noticia de la junta directiva
    setNoticias(prev => [
      `💼 [Junta Directiva] ${resultadoTexto} (Confianza: ${deltaConfianza >= 0 ? '+' : ''}${deltaConfianza}%)`,
      ...prev
    ]);

    // Rueda de Prensa
    const triggerPrensa = esClasico || (golesUsuario < golesRival && (derrotasConsecutivas + 1 >= 3 || nuevasDerrotas >= 3));

    if (triggerPrensa) {
      const inicialUsuario = jugadoresActualizados.filter(j => j.idEquipo === equipoUsuarioId && j.titular);
      const jugadorElegido = inicialUsuario.length > 0
        ? inicialUsuario[Math.floor(Math.random() * inicialUsuario.length)]
        : jugadoresActualizados.filter(j => j.idEquipo === equipoUsuarioId)[0];

      if (jugadorElegido) {
        let pregunta = '';
        let opcionProteger = '';
        let opcionCritica = '';
        let opcionEvasiva = '';

        if (golesUsuario < golesRival) {
          pregunta = `🎙️ Periodista: "El rendimiento de ${jugadorElegido.nombre} hoy estuvo muy por debajo de lo esperado y el equipo sufrió la derrota. ¿Qué opina sobre su nivel?"`;
          opcionProteger = `Proteger al jugador: "Es un crack de clase mundial, confío plenamente en él."`;
          opcionCritica = `Crítica pública: "Tiene que entrenar mucho más duro si quiere ganarse el puesto."`;
          opcionEvasiva = `Evasiva: "Lo colectivo es lo único que nos importa hoy en día."`;
        } else {
          pregunta = `🎙️ Periodista: "¡Vaya partido de alta tensión! ¿Cómo valora la entrega y el rendimiento de ${jugadorElegido.nombre} hoy en el campo de juego?"`;
          opcionProteger = `Proteger al jugador: "Estuvo fantástico, demostró por qué es un pilar fundamental en este club."`;
          opcionCritica = `Crítica pública: "Cumplió con lo básico, pero a un jugador de su estatus le exijo siempre mucho más."`;
          opcionEvasiva = `Evasiva: "Destaco el esfuerzo colectivo del equipo por sobre cualquier individualidad."`;
        }

        setRuedaPrensaActiva({
          pregunta,
          jugadorId: jugadorElegido.id,
          jugadorNombre: jugadorElegido.nombre,
          opciones: [
            {
              id: 'proteger',
              text: opcionProteger,
              tipo: 'proteger',
              explicacionEfecto: `Efecto: Sube la moral de ${jugadorElegido.nombre} (+15), pero baja la confianza de la directiva (-5%).`
            } as any,
            {
              id: 'critica',
              text: opcionCritica,
              tipo: 'critica',
              explicacionEfecto: `Efecto: Baja moral del jugador drásticamente (-25), pero su valor de Determinación aumenta.`
            } as any,
            {
              id: 'evasiva',
              text: opcionEvasiva,
              tipo: 'evasiva',
              explicacionEfecto: 'Efecto: Sin cambios sobre el jugador ni sobre la confianza de la directiva.'
            } as any
          ] as any
        });

        setNoticias(prevNoticias => [
          `🚨 [Centro de Medios] Rueda de prensa obligatoria programada. Los periodistas esperan en la sala de prensa.`,
          ...prevNoticias
        ]);
      }
    }

    // 4. Mostrar panel partidoReciente
    setPartidoReciente({
      golesLocal,
      golesVisitante,
      eventos,
      local,
      visitante,
      otroPartidoTexto: esCopa
        ? "Los demás partidos continentales de hoy se han disputado."
        : "Los demás partidos de esta jornada ya se han disputado."
    });

    // 5. Evaluar consecuencias de promesas de titularidad
    if (equipoUsuarioId) {
      const conPromesa = jugadoresProcesados.filter(j => j.idEquipo === equipoUsuarioId && j.promesaTitularPendiente === true);
      if (conPromesa.length > 0) {
        const titularesIds = new Set(jugadoresProcesados.filter(j => j.idEquipo === equipoUsuarioId && j.titular).map(j => j.id));
        const incumplidos = conPromesa.filter(j => !titularesIds.has(j.id));

        if (incumplidos.length > 0) {
          const amigosAfectados = new Set<string>();
          incumplidos.forEach(j => {
            if (j.amigosVestuarioIds) {
              j.amigosVestuarioIds.forEach(amigoId => amigosAfectados.add(amigoId));
            }
          });

          setJugadores(prev => prev.map(j => {
            if (j.idEquipo !== equipoUsuarioId) return j;
            if (incumplidos.some(x => x.id === j.id)) {
              return { ...j, moral: 0, promesaTitularPendiente: false };
            }
            if (amigosAfectados.has(j.id)) {
              return { ...j, moral: Math.max(1, Math.round(j.moral * 0.90)) };
            }
            return j;
          }));

          incumplidos.forEach(j => {
            setNoticias(prev => [
              `💔 [Promesa Rota] ${j.nombre} no fue titular a pesar de tu promesa. Su moral ha caído a CERO y el malestar se contagia al vestuario. ¡La situación es urgente!`,
              ...prev
            ]);
          });
        } else {
          setJugadores(prev => prev.map(j => {
            if (conPromesa.some(x => x.id === j.id)) {
              return { ...j, promesaTitularPendiente: false };
            }
            return j;
          }));
        }
      }
    }

    // 6. Generar Feed de la Hinchada
    generarFeedHinchada('partido', {
      local,
      visitante,
      golesLocal,
      golesVisitante,
      eventos,
      clima: partidoEnVivo.clima
    });

    // 7. Limpiar partido en vivo
    setPartidoEnVivo(null);
  }, [partidoEnVivo, equipoUsuarioId, derrotasConsecutivas, copaCampeones, copaEuropa, procesarTransicionCopa, generarFeedHinchada]);

  // Resolver charla del vestuario
  const resolverCharla = useCallback((decision: 'prometer' | 'vender' | 'sancionar') => {
    if (!charlaActiva || !equipoUsuarioId) return;

    const { jugadorId, jugadorNombre } = charlaActiva;
    let descNoticia = '';

    setJugadores(prevJugadores => {
      const jugador = prevJugadores.find(j => j.id === jugadorId);
      if (!jugador) return prevJugadores;

      let moralDelta = 0;
      let teamMoralDelta = 0;
      let flagPromesa = false;
      let flagForzarTransfer = false;

      if (decision === 'prometer') {
        moralDelta = 25;
        teamMoralDelta = 5;
        flagPromesa = true;
        descNoticia = `🤝 [Charla Vestuario] Prometiste a ${jugadorNombre} que jugará de titular el próximo partido. El plantel valora tu receptividad (+5 moral general).`;
      } else if (decision === 'vender') {
        moralDelta = -jugador.moral + 15; // Set to 15
        teamMoralDelta = -10;
        flagForzarTransfer = true;
        descNoticia = `💼 [Charla Vestuario] Decidiste colocar a ${jugadorNombre} en la lista de transferibles tras su queja por minutos. El vestuario siente resentimiento por tu trato frío (-10 moral general).`;
      } else if (decision === 'sancionar') {
        moralDelta = -jugador.moral + 5; // Set to 5
        teamMoralDelta = -15;
        descNoticia = `⚖️ [Disciplina] Sancionaste con dureza a ${jugadorNombre} retirándole 2 semanas de salario por reclamar. El vestuario está tenso y disconforme con el autoritarismo (-15 moral general).`;
      }

      // Generar noticia en el listado
      setNoticias(old => [descNoticia, ...old]);

      return prevJugadores.map(j => {
        if (j.id === jugadorId) {
          return {
            ...j,
            moral: Math.max(1, Math.min(100, j.moral + moralDelta)),
            partidosSeguidosBanco: 0,
            promesaMinutosActive: flagPromesa,
            transferidoForzado: flagForzarTransfer
          };
        }
        if (j.idEquipo === equipoUsuarioId && j.id !== jugadorId) {
          return {
            ...j,
            moral: Math.max(1, Math.min(100, j.moral + teamMoralDelta))
          };
        }
        return j;
      });
    });
  }, [charlaActiva, equipoUsuarioId]);

  // Cierre y transición de temporada
  const finalizarTemporada = useCallback(() => {
    const retiradosList: { jugador: Jugador; edad: number; clubNombre: string; clubEscudo: string }[] = [];
    const promovidosList: { jugador: Jugador; clubNombre: string; clubEscudo: string; esJoya: boolean }[] = [];
    const listaActualJugadores = [...jugadores];
    const listaEquipos = [...equipos];

    const obtenerEquiposDeMismaLiga = (equipoId: string): Equipo[] => {
      if (equiposLaLiga.some(e => e.id === equipoId)) return equiposLaLiga;
      if (equiposPremier.some(e => e.id === equipoId)) return equiposPremier;
      if (equiposSerieA.some(e => e.id === equipoId)) return equiposSerieA;
      if (equiposBundesliga.some(e => e.id === equipoId)) return equiposBundesliga;
      return equiposLaLiga;
    };

    const clamp = (value: number, min: number, max: number): number => {
      return Math.max(min, Math.min(max, value));
    };

    const jugadoresFinales: Jugador[] = [];

    listaActualJugadores.forEach(j => {
      let seRetira = false;
      if (j.edad >= 35) {
        let prob = 0.25; // 35 años
        if (j.edad === 36) prob = 0.45;
        if (j.edad === 37) prob = 0.65;
        if (j.edad === 38) prob = 0.80;
        if (j.edad >= 39) prob = 0.95;

        if (j.lesionado) {
          prob += 0.20;
        }

        if (Math.random() < prob) {
          seRetira = true;
        }
      }

      if (seRetira) {
        const club = listaEquipos.find(e => e.id === j.idEquipo);
        retiradosList.push({
          jugador: j,
          edad: j.edad,
          clubNombre: club?.nombre || 'Agente Libre',
          clubEscudo: club?.escudo || '👤'
        });

        const esEstrella = j.pa >= 80 || j.ca >= 76;
        const edadNewgen = Math.random() < 0.5 ? 16 : 17;
        let paNewgen = 0;
        let caNewgen = 0;
        let esJoya = false;

        if (esEstrella) {
          paNewgen = randomRange(85, 95);
          caNewgen = randomRange(50, 60);
          esJoya = true;
        } else {
          paNewgen = clamp(j.pa + randomRange(-5, 5), 55, 80);
          caNewgen = clamp(paNewgen - randomRange(10, 22), 40, 58);
        }

        let idEquipoNewgen = 'libre';
        let clubNewgen: Equipo | undefined = undefined;

        if (j.idEquipo !== 'libre') {
          const mismoLeagueClubs = obtenerEquiposDeMismaLiga(j.idEquipo);
          if (Math.random() < 0.60 && mismoLeagueClubs.length > 0) {
            clubNewgen = mismoLeagueClubs[Math.floor(Math.random() * mismoLeagueClubs.length)];
            idEquipoNewgen = clubNewgen.id;
          }
        }

        const newgen = generarNewgen(
          idEquipoNewgen,
          j.posicion,
          j.nacionalidad,
          caNewgen,
          paNewgen,
          edadNewgen
        );

        jugadoresFinales.push(newgen);

        promovidosList.push({
          jugador: newgen,
          clubNombre: clubNewgen?.nombre || 'Agente Libre',
          clubEscudo: clubNewgen?.escudo || '👤',
          esJoya
        });
      } else {
        // Envejece y resetea estadísticas
        jugadoresFinales.push({
          ...j,
          edad: j.edad + 1,
          goles: 0,
          asistencias: 0,
          partidosJugados: 0,
          calificacionMedia: 0,
          titular: false,
          posicionTactica: null
        });
      }
    });

    // Resetear Tabla de Posiciones
    const tablaReseteada = liga.tabla.map(t => ({
      ...t,
      partidosJugados: 0,
      ganados: 0,
      empatados: 0,
      perdidos: 0,
      golesFavor: 0,
      golesContra: 0,
      diferenciaGoles: 0,
      puntos: 0,
      forma: []
    }));

    // Siguiente temporada
    const partes = liga.temporada.split('/');
    const anio1 = parseInt(partes[0]);
    const anio2 = parseInt(partes[1]);
    const nuevaTemporadaName = `${anio1 + 1}/${anio2 + 1}`;

    // Nuevo fixture
    const prevStartDateStr = fixture[0]?.fecha || '2026-08-17';
    const prevStartDate = new Date(prevStartDateStr + 'T12:00:00');
    prevStartDate.setDate(prevStartDate.getDate() + 364);
    const nuevaFechaInicioStr = prevStartDate.toISOString().split('T')[0];

    const nuevoFixture = generarFixtureRoundRobin(
      liga.equipos.map(e => e.id),
      nuevaFechaInicioStr
    );

    const nuevoAnio = prevStartDate.getFullYear();
    const nuevaFechaActual = `${nuevoAnio}-07-01`;

    const tablaOrdenadaLaLiga = [...liga.tabla].sort((a, b) => {
      if (b.puntos !== a.puntos) return b.puntos - a.puntos;
      if (b.diferenciaGoles !== a.diferenciaGoles) return b.diferenciaGoles - a.diferenciaGoles;
      return b.golesFavor - a.golesFavor;
    });
    const clasificadosLigaUsuario = tablaOrdenadaLaLiga.map(t => equipos.find(e => e.id === t.idEquipo)!);
    const clasificadosLaLiga = clasificadosLigaUsuario.slice(0, 4);
    const clasificadosEuropa = clasificadosLigaUsuario.slice(4, 8);
    const nuevaCopa = inicializarCopa(equipos, nuevaFechaInicioStr, 'champions', clasificadosLigaUsuario, liga.pais);
    const nuevaCopaEu = inicializarCopa(equipos, nuevaFechaInicioStr, 'europa', clasificadosLigaUsuario, liga.pais);

    // Premiar campeones y clasificados
    const equiposActualizados = listaEquipos.map(eq => {
      const idxInTabla = tablaOrdenadaLaLiga.findIndex(t => t.idEquipo === eq.id);
      if (idxInTabla === 0) {
        return {
          ...eq,
          presupuestoFichajes: eq.presupuestoFichajes + 25000000,
          reputacion: Math.min(99, eq.reputacion + 5)
        };
      } else if (idxInTabla === 1) {
        return {
          ...eq,
          presupuestoFichajes: eq.presupuestoFichajes + 15000000,
          reputacion: Math.min(99, eq.reputacion + 3)
        };
      } else if (idxInTabla === 2) {
        return {
          ...eq,
          presupuestoFichajes: eq.presupuestoFichajes + 10000000,
          reputacion: Math.min(99, eq.reputacion + 2)
        };
      } else if (idxInTabla === 3) {
        return {
          ...eq,
          presupuestoFichajes: eq.presupuestoFichajes + 5000000,
          reputacion: Math.min(99, eq.reputacion + 1)
        };
      }
      return eq;
    });

    const campeonClub = equipos.find(e => e.id === tablaOrdenadaLaLiga[0].idEquipo);

    const esClasificadoCopa = [...clasificadosLaLiga, ...clasificadosEuropa].some(c => c.id === equipoUsuarioId);
    const jugadoresConCopaRota: string[] = [];
    let jugadoresFinalesProcesados = jugadoresFinales.map(j => {
      if (j.idEquipo !== equipoUsuarioId) return j;
      let jClon = { ...j };
      if (jClon.promesas && jClon.promesas.length > 0) {
        let tieneNuevaIncumplida = false;
        jClon.promesas = jClon.promesas.map(p => {
          if (p.tipo === 'copa_internacional' && p.estado === 'En proceso') {
            if (esClasificadoCopa) {
              return { ...p, estado: 'Cumplida' };
            } else {
              tieneNuevaIncumplida = true;
              return { ...p, estado: 'Incumplida' };
            }
          }
          return p;
        });

        if (tieneNuevaIncumplida) {
          jClon.moral = 1;
          jClon.transferidoForzado = true;
          jugadoresConCopaRota.push(jClon.nombre);
        }
      }
      return jClon;
    });

    const noticiasCopaRota: string[] = [];
    if (jugadoresConCopaRota.length > 0) {
      jugadoresConCopaRota.forEach(nombre => {
        noticiasCopaRota.push(
          `🚨 [Objetivo Roto] Tras no clasificar a la Copa de Campeones ni a la Copa Continental, ${nombre} convocó una reunión de vestuario de urgencia. Exige ser transferido de inmediato y el vestuario se ha desmotivado.`
        );

        jugadoresFinalesProcesados = jugadoresFinalesProcesados.map(j => {
          if (j.idEquipo === equipoUsuarioId && j.nombre !== nombre) {
            const incJugador = jugadoresFinales.find(j2 => j2.nombre === nombre);
            const esCompatriota = incJugador && j.nacionalidad === incJugador.nacionalidad;
            const drop = esCompatriota ? 30 : 15;
            return {
              ...j,
              moral: Math.max(1, j.moral - drop)
            };
          }
          return j;
        });
      });
    }

    setEquipos(equiposActualizados);
    setJugadores(jugadoresFinalesProcesados);
    setFixture(nuevoFixture);
    setLiga(prevLiga => ({
      ...prevLiga,
      temporada: nuevaTemporadaName,
      tabla: tablaReseteada
    }));
    setFechaActual(nuevaFechaActual);
    setCopaCampeones(nuevaCopa);
    setCopaEuropa(nuevaCopaEu);

    setReporteAcademia({
      retirados: retiradosList,
      promovidos: promovidosList
    });

    const nuevasNoticiasCierre = [
      `🏆 [Campeón de Liga] ¡Felicitaciones al ${campeonClub?.nombre || 'Club'} ${campeonClub?.escudo || ''} por consagrarse campeón de la temporada!`,
      `💰 [Premios de Liga] Se han entregado los premios financieros de fin de temporada a los 4 mejores equipos.`,
      `🏁 [Fin de Temporada] Ha concluido oficialmente la temporada. ¡Bienvenido a la nueva temporada ${nuevaTemporadaName}!`,
      `📦 [Academia] Se ha publicado el Informe de la Academia con las nuevas promesas de la cantera.`,
      `🏆 [Copas Internacionales] Se han sorteado los fixtures de la Copa de Campeones y la Copa Continental para la nueva temporada.`,
      ...noticiasCopaRota
    ];

    setNoticias(prev => [...nuevasNoticiasCierre, ...prev]);
  }, [jugadores, equipos, liga, fixture]);

  const cerrarReporteAcademia = useCallback(() => {
    setReporteAcademia(null);
  }, []);

  // Marcar/desmarcar jugador propio como intransferible
  const toggleIntransferible = useCallback((jugadorId: string) => {
    setJugadores(prev => prev.map(j =>
      j.id === jugadorId ? { ...j, intransferible: !j.intransferible } : j
    ));
  }, []);

  const establecerRolTactico = useCallback((jugadorId: string, rol: 'Hombre de Área' | 'Delantero Avanzado' | 'Pivote Defensivo' | 'Organizador' | null) => {
    setJugadores(prev => prev.map(j =>
      j.id === jugadorId ? { ...j, rolTactico: rol } : j
    ));
  }, []);

  const establecerEnfoqueEntrenamiento = useCallback((enfoque: 'Físico' | 'Táctico' | 'Técnico') => {
    if (!equipoUsuarioId) return;
    setEquipos(prev => prev.map(e =>
      e.id === equipoUsuarioId ? { ...e, enfoqueEntrenamiento: enfoque } : e
    ));
  }, [equipoUsuarioId]);

  const establecerEntrenamientoIndividual = useCallback((jugadorId: string, atributo: keyof AtributosJugador | null) => {
    setJugadores(prev => prev.map(j =>
      j.id === jugadorId ? { ...j, entrenamientoIndividual: atributo } : j
    ));
  }, []);

  const establecerPateadorPenales = useCallback((jugadorId: string) => {
    setJugadores(prev => {
      const jugador = prev.find(j => j.id === jugadorId);
      if (!jugador) return prev;
      return prev.map(j => {
        if (j.idEquipo === jugador.idEquipo) {
          return {
            ...j,
            esPateadorPenales: j.id === jugadorId
          };
        }
        return j;
      });
    });
  }, []);

  const establecerPateadorTirosLibres = useCallback((jugadorId: string) => {
    setJugadores(prev => {
      const jugador = prev.find(j => j.id === jugadorId);
      if (!jugador) {
        return prev.map(j => j.idEquipo === equipoUsuarioId ? { ...j, esPateadorTirosLibres: false } : j);
      }
      return prev.map(j => {
        if (j.idEquipo === jugador.idEquipo) {
          return {
            ...j,
            esPateadorTirosLibres: j.id === jugadorId
          };
        }
        return j;
      });
    });
  }, [equipoUsuarioId]);

  const establecerPateadorCorners = useCallback((jugadorId: string) => {
    setJugadores(prev => {
      const jugador = prev.find(j => j.id === jugadorId);
      if (!jugador) {
        return prev.map(j => j.idEquipo === equipoUsuarioId ? { ...j, esPateadorCorners: false } : j);
      }
      return prev.map(j => {
        if (j.idEquipo === jugador.idEquipo) {
          return {
            ...j,
            esPateadorCorners: j.id === jugadorId
          };
        }
        return j;
      });
    });
  }, [equipoUsuarioId]);

  const establecerEstrategiaCorner = useCallback((estrategia: 'Atacar el primer palo' | 'Centro al área chica' | 'Jugar en corto') => {
    if (!equipoUsuarioId) return;
    setEquipos(prev => prev.map(e =>
      e.id === equipoUsuarioId ? { ...e, estrategiaCorner: estrategia } : e
    ));
  }, [equipoUsuarioId]);

  const establecerEstrategiaPases = useCallback((estrategia: 'Cortos' | 'Combinados' | 'Largos al espacio') => {
    if (!equipoUsuarioId) return;
    setEquipos(prev => prev.map(e =>
      e.id === equipoUsuarioId ? { ...e, estrategiaPases: estrategia } : e
    ));
  }, [equipoUsuarioId]);

  // ============================================================
  // RESOLVER EVENTO ALEATORIO DE VESTUARIO
  // ============================================================
  const resolverEvento = useCallback((opcionId: string) => {
    if (!eventoActivo || !equipoUsuarioId) return;

    const opcion = eventoActivo.opciones.find(o => o.id === opcionId);
    if (!opcion) return;

    const efecto = opcion.efecto;
    const jugadorProtagonistId = eventoActivo.jugadorId;

    // Aplicar efectos sobre jugadores
    setJugadores(prev => prev.map(j => {
      if (j.idEquipo !== equipoUsuarioId) return j;

      let updates: Partial<Jugador> = {};

      // Efecto sobre el protagonista
      if (jugadorProtagonistId && j.id === jugadorProtagonistId) {
        if (efecto.jugadorMoral !== undefined) {
          updates.moral = Math.max(1, Math.min(100, j.moral + efecto.jugadorMoral));
        }
        if (efecto.jugadorForma !== undefined) {
          updates.formaFisica = Math.max(1, Math.min(100, j.formaFisica + efecto.jugadorForma));
        }
        if (efecto.jugadorPa !== undefined) {
          updates.pa = Math.max(j.ca, Math.min(100, j.pa + efecto.jugadorPa));
        }
        if (efecto.jugadorCa !== undefined) {
          updates.ca = Math.max(1, Math.min(j.pa, j.ca + efecto.jugadorCa));
        }
      }

      // Efecto sobre el capitán (personalidad Líder)
      if (efecto.moralCapitan !== undefined && j.personalidad === 'Líder') {
        updates.moral = Math.max(1, Math.min(100, (updates.moral ?? j.moral) + efecto.moralCapitan));
      }

      // Efecto moral general del equipo
      if (efecto.moralEquipo !== undefined) {
        updates.moral = Math.max(1, Math.min(100, (updates.moral ?? j.moral) + efecto.moralEquipo));
      }

      return Object.keys(updates).length > 0 ? { ...j, ...updates } : j;
    }));

    // Efecto sobre presupuesto del club
    if (efecto.presupuesto !== undefined) {
      setEquipos(prev => prev.map(e =>
        e.id === equipoUsuarioId
          ? { ...e, presupuestoFichajes: e.presupuestoFichajes + efecto.presupuesto! }
          : e
      ));
    }

    // Efecto sobre confianza de la directiva
    if (efecto.confianzaDirectiva !== undefined) {
      setConfianzaDirectiva(prev => Math.max(0, Math.min(100, prev + efecto.confianzaDirectiva!)));
    }

    // Noticia informando al usuario de la resolución
    const noticia = `🎲 [Evento Vestuario] "${eventoActivo.titulo}" — Decisión: "${opcion.texto}". ${opcion.descripcionEfecto}`;
    setNoticias(prev => [noticia, ...prev]);

    // Cerrar el evento
    setEventoActivo(null);
  }, [eventoActivo, equipoUsuarioId]);

  // ============================================================
  // DESTITUCIÓN AUTOMÁTICA POR BAJA CONFIANZA (< 20%)
  // ============================================================
  React.useEffect(() => {
    if (juegoIniciado && equipoUsuarioId && confianzaDirectiva < 20) {
      const club = equipos.find(p => p.id === equipoUsuarioId);
      const clubNombre = club?.nombre || "Club";

      setReputacionManager(prev => Math.max(0, prev - 20));
      setEquipos(prev => prev.map(e => e.id === equipoUsuarioId ? { ...e, sinEntrenador: true } : e));
      setNoticias(prev => [
        `🚨 [DESPIDO DE MÁNAGER] La directiva del ${clubNombre} ha rescindido de forma inmediata el contrato del mánager ${nombreManager} por la pérdida crítica de apoyo institucional (Confianza < 20%).`,
        ...prev
      ]);
      setEquipoUsuarioId(null);
      setConfianzaDirectiva(70);
    }
  }, [confianzaDirectiva, equipoUsuarioId, juegoIniciado, equipos, nombreManager]);

  // ============================================================
  // RESOLVER REUNIÓN PRIVADA EN LA OFICINA DEL MÁNAGER
  // ============================================================
  const resolverReunionPrivada = useCallback((decision: 'promesa' | 'autoritario' | 'salida') => {
    if (!reunionPrivadaActiva || !equipoUsuarioId) return;

    const { jugadorId, jugadorNombre } = reunionPrivadaActiva;

    setJugadores(prev => prev.map(j => {
      if (j.id !== jugadorId) return j;

      let updates: Partial<Jugador> = {};

      if (decision === 'promesa') {
        updates.moral = Math.min(100, j.moral + 20);
        updates.promesaTitularPendiente = true;
        if (j.promesas) {
          updates.promesas = j.promesas.map(p =>
            p.estado === 'Incumplida' ? { ...p, estado: 'En proceso' as const } : p
          );
        }
      } else if (decision === 'autoritario') {
        updates.moral = Math.max(1, j.moral - 15);
        if (reputacionManager >= 70) {
          updates.atributos = {
            ...j.atributos,
            determinacion: Math.min(20, j.atributos.determinacion + 2)
          };
        }
      } else if (decision === 'salida') {
        updates.listaTransferibles = true;
        updates.moral = Math.min(100, j.moral + 5);
        if (j.promesas) {
          updates.promesas = j.promesas.map(p =>
            p.estado === 'Incumplida' ? { ...p, estado: 'En proceso' as const } : p
          );
        }
      }

      return { ...j, ...updates };
    }));

    const msgs = {
      promesa: `🤝 [Oficina del Mánager] Le prometiste titularidad a ${jugadorNombre}. Su moral mejoró +20. ¡Ahora cumplí tu palabra!`,
      autoritario: `💪 [Oficina del Mánager] Mantuviste posición firme con ${jugadorNombre}. Su moral bajó un poco${reputacionManager >= 70 ? ', pero su Determinación mejoró +2 gracias a tu reputación' : ''}.`,
      salida: `📤 [Oficina del Mánager] ${jugadorNombre} acepta ser puesto en la lista de transferibles. Está disponible para negociaciones.`
    };

    setNoticias(prev => [msgs[decision], ...prev]);
    setReunionPrivadaActiva(null);
  }, [reunionPrivadaActiva, equipoUsuarioId, reputacionManager]);

  // ============================================================
  // ACEPTAR OFERTA DE EMPLEO
  // ============================================================
  const aceptarOfertaEmpleo = useCallback((nuevoEquipoId: string) => {
    const nuevoClub = equipos.find(e => e.id === nuevoEquipoId);
    if (!nuevoClub) return;

    // Quitar la marca de vacante del nuevo club
    setEquipos(prev => prev.map(e => e.id === nuevoEquipoId ? { ...e, sinEntrenador: false } : e));

    // Determinar en qué liga está el nuevo equipo
    let leagueId = 'la-liga';
    let leagueName = 'La Liga EA Sports';
    let leagueCountry = 'España';
    let leagueTeamsStatic = equiposLaLiga;

    if (equiposPremier.some(e => e.id === nuevoEquipoId)) {
      leagueId = 'premier-league';
      leagueName = 'Premier League';
      leagueCountry = 'Inglaterra';
      leagueTeamsStatic = equiposPremier;
    } else if (equiposSerieA.some(e => e.id === nuevoEquipoId)) {
      leagueId = 'serie-a';
      leagueName = 'Serie A';
      leagueCountry = 'Italia';
      leagueTeamsStatic = equiposSerieA;
    } else if (equiposBundesliga.some(e => e.id === nuevoEquipoId)) {
      leagueId = 'bundesliga';
      leagueName = 'Bundesliga';
      leagueCountry = 'Alemania';
      leagueTeamsStatic = equiposBundesliga;
    }

    const esMismaLiga = liga.id === leagueId;

    if (esMismaLiga) {
      setEquipoUsuarioId(nuevoEquipoId);
      setConfianzaDirectiva(75);
      setDerrotasConsecutivas(0);
      setNoticias(prev => [
        `💼 [Nuevo Club] El mánager ${nombreManager} ha asumido como director técnico de ${nuevoClub.nombre}.`,
        ...prev
      ]);
    } else {
      // Cambio de liga
      const leagueTeams = leagueTeamsStatic;
      const newTabla: TablaEquipo[] = leagueTeams.map(e => ({
        idEquipo: e.id,
        nombreEquipo: e.nombre,
        partidosJugados: 0,
        ganados: 0,
        empatados: 0,
        perdidos: 0,
        golesFavor: 0,
        golesContra: 0,
        diferenciaGoles: 0,
        puntos: 0,
        forma: []
      }));

      const dateObj = new Date(fechaActual + 'T12:00:00');
      const anioActual = dateObj.getFullYear();

      setLiga({
        id: leagueId,
        nombre: leagueName,
        pais: leagueCountry,
        temporada: liga.temporada,
        equipos: leagueTeams,
        tabla: newTabla
      });

      const nuevaFechaInicioStr = `${anioActual}-08-17`;
      const nuevoFixture = generarFixtureRoundRobin(
        leagueTeams.map(e => e.id),
        nuevaFechaInicioStr
      );

      setFixture(nuevoFixture);
      setFechaActual(`${anioActual}-07-01`);

      const nuevaCopa = inicializarCopa(equipos, nuevaFechaInicioStr, 'champions', leagueTeams, leagueCountry);
      const nuevaCopaEu = inicializarCopa(equipos, nuevaFechaInicioStr, 'europa', leagueTeams, leagueCountry);
      setCopaCampeones(nuevaCopa);
      setCopaEuropa(nuevaCopaEu);

      setEquipoUsuarioId(nuevoEquipoId);
      setConfianzaDirectiva(75);
      setDerrotasConsecutivas(0);

      setNoticias(prev => [
        `💼 [Nuevo Club] El mánager ${nombreManager} ha asumido como director técnico de ${nuevoClub.nombre}. Se muda a la liga ${leagueName} y comenzará la pretemporada.`,
        ...prev
      ]);
    }
  }, [equipos, liga, fechaActual, nombreManager]);

  // ============================================================
  // GUARDAR SORTEO DE COPA
  // ============================================================
  const guardarSorteoCopa = useCallback((
    tipo: 'champions' | 'europa',
    grupos: GrupoCopa[],
    partidosGrupos: any[],
    fase: 'grupos' | 'cuartos',
    partidosCuartos?: PartidoCopa[]
  ) => {
    const isChampions = tipo === 'champions';
    if (fase === 'grupos') {
      if (isChampions) {
        setCopaCampeones(prev => prev ? { ...prev, grupos, partidosGrupos, faseActual: 'grupos' } : null);
        setSorteoCampeonesGruposVisto(true);
      } else {
        setCopaEuropa(prev => prev ? { ...prev, grupos, partidosGrupos, faseActual: 'grupos' } : null);
        setSorteoEuropaGruposVisto(true);
      }

      const userClub = equipos.find(e => e.id === equipoUsuarioId);
      const userGroup = grupos.find(g => g.equipos.includes(equipoUsuarioId || ''));
      let text = '';
      if (userGroup && userClub) {
        const rivals = userGroup.equipos
          .filter(id => id !== equipoUsuarioId)
          .map(id => equipos.find(e => e.id === id)?.nombre || id);
        text = ` Tu club (${userClub.nombre}) competirá en el Grupo ${userGroup.id} contra: ${rivals.join(', ')}.`;
      }
      setNoticias(prev => [
        `🏆 [Sorteo Completado] Fixture y grupos de la ${isChampions ? 'Copa de Campeones' : 'Copa Europa'} definidos formalmente.${text}`,
        ...prev
      ]);
    } else {
      if (isChampions) {
        setCopaCampeones(prev => prev ? { ...prev, cuartos: partidosCuartos ? { fecha: prev.cuartos?.fecha || '', partidos: partidosCuartos } : null, faseActual: 'cuartos' } : null);
        setSorteoCampeonesCuartosVisto(true);
      } else {
        setCopaEuropa(prev => prev ? { ...prev, cuartos: partidosCuartos ? { fecha: prev.cuartos?.fecha || '', partidos: partidosCuartos } : null, faseActual: 'cuartos' } : null);
        setSorteoEuropaCuartosVisto(true);
      }

      let text = '';
      if (partidosCuartos && equipoUsuarioId) {
        const match = partidosCuartos.find(p => p.localId === equipoUsuarioId || p.visitanteId === equipoUsuarioId);
        if (match) {
          const rivalId = match.localId === equipoUsuarioId ? match.visitanteId : match.localId;
          const rivalName = equipos.find(e => e.id === rivalId)?.nombre || rivalId;
          text = ` ¡Tu equipo se enfrentará a ${rivalName} en los Cuartos de Final!`;
        }
      }
      setNoticias(prev => [
        `🏆 [Sorteo Completado] Cruces de Cuartos de Final de la ${isChampions ? 'Copa de Campeones' : 'Copa Europa'} confirmados.${text}`,
        ...prev
      ]);
    }
    setSorteoCopaActivo(null);
  }, [equipoUsuarioId, equipos]);

  // ============================================================
  // ACCIONES COMPLEMENTARIAS
  // ============================================================
  const toggleTransferible = useCallback((jugadorId: string) => {
    setJugadores(prev => prev.map(j =>
      j.id === jugadorId ? { ...j, listaTransferibles: !j.listaTransferibles, intransferible: false } : j
    ));
  }, []);

  const designarCapitan = useCallback((jugadorId: string) => {
    setJugadores(prev => {
      const p = prev.find(v => v.id === jugadorId);
      if (!p) return prev;
      setNoticias(v => [`👑 [Capitán] Has designado a ${p.nombre} como el nuevo capitán de tu plantilla.`, ...v]);
      return prev.map(v => v.idEquipo === p.idEquipo ? { ...v, esCapitan: v.id === jugadorId } : v);
    });
  }, []);

  const darCharlaMotivacional = useCallback(() => {
    if (!equipoUsuarioId) return { exito: false, mensaje: "No hay equipo seleccionado." };
    let msg = "";
    let ok = false;
    setEquipos(prev => {
      const v = prev.find(F => F.id === equipoUsuarioId);
      if (!v) return prev;
      if (v.semanaCharlaRealizada) {
        msg = "Ya diste una charla motivacional esta semana. Esperá al próximo lunes.";
        return prev;
      }
      ok = true;
      msg = "¡La charla motivacional fue todo un éxito! El plantel se siente más unido y enfocado (+3 Química de Vestuario).";
      setNoticias(F => ["🗣️ [Charla Motivacional] El DT reunió al plantel para una charla motivacional. ¡La unión del vestuario mejora! (+3 Química).", ...F]);
      setJugadores(F => F.map(j => j.idEquipo === equipoUsuarioId ? { ...j, moral: Math.min(100, j.moral + 5) } : j));
      return prev.map(F => F.id === equipoUsuarioId ? { ...F, quimicaVestuario: Math.min(100, (F.quimicaVestuario || 70) + 3), semanaCharlaRealizada: true } : F);
    });
    return { exito: ok, mensaje: msg };
  }, [equipoUsuarioId]);

  const organizarActividadCohesion = useCallback(() => {
    if (!equipoUsuarioId) return { exito: false, mensaje: "No hay equipo seleccionado." };
    let msg = "";
    let ok = false;
    const cost = 20000;
    setEquipos(prev => {
      const v = prev.find(F => F.id === equipoUsuarioId);
      if (!v) return prev;
      if (v.semanaActividadRealizada) {
        msg = "Ya organizaste una actividad de cohesión esta semana. Esperá al próximo lunes.";
        return prev;
      }
      if (v.presupuestoFichajes < cost) {
        msg = `Presupuesto insuficiente. La actividad cuesta ${formatearMoneda(cost)} pero solo tenés ${formatearMoneda(v.presupuestoFichajes)}.`;
        return prev;
      }
      ok = true;
      msg = "¡La actividad de cohesión (cena y paintball) fue genial! El vestuario está en sintonía (+7 Química de Vestuario).";
      setNoticias(F => [`🤝 [Cohesión de Grupo] El DT organizó una actividad recreativa para el vestuario (-${formatearMoneda(cost)}). ¡Gran ambiente en el grupo! (+7 Química).`, ...F]);
      setJugadores(F => F.map(j => j.idEquipo === equipoUsuarioId ? { ...j, moral: Math.min(100, j.moral + 10) } : j));
      return prev.map(F => F.id === equipoUsuarioId ? { ...F, presupuestoFichajes: F.presupuestoFichajes - cost, quimicaVestuario: Math.min(100, (F.quimicaVestuario || 70) + 7), semanaActividadRealizada: true } : F);
    });
    return { exito: ok, mensaje: msg };
  }, [equipoUsuarioId]);

  const ofrecerContratoLibre = useCallback((jugadorId: string, salarioSemanal: number, clausulaRescision?: number) => {
    if (!equipoUsuarioId) return { aceptado: false, mensaje: "No has seleccionado un club." };
    const v = jugadores.find(k => k.id === jugadorId);
    if (!v) return { aceptado: false, mensaje: "Jugador no encontrado." };
    if (!v.mesesContrato || v.mesesContrato > 6) return { aceptado: false, mensaje: "Este jugador tiene más de 6 meses de contrato y no se puede negociar libremente." };

    const F = equipos.find(k => k.id === equipoUsuarioId)!;
    const minSalary = Math.max(v.salarioSemanal * 1.15, Math.round(v.ca ** 2 * 35));
    let ok = false;
    let msg = "";

    if (salarioSemanal >= minSalary) {
      ok = true;
      msg = `¡Preacuerdo Firmado! ${v.nombre} ha aceptado tus términos de contrato (${formatearMoneda(salarioSemanal)}/sem y cláusula de ${clausulaRescision ? formatearMoneda(clausulaRescision) : 'Sin cláusula'}). Se unirá al ${F.nombre} libre de contrato el 1 de Julio.`;
      setJugadores(prev => prev.map(j => j.id === jugadorId ? { ...j, preacuerdoClubId: equipoUsuarioId, preacuerdoSalario: salarioSemanal, preacuerdoClausula: clausulaRescision } : j));
      setNoticias(prev => [`🤝 [Preacuerdo Bosman] ¡Acuerdo para la próxima temporada! El mánager del ${F.nombre} ha cerrado la incorporación libre de ${v.nombre} para el próximo 1 de Julio.`, ...prev]);
    } else {
      ok = false;
      msg = `Rechazado. El representante de ${v.nombre} exige un salario semanal de al menos ${formatearMoneda(minSalary)}/sem.`;
    }
    return { aceptado: ok, mensaje: msg };
  }, [jugadores, equipos, equipoUsuarioId]);



  return (
    <GameContext.Provider
      value={{
        equipos,
        jugadores,
        liga,
        fechaActual,
        equipoUsuarioId,
        equipoUsuario,
        partidoReciente,
        noticias,
        mesesEnQuiebra,
        confianzaDirectiva,
        ruedaPrensaActiva,
        derrotasConsecutivas,
        ofertaRecibidaActiva,
        fixture,
        reporteAcademia,
        partidoEnVivo,
        charlaActiva,
        copaCampeones,
        copaEuropa,
        seleccionarEquipo,
        avanzarDia,
        actualizarJugador,
        actualizarTabla,
        reiniciarPartida,
        cerrarPartidoReciente,
        comprarJugador,
        limpiarNoticias,
        toggleTitular,
        asignarJugadorEnNodo,
        actualizarPosicionesTacticas,
        actualizarTactica,
        renovarContrato,
        responderRuedaPrensa,
        aceptarOfertaRecibida,
        rechazarOfertaRecibida,
        contraofertarRecibida,
        finalizarPartidoEnVivo,
        resolverCharla,
        finalizarTemporada,
        cerrarReporteAcademia,
        toggleIntransferible,
        establecerRolTactico,
        establecerEnfoqueEntrenamiento,
        establecerEntrenamientoIndividual,
        establecerPateadorPenales,
        establecerPateadorTirosLibres,
        establecerPateadorCorners,
        establecerEstrategiaCorner,
        establecerEstrategiaPases,
        eventoActivo,
        resolverEvento,
        deadlineDayActivo,
        horasDeadline,
        jugadoresAgentes,
        avanzarHoraDeadline,
        comprarJugadorAgente,
        nombreManager,
        reputacionManager,
        historialTitulos,
        juegoIniciado,
        aceptarOfertaEmpleo,
        reunionPrivadaActiva,
        resolverReunionPrivada,
        sorteoCopaActivo,
        guardarSorteoCopa,
        toggleTransferible,
        designarCapitan,
        darCharlaMotivacional,
        organizarActividadCohesion,
        ofrecerContratoLibre,
        feedHinchada
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

