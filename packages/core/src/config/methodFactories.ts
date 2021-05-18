import { AMModelMultipleQueryFieldFactory } from '../modelMethods/multipleQuery';
import { AMModelSingleQueryFieldFactory } from '../modelMethods/singleQuery';
import { AMModelConnectionQueryFieldFactory } from '../modelMethods/connectionQuery';
import { AMModelCreateMutationFieldFactory } from '../modelMethods/createMutation';
import { AMModelUpdateMutationFieldFactory } from '../modelMethods/updateMutation';
import { AMModelDeleteOneMutationFieldFactory } from '../modelMethods/deleteOneMutation';
import { AMModelDeleteManyMutationFieldFactory } from '../modelMethods/deleteManyMutation';

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
