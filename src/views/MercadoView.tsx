import React, { useState, useMemo } from 'react';
import { useGame } from '../context/useGame';
import { Jugador } from '../types';
import { CriterioOrden, DireccionOrden, ordenarJugadores } from '../utils/sorting';

// Formateador de dinero
const formatearMoneda = (valor: number): string => {
  if (valor >= 1000000) {
    return `${(valor / 1000000).toFixed(1)} M€`;
  }
  return `${(valor / 1000).toFixed(0)} m€`;
};

export const MercadoView: React.FC = () => {
  const { jugadores, equipos, equipoUsuario, comprarJugador } = useGame();

  // Estados de filtros y ordenación
  const [busqueda, setBusqueda] = useState<string>('');
  const [filtroPosicion, setFiltroPosicion] = useState<string>('TODOS');
  const [criterioOrden, setCriterioOrden] = useState<CriterioOrden>('ca');
  const [direccionOrden, setDireccionOrden] = useState<DireccionOrden>('DESC');

  // Estado del modal de negociación
  const [jugadorAOfrecer, setJugadorAOfrecer] = useState<Jugador | null>(null);
  const [ofertaValor, setOfertaValor] = useState<number>(0);
  const [feedbackNegociacion, setFeedbackNegociacion] = useState<{
    aceptado: boolean;
    mensaje: string;
  } | null>(null);

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
    setFeedbackNegociacion(null);
  };

  // Ejecutar negociación de oferta
  const enviarOferta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jugadorAOfrecer) return;

    const res = comprarJugador(jugadorAOfrecer.id, ofertaValor);
    setFeedbackNegociacion(res);
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
              className={`px-4 py-2 rounded-xl text-[10px] uppercase font-extrabold tracking-wider border transition-all duration-150 ${
                filtroPosicion === pos
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
                  <th className="px-4 py-3.5 text-center w-32">Operaciones</th>
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
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded tracking-wide ${
                          jugador.posicion === 'POR' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
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

                      {/* Botón de Fichaje */}
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => abrirModalOferta(jugador)}
                          className="px-4 py-1.5 bg-slate-800 hover:bg-teal-600 border border-slate-700 text-teal-400 hover:text-white font-bold rounded-lg transition-all text-[10px] uppercase tracking-wide"
                        >
                          Ofertar
                        </button>
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
                <div className={`p-4 rounded-xl border space-y-3 leading-relaxed text-xs ${
                  feedbackNegociacion.aceptado
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
                      className={`px-4 py-1.5 text-[10px] uppercase font-bold tracking-wider rounded-lg shadow-sm border transition-all ${
                        feedbackNegociacion.aceptado
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

    </div>
  );
};
