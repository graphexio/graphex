import { defaultFieldResolver } from 'graphql';
import { SchemaDirectiveVisitor } from 'graphql-tools';

import {
  GraphQLInt,
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLEnumType,
} from 'graphql';

export const ModelScheme = `directive @model(primaryKey:String="id") on OBJECT`;

export default class Model extends SchemaDirectiveVisitor {
  visitObject(object) {
    const { primaryKey } = this.args;
    object._fields[primaryKey].primaryKey = true;

    // ['createdAt', 'updatedAt'].forEach(field => {
    //   object._fields[field] = {
    //     name: field,
    //     type: GraphQLInt,
    //     args: [],
    //     isDeprecated: false,
    //     resolve: defaultFieldResolver,
    //     skipCreate: true,
    //   };
    // });
  }
  exitObject(object) {
    // console.log('exit', object);
  }
}
