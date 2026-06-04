import React, { useState } from 'react';
import { useGame } from '../context/useGame';

// ============================================================
// OFICINA DEL MÁNAGER VIEW
// Sistema de reuniones privadas con jugadores conflictivos
// ============================================================

const POSICION_NOMBRES: Record<string, string> = {
  POR: 'Portero', DFC: 'Defensa Central', LD: 'Lateral Derecho',
  LI: 'Lateral Izquierdo', MC: 'Mediocampista Central', MCO: 'Mediocampista Ofensivo',
  ED: 'Extremo Derecho', EI: 'Extremo Izquierdo', DC: 'Delantero Centro'
};

const PERSONALIDAD_COLORES: Record<string, string> = {
  'Líder':       'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  'Ambicioso':   'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'Profesional': 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  'Problemático':'bg-red-500/20 text-red-300 border-red-500/30',
  'Leal':        'bg-blue-500/20 text-blue-300 border-blue-500/30',
};

const PERSONALIDAD_ICONOS: Record<string, string> = {
  'Líder': '👑', 'Ambicioso': '🔥', 'Profesional': '💼', 'Problemático': '⚡', 'Leal': '🛡️'
};

export const OficinaManagerView: React.FC = () => {
  const { reunionPrivadaActiva, resolverReunionPrivada, nombreManager, reputacionManager } = useGame();
  const [decisionSeleccionada, setDecisionSeleccionada] = useState<'promesa' | 'autoritario' | 'salida' | null>(null);
  const [mostrarConfirm, setMostrarConfirm] = useState(false);
  const [mostrandoResultado, setMostrandoResultado] = useState(false);

  if (!reunionPrivadaActiva) return null;

  const { jugadorNombre, posicion, edad, personalidad, moral, tienePromesaIncumplida, mensajeProblema, tipoProblem } = reunionPrivadaActiva;

  const moralColor = moral < 15 ? 'text-red-400' : moral < 30 ? 'text-orange-400' : 'text-yellow-400';
  const moralBgColor = moral < 15 ? 'bg-red-500' : moral < 30 ? 'bg-orange-500' : 'bg-yellow-500';

  const handleSeleccion = (decision: 'promesa' | 'autoritario' | 'salida') => {
    setDecisionSeleccionada(decision);
    setMostrarConfirm(true);
  };

  const handleConfirmar = () => {
    if (!decisionSeleccionada) return;
    setMostrandoResultado(true);
    setTimeout(() => {
      resolverReunionPrivada(decisionSeleccionada);
    }, 1800);
  };

  const handleCancelar = () => {
    setDecisionSeleccionada(null);
    setMostrarConfirm(false);
  };

  // Info de cada opción
  const opciones = [
    {
      id: 'promesa' as const,
      icono: '🤝',
      titulo: 'Opción A — La Promesa',
      subtitulo: '"Te juro que vas a ser titular el próximo partido."',
      descripcion: 'Su moral sube +20 temporalmente. Pero si no juega en el próximo partido, su moral cae a 0 y contagia a sus amigos del vestuario con un -10% de moral.',
      colorBorde: 'border-yellow-500/60',
      colorHover: 'hover:border-yellow-400',
      colorBg: 'hover:bg-yellow-500/10',
      colorTexto: 'text-yellow-300',
      colorBadge: 'bg-yellow-500/20 text-yellow-300',
      riesgo: '⚠️ Alto riesgo — Debes cumplirla'
    },
    {
      id: 'autoritario' as const,
      icono: '💪',
      titulo: 'Opción B — Posición Firme',
      subtitulo: '"El equipo está ganando y nadie es indispensable. Rendí en los entrenamientos."',
      descripcion: 'Su moral baja -15. Si tu reputación supera 70, puede subir su Determinación +2 al ver tu firmeza como señal de liderazgo.',
      colorBorde: 'border-red-500/60',
      colorHover: 'hover:border-red-400',
      colorBg: 'hover:bg-red-500/10',
      colorTexto: 'text-red-300',
      colorBadge: 'bg-red-500/20 text-red-300',
      riesgo: reputacionManager >= 70 ? '✨ Bonus: +2 Determinación (reputación alta)' : '📉 Moral -15 sin bonus (reputación < 70)'
    },
    {
      id: 'salida' as const,
      icono: '📤',
      titulo: 'Opción C — Facilitar su Salida',
      subtitulo: '"Si no estás cómodo aquí, podemos buscar una solución."',
      descripcion: 'El jugador queda en lista de transferibles. Su moral sube levemente +5 al tener claridad. Los clubes de la IA podrán ofertar por él.',
      colorBorde: 'border-blue-500/60',
      colorHover: 'hover:border-blue-400',
      colorBg: 'hover:bg-blue-500/10',
      colorTexto: 'text-blue-300',
      colorBadge: 'bg-blue-500/20 text-blue-300',
      riesgo: '💼 Neutral — Confirma su salida futura'
    }
  ];

  const opcionSeleccionada = opciones.find(o => o.id === decisionSeleccionada);

  if (mostrandoResultado) {
    return (
      <div className="min-h-screen bg-[#060b14] flex items-center justify-center p-6 relative overflow-hidden">
        {/* Fondo atmosférico */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-[#060b14] to-[#060b14]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-teal-500/5 blur-[120px]" />

        <div className="z-10 text-center max-w-md animate-pulse">
          <div className="text-6xl mb-6">
            {decisionSeleccionada === 'promesa' ? '🤝' : decisionSeleccionada === 'autoritario' ? '💪' : '📤'}
          </div>
          <p className="text-slate-400 text-sm">Procesando decisión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060b14] text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* === FONDO ATMOSFÉRICO TIPO SALA OSCURA === */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-[#060b14] to-[#060b14]" />
      {/* Rayo de luz desde arriba (spotlight effect) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[500px] bg-gradient-to-b from-amber-300/8 via-amber-500/4 to-transparent blur-[60px]" />
      <div className="absolute bottom-0 left-[-20%] w-[500px] h-[400px] rounded-full bg-slate-800/20 blur-[100px]" />
      <div className="absolute top-1/4 right-[-10%] w-[300px] h-[300px] rounded-full bg-red-900/10 blur-[80px]" />

      <div className="z-10 w-full max-w-2xl flex flex-col gap-6">

        {/* === HEADER === */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-3 text-xs font-semibold uppercase tracking-widest">
            🚪 Oficina del Mánager
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-100">
            Reunión Privada
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            {tienePromesaIncumplida
              ? 'Un jugador reclama una promesa incumplida'
              : 'Un jugador necesita hablar con vos urgente'}
          </p>
        </div>

        {/* === TARJETA DEL JUGADOR === */}
        <div className="bg-slate-900/70 border border-slate-700/60 rounded-2xl p-5 backdrop-blur-md shadow-xl relative overflow-hidden">
          {/* Borde izquierdo de alerta */}
          <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${tienePromesaIncumplida ? 'bg-orange-500' : 'bg-red-500'}`} />

          <div className="flex items-start gap-4 pl-3">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600/50 flex items-center justify-center text-2xl shadow-inner">
                {PERSONALIDAD_ICONOS[personalidad] || '⚽'}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h2 className="text-lg font-bold text-slate-100 truncate">{jugadorNombre}</h2>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${PERSONALIDAD_COLORES[personalidad]}`}>
                  {personalidad}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                <span>{POSICION_NOMBRES[posicion] || posicion}</span>
                <span>•</span>
                <span>{edad} años</span>
                {tienePromesaIncumplida && (
                  <>
                    <span>•</span>
                    <span className="text-orange-400 font-semibold">⚠️ Promesa Incumplida</span>
                  </>
                )}
              </div>

              {/* Barra de moral */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Moral actual</span>
                  <span className={`text-xs font-bold ${moralColor}`}>{moral}/100</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${moralBgColor}`}
                    style={{ width: `${moral}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* === CUADRO DE DIÁLOGO DEL JUGADOR === */}
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5 backdrop-blur-md relative">
          {/* Indicador de quién habla */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs">
              {PERSONALIDAD_ICONOS[personalidad]}
            </div>
            <span className="text-xs text-slate-400 font-semibold">{jugadorNombre} dice:</span>
          </div>

          {/* Mensaje del jugador */}
          <blockquote className="text-slate-200 text-sm leading-relaxed italic pl-3 border-l-2 border-slate-600">
            "{mensajeProblema}"
          </blockquote>
        </div>

        {/* === TU TURNO — OPCIONES DE RESPUESTA === */}
        {!mostrarConfirm ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-full bg-teal-600/80 border border-teal-500 flex items-center justify-center text-xs">
                👔
              </div>
              <span className="text-xs text-teal-400 font-semibold">Tu respuesta, {nombreManager}:</span>
            </div>

            {opciones.map((op) => (
              <button
                key={op.id}
                onClick={() => handleSeleccion(op.id)}
                className={`w-full text-left p-4 rounded-xl border bg-slate-900/40 backdrop-blur-sm transition-all duration-200 group
                  ${op.colorBorde} ${op.colorHover} ${op.colorBg}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl mt-0.5 flex-shrink-0">{op.icono}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold mb-0.5 ${op.colorTexto}`}>{op.titulo}</p>
                    <p className="text-xs text-slate-400 italic mb-2 leading-snug">{op.subtitulo}</p>
                    <p className="text-xs text-slate-500 leading-relaxed mb-2">{op.descripcion}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${op.colorBadge} border-current`}>
                      {op.riesgo}
                    </span>
                  </div>
                  <span className={`text-slate-600 group-hover:text-slate-400 transition-colors text-lg mt-0.5 flex-shrink-0`}>→</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          /* === PANTALLA DE CONFIRMACIÓN === */
          <div className="bg-slate-900/70 border border-slate-700/60 rounded-2xl p-5 backdrop-blur-md">
            <h3 className="text-sm font-bold text-slate-200 mb-2">Confirmación de Decisión</h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Vas a elegir <strong className={opcionSeleccionada?.colorTexto}>{opcionSeleccionada?.titulo}</strong>. Esta acción tendrá consecuencias sobre el estado de {jugadorNombre} y posiblemente el vestuario.
            </p>

            {opcionSeleccionada && (
              <div className={`rounded-xl p-3 border mb-4 ${opcionSeleccionada.colorBg.replace('hover:', '')} ${opcionSeleccionada.colorBorde}`}>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <span className="text-lg mr-2">{opcionSeleccionada.icono}</span>
                  {opcionSeleccionada.descripcion}
                </p>
                <p className={`text-[10px] mt-2 font-semibold ${opcionSeleccionada.colorTexto}`}>
                  {opcionSeleccionada.riesgo}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleCancelar}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 hover:border-slate-600 transition-all"
              >
                ← Volver
              </button>
              <button
                onClick={handleConfirmar}
                className={`flex-1 py-2.5 rounded-xl text-white text-xs font-bold transition-all duration-200 shadow-lg
                  ${decisionSeleccionada === 'promesa' ? 'bg-yellow-600 hover:bg-yellow-500 shadow-yellow-900/30' :
                    decisionSeleccionada === 'autoritario' ? 'bg-red-700 hover:bg-red-600 shadow-red-900/30' :
                    'bg-blue-700 hover:bg-blue-600 shadow-blue-900/30'}`}
              >
                Confirmar Decisión ✓
              </button>
            </div>
          </div>
        )}

        {/* === PIE DE PÁGINA — INFO DEL MANAGER === */}
        <div className="flex items-center justify-between text-[10px] text-slate-600 pt-1">
          <span>👔 {nombreManager}</span>
          <span>Reputación: <strong className="text-slate-500">{reputacionManager}/100</strong></span>
          {reputacionManager >= 70 && (
            <span className="text-teal-600 font-semibold">⭐ Reputación Alta activa</span>
          )}
        </div>
      </div>
    </div>
  );
};
