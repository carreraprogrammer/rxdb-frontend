import React, { createContext, useContext, useEffect, useState } from 'react';
import { GraphQLReplicator, createDb } from '../db/initializeDb';

const DbContext = createContext(null);

export const useDb = () => useContext(DbContext);

export const DbProvider = ({ children }) => {
  const [db, setDb] = useState(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  useEffect(() => {
    const initDb = async () => {
      const db = await createDb();
      // Sólo inicia la replicación si es la primera carga
      if (isFirstLoad) {
        const replicator = new GraphQLReplicator(db);
        await replicator.restart();
        setIsFirstLoad(false); // Actualiza el estado después de la replicación
      }
      setDb(db);
    };

    initDb();
  }, [isFirstLoad]); // Dependencia: ejecuta el efecto si isFirstLoad cambia

  if (!db) {
    return <div>Replicando base de datos...</div>;
  }

  return <DbContext.Provider value={db}>{children}</DbContext.Provider>;
};
