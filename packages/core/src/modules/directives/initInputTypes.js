import gql from 'graphql-tag';
import { SchemaDirectiveVisitor } from 'graphql-tools';

import InputTypes from '../../inputTypes';

export const typeDef = gql`
  directive @initInputTypes on OBJECT
`;

class InitInputTypes extends SchemaDirectiveVisitor {
  visitObject(object) {
    const { _typeMap: SchemaTypes } = this.schema;
    InputTypes.setSchemaTypes(SchemaTypes);
  }
}

export const schemaDirectives = {
  initInputTypes: InitInputTypes,
};
