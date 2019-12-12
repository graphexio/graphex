import { GraphQLSchema, isObjectType, isInterfaceType } from 'graphql';
import { AMModelField, AMModelType } from '../../definitions';
import SDLSyntaxException, {
  UNMARKED_OBJECT_FIELD,
} from '../../sdlSyntaxException';
import TypeWrap from '@apollo-model/type-wrap';

export const validateObjectFieldType = (schema: GraphQLSchema) => {
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
            !fieldRealType.mmAbstract &&
            !fieldRealType.mmModel &&
            !fieldRealType.mmEmbedded &&
            !fieldTypeWrap.interfaceWithDirective('model')
          ) {
            // console.log('error', type, field);
            throw new SDLSyntaxException(
              `Type '${
                fieldTypeWrap.realType().name
              }' should be marked with @embedded, @abstract or @model directive`,
              UNMARKED_OBJECT_FIELD,
              [field]
            );
          }
        }
      });
    }
  });
};
