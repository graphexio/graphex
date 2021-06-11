import { AMConnectionTypeFactory } from '../schemaGeneration/model/output/types/connection';
import { AMAggregateTypeFactory } from '../schemaGeneration/model/output/types/aggregate';
import { AMAggregateNumericFieldsTypeFactory } from '../schemaGeneration/model/output/types/aggregateNumericFields';

export const typeFactories = {
  aggregate: {
    factory: AMAggregateTypeFactory,
    links: {
      sum: 'aggregateNumericFields',
      min: 'aggregateNumericFields',
      max: 'aggregateNumericFields',
    },
  },
  aggregateNumericFields: {
    factory: AMAggregateNumericFieldsTypeFactory,
    links: {
      embedded: 'aggregateNumericFields',
    },
    dynamicLinks: {
      _default: {
        fieldFactories: ['aggregateNumericFields'],
      },
      Int: {
        fieldFactories: ['namedType'],
      },
      Float: {
        fieldFactories: ['namedType'],
      },
    },
  },
  connection: {
    factory: AMConnectionTypeFactory,
  },
};
