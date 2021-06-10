import TypeWrap from '@graphex/type-wrap';
import {
  AMInputFieldFactory,
  AMModelField,
  AMModelType,
} from '../../../definitions';

export class AMUpdateRelationFieldFactory extends AMInputFieldFactory {
  isApplicable(field: AMModelField) {
    return Boolean(field.relation) && !field.relation.external;
  }
  getFieldName(field) {
    return field.name;
  }
  getField(field) {
    const typeWrap = new TypeWrap(field.type);
    const isMany = typeWrap.isMany();
    const type = this.configResolver.resolveInputType(
      typeWrap.realType() as AMModelType,
      isMany
        ? 'updateManyRelation'
        : // : isRequired
          // ? AMUpdateOneRequiredRelationTypeFactory
          'updateOneRelation'
    );

    return {
      name: this.getFieldName(field),
      extensions: undefined,
      type,
      dbName: field.relation.storeField, // TODO: replace with field.dbName
      relation: field.relation,
      // No handler because update types will set data directly in operation.
    };
  }
}
