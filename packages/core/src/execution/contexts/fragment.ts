import { AMContext } from '../context';
import { AMFieldsSelectionContext } from './fieldsSelection';
import { GraphQLNamedType } from 'graphql';

export class AMFragmentContext extends AMContext {
  constructor(
    private options?: {
      fieldsSelectionContext?: AMFieldsSelectionContext;
      contextType?: GraphQLNamedType;
      conditionType?: GraphQLNamedType;
      actualConditionType?: GraphQLNamedType;
    }
  ) {
    super();
  }

  getFieldsSelectionContext() {
    return this.options.fieldsSelectionContext;
  }

  getActualConditionType() {
    return this.options.actualConditionType;
  }
}
