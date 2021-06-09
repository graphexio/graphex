import TypeWrap from '@graphex/type-wrap';
import { AMInputFieldFactory, AMModelType } from '../../definitions';
import { AMObjectFieldContext } from '../../execution/contexts/objectField';

export class AMUpdateRelationFieldFactory extends AMInputFieldFactory {
  isApplicable(field) {
    return Boolean(field.relation);
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
    };
  }
}
