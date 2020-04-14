import {
  GraphQLSchema,
  isCompositeType,
  isObjectType,
  isInterfaceType,
} from 'graphql';
import { AMModelField, AMModelType } from '../definitions';
import { getDirectiveAST, getArgValueFromDirectiveAST } from '../utils';
import TypeWrap from '@apollo-model/type-wrap';
import { getRelationFieldName } from '../utils';

export const relationDirective = (schema: GraphQLSchema) => {
  Object.values(schema.getTypeMap()).forEach(type => {
    if (isObjectType(type) || isInterfaceType(type)) {
      Object.values(type.getFields()).forEach((field: AMModelField) => {
        const relationDirectiveAST = getDirectiveAST(field, 'relation');
        const relationDirective = schema.getDirective('relation');
        if (!relationDirectiveAST) return;

        const relationField = getArgValueFromDirectiveAST(
          relationDirectiveAST,
          relationDirective,
          'field'
        );
        let storeField = getArgValueFromDirectiveAST(
          relationDirectiveAST,
          relationDirective,
          'storeField'
        );

        const typeWrap = new TypeWrap(field.type);
        const type = typeWrap.realType() as AMModelType;
        if (!storeField)
          storeField = getRelationFieldName(
            type.name,
            relationField,
            typeWrap.isMany()
          );
        field.relation = {
          external: false,
          abstract: type.mmAbstract,
          relationField: relationField,
          storeField: storeField,
          collection: type.mmCollectionName,
        };
        field.resolve = (source, args, ctx, info) => {
          if (source.fieldName !== info.path.key) {
            if (info.fieldNodes[0].alias) {
              return source[`$${info.path.key}`];
            }
          }
          return source[info.fieldName];
        };
      });
    }
  });
};
