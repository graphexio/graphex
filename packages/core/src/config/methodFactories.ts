import { AMModelMultipleQueryFieldFactory } from '../schemaGeneration/rootMethods/multipleQuery';
import { AMModelSingleQueryFieldFactory } from '../schemaGeneration/rootMethods/singleQuery';
import { AMModelConnectionQueryFieldFactory } from '../schemaGeneration/rootMethods/connectionQuery';
import { AMModelCreateMutationFieldFactory } from '../schemaGeneration/rootMethods/createMutation';
import { AMModelUpdateMutationFieldFactory } from '../schemaGeneration/rootMethods/updateMutation';
import { AMModelDeleteOneMutationFieldFactory } from '../schemaGeneration/rootMethods/deleteOneMutation';
import { AMModelDeleteManyMutationFieldFactory } from '../schemaGeneration/rootMethods/deleteManyMutation';

export const methodFactories = {
  singleQuery: {
    factory: AMModelSingleQueryFieldFactory,
    links: {
      whereUnique: ['whereUnique', 'interfaceWhereUnique'],
    },
  },
  multipleQuery: {
    factory: AMModelMultipleQueryFieldFactory,
    links: {
      where: ['where', 'interfaceWhere'],
      orderBy: 'orderBy',
    },
  },
  connectionQuery: {
    factory: AMModelConnectionQueryFieldFactory,
    links: {
      where: ['where', 'interfaceWhere'],
      orderBy: 'orderBy',
    },
  },
  createMutation: {
    factory: AMModelCreateMutationFieldFactory,
    links: {
      data: ['create', 'interfaceCreate'],
    },
  },
  updateMutation: {
    factory: AMModelUpdateMutationFieldFactory,
    links: {
      data: 'update',
      where: 'whereUnique',
      whereInterface: 'interfaceWhereUnique',
    },
  },
  deleteOneMutation: {
    factory: AMModelDeleteOneMutationFieldFactory,
    links: {
      where: ['whereUnique', 'interfaceWhereUnique'],
    },
  },
  deleteManyMutation: {
    factory: AMModelDeleteManyMutationFieldFactory,
    links: {
      where: ['where', 'interfaceWhere'],
    },
  },
};
