import { AllSelector } from '../schemaGeneration/model/input/querySelectors/all';
import { AsIsSelector } from '../schemaGeneration/model/input/querySelectors/asis';
import { ContainsSelector } from '../schemaGeneration/model/input/querySelectors/contains';
import { EndsWithSelector } from '../schemaGeneration/model/input/querySelectors/endsWith';
import { ExactSelector } from '../schemaGeneration/model/input/querySelectors/exact';
import { ExistsSelector } from '../schemaGeneration/model/input/querySelectors/exists';
import { GTSelector } from '../schemaGeneration/model/input/querySelectors/gt';
import { GTESelector } from '../schemaGeneration/model/input/querySelectors/gte';
import { InSelector } from '../schemaGeneration/model/input/querySelectors/in';
import { LTSelector } from '../schemaGeneration/model/input/querySelectors/lt';
import { LTESelector } from '../schemaGeneration/model/input/querySelectors/lte';
import { NotInSelector } from '../schemaGeneration/model/input/querySelectors/not_in';
import { NotSizeSelector } from '../schemaGeneration/model/input/querySelectors/not_size';
import { NotSelector } from '../schemaGeneration/model/input/querySelectors/not';
import { SizeSelector } from '../schemaGeneration/model/input/querySelectors/size';
import { SomeSelector } from '../schemaGeneration/model/input/querySelectors/some';
import { StartsWithSelector } from '../schemaGeneration/model/input/querySelectors/startsWith';
import { AMCreateFieldFactory } from '../schemaGeneration/model/input/fieldFactories/create';
import { AMUpdateFieldFactory } from '../schemaGeneration/model/input/fieldFactories/update';

/** Subdocuments */
import { AMCreateNestedFieldFactory } from '../schemaGeneration/subdocuments/fieldFactories/createNested';
import { AMUpdateNestedFieldFactory } from '../schemaGeneration/subdocuments/fieldFactories/updateNested';
/** --------- */

/** Relations */
import { AMCreateRelationFieldFactory } from '../schemaGeneration/relations/fieldFactories/createRelation';
import { AMUpdateRelationFieldFactory } from '../schemaGeneration/relations/fieldFactories/updateRelation';
import { SomeRelationSelector } from '../schemaGeneration/relations/querySelectors/some-relation';
import { AsIsRelationSelector } from '../schemaGeneration/relations/querySelectors/asis-relation';
/** --------- */

/** External Relations */
import { AMCreateRelationOutsideFieldFactory } from '../schemaGeneration/externalRelations/fieldFactories/createRelationOutside';
import { AMUpdateRelationOutsideFieldFactory } from '../schemaGeneration/externalRelations/fieldFactories/updateRelationOutside';
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
