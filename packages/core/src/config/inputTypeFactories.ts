import { AMWhereTypeFactory } from '../inputTypes/where';
import { AMInterfaceWhereTypeFactory } from '../inputTypes/interfaceWhere';
import { AMWhereACLTypeFactory } from '../inputTypes/whereACLClass';
import { AMWhereCleanTypeFactory } from '../inputTypes/whereClean';
import { AMWhereUniqueTypeFactory } from '../inputTypes/whereUnique';
import { AMWhereUniqueExternalTypeFactory } from '../inputTypes/whereUniqueExternal';
import { AMUpdateWithWhereNestedTypeFactory } from '../inputTypes/updateWithWhereNested';
import { AMInterfaceWhereUniqueTypeFactory } from '../inputTypes/interfaceWhereUnique';
import { AMCreateTypeFactory } from '../inputTypes/create';
import { AMCreateManyNestedTypeFactory } from '../inputTypes/createManyNested';
import { AMCreateManyRelationTypeFactory } from '../inputTypes/createManyRelation';
import { AMCreateOneNestedTypeFactory } from '../inputTypes/createOneNested';
import { AMCreateOneRelationTypeFactory } from '../inputTypes/createOneRelation';
import { AMCreateOneRequiredRelationTypeFactory } from '../inputTypes/createOneRequiredRelation';
import { AMInterfaceCreateTypeFactory } from '../inputTypes/interfaceCreate';
import { AMUpdateTypeFactory } from '../inputTypes/update';
import { AMUpdateManyNestedTypeFactory } from '../inputTypes/updateManyNested';
import { AMUpdateManyRelationTypeFactory } from '../inputTypes/updateManyRelation';
import { AMUpdateOneNestedTypeFactory } from '../inputTypes/updateOneNested';
import { AMUpdateOneRelationTypeFactory } from '../inputTypes/updateOneRelation';
import { AMOrderByTypeFactory } from '../inputTypes/orderBy';
import { AMCreateManyRelationOutsideTypeFactory } from '../inputTypes/createManyRelationOutside';
import { AMCreateOneRelationOutsideTypeFactory } from '../inputTypes/createOneRelationOutside';
import { AMCreateOneRequiredRelationOutsideTypeFactory } from '../inputTypes/createOneRequiredRelationOutside';
import { AMUpdateManyRelationOutsideTypeFactory } from '../inputTypes/updateManyRelationOutside';
import { AMUpdateOneRelationOutsideTypeFactory } from '../inputTypes/updateOneRelationOutside';

export const inputTypeFactories = {
  whereACL: {
    factory: AMWhereACLTypeFactory,
    links: {
      and: 'whereACL',
      or: 'whereACL',
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
      whereACL: 'whereACL',
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
      whereACL: 'whereACL',
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
  whereUniqueExternal: {
    factory: AMWhereUniqueExternalTypeFactory,
    links: {},
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
        fieldFactories: [
          'create',
          'createNested',
          'createRelation',
          'createRelationOutside',
        ],
      },
    },
  },
  createManyNested: {
    factory: AMCreateManyNestedTypeFactory,
  },
  createManyRelation: {
    factory: AMCreateManyRelationTypeFactory,
  },
  createManyRelationOutside: {
    factory: AMCreateManyRelationOutsideTypeFactory,
  },
  createOneNested: {
    factory: AMCreateOneNestedTypeFactory,
  },
  createOneRelation: {
    factory: AMCreateOneRelationTypeFactory,
  },
  createOneRelationOutside: {
    factory: AMCreateOneRelationOutsideTypeFactory,
  },
  createOneRequirerdRelation: {
    factory: AMCreateOneRequiredRelationTypeFactory,
  },
  createOneRequirerdRelationOutside: {
    factory: AMCreateOneRequiredRelationOutsideTypeFactory,
  },
  interfaceCreate: {
    factory: AMInterfaceCreateTypeFactory,
  },
  update: {
    factory: AMUpdateTypeFactory,
    dynamicLinks: {
      _default: {
        fieldFactories: [
          'update',
          'updateNested',
          'updateRelation',
          'updateRelationOutside',
        ],
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
  updateManyRelationOutside: {
    factory: AMUpdateManyRelationOutsideTypeFactory,
  },
  updateOneNested: {
    factory: AMUpdateOneNestedTypeFactory,
  },
  updateOneRelation: {
    factory: AMUpdateOneRelationTypeFactory,
  },
  updateOneRelationOutside: {
    factory: AMUpdateOneRelationOutsideTypeFactory,
  },
  orderBy: {
    factory: AMOrderByTypeFactory,
  },
};
