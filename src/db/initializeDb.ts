import { todoSchema } from './schemas/todoSchema';

import { addRxPlugin } from 'rxdb';
import {
  replicateGraphQL
} from 'rxdb/plugins/replication-graphql';


// TODO import these only in non-production build

import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
addRxPlugin(RxDBDevModePlugin);
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';

import { RxDBUpdatePlugin } from 'rxdb/plugins/update';
addRxPlugin(RxDBUpdatePlugin);

import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
addRxPlugin(RxDBQueryBuilderPlugin);

import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election';
addRxPlugin(RxDBLeaderElectionPlugin);

//types

import { createRxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';

const pullQueryBuilder = (checkpoint, limit) => {
  if (!checkpoint || checkpoint === null) {
    checkpoint = {
      id: "0",
      updatedAt: "1970-01-01T00:00:00Z"
    };
  }
  
  const query = `query SyncTodos($checkpoint: CheckpointInput, $limit: Int) {
    syncTodos(checkpoint: $checkpoint, limit: $limit) {
      documents {
        id
        text
        isCompleted
        deleted
        createdAt
        updatedAt
      }
      checkpoint {
        id
        updatedAt
      }
    }
  }  
  `;
  
  return {
    query,
    operationName: 'SyncTodos',
    variables: {
      checkpoint,
      limit
    }
  };
};

const pushQueryBuilder = (rows) => {
  const query = `
  mutation PushTodo($input: PushTodoInput!) {
    pushTodo(input: $input) {
      todos {
        id
        text
        isCompleted
        createdAt
        updatedAt
        deleted
      }
    }
  }
  `;

  const variables = {
      input: {
          writeRows: rows
      }
  };

  return {
      query,
      operationName: 'PushTodo',
      variables
  };
};

const syncURL = 'http://localhost:3000/graphql';

export class GraphQLReplicator {
  private db;
  private replicationState;

  constructor(db) {
      this.db = db;
      this.replicationState = null;
  }

  async restart(): Promise<void> {
      if (this.replicationState) {
          this.replicationState.cancel();
      }

      this.replicationState = this.setupGraphQLReplication();
  }

  private setupGraphQLReplication() {
    const replicationState = replicateGraphQL({
      collection: this.db.todos,
      url: {
        http: syncURL,
      },
      pull: {
        queryBuilder: pullQueryBuilder,
        batchSize: 50,
      },
      push: {
        queryBuilder: pushQueryBuilder,
        batchSize: 5,
      },
      deletedField: 'deleted',
      live: false,
      replicationIdentifier: 'my-replication'
    });
  
    // replicationState.error$.subscribe(err => {
    //   console.error('replication error:');
    //   console.dir(err);
    // });
  
    console.log('Replication was successfully setup');
  
    return replicationState;
  }

  getReplicationState() {
    return this.replicationState;
  }
}

export const createDb = async () => {
  console.log('DatabaseService: creating database..');

  const db = await createRxDatabase({
      name: 'tododatabase',
      storage: getRxStorageDexie(),
      ignoreDuplicate: true
  });

  console.log('DatabaseService: created database');

  await db.addCollections({
      todos: {
          schema: todoSchema,
      }
  });

  return db;
};