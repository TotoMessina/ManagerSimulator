import React, { useState } from 'react';
import { EventoVestuario } from '../types';
import { useGame } from '../context/useGame';

// Mapa de colores por tipo de evento
const TIPO_CONFIG: Record<string, { color: string; bg: string; border: string; glow: string; etiqueta: string; icono: string }> = {
  indisciplina:          { color: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/30',    glow: 'shadow-rose-900/40',   etiqueta: 'Indisciplina',        icono: '🍹' },
  presion_familiar:      { color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   glow: 'shadow-amber-900/40',   etiqueta: 'Presión Familiar',    icono: '👨‍👩‍👦' },
  conflicto_interno:     { color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/30',  glow: 'shadow-orange-900/40',  etiqueta: 'Conflicto Interno',   icono: '⚡' },
  peticion_salarial:     { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', glow: 'shadow-emerald-900/40', etiqueta: 'Petición Salarial',   icono: '💶' },
  critica_publica:       { color: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/30',  glow: 'shadow-purple-900/40',  etiqueta: 'Crítica en Prensa',   icono: '📰' },
  lesion_entrenamiento:  { color: 'text-sky-400',     bg: 'bg-sky-500/10',     border: 'border-sky-500/30',     glow: 'shadow-sky-900/40',     etiqueta: 'Alerta Médica',       icono: '🏥' },
  reclamo_capitania:     { color: 'text-yellow-400',  bg: 'bg-yellow-500/10',  border: 'border-yellow-500/30',  glow: 'shadow-yellow-900/40',  etiqueta: 'Disputa de Liderazgo', icono: '🏆' },
};

interface Props {
  evento: EventoVestuario;
}

export const EventoVestuarioModal: React.FC<Props> = ({ evento }) => {
  const { resolverEvento } = useGame();
  const [opcionSeleccionada, setOpcionSeleccionada] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);

  const cfg = TIPO_CONFIG[evento.tipo] ?? {
    color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/30',
    glow: 'shadow-teal-900/40', etiqueta: 'Evento', icono: '🎲'
  };

  const handleSeleccionar = (opcionId: string) => {
    setOpcionSeleccionada(opcionId);
    setConfirmando(true);
  };

  const handleConfirmar = () => {
    if (opcionSeleccionada) {
      resolverEvento(opcionSeleccionada);
    }
  };

  const handleCancelarConfirm = () => {
    setOpcionSeleccionada(null);
    setConfirmando(false);
  };

  const opcionElegida = evento.opciones.find(o => o.id === opcionSeleccionada);

  return (
    // Backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      {/* Modal container */}
      <div
        className={`relative w-full max-w-2xl bg-[#0d1220] rounded-2xl border ${cfg.border} shadow-2xl ${cfg.glow} overflow-hidden`}
        style={{ animation: 'slideUpModal 0.35s cubic-bezier(0.16,1,0.3,1) both' }}
      >
        {/* Decorative glow top bar */}
        <div className={`h-1 w-full ${cfg.bg} relative overflow-hidden`}>
          <div className={`absolute inset-0 ${cfg.color} opacity-60`} style={{ background: 'linear-gradient(90deg, transparent, currentColor, transparent)', animation: 'shimmer 2s infinite' }} />
        </div>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-start gap-4">
          <div className={`flex-shrink-0 w-14 h-14 rounded-2xl ${cfg.bg} ${cfg.border} border flex items-center justify-center text-3xl`}>
            {cfg.icono}
          </div>
          <div className="flex-1 min-w-0">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.border} border ${cfg.color} text-[10px] font-bold uppercase tracking-widest mb-2`}>
              🎲 Evento Aleatorio — {cfg.etiqueta}
            </div>
            <h2 className="text-xl font-extrabold text-white leading-tight tracking-tight">
              {evento.titulo}
            </h2>
            {evento.jugadorNombre && (
              <p className={`text-xs font-semibold mt-1 ${cfg.color}`}>
                Protagonista: {evento.jugadorNombre}
              </p>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="mx-6 h-px bg-slate-800" />

        {/* Situación */}
        <div className="px-6 py-4">
          <div className={`rounded-xl ${cfg.bg} border ${cfg.border} p-4`}>
            <p className="text-sm text-slate-300 leading-relaxed">
              {evento.descripcion}
            </p>
          </div>
        </div>

        {/* Opciones o Confirmación */}
        {!confirmando ? (
          <div className="px-6 pb-6 space-y-3">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">
              ¿Cuál es tu decisión?
            </p>
            {evento.opciones.map((opcion) => (
              <button
                key={opcion.id}
                onClick={() => handleSeleccionar(opcion.id)}
                className="w-full group flex items-start gap-4 p-4 rounded-xl border border-slate-700/60 bg-slate-800/40 hover:bg-slate-700/50 hover:border-slate-600 transition-all duration-200 text-left cursor-pointer"
              >
                {/* Icon */}
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-slate-700/60 flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-200">
                  {opcion.icono}
                </div>
                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-100 group-hover:text-white transition-colors">
                    {opcion.texto}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {opcion.descripcionEfecto}
                  </p>
                </div>
                {/* Arrow */}
                <div className="flex-shrink-0 self-center text-slate-600 group-hover:text-slate-400 group-hover:translate-x-1 transition-all duration-200">
                  →
                </div>
              </button>
            ))}
          </div>
        ) : (
          /* Confirmación */
          <div className="px-6 pb-6">
            <div className={`rounded-xl ${cfg.bg} border ${cfg.border} p-5 mb-4`}>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-3">
                Confirmá tu decisión
              </p>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{opcionElegida?.icono}</span>
                <p className="text-base font-bold text-white">
                  "{opcionElegida?.texto}"
                </p>
              </div>
              <div className="rounded-lg bg-black/30 px-3 py-2 border border-slate-700/50">
                <p className="text-xs text-slate-300 leading-relaxed">
                  ⚠️ {opcionElegida?.descripcionEfecto}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCancelarConfirm}
                className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:text-white hover:border-slate-500 text-sm font-semibold transition-all duration-200"
              >
                ← Volver a elegir
              </button>
              <button
                onClick={handleConfirmar}
                className={`flex-1 py-2.5 rounded-xl ${cfg.bg} border ${cfg.border} ${cfg.color} hover:brightness-125 text-sm font-bold transition-all duration-200 shadow-lg`}
              >
                ✅ Confirmar decisión
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideUpModal {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease both; }
      `}</style>
    </div>
  );
};
