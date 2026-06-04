import React from 'react';
import { useGame } from '../context/useGame';

export const FeedHinchada: React.FC = () => {
  const { feedHinchada } = useGame();

  return (
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 shadow-lg backdrop-blur-md flex flex-col gap-4">
      {/* Feed Header */}
      <div className="flex items-center justify-between border-b border-slate-850 pb-3">
        <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
          💬 Red de la Hinchada
        </h3>
        <span className="text-[9px] bg-sky-500/10 border border-sky-500/30 text-sky-400 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
          En Vivo • Hilo Activo
        </span>
      </div>

      {/* Feed Tweets List */}
      <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
        {feedHinchada && feedHinchada.length > 0 ? (
          feedHinchada.map((tweet) => (
            <div 
              key={tweet.id} 
              className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-850/60 hover:bg-slate-950/60 hover:border-slate-800/80 transition-all duration-200 flex gap-3 text-left animate-fade-in group"
            >
              {/* Avatar Icon */}
              <div className={`w-9 h-9 rounded-full ${tweet.color} flex items-center justify-center text-lg shadow-md select-none transform transition-transform group-hover:scale-105`}>
                {tweet.avatar}
              </div>

              {/* Tweet Content */}
              <div className="flex-1 flex flex-col min-w-0">
                {/* User Info Header */}
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-extrabold text-xs text-slate-200 truncate leading-none">
                      {tweet.usuario}
                    </span>
                    <span className="text-[10px] text-slate-500 truncate leading-none font-mono">
                      {tweet.handle}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-500 leading-none whitespace-nowrap">
                    {tweet.tiempo}
                  </span>
                </div>

                {/* Tweet message body */}
                <p className="text-xs text-slate-350 leading-relaxed font-light mb-2 break-words">
                  {tweet.mensaje.split(' ').map((word, wIdx) => {
                    if (word.startsWith('#')) {
                      return (
                        <span key={wIdx} className="text-sky-400 font-bold hover:underline cursor-pointer mr-1">
                          {word}{' '}
                        </span>
                      );
                    }
                    return word + ' ';
                  })}
                </p>

                {/* Engagement Icons Row */}
                <div className="flex items-center gap-6 text-[10px] text-slate-500 font-bold border-t border-slate-900/60 pt-2">
                  <div className="flex items-center gap-1.5 hover:text-green-400 transition-colors cursor-pointer select-none">
                    <span className="text-xs leading-none">🔁</span>
                    <span className="leading-none">{tweet.retweets.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5 hover:text-rose-400 transition-colors cursor-pointer select-none">
                    <span className="text-xs leading-none">❤️</span>
                    <span className="leading-none">{tweet.likes.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5 hover:text-sky-400 transition-colors cursor-pointer select-none ml-auto">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-600 group-hover:text-sky-400/70 transition-colors">
                      Compartir
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-slate-500 italic select-none font-light text-xs">
            No hay comentarios recientes en la red.
          </div>
        )}
      </div>

      {/* Community Tip */}
      <div className="text-[9px] text-slate-500 leading-normal border-t border-slate-850 pt-3 text-center">
        💡 El feed refleja las repercusiones inmediatas de tus resultados tácticos y negociaciones de mercado.
      </div>
    </div>
  );
};
