import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useGame } from '../context/useGame';
import { Jugador, Formacion, EstiloJuego, Posicion } from '../types';
import { CriterioOrden, DireccionOrden, ordenarJugadores } from '../utils/sorting';

// ============================================================
// TIPOS LOCALES
// ============================================================
type LineaTactica = 'POR' | 'DEF' | 'MED' | 'DEL';

interface NodoPosicion {
  linea: LineaTactica;
  index: number;          // posición dentro de la línea (0-based)
  label: string;          // etiqueta visible en el nodo vacío (ej. "LD", "DC")
  jugadorId: string | null;
}

// ============================================================
// CONFIGURACIÓN DE FORMACIONES → nodos con etiquetas específicas
// ============================================================
const FORMACIONES_NODOS: Record<Formacion, NodoPosicion[]> = {
  '4-3-3': [
    { linea: 'POR', index: 0, label: 'POR', jugadorId: null },
    { linea: 'DEF', index: 0, label: 'LD',  jugadorId: null },
    { linea: 'DEF', index: 1, label: 'DFC', jugadorId: null },
    { linea: 'DEF', index: 2, label: 'DFC', jugadorId: null },
    { linea: 'DEF', index: 3, label: 'LI',  jugadorId: null },
    { linea: 'MED', index: 0, label: 'MC',  jugadorId: null },
    { linea: 'MED', index: 1, label: 'MCO', jugadorId: null },
    { linea: 'MED', index: 2, label: 'MC',  jugadorId: null },
    { linea: 'DEL', index: 0, label: 'ED',  jugadorId: null },
    { linea: 'DEL', index: 1, label: 'DC',  jugadorId: null },
    { linea: 'DEL', index: 2, label: 'EI',  jugadorId: null },
  ],
  '4-4-2': [
    { linea: 'POR', index: 0, label: 'POR', jugadorId: null },
    { linea: 'DEF', index: 0, label: 'LD',  jugadorId: null },
    { linea: 'DEF', index: 1, label: 'DFC', jugadorId: null },
    { linea: 'DEF', index: 2, label: 'DFC', jugadorId: null },
    { linea: 'DEF', index: 3, label: 'LI',  jugadorId: null },
    { linea: 'MED', index: 0, label: 'ED',  jugadorId: null },
    { linea: 'MED', index: 1, label: 'MC',  jugadorId: null },
    { linea: 'MED', index: 2, label: 'MC',  jugadorId: null },
    { linea: 'MED', index: 3, label: 'EI',  jugadorId: null },
    { linea: 'DEL', index: 0, label: 'DC',  jugadorId: null },
    { linea: 'DEL', index: 1, label: 'DC',  jugadorId: null },
  ],
  '3-5-2': [
    { linea: 'POR', index: 0, label: 'POR', jugadorId: null },
    { linea: 'DEF', index: 0, label: 'DFC', jugadorId: null },
    { linea: 'DEF', index: 1, label: 'DFC', jugadorId: null },
    { linea: 'DEF', index: 2, label: 'DFC', jugadorId: null },
    { linea: 'MED', index: 0, label: 'LD',  jugadorId: null },
    { linea: 'MED', index: 1, label: 'MC',  jugadorId: null },
    { linea: 'MED', index: 2, label: 'MCO', jugadorId: null },
    { linea: 'MED', index: 3, label: 'MC',  jugadorId: null },
    { linea: 'MED', index: 4, label: 'LI',  jugadorId: null },
    { linea: 'DEL', index: 0, label: 'DC',  jugadorId: null },
    { linea: 'DEL', index: 1, label: 'DC',  jugadorId: null },
  ],
  '5-3-2': [
    { linea: 'POR', index: 0, label: 'POR', jugadorId: null },
    { linea: 'DEF', index: 0, label: 'LD',  jugadorId: null },
    { linea: 'DEF', index: 1, label: 'DFC', jugadorId: null },
    { linea: 'DEF', index: 2, label: 'DFC', jugadorId: null },
    { linea: 'DEF', index: 3, label: 'DFC', jugadorId: null },
    { linea: 'DEF', index: 4, label: 'LI',  jugadorId: null },
    { linea: 'MED', index: 0, label: 'MC',  jugadorId: null },
    { linea: 'MED', index: 1, label: 'MCO', jugadorId: null },
    { linea: 'MED', index: 2, label: 'MC',  jugadorId: null },
    { linea: 'DEL', index: 0, label: 'DC',  jugadorId: null },
    { linea: 'DEL', index: 1, label: 'DC',  jugadorId: null },
  ],
};

// ============================================================
// HELPERS
// ============================================================
const categorizarPosicion = (posicion: string): LineaTactica => {
  if (posicion === 'POR') return 'POR';
  if (['DFC', 'LD', 'LI'].includes(posicion)) return 'DEF';
  if (['MC', 'MCO'].includes(posicion)) return 'MED';
  return 'DEL';
};

const caColor = (ca: number) => {
  if (ca >= 80) return 'from-amber-400 to-yellow-300';
  if (ca >= 65) return 'from-teal-400 to-emerald-300';
  if (ca >= 50) return 'from-sky-400 to-blue-300';
  return 'from-slate-400 to-slate-300';
};

const caBorder = (ca: number) => {
  if (ca >= 80) return 'border-amber-400/70';
  if (ca >= 65) return 'border-teal-400/70';
  if (ca >= 50) return 'border-sky-400/70';
  return 'border-slate-600';
};

const lineaColor: Record<LineaTactica, string> = {
  POR: 'text-amber-400',
  DEF: 'text-blue-400',
  MED: 'text-emerald-400',
  DEL: 'text-rose-400',
};

