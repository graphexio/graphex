import { AMConfig } from '../definitions';
import { AMModelMultipleQueryFieldFactory } from '../modelMethods/multipleQuery';
import { AMWhereTypeFactory } from '../inputTypes/whereClass';
import { AMInterfaceWhereTypeFactory } from '../inputTypes/interfaceWhereClass';
import { AMWhereACLTypeFactory } from '../inputTypes/whereACLClass';
import { AMWhereCleanTypeFactory } from '../inputTypes/whereCleanClass';
import { AMWhereUniqueTypeFactory } from '../inputTypes/whereUniqueClass';
import { AMUpdateWithWhereNestedTypeFactory } from '../inputTypes/updateWithWhereNestedClass';
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
import { AMModelSingleQueryFieldFactory } from '../modelMethods/singleQuery';
import { AMInterfaceWhereUniqueTypeFactory } from '../inputTypes/interfaceWhereUniqueClass';
import { AMModelConnectionQueryFieldFactory } from '../modelMethods/connectionQuery';
import { AMModelCreateMutationFieldFactory } from '../modelMethods/createMutation';
import { AMCreateFieldFactory } from '../inputTypes/fieldFactories/createClass';
import { AMCreateTypeFactory } from '../inputTypes/createClass';
import { AMCreateNestedFieldFactory } from '../inputTypes/fieldFactories/createNestedClass';
import { AMCreateRelationFieldFactory } from '../inputTypes/fieldFactories/createRelationClass';
import { AMCreateManyNestedTypeFactory } from '../inputTypes/createManyNestedClass';
import { AMCreateManyRelationTypeFactory } from '../inputTypes/createManyRelationClass';
import { AMCreateOneNestedTypeFactory } from '../inputTypes/createOneNestedClass';
import { AMCreateOneRelationTypeFactory } from '../inputTypes/createOneRelationClass';
import { AMCreateOneRequiredRelationTypeFactory } from '../inputTypes/createOneRequiredRelationClass';
import { AMInterfaceCreateTypeFactory } from '../inputTypes/interfaceCreateClass';
import { AMUpdateTypeFactory } from '../inputTypes/updateClass';
import { AMUpdateManyNestedTypeFactory } from '../inputTypes/updateManyNestedClass';
import { AMUpdateManyRelationTypeFactory } from '../inputTypes/updateManyRelationClass';
import { AMUpdateOneNestedTypeFactory } from '../inputTypes/updateOneNestedClass';
import { AMUpdateOneRelationTypeFactory } from '../inputTypes/updateOneRelationClass';
import { AMUpdateFieldFactory } from '../inputTypes/fieldFactories/updateClass';
import { AMUpdateNestedFieldFactory } from '../inputTypes/fieldFactories/updateNestedClass';
import { AMUpdateRelationFieldFactory } from '../inputTypes/fieldFactories/updateRelationClass';
import { AMModelUpdateMutationFieldFactory } from '../modelMethods/updateMutation';
import { AMModelDeleteOneMutationFieldFactory } from '../modelMethods/deleteOneMutation';
import { AMModelDeleteManyMutationFieldFactory } from '../modelMethods/deleteManyMutation';
import { AMOrderByTypeFactory } from '../inputTypes/orderByClass';
import { AMConnectionTypeFactory } from '../types/connectionClass';
import { AMAggregateTypeFactory } from '../types/aggregateClass';

const config = {
  _default: {
    methodFactories: {
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
    },
    typeFactories: {
      aggregate: {
        factory: AMAggregateTypeFactory,
      },
      connection: {
        factory: AMConnectionTypeFactory,
      },
    },
    inputTypeFactories: {
      whereACL: {
        factory: AMWhereACLTypeFactory,
        links: {
          and: 'whereACL',
          or: 'whereACL',
        },
      },
      where: {
        factory: AMWhereTypeFactory,
        links: {
          whereACL: 'whereACL',
          and: 'where',
          or: 'where',
        },
        dynamicLinks: {
          _default: {
            selectors: [
              'selectorSize',
              'selectorNotSize',
              'selectorExists',

              'selectorAll',
              'selectorExact',

              'selectorIn',
              'selectorNotIn',

              'selectorSome',
              'selectorSomeRelation',

              'selectorAsIs',
              'selectorAsIsRelation',

              'selectorLT',
              'selectorLTE',
              'selectorGT',
              'selectorGTE',

              'selectorNot',

              'selectorContains',
              'selectorStartsWith',
              'selectorEndsWith',
            ],
          },
        },
      },
      interfaceWhere: {
        factory: AMInterfaceWhereTypeFactory,
        links: {
          where: 'where',
        },
      },
      whereClean: {
        factory: AMWhereCleanTypeFactory,
        links: {
          whereACL: 'whereACL',
          and: 'where',
          or: 'where',
        },
        dynamicLinks: {
          _default: {
            selectors: ['selectorAsIs'],
          },
        },
      },
      interfaceWhereUnique: {
        factory: AMInterfaceWhereUniqueTypeFactory,
        links: {
          whereUnique: 'whereUnique',
        },
      },
      whereUnique: {
        factory: AMWhereUniqueTypeFactory,
        links: {
          whereACL: 'whereACL',
        },
        dynamicLinks: {
          _default: {
            selectors: ['selectorAsIs'],
          },
        },
      },
      updateWithWhereNested: {
        factory: AMUpdateWithWhereNestedTypeFactory,
        links: {
          where: 'where',
          data: 'update',
        },
      },
      create: {
        factory: AMCreateTypeFactory,
        dynamicLinks: {
          _default: {
            fieldFactories: ['create', 'createNested', 'createRelation'],
          },
        },
      },
      createManyNested: {
        factory: AMCreateManyNestedTypeFactory,
      },
      createManyRelation: {
        factory: AMCreateManyRelationTypeFactory,
      },
      createOneNested: {
        factory: AMCreateOneNestedTypeFactory,
      },
      createOneRelation: {
        factory: AMCreateOneRelationTypeFactory,
      },
      createOneRequirerdRelation: {
        factory: AMCreateOneRequiredRelationTypeFactory,
      },
      interfaceCreate: {
        factory: AMInterfaceCreateTypeFactory,
      },
      update: {
        factory: AMUpdateTypeFactory,
        dynamicLinks: {
          _default: {
            fieldFactories: ['update', 'updateNested', 'updateRelation'],
          },
        },
      },
      updateManyNested: {
        factory: AMUpdateManyNestedTypeFactory,
        links: {
          create: 'create',
          recreate: 'create',
          updateMany: 'updateWithWhereNested',
          deleteMany: 'where',
        },
      },
      updateManyRelation: {
        factory: AMUpdateManyRelationTypeFactory,
      },
      updateOneNested: {
        factory: AMUpdateOneNestedTypeFactory,
      },
      updateOneRelation: {
        factory: AMUpdateOneRelationTypeFactory,
      },
      orderBy: {
        factory: AMOrderByTypeFactory,
      },
    },
    inputFieldFactories: {
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
      },
    },
  },
};

export function buildConfigType<T extends AMConfig>(config: T): T {
  return config;
}

export const defaultConfig = buildConfigType(config);
