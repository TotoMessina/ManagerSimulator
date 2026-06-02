// @refresh reset
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Equipo, Jugador, Liga, TablaEquipo, Jornada, Formacion, EstiloJuego, OpcionPrensa, RuedaPrensa, OfertaRecibida, Posicion, PersonalidadJugador, CharlaJugador, AcademiaReporte, CopaCampeones, TablaCopa, PartidoCopa, GrupoCopa } from '../types';
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
  partidoEnVivo: { local: Equipo; visitante: Equipo; jornada: Jornada; tipo?: 'liga' | 'copa'; grupoId?: string; partidoId?: string } | null;
  charlaActiva: CharlaJugador | null;
  copaCampeones: CopaCampeones | null;
  
  // Acciones / Modificadores del Estado
  seleccionarEquipo: (equipoId: string) => void;
  avanzarDia: () => void;
  actualizarJugador: (jugadorId: string, nuevosDatos: Partial<Jugador>) => void;
  actualizarTabla: (nuevaTabla: TablaEquipo[]) => void;
  reiniciarPartida: () => void;
  cerrarPartidoReciente: () => void;
  comprarJugador: (jugadorId: string, oferta: number) => { aceptado: boolean; mensaje: string };
  limpiarNoticias: () => void;
  toggleTitular: (jugadorId: string) => void;
  asignarJugadorEnNodo: (jugadorId: string) => void;
  actualizarPosicionesTacticas: (posiciones: Record<string, string | null>) => void;
  actualizarTactica: (formacion: Formacion, estiloJuego: EstiloJuego) => void;
  renovarContrato: (jugadorId: string, nuevoSalario: number) => void;
  responderRuedaPrensa: (opcionTipo: 'proteger' | 'critica' | 'evasiva') => void;
  aceptarOfertaRecibida: () => void;
  rechazarOfertaRecibida: () => void;
  contraofertarRecibida: (monto: number) => { aceptado: boolean; mensaje: string };
  finalizarPartidoEnVivo: (golesLocal: number, golesVisitante: number, eventos: string[], jugadoresActualizados: Jugador[]) => void;
  resolverCharla: (decision: 'prometer' | 'vender' | 'sancionar') => void;
  finalizarTemporada: () => void;
  cerrarReporteAcademia: () => void;
  toggleIntransferible: (jugadorId: string) => void;
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

