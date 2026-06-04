import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/useGame';
import { GrupoCopa, PartidoCopa, CopaCampeones, TablaCopa, Equipo } from '../types';
import { equiposLaLiga, equiposPremier, equiposSerieA, obtenerClimaAleatorio } from '../data/initialData';

// Helper para determinar el país del equipo
const obtenerPais = (equipoId: string): string => {
  if (equiposLaLiga.some(e => e.id === equipoId)) return 'España';
  if (equiposPremier.some(e => e.id === equipoId)) return 'Inglaterra';
  if (equiposSerieA.some(e => e.id === equipoId)) return 'Italia';
  return 'Alemania';
};

interface IntegranteSorteo {
  id: string;
  nombre: string;
  escudo: string;
  reputacion: number;
  pais: string;
}

export const SorteoCopasView: React.FC = () => {
  const {
    equipos,
    equipoUsuarioId,
    sorteoCopaActivo,
    guardarSorteoCopa,
    fechaActual
  } = useGame();

  if (!sorteoCopaActivo) return null;

  const { tipo, fase, copa, participantes } = sorteoCopaActivo;
  const isChampions = tipo === 'champions';
  const labelCopa = isChampions ? 'Copa de Campeones' : 'Copa Europa';

  // Obtener info completa de los participantes
  const participantesInfo: IntegranteSorteo[] = participantes.map(pId => {
    const eq = equipos.find(e => e.id === pId);
    return {
      id: pId,
      nombre: eq?.nombre || pId,
      escudo: eq?.escudo || '⚽',
      reputacion: eq?.reputacion || 50,
      pais: obtenerPais(pId)
    };
  });

  // --- LOGICA DE COSTRUIDO DE DRAW PRE-DETERMINADO Y SEGURO ---
  // Estructuras para guardar el draw real generado
  const [gruposFinales, setGruposFinales] = useState<Record<string, IntegranteSorteo[]>>({});
  const [crucesCuartosFinales, setCrucesCuartosFinales] = useState<{ local: IntegranteSorteo; visitante: IntegranteSorteo }[]>([]);
  
  // Pasos de animación
  const [pasoActual, setPasoActual] = useState<number>(0);
  const [animando, setAnimando] = useState<boolean>(false);
  const [autoSimular, setAutoSimular] = useState<boolean>(false);
  const [bolillaRevelada, setBolillaRevelada] = useState<IntegranteSorteo | null>(null);
  const [revelando, setRevelando] = useState<boolean>(false);
  const [grupoDestino, setGrupoDestino] = useState<string>('');
  
  // Alerta de Grupo de la Muerte
  const [alertaMuerte, setAlertaMuerte] = useState<{ activa: boolean; gigante: IntegranteSorteo | null }>({
    activa: false,
    gigante: null
  });

  // Listado de pasos del draw para animar secuencialmente
  const [secuenciaSorteo, setSecuenciaSorteo] = useState<{ team: IntegranteSorteo; grupoId: string; potIdx: number }[]>([]);
  const [secuenciaCuartos, setSecuenciaCuartos] = useState<{ team: IntegranteSorteo; cruceIdx: number; esLocal: boolean }[]>([]);

  // Copones/Bolilleros visuales iniciales
  const [copon1, setCopon1] = useState<IntegranteSorteo[]>([]);
  const [copon2, setCopon2] = useState<IntegranteSorteo[]>([]);
  const [copon3, setCopon3] = useState<IntegranteSorteo[]>([]);
  const [copon4, setCopon4] = useState<IntegranteSorteo[]>([]);

  // Bolilleros para Cuartos (Ganadores vs Segundos)
  const [bolilleroGanadores, setBolilleroGanadores] = useState<IntegranteSorteo[]>([]);
  const [bolilleroSegundos, setBolilleroSegundos] = useState<IntegranteSorteo[]>([]);

  // Inicialización del sorteo (se ejecuta una única vez)
  useEffect(() => {
    if (fase === 'grupos') {
      // 1. Organizar equipos por país
      const paises = ['España', 'Inglaterra', 'Italia', 'Alemania'];
      const equiposPorPais: Record<string, IntegranteSorteo[]> = {};
      paises.forEach(p => {
        equiposPorPais[p] = participantesInfo
          .filter(eq => eq.pais === p)
          .sort((a, b) => b.reputacion - a.reputacion);
      });

      // 2. Definir copones (Pots) basados en jerarquía dentro de su país
      const p1 = [equiposPorPais['España'][0], equiposPorPais['Inglaterra'][0], equiposPorPais['Italia'][0], equiposPorPais['Alemania'][0]];
      const p2 = [equiposPorPais['España'][1], equiposPorPais['Inglaterra'][1], equiposPorPais['Italia'][1], equiposPorPais['Alemania'][1]];
      const p3 = [equiposPorPais['España'][2], equiposPorPais['Inglaterra'][2], equiposPorPais['Italia'][2], equiposPorPais['Alemania'][2]];
      const p4 = [equiposPorPais['España'][3], equiposPorPais['Inglaterra'][3], equiposPorPais['Italia'][3], equiposPorPais['Alemania'][3]];

      setCopon1(p1);
      setCopon2(p2);
      setCopon3(p3);
      setCopon4(p4);

      // 3. Generar un sorteo aleatorio pero válido (sin repetir país y respetando un equipo de cada pote por grupo)
      // Buscamos una combinación válida shuffler
      let esValido = false;
      let finalA: IntegranteSorteo[] = [];
      let finalB: IntegranteSorteo[] = [];
      let finalC: IntegranteSorteo[] = [];
      let finalD: IntegranteSorteo[] = [];

      while (!esValido) {
        // Copia para mezclar
        const shuffP1 = [...p1].sort(() => Math.random() - 0.5);
        const shuffP2 = [...p2].sort(() => Math.random() - 0.5);
        const shuffP3 = [...p3].sort(() => Math.random() - 0.5);
        const shuffP4 = [...p4].sort(() => Math.random() - 0.5);

        finalA = [shuffP1[0], shuffP2[0], shuffP3[0], shuffP4[0]];
        finalB = [shuffP1[1], shuffP2[1], shuffP3[1], shuffP4[1]];
        finalC = [shuffP1[2], shuffP2[2], shuffP3[2], shuffP4[2]];
        finalD = [shuffP1[3], shuffP2[3], shuffP3[3], shuffP4[3]];

        // Validar que no haya países repetidos en ningún grupo
        const checkGrupoValido = (arr: IntegranteSorteo[]) => {
          const paisesSet = new Set(arr.map(x => x.pais));
          return paisesSet.size === 4;
        };

        if (checkGrupoValido(finalA) && checkGrupoValido(finalB) && checkGrupoValido(finalC) && checkGrupoValido(finalD)) {
          esValido = true;
        }
      }

      // 4. Crear la secuencia de animación paso a paso
      // Dibujamos Pote 1 (a Grupo A, B, C, D), luego Pote 2, etc.
      const seq: { team: IntegranteSorteo; grupoId: string; potIdx: number }[] = [];
      const gruposMap = ['A', 'B', 'C', 'D'];
      const arraysGrupos = [finalA, finalB, finalC, finalD];

      // Añadimos por pote
      for (let pot = 0; pot < 4; pot++) {
        for (let grp = 0; grp < 4; grp++) {
          seq.push({
            team: arraysGrupos[grp][pot],
            grupoId: gruposMap[grp],
            potIdx: pot + 1
          });
        }
      }

      setSecuenciaSorteo(seq);
      setGruposFinales({ A: [], B: [], C: [], D: [] });

    } else {
      // --- FASE DE CUARTOS ---
      // Determinamos los ganadores y segundos de la copa actual
      const ganadoresIds: string[] = [];
      const segundosIds: string[] = [];

      copa.grupos.forEach(grupo => {
        const tablaOrdenada = [...grupo.tabla].sort((a, b) => {
          if (b.puntos !== a.puntos) return b.puntos - a.puntos;
          if (b.diferenciaGoles !== a.diferenciaGoles) return b.diferenciaGoles - a.diferenciaGoles;
          return b.golesFavor - a.golesFavor;
        });
        ganadoresIds.push(tablaOrdenada[0].idEquipo);
        segundosIds.push(tablaOrdenada[1].idEquipo);
      });

      const ganadores = ganadoresIds.map(id => participantesInfo.find(x => x.id === id)!);
      const segundos = segundosIds.map(id => participantesInfo.find(x => x.id === id)!);

      setBolilleroGanadores(ganadores);
      setBolilleroSegundos(segundos);

      // Generar un emparejamiento aleatorio válido (un primero no puede jugar contra el segundo de su propio grupo)
      // En este caso simplificado, los ganadores se mapean a los grupos A, B, C, D en orden
      // Mapeamos los segundos de forma que no coincidan con su propio grupo
      let esValido = false;
      let segundosSorteados: IntegranteSorteo[] = [];

      while (!esValido) {
        segundosSorteados = [...segundos].sort(() => Math.random() - 0.5);
        // Validamos que el segundo de grupo X no juegue contra el primero de grupo X
        // El primero de A (índice 0) no puede jugar contra el segundo de A (que está en segundos, buscamos su grupo de origen)
        // Buscamos el grupo de origen de cada clasificado en la copa original
        const obtenerGrupoOrigen = (eqId: string) => {
          return copa.grupos.find(g => g.equipos.includes(eqId))?.id || '';
        };

        esValido = true;
        for (let i = 0; i < 4; i++) {
          const winnerId = ganadores[i].id;
          const runnerId = segundosSorteados[i].id;
          if (obtenerGrupoOrigen(winnerId) === obtenerGrupoOrigen(runnerId)) {
            esValido = false;
            break;
          }
        }
      }

      // Crear secuencia de animación
      // Cruce 1: Winner A, Runner X
      // Cruce 2: Winner B, Runner Y
      // etc.
      const seq: { team: IntegranteSorteo; cruceIdx: number; esLocal: boolean }[] = [];
      for (let i = 0; i < 4; i++) {
        seq.push({ team: ganadores[i], cruceIdx: i, esLocal: true });
        seq.push({ team: segundosSorteados[i], cruceIdx: i, esLocal: false });
      }

      setSecuenciaCuartos(seq);
      setCrucesCuartosFinales(Array.from({ length: 4 }, () => ({
        local: { id: '', nombre: 'Por sortear', escudo: '❓', reputacion: 0, pais: '' },
        visitante: { id: '', nombre: 'Por sortear', escudo: '❓', reputacion: 0, pais: '' }
      })));
    }
  }, [fase]);

  // --- INTERVAL CONTROL PARA SIMULACIÓN AUTOMÁTICA ---
  const autoSimTimer = useRef<any>(null);

  useEffect(() => {
    if (autoSimular && !animando) {
      const seqLength = fase === 'grupos' ? secuenciaSorteo.length : secuenciaCuartos.length;
      if (pasoActual < seqLength) {
        autoSimTimer.current = setTimeout(() => {
          sacarSiguienteBolilla();
        }, 1200);
      } else {
        setAutoSimular(false);
      }
    }
    return () => {
      if (autoSimTimer.current) clearTimeout(autoSimTimer.current);
    };
  }, [autoSimular, pasoActual, animando, secuenciaSorteo, secuenciaCuartos]);

  // --- ACCION: SACAR BOLILLA ---
  const sacarSiguienteBolilla = () => {
    const seqLength = fase === 'grupos' ? secuenciaSorteo.length : secuenciaCuartos.length;
    if (pasoActual >= seqLength || animando) return;

    setAnimando(true);
    setRevelando(true);

    if (fase === 'grupos') {
      const item = secuenciaSorteo[pasoActual];
      setBolillaRevelada(item.team);
      setGrupoDestino(item.grupoId);

      // Descontar del copón visual correspondiente
      if (item.potIdx === 1) setCopon1(prev => prev.filter(x => x.id !== item.team.id));
      else if (item.potIdx === 2) setCopon2(prev => prev.filter(x => x.id !== item.team.id));
      else if (item.potIdx === 3) setCopon3(prev => prev.filter(x => x.id !== item.team.id));
      else if (item.potIdx === 4) setCopon4(prev => prev.filter(x => x.id !== item.team.id));

      // Animación de revelado
      setTimeout(() => {
        setRevelando(false);

        // Añadir equipo a la tabla de grupos mostrados
        setGruposFinales(prev => {
          const currentGroup = prev[item.grupoId] || [];
          return {
            ...prev,
            [item.grupoId]: [...currentGroup, item.team]
          };
        });

        // Verificar drama de Grupo de la Muerte
        // Si el equipo sorteado es del manager, ver si hay gigantes con rep >= 88 en el grupo
        if (item.team.id === equipoUsuarioId) {
          // Buscamos los otros que ya están en el grupo, y los que faltan entrar
          // Como ya tenemos el listado final de ese grupo definido en finalA/B/C/D, podemos ver
          // qué gigantes de reputación >= 88 le tocaron.
          // Encontramos el grupo del usuario completo en la secuencia
          const seqGrupo = secuenciaSorteo.filter(x => x.grupoId === item.grupoId);
          const gigantesEnGrupo = seqGrupo.filter(x => x.team.id !== equipoUsuarioId && x.team.reputacion >= 88);
          if (gigantesEnGrupo.length > 0) {
            // Ordenar por reputación para mostrar el más temible
            const masTemible = [...gigantesEnGrupo].sort((a, b) => b.team.reputacion - a.team.reputacion)[0].team;
            setTimeout(() => {
              setAlertaMuerte({
                activa: true,
                gigante: masTemible
              });
            }, 800);
          }
        }

        // Si el sorteado no es del manager, pero el del manager YA está en este grupo,
        // y el sorteado es un gigante, también mostramos la alerta.
        if (item.team.id !== equipoUsuarioId && item.team.reputacion >= 88) {
          const miGrupoItem = secuenciaSorteo.find(x => x.team.id === equipoUsuarioId);
          if (miGrupoItem && miGrupoItem.grupoId === item.grupoId) {
            // El manager está en este grupo! Y acaba de entrar un gigante
            setTimeout(() => {
              setAlertaMuerte({
                activa: true,
                gigante: item.team
              });
            }, 800);
          }
        }

        setPasoActual(prev => prev + 1);
        setAnimando(false);
      }, 1000);

    } else {
      // Fase de Cuartos
      const item = secuenciaCuartos[pasoActual];
      setBolillaRevelada(item.team);

      // Descontar de bolilleros visuales
      if (item.esLocal) setBolilleroGanadores(prev => prev.filter(x => x.id !== item.team.id));
      else setBolilleroSegundos(prev => prev.filter(x => x.id !== item.team.id));

      setTimeout(() => {
        setRevelando(false);

        setCrucesCuartosFinales(prev => {
          const list = [...prev];
          if (item.esLocal) {
            list[item.cruceIdx] = { ...list[item.cruceIdx], local: item.team };
          } else {
            list[item.cruceIdx] = { ...list[item.cruceIdx], visitante: item.team };
          }
          return list;
        });

        setPasoActual(prev => prev + 1);
        setAnimando(false);
      }, 1000);
    }
  };

  // --- ACCION: FINALIZAR Y GUARDAR ---
  const finalizarSorteoCompleto = () => {
    if (fase === 'grupos') {
      // Re-formatear los grupos creados al formato GrupoCopa
      const gruposMap = ['A', 'B', 'C', 'D'];
      const gruposCopa: GrupoCopa[] = gruposMap.map(gId => {
        const integrantes = gruposFinales[gId] || [];
        const eqIds = integrantes.map(x => x.id);
        
        // Crear tabla vacía
        const tabla: TablaCopa[] = integrantes.map(eq => ({
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
        }));

        return {
          id: gId,
          equipos: eqIds,
          tabla
        };
      });

      // Generar los fixtures de cada grupo utilizando la programación de inicializarCopa
      const programarGrupoFixture = (grupoId: string, T: string[]) => {
        const roundsDef = [
          [[0, 1], [2, 3]],
          [[1, 2], [3, 0]],
          [[0, 2], [1, 3]],
          [[1, 0], [3, 2]],
          [[2, 1], [0, 3]],
          [[2, 0], [3, 1]]
        ];
        
        // Calcular fecha de inicio en base al año actual
        const anioActual = new Date(fechaActual + 'T12:00:00').getFullYear();
        const fechaInicio = `${anioActual}-08-17`;

        const sumarDiasLoc = (fechaStr: string, dias: number): string => {
          const date = new Date(fechaStr + 'T12:00:00');
          date.setDate(date.getDate() + dias);
          const yyyy = date.getFullYear();
          const mm = String(date.getMonth() + 1).padStart(2, '0');
          const dd = String(date.getDate()).padStart(2, '0');
          return `${yyyy}-${mm}-${dd}`;
        };

        return roundsDef.map((pairs, roundIdx) => {
          const jornadaNum = roundIdx + 1;
          const offset = [2, 16, 30, 44, 58, 72][roundIdx];
          const fecha = sumarDiasLoc(fechaInicio, offset);
          return {
            jornada: jornadaNum,
            fecha,
            grupoId,
            partidos: pairs.map((pair, pIdx) => ({
              id: `copa-${tipo}-${grupoId}-jornada${jornadaNum}-p${pIdx}`,
              localId: T[pair[0]],
              visitanteId: T[pair[1]],
              jugado: false,
              clima: obtenerClimaAleatorio()
            }))
          };
        });
      };

      const partidosGrupos = [
        ...programarGrupoFixture('A', gruposCopa[0].equipos),
        ...programarGrupoFixture('B', gruposCopa[1].equipos),
        ...programarGrupoFixture('C', gruposCopa[2].equipos),
        ...programarGrupoFixture('D', gruposCopa[3].equipos)
      ];

      // Guardar en base de datos en memoria
      guardarSorteoCopa(tipo, gruposCopa, partidosGrupos, 'grupos');

    } else {
      // Fase de Cuartos
      const partidosCuartos: PartidoCopa[] = crucesCuartosFinales.map((cruce, idx) => ({
        id: `copa-${tipo}-cuartos-${idx + 1}`,
        localId: cruce.local.id,
        visitanteId: cruce.visitante.id,
        jugado: false,
        clima: obtenerClimaAleatorio()
      }));

      guardarSorteoCopa(tipo, [], [], 'cuartos', partidosCuartos);
    }
  };

  const sorteoTerminado = pasoActual >= (fase === 'grupos' ? 16 : 8);

  return (
    <div className="min-h-screen bg-[#080705] text-[#ebd2ad] flex flex-col font-sans relative overflow-hidden select-none">
      {/* Background Luxury UEFA Gala Accents */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#241e12] via-[#0b0a07] to-[#040403] opacity-90 z-0"></div>
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#ebd2ad]/5 blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#ebd2ad]/5 blur-[120px] pointer-events-none z-0"></div>

      {/* HEADER GALA */}
      <header className="relative z-10 border-b border-[#3b311e] bg-black/45 backdrop-blur-md px-8 py-4 flex items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
        <div className="flex items-center gap-4">
          <div className="text-3xl">🏆</div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-widest bg-gradient-to-r from-[#f7e0bc] via-[#cf9f5d] to-[#ebd2ad] bg-clip-text text-transparent uppercase">
              GALA UEFA - SORTEO OFICIAL
            </h1>
            <p className="text-xs text-[#cf9f5d]/70 tracking-wider">Temporada de Copas Internacionales • {fechaActual}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 text-xs border border-[#cf9f5d]/30 bg-[#cf9f5d]/10 text-[#ebd2ad] rounded-full font-semibold uppercase tracking-widest shadow-[0_0_10px_rgba(207,159,93,0.1)] animate-pulse">
            {labelCopa}
          </div>
          <div className="px-3 py-1 text-xs bg-[#ebd2ad]/10 border border-[#ebd2ad]/20 rounded-full font-medium tracking-wider">
            Fase: {fase === 'grupos' ? 'Grupos' : 'Cuartos'}
          </div>
        </div>
      </header>

      {/* CUERPO DEL SORTEO */}
      <main className="flex-1 relative z-10 p-6 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full overflow-y-auto">
        
        {/* PANEL DE CONTROL DEL SORTEO */}
        <section className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 border border-[#3b311e] bg-[#0f0e0b]/80 rounded-2xl backdrop-blur shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col gap-1 text-center md:text-left">
            <h2 className="text-lg font-semibold text-[#f7e0bc]">
              {sorteoTerminado 
                ? 'Sorteo Concluido' 
                : `Sorteando Bolilla ${pasoActual + 1} de ${fase === 'grupos' ? '16' : '8'}`}
            </h2>
            <p className="text-sm text-[#cf9f5d]/70">
              {sorteoTerminado 
                ? 'Los cruces han sido grabados y el fixture está desbloqueado.' 
                : 'Extrae las bolillas de los bombos oficiales para completar el cuadro.'}
            </p>
          </div>

          <div className="flex items-center gap-4 flex-wrap justify-center">
            {!sorteoTerminado ? (
              <>
                <button
                  onClick={sacarSiguienteBolilla}
                  disabled={animando}
                  className="px-6 py-3 border border-[#cf9f5d] bg-gradient-to-b from-[#dfb06d] to-[#b88540] hover:from-[#f3cc96] hover:to-[#cf9f5d] disabled:opacity-40 disabled:hover:from-[#dfb06d] disabled:hover:to-[#b88540] text-black font-bold uppercase text-xs tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(207,159,93,0.3)] flex items-center gap-2"
                >
                  <span>⚽</span> Sacar Bolilla
                </button>
                <button
                  onClick={() => setAutoSimular(!autoSimular)}
                  disabled={animando}
                  className={`px-5 py-3 border rounded-xl font-bold uppercase text-xs tracking-widest transition-all flex items-center gap-2 ${
                    autoSimular 
                      ? 'border-red-500/50 bg-red-950/30 text-red-400 hover:bg-red-900/40' 
                      : 'border-[#cf9f5d]/40 bg-[#cf9f5d]/10 hover:bg-[#cf9f5d]/20 text-[#ebd2ad]'
                  }`}
                >
                  {autoSimular ? '⏸ Pausar Simulación' : '⚡ Simulación Automática'}
                </button>
              </>
            ) : (
              <button
                onClick={finalizarSorteoCompleto}
                className="px-8 py-4 border border-[#ebd2ad] bg-gradient-to-b from-[#ebd2ad] to-[#cf9f5d] hover:from-white hover:to-[#ebd2ad] text-black font-extrabold uppercase text-sm tracking-widest rounded-xl transition-all shadow-[0_0_30px_rgba(207,159,93,0.6)] animate-bounce"
              >
                🏆 Registrar y Finalizar
              </button>
            )}
          </div>
        </section>

        {/* BOLILLEROS Y COPONES VISUALES */}
        <section className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* VISTA DE COPONES (FASE DE GRUPOS) */}
          {fase === 'grupos' && (
            <>
              {/* COPÓN 1 */}
              <div className="border border-[#cf9f5d]/30 bg-[#0f0e0b]/40 rounded-2xl p-4 flex flex-col gap-3 backdrop-blur shadow-lg">
                <div className="flex items-center justify-between border-b border-[#3b311e] pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#cf9f5d]">Copón 1 (Cabezas)</h3>
                  <span className="text-[10px] bg-[#cf9f5d]/20 px-2 py-0.5 rounded text-[#cf9f5d] font-bold">P1</span>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto">
                  {copon1.map(eq => (
                    <div key={eq.id} className="flex items-center gap-1.5 p-2 bg-[#1f1a12]/30 border border-[#cf9f5d]/10 rounded-lg text-xs">
                      <span>{eq.escudo}</span>
                      <span className="truncate font-medium">{eq.nombre}</span>
                    </div>
                  ))}
                  {copon1.length === 0 && <p className="col-span-2 text-center text-[10px] text-[#cf9f5d]/40 py-4 italic">Copón vacío</p>}
                </div>
              </div>

              {/* COPÓN 2 */}
              <div className="border border-[#cf9f5d]/20 bg-[#0f0e0b]/40 rounded-2xl p-4 flex flex-col gap-3 backdrop-blur shadow-lg">
                <div className="flex items-center justify-between border-b border-[#3b311e] pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#ebd2ad]/80">Copón 2</h3>
                  <span className="text-[10px] bg-[#ebd2ad]/10 px-2 py-0.5 rounded text-[#ebd2ad] font-bold">P2</span>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto">
                  {copon2.map(eq => (
                    <div key={eq.id} className="flex items-center gap-1.5 p-2 bg-white/5 border border-white/5 rounded-lg text-xs">
                      <span>{eq.escudo}</span>
                      <span className="truncate font-medium">{eq.nombre}</span>
                    </div>
                  ))}
                  {copon2.length === 0 && <p className="col-span-2 text-center text-[10px] text-[#cf9f5d]/40 py-4 italic">Copón vacío</p>}
                </div>
              </div>

              {/* COPÓN 3 */}
              <div className="border border-[#cf9f5d]/20 bg-[#0f0e0b]/40 rounded-2xl p-4 flex flex-col gap-3 backdrop-blur shadow-lg">
                <div className="flex items-center justify-between border-b border-[#3b311e] pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#ebd2ad]/80">Copón 3</h3>
                  <span className="text-[10px] bg-[#ebd2ad]/10 px-2 py-0.5 rounded text-[#ebd2ad] font-bold">P3</span>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto">
                  {copon3.map(eq => (
                    <div key={eq.id} className="flex items-center gap-1.5 p-2 bg-white/5 border border-white/5 rounded-lg text-xs">
                      <span>{eq.escudo}</span>
                      <span className="truncate font-medium">{eq.nombre}</span>
                    </div>
                  ))}
                  {copon3.length === 0 && <p className="col-span-2 text-center text-[10px] text-[#cf9f5d]/40 py-4 italic">Copón vacío</p>}
                </div>
              </div>

              {/* COPÓN 4 */}
              <div className="border border-[#cf9f5d]/20 bg-[#0f0e0b]/40 rounded-2xl p-4 flex flex-col gap-3 backdrop-blur shadow-lg">
                <div className="flex items-center justify-between border-b border-[#3b311e] pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#ebd2ad]/80">Copón 4</h3>
                  <span className="text-[10px] bg-[#ebd2ad]/10 px-2 py-0.5 rounded text-[#ebd2ad] font-bold">P4</span>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto">
                  {copon4.map(eq => (
                    <div key={eq.id} className="flex items-center gap-1.5 p-2 bg-white/5 border border-white/5 rounded-lg text-xs">
                      <span>{eq.escudo}</span>
                      <span className="truncate font-medium">{eq.nombre}</span>
                    </div>
                  ))}
                  {copon4.length === 0 && <p className="col-span-2 text-center text-[10px] text-[#cf9f5d]/40 py-4 italic">Copón vacío</p>}
                </div>
              </div>
            </>
          )}

          {/* VISTA DE BOLILLEROS (FASE DE ELIMINACIÓN DIRECTA / CUARTOS) */}
          {fase === 'cuartos' && (
            <>
              {/* GANADORES (BOMBO 1) */}
              <div className="col-span-1 lg:col-span-2 border border-[#cf9f5d]/30 bg-[#0f0e0b]/40 rounded-2xl p-4 flex flex-col gap-3 backdrop-blur shadow-lg">
                <div className="flex items-center justify-between border-b border-[#3b311e] pb-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#cf9f5d]">Bolillero: Ganadores de Grupo</h3>
                  <span className="text-xs bg-[#cf9f5d]/20 px-3 py-0.5 rounded text-[#cf9f5d] font-bold uppercase tracking-wider">Punteros</span>
                </div>
                <div className="grid grid-cols-2 gap-3 max-h-[180px] overflow-y-auto">
                  {bolilleroGanadores.map(eq => (
                    <div key={eq.id} className="flex items-center gap-2 p-2.5 bg-[#1f1a12]/30 border border-[#cf9f5d]/10 rounded-lg text-xs font-semibold">
                      <span className="text-lg">{eq.escudo}</span>
                      <div className="truncate">
                        <p className="truncate text-[#f7e0bc]">{eq.nombre}</p>
                        <p className="text-[9px] text-[#cf9f5d]/60 font-medium">Reputación: {eq.reputacion}</p>
                      </div>
                    </div>
                  ))}
                  {bolilleroGanadores.length === 0 && <p className="col-span-2 text-center text-xs text-[#cf9f5d]/40 py-8 italic font-light">Bolillero de ganadores vacío</p>}
                </div>
              </div>

              {/* SEGUNDOS (BOMBO 2) */}
              <div className="col-span-1 lg:col-span-2 border border-[#cf9f5d]/20 bg-[#0f0e0b]/40 rounded-2xl p-4 flex flex-col gap-3 backdrop-blur shadow-lg">
                <div className="flex items-center justify-between border-b border-[#3b311e] pb-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#ebd2ad]/80">Bolillero: Segundos de Grupo</h3>
                  <span className="text-xs bg-[#ebd2ad]/10 px-3 py-0.5 rounded text-[#ebd2ad] font-bold uppercase tracking-wider">Escoltas</span>
                </div>
                <div className="grid grid-cols-2 gap-3 max-h-[180px] overflow-y-auto">
                  {bolilleroSegundos.map(eq => (
                    <div key={eq.id} className="flex items-center gap-2 p-2.5 bg-white/5 border border-white/5 rounded-lg text-xs font-medium">
                      <span className="text-lg">{eq.escudo}</span>
                      <div className="truncate">
                        <p className="truncate text-slate-200">{eq.nombre}</p>
                        <p className="text-[9px] text-[#ebd2ad]/55">Reputación: {eq.reputacion}</p>
                      </div>
                    </div>
                  ))}
                  {bolilleroSegundos.length === 0 && <p className="col-span-2 text-center text-xs text-[#cf9f5d]/40 py-8 italic font-light">Bolillero de segundos vacío</p>}
                </div>
              </div>
            </>
          )}

        </section>

        {/* VISUALIZADOR DE GRUPOS O ENCUENTROS */}
        <section className="flex-1 flex flex-col gap-6">
          <h3 className="text-sm font-bold uppercase tracking-wider border-b border-[#3b311e] pb-2 text-[#cf9f5d] flex items-center gap-2">
            <span>🏟</span> Cuadro del Sorteo Oficial
          </h3>

          {fase === 'grupos' ? (
            /* GRUPOS A, B, C, D EN TIEMPO REAL */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {['A', 'B', 'C', 'D'].map(gId => {
                const integr = gruposFinales[gId] || [];
                return (
                  <div 
                    key={gId} 
                    className="border border-[#3b311e] bg-[#0c0c09]/80 backdrop-blur rounded-2xl p-5 shadow-2xl relative overflow-hidden flex flex-col gap-4 group transition-transform hover:scale-[1.01]"
                  >
                    {/* Golden accent bar */}
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#cf9f5d] to-transparent"></div>

                    <div className="flex items-center justify-between border-b border-[#3b311e]/40 pb-2">
                      <span className="text-xl font-bold bg-gradient-to-r from-[#f7e0bc] to-[#cf9f5d] bg-clip-text text-transparent">GRUPO {gId}</span>
                      <span className="text-[10px] text-[#cf9f5d]/50 font-bold uppercase tracking-widest">{integr.length}/4 equipos</span>
                    </div>

                    <div className="flex-1 flex flex-col gap-3.5">
                      {Array.from({ length: 4 }).map((_, idx) => {
                        const eq = integr[idx];
                        const isUser = eq?.id === equipoUsuarioId;
                        return (
                          <div 
                            key={idx} 
                            className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                              eq 
                                ? isUser
                                  ? 'bg-[#cf9f5d]/20 border-[#cf9f5d] shadow-[0_0_15px_rgba(207,159,93,0.15)]'
                                  : 'bg-[#1b1915]/40 border-white/5 hover:bg-[#1b1915]/60'
                                : 'bg-transparent border-dashed border-[#3b311e]/40 border-spacing-2'
                            }`}
                          >
                            {eq ? (
                              <div className="flex items-center gap-3 truncate">
                                <span className="text-2xl animate-fade-in">{eq.escudo}</span>
                                <div className="truncate">
                                  <div className="flex items-center gap-1.5">
                                    <p className={`truncate text-sm font-bold tracking-wide ${isUser ? 'text-[#ebd2ad]' : 'text-slate-200'}`}>
                                      {eq.nombre}
                                    </p>
                                    {isUser && (
                                      <span className="text-[9px] bg-black text-[#cf9f5d] border border-[#cf9f5d]/40 px-1 py-0.5 rounded font-black tracking-wider uppercase">
                                        Vos
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-[#cf9f5d]/60 font-medium">
                                    {eq.pais} • Rep: {eq.reputacion}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full border border-dashed border-[#cf9f5d]/20 flex items-center justify-center text-[#cf9f5d]/30 text-xs">
                                  ?
                                </div>
                                <span className="text-xs text-[#cf9f5d]/20 font-medium italic">Esperando sorteo...</span>
                              </div>
                            )}
                            {eq && (
                              <span className="text-[10px] bg-[#cf9f5d]/10 text-[#cf9f5d] border border-[#cf9f5d]/20 px-2 py-0.5 rounded-full font-bold">
                                P{idx + 1}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ENCUENTROS DE CUARTOS DE FINAL EN TIEMPO REAL */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {crucesCuartosFinales.map((cruce, idx) => {
                const hasLocal = cruce.local.id !== '';
                const hasVis = cruce.visitante.id !== '';
                const isUserLoc = cruce.local.id === equipoUsuarioId;
                const isUserVis = cruce.visitante.id === equipoUsuarioId;

                return (
                  <div 
                    key={idx} 
                    className="border border-[#3b311e] bg-[#0c0c09]/80 backdrop-blur rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col gap-4 group transition-transform hover:scale-[1.01]"
                  >
                    {/* Gold bar */}
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#cf9f5d] to-transparent"></div>

                    <div className="flex items-center justify-between border-b border-[#3b311e]/40 pb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#cf9f5d]">LLAVE DE CUARTOS {idx + 1}</span>
                      <span className="text-[10px] bg-[#cf9f5d]/20 px-2 py-0.5 rounded text-[#cf9f5d] font-semibold tracking-wider">
                        {!hasLocal && !hasVis ? 'Por Sortear' : hasLocal && !hasVis ? 'Falta Rival' : 'Confirmado'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 py-4">
                      {/* LOCAL TEAM */}
                      <div className="flex-1 flex flex-col items-center text-center gap-2 max-w-[45%]">
                        <div className={`w-16 h-16 rounded-full border flex items-center justify-center text-3xl relative ${
                          hasLocal 
                            ? isUserLoc
                              ? 'bg-[#cf9f5d]/20 border-[#cf9f5d] shadow-[0_0_15px_rgba(207,159,93,0.2)]'
                              : 'bg-[#1b1915]/60 border-white/5'
                            : 'bg-transparent border-dashed border-[#cf9f5d]/20'
                        }`}>
                          {hasLocal ? cruce.local.escudo : '❓'}
                          {hasLocal && isUserLoc && (
                            <span className="absolute -bottom-1.5 -right-1.5 text-[8px] bg-black text-[#cf9f5d] border border-[#cf9f5d]/40 px-1 rounded font-black tracking-wider uppercase">
                              Vos
                            </span>
                          )}
                        </div>
                        <div className="w-full">
                          <p className={`text-sm font-bold truncate ${hasLocal ? 'text-[#ebd2ad]' : 'text-slate-600 italic'}`}>
                            {hasLocal ? cruce.local.nombre : 'Esperando...'}
                          </p>
                          {hasLocal && (
                            <p className="text-[9px] text-[#cf9f5d]/60 font-semibold">{cruce.local.pais} • Rep: {cruce.local.reputacion}</p>
                          )}
                        </div>
                      </div>

                      {/* VS LOGO */}
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-black text-[#cf9f5d] bg-[#cf9f5d]/10 border border-[#cf9f5d]/30 px-3 py-1 rounded-full shadow-[0_0_10px_rgba(207,159,93,0.15)]">
                          VS
                        </span>
                      </div>

                      {/* VISITANTE TEAM */}
                      <div className="flex-1 flex flex-col items-center text-center gap-2 max-w-[45%]">
                        <div className={`w-16 h-16 rounded-full border flex items-center justify-center text-3xl relative ${
                          hasVis 
                            ? isUserVis
                              ? 'bg-[#cf9f5d]/20 border-[#cf9f5d] shadow-[0_0_15px_rgba(207,159,93,0.2)]'
                              : 'bg-[#1b1915]/60 border-white/5'
                            : 'bg-transparent border-dashed border-[#cf9f5d]/20'
                        }`}>
                          {hasVis ? cruce.visitante.escudo : '❓'}
                          {hasVis && isUserVis && (
                            <span className="absolute -bottom-1.5 -right-1.5 text-[8px] bg-black text-[#cf9f5d] border border-[#cf9f5d]/40 px-1 rounded font-black tracking-wider uppercase">
                              Vos
                            </span>
                          )}
                        </div>
                        <div className="w-full">
                          <p className={`text-sm font-bold truncate ${hasVis ? 'text-[#ebd2ad]' : 'text-slate-600 italic'}`}>
                            {hasVis ? cruce.visitante.nombre : 'Esperando...'}
                          </p>
                          {hasVis && (
                            <p className="text-[9px] text-[#cf9f5d]/60 font-semibold">{cruce.visitante.pais} • Rep: {cruce.visitante.reputacion}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* OVERLAY DE ANIMACION DE REVELADO (MODAL CENTRAL POP-UP DE LA BOLILLA) */}
      {animando && bolillaRevelada && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-6 animate-fade-in backdrop-blur-sm">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#382d18]/40 via-transparent to-transparent opacity-60"></div>
          
          <div className="relative border-2 border-[#cf9f5d] bg-[#0c0b09] rounded-3xl p-8 max-w-sm w-full text-center shadow-[0_0_80px_rgba(207,159,93,0.4)] flex flex-col items-center gap-6 overflow-hidden animate-scale-up">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-[#cf9f5d] to-transparent"></div>
            
            {/* Cabecera del Pote de Extracción */}
            <span className="text-[10px] tracking-[0.2em] font-black uppercase text-[#cf9f5d]">
              BOLILLA EXTRAÍDA
            </span>

            {/* Dibujo de bolilla 3D o esfera girando */}
            <div className="w-32 h-32 rounded-full border-4 border-[#cf9f5d] bg-gradient-to-b from-[#1b1915] to-black flex items-center justify-center shadow-[0_0_40px_rgba(207,159,93,0.3)] animate-spin-slow">
              <span className="text-5xl">{bolillaRevelada.escudo}</span>
            </div>

            {/* Datos revelados */}
            <div className="flex flex-col gap-1 w-full">
              <h4 className="text-2xl font-black text-[#f7e0bc] tracking-wide truncate">
                {bolillaRevelada.nombre}
              </h4>
              <p className="text-xs text-[#cf9f5d] font-bold tracking-widest uppercase">
                {bolillaRevelada.pais}
              </p>
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="text-[10px] bg-[#cf9f5d]/10 border border-[#cf9f5d]/30 text-[#ebd2ad] px-3 py-1 rounded font-semibold">
                  Reputación: {bolillaRevelada.reputacion}
                </span>
              </div>
            </div>

            {/* Grupo o llave asignada */}
            {fase === 'grupos' && grupoDestino && (
              <div className="mt-2 py-2 px-6 bg-[#cf9f5d]/20 border border-[#cf9f5d] rounded-xl animate-bounce">
                <p className="text-xs font-black text-[#ebd2ad] tracking-widest uppercase">
                  Grupo Destino: <span className="text-base text-white">{grupoDestino}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* OVERLAY DRAMATICO: ALERTA DE GRUPO DE LA MUERTE */}
      {alertaMuerte.activa && alertaMuerte.gigante && (
        <div className="fixed inset-0 z-55 bg-black/95 flex flex-col items-center justify-center p-6 backdrop-blur-md animate-fade-in">
          {/* Background flashing light */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_red)] opacity-20 animate-pulse pointer-events-none"></div>

          <div className="relative border-4 border-red-600/70 bg-[#0e0404] rounded-3xl p-8 max-w-lg w-full text-center shadow-[0_0_100px_rgba(220,38,38,0.5)] flex flex-col items-center gap-6 overflow-hidden animate-scale-up">
            
            {/* Header Alerta Roja */}
            <div className="px-5 py-1.5 bg-red-600/30 border border-red-500 text-red-400 text-xs font-black uppercase tracking-[0.25em] rounded-full shadow-[0_0_15px_rgba(220,38,38,0.3)] animate-pulse">
              🚨 PELIGRO - GIGANTE IA DETECTADO
            </div>

            {/* Titulo Dramatico */}
            <div>
              <h4 className="text-4xl font-extrabold bg-gradient-to-r from-red-500 via-[#ebd2ad] to-red-500 bg-clip-text text-transparent uppercase tracking-wider leading-tight">
                ¡Grupo de la Muerte!
              </h4>
              <p className="text-sm text-[#ebd2ad]/70 mt-2">
                Te enfrentarás al vigente campeón o un superpoderoso de Europa
              </p>
            </div>

            {/* Comparativa visual de escudos */}
            <div className="flex items-center justify-center gap-8 py-4 w-full">
              {/* MANAGER TEAM */}
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div className="w-20 h-20 rounded-full bg-white/5 border border-[#cf9f5d] flex items-center justify-center text-4xl shadow-inner">
                  {equipos.find(e => e.id === equipoUsuarioId)?.escudo || '🛡'}
                </div>
                <span className="text-xs font-bold text-[#ebd2ad] truncate max-w-[120px]">
                  {equipos.find(e => e.id === equipoUsuarioId)?.nombre || 'Tu Club'}
                </span>
                <span className="text-[9px] text-[#cf9f5d] font-bold uppercase tracking-widest">Mánager</span>
              </div>

              {/* Sparks icon */}
              <div className="text-red-500 text-2xl font-black animate-pulse">⚔</div>

              {/* GIGANTE TEAM */}
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div className="w-20 h-20 rounded-full bg-red-950/20 border border-red-600 flex items-center justify-center text-4xl shadow-[0_0_20px_rgba(220,38,38,0.3)]">
                  {alertaMuerte.gigante.escudo}
                </div>
                <span className="text-xs font-bold text-red-400 truncate max-w-[120px]">
                  {alertaMuerte.gigante.nombre}
                </span>
                <span className="text-[9px] text-red-500 font-bold uppercase tracking-widest">
                  Reputación: {alertaMuerte.gigante.reputacion}
                </span>
              </div>
            </div>

            {/* Mensaje descriptivo */}
            <p className="text-xs text-[#ebd2ad]/65 leading-relaxed bg-black/55 p-4 rounded-xl border border-white/5 font-mono">
              "El sorteo determinó que compartas la zona del grupo con el coloso del certamen. 
              La prensa deportiva ya vaticina un fixture durísimo y la afición contiene el aliento."
            </p>

            {/* Botón de cierre */}
            <button
              onClick={() => setAlertaMuerte({ activa: false, gigante: null })}
              className="mt-2 w-full py-3.5 border border-red-600 bg-gradient-to-b from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-extrabold uppercase text-xs tracking-[0.2em] rounded-xl transition-all shadow-[0_0_25px_rgba(220,38,38,0.4)]"
            >
              Aceptar el Desafío 🛡
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
