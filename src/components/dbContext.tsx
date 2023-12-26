import React, { createContext, useContext, useEffect, useState } from 'react';
import {GraphQLReplicator, createDb } from '../db/initializeDb';

const DbContext = createContext(null);

export const useDb = () => useContext(DbContext);

export const DbProvider = ({ children }) => {
  const [db, setDb] = useState(null);
  const [replicator, setReplicator] = useState(false);

  useEffect(() => {
      const initDb = async () => {
        const db = await createDb();
        const replicator = new GraphQLReplicator(db);
        replicator.restart().then(() => {
          setDb(db);
          setTimeout(() => {
            setReplicator(true);
          }, 1000)
        });
      }

      initDb();
  }, [replicator]);

  if (!replicator) {
    return <div>Replicando base de datos...</div>;
  }

  return <DbContext.Provider value={db}>{children}</DbContext.Provider>;
};
