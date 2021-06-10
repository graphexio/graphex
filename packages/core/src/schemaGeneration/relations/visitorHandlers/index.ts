import { AMModelType } from '../../../definitions';
import { defaultObjectFieldVisitorHandler } from '../../common/visitorHandlers';
import {
  abstractCreateHandlerFactory,
  abstractReadHandlerFactory,
} from './abstract';
import {
  modelCreateManyHandlerFactory,
  modelCreateOneHandlerFactory,
  modelReadManyHandlerFactory,
  modelReadOneHandlerFactory,
} from './model';

export const readManyHandlerFactory = (modelType: AMModelType) => {
  return modelType.mmAbstract
    ? abstractReadHandlerFactory(modelType)
    : modelReadManyHandlerFactory(modelType);
};

export const createManyHandlerFactory = (modelType: AMModelType) => {
  return modelType.mmAbstract
    ? abstractCreateHandlerFactory(modelType)
    : modelCreateManyHandlerFactory(modelType);
};

export const createOneHandlerFactory = (modelType: AMModelType) => {
  return modelType.mmAbstract
    ? defaultObjectFieldVisitorHandler /* For abstract interface we create operations inside AMInterfaceCreateTypeFactory */
    : modelCreateOneHandlerFactory(modelType);
};

export const readOneHandlerFactory = (modelType: AMModelType) => {
  return modelType.mmAbstract
    ? defaultObjectFieldVisitorHandler /* For abstract interface we create operations inside AMInterfaceCreateTypeFactory */
    : modelReadOneHandlerFactory(modelType);
};
