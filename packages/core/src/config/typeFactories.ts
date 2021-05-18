import { AMConnectionTypeFactory } from '../types/connection';
import { AMAggregateTypeFactory } from '../types/aggregate';
import { AMAggregateNumericFieldsTypeFactory } from '../types/aggregateNumericFields';

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
