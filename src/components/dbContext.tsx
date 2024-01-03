import React, { createContext, useContext, useEffect, useState } from 'react';
import { GraphQLReplicator, createDb } from '../db/initializeDb';

interface IDbContext {
  // Define el tipo de tu base de datos aquí si es necesario.
}

const DbContext = createContext<IDbContext | null>(null);

export const useDb = () => useContext(DbContext);

export const DbProvider = ({ children }: { children: React.ReactNode }) => {
  const [db, setDb] = useState<IDbContext | null>(null);
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);

  const updateNetworkStatus = () => {
    console.log('Estado de la red actualizado:', window.navigator.onLine);
    setIsOnline(window.navigator.onLine);
  };

  // Eventos para manejar el cambio en el estado de la red.
  useEffect(() => {
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
    };
  }, []);

  // Inicialización de la base de datos.
  useEffect(() => {
    const initDb = async () => {
      try {
        const rxdb: IDbContext = await createDb(); // Asegúrate de que el tipo retornado por createDb() sea IDbContext.
        setDb(rxdb);
        console.log('Base de datos inicializada');
      } catch (error) {
        console.error('Error al inicializar la base de datos:', error);
      }
    };

    if (!db) {
      initDb();
    }
  }, [db]);

  // Sincronización cuando hay conexión.
  useEffect(() => {
    const startReplication = async () => {
      if (db && isOnline) {
        try {
          const replicator = new GraphQLReplicator(db);
          await replicator.restart();
          console.log('Sincronización iniciada');
        } catch (error) {
          console.error('Error al iniciar la sincronización:', error);
        }
      }
    };

    startReplication();
  }, [isOnline, db]);

  if (!db) {
    return <div>Cargando base de datos...</div>;
  }

  return <DbContext.Provider value={db}>{children}</DbContext.Provider>;
};
