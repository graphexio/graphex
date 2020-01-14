import { AMModelField, AMSchemaInfo, IAMQuerySelector } from '../definitions';
import { Selectors } from './querySelectors';
import { TransformToInputInterface } from './transformToInputInterface';

const isApplicable = (field: AMModelField) => (selector: IAMQuerySelector) =>
  selector.isApplicable(field);

const selectorToField = (field: AMModelField, schemaInfo: AMSchemaInfo) => (
  selector: IAMQuerySelector
) => {
  return selector.getFieldFactory().getField(field, schemaInfo);
};

const transformToInputWhere: TransformToInputInterface = params => {
  return Selectors.filter(isApplicable(params.field)).map(
    selectorToField(params.field, params.schemaInfo)
  );
};

export default transformToInputWhere;
