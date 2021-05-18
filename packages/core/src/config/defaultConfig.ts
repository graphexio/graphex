import { AMConfig } from '../definitions';
import { methodFactories } from './methodFactories';
import { typeFactories } from './typeFactories';
import { inputTypeFactories } from './inputTypeFactories';
import { inputFieldFactories } from './inputFieldFactories';
import { fieldFactories } from './fieldFactories';

const config = {
  _default: {
    methodFactories,
    typeFactories,
    fieldFactories,
    inputTypeFactories,
    inputFieldFactories,
  },
};

export function buildConfigType<T extends AMConfig>(config: T): T {
  return config;
}

export const defaultConfig = buildConfigType(config);
