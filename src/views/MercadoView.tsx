import React, { useState, useMemo } from 'react';
import { useGame } from '../context/useGame';
import { Jugador, PromesaGestion } from '../types';
import { CriterioOrden, DireccionOrden, ordenarJugadores } from '../utils/sorting';

// Formateador de dinero
const formatearMoneda = (valor: number): string => {
  if (valor >= 1000000) {
    return `${(valor / 1000000).toFixed(1)} M€`;
  }
  return `${(valor / 1000).toFixed(0)} m€`;
};

export const MercadoView: React.FC = () => {
  const { jugadores, equipos, equipoUsuario, comprarJugador, ofrecerContratoLibre } = useGame();

  // Estados de filtros y ordenación
  const [busqueda, setBusqueda] = useState<string>('');
  const [filtroPosicion, setFiltroPosicion] = useState<string>('TODOS');
  const [criterioOrden, setCriterioOrden] = useState<CriterioOrden>('ca');
  const [direccionOrden, setDireccionOrden] = useState<DireccionOrden>('DESC');

  // Estado del modal de negociación
  const [jugadorAOfrecer, setJugadorAOfrecer] = useState<Jugador | null>(null);
  const [ofertaValor, setOfertaValor] = useState<number>(0);
  const [clausulaOfrecidaCompra, setClausulaOfrecidaCompra] = useState<number>(0);
  const [feedbackNegociacion, setFeedbackNegociacion] = useState<{
    aceptado: boolean;
    mensaje: string;
  } | null>(null);
  const [promesaExigida, setPromesaExigida] = useState<PromesaGestion | null>(null);

  // Estados para Bosman / Contrato Libre
  const [jugadorBosman, setJugadorBosman] = useState<Jugador | null>(null);
  const [sueldoBosman, setSueldoBosman] = useState<number>(0);
  const [clausulaBosman, setClausulaBosman] = useState<number>(0);
  const [feedbackBosman, setFeedbackBosman] = useState<{ aceptado: boolean; mensaje: string } | null>(null);

  if (!equipoUsuario) return null;

  // --- FILTRAR JUGADORES (QUE NO SEAN DEL USUARIO) ---
  const jugadoresMercado = jugadores.filter(j => j.idEquipo !== equipoUsuario.id);

  // Filtrado final por búsqueda y categoría de posición
  const jugadoresFiltrados = jugadoresMercado.filter(j => {
    // Filtro por nombre
    const coincideNombre = j.nombre.toLowerCase().includes(busqueda.toLowerCase());

    // Filtro por posición
    let coincidePosicion = true;
    if (filtroPosicion === 'POR') {
      coincidePosicion = j.posicion === 'POR';
    } else if (filtroPosicion === 'DFC') {
      coincidePosicion = j.posicion === 'DFC' || j.posicion === 'LD' || j.posicion === 'LI';
    } else if (filtroPosicion === 'MC') {
      coincidePosicion = j.posicion === 'MC' || j.posicion === 'MCO';
    } else if (filtroPosicion === 'DEL') {
      coincidePosicion = j.posicion === 'DC' || j.posicion === 'ED' || j.posicion === 'EI';
    }

    return coincideNombre && coincidePosicion;
  });

  // Ordenación premium
  const jugadoresOrdenados = useMemo(() => {
    return ordenarJugadores(jugadoresFiltrados, criterioOrden, direccionOrden);
  }, [jugadoresFiltrados, criterioOrden, direccionOrden]);

  // Abrir modal de oferta
  const abrirModalOferta = (jugador: Jugador) => {
    setJugadorAOfrecer(jugador);
    setOfertaValor(jugador.valorMercado); // Inicializar oferta en su valor de mercado actual
    setClausulaOfrecidaCompra(Math.round((jugador.valorMercado * 1.8) / 1000) * 1000);
    setFeedbackNegociacion(null);

    // Generar promesa si es un jugador top (ca >= 80)
    if (jugador.ca >= 80) {
      const tiposPromesa = [
        { tipo: 'penales', desc: 'Exige ser el pateador principal de penales' },
        { tipo: 'copa_internacional', desc: 'Exige que el equipo clasifique a la copa internacional esta temporada' },
        { tipo: 'titular_indiscutido', desc: 'Exige ser Titular Indiscutido' }
      ];
      const elegida = tiposPromesa[Math.floor(Math.random() * tiposPromesa.length)];
      setPromesaExigida({
        id: `promesa-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        descripcion: elegida.desc,
        tipo: elegida.tipo as 'penales' | 'copa_internacional' | 'titular_indiscutido',
        estado: 'En proceso',
        partidosTranscurridos: 0
      });
    } else {
      setPromesaExigida(null);
    }
  };

  // Abrir modal de preacuerdo Bosman
  const abrirModalBosman = (jugador: Jugador) => {
    setJugadorBosman(jugador);
    const sueldoExigido = Math.max(
      jugador.salarioSemanal * 1.15,
      Math.round((jugador.ca ** 2) * 35)
    );
    setSueldoBosman(sueldoExigido);
    setClausulaBosman(Math.round((jugador.valorMercado * 1.8) / 1000) * 1000);
    setFeedbackBosman(null);
  };

  // Ejecutar negociación de oferta
  const enviarOferta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jugadorAOfrecer) return;
    const res = comprarJugador(jugadorAOfrecer.id, ofertaValor, promesaExigida, clausulaOfrecidaCompra > 0 ? clausulaOfrecidaCompra : undefined);
    setFeedbackNegociacion(res);
  };

  // Ejecutar preacuerdo Bosman
  const enviarOfertaBosman = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jugadorBosman) return;

    if (!sueldoBosman || sueldoBosman <= 0) {
      alert('El sueldo es obligatorio y debe ser mayor que 0.');
      return;
    }

    const res = ofrecerContratoLibre(jugadorBosman.id, sueldoBosman, clausulaBosman > 0 ? clausulaBosman : undefined);
    setFeedbackBosman(res);
  };

  return (
    <div className="space-y-6">

      {/* Cabecera / Buscador */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-850 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Mercado de Fichajes</h1>
          <p className="text-xs text-slate-400 mt-1">
            Contratá futbolistas estrella de otros clubes para potenciar tu plantilla. Presupuesto disponible: <strong className="text-teal-400">{formatearMoneda(equipoUsuario.presupuestoFichajes)}</strong>
          </p>
        </div>

        {/* Buscador visual */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">🔍</span>
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-slate-900 border border-slate-850 rounded-xl py-2 pl-9 pr-4 text-xs font-medium text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
          />
        </div>
      </div>

      {/* Filtros de Posición y Panel de Ordenación */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {['TODOS', 'POR', 'DFC', 'MC', 'DEL'].map((pos) => (
            <button
              key={pos}
              onClick={() => setFiltroPosicion(pos)}
              className={`px-4 py-2 rounded-xl text-[10px] uppercase font-extrabold tracking-wider border transition-all duration-150 ${filtroPosicion === pos
                ? 'bg-teal-600 border-teal-500 text-white shadow-md'
                : 'bg-slate-900/60 border-slate-850 text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                }`}
            >
              {pos === 'TODOS' ? 'Todos' :
                pos === 'POR' ? 'Porteros (POR)' :
                  pos === 'DFC' ? 'Defensas (DEF)' :
                    pos === 'MC' ? 'Mediocampistas (MED)' :
                      'Delanteros (DEL)'}
            </button>
          ))}
        </div>

        {/* Panel de Ordenación Premium */}
        <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-850 p-1.5 rounded-xl self-start lg:self-auto shadow-md">
          <span className="text-[10px] uppercase font-black text-slate-500 pl-2">Ordenar por:</span>
          <select
            value={criterioOrden}
            onChange={(e) => setCriterioOrden(e.target.value as CriterioOrden)}
            className="bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-2 py-1 text-[11px] font-bold focus:outline-none focus:border-teal-500 transition-colors"
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
            className="p-1 hover:bg-slate-800 rounded-lg text-[10px] font-extrabold text-teal-400 hover:text-white transition-colors flex items-center gap-1 px-2 border border-slate-800"
            title={direccionOrden === 'ASC' ? 'Orden Ascendente' : 'Orden Descendente'}
          >
            {direccionOrden === 'ASC' ? '⬆️ Asc' : '⬇️ Desc'}
          </button>
        </div>
      </div>

      {/* ==========================================
          TABLA DE JUGADORES DISPONIBLES
          ========================================== */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden shadow-lg backdrop-blur-md">
        <div className="overflow-x-auto">
          {jugadoresOrdenados.length > 0 ? (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">Nombre</th>
                  <th className="px-3 py-3.5">Club Actual</th>
                  <th className="px-3 py-3.5">Posición</th>
                  <th className="px-3 py-3.5 text-center">CA / PA</th>
                  <th className="px-3 py-3.5 text-right">Valor de Mercado</th>
                  <th className="px-3 py-3.5 text-right">Cláusula</th>
                  <th className="px-3 py-3.5 text-center">Contrato</th>
                  <th className="px-4 py-3.5 text-center w-36">Operaciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30">
                {jugadoresOrdenados.map((jugador) => {
                  const clubPropietario = equipos.find(e => e.id === jugador.idEquipo);

                  return (
                    <tr key={jugador.id} className="hover:bg-slate-800/25 transition-colors duration-150">

                      {/* Nombre y Nacionalidad */}
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-200">{jugador.nombre}</div>
                        <div className="text-[10px] text-slate-500">{jugador.nacionalidad} · {jugador.edad} años</div>
                      </td>

                      {/* Club Propietario */}
                      <td className="px-3 py-4 text-slate-300 font-medium">
                        <span className="mr-1.5">{clubPropietario?.escudo || '👤'}</span>
                        {clubPropietario?.nombre || 'Agente Libre'}
                      </td>

                      {/* Posición Pill */}
                      <td className="px-3 py-4">
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded tracking-wide ${jugador.posicion === 'POR' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                          jugador.posicion === 'DFC' || jugador.posicion === 'LI' || jugador.posicion === 'LD' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                            jugador.posicion === 'MC' || jugador.posicion === 'MCO' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                          {jugador.posicion}
                        </span>
                      </td>

                      {/* CA / PA */}
                      <td className="px-3 py-4 text-center font-mono font-bold text-slate-400">
                        <span className="text-teal-400">{jugador.ca}</span>
                        <span className="text-slate-650 px-1">/</span>
                        <span className="text-slate-300">{jugador.pa}</span>
                      </td>

                      {/* Valor de Mercado */}
                      <td className="px-3 py-4 text-right font-extrabold text-slate-200">
                        {formatearMoneda(jugador.valorMercado)}
                      </td>

                      {/* Cláusula */}
                      <td className="px-3 py-4 text-right font-semibold text-amber-500 font-mono">
                        {jugador.clausulaRescision && jugador.clausulaRescision > 0 ? formatearMoneda(jugador.clausulaRescision) : 'Sin cláusula'}
                      </td>

                      {/* Contrato */}
                      <td className="px-3 py-4 text-center">
                        <span className={`font-semibold font-mono ${jugador.mesesContrato !== undefined && jugador.mesesContrato <= 6
                          ? 'text-rose-400 animate-pulse font-bold'
                          : 'text-slate-400'
                          }`}>
                          {jugador.mesesContrato !== undefined ? `${jugador.mesesContrato} meses` : '---'}
                        </span>
                      </td>

                      {/* Botones de Fichaje */}
                      <td className="px-4 py-4 text-center">
                        <div className="flex flex-col sm:flex-row gap-1.5 justify-center items-center">
                          <button
                            onClick={() => abrirModalOferta(jugador)}
                            className="w-full sm:w-auto px-3 py-1.5 bg-slate-800 hover:bg-teal-650 border border-slate-700 text-teal-450 hover:text-white font-bold rounded-lg transition-all text-[10px] uppercase tracking-wide"
                          >
                            Ofertar
                          </button>
                          {jugador.mesesContrato !== undefined && jugador.mesesContrato <= 6 && (
                            <button
                              onClick={() => abrirModalBosman(jugador)}
                              className="w-full sm:w-auto px-2 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-lg transition-all text-[10px] uppercase tracking-wide whitespace-nowrap"
                            >
                              Fichar Libre
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-slate-500 italic">
              No se encontraron jugadores disponibles con los filtros activos.
            </div>
          )}
        </div>
      </div>

      {/* ==========================================
          MODAL DE NEGOCIACIÓN / OFERTA DE FICHAJE
          ========================================== */}
      {jugadorAOfrecer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col animate-fade-in my-8">

            {/* Header del modal */}
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Negociación de Transferencia</span>
                <h3 className="text-base font-extrabold text-white mt-1 tracking-tight">Fichar a {jugadorAOfrecer.nombre}</h3>
              </div>
              <button
                onClick={() => setJugadorAOfrecer(null)}
                className="text-slate-500 hover:text-white transition-colors text-sm"
              >
                ✕
              </button>
            </div>

            {/* Formulario y Detalles de Finanzas */}
            <div className="p-5 space-y-4">

              <div className="bg-slate-950 p-4 border border-slate-805 rounded-xl space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Valor de Mercado:</span>
                  <span className="text-slate-200 font-bold">{formatearMoneda(jugadorAOfrecer.valorMercado)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Presupuesto Disponible:</span>
                  <span className="text-teal-400 font-bold">{formatearMoneda(equipoUsuario.presupuestoFichajes)}</span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-slate-850 pt-2.5">
                  <span className="text-slate-500">Club Propietario:</span>
                  <span className="text-slate-300 font-semibold">
                    {jugadorAOfrecer.idEquipo === 'libre' ? 'Agente Libre' : (equipos.find(e => e.id === jugadorAOfrecer.idEquipo)?.nombre || 'Agente Libre')}
                  </span>
                </div>
              </div>

              {feedbackNegociacion ? (
                /* Card de Feedback de la IA */
                <div className={`p-4 rounded-xl border space-y-3 leading-relaxed text-xs ${feedbackNegociacion.aceptado
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-350 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-350 text-rose-300'
                  }`}>
                  <div className="flex items-center gap-2">
                    <span className="text-base">{feedbackNegociacion.aceptado ? '🟢' : '🔴'}</span>
                    <strong className="uppercase font-bold tracking-wider text-[10px]">
                      {jugadorAOfrecer.idEquipo === 'libre' ? 'Respuesta del Representante' : 'Respuesta del Club Rival'}
                    </strong>
                  </div>
                  <p>{feedbackNegociacion.mensaje}</p>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setJugadorAOfrecer(null)}
                      className={`px-4 py-1.5 text-[10px] uppercase font-bold tracking-wider rounded-lg shadow-sm border transition-all ${feedbackNegociacion.aceptado
                        ? 'bg-emerald-600 border-emerald-500 text-slate-950 hover:bg-emerald-500'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                    >
                      Entendido
                    </button>
                  </div>
                </div>
              ) : (
                /* Formulario de envío */
                <form onSubmit={enviarOferta} className="space-y-4">
                  {promesaExigida && (
                    <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs rounded-xl space-y-1">
                      <div className="font-bold flex items-center gap-1.5 uppercase tracking-wide text-[10px]">
                        <span>⚠️</span> Exigencia de Promesa
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        Este jugador exige la siguiente promesa de gestión para firmar su contrato:
                      </p>
                      <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800 text-slate-100 font-semibold italic mt-1 text-[11px]">
                        "{promesaExigida.descripcion}"
                      </div>
                    </div>
                  )}

                  {jugadorAOfrecer.clausulaRescision && jugadorAOfrecer.clausulaRescision > 0 ? (
                    <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-350 text-xs rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold flex items-center gap-1.5 uppercase tracking-wide text-[10px]">
                          ⚠️ Cláusula de Rescisión
                        </span>
                        <button
                          type="button"
                          onClick={() => setOfertaValor(jugadorAOfrecer.clausulaRescision!)}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded text-[9px] uppercase tracking-wider transition-colors"
                        >
                          Usar Cláusula ({formatearMoneda(jugadorAOfrecer.clausulaRescision)})
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        Si ofertas exactamente el monto de su cláusula de rescisión (<strong>{formatearMoneda(jugadorAOfrecer.clausulaRescision)}</strong>), el club vendedor estará obligado a vender y el fichaje se procesará directamente.
                      </p>
                    </div>
                  ) : null}

                  {equipoUsuario.presupuestoFichajes <= 0 ? (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs rounded-lg">
                      ⚠️ <strong>Sin fondos:</strong> Tu presupuesto de fichajes es de 0€. Fichajes imposibles en este momento.
                    </div>
                  ) : null}

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Monto de la Oferta (€)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max={equipoUsuario.presupuestoFichajes}
                        value={ofertaValor}
                        onChange={(e) => setOfertaValor(Number(e.target.value))}
                        disabled={equipoUsuario.presupuestoFichajes <= 0}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2.5 px-4 text-sm font-semibold text-slate-100 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-mono"
                        required
                      />
                      <span className="absolute right-4 inset-y-0 flex items-center text-xs font-extrabold text-slate-500">€</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block leading-normal">
                      Consejo: El club rival podría aceptar ofertas por debajo de su valor si no es un jugador franquicia, pero los jugadores clave serán declarados intransferibles y exigirán montos muy superiores a su valor real.
                    </span>
                  </div>

                  {/* Campo de nueva cláusula de rescisión */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Nueva Cláusula de Rescisión (€) <span className="text-slate-400 font-normal">(Opcional)</span>Nueva Cláusula de Rescisión (€) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={clausulaOfrecidaCompra || ''}
                        onChange={(e) => setClausulaOfrecidaCompra(Number(e.target.value) || 0)}
                        placeholder="Sin cláusula"
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2.5 px-4 text-sm font-semibold text-slate-100 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-mono"
                      />
                      <span className="absolute right-4 inset-y-0 flex items-center text-xs font-extrabold text-slate-500">€</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block leading-normal">
                      Deja en blanco o ingresa 0 para no establecer una cláusula de rescisión.
                    </span>
                  </div>

                  <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-850">
                    <button
                      type="button"
                      onClick={() => setJugadorAOfrecer(null)}
                      className="px-4 py-2 bg-slate-950 border border-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white font-bold rounded-lg text-xs uppercase tracking-wider transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={ofertaValor <= 0 || ofertaValor > equipoUsuario.presupuestoFichajes}
                      className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg text-xs uppercase tracking-wider shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      Enviar Propuesta
                    </button>
                  </div>
                </form>
              )}

            </div>

          </div>
        </div>
      )}

      {/* ==========================================
          MODAL DE FICHAJE BOSMAN / CONTRATO LIBRE
          ========================================== */}
      {jugadorBosman && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col animate-fade-in my-8">

            {/* Header del modal */}
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex justify-between items-center border-t-4 border-t-purple-500">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Fichaje de Agente Libre (Bosman)</span>
                <h3 className="text-base font-extrabold text-white mt-1 tracking-tight">Negociar con {jugadorBosman.nombre}</h3>
              </div>
              <button
                onClick={() => setJugadorBosman(null)}
                className="text-slate-500 hover:text-white transition-colors text-sm"
              >
                ✕
              </button>
            </div>

            {/* Contenido / Oferta */}
            <div className="p-5 space-y-4">

              {/* Información de contrato actual y exigencia */}
              <div className="p-3 bg-slate-950 border border-purple-500/20 text-xs rounded-xl space-y-2">
                <p className="text-slate-300 leading-relaxed">
                  🗣️ <strong>Representante:</strong> "A mi cliente le quedan <strong>{jugadorBosman.mesesContrato} meses</strong> de contrato. Estamos dispuestos a acordar una de las primas salariales de incorporación gratuita el próximo 1 de Julio."
                </p>
                <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-[10px]">
                  <span className="text-slate-500">Salario Actual:</span>
                  <span className="text-slate-400 font-mono">{formatearMoneda(jugadorBosman.salarioSemanal)}/sem</span>
                </div>
              </div>

              {feedbackBosman ? (
                /* Card de Feedback */
                <div className={`p-4 rounded-xl border space-y-3 leading-relaxed text-xs ${feedbackBosman.aceptado
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}>
                  <div className="flex items-center gap-2">
                    <span className="text-base">{feedbackBosman.aceptado ? '🟢' : '🔴'}</span>
                    <strong className="uppercase font-bold tracking-wider text-[10px]">Respuesta de Negociación</strong>
                  </div>
                  <p>{feedbackBosman.mensaje}</p>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setJugadorBosman(null)}
                      className={`px-4 py-1.5 text-[10px] uppercase font-bold tracking-wider rounded-lg shadow-sm border transition-all ${feedbackBosman.aceptado
                        ? 'bg-emerald-600 border-emerald-500 text-slate-950 hover:bg-emerald-500'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                    >
                      Entendido
                    </button>
                  </div>
                </div>
              ) : (
                /* Formulario */
                <form onSubmit={enviarOfertaBosman} className="space-y-4">
                  {/* Campo de Sueldo Semanal Ofrecido */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Sueldo Semanal Ofrecido (€/semana) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        value={sueldoBosman || ''}
                        onChange={(e) => setSueldoBosman(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2.5 px-4 text-sm font-semibold text-slate-100 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-mono"
                        required
                      />
                      <span className="absolute right-4 inset-y-0 flex items-center text-xs font-extrabold text-slate-500 font-mono">€/sem</span>
                    </div>
                  </div>

                  {/* Campo de Cláusula de Rescisión */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Cláusula de Rescisión (€) <span className="text-slate-400 font-normal">(Opcional)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1000"
                        step="50000"
                        value={clausulaBosman || ''}
                        onChange={(e) => setClausulaBosman(Number(e.target.value) || 0)}
                        placeholder="Sin cláusula"
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2.5 px-4 text-sm font-semibold text-slate-100 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-mono"
                      />
                      <span className="absolute right-4 inset-y-0 flex items-center text-xs font-extrabold text-slate-500 font-mono">€</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block leading-normal">
                      Deja en blanco o ingresa 0 para no establecer una cláusula de rescisión.
                    </span>
                  </div>

                  <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-850">
                    <button
                      type="button"
                      onClick={() => setJugadorBosman(null)}
                      className="px-4 py-2 bg-slate-950 border border-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white font-bold rounded-lg text-xs uppercase tracking-wider transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={sueldoBosman <= 0}
                      className="px-5 py-2 bg-gradient-to-r from-purple-650 to-indigo-650 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-lg text-xs uppercase tracking-wider shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      Ofrecer Precontrato
                    </button>
                  </div>
                </form>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
