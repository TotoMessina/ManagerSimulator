import React, { useState } from 'react';
import { useGame } from '../context/useGame';

const formatearEuros = (valor: number): string => {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(valor);
};

export const ClubView: React.FC = () => {
  const {
    equipoUsuario,
    jugadores,
    iniciarProyectoConstruccion
  } = useGame();

  const [notificacion, setNotificacion] = useState<{ exito: boolean; mensaje: string } | null>(null);

  if (!equipoUsuario) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-white flex items-center justify-center">
        <p className="text-slate-400">Seleccioná un club en el inicio para ver su información patrimonial.</p>
      </div>
    );
  }

  // --- FINANZAS ---
  const plantelUsuario = jugadores.filter(j => j.idEquipo === equipoUsuario.id);
  const egresosSueldosSemanal = plantelUsuario.reduce((sum, j) => sum + j.salarioSemanal, 0);
  const ingresosSponsorsSemanal = Math.round((equipoUsuario.reputacion * 150000) / 4);
  const balanceSemanal = ingresosSponsorsSemanal - egresosSueldosSemanal;

  // Proyecciones mensuales (4 semanas)
  const egresosSueldosMensual = egresosSueldosSemanal * 4;
  const ingresosSponsorsMensual = ingresosSponsorsSemanal * 4;
  const balanceMensual = balanceSemanal * 4;

  // --- NIVELES INFRAESTRUCTURA ---
  const nivelClinica = equipoUsuario.nivelInstalacionesMedicas || 1;
  const nivelAcademia = equipoUsuario.nivelAcademiaJuvenil || 1;
  const capacidad = equipoUsuario.capacidadEstadio;

  // Proyectos activos
  const proyectos = equipoUsuario.proyectosConstruccion || [];
  const proyEstadio = proyectos.find(p => p.tipo === 'estadio');
  const proyClinica = proyectos.find(p => p.tipo === 'clinica');
  const proyAcademia = proyectos.find(p => p.tipo === 'academia');

  // Costos de mejora
  const costoEstadio = 5000000;
  const costoClinica = 3000000 * nivelClinica;
  const costoAcademia = 4000000 * nivelAcademia;

  const handleMejorar = (tipo: 'estadio' | 'clinica' | 'academia') => {
    const res = iniciarProyectoConstruccion(tipo);
    setNotificacion({ exito: res.aceptado, mensaje: res.mensaje });
    setTimeout(() => {
      setNotificacion(null);
    }, 4000);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <span>🏛️</span> Finanzas e Infraestructura Patrimonial
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Gestioná el crecimiento a largo plazo del {equipoUsuario.nombre}. Ampliá tu estadio para recibir más hinchas, mejorá la clínica para reducir lesiones o invertí en la cantera para formar estrellas.
          </p>
        </div>

        {/* Presupuesto */}
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex items-center gap-4 shadow-md backdrop-blur-md">
          <div className="text-3xl">💰</div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Presupuesto de Fichajes</span>
            <div className="text-xl font-black text-teal-400 mt-0.5">{formatearEuros(equipoUsuario.presupuestoFichajes)}</div>
          </div>
        </div>
      </div>

      {/* Notificación flotante */}
      {notificacion && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-semibold animate-scale-in fixed bottom-4 right-4 z-50 shadow-2xl ${
          notificacion.exito 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          <span>{notificacion.exito ? '✅' : '⚠️'}</span>
          <span>{notificacion.mensaje}</span>
          <button onClick={() => setNotificacion(null)} className="ml-2 text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* ============================================================
            COLUMNA IZQUIERDA Y CENTRAL: MEJORAS DE INFRAESTRUCTURA (2/3)
            ============================================================ */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2 border-b border-slate-850 pb-2">
            🏗️ Plan de Obras y Ampliaciones
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            
            {/* TARJETA 1: ESTADIO */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 flex flex-col md:flex-row justify-between gap-6 shadow-lg backdrop-blur-md relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-indigo-500/5 to-transparent pointer-events-none" />
              
              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-4xl bg-slate-950 border border-slate-800 w-14 h-14 rounded-2xl flex items-center justify-center shadow-md">🏟️</span>
                  <div>
                    <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Instalación Principal</span>
                    <h3 className="text-lg font-bold text-white mt-0.5">{equipoUsuario.estadio}</h3>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-slate-950/30 border border-slate-850/60 p-4 rounded-xl text-xs">
                  <div>
                    <span className="text-slate-500 block">Capacidad Actual:</span>
                    <span className="font-bold text-slate-200 text-sm mt-0.5 block">{capacidad.toLocaleString()} espectadores</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Impacto de Mejora:</span>
                    <span className="font-bold text-emerald-400 text-sm mt-0.5 block">+5.000 cap. (+Recaudación local)</span>
                  </div>
                </div>

                {proyEstadio && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>🏗️ Ampliación en curso...</span>
                      <span className="font-mono">{proyEstadio.diasRestantes} días restantes ({Math.round(((proyEstadio.diasTotales - proyEstadio.diasRestantes) / proyEstadio.diasTotales) * 100)}%)</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-850">
                      <div 
                        style={{ width: `${((proyEstadio.diasTotales - proyEstadio.diasRestantes) / proyEstadio.diasTotales) * 100}%` }}
                        className="bg-gradient-to-r from-teal-500 to-indigo-500 h-full rounded-full"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-center items-stretch md:items-end w-full md:w-60 gap-3 border-t md:border-t-0 md:border-l border-slate-800/80 pt-4 md:pt-0 md:pl-6">
                <div className="text-left md:text-right">
                  <span className="text-[10px] text-slate-500 uppercase block">Costo de Ampliación</span>
                  <span className="text-lg font-extrabold text-slate-200 block mt-0.5">{formatearEuros(costoEstadio)}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Plazo de obra: 30 días</span>
                </div>

                <button
                  disabled={!!proyEstadio || equipoUsuario.presupuestoFichajes < costoEstadio}
                  onClick={() => handleMejorar('estadio')}
                  className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md ${
                    proyEstadio
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      : equipoUsuario.presupuestoFichajes < costoEstadio
                        ? 'bg-slate-900 text-slate-500 cursor-not-allowed border border-slate-800'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:shadow-lg hover:shadow-indigo-900/20 active:scale-[0.98]'
                  }`}
                >
                  {proyEstadio ? '🚧 Obra en Progreso' : '🏗️ Ampliar Estadio'}
                </button>
              </div>
            </div>

            {/* TARJETA 2: CLÍNICA MÉDICA */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 flex flex-col md:flex-row justify-between gap-6 shadow-lg backdrop-blur-md relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-rose-500/5 to-transparent pointer-events-none" />

              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-4xl bg-slate-950 border border-slate-800 w-14 h-14 rounded-2xl flex items-center justify-center shadow-md">🏥</span>
                  <div>
                    <span className="text-[10px] font-black uppercase text-rose-400 tracking-wider">Instalación Médica y Recuperación</span>
                    <h3 className="text-lg font-bold text-white mt-0.5">Clínica Médica</h3>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-slate-950/30 border border-slate-850/60 p-4 rounded-xl text-xs">
                  <div>
                    <span className="text-slate-500 block">Nivel Médico:</span>
                    <span className="font-bold text-slate-200 text-sm mt-0.5 block flex items-center gap-1.5">
                      <span>Nivel {nivelClinica} / 5</span>
                      <span className="flex gap-0.5">
                        {Array.from({ length: 5 }, (_, i) => (
                          <span key={i} className={`text-[8px] ${i < nivelClinica ? 'text-rose-400' : 'text-slate-700'}`}>❤️</span>
                        ))}
                      </span>
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Efecto Deportivo:</span>
                    <span className="font-bold text-emerald-400 text-sm mt-0.5 block">
                      {nivelClinica > 1 
                        ? `-${(nivelClinica - 1) * 15}% en semanas de baja` 
                        : 'Recuperación estándar (Nivel base)'}
                    </span>
                  </div>
                </div>

                {proyClinica && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>🏗️ Modernizando equipamiento...</span>
                      <span className="font-mono">{proyClinica.diasRestantes} días restantes ({Math.round(((proyClinica.diasTotales - proyClinica.diasRestantes) / proyClinica.diasTotales) * 100)}%)</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-850">
                      <div 
                        style={{ width: `${((proyClinica.diasTotales - proyClinica.diasRestantes) / proyClinica.diasTotales) * 100}%` }}
                        className="bg-gradient-to-r from-teal-500 to-rose-500 h-full rounded-full"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-center items-stretch md:items-end w-full md:w-60 gap-3 border-t md:border-t-0 md:border-l border-slate-800/80 pt-4 md:pt-0 md:pl-6">
                {nivelClinica < 5 ? (
                  <>
                    <div className="text-left md:text-right">
                      <span className="text-[10px] text-slate-500 uppercase block">Costo de Nivel {nivelClinica + 1}</span>
                      <span className="text-lg font-extrabold text-slate-200 block mt-0.5">{formatearEuros(costoClinica)}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Plazo de obra: 30 días</span>
                    </div>

                    <button
                      disabled={!!proyClinica || equipoUsuario.presupuestoFichajes < costoClinica}
                      onClick={() => handleMejorar('clinica')}
                      className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md ${
                        proyClinica
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                          : equipoUsuario.presupuestoFichajes < costoClinica
                            ? 'bg-slate-900 text-slate-500 cursor-not-allowed border border-slate-800'
                            : 'bg-rose-650 hover:bg-rose-550 text-white hover:shadow-lg hover:shadow-rose-900/20 active:scale-[0.98]'
                      }`}
                    >
                      {proyClinica ? '🚧 Obra en Progreso' : '🏥 Mejorar Clínica'}
                    </button>
                  </>
                ) : (
                  <div className="text-center w-full bg-rose-500/10 border border-rose-500/25 p-4 rounded-2xl">
                    <span className="text-xl block mb-1">⭐</span>
                    <span className="text-xs font-bold text-rose-300 uppercase tracking-wider block">Clínica al Máximo</span>
                    <span className="text-[9px] text-slate-400 block mt-1">Eficiencia de recuperación en +60%</span>
                  </div>
                )}
              </div>
            </div>

            {/* TARJETA 3: ACADEMIA JUVENIL */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 flex flex-col md:flex-row justify-between gap-6 shadow-lg backdrop-blur-md relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-emerald-500/5 to-transparent pointer-events-none" />

              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-4xl bg-slate-950 border border-slate-800 w-14 h-14 rounded-2xl flex items-center justify-center shadow-md">🎓</span>
                  <div>
                    <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">Semillero y Divisiones Inferiores</span>
                    <h3 className="text-lg font-bold text-white mt-0.5">Academia de Cantera</h3>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-slate-950/30 border border-slate-850/60 p-4 rounded-xl text-xs">
                  <div>
                    <span className="text-slate-500 block">Nivel de Cantera:</span>
                    <span className="font-bold text-slate-200 text-sm mt-0.5 block flex items-center gap-1.5">
                      <span>Nivel {nivelAcademia} / 5</span>
                      <span className="flex gap-0.5">
                        {Array.from({ length: 5 }, (_, i) => (
                          <span key={i} className={`text-[8px] ${i < nivelAcademia ? 'text-emerald-400' : 'text-slate-700'}`}>⭐</span>
                        ))}
                      </span>
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Chance de Newgens Top:</span>
                    <span className="font-bold text-emerald-400 text-sm mt-0.5 block">
                      {nivelAcademia === 1 ? '5% probabilidad (Básico)' :
                       nivelAcademia === 2 ? '12% probabilidad (Intermedio)' :
                       nivelAcademia === 3 ? '20% probabilidad (Bueno)' :
                       nivelAcademia === 4 ? '35% probabilidad (Excelente)' :
                       '55% de Joya de la Cantera (Elite)'}
                    </span>
                  </div>
                </div>

                {proyAcademia && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>🏗️ Expandiendo red de scouting juvenil...</span>
                      <span className="font-mono">{proyAcademia.diasRestantes} días restantes ({Math.round(((proyAcademia.diasTotales - proyAcademia.diasRestantes) / proyAcademia.diasTotales) * 100)}%)</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-850">
                      <div 
                        style={{ width: `${((proyAcademia.diasTotales - proyAcademia.diasRestantes) / proyAcademia.diasTotales) * 100}%` }}
                        className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full rounded-full"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-center items-stretch md:items-end w-full md:w-60 gap-3 border-t md:border-t-0 md:border-l border-slate-800/80 pt-4 md:pt-0 md:pl-6">
                {nivelAcademia < 5 ? (
                  <>
                    <div className="text-left md:text-right">
                      <span className="text-[10px] text-slate-500 uppercase block">Costo de Nivel {nivelAcademia + 1}</span>
                      <span className="text-lg font-extrabold text-slate-200 block mt-0.5">{formatearEuros(costoAcademia)}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Plazo de obra: 30 días</span>
                    </div>

                    <button
                      disabled={!!proyAcademia || equipoUsuario.presupuestoFichajes < costoAcademia}
                      onClick={() => handleMejorar('academia')}
                      className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md ${
                        proyAcademia
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                          : equipoUsuario.presupuestoFichajes < costoAcademia
                            ? 'bg-slate-900 text-slate-500 cursor-not-allowed border border-slate-800'
                            : 'bg-emerald-650 hover:bg-emerald-550 text-white hover:shadow-lg hover:shadow-emerald-900/20 active:scale-[0.98]'
                      }`}
                    >
                      {proyAcademia ? '🚧 Obra en Progreso' : '🎓 Invertir en Cantera'}
                    </button>
                  </>
                ) : (
                  <div className="text-center w-full bg-emerald-500/10 border border-emerald-500/25 p-4 rounded-2xl">
                    <span className="text-xl block mb-1">🌟</span>
                    <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider block">Academia de Élite</span>
                    <span className="text-[9px] text-slate-400 block mt-1">55% chance de Newgen top (PA &gt; 85)</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* ============================================================
            COLUMNA DERECHA: ESTADO FINANCIERO Y BALANCE DE CAJA (1/3)
            ============================================================ */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2 border-b border-slate-850 pb-2">
            📊 Balance de Caja Semanal
          </h2>

          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 space-y-6 shadow-lg backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-emerald-500" />
            
            {/* Resumen Balance */}
            <div className="text-center py-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Resultado Operativo Neto</span>
              <div className={`text-2xl font-black mt-1 ${balanceSemanal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {balanceSemanal >= 0 ? '+' : ''}{formatearEuros(balanceSemanal)}
                <span className="text-xs text-slate-500 font-normal"> /semana</span>
              </div>
            </div>

            {/* Partidas de Ingreso y Gasto */}
            <div className="space-y-3.5 border-t border-b border-slate-850 py-4 text-xs">
              
              {/* Ingresos */}
              <div className="space-y-2">
                <span className="text-[9px] font-black uppercase text-emerald-400 tracking-wider">Ingresos Fijos</span>
                <div className="flex justify-between items-center text-slate-300">
                  <span className="flex items-center gap-1.5">📢 Sponsor Comercial</span>
                  <span className="font-bold text-slate-100">+{formatearEuros(ingresosSponsorsSemanal)}</span>
                </div>
              </div>

              {/* Egresos */}
              <div className="space-y-2 pt-2 border-t border-slate-850/60">
                <span className="text-[9px] font-black uppercase text-rose-400 tracking-wider">Egresos de Plantel</span>
                <div className="flex justify-between items-center text-slate-300">
                  <span className="flex items-center gap-1.5">🏃‍♂️ Sueldos de {plantelUsuario.length} Jugadores</span>
                  <span className="font-bold text-slate-100">-{formatearEuros(egresosSueldosSemanal)}</span>
                </div>
              </div>
            </div>

            {/* Proyección Mensual */}
            <div className="space-y-3 bg-slate-950/40 p-4 rounded-xl border border-slate-850/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Proyección Mensual (4 sem.)</span>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Sponsors Totales:</span>
                  <span className="text-slate-200 font-semibold">+{formatearEuros(ingresosSponsorsMensual)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Sueldos Totales:</span>
                  <span className="text-slate-200 font-semibold">-{formatearEuros(egresosSueldosMensual)}</span>
                </div>
                
                <div className="flex justify-between items-center border-t border-slate-800 pt-2 font-bold mt-1 text-xs">
                  <span className="text-slate-300">Balance Proyectado:</span>
                  <span className={balanceMensual >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {balanceMensual >= 0 ? '+' : ''}{formatearEuros(balanceMensual)}
                  </span>
                </div>
              </div>
            </div>

            {/* Consejo Directiva */}
            <div className="text-[11px] text-slate-400 leading-relaxed bg-slate-950/20 p-3.5 rounded-xl border border-slate-800/40 italic">
              📌 <strong>Consejo del Director Financiero:</strong> Los sponsors semanales aumentan directamente al mejorar la **reputación** del club en la tabla. Además, la recaudación de taquilla por partidos locales (que no figura aquí pues varía por partido) aumenta si amplias la **capacidad del estadio** y mantienes un buen aforo.
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
