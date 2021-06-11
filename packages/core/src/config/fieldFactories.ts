import { AMIdentityFieldFactory } from '../schemaGeneration/model/output/fieldFactories/identity';
import { AMNamedTypeFieldFactory } from '../schemaGeneration/model/output/fieldFactories/namedType';
import { AMAggregateNumericFieldsFieldFactory } from '../schemaGeneration/model/output/fieldFactories/aggregateNumericFields';

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