const lineaBadge: Record<LineaTactica, string> = {
  POR: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  DEF: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  MED: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  DEL: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export const TacticaView: React.FC = () => {
  const {
    equipoUsuario,
    jugadores,
    toggleTitular,
    actualizarPosicionesTacticas,
    actualizarTactica,
    establecerRolTactico,
    establecerPateadorPenales,
    establecerPateadorTirosLibres,
    establecerPateadorCorners,
    establecerEstrategiaCorner,
    establecerEstrategiaPases,
  } = useGame();

  const [criterioOrden, setCriterioOrden] = useState<CriterioOrden>('ca');
  const [direccionOrden, setDireccionOrden] = useState<DireccionOrden>('DESC');

  // --- ESTADOS Y MANEJADORES DE ROLES TÁCTICOS (CLIC DERECHO / PULSACIÓN LARGA) ---
  const [menuRolJugador, setMenuRolJugador] = useState<{ jugador: Jugador; x: number; y: number } | null>(null);
  const touchTimeoutRef = useRef<number | null>(null);

  const handleContextMenu = (e: React.MouseEvent, j: Jugador) => {
    e.preventDefault();
    setMenuRolJugador({
      jugador: j,
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleTouchStart = (e: React.TouchEvent, j: Jugador) => {
    const touch = e.touches[0];
    const clientX = touch.clientX;
    const clientY = touch.clientY;
    
    if (touchTimeoutRef.current) window.clearTimeout(touchTimeoutRef.current);
    
    touchTimeoutRef.current = window.setTimeout(() => {
      e.preventDefault();
      setMenuRolJugador({
        jugador: j,
        x: clientX,
        y: clientY
      });
    }, 600);
  };

  const handleTouchEnd = () => {
    if (touchTimeoutRef.current) {
      window.clearTimeout(touchTimeoutRef.current);
      touchTimeoutRef.current = null;
    }
  };

  // Cerrar el menú con cualquier clic regular
  useEffect(() => {
    const closeMenu = () => setMenuRolJugador(null);
    document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, []);

  if (!equipoUsuario) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400">
        No se encontró el equipo activo. Por favor seleccioná un club.
      </div>
    );
  }

  const jugadoresClub = useMemo(
    () => jugadores.filter(j => j.idEquipo === equipoUsuario.id),
    [jugadores, equipoUsuario.id]
  );

  const formacionActiva: Formacion = equipoUsuario.formacion || '4-3-3';
  const estiloJuegoActivo: EstiloJuego = equipoUsuario.estiloJuego || 'Equilibrado';

  // Nodos de la cancha: mapa de "linea-index" → jugadorId | null
  // Inicializamos a partir de los jugadores del club que ya tengan guardado su 'posicionTactica'.
  // Si no tienen, realizamos una auto-asignación inteligente para no mostrar la cancha vacía.
  const [nodosState, setNodosState] = useState<Record<string, string | null>>(() => {
    const initial: Record<string, string | null> = {};
    
    // Asignar los que ya tienen posición táctica guardada
    const asignados = jugadoresClub.filter(j => j.titular && j.posicionTactica);
    asignados.forEach(j => {
      initial[j.posicionTactica!] = j.id;
    });

    // Si hay titulares que no tienen posición guardada, los auto-asignamos a los nodos vacíos
    const sinPosicion = jugadoresClub.filter(j => j.titular && !j.posicionTactica);
    if (sinPosicion.length > 0) {
      const activeSlots = FORMACIONES_NODOS[formacionActiva];
      const emptySlots = activeSlots.filter(slot => {
        const slotKey = `${slot.linea}-${slot.index}`;
        return !initial[slotKey];
      });

      emptySlots.forEach(slot => {
        const slotKey = `${slot.linea}-${slot.index}`;
        let bestMatchIdx = sinPosicion.findIndex(p => p.posicion === slot.label);
        if (bestMatchIdx === -1) {
          bestMatchIdx = sinPosicion.findIndex(p => categorizarPosicion(p.posicion) === slot.linea);
        }
        if (bestMatchIdx === -1) {
          bestMatchIdx = 0;
        }

        const matchPlayer = sinPosicion[bestMatchIdx];
        if (matchPlayer) {
          initial[slotKey] = matchPlayer.id;
          sinPosicion.splice(bestMatchIdx, 1);
        }
      });
    }

    return initial;
  });

  // Sincronizar el estado inicial auto-asignado con el contexto global
  // Usamos un ref para asegurarnos de que solo se ejecute UNA vez al montar (no en cada re-render)
  const sincronizadoRef = React.useRef(false);
  React.useEffect(() => {
    if (sincronizadoRef.current) return;
    const lacksPosition = jugadoresClub.some(j => j.titular && !j.posicionTactica);
    if (lacksPosition && Object.keys(nodosState).length > 0) {
      sincronizadoRef.current = true;
      actualizarPosicionesTacticas(nodosState);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo al montar

  // DnD state
  const dragJugadorId = useRef<string | null>(null);
  const [dragOverNodo, setDragOverNodo] = useState<string | null>(null);
  const [dragOverBench, setDragOverBench] = useState(false);
  const [jugadorSeleccionadoId, setJugadorSeleccionadoId] = useState<string | null>(null);

  const handleClickNodo = useCallback((linea: LineaTactica, index: number) => {
    const key = `${linea}-${index}`;
    const ocupanteId = nodosState[key] ?? null;

    if (jugadorSeleccionadoId) {
      if (jugadorSeleccionadoId === ocupanteId) {
        setJugadorSeleccionadoId(null);
        return;
      }

      setNodosState(prev => {
        const nuevo = { ...prev };
        const ocupanteActual = prev[key] ?? null;
        const nodoOrigenKey = Object.keys(prev).find(k => prev[k] === jugadorSeleccionadoId) ?? null;

        if (nodoOrigenKey) {
          nuevo[nodoOrigenKey] = ocupanteActual;
        }
        nuevo[key] = jugadorSeleccionadoId;

        setTimeout(() => {
          actualizarPosicionesTacticas(nuevo);
        }, 0);

        return nuevo;
      });
      setJugadorSeleccionadoId(null);
    } else if (ocupanteId) {
      setJugadorSeleccionadoId(ocupanteId);
    }
  }, [jugadorSeleccionadoId, nodosState, actualizarPosicionesTacticas]);

  // Construir lista de nodos activos para la formación, inyectando el jugadorId del estado local
  const nodos: NodoPosicion[] = useMemo(() => {
    return FORMACIONES_NODOS[formacionActiva].map(n => {
      const key = `${n.linea}-${n.index}`;
      return { ...n, jugadorId: nodosState[key] ?? null };
    });
  }, [formacionActiva, nodosState]);

  // IDs de jugadores ya asignados en nodos
  const asignadosIds = useMemo(
    () => new Set(nodos.map(n => n.jugadorId).filter(Boolean) as string[]),
    [nodos]
  );

  // Jugadores disponibles en el banco (no asignados en ningún nodo)
  const bancoDeSuplentes = useMemo(
    () => jugadoresClub.filter(j => !asignadosIds.has(j.id)),
    [jugadoresClub, asignadosIds]
  );

  const bancoOrdenado = useMemo(() => {
    const sorted = ordenarJugadores(bancoDeSuplentes, criterioOrden, direccionOrden);
    return sorted.sort((a, b) => {
      if (a.lesionado && !b.lesionado) return 1;
      if (!a.lesionado && b.lesionado) return -1;
      return 0;
    });
  }, [bancoDeSuplentes, criterioOrden, direccionOrden]);

  // Agrupamos nodos por línea para renderizar filas
  const nodosPorLinea = useMemo(() => {
    const map: Record<LineaTactica, NodoPosicion[]> = { POR: [], DEF: [], MED: [], DEL: [] };
    nodos.forEach(n => map[n.linea].push(n));
    return map;
  }, [nodos]);

  // ============================================================
  // HANDLERS DE DRAG & DROP
  // ============================================================
  const handleDragStart = useCallback((jugadorId: string, e: React.DragEvent) => {
    dragJugadorId.current = jugadorId;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', jugadorId);
  }, []);

  const handleDropOnNodo = useCallback((linea: LineaTactica, index: number, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverNodo(null);
    const jId = dragJugadorId.current;
    if (!jId) return;

    const key = `${linea}-${index}`;

    setNodosState(prev => {
      const nuevo = { ...prev };

      // ¿Hay alguien en el nodo destino?
      const ocupanteActual = prev[key] ?? null;

      // ¿El jugador arrastrado ya estaba en otro nodo?
      const nodoOrigenKey = Object.keys(prev).find(k => prev[k] === jId) ?? null;

      if (ocupanteActual === jId) return prev; // Mismo nodo, no hacer nada

      // Si el jugador viene de otro nodo: swap
      if (nodoOrigenKey) {
        nuevo[nodoOrigenKey] = ocupanteActual; // El ocupante va al nodo origen
      }
      nuevo[key] = jId;

      // Sincronizar fuera del ciclo de renderizado para evitar advertencias de React
      setTimeout(() => {
        actualizarPosicionesTacticas(nuevo);
      }, 0);

      return nuevo;
    });

    dragJugadorId.current = null;
  }, [actualizarPosicionesTacticas]);

  const handleDropOnBench = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOverBench(false);
    const jId = dragJugadorId.current;
    if (!jId) return;

    // Quitar del nodo
    setNodosState(prev => {
      const nuevo = { ...prev };
      Object.keys(nuevo).forEach(k => {
        if (nuevo[k] === jId) nuevo[k] = null;
      });
      
      // Sincronizar fuera del ciclo de renderizado para evitar advertencias de React
      setTimeout(() => {
        actualizarPosicionesTacticas(nuevo);
      }, 0);

      return nuevo;
    });

    dragJugadorId.current = null;
  }, [actualizarPosicionesTacticas]);

  const handleDragOverNodo = useCallback((key: string, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverNodo(key);
  }, []);

  const handleDragOverBench = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverBench(true);
  }, []);

  // ============================================================
  // FORMACIÓN Y ESTILO
  // ============================================================
  const handleFormacionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevaFormacion = e.target.value as Formacion;
    actualizarTactica(nuevaFormacion, estiloJuegoActivo);
    setNodosState({}); // Limpiar asignaciones locales
    actualizarPosicionesTacticas({}); // Sincronizar en el contexto (limpia las posiciones)
  };

  const handleEstiloChange = (estilo: EstiloJuego) => {
    actualizarTactica(formacionActiva, estilo);
  };

  // Conteo de titulares asignados
  const totalAsignados = asignadosIds.size;
  const esValidaAlineacion = totalAsignados === 11;

  // ============================================================
  // SUB-COMPONENTES DE RENDERIZADO
  // ============================================================

  const JugadorCard: React.FC<{ jugador: Jugador; compacto?: boolean }> = ({ jugador, compacto }) => {
    const cat = categorizarPosicion(jugador.posicion);
    const esSeleccionado = jugadorSeleccionadoId === jugador.id;
    return (
      <div
        draggable={!jugador.lesionado}
        onDragStart={e => !jugador.lesionado && handleDragStart(jugador.id, e)}
        onClick={(e) => {
          e.stopPropagation();
          if (jugador.lesionado) return;
          setJugadorSeleccionadoId(prev => prev === jugador.id ? null : jugador.id);
        }}
        className={`
          group relative flex items-center gap-2.5 rounded-xl border transition-all duration-200 select-none cursor-pointer
          ${compacto ? 'p-2' : 'p-2.5'}
          ${jugador.lesionado
            ? 'bg-rose-955/20 border-rose-900/30 opacity-60 cursor-not-allowed'
            : esSeleccionado
              ? 'bg-teal-950/60 border-teal-400 shadow-teal-500/20 shadow-xl scale-[1.02] ring-2 ring-teal-500/50'
              : asignadosIds.has(jugador.id)
                ? 'bg-teal-950/30 border-teal-500/30 cursor-grab shadow-teal-500/10 shadow-lg'
                : 'bg-slate-900/60 border-slate-800 cursor-grab hover:border-slate-600 hover:bg-slate-800/60 active:scale-95'
          }
        `}
        title={jugador.lesionado ? 'Jugador lesionado - no disponible' : `Click para seleccionar y posicionar, o Arrastrá a un nodo`}
      >
        {/* CA Badge */}
        <div className={`relative flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br ${caColor(jugador.ca)} flex items-center justify-center shadow-md`}>
          <span className="text-[10px] font-black text-slate-900">{jugador.ca}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[11px] text-slate-100 truncate leading-tight">
            {jugador.nombre.split(' ').slice(-1)[0]}
          </div>
          <div className="text-[9px] text-slate-500 truncate">{jugador.nombre.split(' ').slice(0, -1).join(' ')}</div>
        </div>

        {/* Posición */}
        <span className={`flex-shrink-0 text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${lineaBadge[cat]} uppercase tracking-wide`}>
          {jugador.posicion}
        </span>

        {/* Forma física mini */}
        <div className="flex-shrink-0 w-1 h-7 rounded-full bg-slate-800 overflow-hidden">
          <div
            className={`w-full rounded-full transition-all ${jugador.formaFisica > 80 ? 'bg-teal-400' : jugador.formaFisica > 60 ? 'bg-amber-400' : 'bg-rose-400'}`}
            style={{ height: `${jugador.formaFisica}%` }}
          />
        </div>

        {/* Lesionado overlay */}
        {jugador.lesionado && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded-full border border-rose-900/40">
            🚑 {jugador.semanasLesionado ?? jugador.semanasLesion}s
          </span>
        )}

        {/* Grip icon */}
        {!jugador.lesionado && (
          <div className="absolute left-0.5 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-0 group-hover:opacity-40 transition-opacity">
            {[0,1,2].map(i => <div key={i} className="w-0.5 h-0.5 rounded-full bg-white" />)}
          </div>
        )}
      </div>
    );
  };

  const NodoCancha: React.FC<{ nodo: NodoPosicion }> = ({ nodo }) => {
    const key = `${nodo.linea}-${nodo.index}`;
    const isOver = dragOverNodo === key;
    const jugador = nodo.jugadorId ? jugadoresClub.find(j => j.id === nodo.jugadorId) : null;

    return (
      <div
        onDragOver={e => handleDragOverNodo(key, e)}
        onDragLeave={() => setDragOverNodo(null)}
        onDrop={e => handleDropOnNodo(nodo.linea, nodo.index, e)}
        onClick={() => handleClickNodo(nodo.linea, nodo.index)}
        className={`
          relative flex flex-col items-center gap-1 transition-all duration-150 cursor-pointer select-none
        `}
      >
        {jugador ? (
          /* NODO OCUPADO */
          <div
            draggable
            onDragStart={e => handleDragStart(jugador.id, e)}
            onContextMenu={e => handleContextMenu(e, jugador)}
            onTouchStart={e => handleTouchStart(e, jugador)}
            onTouchEnd={handleTouchEnd}
            className={`
              relative group flex flex-col items-center cursor-grab active:cursor-grabbing
              ${isOver || jugadorSeleccionadoId === jugador.id ? 'scale-110' : 'hover:scale-105'}
              transition-transform duration-150
            `}
          >
            {/* Glow ring */}
            <div className={`absolute -inset-1.5 rounded-full bg-gradient-to-br ${jugadorSeleccionadoId === jugador.id ? 'from-teal-400 to-emerald-400 scale-110 animate-pulse' : caColor(jugador.ca)} blur-[5px] opacity-50 group-hover:opacity-80 transition-opacity`} />
            {/* Círculo */}
            <div className={`relative w-10 h-10 md:w-12 md:h-12 rounded-full border-2 ${jugadorSeleccionadoId === jugador.id ? 'border-teal-400 ring-2 ring-teal-500/50' : caBorder(jugador.ca)} bg-slate-950 flex items-center justify-center shadow-xl z-10`}>
              <span className={`font-black text-[10px] md:text-xs bg-gradient-to-br ${caColor(jugador.ca)} bg-clip-text text-transparent`}>
                {jugador.ca}
              </span>
            </div>
            {/* Posición badge */}
            <span className={`absolute -top-1 -right-1 z-20 text-[6px] md:text-[7px] font-extrabold px-1 py-0.5 rounded leading-none uppercase border tracking-wide ${lineaBadge[categorizarPosicion(jugador.posicion)]}`}>
              {jugador.posicion}
            </span>
            {/* Nombre */}
            <span className="mt-1.5 text-[8px] md:text-[9px] font-bold text-white bg-slate-950/90 backdrop-blur-sm px-1.5 md:px-2 py-0.5 rounded border border-slate-800 max-w-[62px] md:max-w-[72px] truncate text-center leading-none shadow z-10">
              {jugador.nombre.split(' ').slice(-1)[0]}
            </span>
            {/* Rol táctico si tiene asignado */}
            {jugador.rolTactico && (
              <span className="mt-1 text-[6px] md:text-[7px] font-black text-teal-400 bg-slate-950/95 px-1 py-0.5 rounded border border-teal-500/20 max-w-[62px] md:max-w-[72px] truncate text-center leading-none shadow z-10 uppercase tracking-widest">
                {jugador.rolTactico}
              </span>
            )}
            {/* Pateador de penales */}
            {jugador.esPateadorPenales && (
              <span className="mt-0.5 text-[6px] md:text-[7px] font-black text-amber-400 bg-slate-950/95 px-1 py-0.5 rounded border border-amber-500/20 max-w-[62px] md:max-w-[72px] truncate text-center leading-none shadow z-10 uppercase tracking-widest">
                🎯 Penales
              </span>
            )}
            {/* Pateador de tiros libres */}
            {jugador.esPateadorTirosLibres && (
              <span className="mt-0.5 text-[6px] md:text-[7px] font-black text-blue-400 bg-slate-950/95 px-1 py-0.5 rounded border border-blue-500/20 max-w-[62px] md:max-w-[72px] truncate text-center leading-none shadow z-10 uppercase tracking-widest">
                ☄️ Libres
              </span>
            )}
            {/* Pateador de corners */}
            {jugador.esPateadorCorners && (
              <span className="mt-0.5 text-[6px] md:text-[7px] font-black text-emerald-400 bg-slate-950/95 px-1 py-0.5 rounded border border-emerald-500/20 max-w-[62px] md:max-w-[72px] truncate text-center leading-none shadow z-10 uppercase tracking-widest">
                📐 Córner
              </span>
            )}
            {/* Forma */}
            <div className="mt-1.5 h-1 w-6 md:w-8 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${jugador.formaFisica > 80 ? 'bg-teal-400' : jugador.formaFisica > 60 ? 'bg-amber-400' : 'bg-rose-400'}`}
                style={{ width: `${jugador.formaFisica}%` }}
              />
            </div>
          </div>
        ) : (
          /* NODO VACÍO */
          <div
            className={`
              flex flex-col items-center gap-1 transition-all duration-150
              ${isOver || jugadorSeleccionadoId ? 'scale-110' : ''}
            `}
          >
            <div className={`
              w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-dashed flex items-center justify-center transition-all duration-150
              ${isOver
                ? 'border-teal-400 bg-teal-500/15 shadow-lg shadow-teal-500/20 scale-110'
                : jugadorSeleccionadoId
                  ? 'border-teal-500/50 bg-teal-500/5 animate-pulse'
                  : 'border-white/20 bg-white/3 hover:border-white/35'
              }
            `}>
              <span className={`text-[8px] md:text-[9px] font-extrabold uppercase tracking-wider ${isOver || jugadorSeleccionadoId ? 'text-teal-300' : 'text-white/30'}`}>
                {nodo.label}
              </span>
            </div>
            <span className={`text-[7px] md:text-[8px] font-bold uppercase tracking-widest leading-none ${isOver || jugadorSeleccionadoId ? 'text-teal-400' : 'text-white/20'}`}>
              {isOver ? 'Soltar' : jugadorSeleccionadoId ? 'Poner' : nodo.label}
            </span>
          </div>
        )}
      </div>
    );
  };

  // ============================================================
  // RENDER PRINCIPAL
  // ============================================================
  return (
    <div className="space-y-5 relative">

      {/* ── CABECERA ─────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-teal-500/5 to-transparent pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div>
            <h2 className="text-xl font-extrabold text-slate-100 uppercase tracking-wide flex items-center gap-2">
              🎯 Pizarra Táctica
              <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full font-black border ${esValidaAlineacion ? 'bg-teal-500/10 text-teal-400 border-teal-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>
                {totalAsignados}/11 titulares
              </span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">
              Arrastrá jugadores desde el banco hacia la cancha. Click derecho o mantener presionado un titular para asignarle un Rol Táctico.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Formación */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">Formación</label>
              <select
                value={formacionActiva}
                onChange={handleFormacionChange}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 font-bold focus:outline-none focus:border-teal-500 transition-colors"
              >
                <option value="4-3-3">4-3-3 · Ofensiva clásica</option>
                <option value="4-4-2">4-4-2 · Equilibrio inglés</option>
                <option value="3-5-2">3-5-2 · Posesión y carriles</option>
                <option value="5-3-2">5-3-2 · Muralla y contragolpe</option>
              </select>
            </div>

            {/* Estilo */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">Estilo</label>
              <div className="flex p-1 bg-slate-950 rounded-lg border border-slate-800">
                {(['Ofensivo', 'Equilibrado', 'Defensivo'] as EstiloJuego[]).map(estilo => (
                  <button
                    key={estilo}
                    onClick={() => handleEstiloChange(estilo)}
                    className={`` + `px-3 py-1.5 rounded-md text-[10px] font-extrabold transition-all uppercase tracking-wide ${
                      estiloJuegoActivo === estilo
                        ? 'bg-teal-600 text-white shadow'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {estilo}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modificador del estilo */}
        <div className="mt-4 flex items-center gap-3 text-[11px] text-slate-400 bg-slate-950/40 rounded-xl px-4 py-2.5 border border-slate-800/50">
          <span className="text-lg">{estiloJuegoActivo === 'Ofensivo' ? '⚡' : estiloJuegoActivo === 'Defensivo' ? '🛡️' : '⚖️'}</span>
          <span>
            {estiloJuegoActivo === 'Ofensivo' && <><strong className="text-teal-400">Ataque +15%</strong> · <strong className="text-rose-400">Defensa -10%</strong> — Más goles pero más expuesto</>}
            {estiloJuegoActivo === 'Defensivo' && <><strong className="text-teal-400">Defensa +15%</strong> · <strong className="text-rose-400">Ataque -10%</strong> — Cerrojo férreo</>}
            {estiloJuegoActivo === 'Equilibrado' && <>Sin modificadores — Estadísticas base puras</>}
          </span>
        </div>
      </div>

      {/* ── PANEL DE ESTRATEGIA Y BALÓN PARADO ───────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <h3 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
          ⚙️ Estrategia de Juego y Balón Parado
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Pateador de Penales */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">
              🎯 Pateador de Penales
            </label>
            <select
              value={jugadoresClub.find(j => j.esPateadorPenales)?.id || ''}
              onChange={(e) => establecerPateadorPenales(e.target.value)}
              className="bg-slate-950 border border-slate-850 text-slate-200 border-slate-800 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-teal-500 transition-colors w-full"
            >
              <option value="">Seleccionar pateador...</option>
              {jugadoresClub
                .filter(j => j.titular && !j.lesionado)
                .map(j => (
                  <option key={j.id} value={j.id}>
                    {j.nombre} ({j.posicion})
                  </option>
                ))}
            </select>
          </div>

          {/* Pateador de Tiros Libres */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider flex items-center gap-1">
              ☄️ Tiros Libres
            </label>
            <select
              value={jugadoresClub.find(j => j.esPateadorTirosLibres)?.id || ''}
              onChange={(e) => establecerPateadorTirosLibres(e.target.value)}
              className="bg-slate-950 border border-slate-850 text-slate-200 border-slate-800 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-teal-500 transition-colors w-full"
            >
              <option value="">Seleccionar pateador...</option>
              {jugadoresClub
                .filter(j => j.titular && !j.lesionado)
                .map(j => (
                  <option key={j.id} value={j.id}>
                    {j.nombre} ({j.posicion})
                  </option>
                ))}
            </select>
          </div>

          {/* Pateador de Córners */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider flex items-center gap-1">
              📐 Lanzador de Córners
            </label>
            <select
              value={jugadoresClub.find(j => j.esPateadorCorners)?.id || ''}
              onChange={(e) => establecerPateadorCorners(e.target.value)}
              className="bg-slate-950 border border-slate-850 text-slate-200 border-slate-800 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-teal-500 transition-colors w-full"
            >
              <option value="">Seleccionar lanzador...</option>
              {jugadoresClub
                .filter(j => j.titular && !j.lesionado)
                .map(j => (
                  <option key={j.id} value={j.id}>
                    {j.nombre} ({j.posicion})
                  </option>
                ))}
            </select>
          </div>

          {/* Estrategia de Córner */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">
              🚩 Estrategia de Córner
            </label>
            <select
              value={equipoUsuario.estrategiaCorner || 'Centro al área chica'}
              onChange={(e) => establecerEstrategiaCorner(e.target.value as any)}
              className="bg-slate-950 border border-slate-850 text-slate-200 border-slate-800 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-teal-500 transition-colors w-full"
            >
              <option value="Centro al área chica">Centro al área chica</option>
              <option value="Atacar el primer palo">Atacar el primer palo (vs Lentos)</option>
              <option value="Jugar en corto">Jugar en corto</option>
            </select>
          </div>

          {/* Estrategia de Pases */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">
              👟 Estrategia de Pases
            </label>
            <select
              value={equipoUsuario.estrategiaPases || 'Combinados'}
              onChange={(e) => establecerEstrategiaPases(e.target.value as any)}
              className="bg-slate-950 border border-slate-855 text-slate-200 border-slate-800 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-teal-500 transition-colors w-full"
            >
              <option value="Combinados">Combinados</option>
              <option value="Cortos">Cortos</option>
              <option value="Largos al espacio">Largos al espacio (vs Lentos)</option>
            </select>
          </div>
        </div>

        {/* Info/Warning/Success alert if tactical bonus criteria is met */}
        {equipoUsuario.estrategiaPases === 'Largos al espacio' && equipoUsuario.estrategiaCorner === 'Atacar el primer palo' ? (
          <div className="mt-4 text-[11px] text-teal-400 bg-teal-950/20 border border-teal-800/30 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <span>🔥</span>
            <span>
              <strong>Estrategia de Contraofensiva lista:</strong> Si el rival tiene centrales lentos, obtendrás un <strong>+20% de efectividad de ataque</strong> en el partido.
            </span>
          </div>
        ) : (
          <div className="mt-4 text-[11px] text-slate-400 bg-slate-950/40 border border-slate-800/50 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <span>💡</span>
            <span>
              Combina <strong>Pases: Largos al espacio</strong> y <strong>Córner: Atacar el primer palo</strong> para explotar centrales lentos (+20% efectividad).
            </span>
          </div>
        )}
      </div>

      {/* ── LAYOUT PRINCIPAL: BANCO (IZQ) + CANCHA (DER) ────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">

        {/* ── BANCO DE JUGADORES (izquierda) ─────────────── */}
        <div className="xl:col-span-4 space-y-3">

          {/* Titulares asignados */}
          {asignadosIds.size > 0 && (
            <div className="bg-slate-900/70 border border-teal-800/30 rounded-2xl p-4 shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase font-extrabold text-teal-500 tracking-wider">✅ En el Campo</span>
                <span className="text-[10px] font-bold text-teal-400">{asignadosIds.size} jugadores</span>
              </div>
              <div className="space-y-1.5">
                {jugadoresClub
                  .filter(j => asignadosIds.has(j.id))
                  .sort((a, b) => b.ca - a.ca)
                  .map(j => <JugadorCard key={j.id} jugador={j} compacto />)}
              </div>
            </div>
          )}

          {/* Suplentes / banco (zona de drop para quitar del campo) */}
          <div
            onDragOver={handleDragOverBench}
            onDragLeave={() => setDragOverBench(false)}
            onDrop={handleDropOnBench}
            onClick={() => {
              if (jugadorSeleccionadoId) {
                const jId = jugadorSeleccionadoId;
                // Si el jugador seleccionado estaba en un nodo, quitarlo
                setNodosState(prev => {
                  const nuevo = { ...prev };
                  Object.keys(nuevo).forEach(k => {
                    if (nuevo[k] === jId) nuevo[k] = null;
                  });
                  setTimeout(() => {
                    actualizarPosicionesTacticas(nuevo);
                  }, 0);
                  return nuevo;
                });
                setJugadorSeleccionadoId(null);
              }
            }}
            className={`rounded-2xl border p-4 cursor-pointer transition-all duration-200 ${
              dragOverBench
                ? 'bg-slate-700/30 border-slate-500 shadow-inner'
                : 'bg-slate-900/50 border-slate-800'
            }`}
          >
            <div className="flex flex-col gap-2 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">
                  🪑 Banco de Suplentes
                </span>
                <span className="text-[10px] font-bold text-slate-500">{bancoDeSuplentes.length} disponibles</span>
              </div>
              
              {/* Panel de Ordenación Compacto */}
              <div className="flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
                <span className="text-[9px] uppercase font-black text-slate-500 pl-1">Filtrar:</span>
                <select
                  value={criterioOrden}
                  onChange={(e) => setCriterioOrden(e.target.value as CriterioOrden)}
                  className="bg-slate-900 text-slate-200 border border-slate-800 rounded px-1.5 py-0.5 text-[10px] font-extrabold focus:outline-none focus:border-teal-500 transition-colors flex-1"
                >
                  <optgroup label="Calidad y Finanzas">
                    <option value="ca">Nivel / Calidad (CA)</option>
                    <option value="pa">Potencial de Habilidad (PA)</option>
                    <option value="valorMercado">Valor de Mercado</option>
                    <option value="salarioSemanal">Salario Semanal</option>
                    <option value="edad">Edad</option>
                  </optgroup>
                  <optgroup label="Estado Físico y Mental">
                    <option value="formaFisica">Forma Física</option>
                    <option value="moral">Moral / Ánimo</option>
                  </optgroup>
                  <optgroup label="Atributos Técnicos">
                    <option value="remate">Remate / Definición</option>
                    <option value="pase">Habilidad de Pase</option>
                    <option value="regate">Regate / Dribbling</option>
                    <option value="defensa">Defensa / Marcaje</option>
                    <option value="tecnica">Técnica / Control</option>
                  </optgroup>
                  <optgroup label="Atributos Físicos">
                    <option value="velocidad">Velocidad</option>
                    <option value="aceleracion">Aceleración</option>
                    <option value="resistencia">Resistencia</option>
                    <option value="fuerza">Fuerza</option>
                  </optgroup>
                  <optgroup label="Atributos Mentales y Arco">
                    <option value="vision">Visión de Juego</option>
                    <option value="decisiones">Toma de Decisiones</option>
                    <option value="determinacion">Determinación</option>
                    <option value="posicionamiento">Colocación</option>
                    <option value="reflejos">Reflejos (Portero)</option>
                  </optgroup>
                  <optgroup label="Historial de Rendimiento">
                    <option value="goles">Goles Anotados</option>
                    <option value="asistencias">Asistencias Dadas</option>
                    <option value="partidosJugados">Partidos Jugados</option>
                    <option value="calificacionMedia">Calificación Promedio</option>
                  </optgroup>
                </select>

                <button
                  onClick={() => setDireccionOrden(prev => prev === 'ASC' ? 'DESC' : 'ASC')}
                  className="p-1 hover:bg-slate-800 rounded text-[9px] font-black text-teal-400 hover:text-white transition-colors border border-slate-800 px-1.5 flex items-center"
                  title={direccionOrden === 'ASC' ? 'Orden Ascendente' : 'Orden Descendente'}
                >
                  {direccionOrden === 'ASC' ? '⬆️' : '⬇️'}
                </button>
              </div>
            </div>

            {dragOverBench && (
              <div className="mb-3 text-center text-[10px] text-slate-400 bg-slate-800/60 rounded-xl p-2 border border-dashed border-slate-600">
                Soltá aquí para quitar del once
              </div>
            )}

            <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
              {bancoOrdenado.length === 0 ? (
                <div className="text-center text-[11px] text-slate-600 py-6">
                  Todos los jugadores están en el campo
                </div>
              ) : (
                bancoOrdenado.map(j => <JugadorCard key={j.id} jugador={j} />)
              )}
            </div>
          </div>

          {/* Leyenda */}
          <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-3 text-[10px] text-slate-500 space-y-1">
            <div className="font-bold text-slate-400 mb-1.5">Leyenda de CA</div>
            {[
              { label: '80+', gradient: 'from-amber-400 to-yellow-300', text: 'Élite mundial' },
              { label: '65–79', gradient: 'from-teal-400 to-emerald-300', text: 'Nivel alto' },
              { label: '50–64', gradient: 'from-sky-400 to-blue-300', text: 'Nivel medio' },
              { label: '<50', gradient: 'from-slate-400 to-slate-300', text: 'En desarrollo' },
            ].map(({ label, gradient, text }) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${gradient} flex-shrink-0`} />
                <span><strong className="text-slate-300">{label}</strong> — {text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── CANCHA VISUAL (derecha) ───────────────────── */}
        <div className="xl:col-span-8">
          <div
            className="relative rounded-3xl overflow-hidden shadow-2xl select-none"
            style={{ background: 'linear-gradient(180deg, #0a2012 0%, #0d2e18 25%, #0b2915 50%, #0d2e18 75%, #0a2012 100%)' }}
          >
            {/* Franjas de césped */}
            <div className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: 'repeating-linear-gradient(180deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 40px, transparent 40px, transparent 80px)'
              }}
            />

            {/* Marcas de cancha SVG */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 560" preserveAspectRatio="none">
              {/* Borde exterior */}
              <rect x="20" y="20" width="360" height="520" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" rx="4" />
              {/* Línea de medio campo */}
              <line x1="20" y1="280" x2="380" y2="280" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
              {/* Círculo central */}
              <circle cx="200" cy="280" r="55" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1.5" />
              <circle cx="200" cy="280" r="3" fill="rgba(255,255,255,0.2)" />
              {/* Área grande inferior (local) */}
              <rect x="90" y="440" width="220" height="80" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1.5" />
              {/* Área pequeña inferior */}
              <rect x="150" y="500" width="100" height="40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              {/* Arco inferior */}
              <rect x="170" y="530" width="60" height="12" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" rx="1" />
              {/* Área grande superior (visitante) */}
              <rect x="90" y="40" width="220" height="80" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1.5" />
              {/* Área pequeña superior */}
              <rect x="150" y="40" width="100" height="40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              {/* Arco superior */}
              <rect x="170" y="38" width="60" height="12" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" rx="1" />
              {/* Punto de penalti inferior */}
              <circle cx="200" cy="470" r="2.5" fill="rgba(255,255,255,0.2)" />
              {/* Punto de penalti superior */}
              <circle cx="200" cy="90" r="2.5" fill="rgba(255,255,255,0.2)" />
              {/* Semicírculo área inferior */}
              <path d="M 135 440 A 65 65 0 0 0 265 440" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              {/* Semicírculo área superior */}
              <path d="M 135 120 A 65 65 0 0 1 265 120" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            </svg>

            {/* JUGADORES EN CANCHA */}
            <div className="relative z-10 flex flex-col justify-between py-6 md:py-10 px-1 md:px-6 min-h-[460px] md:min-h-[560px]">
              {/* Etiqueta Visitante */}
              <div className="text-center mb-2">
                <span className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-white/20">Arco Visitante</span>
              </div>

              {/* DEL */}
              <div className="flex items-center justify-around px-1 md:px-4 py-1.5 md:py-2">
                {nodosPorLinea.DEL.map(nodo => (
                  <NodoCancha key={`${nodo.linea}-${nodo.index}`} nodo={nodo} />
                ))}
              </div>

              {/* MED */}
              <div className="flex items-center justify-around px-1 md:px-2 py-1.5 md:py-2">
                {nodosPorLinea.MED.map(nodo => (
                  <NodoCancha key={`${nodo.linea}-${nodo.index}`} nodo={nodo} />
                ))}
              </div>

              {/* DEF */}
              <div className="flex items-center justify-around px-1 md:px-4 py-1.5 md:py-2">
                {nodosPorLinea.DEF.map(nodo => (
                  <NodoCancha key={`${nodo.linea}-${nodo.index}`} nodo={nodo} />
                ))}
              </div>

              {/* POR */}
              <div className="flex items-center justify-center py-1.5 md:py-2">
                {nodosPorLinea.POR.map(nodo => (
                  <NodoCancha key={`${nodo.linea}-${nodo.index}`} nodo={nodo} />
                ))}
              </div>

              {/* Etiqueta Local */}
              <div className="text-center mt-2">
                <span className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-white/20">Tu Arco</span>
              </div>
            </div>

            {/* Overlay de validación */}
            <div className={`absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-extrabold border backdrop-blur-sm transition-all ${
              esValidaAlineacion
                ? 'bg-teal-950/80 border-teal-500/40 text-teal-300'
                : 'bg-slate-950/80 border-slate-700 text-slate-400'
            }`}>
              {esValidaAlineacion ? '✅' : `⚙️ ${totalAsignados}/11`}
              {esValidaAlineacion ? ' Equipo listo' : ' Completá el once'}
            </div>
          </div>

          {/* Alerta si está incompleto */}
          {!esValidaAlineacion && totalAsignados > 0 && (
            <div className="mt-3 flex items-start gap-2.5 text-[11px] text-amber-300 bg-amber-500/8 border border-amber-500/20 rounded-xl px-4 py-3">
              <span className="mt-0.5">⚡</span>
              <span>
                <strong className="font-bold">Alineación incompleta:</strong> Faltan {11 - totalAsignados} jugadores por asignar.
                Si avanzás el día así, el motor usará automáticamente los 11 de mayor CA como titulares provisionales.
              </span>
            </div>
          )}

          {totalAsignados === 0 && (
            <div className="mt-3 flex items-center gap-2.5 text-[11px] text-slate-500 bg-slate-900/40 border border-slate-800 rounded-xl px-4 py-3">
              <span>👆</span>
              <span>Arrastrá una tarjeta del banco hacia cualquier nodo de la cancha para asignar titulares.</span>
            </div>
          )}
        </div>
      </div>

      {/* ==========================================
          MENÚ CONTEXTUAL DE ROLES TÁCTICOS
          ========================================== */}
      {menuRolJugador && (
        <div
          className="fixed z-55 bg-slate-950/95 border border-slate-850 rounded-xl shadow-2xl p-2 w-52 text-left animate-scale-in"
          style={{ top: menuRolJugador.y, left: menuRolJugador.x }}
        >
          <div className="px-3 py-1.5 text-[9px] uppercase font-black text-slate-500 border-b border-slate-850 flex justify-between items-center mb-1">
            <span>Asignar Rol</span>
            <span className="font-extrabold text-[10px] text-teal-400">{menuRolJugador.jugador.nombre.split(' ').slice(-1)[0]}</span>
          </div>

          {/* Delantero roles */}
          {categorizarPosicion(menuRolJugador.jugador.posicion) === 'DEL' && (
            <div className="space-y-0.5">
              <button
                onClick={() => establecerRolTactico(menuRolJugador.jugador.id, 'Hombre de Área')}
                className={`w-full px-2.5 py-1.5 text-xs text-left rounded-lg transition-all flex flex-col ${
                  menuRolJugador.jugador.rolTactico === 'Hombre de Área'
                    ? 'bg-teal-650 text-white font-bold'
                    : 'text-slate-300 hover:bg-slate-850 hover:text-white'
                }`}
              >
                <span>Hombre de Área</span>
                <span className="text-[8px] text-slate-500 group-hover:text-slate-300 font-medium">+3 Remate | -3 Velocidad</span>
              </button>
              <button
                onClick={() => establecerRolTactico(menuRolJugador.jugador.id, 'Delantero Avanzado')}
                className={`w-full px-2.5 py-1.5 text-xs text-left rounded-lg transition-all flex flex-col mt-0.5 ${
                  menuRolJugador.jugador.rolTactico === 'Delantero Avanzado'
                    ? 'bg-teal-655 text-white font-bold'
                    : 'text-slate-300 hover:bg-slate-855 hover:text-white'
                }`}
              >
                <span>Delantero Avanzado</span>
                <span className="text-[8px] text-slate-500 group-hover:text-slate-300 font-medium">+3 Velocidad</span>
              </button>
            </div>
          )}

          {/* Mediocampista roles */}
          {categorizarPosicion(menuRolJugador.jugador.posicion) === 'MED' && (
            <div className="space-y-0.5">
              <button
                onClick={() => establecerRolTactico(menuRolJugador.jugador.id, 'Pivote Defensivo')}
                className={`w-full px-2.5 py-1.5 text-xs text-left rounded-lg transition-all flex flex-col ${
                  menuRolJugador.jugador.rolTactico === 'Pivote Defensivo'
                    ? 'bg-teal-650 text-white font-bold'
                    : 'text-slate-300 hover:bg-slate-850 hover:text-white'
                }`}
              >
                <span>Pivote Defensivo</span>
                <span className="text-[8px] text-slate-500 group-hover:text-slate-300 font-medium">+3 Defensa</span>
              </button>
              <button
                onClick={() => establecerRolTactico(menuRolJugador.jugador.id, 'Organizador')}
                className={`w-full px-2.5 py-1.5 text-xs text-left rounded-lg transition-all flex flex-col mt-0.5 ${
                  menuRolJugador.jugador.rolTactico === 'Organizador'
                    ? 'bg-teal-650 text-white font-bold'
                    : 'text-slate-300 hover:bg-slate-850 hover:text-white'
                }`}
              >
                <span>Organizador</span>
                <span className="text-[8px] text-slate-500 group-hover:text-slate-300 font-medium">+3 Pase | +3 Visión</span>
              </button>
            </div>
          )}

          {/* Opción Pateador de Penales */}
          <button
            onClick={() => establecerPateadorPenales(menuRolJugador.jugador.id)}
            className={`w-full px-2.5 py-1.5 text-xs text-left rounded-lg transition-all flex flex-col mt-0.5 border-t border-slate-850/30 pt-1.5 ${
              menuRolJugador.jugador.esPateadorPenales
                ? 'bg-amber-600/20 text-amber-300 font-bold border border-amber-500/20'
                : 'text-slate-350 hover:bg-slate-850 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span>🎯</span>
              <span>Pateador de Penales</span>
            </div>
            <span className="text-[8px] text-slate-500 font-medium">Asignar tiro principal desde los 12 pasos</span>
          </button>

          {/* Opción Limpiar Rol */}
          <button
            onClick={() => establecerRolTactico(menuRolJugador.jugador.id, null)}
            className="w-full px-2.5 py-1.5 text-xs text-left rounded-lg text-rose-450 hover:bg-rose-955/20 hover:text-rose-350 transition-colors mt-1.5 pt-2 border-t border-slate-850 flex justify-between items-center"
          >
            <span>Quitar Rol</span>
            <span>✕</span>
          </button>
        </div>
      )}

    </div>
  );
};
