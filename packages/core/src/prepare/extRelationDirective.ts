import { GraphQLSchema, isCompositeType, isObjectType } from 'graphql';
import { AMModelField, AMModelType } from '../types';
import { getDirectiveAST, getArgValueFromDirectiveAST } from '../tsutils';
import TypeWrap from '@apollo-model/type-wrap';
import { allQueryArgs, getDirective, getRelationFieldName } from '../utils';

export const extRelationDirective = (schema: GraphQLSchema) => {
  Object.values(schema.getTypeMap()).forEach(modelType => {
    if (isObjectType(modelType)) {
      Object.values(modelType.getFields()).forEach((field: AMModelField) => {
        const relationDirectiveAST = getDirectiveAST(field, 'extRelation');
        const relationDirective = schema.getDirective('extRelation');
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
        const fieldType = typeWrap.realType() as AMModelType;
        if (!storeField)
          storeField = getRelationFieldName(
            modelType.name,
            relationField,
            false
          );
        field.relation = {
          external: true,
          abstract: false,
          relationField: relationField,
          storeField: storeField,
          collection: fieldType.mmCollectionName,
        };
      });
    }
  });
};
