import { Selector, AND, OR, OPERATORS } from './selector';

const tryGetOperator = (obj: any) => {
  if (typeof obj === 'object') {
    const firstKey = Reflect.ownKeys(obj)[0];
    if (OPERATORS.includes(firstKey as any)) {
      return [firstKey as symbol, obj[firstKey]] as const;
    }
  }
  return [null, null] as const;
};

export const createSelectorReducer = <Chunk>({
  toChunk,
  andToChunk,
  orToChunk,
  operatorToChunk,
  mergeChunks,
}: {
  toChunk: (key: string, value: any) => Chunk;
  andToChunk: (chunks: Chunk[]) => Chunk;
  orToChunk: (chunks: Chunk[]) => Chunk;
  operatorToChunk: Partial<
    Record<typeof OPERATORS[number], (key: string, value: any) => Chunk>
  >;
  mergeChunks: (chunks: Chunk[]) => any;
}) => {
  const reducer = (selector: Selector) => {
    if (!selector) return selector;

    const items = Reflect.ownKeys(selector).map(key => {
      if (key === AND) {
        return andToChunk(selector[AND].map(reducer));
      } else if (key === OR) {
        return orToChunk(selector[OR].map(reducer));
      }

      const value = selector[key as any];
      const [operator, rightValue] = tryGetOperator(value);
      if (operator) {
        if (operatorToChunk[operator]) {
          return operatorToChunk[operator](key as string, rightValue);
        } else {
          throw new Error(`Unsupported operator ${operator.description}`);
        }
      }

      return toChunk(key as string, value);
    });

    return mergeChunks(items);
  };

  return reducer;
};
