import { GraphQLSchema, isCompositeType, isObjectType } from 'graphql';
import { AMModelField, AMModelType } from '../types';
import { getDirectiveAST, getArgValueFromDirectiveAST } from '../tsutils';
import TypeWrap from '@apollo-model/type-wrap';
import { allQueryArgs, getDirective, getRelationFieldName } from '../utils';

export const relationDirective = (schema: GraphQLSchema) => {
  Object.values(schema.getTypeMap()).forEach(type => {
    if (isObjectType(type)) {
      Object.values(type.getFields()).forEach((field: AMModelField) => {
        const relationDirectiveAST = getDirectiveAST(field, 'relation');
        const relationDirective = schema.getDirective('relation');
        if (!relationDirectiveAST) return;

        let relationField = getArgValueFromDirectiveAST(
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
      });
    }
  });
};
