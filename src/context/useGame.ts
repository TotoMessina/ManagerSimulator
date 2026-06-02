// Hook useGame separado del GameProvider para compatibilidad con Vite HMR.
// Vite requiere que los archivos solo exporten componentes O no-componentes,
// no una mezcla de ambos. Al tener useGame en un archivo separado, HMR puede
// hacer Fast Refresh de ambos archivos correctamente.
import { useContext } from 'react';
import { GameContext, GameContextProps } from './GameContext';

export const useGame = (): GameContextProps => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame debe ser utilizado dentro de un GameProvider');
  }
  return context;
};
