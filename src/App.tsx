// @refresh reset
import React, { useState, useEffect } from 'react';
import { GameProvider } from './context/GameContext';
import { useGame } from './context/useGame';
import { Equipo, Jugador, TablaEquipo } from './types';
import { PlantelView } from './views/PlantelView';
import { DashboardView } from './views/DashboardView';
import { LigaView } from './views/LigaView';
import { MercadoView } from './views/MercadoView';
import { TacticaView } from './views/TacticaView';
import { LiveMatchView } from './views/LiveMatchView';
import { AnaliticaView } from './views/AnaliticaView';
import { AcademiaReportView } from './views/AcademiaReportView';
import { CopaInternacionalView } from './views/CopaInternacionalView';
import { EntrenamientoView } from './views/EntrenamientoView';
import { EventoVestuarioModal } from './views/EventoVestuarioModal';
import { DeadlineDayView } from './views/DeadlineDayView';
import { PerfilManagerView } from './views/PerfilManagerView';
import { OficinaManagerView } from './views/OficinaManagerView';
import { SorteoCopasView } from './views/SorteoCopasView';
import { ClubView } from './views/ClubView';
import { SalonDeLaFamaView } from './views/SalonDeLaFamaView';

// ==========================================
// FORMATEADORES AUXILIARES
// ==========================================
const formatearMoneda = (valor: number): string => {
  if (valor >= 1000000) {
    return `${(valor / 1000000).toFixed(1)} M€`;
  }
  return `${(valor / 1000).toFixed(0)} m€`;
};

const formatearFecha = (fechaStr: string): string => {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const date = new Date(fechaStr + 'T12:00:00');
  const diaSemana = date.toLocaleDateString('es-ES', { weekday: 'long' });
  const diaMes = date.getDate();
  const mes = meses[date.getMonth()];
  const anio = date.getFullYear();
  
  // Capitalizar día de la semana
  const diaSemanaCap = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);
  return `${diaSemanaCap}, ${diaMes} de ${mes} de ${anio}`;
};

const obtenerPaisEquipo = (equipoId: string): 'espana' | 'inglaterra' | 'italia' | 'alemania' => {
  if (['real-madrid', 'barcelona', 'atletico-madrid', 'sevilla', 'real-sociedad', 'athletic-bilbao', 'villarreal', 'betis', 'valencia', 'osasuna', 'getafe', 'rayo'].includes(equipoId)) return 'espana';
  if (['manchester-city', 'arsenal', 'liverpool', 'chelsea', 'manchester-united', 'tottenham', 'newcastle', 'aston-villa', 'brighton', 'west-ham', 'crystal-palace', 'everton'].includes(equipoId)) return 'inglaterra';
  if (['inter-milan', 'ac-milan', 'juventus', 'napoli', 'roma', 'lazio', 'atalanta', 'fiorentina', 'torino', 'bologna', 'udinese', 'lecce'].includes(equipoId)) return 'italia';
  return 'alemania';
};

