import TypeWrap from '@graphex/type-wrap';
import { printSchema } from '@apollo/federation';
import {
  DirectiveNode,
  getNamedType,
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  GraphQLNamedType,
  GraphQLObjectType,
  GraphQLString,
  isEnumType,
  isInputObjectType,
  isInterfaceType,
  isObjectType,
} from 'graphql';
import { makeExecutableSchema as makeGraphQLSchema } from 'graphql-tools';
import _ from 'lodash';
import { defaultConfig } from './config/defaultConfig';
import { AMConfigResolver } from './config/resolver';
import { AMModelType, AMOptions } from './definitions';
import { AMFederationEntitiesFieldFactory } from './schemaGeneration/federation/types/entitiesField';
import InitialScheme from './initialScheme';
import Modules from './modules';
import { prepare } from './prepare/prepare';
import { makeSchemaInfo } from './schemaInfo';
import { getDirective, isAMModelType, appendField } from './utils';
export * from './config/defaultConfig';
export * from './definitions';
export * from './execution';

function hasTypeFields(
  type: GraphQLNamedType
): type is GraphQLObjectType | GraphQLInputObjectType | GraphQLInterfaceType {
  return isObjectType(type) || isInputObjectType(type) || isInterfaceType(type);
}

type AMModule = any;

export default class ModelMongo {
  Modules: AMModule[];
  options?: AMOptions;

  constructor(params: { options?: AMOptions; modules?: AMModule[] } = {}) {
    this.Modules = [...Modules, ...(params.modules ? params.modules : [])];
    this.options = params.options;
  }

  generateKeyDirective(fields): DirectiveNode {
    return {
      kind: 'Directive',
      name: { kind: 'Name', value: 'key' },
      arguments: [
        {
          kind: 'Argument',
          name: { kind: 'Name', value: 'fields' },
          value: {
            kind: 'StringValue',
            value: fields,
            block: false,
          },
        },
      ],
    };
  }

  buildFederatedSchema = params => {
    const schema = this.makeExecutableSchema(params);

    Object.values(schema.getTypeMap()).forEach((type: AMModelType) => {
      const typeWrap = new TypeWrap(type);
      const isFederated = getDirective(type, 'federated');
      if (isFederated) {
        type.extensionASTNodes = [
          { ...type.astNode, kind: 'ObjectTypeExtension' } as any,
          ...(type.extensionASTNodes ?? []),
        ];
        type.astNode = {
          kind: type.astNode.kind,
          name: type.astNode.name,
          directives: [],
        };
      }
      if (isAMModelType(type) || isFederated) {
        if (!typeWrap.isAbstract()) {
          Object.values(type.getFields()).map(field => {
            if (getDirective(field, 'unique')) {
              type.astNode = {
                ...type.astNode,
                directives: [
                  ...type.astNode.directives,
                  this.generateKeyDirective(field.name),
                ],
              };
            }
          });
        }
      }
    });

    const sdl = printSchema(schema).replace('""""""', '');

    const _Service = new GraphQLObjectType({
      name: '_Service',
      fields: () => ({
        sdl: {
          name: 'sdl',
          type: GraphQLString,
        },
      }),
    });
    schema.getTypeMap()._Service = _Service;
    schema.getQueryType().getFields()._service = {
      name: '_service',
      description: '',
      extensions: undefined,
      args: [],
      isDeprecated: false,
      type: _Service,
      resolve: () => ({
        sdl,
      }),
    };

    appendField(
      schema,
      schema.getQueryType(),
      AMFederationEntitiesFieldFactory,
      null,
      this.options
    );

    return schema;
  };

  makeExecutableSchema = params => {
    let {
      schemaDirectives = {},
      directiveResolvers = {},
      resolvers = {},
      typeDefs = [],
    } = params;

    let fieldFactoriesMap = {};
    let fieldVisitorEventsMap = {};

    if (!Array.isArray(typeDefs)) typeDefs = [typeDefs];

    typeDefs = [InitialScheme, ...typeDefs];

    this.Modules.forEach(module => {
      if (module.typeDef) typeDefs.push(module.typeDef);
      if (module.typeDefs) typeDefs.push(module.typeDefs);

      if (module.resolvers) resolvers = _.merge(resolvers, module.resolvers);
      if (module.schemaDirectives)
        schemaDirectives = _.merge(schemaDirectives, module.schemaDirectives);
      if (module.directiveResolvers) {
        directiveResolvers = _.merge(
          directiveResolvers,
          module.directiveResolvers
        );
      }

      if (module.fieldFactoriesMap) {
        fieldFactoriesMap = _.merge(
          fieldFactoriesMap,
          module.fieldFactoriesMap
        );
      }
      if (module.fieldVisitorEventsMap) {
        fieldVisitorEventsMap = _.merge(
          fieldVisitorEventsMap,
          module.fieldVisitorEventsMap
        );
      }
    });

    const modelParams = {
      ...params,
      typeDefs,
      schemaDirectives,
      directiveResolvers,
      resolvers,
      resolverValidationOptions: {
        requireResolversForResolveType: false,
      },
    };

    const schema = makeGraphQLSchema(modelParams);

    const schemaInfo = makeSchemaInfo(schema, this.options);
    const configResolver = new AMConfigResolver({
      configs: [this?.options?.config ? this.options.config : defaultConfig],
      schemaInfo,
    });

    prepare({
      schema,
      schemaInfo,
      configResolver,
      fieldFactoriesMap,
      fieldVisitorEventsMap,
      options: this.options,
    });

    /* resolve field thunks */
    let initialCount;
    do {
      initialCount = Object.values(schema.getTypeMap()).length;
      Object.entries(schema.getTypeMap()).forEach(([, type]) => {
        if (hasTypeFields(type)) {
          type.getFields();
        }
      });
    } while (initialCount !== Object.values(schema.getTypeMap()).length);
    /* resolve field thunks */

    let typesToRemove: GraphQLNamedType[];
    do {
      typesToRemove = [];
      Object.entries(schema.getTypeMap()).forEach(([, type]) => {
        if (hasTypeFields(type) && Object.keys(type.getFields()).length == 0) {
          typesToRemove.push(type);
        } else if (isEnumType(type)) {
          if (type.getValues().length === 0) {
            typesToRemove.push(type);
          }
        }
      });

      Object.entries(schema.getTypeMap()).forEach(([, type]) => {
        if (hasTypeFields(type)) {
          const fields = type.getFields();
          Object.entries(fields).forEach(([name, field]) => {
            if (typesToRemove.includes(getNamedType(field.type))) {
              delete fields[name];
            } else if (field.args) {
              field.args = field.args.filter(
                arg => !typesToRemove.includes(getNamedType(arg.type))
              );
            }
          });
        }
      });
      typesToRemove.forEach(type => {
        delete schema.getTypeMap()[type.name];
      });
    } while (typesToRemove.length > 0);

    //Remove system directives
    (schema as any)._directives = [];

    return schema;
  };
}
