import TypeWrap from '@apollo-model/type-wrap';
import { GraphQLSchema, isInterfaceType, isObjectType } from 'graphql';
import { AMModelField, AMModelType } from '../definitions';
import {
  getArgValueFromDirectiveAST,
  getDirectiveAST,
  getRelationFieldName,
} from '../utils';

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
        /**
         * Field resolver is added in relationFieldsVisitorEvents
         */
      });
    }
  });
};