// ==========================================
// COMPONENTE PRINCIPAL QUE CONSUME EL CONTEXTO
// ==========================================
const AppContent: React.FC = () => {
  const {
    equipos,
    jugadores,
    liga,
    fechaActual,
    equipoUsuarioId,
    equipoUsuario,
    partidoReciente,
    mesesEnQuiebra,
    confianzaDirectiva,
    ofertaRecibidaActiva,
    partidoEnVivo,
    reporteAcademia,
    seleccionarEquipo,
    avanzarDia,
    actualizarTabla,
    reiniciarPartida,
    cerrarPartidoReciente,
    aceptarOfertaRecibida,
    rechazarOfertaRecibida,
    contraofertarRecibida,
    cerrarReporteAcademia,
    eventoActivo,
    deadlineDayActivo,
    nombreManager,
    reputacionManager,
    historialTitulos,
    juegoIniciado,
    aceptarOfertaEmpleo,
    reunionPrivadaActiva,
    sorteoCopaActivo,
    recordModalActivo,
    cerrarRecordModal
  } = useGame();

  // ==========================================
  // INTERCEPTOR: SORTEO DE COPAS INTERNACIONALES
  // ==========================================
  if (sorteoCopaActivo) {
    return <SorteoCopasView />;
  }

  // Estados de interfaz
  const [vista, setVista] = useState<'dashboard' | 'plantel' | 'tabla' | 'mercado' | 'tactica' | 'analitica' | 'copa' | 'entrenamiento' | 'perfil' | 'club' | 'fama'>('dashboard');
  const [menuAbierto, setMenuAbierto] = useState<boolean>(false);
  const [nombreManagerInput, setNombreManagerInput] = useState<string>('DT Mánager');
  
  // Estados para la selección de equipos
  const [ligaSeleccionada, setLigaSeleccionada] = useState<'todas' | 'espana' | 'inglaterra' | 'italia' | 'alemania'>('todas');
  const [busqueda, setBusqueda] = useState('');
  const [ordenFiltro, setOrdenFiltro] = useState<'reputacion' | 'presupuesto' | 'nombre'>('reputacion');
  const [hoveredTeamId, setHoveredTeamId] = useState<string | null>(null);

  // Estados para contraofertas de fichajes
  const [contraofertaValor, setContraofertaValor] = useState<number>(0);
  const [resultadoNegociacion, setResultadoNegociacion] = useState<{ aceptado: boolean; mensaje: string } | null>(null);

  // Inicializar el valor de contraoferta y resultado cuando se recibe una nueva oferta
  useEffect(() => {
    if (ofertaRecibidaActiva) {
      setContraofertaValor(ofertaRecibidaActiva.montoOfrecido);
      setResultadoNegociacion(null);
    }
  }, [ofertaRecibidaActiva]);

  const manejarContraoferta = () => {
    if (!ofertaRecibidaActiva) return;
    const res = contraofertarRecibida(contraofertaValor);
    setResultadoNegociacion(res);
  };

  const cerrarResultadoNegociacion = () => {
    setResultadoNegociacion(null);
  };

  // ==========================================
  // INTERCEPTOR: DEADLINE DAY — CIERRE DE MERCADO
  // ==========================================
  if (deadlineDayActivo) {
    return (
      <>
        <DeadlineDayView />
        {eventoActivo && <EventoVestuarioModal evento={eventoActivo} />}
      </>
    );
  }

  // ==========================================
  // INTERCEPTOR: REUNIÓN PRIVADA EN LA OFICINA
  // ==========================================
  if (reunionPrivadaActiva) {
    return <OficinaManagerView />;
  }

  // ==========================================
  // INTERCEPTOR: PARTIDO EN VIVO A PANTALLA COMPLETA
  // ==========================================
  if (partidoEnVivo) {
    return <LiveMatchView />;
  }

  // ==========================================
  // INTERCEPTOR: REPORTE DE LA ACADEMIA A PANTALLA COMPLETA
  // ==========================================
  if (reporteAcademia) {
    return <AcademiaReportView reporte={reporteAcademia} alCerrar={cerrarReporteAcademia} />;
  }

  // ==========================================
  // PANTALLA DE GAME OVER POR QUIEBRA FINANCIERA
  // ==========================================
  if (mesesEnQuiebra >= 2) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Decoraciones de fondo rojas para denotar peligro */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-rose-500/10 blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-red-500/10 blur-[120px]"></div>

        <div className="z-10 text-center max-w-xl bg-slate-900/60 backdrop-blur-md rounded-2xl p-8 border border-rose-500/30 shadow-2xl border-t-4 border-t-rose-500">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 mb-6 font-medium text-xs tracking-wider uppercase">
            🚨 Destitución Inmediata
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-rose-500">
            ¡GAME OVER!
          </h1>
          <h2 className="text-xl font-bold text-slate-200 mb-4">
            Despedido por Quiebra Financiera
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            La junta directiva de <strong>{equipoUsuario?.nombre}</strong> ha decidido rescindir tu contrato de manera unilateral. Tras acumular <strong>dos meses consecutivos en saldo negativo</strong>, la junta considera insostenible tu gestión económica del club.
          </p>

          <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 text-left space-y-2 mb-8 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Club:</span>
              <span className="font-bold text-slate-300">{equipoUsuario?.nombre} {equipoUsuario?.escudo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Presupuesto Final:</span>
              <span className="font-bold text-rose-400 font-mono">{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(equipoUsuario?.presupuestoFichajes || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Motivo:</span>
              <span className="font-semibold text-rose-300">Quiebra financiera acumulada</span>
            </div>
          </div>

          <button 
            onClick={reiniciarPartida}
            className="w-full py-3 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-650 text-white font-bold rounded-lg text-sm transition-all duration-200 uppercase tracking-wide shadow-lg hover:shadow-rose-900/30"
          >
            Volver a Intentar / Nueva Carrera
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // PANTALLA 1: SELECCIÓN DE EQUIPO (INICIO)
  // ==========================================
  if (!juegoIniciado) {
    // Conteos por liga para mostrar en las pestañas
    const conteoPorLiga = {
      todas: equipos.length,
      espana: equipos.filter(e => obtenerPaisEquipo(e.id) === 'espana').length,
      inglaterra: equipos.filter(e => obtenerPaisEquipo(e.id) === 'inglaterra').length,
      italia: equipos.filter(e => obtenerPaisEquipo(e.id) === 'italia').length,
      alemania: equipos.filter(e => obtenerPaisEquipo(e.id) === 'alemania').length,
    };

    // Filtrar y ordenar los equipos
    const equiposFiltrados = equipos
      .filter((equipo) => {
        // Filtro por liga
        if (ligaSeleccionada !== 'todas') {
          const pais = obtenerPaisEquipo(equipo.id);
          if (pais !== ligaSeleccionada) return false;
        }
        // Filtro por búsqueda
        if (busqueda.trim() !== '') {
          const query = busqueda.toLowerCase();
          return (
            equipo.nombre.toLowerCase().includes(query) ||
            equipo.nombreCorto.toLowerCase().includes(query) ||
            equipo.estadio.toLowerCase().includes(query)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (ordenFiltro === 'reputacion') {
          return b.reputacion - a.reputacion;
        }
        if (ordenFiltro === 'presupuesto') {
          return b.presupuestoFichajes - a.presupuestoFichajes;
        }
        return a.nombre.localeCompare(b.nombre);
      });

    // Helper para determinar si se necesita texto oscuro en hover
    const usarTextoOscuro = (hexColor: string): boolean => {
      const color = hexColor.toUpperCase();
      return ['#FFFFFF', '#FFF', '#FDE100', '#FFD700', '#FFFF00', '#F1C40F'].includes(color);
    };

    return (
      <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col items-center justify-start p-6 md:p-12 relative overflow-x-hidden overflow-y-auto">
        {/* Decoraciones de fondo premium */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-teal-500/5 blur-[130px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-500/5 blur-[130px] pointer-events-none"></div>

        <div className="z-10 text-center max-w-6xl w-full flex flex-col items-center">
          {/* Header Superior */}
          <div className="mb-10 max-w-2xl text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 mb-5 font-semibold text-xs tracking-wider uppercase shadow-[0_0_15px_rgba(20,184,166,0.1)] animate-pulse">
              ⚽ Temporada 2026/2027
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-4 bg-gradient-to-r from-teal-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              FOOTBALL MANAGER
            </h1>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed">
              Tomá el control de una de las potencias del fútbol mundial. Gestioná tu plantel de estrellas, planificá tácticas y demostrá quién manda en Europa.
            </p>
          </div>

          {/* Configuración del Perfil de Mánager */}
          <div className="w-full max-w-md bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl mb-8 text-left shadow-lg">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
              👔 Nombre del Director Técnico
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-500 text-sm">👔</span>
              <input
                type="text"
                placeholder="Ingresá tu nombre de mánager..."
                value={nombreManagerInput}
                onChange={(e) => setNombreManagerInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-850 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 transition-all font-semibold"
              />
            </div>
          </div>

          {/* Barra de Control (Buscador y Ordenamiento) */}
          <div className="w-full bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-4 rounded-2xl flex flex-col md:flex-row gap-4 justify-between items-center mb-6 shadow-lg">
            {/* Buscador */}
            <div className="relative w-full md:w-80">
              <span className="absolute left-3.5 top-2.5 text-slate-500 text-sm">🔍</span>
              <input
                type="text"
                placeholder="Buscar por nombre, código o estadio..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 transition-all"
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda('')}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Selector de Orden */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ordenar por</span>
              <div className="flex bg-slate-950/90 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setOrdenFiltro('reputacion')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all ${
                    ordenFiltro === 'reputacion' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Reputación
                </button>
                <button
                  onClick={() => setOrdenFiltro('presupuesto')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all ${
                    ordenFiltro === 'presupuesto' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Presupuesto
                </button>
                <button
                  onClick={() => setOrdenFiltro('nombre')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all ${
                    ordenFiltro === 'nombre' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Nombre
                </button>
              </div>
            </div>
          </div>

          {/* Pestañas (Tabs) de Ligas */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-8 w-full max-w-4xl">
            <button
              onClick={() => setLigaSeleccionada('todas')}
              className={`px-4 py-2 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 border ${
                ligaSeleccionada === 'todas'
                  ? 'bg-teal-500/10 border-teal-500/40 text-teal-300 shadow-[0_0_15px_rgba(20,184,166,0.15)]'
                  : 'bg-slate-900/30 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <span>🌐</span> Todas <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-950/85 text-slate-400 font-bold font-mono">{conteoPorLiga.todas}</span>
            </button>
            <button
              onClick={() => setLigaSeleccionada('espana')}
              className={`px-4 py-2 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 border ${
                ligaSeleccionada === 'espana'
                  ? 'bg-teal-500/10 border-teal-500/40 text-teal-300 shadow-[0_0_15px_rgba(20,184,166,0.15)]'
                  : 'bg-slate-900/30 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <span>🇪🇸</span> La Liga <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-950/85 text-slate-400 font-bold font-mono">{conteoPorLiga.espana}</span>
            </button>
            <button
              onClick={() => setLigaSeleccionada('inglaterra')}
              className={`px-4 py-2 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 border ${
                ligaSeleccionada === 'inglaterra'
                  ? 'bg-teal-500/10 border-teal-500/40 text-teal-300 shadow-[0_0_15px_rgba(20,184,166,0.15)]'
                  : 'bg-slate-900/30 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <span>🏴󠁧󠁢󠁥󠁮󠁧󠁿</span> Premier <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-950/85 text-slate-400 font-bold font-mono">{conteoPorLiga.inglaterra}</span>
            </button>
            <button
              onClick={() => setLigaSeleccionada('italia')}
              className={`px-4 py-2 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 border ${
                ligaSeleccionada === 'italia'
                  ? 'bg-teal-500/10 border-teal-500/40 text-teal-300 shadow-[0_0_15px_rgba(20,184,166,0.15)]'
                  : 'bg-slate-900/30 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <span>🇮🇹</span> Serie A <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-950/85 text-slate-400 font-bold font-mono">{conteoPorLiga.italia}</span>
            </button>
            <button
              onClick={() => setLigaSeleccionada('alemania')}
              className={`px-4 py-2 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 border ${
                ligaSeleccionada === 'alemania'
                  ? 'bg-teal-500/10 border-teal-500/40 text-teal-300 shadow-[0_0_15px_rgba(20,184,166,0.15)]'
                  : 'bg-slate-900/30 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <span>🇩🇪</span> Bundesliga <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-950/85 text-slate-400 font-bold font-mono">{conteoPorLiga.alemania}</span>
            </button>
          </div>

          {/* Grilla de Equipos Filtrados */}
          {equiposFiltrados.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left w-full">
              {equiposFiltrados.map((equipo) => {
                const estrellas = '⭐'.repeat(Math.round(equipo.reputacion / 20));
                const isHovered = hoveredTeamId === equipo.id;
                
                // Clasificación de reputación para los badges
                let repLabel = '';
                let repColor = '';
                if (equipo.reputacion >= 90) {
                  repLabel = 'Elite Mundial';
                  repColor = 'bg-teal-500/10 text-teal-400 border border-teal-500/20';
                } else if (equipo.reputacion >= 80) {
                  repLabel = 'Gigante Europeo';
                  repColor = 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
                } else if (equipo.reputacion >= 70) {
                  repLabel = 'Competidor';
                  repColor = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
                } else {
                  repLabel = 'Proyecto Desafío';
                  repColor = 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
                }

                // Determinar país de origen del equipo
                const pais = obtenerPaisEquipo(equipo.id);
                const banderaPais = pais === 'espana' ? '🇪🇸' : pais === 'inglaterra' ? '🏴󠁧󠁢󠁥󠁮󠁧󠁿' : pais === 'italia' ? '🇮🇹' : '🇩🇪';

                return (
                  <div
                    key={equipo.id}
                    onClick={() => seleccionarEquipo(equipo.id, nombreManagerInput || 'DT Mánager')}
                    style={{
                      borderTop: `4px solid ${equipo.colorPrincipal}`,
                      boxShadow: isHovered ? `0 12px 30px -8px ${equipo.colorPrincipal}4D` : 'none',
                      transform: isHovered ? 'translateY(-6px)' : 'none',
                    }}
                    onMouseEnter={() => setHoveredTeamId(equipo.id)}
                    onMouseLeave={() => setHoveredTeamId(null)}
                    className="bg-slate-900/50 backdrop-blur-md rounded-2xl p-5 border border-slate-800/80 cursor-pointer transition-all duration-300 flex flex-col justify-between relative overflow-hidden group select-none"
                  >
                    {/* Brillo ambiental trasero de color del club en hover */}
                    <div 
                      className="absolute top-0 right-0 w-24 h-24 rounded-full blur-[45px] opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none"
                      style={{ backgroundColor: equipo.colorPrincipal }}
                    ></div>

                    <div>
                      {/* Fila superior: Escudo Premium y Código */}
                      <div className="flex items-center justify-between mb-4">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-3xl shadow-inner relative overflow-hidden transition-transform duration-300 group-hover:scale-110"
                          style={{
                            background: `radial-gradient(circle, ${equipo.colorPrincipal}22 0%, #0b0f19 100%)`,
                            border: `1.5px solid ${equipo.colorSecundario || equipo.colorPrincipal}22`
                          }}
                        >
                          {equipo.escudo}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-950/80 text-slate-400 group-hover:text-white transition-colors border border-slate-800">
                            {equipo.nombreCorto}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {banderaPais} {pais === 'espana' ? 'La Liga' : pais === 'inglaterra' ? 'Premier' : pais === 'italia' ? 'Serie A' : 'Bundesliga'}
                          </span>
                        </div>
                      </div>

                      {/* Nombre y Reputación */}
                      <h3 className="text-base font-extrabold text-slate-100 group-hover:text-teal-400 transition-colors mb-1 truncate">
                        {equipo.nombre}
                      </h3>
                      
                      <div className="flex flex-wrap items-center gap-1.5 mb-4">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${repColor}`}>
                          {repLabel}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold font-mono" title={`Reputación: ${equipo.reputacion}%`}>
                          {estrellas}
                        </span>
                      </div>
                      
                      {/* Datos Ficha Técnica */}
                      <div className="space-y-2 text-xs border-t border-slate-800/80 pt-4 mb-6">
                        <div className="flex justify-between items-center py-0.5">
                          <span className="text-slate-500 flex items-center gap-1.5">🏟️ <span>Estadio:</span></span>
                          <span className="font-semibold text-slate-300 text-right truncate max-w-[130px]" title={equipo.estadio}>
                            {equipo.estadio}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-0.5">
                          <span className="text-slate-500 flex items-center gap-1.5">👥 <span>Aforo:</span></span>
                          <span className="font-mono font-semibold text-slate-300">
                            {equipo.capacidadEstadio.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-0.5">
                          <span className="text-slate-500 flex items-center gap-1.5">💰 <span>Presupuesto:</span></span>
                          <span className="font-mono font-bold text-teal-400">
                            {formatearMoneda(equipo.presupuestoFichajes)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Botón interactivo premium con colores dinámicos del club */}
                    <div
                      className="w-full py-2.5 bg-slate-950/80 text-teal-400 group-hover:text-slate-900 border border-slate-800 group-hover:border-transparent font-bold rounded-xl text-xs transition-all duration-300 uppercase tracking-wider text-center flex items-center justify-center gap-1.5 shadow-sm active:scale-95 animate-fade-in"
                      style={{
                        backgroundColor: isHovered ? equipo.colorPrincipal : undefined,
                        color: isHovered ? (usarTextoOscuro(equipo.colorPrincipal) ? '#090d16' : '#ffffff') : undefined,
                      }}
                    >
                      Elegir Club <span className="transition-transform group-hover:translate-x-1 duration-200">→</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Estado Vacío de Búsqueda */
            <div className="w-full bg-slate-900/20 backdrop-blur-md rounded-2xl border border-slate-800/80 p-12 text-center max-w-lg shadow-inner">
              <span className="text-4xl block mb-4">🔍❌</span>
              <h3 className="text-lg font-bold text-slate-300 mb-2">No se encontraron clubes</h3>
              <p className="text-slate-500 text-xs leading-relaxed mb-6">
                No pudimos hallar ningún club que coincida con "<strong className="text-slate-400">{busqueda}</strong>" en la liga de <strong>{ligaSeleccionada === 'todas' ? 'Europa' : ligaSeleccionada.charAt(0).toUpperCase() + ligaSeleccionada.slice(1)}</strong>.
              </p>
              <button
                onClick={() => {
                  setBusqueda('');
                  setLigaSeleccionada('todas');
                }}
                className="px-5 py-2 bg-slate-800 hover:bg-teal-600 text-teal-400 hover:text-white font-bold rounded-lg text-xs uppercase tracking-wider transition-all"
              >
                Restablecer Filtros
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // PANTALLA 2: CENTRO DE CARRERA (DESEMPLEADO)
  // ==========================================
  if (juegoIniciado && !equipoUsuarioId) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col items-center justify-start p-6 md:p-12 relative overflow-x-hidden overflow-y-auto animate-fade-in">
        {/* Decoraciones de fondo premium */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-teal-500/5 blur-[130px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/5 blur-[130px] pointer-events-none"></div>

        <div className="z-10 text-center max-w-6xl w-full flex flex-col items-center">
          <div className="mb-6 max-w-2xl text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-5 font-semibold text-xs tracking-wider uppercase shadow-[0_0_15px_rgba(245,158,11,0.1)]">
              💼 Centro de Carrera del Mánager
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2 bg-gradient-to-r from-amber-300 via-teal-400 to-indigo-400 bg-clip-text text-transparent">
              OFICINA DE DESEMPLEO
            </h1>
            <p className="text-slate-400 text-sm">
              Estás desempleado. Buscá vacantes disponibles en el mercado y postulá a nuevos desafíos.
            </p>
          </div>

          <div className="w-full text-left">
            <PerfilManagerView />
          </div>

          <div className="mt-8">
            <button
              onClick={reiniciarPartida}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-rose-400 font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
            >
              ⚠️ Abandonar Partida y Empezar de Nuevo
            </button>
          </div>
        </div>
      </div>
    );
  }

  const jugadoresClub = jugadores.filter(j => j.idEquipo === equipoUsuario!.id);

  const renderSidebarContent = (closeMobileMenu?: () => void) => {
    const handleNavigation = (nuevaVista: typeof vista) => {
      setVista(nuevaVista);
      if (closeMobileMenu) closeMobileMenu();
    };

    return (
      <>
        {/* Cabecera del club y fecha */}
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          <div 
            style={{ borderLeft: `8px solid ${equipoUsuario!.colorPrincipal}` }}
            className="p-5 bg-slate-950 flex flex-col gap-2 relative border-b border-slate-800"
          >
            <div className="flex items-center gap-3">
              <span className="text-4xl">{equipoUsuario!.escudo}</span>
              <div>
                <h2 className="font-extrabold text-sm tracking-wide text-slate-100 uppercase leading-tight">
                  {equipoUsuario!.nombre}
                </h2>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Manager Club
                </span>
              </div>
            </div>

            {/* Medidor de Confianza de la Directiva */}
            <div className="mt-2 bg-slate-900/80 rounded-lg p-2 border border-slate-800 flex flex-col gap-1 text-[10px]">
              <div className="flex justify-between font-bold uppercase tracking-wider text-slate-400">
                <span>🤝 Confianza</span>
                <span className={
                  confianzaDirectiva >= 70 ? 'text-teal-400' :
                  confianzaDirectiva >= 40 ? 'text-amber-500' :
                  'text-rose-500 font-extrabold'
                }>{confianzaDirectiva}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${confianzaDirectiva}%` }}
                  className={`h-full rounded-full transition-all duration-500 ${
                    confianzaDirectiva >= 70 ? 'bg-teal-500' :
                    confianzaDirectiva >= 40 ? 'bg-amber-500' :
                    'bg-rose-500 animate-pulse'
                  }`}
                />
              </div>
            </div>
            
            {/* Fecha formateada de manera elegante */}
            <div className="mt-3 bg-slate-900/90 rounded-lg p-2.5 border border-slate-800 flex items-center gap-2">
              <span className="text-sm">📅</span>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Calendario</span>
                <span className="text-xs text-slate-300 font-semibold tracking-wide">
                  {fechaActual}
                </span>
              </div>
            </div>
          </div>

          {/* Menú de navegación */}
          <nav className="p-4 space-y-1">
            <button
              onClick={() => handleNavigation('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-150 ${
                vista === 'dashboard'
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-700/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <span>🏠</span> Inicio
            </button>
            <button
              onClick={() => handleNavigation('plantel')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-150 ${
                vista === 'plantel'
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-700/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <span>👥</span> Plantel
            </button>
            <button
              onClick={() => handleNavigation('tactica')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-150 ${
                vista === 'tactica'
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-700/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <span>📋</span> Táctica
            </button>
            <button
              onClick={() => handleNavigation('entrenamiento')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-150 ${
                vista === 'entrenamiento'
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-700/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <span>🏋️</span> Entrenamiento
            </button>
            <button
              onClick={() => handleNavigation('tabla')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-150 ${
                vista === 'tabla'
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-700/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <span>📊</span> Tabla de Posiciones
            </button>
            <button
              onClick={() => handleNavigation('copa')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-150 ${
                vista === 'copa'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-900/30'
                  : 'text-indigo-400 hover:text-slate-100 hover:bg-indigo-950/20'
              }`}
            >
              <span>🏆</span> Copa de Campeones
            </button>
            <button
              onClick={() => handleNavigation('club')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-150 ${
                vista === 'club'
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-700/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <span>🏛️</span> Club
            </button>
            <button
              onClick={() => handleNavigation('mercado')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-150 ${
                vista === 'mercado'
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-700/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <span>🛒</span> Mercado
            </button>
            <button
              onClick={() => handleNavigation('analitica')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-150 ${
                vista === 'analitica'
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-700/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <span>📊</span> Analítica
            </button>
            <button
              onClick={() => handleNavigation('perfil')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-150 ${
                vista === 'perfil'
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-700/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <span>👔</span> Perfil Mánager
            </button>
            <button
              onClick={() => handleNavigation('fama')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-150 ${
                vista === 'fama'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-700/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <span>🏆</span> Salón de la Fama
            </button>
          </nav>
        </div>

        {/* Zona Inferior: Botones de Acción Rápida */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 space-y-2">
          {/* Botón Avanzar Día */}
          <button
            onClick={() => {
              avanzarDia();
              if (closeMobileMenu) closeMobileMenu();
            }}
            className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-bold rounded-lg text-xs uppercase tracking-wider shadow-md hover:shadow-lg active:scale-95 transform transition-all duration-150"
          >
            ⏭️ Avanzar Día (+2 Forma)
          </button>
          
          <button
            onClick={() => {
              reiniciarPartida();
              if (closeMobileMenu) closeMobileMenu();
            }}
            className="w-full py-2 bg-slate-900 border border-slate-800 text-slate-500 hover:text-rose-400 hover:border-rose-950 hover:bg-rose-950/20 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all"
          >
            ⚠️ Abandonar Partida
          </button>
        </div>
      </>
    );
  };

  return (
    <>
    <div className="flex h-screen bg-[#090d16] text-slate-100 font-sans overflow-hidden">
      
      {/* ==========================================
          BARRA LATERAL (SIDEBAR) ESTILO FOOTBALL MANAGER
          ========================================== */}
      <aside className="hidden md:flex w-72 bg-slate-900 border-r border-slate-800 flex-col justify-between z-20 shadow-xl flex-shrink-0">
        {renderSidebarContent()}
      </aside>

      {/* Sidebar Móvil (Drawer) */}
      {menuAbierto && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div 
            onClick={() => setMenuAbierto(false)} 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
          />
          {/* Sidebar Panel */}
          <aside className="fixed top-0 bottom-0 left-0 w-72 bg-slate-900 border-r border-slate-800 flex flex-col justify-between z-50 shadow-2xl animate-fade-in">
            {renderSidebarContent(() => setMenuAbierto(false))}
          </aside>
        </div>
      )}

      {/* ==========================================
          SECCIÓN PRINCIPAL DE CONTENIDO
          ========================================== */}
      <main className="flex-1 overflow-y-auto relative flex flex-col">
        {/* Cabecera superior interna */}
        <header className="h-16 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 px-4 md:px-8 flex items-center justify-between flex-shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuAbierto(true)}
              className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold text-slate-400 tracking-widest hidden sm:inline">Liga simulada</span>
              <span className="bg-blue-500/10 text-blue-400 text-[10px] font-extrabold px-2 py-0.5 rounded border border-blue-500/20">
                {liga.nombre}
              </span>
            </div>
          </div>

          <div className="text-xs font-medium text-slate-400">
            {formatearFecha(fechaActual)}
          </div>
        </header>

        {/* Carga del Contenido de Vistas */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          
          {/* VISTA 1: DASHBOARD (INICIO DESDE COMPONENTE MODULAR) */}
          {vista === 'dashboard' && (
            <DashboardView />
          )}

          {/* VISTA 2: PLANTEL (LISTA Y DETALLE COMPLETO DESDE COMPONENTE MODULAR) */}
          {vista === 'plantel' && (
            <PlantelView />
          )}

          {/* VISTA TÁCTICA (CANCHA INTERACTIVA Y CONVOCADOS) */}
          {vista === 'tactica' && (
            <TacticaView />
          )}

          {/* VISTA ENTRENAMIENTO */}
          {vista === 'entrenamiento' && (
            <EntrenamientoView />
          )}

          {/* VISTA 3: TABLA DE POSICIONES (STANDINGS DESDE COMPONENTE MODULAR) */}
          {vista === 'tabla' && (
            <LigaView />
          )}

          {/* VISTA 4: MERCADO DE FICHAJES (COMPONENTE MODULAR) */}
          {vista === 'mercado' && (
            <MercadoView />
          )}

          {/* VISTA 5: ANALÍTICA AVANZADA (CENTRO DE DATOS Y COMPARTIVA RADAR) */}
          {vista === 'analitica' && (
            <AnaliticaView />
          )}

          {/* VISTA 6: COPA INTERNACIONAL (COPA DE CAMPEONES) */}
          {vista === 'copa' && (
            <CopaInternacionalView />
          )}

          {/* VISTA CLUB E INFRAESTRUCTURA */}
          {vista === 'club' && (
            <ClubView />
          )}

          {/* VISTA 7: PERFIL MÁNAGER & OFERTAS DE EMPLEO */}
          {vista === 'perfil' && (
            <PerfilManagerView />
          )}

          {/* VISTA SALÓN DE LA FAMA */}
          {vista === 'fama' && (
            <SalonDeLaFamaView />
          )}
 
        </div>
      </main>
 
      {/* ==========================================
          MODAL DE PARTIDO SIMULADO EN VIVO (GLOBAL)
          ========================================== */}
      {partidoReciente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col animate-fade-in my-8">
            
            {/* Header del Estadio y Marcador */}
            <div className="p-6 bg-slate-950 border-b border-slate-800 text-center relative">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Resultado de la Jornada Oficial</span>
              
              {/* Marcador Gigante */}
              <div className="flex items-center justify-center gap-8 mt-4">
                <div className="text-center w-1/3">
                  <span className="text-5xl block mb-2">{partidoReciente.local.escudo}</span>
                  <span className="text-sm font-bold block text-white truncate">{partidoReciente.local.nombre}</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="text-5xl font-black text-teal-400 font-mono">{partidoReciente.golesLocal}</span>
                  <span className="text-lg font-bold text-slate-600">-</span>
                  <span className="text-5xl font-black text-teal-400 font-mono">{partidoReciente.golesVisitante}</span>
                </div>

                <div className="text-center w-1/3">
                  <span className="text-5xl block mb-2">{partidoReciente.visitante.escudo}</span>
                  <span className="text-sm font-bold block text-white truncate">{partidoReciente.visitante.nombre}</span>
                </div>
              </div>
            </div>

            {/* Crónica / Transmisión minuto a minuto */}
            <div className="p-6 space-y-4 flex-1 overflow-y-auto max-h-[300px] bg-slate-950/30">
              <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest border-b border-slate-850 pb-1">
                🎙️ Relato del Partido
              </h4>
              <div className="space-y-2 font-mono text-xs leading-relaxed">
                {partidoReciente.eventos.map((ev, i) => (
                  <div
                    key={i}
                    className={`p-2 rounded border transition-all ${
                      ev.includes('GOOOL')
                        ? ev.includes('🔴')
                          ? 'bg-rose-500/10 text-rose-300 border-l-2 border-rose-500'
                          : 'bg-blue-500/10 text-blue-300 border-l-2 border-blue-500'
                        : 'text-slate-400 border-transparent bg-slate-900/40'
                    }`}
                  >
                    {ev}
                  </div>
                ))}
              </div>
            </div>

            {/* Otro partido e Info de Cierre */}
            <div className="p-5 bg-slate-950 border-t border-slate-800 space-y-4">
              <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-500">🏟️ En otros estadios</span>
                <span className="font-semibold text-slate-300">{partidoReciente.otroPartidoTexto || 'No hubo otros partidos'}</span>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={cerrarPartidoReciente}
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg shadow-md transition-all active:scale-95"
                >
                  Cerrar y Continuar
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ==========================================
          MODAL GIGANTE DE RÉCORD HISTÓRICO
          ========================================== */}
      {recordModalActivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto animate-fade-in">
          <style>{`
            @keyframes pulseGlow {
              0%, 100% { box-shadow: 0 0 15px rgba(245, 158, 11, 0.1); border-color: rgba(245, 158, 11, 0.3); }
              50% { box-shadow: 0 0 30px rgba(245, 158, 11, 0.25); border-color: rgba(245, 158, 11, 0.6); }
            }
            .animate-pulse-glow {
              animation: pulseGlow 2s infinite ease-in-out;
            }
            .border-glow {
              animation: pulseGlow 3s infinite ease-in-out;
            }
          `}</style>
          <div className="bg-gradient-to-b from-slate-950/95 to-slate-900 border-2 border-amber-400/50 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl shadow-amber-500/10 flex flex-col items-center justify-center text-center p-8 border-glow">
            
            {/* Corona / Trofeo animado */}
            <div className="w-24 h-24 rounded-full bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-5xl mb-6 shadow-inner animate-pulse-glow">
              👑
            </div>

            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 via-yellow-400 to-amber-500 tracking-tight mb-4 uppercase">
              ¡RÉCORD HISTÓRICO!
            </h2>
            
            <p className="text-sm text-slate-200 leading-relaxed max-w-md font-medium mb-8">
              {recordModalActivo.mensaje}
            </p>

            <button
              onClick={cerrarRecordModal}
              className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black uppercase tracking-wider text-xs px-8 py-3.5 rounded-xl shadow-lg shadow-amber-900/30 transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              🎉 ¡Celebrar Hazaña!
            </button>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL DE OFERTA DE TRANSFERENCIA RECIBIDA (SALÓN DE JUNTAS PREMIUM)
          ========================================== */}
      {(ofertaRecibidaActiva || resultadoNegociacion) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col my-8 border-t-4 border-t-teal-500 animate-scale-in">
            
            {/* Header: Boardroom Vibe */}
            <div className="p-6 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-teal-400 tracking-widest block mb-1">
                  💼 Negociaciones de Sala de Juntas
                </span>
                <h3 className="text-xl font-extrabold text-white">
                  {resultadoNegociacion ? 'Resolución de la Operación' : 'Oferta de Transferencia Recibida'}
                </h3>
              </div>
              <div className="text-2xl">🤝</div>
            </div>

            {/* Content Switcher */}
            {resultadoNegociacion ? (
              /* SCREEN 2: RESOLUTION OF NEGOTIATION */
              <div className="p-8 text-center space-y-6 bg-slate-950/30">
                <div className="flex justify-center">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-lg ${
                    resultadoNegociacion.aceptado 
                      ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30 shadow-teal-500/10 animate-bounce' 
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-rose-500/10'
                  }`}>
                    {resultadoNegociacion.aceptado ? '✅' : '❌'}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className={`text-2xl font-black uppercase tracking-wide ${
                    resultadoNegociacion.aceptado ? 'text-teal-400' : 'text-rose-500'
                  }`}>
                    {resultadoNegociacion.aceptado ? '¡Acuerdo Traspasado!' : 'Negociaciones Rotas'}
                  </h4>
                  <p className="text-slate-300 text-sm max-w-lg mx-auto leading-relaxed">
                    {resultadoNegociacion.mensaje}
                  </p>
                </div>

                <div className="pt-6 border-t border-slate-800 flex justify-center">
                  <button
                    onClick={cerrarResultadoNegociacion}
                    className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
                  >
                    Regresar al Escritorio
                  </button>
                </div>
              </div>
            ) : (
              /* SCREEN 1: THE OFFER DETAILED BOARD */
              <>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/20">
                  {/* Left Column: Player & Stats */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                      👤 Jugador Pretendido
                    </h4>
                    
                    {(() => {
                      const j = jugadores.find(x => x.id === ofertaRecibidaActiva?.jugadorId);
                      if (!j) return null;
                      
                      return (
                        <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 relative overflow-hidden group">
                          {/* Accent line based on rating */}
                          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-teal-500"></div>
                          
                          <div className="flex justify-between items-start pl-2">
                            <div>
                              <h5 className="font-bold text-white text-base leading-snug">{j.nombre}</h5>
                              <span className="text-[10px] text-teal-400 font-mono font-bold uppercase tracking-wider">{j.posicion} • {j.edad} años</span>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Valor</div>
                              <div className="text-sm font-black text-slate-300 font-mono">{formatearMoneda(j.valorMercado)}</div>
                            </div>
                          </div>

                          <div className="mt-4 pl-2 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-slate-850 pt-3 text-xs">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Calidad Actual:</span>
                              <span className="font-bold text-slate-300">{j.ca} / 100</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Potencial:</span>
                              <span className="font-bold text-slate-400">{j.pa}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Moral:</span>
                              <span className={`font-bold ${
                                j.moral >= 75 ? 'text-green-400' : j.moral >= 45 ? 'text-yellow-400' : 'text-rose-400'
                              }`}>{j.moral}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Físico:</span>
                              <span className="font-bold text-slate-300">{j.formaFisica}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Buyer Club details */}
                    <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800 space-y-3">
                      <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                        🏢 Club Ofertante
                      </h4>
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">{ofertaRecibidaActiva?.clubCompradorEscudo}</span>
                        <div>
                          <h5 className="font-bold text-white text-sm">{ofertaRecibidaActiva?.clubCompradorNombre}</h5>
                          <span className="text-[10px] text-slate-400 font-medium">Reputación: {ofertaRecibidaActiva?.clubCompradorReputacion}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Financial Figures & Offer Negotiation */}
                  <div className="space-y-4 flex flex-col justify-between">
                    <div>
                      <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                        💰 La Oferta Económica
                      </h4>
                      
                      <div className="bg-slate-950/80 rounded-xl p-5 border border-slate-800 text-center space-y-3 shadow-inner relative overflow-hidden">
                        <div className="absolute right-[-20px] top-[-20px] text-8xl opacity-5 pointer-events-none select-none">💶</div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Monto Propuesto</span>
                        <div className="text-3xl font-black text-teal-400 font-mono tracking-tight drop-shadow-[0_0_15px_rgba(20,184,166,0.15)]">
                          {formatearMoneda(ofertaRecibidaActiva?.montoOfrecido || 0)}
                        </div>
                        <div className="flex justify-center items-center gap-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold ${
                            (ofertaRecibidaActiva?.multiplicador || 1) >= 1.15
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {ofertaRecibidaActiva?.multiplicador.toFixed(2)}x Valor
                          </span>
                          <span className="text-[10px] text-slate-500">sobre valor</span>
                        </div>
                      </div>
                    </div>

                    {ofertaRecibidaActiva?.esClausula ? (
                      <div className="bg-rose-950/30 rounded-xl p-5 border border-rose-500/30 space-y-4">
                        <div className="text-center space-y-1">
                          <span className="text-rose-500 font-extrabold uppercase tracking-widest text-xs block">
                            💥 Cláusula de Rescisión Ejecutada
                          </span>
                          <p className="text-slate-300 text-xs leading-relaxed">
                            El club comprador ha depositado el total de la cláusula de rescisión de <strong>{formatearMoneda(ofertaRecibidaActiva.montoOfrecido)}</strong>. No puedes rechazar la oferta ni contraofertar. La decisión de continuar o marcharse recae únicamente en el jugador.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            const decideIrse = Math.random() < 0.60;
                            if (decideIrse) {
                              aceptarOfertaRecibida();
                              setResultadoNegociacion({
                                aceptado: true,
                                mensaje: `🗣️ Representante: "${ofertaRecibidaActiva.jugadorNombre} ha llegado a un acuerdo con el ${ofertaRecibidaActiva.clubCompradorNombre}. Agradece tu tiempo en el club y te desea lo mejor en el futuro."\n\nEl jugador se marcha y sumas ${formatearMoneda(ofertaRecibidaActiva.montoOfrecido)} a tu presupuesto de fichajes.`
                              });
                            } else {
                              rechazarOfertaRecibida();
                              setResultadoNegociacion({
                                aceptado: false,
                                mensaje: `🗣️ Representante: "${ofertaRecibidaActiva.jugadorNombre} ha rechazado el contrato ofrecido por el ${ofertaRecibidaActiva.clubCompradorNombre} debido a que prefiere seguir desarrollándose bajo tu dirección."\n\nEl jugador ha decidido quedarse en tu club.`
                              });
                            }
                          }}
                          className="w-full py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold rounded-lg text-xs uppercase tracking-wider transition-all active:scale-95 shadow-lg shadow-red-900/20"
                        >
                          Ver Decisión del Jugador ➜
                        </button>
                      </div>
                    ) : (
                      /* Counter-offer Interactive Panel */
                      <div className="bg-slate-950/40 rounded-xl p-4 border border-slate-800 space-y-3">
                        <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex justify-between">
                          <span>✍️ Contraofertar</span>
                          <span className="text-slate-500 font-normal">Máx recomendado: +20%</span>
                        </h4>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg p-2 font-mono">
                            <input
                              type="number"
                              value={contraofertaValor}
                              onChange={(e) => setContraofertaValor(Math.max(0, parseInt(e.target.value) || 0))}
                              className="bg-transparent text-white text-base font-bold outline-none flex-1 font-mono"
                            />
                            <span className="text-teal-400 text-xs font-bold font-mono">€</span>
                          </div>

                          {/* visual help */}
                          {ofertaRecibidaActiva && (
                            <div className="flex justify-between items-center text-[10px] text-slate-500">
                              <span>Sugerencia IA (+20%): <strong className="text-teal-500/90 font-mono">{formatearMoneda(Math.round(ofertaRecibidaActiva.montoOfrecido * 1.2))}</strong></span>
                              <button
                                onClick={() => setContraofertaValor(Math.round(ofertaRecibidaActiva.montoOfrecido * 1.2))}
                                className="text-teal-400 hover:underline font-bold"
                              >
                                Ajustar Máximo
                              </button>
                            </div>
                          )}

                          <button
                            onClick={manejarContraoferta}
                            className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold rounded-lg text-xs uppercase tracking-wider transition-all active:scale-98 shadow-md"
                          >
                            Presentar Contraoferta
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Buttons: Accept and Reject */}
                <div className="p-6 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row gap-3 justify-between items-center">
                  {ofertaRecibidaActiva?.esClausula ? (
                    <div className="text-[10px] text-rose-400 text-center sm:text-left font-semibold">
                      ⚠️ Cláusula Ejecutada: Las decisiones directivas están deshabilitadas para esta operación.
                    </div>
                  ) : (
                    <>
                      <div className="text-[10px] text-slate-500 text-center sm:text-left">
                        ⚠️ Rechazar ofertas lucrativas de clubes grandes puede causar malestar y bajar la moral del jugador.
                      </div>
                      
                      <div className="flex gap-3 w-full sm:w-auto">
                        <button
                          onClick={rechazarOfertaRecibida}
                          className="flex-1 sm:flex-initial px-6 py-3 bg-slate-900 border border-slate-800 hover:border-rose-950 hover:bg-rose-950/20 text-slate-300 hover:text-rose-400 font-bold rounded-lg text-xs uppercase tracking-wider transition-all"
                        >
                          Rechazar Oferta
                        </button>
                        <button
                          onClick={aceptarOfertaRecibida}
                          className="flex-1 sm:flex-initial px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold rounded-lg text-xs uppercase tracking-wider transition-all shadow-md shadow-teal-900/10"
                        >
                          Aceptar Oferta
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}

          </div>
        </div>
      )}

    </div>

    {/* ==========================================
        MODAL DE EVENTO ALEATORIO DE VESTUARIO
        Se renderiza como overlay sobre todo el contenido
        ========================================== */}
    {eventoActivo && (
      <EventoVestuarioModal evento={eventoActivo} />
    )}
    </>
  );
};

// ==========================================
// EXPORTACIÓN PRINCIPAL WRAPPED CON EL GAMEPROVIDER
// ==========================================
export default function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}

