import React, { createContext, useContext, useEffect, useState } from 'react';
import { GraphQLReplicator, createDb } from '../db/initializeDb';

const DbContext = createContext(null);

export const useDb = () => useContext(DbContext);

export const DbProvider = ({ children }) => {
  const [db, setDb] = useState(null);
  const [isReplicating, setIsReplicating] = useState(true);

  useEffect(() => {
      const initDb = async () => {
        const db = await createDb();
        const replicator = new GraphQLReplicator(db);
        await replicator.restart();
        setDb(db);
        setIsReplicating(false);
      }

      initDb();
  }, []); // Dependencias vacías para que se ejecute solo en el montaje

  if (isReplicating) {
    return <div>Replicando base de datos...</div>;
  }

  return <DbContext.Provider value={db}>{children}</DbContext.Provider>;
};
