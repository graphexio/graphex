import { AllSelector } from '../inputTypes/fieldFactories/querySelectors/all';
import { AsIsSelector } from '../inputTypes/fieldFactories/querySelectors/asis';
import { AsIsRelationSelector } from '../inputTypes/fieldFactories/querySelectors/asis-relation';
import { ContainsSelector } from '../inputTypes/fieldFactories/querySelectors/contains';
import { EndsWithSelector } from '../inputTypes/fieldFactories/querySelectors/endsWith';
import { ExactSelector } from '../inputTypes/fieldFactories/querySelectors/exact';
import { ExistsSelector } from '../inputTypes/fieldFactories/querySelectors/exists';
import { GTSelector } from '../inputTypes/fieldFactories/querySelectors/gt';
import { GTESelector } from '../inputTypes/fieldFactories/querySelectors/gte';
import { InSelector } from '../inputTypes/fieldFactories/querySelectors/in';
import { LTSelector } from '../inputTypes/fieldFactories/querySelectors/lt';
import { LTESelector } from '../inputTypes/fieldFactories/querySelectors/lte';
import { NotInSelector } from '../inputTypes/fieldFactories/querySelectors/not_in';
import { NotSizeSelector } from '../inputTypes/fieldFactories/querySelectors/not_size';
import { NotSelector } from '../inputTypes/fieldFactories/querySelectors/not';
import { SizeSelector } from '../inputTypes/fieldFactories/querySelectors/size';
import { SomeRelationSelector } from '../inputTypes/fieldFactories/querySelectors/some-relation';
import { SomeSelector } from '../inputTypes/fieldFactories/querySelectors/some';
import { StartsWithSelector } from '../inputTypes/fieldFactories/querySelectors/startsWith';
import { AMCreateFieldFactory } from '../inputTypes/fieldFactories/create';
import { AMCreateNestedFieldFactory } from '../inputTypes/fieldFactories/createNested';
import { AMUpdateFieldFactory } from '../inputTypes/fieldFactories/update';
import { AMUpdateNestedFieldFactory } from '../inputTypes/fieldFactories/updateNested';
import { AMCreateRelationOutsideFieldFactory } from '../inputTypes/fieldFactories/createRelationOutside';
import { AMUpdateRelationOutsideFieldFactory } from '../inputTypes/fieldFactories/updateRelationOutside';

/** Relations */
import { AMCreateRelationFieldFactory } from '../schemaGeneration/relations/fieldFactories/createRelation';
import { AMUpdateRelationFieldFactory } from '../schemaGeneration/relations/fieldFactories/updateRelation';
/** --------- */

export const inputFieldFactories = {
  selectorAll: {
    factory: AllSelector,
    links: {
      whereClean: 'whereClean',
    },
  },
  selectorAsIsRelation: {
    factory: AsIsRelationSelector,
    links: {
      where: ['where', 'interfaceWhere'],
    },
  },
  selectorAsIs: {
    factory: AsIsSelector,
    links: {
      where: ['where', 'interfaceWhere'],
    },
  },
  selectorContains: {
    factory: ContainsSelector,
  },
  selectorEndsWith: {
    factory: EndsWithSelector,
  },
  selectorExact: {
    factory: ExactSelector,
    links: {
      whereClean: 'whereClean',
    },
  },
  selectorExists: {
    factory: ExistsSelector,
  },
  selectorGT: {
    factory: GTSelector,
  },
  selectorGTE: {
    factory: GTESelector,
  },
  selectorIn: {
    factory: InSelector,
    links: {
      whereClean: 'whereClean',
    },
  },
  selectorLT: {
    factory: LTSelector,
  },
  selectorLTE: {
    factory: LTESelector,
  },
  selectorNotIn: {
    factory: NotInSelector,
    links: {
      whereClean: 'whereClean',
    },
  },
  selectorNotSize: {
    factory: NotSizeSelector,
  },
  selectorNot: {
    factory: NotSelector,
  },
  selectorSize: {
    factory: SizeSelector,
  },
  selectorSomeRelation: {
    factory: SomeRelationSelector,
    links: {
      where: ['where', 'interfaceWhere'],
    },
  },
  selectorSome: {
    factory: SomeSelector,
    links: {
      where: ['where', 'interfaceWhere'],
    },
  },
  selectorStartsWith: {
    factory: StartsWithSelector,
  },
  create: {
    factory: AMCreateFieldFactory,
  },
  createNested: {
    factory: AMCreateNestedFieldFactory,
    links: {
      many: 'createManyNested',
      one: 'createOneNested',
    },
  },
  createRelation: {
    factory: AMCreateRelationFieldFactory,
    links: {
      many: 'createManyRelation',
      one: 'createOneRelation',
      oneRequired: 'createOneRequirerdRelation',
    },
  },
  createRelationOutside: {
    factory: AMCreateRelationOutsideFieldFactory,
    links: {
      many: 'createManyRelationOutside',
      one: 'createOneRelationOutside',
      oneRequired: 'createOneRequirerdRelationOutside',
    },
  },
  update: {
    factory: AMUpdateFieldFactory,
  },
  updateNested: {
    factory: AMUpdateNestedFieldFactory,
    links: {
      many: 'updateManyNested',
      one: 'updateOneNested',
    },
  },
  updateRelation: {
    factory: AMUpdateRelationFieldFactory,
    // TODO: add links
  },
  updateRelationOutside: {
    factory: AMUpdateRelationOutsideFieldFactory,
    // TODO: add links
  },
};