const inicializarCopaCampeones = (
  equiposList: Equipo[],
  fechaInicio: string,
  clasificadosLaLiga?: Equipo[]
): CopaCampeones => {
  const obtenerPaisEquipoLocal = (equipoId: string): 'espana' | 'inglaterra' | 'italia' | 'alemania' => {
    if (['real-madrid', 'barcelona', 'atletico-madrid', 'sevilla', 'real-sociedad', 'athletic-bilbao', 'villarreal', 'betis', 'valencia', 'osasuna', 'getafe', 'rayo'].includes(equipoId)) return 'espana';
    if (['manchester-city', 'arsenal', 'liverpool', 'chelsea', 'manchester-united', 'tottenham', 'newcastle', 'aston-villa', 'brighton', 'west-ham', 'crystal-palace', 'everton'].includes(equipoId)) return 'inglaterra';
    if (['inter-milan', 'ac-milan', 'juventus', 'napoli', 'roma', 'lazio', 'atalanta', 'fiorentina', 'torino', 'bologna', 'udinese', 'lecce'].includes(equipoId)) return 'italia';
    return 'alemania';
  };

  let esp: Equipo[] = [];
  if (clasificadosLaLiga && clasificadosLaLiga.length >= 4) {
    esp = clasificadosLaLiga.slice(0, 4);
  } else {
    esp = [...equiposList]
      .filter(e => obtenerPaisEquipoLocal(e.id) === 'espana')
      .sort((a, b) => b.reputacion - a.reputacion)
      .slice(0, 4);
  }

  const eng = [...equiposList]
    .filter(e => obtenerPaisEquipoLocal(e.id) === 'inglaterra')
    .sort((a, b) => b.reputacion - a.reputacion)
    .slice(0, 4);

  const ita = [...equiposList]
    .filter(e => obtenerPaisEquipoLocal(e.id) === 'italia')
    .sort((a, b) => b.reputacion - a.reputacion)
    .slice(0, 4);

  const participantes = [
    ...esp.map(e => e.id),
    ...eng.map(e => e.id),
    ...ita.map(e => e.id)
  ];

  const grupoA = [esp[0].id, eng[1].id, ita[2].id, esp[3].id];
  const grupoB = [eng[0].id, ita[1].id, esp[2].id, eng[3].id];
  const grupoC = [ita[0].id, esp[1].id, eng[2].id, ita[3].id];

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
    { id: 'C', equipos: grupoC, tabla: crearTablaGrupo(grupoC) }
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
          id: `copa-${grupoId}-j${jornadaNum}-p${pIdx}`,
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
    ...programarGrupo('C', grupoC)
  ];

  return {
    participantes,
    grupos,
    faseActual: 'grupos',
    partidosGrupos,
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
  equipoUsuarioId: string | null
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

    // 1. Simulación de recuperación física (Los no titulares/suplentes recuperan forma más rápido: +10, los titulares +3)
    if (jugadorClon.formaFisica < 100) {
      const recuperacion = jugadorClon.titular ? 3 : 10;
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
  const [partidoEnVivo, setPartidoEnVivo] = useState<{ local: Equipo; visitante: Equipo; jornada: Jornada; tipo?: 'liga' | 'copa'; grupoId?: string; partidoId?: string } | null>(null);
  const [charlaActiva, setCharlaActiva] = useState<CharlaJugador | null>(null);
  const [copaCampeones, setCopaCampeones] = useState<CopaCampeones | null>(() => {
    return inicializarCopaCampeones(equiposIniciales, '2026-08-17');
  });
  
  // Estado para las noticias de prensa del vestuario
  const [noticias, setNoticias] = useState<string[]>([
    '📰 Oficina de Prensa: ¡Te damos la bienvenida a tu nueva carrera! Planificá los entrenamientos y prepará tus fichajes en el mercado.'
  ]);

  // Derivado: Datos completos del equipo del usuario
  const equipoUsuario = equipos.find(e => e.id === equipoUsuarioId) || null;

  const obtenerJornadaCopaHoy = useCallback((fecha: string): { tipo: 'grupos' | 'semifinales' | 'final'; matchdays: { fecha: string; partidos: PartidoCopa[]; grupoId?: string }[] } | null => {
    if (!copaCampeones) return null;
    if (copaCampeones.faseActual === 'grupos') {
      const matchdays = copaCampeones.partidosGrupos.filter(jg => jg.fecha === fecha);
      if (matchdays.length > 0 && matchdays.some(jg => jg.partidos.some(p => !p.jugado))) {
        return { tipo: 'grupos', matchdays };
      }
    } else if (copaCampeones.faseActual === 'semifinales') {
      const semi = copaCampeones.semifinales;
      if (semi && semi.fecha === fecha && semi.partidos.some(p => !p.jugado)) {
        return { tipo: 'semifinales', matchdays: [semi] };
      }
    } else if (copaCampeones.faseActual === 'final') {
      const fin = copaCampeones.final;
      if (fin && fin.fecha === fecha && !fin.partido.jugado) {
        return { tipo: 'final', matchdays: [{ fecha, partidos: [fin.partido] }] };
      }
    }
    return null;
  }, [copaCampeones]);

  const procesarTransicionCopa = useCallback((copa: CopaCampeones): CopaCampeones => {
    const copiaCopa = { ...copa };
    if (copiaCopa.faseActual === 'grupos') {
      const totalJugados = copiaCopa.partidosGrupos.reduce((sum, jg) => sum + jg.partidos.filter(p => p.jugado).length, 0);
      if (totalJugados === 36) {
        const winners: { id: string; pts: number; gd: number; gf: number }[] = [];
        const runnersUp: { id: string; pts: number; gd: number; gf: number }[] = [];
        
        copiaCopa.grupos.forEach(grupo => {
          const tablaOrdenada = [...grupo.tabla].sort((a, b) => {
            if (b.puntos !== a.puntos) return b.puntos - a.puntos;
            if (b.diferenciaGoles !== a.diferenciaGoles) return b.diferenciaGoles - a.diferenciaGoles;
            return b.golesFavor - a.golesFavor;
          });
          
          const w = tablaOrdenada[0];
          const r = tablaOrdenada[1];
          winners.push({ id: w.idEquipo, pts: w.puntos, gd: w.diferenciaGoles, gf: w.golesFavor });
          runnersUp.push({ id: r.idEquipo, pts: r.puntos, gd: r.diferenciaGoles, gf: r.golesFavor });
        });
        
        winners.sort((a, b) => {
          if (b.pts !== a.pts) return b.pts - a.pts;
          if (b.gd !== a.gd) return b.gd - a.gd;
          return b.gf - a.gf;
        });
        
        runnersUp.sort((a, b) => {
          if (b.pts !== a.pts) return b.pts - a.pts;
          if (b.gd !== a.gd) return b.gd - a.gd;
          return b.gf - a.gf;
        });
        
        const w1 = winners[0].id;
        const w2 = winners[1].id;
        const w3 = winners[2].id;
        const bestRunnerUp = runnersUp[0].id;
        
        const fechaRound6 = copiaCopa.partidosGrupos.find(jg => jg.jornada === 6)!.fecha;
        const fechaSemi = sumarDias(fechaRound6, 21);
        
        copiaCopa.semifinales = {
          fecha: fechaSemi,
          partidos: [
            { id: 'copa-semi-1', localId: w1, visitanteId: bestRunnerUp, jugado: false },
            { id: 'copa-semi-2', localId: w2, visitanteId: w3, jugado: false }
          ]
        };
        copiaCopa.faseActual = 'semifinales';
        
        const nameW1 = equipos.find(e => e.id === w1)?.nombre || w1;
        const nameBestRunner = equipos.find(e => e.id === bestRunnerUp)?.nombre || bestRunnerUp;
        const nameW2 = equipos.find(e => e.id === w2)?.nombre || w2;
        const nameW3 = equipos.find(e => e.id === w3)?.nombre || w3;
        
        setNoticias(prev => [
          `🏆 [Copa de Campeones] ¡Definidas las Semifinales continentales! Cruces: ${nameW1} vs ${nameBestRunner} y ${nameW2} vs ${nameW3}. Partidos programados para el ${fechaSemi}.`,
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
          partido: { id: 'copa-final', localId: wSemi1, visitanteId: wSemi2, jugado: false }
        };
        copiaCopa.faseActual = 'final';
        
        const nameSemi1 = equipos.find(e => e.id === wSemi1)?.nombre || wSemi1;
        const nameSemi2 = equipos.find(e => e.id === wSemi2)?.nombre || wSemi2;
        
        setNoticias(prev => [
          `🏆 [Copa de Campeones] ¡Llegó la Gran Final Continental! Se enfrentarán ${nameSemi1} vs ${nameSemi2} el día ${fechaFinal}.`,
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
          `🏆 [Copa de Campeones] ¡HISTÓRICO! El ${nameCampeon} se corona campeón de la Copa de Campeones. ¡Felicidades!`,
          ...prev
        ]);
      }
    }
    return copiaCopa;
  }, [equipos]);

  // --- ACCIONES ---

  // Seleccionar club para dirigir
  const seleccionarEquipo = useCallback((equipoId: string) => {
    setEquipoUsuarioId(equipoId);
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
    grupoId?: string
  ): { updatedCopa: CopaCampeones; noticiasCopa: string[]; recaudaciones: Record<string, number> } => {
    const copiaCopa = { ...copa };
    const noticiasCopa: string[] = [];
    const recaudaciones: Record<string, number> = {};

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
          `🏆 [Copa de Campeones] ${lObj.nombre} avanzó tras vencer a ${vObj.nombre} en la tanda de penales por (${penLocal}-${penVisitante}) luego de empatar ${res.golesLocal}-${res.golesVisitante} en los 90 minutos.`
        );
      } else {
        noticiasCopa.push(
          `🏆 [Copa de Campeones] ${lObj.nombre} ${res.golesLocal} - ${res.golesVisitante} ${vObj.nombre}.`
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
    // A. Verificar si hoy se juega Copa de Campeones
    const jornadaCopaHoy = obtenerJornadaCopaHoy(fechaActual);
    
    if (jornadaCopaHoy && copaCampeones) {
      let userPartido: PartidoCopa | null = null;
      let userMatchday: any = null;
      
      for (const jg of jornadaCopaHoy.matchdays) {
        const found = jg.partidos.find(p => p.localId === equipoUsuarioId || p.visitanteId === equipoUsuarioId);
        if (found && !found.jugado) {
          userPartido = found;
          userMatchday = jg;
          break;
        }
      }
      
      if (userPartido && equipoUsuarioId) {
        // --- EL USUARIO JUEGA HOY EN COPA ---
        let currentCopa = { ...copaCampeones };
        let allNoticiasCopa: string[] = [];
        const recaudacionesCopa: Record<string, number> = {};
        
        jornadaCopaHoy.matchdays.forEach(jg => {
          const partidosSimulables = jg.partidos.filter(p => p.id !== userPartido!.id && !p.jugado);
          const resSim = simularPartidosCopaEnFondo(currentCopa, partidosSimulables, 'grupoId' in jg ? (jg as any).grupoId : undefined);
          currentCopa = resSim.updatedCopa;
          allNoticiasCopa.push(...resSim.noticiasCopa);
          Object.assign(recaudacionesCopa, resSim.recaudaciones);
        });
        
        setCopaCampeones(currentCopa);
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
          partidoId: userPartido!.id
        });
        
        return;
      } else {
        // --- EL USUARIO NO JUEGA HOY EN COPA ---
        let currentCopa = { ...copaCampeones };
        let allNoticiasCopa: string[] = [];
        const recaudacionesCopa: Record<string, number> = {};
        
        jornadaCopaHoy.matchdays.forEach(jg => {
          const partidosSimulables = jg.partidos.filter(p => !p.jugado);
          const resSim = simularPartidosCopaEnFondo(currentCopa, partidosSimulables, 'grupoId' in jg ? (jg as any).grupoId : undefined);
          currentCopa = resSim.updatedCopa;
          allNoticiasCopa.push(...resSim.noticiasCopa);
          Object.assign(recaudacionesCopa, resSim.recaudaciones);
        });
        
        const finalCopa = procesarTransicionCopa(currentCopa);
        setCopaCampeones(finalCopa);
        if (allNoticiasCopa.length > 0) {
          setNoticias(prev => [...allNoticiasCopa, ...prev]);
        }
        
        const { nuevaFecha, nuevosJugadores: stepJugadores, nuevasNoticias, cambioDeMes, esLunes } = ejecutarPasoDelTiempo(fechaActual, jugadores, equipoUsuarioId);
        
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
      const { nuevaFecha, nuevosJugadores: stepJugadores, nuevasNoticias, cambioDeMes, esLunes } = ejecutarPasoDelTiempo(fechaActual, jugadores, equipoUsuarioId);
      
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
    }
  }, [fechaActual, equipos, jugadores, equipoUsuarioId, procesarFinanzasSemanales, intentarGenerarOfertaIA, procesarMercadoFichajesIA, fixture]);
 
  // Cerrar el reporte del partido disputado y avanzar automáticamente de fecha en el calendario
  const cerrarPartidoReciente = useCallback(() => {
    setPartidoReciente(null);

    // Avanzar la fecha y progresar jugadores
    const { nuevaFecha, nuevosJugadores: stepJugadores, nuevasNoticias, cambioDeMes, esLunes } = ejecutarPasoDelTiempo(fechaActual, jugadores, equipoUsuarioId);
    
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
    setCopaCampeones(inicializarCopaCampeones(equiposIniciales, '2026-08-17'));
    setNoticias([
      '📰 Oficina de Prensa: ¡Te damos la bienvenida a tu nueva carrera! Planificá los entrenamientos y prepará tus fichajes en el mercado.'
    ]);
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
  const comprarJugador = useCallback((jugadorId: string, oferta: number) => {
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

      // 2. Re-mapear el club del jugador comprado
      setJugadores(prevJugadores =>
        prevJugadores.map(j =>
          j.id === jugadorId
            ? { ...j, idEquipo: equipoUsuarioId, titular: false }
            : j
        )
      );

      // Agregar a las noticias
      setNoticias(prev => [
        `🤝 [Fichaje] ¡Acuerdo cerrado! El ${clubUsuario.nombre} adquiere los derechos de ${jugador.nombre} ${clubAnterior ? `procedente del ${clubAnterior.nombre}` : 'como Agente Libre'} por la cifra de ${formatearMoneda(oferta)}.`,
        ...prev
      ]);
    }

    return { aceptado, mensaje };
  }, [jugadores, equipos, equipoUsuarioId]);

  // Renovar contrato de un jugador
  const renovarContrato = useCallback((jugadorId: string, nuevoSalario: number) => {
    setJugadores(prevJugadores =>
      prevJugadores.map(j => {
        if (j.id === jugadorId) {
          return {
            ...j,
            salarioSemanal: nuevoSalario,
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

      return jClon;
    });

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

    let penLocal: number | undefined = undefined;
    let penVisitante: number | undefined = undefined;
    if (esCopa && copaCampeones && copaCampeones.faseActual !== 'grupos' && golesLocal === golesVisitante) {
      const shoot = simularTandaPenales();
      penLocal = shoot.penLocal;
      penVisitante = shoot.penVisitante;
      eventos.push(`🏆 [Definición por Penales] ${local.nombreCorto} (${penLocal}) - (${penVisitante}) ${visitante.nombreCorto}.`);
    }

    if (esCopa && copaCampeones) {
      let copiaCopa = { ...copaCampeones };
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

      const finalCopa = procesarTransicionCopa(copiaCopa);
      setCopaCampeones(finalCopa);
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

    // 5. Limpiar partido en vivo
    setPartidoEnVivo(null);
  }, [partidoEnVivo, equipoUsuarioId, derrotasConsecutivas, copaCampeones, procesarTransicionCopa]);

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
    const clasificadosLaLiga = tablaOrdenadaLaLiga.slice(0, 4).map(t => equipos.find(e => e.id === t.idEquipo)!);
    const nuevaCopa = inicializarCopaCampeones(equipos, nuevaFechaInicioStr, clasificadosLaLiga);

    setJugadores(jugadoresFinales);
    setFixture(nuevoFixture);
    setLiga(prevLiga => ({
      ...prevLiga,
      temporada: nuevaTemporadaName,
      tabla: tablaReseteada
    }));
    setFechaActual(nuevaFechaActual);
    setCopaCampeones(nuevaCopa);

    setReporteAcademia({
      retirados: retiradosList,
      promovidos: promovidosList
    });

    setNoticias(prev => [
      `🏁 [Fin de Temporada] Ha concluido oficialmente la temporada. ¡Bienvenido a la nueva temporada ${nuevaTemporadaName}!`,
      `📦 [Academia] Se ha publicado el Informe de la Academia con las nuevas promesas de la cantera.`,
      `🏆 [Copa de Campeones] Se ha sorteado el fixture continental de la Copa de Campeones para la nueva temporada.`,
      ...prev
    ]);
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
        toggleIntransferible
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

