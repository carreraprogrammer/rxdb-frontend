
export const todoSchema  = {
  title: 'todo schema',
  description: 'todo schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      primary: true,
      maxLength: 255
    },
    text: {
      type: 'string'
    },
    isCompleted: {
      type: 'boolean'
    },
    createdAt: {
      type: 'string',
      format: 'date-time'        
    },
    updatedAt: {
      type: 'string',
      format: 'date-time'
    }
  },
  required: ['text', 'isCompleted', 'createdAt']
};

export const graphQLGenerationInput = {
  todo: {
      schema: todoSchema,
      checkpointFields: [
          'id',
          'updatedAt'
      ],
      deletedField: 'deleted'
  }
};
