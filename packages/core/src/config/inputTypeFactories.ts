import { AMWhereTypeFactory } from '../schemaGeneration/model/input/inputTypes/where';
import { AMInterfaceWhereTypeFactory } from '../schemaGeneration/model/input/inputTypes/interfaceWhere';
import { AMWhereACLTypeFactory } from '../schemaGeneration/model/input/inputTypes/whereACLClass';
import { AMWhereCleanTypeFactory } from '../schemaGeneration/model/input/inputTypes/whereClean';
import { AMWhereUniqueTypeFactory } from '../schemaGeneration/model/input/inputTypes/whereUnique';
import { AMInterfaceWhereUniqueTypeFactory } from '../schemaGeneration/model/input/inputTypes/interfaceWhereUnique';
import { AMCreateTypeFactory } from '../schemaGeneration/model/input/inputTypes/create';
import { AMInterfaceCreateTypeFactory } from '../schemaGeneration/model/input/inputTypes/interfaceCreate';
import { AMUpdateTypeFactory } from '../schemaGeneration/model/input/inputTypes/update';
import { AMOrderByTypeFactory } from '../schemaGeneration/model/input/inputTypes/orderBy';

/** Subdocuments */
import { AMCreateManyNestedTypeFactory } from '../schemaGeneration/subdocuments/inputTypes/createManyNested';
import { AMCreateOneNestedTypeFactory } from '../schemaGeneration/subdocuments/inputTypes/createOneNested';
import { AMUpdateManyNestedTypeFactory } from '../schemaGeneration/subdocuments/inputTypes/updateManyNested';
import { AMUpdateOneNestedTypeFactory } from '../schemaGeneration/subdocuments/inputTypes/updateOneNested';
import { AMUpdateWithWhereNestedTypeFactory } from '../schemaGeneration/subdocuments/inputTypes/updateWithWhereNested';
/** -------- */

/** Relations */
import { AMCreateManyRelationTypeFactory } from '../schemaGeneration/relations/inputTypes/createManyRelation';
import { AMCreateOneRelationTypeFactory } from '../schemaGeneration/relations/inputTypes/createOneRelation';
import { AMCreateOneRequiredRelationTypeFactory } from '../schemaGeneration/relations/inputTypes/createOneRequiredRelation';
import { AMUpdateManyRelationTypeFactory } from '../schemaGeneration/relations/inputTypes/updateManyRelation';
import { AMUpdateOneRelationTypeFactory } from '../schemaGeneration/relations/inputTypes/updateOneRelation';
/** -------- */

/** External Relations */
import { AMCreateManyRelationOutsideTypeFactory } from '../schemaGeneration/externalRelations/inputTypes/createManyRelationOutside';
import { AMCreateOneRelationOutsideTypeFactory } from '../schemaGeneration/externalRelations/inputTypes/createOneRelationOutside';
import { AMCreateOneRequiredRelationOutsideTypeFactory } from '../schemaGeneration/externalRelations/inputTypes/createOneRequiredRelationOutside';
import { AMUpdateManyRelationOutsideTypeFactory } from '../schemaGeneration/externalRelations/inputTypes/updateManyRelationOutside';
import { AMUpdateOneRelationOutsideTypeFactory } from '../schemaGeneration/externalRelations/inputTypes/updateOneRelationOutside';
import { AMWhereUniqueExternalTypeFactory } from '../schemaGeneration/externalRelations/inputTypes/whereUniqueExternal';
import { AMInterfaceWhereUniqueExternalTypeFactory } from '../schemaGeneration/externalRelations/inputTypes/interfaceWhereUniqueExternal';
/** -------- */

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
  interfaceWhereUniqueExternal: {
    factory: AMInterfaceWhereUniqueExternalTypeFactory,
    links: {
      whereUnique: 'whereUniqueExternal',
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
