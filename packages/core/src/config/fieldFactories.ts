import { AMIdentityFieldFactory } from '../types/fieldFactories/identity';
import { AMNamedTypeFieldFactory } from '../types/fieldFactories/namedType';
import { AMAggregateNumericFieldsFieldFactory } from '../types/fieldFactories/aggregateNumericFields';

export const fieldFactories = {
  aggregateNumericFields: {
    factory: AMAggregateNumericFieldsFieldFactory,
    links: {
      embedded: 'aggregateNumericFields',
    },
  },
  identity: {
    factory: AMIdentityFieldFactory,
  },
  namedType: {
    factory: AMNamedTypeFieldFactory,
  },
};
