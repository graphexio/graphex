import { modelField } from './modelField';

export const modelDefault = (modelName, fieldName, access, fn) => {
  return {
    cond: modelField(modelName, fieldName, access),
    fn,
  };
};
