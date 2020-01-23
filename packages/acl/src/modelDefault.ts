import { ACLDefault } from './definitions';
import { modelField } from './modelField';

export function modelDefault(modelName, fieldName, access, fn): ACLDefault {
  return schema => {
    const cond = modelField(modelName, fieldName, access)(schema);
    return {
      cond,
      fn,
    };
  };
}
