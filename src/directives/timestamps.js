import _ from 'lodash';

import {defaultFieldResolver, GraphQL} from 'graphql';
import {SchemaDirectiveVisitor} from 'graphql-tools';
import {Date as DateScalar} from "../scalars";
import {appendTransform} from 'apollo-model-mongodb/lib/inputTypes/utils';
import * as HANDLER from 'apollo-model-mongodb/lib/inputTypes/handlers';
import * as KIND from 'apollo-model-mongodb/lib/inputTypes/kinds';
import {getDirective} from "apollo-model-mongodb";

export const TimestampsScheme = `directive @timestamps(createdAt:Boolean = true, updatedAt:Boolean = true createdAtName:String=null, updatedAtName:String=null) on OBJECT | INTERFACE`;

const createField = ({type, args = [], name, storeField}) => {
  return {
    name,
    type,
    args,
    description: "",
    isDeprecated: false,
    resolve: async (parent, args, context) => {
      return parent[storeField];
    },
  };
};


export default class Timestamps extends SchemaDirectiveVisitor {
  visitInterface(iface) {
    let fields = this.setup(iface);
    const {_typeMap: SchemaTypes} = this.schema;
    
    _.values(SchemaTypes)
      .filter(type => type._interfaces && type._interfaces.includes(iface))
      .forEach(type => {
        if (getDirective(type, 'model')) {
          type._fields = {...type._fields, ...fields}
        }
      });
    
  }
  
  visitObject(object) {
    let fields = this.setup(object);
    const {_typeMap: SchemaTypes} = this.schema;
    
    _.values(SchemaTypes)
      .forEach(type => {
        if (getDirective(type, 'model')) {
          type._fields = {...type._fields, ...fields}
        }
        
      });
  }
  
  setup(object) {
    let {createdAt = true, updatedAt = true, createdAtName = "createdAt", updatedAtName = "updatedAt"} = this.args;
    const fields = object.getFields();
    if (createdAt) {
      if ('createdAt' in fields) {
        throw new Error(`Conflicting field name createdAt`);
      }
      fields['createdAt'] = createField({
        name: "createdAt",
        type: DateScalar,
        storeField: createdAtName,
      });
      appendTransform(fields['createdAt'], HANDLER.TRANSFORM_INPUT, {
        [KIND.CREATE]: this._setDateTransform('createdAt'),
      });
      if (createdAtName !== 'createdAt') {
        appendTransform(fields['createdAt'], HANDLER.TRANSFORM_INPUT, {
          [KIND.ORDER_BY]: this._renameTransform('createdAt', createdAtName),
          [KIND.CREATE]: this._renameTransform('createdAt', createdAtName),
          [KIND.UPDATE]: this._renameTransform('createdAt', createdAtName),
          [KIND.WHERE]: this._renameTransform('createdAt', createdAtName),
        });
      }
      
    }
    if (updatedAt) {
      fields['updatedAt'] = createField({
        name: "updatedAt",
        type: DateScalar,
        storeField: updatedAtName,
      });
      appendTransform(fields['updatedAt'], HANDLER.TRANSFORM_INPUT, {
        [KIND.CREATE]: this._setDateTransform('updatedAt'),
        [KIND.UPDATE]: this._setDateTransform('updatedAt')
      });
      if (updatedAtName !== 'updatedAt') {
        appendTransform(fields['updatedAt'], HANDLER.TRANSFORM_INPUT, {
          [KIND.ORDER_BY]: this._renameTransform('updatedAt', updatedAtName),
          [KIND.CREATE]: this._renameTransform('updatedAt', updatedAtName),
          [KIND.UPDATE]: this._renameTransform('updatedAt', updatedAtName),
          [KIND.WHERE]: this._renameTransform('updatedAt', updatedAtName),
        });
      }
    }
    return {createdAt, updatedAt} = fields;
  }
  
  _setDateTransform = (fieldName) => params => {
    params[fieldName] = new Date();
    return params;
  };
  
  _renameTransform = (fieldName, dbName) => params => {
    
    let value = params[fieldName];
    return {
      ..._.omit(params, fieldName),
      [dbName]: value,
    };
  };
  
  
}

export function TimestampsResolver(next, source, args, ctx, info) {
  return next();
}
