import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/useGame';
import { Jugador, Equipo, Formacion } from '../types';
import { asignarRolesTacticos, obtenerDebilidadEquipo } from '../engine/matchEngine';

// Helper para formatear dinero similar al resto de la app
const formatearMoneda = (valor: number): string => {
  if (valor >= 1000000) {
    return `${(valor / 1000000).toFixed(1)} M€`;
  }
  return `${(valor / 1000).toFixed(0)} m€`;
};

export const LiveMatchView: React.FC = () => {
  const {
    partidoEnVivo,
    jugadores,
    equipoUsuarioId,
    finalizarPartidoEnVivo
  } = useGame();

  if (!partidoEnVivo) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-white flex items-center justify-center">
        <p className="text-slate-400">No hay ningún partido en vivo activo en este momento.</p>
      </div>
    );
  }

  const { local, visitante } = partidoEnVivo;
  const esLocalUsuario = local.id === equipoUsuarioId;
  const equipoUsuario = esLocalUsuario ? local : visitante;
  const equipoRival = esLocalUsuario ? visitante : local;

  // --- ESTADOS DEL PARTIDO ---
  const [minuto, setMinuto] = useState<number>(0);
  const [golesLocal, setGolesLocal] = useState<number>(0);
  const [golesVisitante, setGolesVisitante] = useState<number>(0);
  const [comentarios, setComentarios] = useState<string[]>([]);
  const [posesion, setPosesion] = useState<number>(50);
  const [enJuego, setEnJuego] = useState<boolean>(true);
  const [ordenActiva, setOrdenActiva] = useState<'ataque' | 'presion' | 'retencion' | null>(null);
  const [velocidad, setVelocidad] = useState<number>(500); // Velocidad en ms por minuto (500: Normal, 150: Rápida, 40: Ultra)
  
  // --- ESTADOS DE CHARLAS Y GRITOS TÉCNICOS ---
  const [charlaPreMatch, setCharlaPreMatch] = useState<'motivadora' | 'calmada' | 'tactica' | null>(null);
  const [charlaEntretiempo, setCharlaEntretiempo] = useState<'exigente' | 'apoyo' | 'tactica' | null>(null);
  const [mostrarModalPreMatch, setMostrarModalPreMatch] = useState<boolean>(true);
  const [mostrarModalEntretiempo, setMostrarModalEntretiempo] = useState<boolean>(false);
  const [gritoActivo, setGritoActivo] = useState<'alentar' | 'exigir' | 'tiempo' | null>(null);
  const [gritoMinutoInicio, setGritoMinutoInicio] = useState<number>(0);
  
  // Cartel/Banner destacado para goles o lesiones
  const [eventoDestacado, setEventoDestacado] = useState<{ tipo: 'gol' | 'lesion' | 'tarjeta'; texto: string } | null>(null);
  
  // Cambios y Sustituciones
  const [cambiosRealizados, setCambiosRealizados] = useState<number>(0);
  const [jugadoresEnCancha, setJugadoresEnCancha] = useState<Jugador[]>(() => {
    // Tomar los 11 titulares de cada club o fallback de los 11 mejores
    const pLocal = jugadores.filter(j => j.idEquipo === local.id);
    const pVisitante = jugadores.filter(j => j.idEquipo === visitante.id);
    
    let titLocal = pLocal.filter(j => j.titular && !j.lesionado);
    if (titLocal.length === 0) titLocal = [...pLocal].sort((a, b) => b.ca - a.ca).slice(0, 11);
    
    let titVisitante = pVisitante.filter(j => j.titular && !j.lesionado);
    if (titVisitante.length === 0) titVisitante = [...pVisitante].sort((a, b) => b.ca - a.ca).slice(0, 11);
    
    return [...titLocal, ...titVisitante];
  });

  // Historial de jugadores que pisaron la cancha (para aplicar fatiga al final)
  const jugadoresQueJugaron = useRef<Set<string>>(new Set(jugadoresEnCancha.map(j => j.id)));

  // Estados del modal de sustituciones
  const [modalSustituciones, setModalSustituciones] = useState<boolean>(false);
  const [seleccionSalida, setSeleccionSalida] = useState<Jugador | null>(null);
  const [seleccionEntrada, setSeleccionEntrada] = useState<Jugador | null>(null);

  // Registro de goles y asistencias por jugador durante el vivo
  const goleadoresEnVivo = useRef<Record<string, number>>({});
  const asistidoresEnVivo = useRef<Record<string, number>>({});
  const lesionadosEnVivo = useRef<Record<string, number>>({}); // id -> semanas

  // Refs de estado para el intervalo
  const pausadoPorEvento = useRef<boolean>(false);

  // --- FILTROS DE EQUIPO EN CANCHA ---
  const onceLocal = jugadoresEnCancha.filter(j => j.idEquipo === local.id);
  const onceVisitante = jugadoresEnCancha.filter(j => j.idEquipo === visitante.id);

  const unaVezInicial = useRef<boolean>(false);

  // Mensaje de inicio
  useEffect(() => {
    if (!unaVezInicial.current) {
      const initialComments = [
        `⚽ ¡Comienza la transmisión del partido! Los equipos saltan a la cancha del estadio ${local.estadio}. Asistencia: ${(local.capacidadEstadio * (0.85 + Math.random() * 0.15)).toFixed(0)} espectadores.`,
        `📋 Alineación ${local.nombreCorto}: ${onceLocal.map(j => `${j.nombre} (${j.posicion})`).join(', ')}.`,
        `📋 Alineación ${visitante.nombreCorto}: ${onceVisitante.map(j => `${j.nombre} (${j.posicion})`).join(', ')}.`
      ];

      // Verificar si el usuario tiene el bonus táctico
      const debilidadRival = obtenerDebilidadEquipo(equipoRival.id, jugadores);
      const usuarioUsaEstrategiaValida = equipoUsuario.estrategiaPases === 'Largos al espacio' && equipoUsuario.estrategiaCorner === 'Atacar el primer palo';
      const usuarioTieneBonus = debilidadRival === 'centrales_lentos' && usuarioUsaEstrategiaValida;

      if (usuarioTieneBonus) {
        initialComments.push(
          `🎯 [Analista] ¡Estrategia acertada! La lentitud de los centrales de ${equipoRival.nombreCorto} es explotada por nuestro estilo de pases largos y centros al primer palo (+20% efectividad).`
        );
      }

      setComentarios(initialComments);
      unaVezInicial.current = true;
    }
  }, [local, visitante, jugadores, equipoUsuario, equipoRival]);

  // --- AJUSTE DE ATRIBUTOS POR CHARLAS Y GRITOS TÉCNICOS ---
  const ajustarAtributosPorDT = (
    j: Jugador,
    minutoRef: number,
    customGrito?: 'alentar' | 'exigir' | 'tiempo' | null
  ): Jugador['atributos'] => {
    const isUsuario = j.idEquipo === equipoUsuario.id;
    const baseAtributos = { ...j.atributos };
    if (!isUsuario) return baseAtributos;

    // 0. Aplicar Rol Táctico en el Vivo
    const cat = j.posicion === 'POR' ? 'POR' : (['DFC', 'LD', 'LI'].includes(j.posicion) ? 'DEF' : (['MC', 'MCO'].includes(j.posicion) ? 'MED' : 'DEL'));
    if (j.rolTactico) {
      if (cat === 'DEL' && j.rolTactico === 'Hombre de Área') {
        baseAtributos.remate = Math.min(20, baseAtributos.remate + 3);
        baseAtributos.velocidad = Math.max(1, baseAtributos.velocidad - 3);
      } else if (cat === 'DEL' && j.rolTactico === 'Delantero Avanzado') {
        baseAtributos.velocidad = Math.min(20, baseAtributos.velocidad + 3);
      } else if (cat === 'MED' && j.rolTactico === 'Pivote Defensivo') {
        baseAtributos.defensa = Math.min(20, baseAtributos.defensa + 3);
      } else if (cat === 'MED' && j.rolTactico === 'Organizador') {
        baseAtributos.pase = Math.min(20, baseAtributos.pase + 3);
        baseAtributos.vision = Math.min(20, baseAtributos.vision + 3);
      }
    }

    // 0.5. Aplicar Enfoque Táctico Semanal del Club
    if (equipoUsuario.enfoqueEntrenamiento === 'Táctico') {
      baseAtributos.decisiones = Math.min(20, baseAtributos.decisiones + 2);
      baseAtributos.posicionamiento = Math.min(20, baseAtributos.posicionamiento + 2);
      baseAtributos.vision = Math.min(20, baseAtributos.vision + 2);
      baseAtributos.determinacion = Math.min(20, baseAtributos.determinacion + 2);
    }

    // 1. Aplicar Charla Pre-Partido (minutos 0-45) o Charla Entretiempo (minutos 46-90)
    if (minutoRef <= 45) {
      if (charlaPreMatch === 'motivadora') {
        if (['Ambicioso', 'Líder', 'Profesional'].includes(j.personalidad)) {
          (Object.keys(baseAtributos) as (keyof typeof baseAtributos)[]).forEach(k => {
            baseAtributos[k] = Math.max(1, Math.round(baseAtributos[k] * 1.10));
          });
        } else if (j.personalidad === 'Problemático') {
          (Object.keys(baseAtributos) as (keyof typeof baseAtributos)[]).forEach(k => {
            baseAtributos[k] = Math.max(1, Math.round(baseAtributos[k] * 0.90));
          });
        }
      } else if (charlaPreMatch === 'calmada') {
        if (j.moral < 60) {
          baseAtributos.decisiones = Math.max(1, Math.round(baseAtributos.decisiones * 1.15));
          baseAtributos.reflejos = Math.max(1, Math.round(baseAtributos.reflejos * 1.15));
        }
        if (j.personalidad === 'Ambicioso') {
          (Object.keys(baseAtributos) as (keyof typeof baseAtributos)[]).forEach(k => {
            baseAtributos[k] = Math.max(1, Math.round(baseAtributos[k] * 0.95));
          });
        }
      } else if (charlaPreMatch === 'tactica') {
        baseAtributos.posicionamiento = Math.max(1, Math.round(baseAtributos.posicionamiento * 1.10));
        baseAtributos.decisiones = Math.max(1, Math.round(baseAtributos.decisiones * 1.10));
        baseAtributos.pase = Math.max(1, Math.round(baseAtributos.pase * 1.10));
      }
    } else {
      // Segunda mitad (minutos 46-90)
      if (charlaEntretiempo === 'exigente') {
        const vaGanando = esLocalUsuario ? golesLocal > golesVisitante : golesVisitante > golesLocal;
        if (!vaGanando) {
          if (['Ambicioso', 'Líder', 'Profesional'].includes(j.personalidad)) {
            (Object.keys(baseAtributos) as (keyof typeof baseAtributos)[]).forEach(k => {
              baseAtributos[k] = Math.max(1, Math.round(baseAtributos[k] * 1.15));
            });
          }
          if (j.moral < 60 || j.personalidad === 'Problemático') {
            baseAtributos.decisiones = Math.max(1, Math.round(baseAtributos.decisiones * 0.75));
          }
        } else {
          (Object.keys(baseAtributos) as (keyof typeof baseAtributos)[]).forEach(k => {
            baseAtributos[k] = Math.max(1, Math.round(baseAtributos[k] * 1.05));
          });
        }
      } else if (charlaEntretiempo === 'apoyo') {
        const mult = j.moral < 60 ? 1.15 : 1.10;
        (Object.keys(baseAtributos) as (keyof typeof baseAtributos)[]).forEach(k => {
          baseAtributos[k] = Math.max(1, Math.round(baseAtributos[k] * mult));
        });
      } else if (charlaEntretiempo === 'tactica') {
        baseAtributos.posicionamiento = Math.max(1, Math.round(baseAtributos.posicionamiento * 1.10));
        baseAtributos.defensa = Math.max(1, Math.round(baseAtributos.defensa * 1.10));
        baseAtributos.pase = Math.max(1, Math.round(baseAtributos.pase * 1.10));
      }
    }

    // 2. Aplicar Gritos en Vivo
    const actualGrito = customGrito !== undefined ? customGrito : gritoActivo;
    if (actualGrito) {
      if (actualGrito === 'exigir') {
        const tienePersonalidadExigente = ['Ambicioso', 'Líder', 'Profesional'].includes(j.personalidad) || j.atributos.determinacion >= 15;
        if (tienePersonalidadExigente) {
          baseAtributos.velocidad = Math.max(1, Math.round(baseAtributos.velocidad * 1.10));
          baseAtributos.aceleracion = Math.max(1, Math.round(baseAtributos.aceleracion * 1.10));
          baseAtributos.resistencia = Math.max(1, Math.round(baseAtributos.resistencia * 1.10));
          baseAtributos.fuerza = Math.max(1, Math.round(baseAtributos.fuerza * 1.10));
        }
        const moralBajaOPersonaProblema = j.moral < 50 || j.personalidad === 'Problemático';
        if (moralBajaOPersonaProblema) {
          baseAtributos.decisiones = Math.max(1, Math.round(baseAtributos.decisiones * 0.70));
        }
      } else if (actualGrito === 'alentar') {
        const esLealOMoralBaja = j.moral < 60 || j.personalidad === 'Leal';
        if (esLealOMoralBaja) {
          (Object.keys(baseAtributos) as (keyof typeof baseAtributos)[]).forEach(k => {
            baseAtributos[k] = Math.max(1, Math.round(baseAtributos[k] * 1.10));
          });
        }
        if (j.personalidad === 'Problemático') {
          (Object.keys(baseAtributos) as (keyof typeof baseAtributos)[]).forEach(k => {
            baseAtributos[k] = Math.max(1, Math.round(baseAtributos[k] * 0.95));
          });
        }
      } else if (actualGrito === 'tiempo') {
        baseAtributos.defensa = Math.max(1, Math.round(baseAtributos.defensa * 1.10));
        baseAtributos.posicionamiento = Math.max(1, Math.round(baseAtributos.posicionamiento * 1.10));
        baseAtributos.remate = Math.max(1, Math.round(baseAtributos.remate * 0.80));
        baseAtributos.regate = Math.max(1, Math.round(baseAtributos.regate * 0.80));
      }
    }

    return baseAtributos;
  };

  // --- FUNCIÓN PARA SALTEAR LA SIMULACIÓN Y COMPUTAR EL RESULTADO INSTANTÁNEO ---
  const saltearSimulacion = () => {
    if (!enJuego) return;

    let mActual = minuto;
    let gL = golesLocal;
    let gV = golesVisitante;
    let nuevosComentarios = [...comentarios];
    let posFinal = posesion;

    // Copiar el estado de los jugadores en cancha para simular expulsiones/lesiones
    let canchaActual = [...jugadoresEnCancha];

    // Simular los minutos restantes hasta el 90 de forma síncrona
    let activeGrito = gritoActivo;
    while (mActual < 90) {
      mActual += 1;

      if (mActual >= 90) {
        nuevosComentarios.unshift(
          `🏁 Minuto 90: ¡Final del partido! El árbitro pita el final. Marcador definitivo: ${local.nombre} ${gL} - ${gV} ${visitante.nombre}.`
        );
        break;
      }

      // Desvanecimiento del grito en simulación
      if (activeGrito && mActual >= gritoMinutoInicio + 10) {
        activeGrito = null;
      }

      // --- CÁLCULO DE VALORES DE ATAQUE Y DEFENSA ACTIVO CON PENALIZACIÓN DE POSICIÓN ---
      const onceL = canchaActual.filter(j => j.idEquipo === local.id);
      const onceV = canchaActual.filter(j => j.idEquipo === visitante.id);
      const numL = onceL.length || 1;
      const numV = onceV.length || 1;

      const rolesL = asignarRolesTacticos(onceL, local.formacion || '4-3-3');
      const rolesV = asignarRolesTacticos(onceV, visitante.formacion || '4-3-3');

      const onceLAjustados = rolesL.map(r => {
        const j = r.jugador;
        const comp = r.compatibilidad;
        const dtAjustados = ajustarAtributosPorDT(j, mActual, activeGrito);
        const atributosAjustados = { ...dtAjustados };
        for (const key of Object.keys(atributosAjustados) as (keyof typeof j.atributos)[]) {
          atributosAjustados[key] = Math.max(1, Math.round(atributosAjustados[key] * comp));
        }
        return { ...j, atributos: atributosAjustados };
      });

      const onceVAjustados = rolesV.map(r => {
        const j = r.jugador;
        const comp = r.compatibilidad;
        const dtAjustados = ajustarAtributosPorDT(j, mActual, activeGrito);
        const atributosAjustados = { ...dtAjustados };
        for (const key of Object.keys(atributosAjustados) as (keyof typeof j.atributos)[]) {
          atributosAjustados[key] = Math.max(1, Math.round(atributosAjustados[key] * comp));
        }
        return { ...j, atributos: atributosAjustados };
      });

      let atkL = onceLAjustados.reduce((acc, j) => 
        acc + (j.atributos.remate * 1.5 + j.atributos.regate * 1.2 + j.atributos.pase * 1.2 + j.atributos.velocidad * 1.0 + j.atributos.aceleracion * 1.0 + j.atributos.tecnica * 1.2 + j.atributos.vision * 1.2), 0
      ) / numL;

      let atkV = onceVAjustados.reduce((acc, j) => 
        acc + (j.atributos.remate * 1.5 + j.atributos.regate * 1.2 + j.atributos.pase * 1.2 + j.atributos.velocidad * 1.0 + j.atributos.aceleracion * 1.0 + j.atributos.tecnica * 1.2 + j.atributos.vision * 1.2), 0
      ) / numV;

      let defL = onceLAjustados.reduce((acc, j) => 
        acc + (j.atributos.defensa * 1.8 + j.atributos.fuerza * 1.4 + j.atributos.posicionamiento * 1.4 + j.atributos.decisiones * 1.2 + j.atributos.reflejos * 1.5), 0
      ) / numL;

      let defV = onceVAjustados.reduce((acc, j) => 
        acc + (j.atributos.defensa * 1.8 + j.atributos.fuerza * 1.4 + j.atributos.posicionamiento * 1.4 + j.atributos.decisiones * 1.2 + j.atributos.reflejos * 1.5), 0
      ) / numV;

      // Modificadores de estilo predeterminados
      if (local.estiloJuego === 'Ofensivo') { atkL *= 1.15; defL *= 0.90; }
      else if (local.estiloJuego === 'Defensivo') { atkL *= 0.90; defL *= 1.15; }

      if (visitante.estiloJuego === 'Ofensivo') { atkV *= 1.15; defV *= 0.90; }
      else if (visitante.estiloJuego === 'Defensivo') { atkV *= 0.90; defV *= 1.15; }

      // Bonus de Balón Parado y Scouting del Rival
      const debilidadLocalOpp = obtenerDebilidadEquipo(visitante.id, jugadores);
      const localUsaEstrategiaValida = local.estrategiaPases === 'Largos al espacio' && local.estrategiaCorner === 'Atacar el primer palo';
      const localTieneBonus = debilidadLocalOpp === 'centrales_lentos' && localUsaEstrategiaValida;

      const debilidadVisitanteOpp = obtenerDebilidadEquipo(local.id, jugadores);
      const visitanteUsaEstrategiaValida = visitante.estrategiaPases === 'Largos al espacio' && visitante.estrategiaCorner === 'Atacar el primer palo';
      const visitanteTieneBonus = debilidadVisitanteOpp === 'centrales_lentos' && visitanteUsaEstrategiaValida;

      if (localTieneBonus) atkL *= 1.20;
      if (visitanteTieneBonus) atkV *= 1.20;

      // Modificadores de Órdenes Rápidas (Usuario)
      if (ordenActiva && esLocalUsuario) {
        if (ordenActiva === 'ataque') { atkL *= 1.25; defL *= 0.85; }
        else if (ordenActiva === 'presion') { atkL *= 1.10; defL *= 1.15; }
        else if (ordenActiva === 'retencion') { atkL *= 0.90; defL *= 1.10; }
      } else if (ordenActiva && !esLocalUsuario) {
        if (ordenActiva === 'ataque') { atkV *= 1.25; defV *= 0.85; }
        else if (ordenActiva === 'presion') { atkV *= 1.10; defV *= 1.15; }
        else if (ordenActiva === 'retencion') { atkV *= 0.90; defV *= 1.10; }
      }

      // --- CÁLCULO DE POSESIÓN DINÁMICA ---
      const totalAtk = atkL + atkV;
      let posL = Math.round((atkL / totalAtk) * 100);
      
      if (ordenActiva === 'retencion') {
        if (esLocalUsuario) posL = Math.min(75, posL + 12);
        else posL = Math.max(25, posL - 12);
      }

      posL += Math.floor(Math.random() * 9) - 4; // -4% a +4%
      posL = Math.max(20, Math.min(80, posL));
      posFinal = posL;

      // Eventos
      if (Math.random() < 0.035) {  // 3.5% de probabilidad por minuto (antes 7%)
        const esLocalAtacando = Math.random() < (atkL / totalAtk);
        const randEvento = Math.random();

        if (randEvento < 0.50) {
          // --- OPORTUNIDAD DE GOL ---
          if (esLocalAtacando) {
            const fAtk = atkL * (0.45 + Math.random() * 0.75);
            const fDef = defV * (0.60 + Math.random() * 0.90);

            const deCampo = onceL.filter(j => j.posicion !== 'POR');
            const elegibles = deCampo.length > 0 ? deCampo : onceL;
            const tirador = elegibles[Math.floor(Math.random() * elegibles.length)];

            if (fAtk > fDef) {
              gL += 1;
              goleadoresEnVivo.current[tirador.id] = (goleadoresEnVivo.current[tirador.id] || 0) + 1;
              
              const elegiblesAsist = onceL.filter(j => j.id !== tirador.id);
              const asistidor = elegiblesAsist.length > 0 ? elegiblesAsist[Math.floor(Math.random() * elegiblesAsist.length)] : null;
              const tieneAsistencia = asistidor && Math.random() > 0.30;

              let descGol = '';
              if (tieneAsistencia && asistidor) {
                asistidoresEnVivo.current[asistidor.id] = (asistidoresEnVivo.current[asistidor.id] || 0) + 1;
                descGol = `⚽ Minuto ${mActual}: 🔴 ¡GOOOL de ${local.nombre}! ${tirador.nombre} define de volea tras un gran pase de ${asistidor.nombre}. (Marcador: ${gL}-${gV})`;
              } else {
                descGol = `⚽ Minuto ${mActual}: 🔴 ¡GOOOL de ${local.nombre}! ${tirador.nombre} liquida en un mano a mano con un gran remate. (Marcador: ${gL}-${gV})`;
              }
              nuevosComentarios.unshift(descGol);
            } else {
              const fallos = [
                `Minuto ${mActual}: 🔴 Ocasión clara de ${tirador.nombre} (${local.nombreCorto}), pero el arquero rival vuela de forma magnífica.`,
                `Minuto ${mActual}: 🔴 ¡Aviso de ${local.nombre}! El remate potente de ${tirador.nombre} roza el poste.`,
                `Minuto ${mActual}: 🔴 ${tirador.nombre} cabecea libre en el área pero el balón sale apenas alto.`
              ];
              nuevosComentarios.unshift(fallos[Math.floor(Math.random() * fallos.length)]);
            }
          } else {
            // Ataca visitante
            const fAtk = atkV * (0.45 + Math.random() * 0.75);
            const fDef = defL * (0.60 + Math.random() * 0.90);

            const deCampo = onceV.filter(j => j.posicion !== 'POR');
            const elegibles = deCampo.length > 0 ? deCampo : onceV;
            const tirador = elegibles[Math.floor(Math.random() * elegibles.length)];

            if (fAtk > fDef) {
              gV += 1;
              goleadoresEnVivo.current[tirador.id] = (goleadoresEnVivo.current[tirador.id] || 0) + 1;

              const elegiblesAsist = onceV.filter(j => j.id !== tirador.id);
              const asistidor = elegiblesAsist.length > 0 ? elegiblesAsist[Math.floor(Math.random() * elegiblesAsist.length)] : null;
              const tieneAsistencia = asistidor && Math.random() > 0.30;

              let descGol = '';
              if (tieneAsistencia && asistidor) {
                asistidoresEnVivo.current[asistidor.id] = (asistidoresEnVivo.current[asistidor.id] || 0) + 1;
                descGol = `⚽ Minuto ${mActual}: 🔵 ¡GOOOL de ${visitante.nombre}! ${tirador.nombre} liquida tras pase de ${asistidor.nombre}. (Marcador: ${gL}-${gV})`;
              } else {
                descGol = `⚽ Minuto ${mActual}: 🔵 ¡GOOOL de ${visitante.nombre}! ${tirador.nombre} sorprende a la defensa y anota. (Marcador: ${gL}-${gV})`;
              }
              nuevosComentarios.unshift(descGol);
            } else {
              const fallos = [
                `Minuto ${mActual}: 🔵 Oportunidad para ${tirador.nombre} (${visitante.nombreCorto}), pero el arquero desvía al córner.`,
                `Minuto ${mActual}: 🔵 ${tirador.nombre} intenta colgar al arquero pero su disparo pega en el poste.`,
                `Minuto ${mActual}: 🔵 Un bloqueo de la zaga del ${local.nombreCorto} detiene a ${tirador.nombre}.`
              ];
              nuevosComentarios.unshift(fallos[Math.floor(Math.random() * fallos.length)]);
            }
          }
        } else if (randEvento < 0.75) {
          // --- TARJETAS ---
          const todaPlantilla = [...onceL, ...onceV];
          const jElegido = todaPlantilla[Math.floor(Math.random() * todaPlantilla.length)];
          const esAmarilla = Math.random() < 0.90;

          const descT = esAmarilla
            ? `🟨 Minuto ${mActual}: Tarjeta Amarilla para ${jElegido.nombre} (${jElegido.idEquipo === local.id ? local.nombreCorto : visitante.nombreCorto}) por una infracción táctica.`
            : `🟥 Minuto ${mActual}: ¡Tarjeta Roja Directa para ${jElegido.nombre} (${jElegido.idEquipo === local.id ? local.nombreCorto : visitante.nombreCorto})! Entrada durísima y expulsión.`;

          nuevosComentarios.unshift(descT);

          if (!esAmarilla) {
            canchaActual = canchaActual.filter(j => j.id !== jElegido.id);
          }
        } else if (randEvento < 0.95) {
          // --- LESIÓN (solo 5% de los eventos, muy raro) ---
          const todaPlantilla = [...onceL, ...onceV];
          const jElegido = todaPlantilla[Math.floor(Math.random() * todaPlantilla.length)];
          const semanas = Math.floor(Math.random() * 3) + 1;
          
          lesionadosEnVivo.current[jElegido.id] = semanas;

          const descL = `🚑 Minuto ${mActual}: ¡Preocupación! ${jElegido.nombre} (${jElegido.idEquipo === local.id ? local.nombreCorto : visitante.nombreCorto}) se retira del partido lesionado.`;
          nuevosComentarios.unshift(descL);

          canchaActual = canchaActual.filter(j => j.id !== jElegido.id);
        }
      }
    }

    setMinuto(90);
    setGolesLocal(gL);
    setGolesVisitante(gV);
    setPosesion(posFinal);
    setJugadoresEnCancha(canchaActual);
    setComentarios(nuevosComentarios);
    setEnJuego(false);
  };

  // --- BUCLE PRINCIPAL DEL PARTIDO ---
  // --- BUCLE PRINCIPAL DEL PARTIDO ---
  useEffect(() => {
    if (!enJuego || modalSustituciones || mostrarModalPreMatch || mostrarModalEntretiempo) return;

    const tick = setInterval(() => {
      if (pausadoPorEvento.current) return;

      setMinuto(prevMin => {
        const nuevoMin = prevMin + 1;
        
        // Pausar en el entretiempo
        if (nuevoMin === 45) {
          setMostrarModalEntretiempo(true);
          clearInterval(tick);
          return 45;
        }

        if (nuevoMin >= 90) {
          setEnJuego(false);
          setComentarios(prev => [
            `🏁 Minuto 90: ¡Final del partido! El árbitro pita el final. Marcador definitivo: ${local.nombre} ${golesLocal} - ${golesVisitante} ${visitante.nombre}.`,
            ...prev
          ]);
          clearInterval(tick);
          return 90;
        }

        // Desvanecimiento del grito activo
        if (gritoActivo && nuevoMin >= gritoMinutoInicio + 10) {
          setGritoActivo(null);
          setComentarios(prev => [
            `📢 [Instrucciones] Termina el efecto del grito del DT. Los jugadores regresan a su concentración habitual.`,
            ...prev
          ]);
        }

        // --- CÁLCULO DE VALORES DE ATAQUE Y DEFENSA ACTIVO CON PENALIZACIÓN DE POSICIÓN ---
        const numL = onceLocal.length || 1;
        const numV = onceVisitante.length || 1;

        const rolesL = asignarRolesTacticos(onceLocal, local.formacion || '4-3-3');
        const rolesV = asignarRolesTacticos(onceVisitante, visitante.formacion || '4-3-3');

        const onceLAjustados = rolesL.map(r => {
          const j = r.jugador;
          const comp = r.compatibilidad;
          const dtAjustados = ajustarAtributosPorDT(j, nuevoMin);
          const atributosAjustados = { ...dtAjustados };
          for (const key of Object.keys(atributosAjustados) as (keyof typeof j.atributos)[]) {
            atributosAjustados[key] = Math.max(1, Math.round(atributosAjustados[key] * comp));
          }
          return { ...j, atributos: atributosAjustados };
        });

        const onceVAjustados = rolesV.map(r => {
          const j = r.jugador;
          const comp = r.compatibilidad;
          const dtAjustados = ajustarAtributosPorDT(j, nuevoMin);
          const atributosAjustados = { ...dtAjustados };
          for (const key of Object.keys(atributosAjustados) as (keyof typeof j.atributos)[]) {
            atributosAjustados[key] = Math.max(1, Math.round(atributosAjustados[key] * comp));
          }
          return { ...j, atributos: atributosAjustados };
        });

        let atkL = onceLAjustados.reduce((acc, j) => 
          acc + (j.atributos.remate * 1.5 + j.atributos.regate * 1.2 + j.atributos.pase * 1.2 + j.atributos.velocidad * 1.0 + j.atributos.aceleracion * 1.0 + j.atributos.tecnica * 1.2 + j.atributos.vision * 1.2), 0
        ) / numL;

        let atkV = onceVAjustados.reduce((acc, j) => 
          acc + (j.atributos.remate * 1.5 + j.atributos.regate * 1.2 + j.atributos.pase * 1.2 + j.atributos.velocidad * 1.0 + j.atributos.aceleracion * 1.0 + j.atributos.tecnica * 1.2 + j.atributos.vision * 1.2), 0
        ) / numV;

        let defL = onceLAjustados.reduce((acc, j) => 
          acc + (j.atributos.defensa * 1.8 + j.atributos.fuerza * 1.4 + j.atributos.posicionamiento * 1.4 + j.atributos.decisiones * 1.2 + j.atributos.reflejos * 1.5), 0
        ) / numL;

        let defV = onceVAjustados.reduce((acc, j) => 
          acc + (j.atributos.defensa * 1.8 + j.atributos.fuerza * 1.4 + j.atributos.posicionamiento * 1.4 + j.atributos.decisiones * 1.2 + j.atributos.reflejos * 1.5), 0
        ) / numV;

        // Modificadores de estilo predeterminados
        if (local.estiloJuego === 'Ofensivo') { atkL *= 1.15; defL *= 0.90; }
        else if (local.estiloJuego === 'Defensivo') { atkL *= 0.90; defL *= 1.15; }

        if (visitante.estiloJuego === 'Ofensivo') { atkV *= 1.15; defV *= 0.90; }
        else if (visitante.estiloJuego === 'Defensivo') { atkV *= 0.90; defV *= 1.15; }

        // Bonus de Balón Parado y Scouting del Rival
        const debilidadLocalOpp = obtenerDebilidadEquipo(visitante.id, jugadores);
        const localUsaEstrategiaValida = local.estrategiaPases === 'Largos al espacio' && local.estrategiaCorner === 'Atacar el primer palo';
        const localTieneBonus = debilidadLocalOpp === 'centrales_lentos' && localUsaEstrategiaValida;

        const debilidadVisitanteOpp = obtenerDebilidadEquipo(local.id, jugadores);
        const visitanteUsaEstrategiaValida = visitante.estrategiaPases === 'Largos al espacio' && visitante.estrategiaCorner === 'Atacar el primer palo';
        const visitanteTieneBonus = debilidadVisitanteOpp === 'centrales_lentos' && visitanteUsaEstrategiaValida;

        if (localTieneBonus) atkL *= 1.20;
        if (visitanteTieneBonus) atkV *= 1.20;

        // Modificadores de Órdenes Rápidas (Usuario)
        if (ordenActiva && esLocalUsuario) {
          if (ordenActiva === 'ataque') { atkL *= 1.25; defL *= 0.85; }
          else if (ordenActiva === 'presion') { atkL *= 1.10; defL *= 1.15; }
          else if (ordenActiva === 'retencion') { atkL *= 0.90; defL *= 1.10; }
        } else if (ordenActiva && !esLocalUsuario) {
          if (ordenActiva === 'ataque') { atkV *= 1.25; defV *= 0.85; }
          else if (ordenActiva === 'presion') { atkV *= 1.10; defV *= 1.15; }
          else if (ordenActiva === 'retencion') { atkV *= 0.90; defV *= 1.10; }
        }

        // --- CÁLCULO DE POSESIÓN DINÁMICA ---
        const totalAtk = atkL + atkV;
        let posL = Math.round((atkL / totalAtk) * 100);
        
        if (ordenActiva === 'retencion') {
          if (esLocalUsuario) posL = Math.min(75, posL + 12);
          else posL = Math.max(25, posL - 12);
        }

        // Fluctuación aleatoria
        posL += Math.floor(Math.random() * 9) - 4; // -4% a +4%
        posL = Math.max(20, Math.min(80, posL));
        setPosesion(posL);

        // --- GENERACIÓN DE EVENTOS MINUTO A MINUTO ---
        // 3.5% de probabilidad por minuto de generar un evento destacado (antes 7%)
        if (Math.random() < 0.035) {
          const esLocalAtacando = Math.random() < (atkL / totalAtk);
          const randEvento = Math.random();

          if (randEvento < 0.50) {
            // --- OPORTUNIDAD DE GOL ---
            if (esLocalAtacando) {
              const fAtk = atkL * (0.45 + Math.random() * 0.75);
              const fDef = defV * (0.60 + Math.random() * 0.90);

              // Elegir jugador rematador ponderado por remate
              const deCampo = onceLocal.filter(j => j.posicion !== 'POR');
              const elegibles = deCampo.length > 0 ? deCampo : onceLocal;
              const tirador = elegibles[Math.floor(Math.random() * elegibles.length)];

              if (fAtk > fDef) {
                // ¡GOOOL LOCAL!
                setGolesLocal(g => g + 1);
                goleadoresEnVivo.current[tirador.id] = (goleadoresEnVivo.current[tirador.id] || 0) + 1;
                
                // Ponderar asistidor
                const elegiblesAsist = onceLocal.filter(j => j.id !== tirador.id);
                const asistidor = elegiblesAsist.length > 0 ? elegiblesAsist[Math.floor(Math.random() * elegiblesAsist.length)] : null;
                const tieneAsistencia = asistidor && Math.random() > 0.30;

                let descGol = '';
                if (tieneAsistencia && asistidor) {
                  asistidoresEnVivo.current[asistidor.id] = (asistidoresEnVivo.current[asistidor.id] || 0) + 1;
                  descGol = `⚽ Minuto ${nuevoMin}: 🔴 ¡GOOOL de ${local.nombre}! ${tirador.nombre} define de volea tras un gran pase elevado de ${asistidor.nombre}. (Marcador: ${golesLocal + 1}-${golesVisitante})`;
                } else {
                  descGol = `⚽ Minuto ${nuevoMin}: 🔴 ¡GOOOL de ${local.nombre}! ${tirador.nombre} liquida en un mano a mano con un remate cruzado brillante. (Marcador: ${golesLocal + 1}-${golesVisitante})`;
                }

                lanzarEventoDestacado('gol', descGol);
              } else {
                // Chance fallada
                const fallos = [
                  `Minuto ${nuevoMin}: 🔴 Ocasión clara de ${tirador.nombre} (${local.nombreCorto}), pero el arquero rival vuela de forma magnífica.`,
                  `Minuto ${nuevoMin}: 🔴 ¡Aviso de ${local.nombre}! El remate potente de ${tirador.nombre} roza el poste.`,
                  `Minuto ${nuevoMin}: 🔴 ${tirador.nombre} cabecea libre en el área pero el balón sale apenas alto.`
                ];
                const fallo = fallos[Math.floor(Math.random() * fallos.length)];
                setComentarios(prev => [fallo, ...prev]);
              }
            } else {
              // Ataca visitante
              const fAtk = atkV * (0.45 + Math.random() * 0.75);
              const fDef = defL * (0.60 + Math.random() * 0.90);

              const deCampo = onceVisitante.filter(j => j.posicion !== 'POR');
              const elegibles = deCampo.length > 0 ? deCampo : onceVisitante;
              const tirador = elegibles[Math.floor(Math.random() * elegibles.length)];

              if (fAtk > fDef) {
                // ¡GOOOL VISITANTE!
                setGolesVisitante(g => g + 1);
                goleadoresEnVivo.current[tirador.id] = (goleadoresEnVivo.current[tirador.id] || 0) + 1;

                const elegiblesAsist = onceVisitante.filter(j => j.id !== tirador.id);
                const asistidor = elegiblesAsist.length > 0 ? elegiblesAsist[Math.floor(Math.random() * elegiblesAsist.length)] : null;
                const tieneAsistencia = asistidor && Math.random() > 0.30;

                let descGol = '';
                if (tieneAsistencia && asistidor) {
                  asistidoresEnVivo.current[asistidor.id] = (asistidoresEnVivo.current[asistidor.id] || 0) + 1;
                  descGol = `⚽ Minuto ${nuevoMin}: 🔵 ¡GOOOL de ${visitante.nombre}! ${tirador.nombre} liquida con un disparo inalcanzable tras centro milimétrico de ${asistidor.nombre}. (Marcador: ${golesLocal}-${golesVisitante + 1})`;
                } else {
                  descGol = `⚽ Minuto ${nuevoMin}: 🔵 ¡GOOOL de ${visitante.nombre}! ${tirador.nombre} sorprende a la defensa y anota con una gran definición individual. (Marcador: ${golesLocal}-${golesVisitante + 1})`;
                }

                lanzarEventoDestacado('gol', descGol);
              } else {
                const fallos = [
                  `Minuto ${nuevoMin}: 🔵 Oportunidad para ${tirador.nombre} (${visitante.nombreCorto}), pero el arquero desvía al córner de forma providencial.`,
                  `Minuto ${nuevoMin}: 🔵 ${tirador.nombre} intenta colgar al arquero pero su disparo se estrella en el travesaño.`,
                  `Minuto ${nuevoMin}: 🔵 Un bloqueo desesperado de la zaga del ${local.nombreCorto} detiene el grito de gol de ${tirador.nombre}.`
                ];
                const fallo = fallos[Math.floor(Math.random() * fallos.length)];
                setComentarios(prev => [fallo, ...prev]);
              }
            }
          } else if (randEvento < 0.75) {
            // --- TARJETAS ---
            const todaPlantilla = [...onceLocal, ...onceVisitante];
            const jElegido = todaPlantilla[Math.floor(Math.random() * todaPlantilla.length)];
            const esAmarilla = Math.random() < 0.90;

            const descT = esAmarilla
              ? `🟨 Minuto ${nuevoMin}: Tarjeta Amarilla para ${jElegido.nombre} (${jElegido.idEquipo === local.id ? local.nombreCorto : visitante.nombreCorto}) por cortar un contraataque con infracción táctica.`
              : `🟥 Minuto ${nuevoMin}: ¡Tarjeta Roja Directa para ${jElegido.nombre} (${jElegido.idEquipo === local.id ? local.nombreCorto : visitante.nombreCorto})! Es expulsado por una entrada muy imprudente.`;

            lanzarEventoDestacado('tarjeta', descT);

            if (!esAmarilla) {
              // Remover jugador expulsado
              setJugadoresEnCancha(prev => prev.filter(j => j.id !== jElegido.id));
            }
          } else if (randEvento < 0.95) {
            // --- LESIÓN (solo 5% de los eventos, muy raro) ---
            const todaPlantilla = [...onceLocal, ...onceVisitante];
            const jElegido = todaPlantilla[Math.floor(Math.random() * todaPlantilla.length)];
            const semanas = Math.floor(Math.random() * 3) + 1;
            
            lesionadosEnVivo.current[jElegido.id] = semanas;

            const descL = `🚑 Minuto ${nuevoMin}: ¡Preocupación! ${jElegido.nombre} (${jElegido.idEquipo === local.id ? local.nombreCorto : visitante.nombreCorto}) sufre una dura torcedura física y debe retirarse del partido lesionado.`;
            
            lanzarEventoDestacado('lesion', descL);

            // Remover jugador de la cancha de inmediato
            setJugadoresEnCancha(prev => prev.filter(j => j.id !== jElegido.id));
          }
        }

        return nuevoMin;
      });
    }, velocidad); // 500ms por minuto

    return () => clearInterval(tick);
  }, [enJuego, modalSustituciones, jugadoresEnCancha, ordenActiva, golesLocal, golesVisitante, velocidad, mostrarModalPreMatch, mostrarModalEntretiempo, gritoActivo, gritoMinutoInicio]);

  // --- FUNCIÓN DE CONTROL DE EVENTO DESTACADO CON PAUSA ---
  const lanzarEventoDestacado = (tipo: 'gol' | 'lesion' | 'tarjeta', texto: string) => {
    pausadoPorEvento.current = true;
    setEventoDestacado({ tipo, texto });
    setComentarios(prev => [texto, ...prev]);

    setTimeout(() => {
      setEventoDestacado(null);
      pausadoPorEvento.current = false;
    }, 2000); // Pausa de 2 segundos en tiempo real
  };

  // --- ENVIAR CAMBIOS A LA BASE ---
  const terminarYConsolidar = () => {
    // 1. Clonar y mapear todos los jugadores globales
    const jugadoresActualizados = jugadores.map(j => {
      let jClon = { ...j, atributos: { ...j.atributos } };

      // Si pisó la cancha, suma partido jugado y fatiga
      if (jugadoresQueJugaron.current.has(jClon.id)) {
        jClon.partidosJugados = (jClon.partidosJugados || 0) + 1;

        // Desgaste físico por jugar
        const esDesgasteAlto = ['MC', 'MCO', 'ED', 'EI'].includes(jClon.posicion);
        const fatiga = esDesgasteAlto 
          ? Math.floor(Math.random() * 5) + 11 // 11% a 15%
          : Math.floor(Math.random() * 4) + 8;  // 8% a 11%
        jClon.formaFisica = Math.max(1, jClon.formaFisica - fatiga);
      }

      // Si anotó goles en este partido
      if (goleadoresEnVivo.current[jClon.id]) {
        jClon.goles = (jClon.goles || 0) + goleadoresEnVivo.current[jClon.id];
      }

      // Si asistió goles en este partido
      if (asistidoresEnVivo.current[jClon.id]) {
        jClon.asistencias = (jClon.asistencias || 0) + asistidoresEnVivo.current[jClon.id];
      }

      // Si se lesionó en este partido
      if (lesionadosEnVivo.current[jClon.id]) {
        const sem = lesionadosEnVivo.current[jClon.id];
        jClon.lesionado = true;
        jClon.semanasLesion = sem;
        jClon.semanasLesionado = sem;
        jClon.titular = false; // Ya no puede ser titular
      }

      // Si fue cambiado y ahora no está en cancha, quitar de titularidad si corresponde
      // Pero no cambiamos su estado titular general salvo si está lesionado.
      return jClon;
    });

    // 2. Ejecutar callback del contexto para actualizar standings, confianza de directiva y press conferences
    finalizarPartidoEnVivo(golesLocal, golesVisitante, [...comentarios].reverse(), jugadoresActualizados);
  };

  // --- LÓGICA DE SUSTITUCIONES ---
  const onceUsuario = jugadoresEnCancha.filter(j => j.idEquipo === equipoUsuario.id);
  const bancaUsuario = jugadores.filter(j => 
    j.idEquipo === equipoUsuario.id && 
    !jugadoresEnCancha.some(c => c.id === j.id) &&
    !j.lesionado
  );

  const procesarSustitucion = () => {
    if (!seleccionSalida || !seleccionEntrada) return;

    setJugadoresEnCancha(prev => {
      // Reemplazar el jugador saliente por el entrante
      const canchaNueva = prev.map(j => j.id === seleccionSalida.id ? seleccionEntrada : j);
      
      // Registrar que el entrante jugó
      jugadoresQueJugaron.current.add(seleccionEntrada.id);
      
      return canchaNueva;
    });

    setCambiosRealizados(c => c + 1);

    const descSub = `🔄 Minuto ${minuto}: Cambio en ${equipoUsuario.nombreCorto} - Entra ${seleccionEntrada.nombre} (${seleccionEntrada.posicion}) sustituyendo a ${seleccionSalida.nombre} (${seleccionSalida.posicion}).`;
    setComentarios(prev => [descSub, ...prev]);

    // Limpiar selección y cerrar modal
    setSeleccionSalida(null);
    setSeleccionEntrada(null);
    setModalSustituciones(false);
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col p-6 relative overflow-hidden font-sans">
      
      {/* Luces y brillos de fondo */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-teal-500/5 blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-500/5 blur-[150px] pointer-events-none"></div>

      {/* Cartel flotante de Eventos Destacados */}
      {eventoDestacado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className={`p-8 rounded-2xl border w-full max-w-lg text-center shadow-2xl space-y-6 animate-scale-in ${
            eventoDestacado.tipo === 'gol'
              ? 'bg-teal-950/60 border-teal-500/30 text-teal-400 border-t-8 border-t-teal-500 shadow-teal-500/10'
              : eventoDestacado.tipo === 'lesion'
              ? 'bg-rose-950/60 border-rose-500/30 text-rose-400 border-t-8 border-t-rose-500 shadow-rose-500/10'
              : 'bg-amber-950/60 border-amber-500/30 text-amber-400 border-t-8 border-t-amber-500 shadow-amber-500/10'
          }`}>
            <div className="text-5xl animate-bounce">
              {eventoDestacado.tipo === 'gol' ? '⚽ GOOOL' : eventoDestacado.tipo === 'lesion' ? '🚑 LESIÓN' : '🟨 TARJETA'}
            </div>
            <p className="text-lg md:text-xl font-bold leading-relaxed text-slate-200">
              {eventoDestacado.texto}
            </p>
          </div>
        </div>
      )}

      {/* Cabecera de la Transmisión: Marcador Gigante */}
      <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-6 flex flex-col items-center justify-between shadow-2xl relative mb-6">
        <div className="text-[10px] uppercase font-bold text-teal-400 tracking-widest mb-3 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
          Transmisión Oficial en Vivo
        </div>

        {/* Tablero de Marcador */}
        <div className="flex items-center justify-center gap-6 w-full max-w-3xl">
          {/* Local */}
          <div className="text-center w-1/3 flex flex-col items-center">
            <span className="text-5xl block mb-2 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)]">{local.escudo}</span>
            <span className="text-base font-extrabold text-slate-100 truncate w-full">{local.nombre}</span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">{local.nombreCorto}</span>
          </div>

          {/* Marcador Central */}
          <div className="flex flex-col items-center justify-center bg-slate-950/80 px-6 py-4 rounded-xl border border-slate-800 shadow-inner w-40 flex-shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-4xl font-black text-teal-400 font-mono tracking-tighter">{golesLocal}</span>
              <span className="text-lg font-bold text-slate-600">-</span>
              <span className="text-4xl font-black text-teal-400 font-mono tracking-tighter">{golesVisitante}</span>
            </div>
            <div className="mt-2 text-xs font-black bg-slate-900 px-3 py-1 rounded border border-slate-850 text-slate-300 font-mono">
              {minuto === 90 ? 'FIN' : `${minuto}'`}
            </div>
          </div>

          {/* Visitante */}
          <div className="text-center w-1/3 flex flex-col items-center">
            <span className="text-5xl block mb-2 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)]">{visitante.escudo}</span>
            <span className="text-base font-extrabold text-slate-100 truncate w-full">{visitante.nombre}</span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">{visitante.nombreCorto}</span>
          </div>
        </div>

        {/* Barra de Posesión de Pelota */}
        <div className="w-full max-w-xl mt-6 space-y-2">
          <div className="flex justify-between text-xs font-bold text-slate-400 tracking-wider">
            <span>Posesión: {posesion}%</span>
            <span>{100 - posesion}%</span>
          </div>
          <div className="h-3 w-full bg-slate-950 rounded-full border border-slate-850 overflow-hidden flex">
            <div
              style={{ width: `${posesion}%` }}
              className="bg-gradient-to-r from-teal-500 to-emerald-600 h-full transition-all duration-700 shadow-lg"
            ></div>
            <div
              style={{ width: `${100 - posesion}%` }}
              className="bg-slate-800 h-full transition-all duration-700"
            ></div>
          </div>
        </div>
      </div>

      {/* Sección del Cuerpo: Log y Controles Laterales */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 overflow-hidden">
        
        {/* Lado Izquierdo: Comentarios en Vivo (3 columnas) */}
        <div className="lg:col-span-3 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-6 flex flex-col overflow-hidden h-[450px]">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-850 pb-2 flex justify-between items-center">
            <span>🎙️ Relatos y Comentarios Oficiales</span>
            <span className="font-mono font-bold text-[10px] text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">Señal de Audio Activa</span>
          </h4>

          <div className="flex-1 overflow-y-auto mt-4 space-y-3 pr-2 scrollbar-thin">
            {comentarios.map((c, i) => {
              const esGol = c.includes('⚽');
              const esLesion = c.includes('🚑');
              const esTarjeta = c.includes('🟨') || c.includes('🟥');
              const esCambio = c.includes('🔄');

              return (
                <div
                  key={i}
                  className={`p-3 rounded border text-xs font-mono transition-all duration-300 leading-relaxed ${
                    esGol
                      ? 'bg-teal-500/10 text-teal-300 border-l-4 border-l-teal-500 border-teal-500/20 shadow-md shadow-teal-500/5'
                      : esLesion
                      ? 'bg-rose-500/10 text-rose-300 border-l-4 border-l-rose-500 border-rose-500/20'
                      : esTarjeta
                      ? c.includes('🟥')
                        ? 'bg-red-500/10 text-red-300 border-l-4 border-l-red-500 border-red-500/20'
                        : 'bg-amber-500/10 text-amber-300 border-l-4 border-l-amber-500 border-amber-500/20'
                      : esCambio
                      ? 'bg-blue-500/10 text-blue-300 border-l-4 border-l-blue-500 border-blue-500/20'
                      : 'text-slate-400 border-transparent bg-slate-950/20 hover:bg-slate-950/40'
                  }`}
                >
                  {c}
                </div>
              );
            })}
          </div>
        </div>

        {/* Lado Derecho: Controles Tácticos Sidebar (1 columna) */}
        <div className="space-y-4 flex flex-col justify-between">
          
          {/* Órdenes Rápidas */}
          <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-5 space-y-4">
            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-850 pb-2">
              📋 Órdenes Rápidas en Vivo
            </h4>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => setOrdenActiva(prev => prev === 'ataque' ? null : 'ataque')}
                disabled={!enJuego}
                className={`w-full py-3 px-4 rounded-xl text-left border transition-all duration-200 flex flex-col justify-center ${
                  ordenActiva === 'ataque'
                    ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white border-red-500 shadow-md shadow-red-950/30'
                    : 'bg-slate-950/50 border-slate-850 hover:bg-slate-950 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-extrabold text-xs">Ir al Ataque</span>
                  <span>🔥</span>
                </div>
                <span className="text-[9px] text-slate-400 font-medium mt-1">Ataque +25% | Defensa -15%</span>
              </button>

              <button
                onClick={() => setOrdenActiva(prev => prev === 'presion' ? null : 'presion')}
                disabled={!enJuego}
                className={`w-full py-3 px-4 rounded-xl text-left border transition-all duration-200 flex flex-col justify-center ${
                  ordenActiva === 'presion'
                    ? 'bg-gradient-to-r from-orange-600 to-amber-700 text-white border-orange-500 shadow-md shadow-orange-950/30'
                    : 'bg-slate-950/50 border-slate-850 hover:bg-slate-950 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-extrabold text-xs">Presionar Alto</span>
                  <span>🏃</span>
                </div>
                <span className="text-[9px] text-slate-400 font-medium mt-1">Ataque +10% | Defensa +10%</span>
              </button>

              <button
                onClick={() => setOrdenActiva(prev => prev === 'retencion' ? null : 'retencion')}
                disabled={!enJuego}
                className={`w-full py-3 px-4 rounded-xl text-left border transition-all duration-200 flex flex-col justify-center ${
                  ordenActiva === 'retencion'
                    ? 'bg-gradient-to-r from-teal-600 to-emerald-700 text-white border-teal-500 shadow-md shadow-teal-950/30'
                    : 'bg-slate-950/50 border-slate-850 hover:bg-slate-950 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-extrabold text-xs">Retener Pelota</span>
                  <span>🛡️</span>
                </div>
                <span className="text-[9px] text-slate-400 font-medium mt-1">Posesión +12% | Menos jugadas</span>
              </button>
            </div>
          </div>

          {/* Gritos desde el Banco */}
          <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-5 space-y-4">
            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-850 pb-2">
              🗣️ Gritos desde el Banco
            </h4>

            {gritoActivo && (
              <div className="bg-teal-500/10 border border-teal-500/30 rounded-xl p-3 flex flex-col items-center justify-center animate-pulse">
                <span className="text-[10px] text-teal-400 font-extrabold uppercase tracking-wider">Grito Activo:</span>
                <span className="text-xs text-white font-black uppercase mt-0.5">
                  {gritoActivo === 'alentar' ? '📢 Alentar' : gritoActivo === 'exigir' ? '📢 Exigir más' : '📢 Hacer tiempo'}
                </span>
                <span className="text-[9px] text-slate-400 mt-1 font-mono">
                  Expira en: {gritoMinutoInicio + 10 - minuto} min
                </span>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  setGritoActivo('alentar');
                  setGritoMinutoInicio(minuto);
                  setComentarios(prev => [`📢 [Instrucciones] El DT grita desde la línea: "¡Alienten, con fe, sigan buscando el arco rival!"`, ...prev]);
                }}
                disabled={!enJuego || gritoActivo !== null}
                className={`w-full py-2.5 px-3 rounded-xl border text-left transition-all duration-200 flex flex-col justify-center ${
                  gritoActivo === 'alentar'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white border-cyan-500'
                    : 'bg-slate-950/50 border-slate-850 hover:bg-slate-950 text-slate-350 disabled:opacity-40'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-extrabold text-[11px]">Alentar</span>
                  <span>📢</span>
                </div>
                <span className="text-[8px] text-slate-400 mt-0.5">Moral +10% | Problemáticos -5%</span>
              </button>

              <button
                onClick={() => {
                  setGritoActivo('exigir');
                  setGritoMinutoInicio(minuto);
                  setComentarios(prev => [`📢 [Instrucciones] El DT se levanta enfurecido: "¡Exijo más concentración, pongan actitud!"`, ...prev]);
                }}
                disabled={!enJuego || gritoActivo !== null}
                className={`w-full py-2.5 px-3 rounded-xl border text-left transition-all duration-200 flex flex-col justify-center ${
                  gritoActivo === 'exigir'
                    ? 'bg-gradient-to-r from-red-650 to-orange-700 text-white border-red-500'
                    : 'bg-slate-950/50 border-slate-850 hover:bg-slate-950 text-slate-350 disabled:opacity-40'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-extrabold text-[11px]">Exigir más</span>
                  <span>🔥</span>
                </div>
                <span className="text-[8px] text-slate-400 mt-0.5">Físicos +10% (Cracks) | Decisiones -30% (Nerviosos)</span>
              </button>

              <button
                onClick={() => {
                  setGritoActivo('tiempo');
                  setGritoMinutoInicio(minuto);
                  setComentarios(prev => [`📢 [Instrucciones] El DT gesticula con las manos hacia abajo: "¡Tranquilos, toquen y hagan correr el reloj!"`, ...prev]);
                }}
                disabled={!enJuego || gritoActivo !== null}
                className={`w-full py-2.5 px-3 rounded-xl border text-left transition-all duration-200 flex flex-col justify-center ${
                  gritoActivo === 'tiempo'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-emerald-500'
                    : 'bg-slate-950/50 border-slate-850 hover:bg-slate-950 text-slate-350 disabled:opacity-40'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-extrabold text-[11px]">Hacer tiempo</span>
                  <span>⏳</span>
                </div>
                <span className="text-[8px] text-slate-400 mt-0.5">Defensa +10% | Remate y Regate -20%</span>
              </button>
            </div>
          </div>

          {/* Controles de Simulación */}
          <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-5 space-y-4">
            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-850 pb-2">
              ⏱️ Velocidad y Simulación
            </h4>
            
            {/* Velocidad */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] uppercase font-extrabold text-slate-500 tracking-wider">Velocidad de Juego</label>
              <div className="flex p-0.5 bg-slate-950 rounded-xl border border-slate-850">
                {[
                  { label: '1x', ms: 500 },
                  { label: '3x', ms: 150 },
                  { label: '10x', ms: 40 }
                ].map(v => (
                  <button
                    key={v.label}
                    onClick={() => setVelocidad(v.ms)}
                    disabled={!enJuego}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-extrabold transition-all uppercase tracking-wider ${
                      velocidad === v.ms
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-350 disabled:opacity-30'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Saltear */}
            {enJuego && (
              <button
                onClick={saltearSimulacion}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-95 border border-amber-400/20 shadow-amber-500/5 hover:shadow-amber-500/10"
              >
                ⏩ Saltear Simulación
              </button>
            )}
          </div>

          {/* Menú de Cambios y Finalización */}
          <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-5 space-y-4">
            {enJuego ? (
              <>
                <button
                  onClick={() => setModalSustituciones(true)}
                  disabled={cambiosRealizados >= 5}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  🔄 Sustituciones ({cambiosRealizados} / 5)
                </button>
                <div className="text-[9px] text-slate-500 text-center">
                  El partido se pausará automáticamente para que puedas realizar tus cambios con tranquilidad.
                </div>
              </>
            ) : (
              <button
                onClick={terminarYConsolidar}
                className="w-full py-4 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-teal-950/30 animate-pulse"
              >
                Concluir Transmisión
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ==========================================
          MODAL DE SUSTITUCIONES EN PAUSA
          ========================================== */}
      {modalSustituciones && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col my-8 border-t-4 border-t-blue-500 animate-scale-in">
            
            {/* Header del Modal */}
            <div className="p-6 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-400 tracking-widest block mb-1">
                  ⏸️ Partido en Pausa Contractual
                </span>
                <h3 className="text-xl font-extrabold text-white">
                  Realizar Cambios y Sustituciones ({cambiosRealizados} / 5)
                </h3>
              </div>
              <button
                onClick={() => setModalSustituciones(false)}
                className="text-slate-500 hover:text-white text-xl font-bold"
              >
                ✕
              </button>
            </div>

            {/* Cuerpo del Modal */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto max-h-[400px]">
              
              {/* Columna Izquierda: Los 11 en cancha del Usuario */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                  👤 En Campo de Juego
                </h4>
                
                <div className="grid grid-cols-1 gap-2">
                  {onceUsuario.map(j => (
                    <div
                      key={j.id}
                      onClick={() => setSeleccionSalida(seleccionSalida?.id === j.id ? null : j)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all flex justify-between items-center ${
                        seleccionSalida?.id === j.id
                          ? 'bg-rose-500/10 border-rose-500 text-rose-300'
                          : 'bg-slate-950/40 border-slate-850 hover:bg-slate-950 hover:border-slate-700 text-slate-200'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs">{j.nombre}</div>
                        <div className="text-[9px] text-slate-500 font-mono mt-0.5">{j.posicion} • CA: {j.ca} • Fis: {j.formaFisica}%</div>
                      </div>
                      <div className="text-xs text-rose-500 font-bold uppercase tracking-wide">
                        {seleccionSalida?.id === j.id ? 'Seleccionado' : 'Sustituir'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Columna Derecha: El Banco de Suplentes del Usuario */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                  🪑 En el Banco de Suplentes
                </h4>
                
                {bancaUsuario.length === 0 ? (
                  <p className="text-xs text-slate-500">No hay suplentes viables disponibles en este momento.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {bancaUsuario.map(j => (
                      <div
                        key={j.id}
                        onClick={() => setSeleccionEntrada(seleccionEntrada?.id === j.id ? null : j)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all flex justify-between items-center ${
                          seleccionEntrada?.id === j.id
                            ? 'bg-teal-500/10 border-teal-500 text-teal-300'
                            : 'bg-slate-950/40 border-slate-850 hover:bg-slate-950 hover:border-slate-700 text-slate-200'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-xs">{j.nombre}</div>
                          <div className="text-[9px] text-slate-500 font-mono mt-0.5">{j.posicion} • CA: {j.ca} • Fis: {j.formaFisica}%</div>
                        </div>
                        <div className="text-xs text-teal-500 font-bold uppercase tracking-wide">
                          {seleccionEntrada?.id === j.id ? 'Seleccionado' : 'Ingresar'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer de Acciones del Modal */}
            <div className="p-6 bg-slate-950 border-t border-slate-800 flex justify-between items-center">
              <div className="text-xs text-slate-500 max-w-md">
                {seleccionSalida && seleccionEntrada ? (
                  <span>Se sustituirá a <strong className="text-rose-400">{seleccionSalida.nombre}</strong> por <strong className="text-teal-400">{seleccionEntrada.nombre}</strong>.</span>
                ) : (
                  <span>Seleccioná un jugador de campo y uno del banco para confirmar el cambio.</span>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSeleccionSalida(null);
                    setSeleccionEntrada(null);
                    setModalSustituciones(false);
                  }}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-lg text-xs uppercase font-bold tracking-wider transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={procesarSustitucion}
                  disabled={!seleccionSalida || !seleccionEntrada}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-extrabold rounded-lg text-xs uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  Confirmar Sustitución
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ==========================================
          MODAL DE CHARLA PRE-PARTIDO
          ========================================== */}
      {mostrarModalPreMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col my-8 border-t-4 border-t-teal-500 animate-scale-in">
            
            {/* Header del Modal */}
            <div className="p-6 bg-slate-950 border-b border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-teal-400 tracking-widest block mb-1">
                🗣️ Charla Técnica Inicial
              </span>
              <h3 className="text-2xl font-black text-white">
                Antes del Partido
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Dirígete a tu equipo en el vestuario. Tu charla influirá en el rendimiento de los jugadores durante el primer tiempo.
              </p>
            </div>

            {/* Opciones */}
            <div className="p-6 space-y-4">
              <button
                onClick={() => {
                  setCharlaPreMatch('motivadora');
                  setComentarios(prev => [
                    `📢 [DT - Charla Pre-Partido] Motivadora: "¡Exijo garra, coraje y concentración total! ¡Somos el ${equipoUsuario.nombre} y hoy tenemos que ganar!"`,
                    ...prev
                  ]);
                  setMostrarModalPreMatch(false);
                }}
                className="w-full text-left p-4 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-950 hover:border-teal-500/55 transition-all duration-200 group flex gap-4 items-start"
              >
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xl">
                  🔥
                </div>
                <div className="flex-1">
                  <div className="font-extrabold text-sm text-slate-100 group-hover:text-teal-400 transition-colors">
                    Charla Motivadora (Agresiva)
                  </div>
                  <div className="text-xs italic text-slate-400 mt-1">
                    "¡Exijo garra, coraje y concentración total! ¡Somos el {equipoUsuario.nombre} y hoy tenemos que ganar!"
                  </div>
                  <div className="text-[10px] text-slate-500 mt-2 font-medium">
                    Efecto: +10% atributos para Ambiciosos, Líderes y Profesionales. -10% para Problemáticos.
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setCharlaPreMatch('calmada');
                  setComentarios(prev => [
                    `📢 [DT - Charla Pre-Partido] Calmada: "Jueguen tranquilos, disfruten del partido y jueguen sin presión. Confío en ustedes."`,
                    ...prev
                  ]);
                  setMostrarModalPreMatch(false);
                }}
                className="w-full text-left p-4 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-950 hover:border-teal-500/55 transition-all duration-200 group flex gap-4 items-start"
              >
                <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl text-xl">
                  🧘
                </div>
                <div className="flex-1">
                  <div className="font-extrabold text-sm text-slate-100 group-hover:text-teal-400 transition-colors">
                    Charla Calmada
                  </div>
                  <div className="text-xs italic text-slate-400 mt-1">
                    "Jueguen tranquilos, disfruten del partido y jueguen sin presión. Confío en ustedes."
                  </div>
                  <div className="text-[10px] text-slate-500 mt-2 font-medium">
                    Efecto: +15% a decisiones y reflejos para jugadores con moral baja (&lt; 60). -5% para Ambiciosos.
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setCharlaPreMatch('tactica');
                  setComentarios(prev => [
                    `📢 [DT - Charla Pre-Partido] Táctica: "Mantengan el bloque defensivo compacto y exploten las bandas."`,
                    ...prev
                  ]);
                  setMostrarModalPreMatch(false);
                }}
                className="w-full text-left p-4 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-950 hover:border-teal-500/55 transition-all duration-200 group flex gap-4 items-start"
              >
                <div className="p-3 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-xl text-xl">
                  📋
                </div>
                <div className="flex-1">
                  <div className="font-extrabold text-sm text-slate-100 group-hover:text-teal-400 transition-colors">
                    Charla Táctica
                  </div>
                  <div className="text-xs italic text-slate-400 mt-1">
                    "Mantengan el bloque defensivo compacto y exploten las bandas."
                  </div>
                  <div className="text-[10px] text-slate-500 mt-2 font-medium">
                    Efecto: +10% a posicionamiento, decisiones y pase para todo el plantel.
                  </div>
                </div>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ==========================================
          MODAL DE CHARLA DE ENTRETIEMPO
          ========================================== */}
      {mostrarModalEntretiempo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col my-8 border-t-4 border-t-amber-500 animate-scale-in">
            
            {/* Header del Modal */}
            <div className="p-6 bg-slate-950 border-b border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-widest block mb-1">
                ⏸️ Entretiempo y Ajustes
              </span>
              <h3 className="text-2xl font-black text-white">
                Charla Técnica de Entretiempo
              </h3>
              <div className="mt-2 inline-flex items-center gap-3 bg-slate-900 px-4 py-1.5 rounded-full border border-slate-800">
                <span className="text-xs font-bold text-slate-350">{local.nombreCorto}</span>
                <span className="font-mono text-sm font-bold text-amber-400">{golesLocal} - {golesVisitante}</span>
                <span className="text-xs font-bold text-slate-355">{visitante.nombreCorto}</span>
              </div>
              <p className="text-xs text-slate-400 mt-3">
                Es hora de ajustar el rumbo para los segundos 45 minutos. ¿Qué les dirás a tus jugadores?
              </p>
            </div>

            {/* Opciones */}
            <div className="p-6 space-y-4">
              <button
                onClick={() => {
                  setCharlaEntretiempo('exigente');
                  setComentarios(prev => [
                    `📢 [DT - Charla Entretiempo] Exigencia: "¡Esta actitud es inaceptable! ¡Exijo mucho más esfuerzo en el segundo tiempo!"`,
                    ...prev
                  ]);
                  setMostrarModalEntretiempo(false);
                }}
                className="w-full text-left p-4 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-950 hover:border-amber-500/55 transition-all duration-200 group flex gap-4 items-start"
              >
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xl">
                  ⚡
                </div>
                <div className="flex-1">
                  <div className="font-extrabold text-sm text-slate-100 group-hover:text-amber-400 transition-colors">
                    Charla de Exigencia (Agresiva)
                  </div>
                  <div className="text-xs italic text-slate-400 mt-1">
                    "¡Esta actitud es inaceptable! ¡Exijo mucho más esfuerzo en el segundo tiempo!"
                  </div>
                  <div className="text-[10px] text-slate-500 mt-2 font-medium">
                    Efecto si no vas ganando: +15% atributos a Ambiciosos, Líderes y Profesionales. -25% decisiones para moral baja o Problemáticos. Si vas ganando: +5% general.
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setCharlaEntretiempo('apoyo');
                  setComentarios(prev => [
                    `📢 [DT - Charla Entretiempo] Apoyo: "Lo están haciendo bien, sigan con paciencia y llegará el gol. Confío en ustedes."`,
                    ...prev
                  ]);
                  setMostrarModalEntretiempo(false);
                }}
                className="w-full text-left p-4 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-950 hover:border-amber-500/55 transition-all duration-200 group flex gap-4 items-start"
              >
                <div className="p-3 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-xl text-xl">
                  🤝
                </div>
                <div className="flex-1">
                  <div className="font-extrabold text-sm text-slate-100 group-hover:text-amber-400 transition-colors">
                    Charla de Apoyo
                  </div>
                  <div className="text-xs italic text-slate-400 mt-1">
                    "Lo están haciendo bien, sigan con paciencia y llegará el gol. Confío en ustedes."
                  </div>
                  <div className="text-[10px] text-slate-500 mt-2 font-medium">
                    Efecto: +10% general a todo el equipo (+15% si la moral es baja &lt; 60).
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setCharlaEntretiempo('tactica');
                  setComentarios(prev => [
                    `📢 [DT - Charla Entretiempo] Táctica: "Ajustemos la presión en el mediocampo y juguemos con más circulación rápida."`,
                    ...prev
                  ]);
                  setMostrarModalEntretiempo(false);
                }}
                className="w-full text-left p-4 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-950 hover:border-amber-500/55 transition-all duration-200 group flex gap-4 items-start"
              >
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xl">
                  📋
                </div>
                <div className="flex-1">
                  <div className="font-extrabold text-sm text-slate-100 group-hover:text-amber-400 transition-colors">
                    Charla Táctica
                  </div>
                  <div className="text-xs italic text-slate-400 mt-1">
                    "Ajustemos la presión en el mediocampo y juguemos con más circulación rápida."
                  </div>
                  <div className="text-[10px] text-slate-500 mt-2 font-medium">
                    Efecto: +10% a posicionamiento, defensa y pase general de todo el plantel.
                  </div>
                </div>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
