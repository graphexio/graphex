import { GraphQLSchema, isObjectType, isInterfaceType } from 'graphql';
import { AMModelField, AMModelType } from '../../definitions';
import SDLSyntaxException, {
  UNMARKED_OBJECT_FIELD,
} from '../../sdlSyntaxException';
import TypeWrap from '@graphex/type-wrap';

export const validateRelations = (schema: GraphQLSchema) => {
  Object.values(schema.getTypeMap()).forEach((type: AMModelType) => {
    if (
      isObjectType(type) &&
      (type.mmModel || type.mmAbstract || type.mmEmbedded)
    ) {
      Object.values(type.getFields()).forEach((field: AMModelField) => {
        const fieldTypeWrap = new TypeWrap(field.type);
        if (
          isObjectType(fieldTypeWrap.realType()) ||
          isInterfaceType(fieldTypeWrap.realType())
        ) {
          const fieldRealType = <AMModelType>fieldTypeWrap.realType();
          if (
            (fieldRealType.mmModel || fieldRealType.mmAbstract) &&
            !field.relation
          ) {
            throw new SDLSyntaxException(
              `Field '${field.name}' should be marked with @relation or @extRelation directive`,
              UNMARKED_OBJECT_FIELD,
              [field]
            );
          }
        }
      });
    }
  });
};
