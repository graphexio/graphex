import { Transformation } from './resultPromise';
import { AMModelType } from '../../definitions';
import { FieldNode } from 'graphql';
import { AMOperation } from '../operation';

export type TransformCondition = Map<string, AMModelType>;

export function findConditionsIntersection(
  cond1: TransformCondition,
  cond2: TransformCondition
) {
  const result: TransformCondition = new Map();
  let smallCond: TransformCondition, bigCond: TransformCondition;
  if (cond1.size < cond2.size) {
    smallCond = cond1;
    bigCond = cond2;
  } else {
    smallCond = cond2;
    bigCond = cond1;
  }
  for (const [k, v] of smallCond.entries()) {
    if (bigCond.has(k)) {
      if (bigCond.get(k) !== v) {
        return null;
      } else {
        result.set(k, v);
      }
    }
  }
  return result;
}

export abstract class RelationTransformation extends Transformation {
  private conditions?: readonly TransformCondition[] = [];
  private fieldNodes?: FieldNode[] = [];
  public dataOp: AMOperation;

  addCondition(cond: TransformCondition) {
    const newConditions = [];
    let currentCond = cond;
    for (const cond of this.conditions) {
      const intersection = findConditionsIntersection(currentCond, cond);
      if (intersection) {
        currentCond = intersection;
      } else {
        newConditions.push(cond);
      }
    }

    newConditions.push(currentCond);
    this.conditions = newConditions;
  }

  getConditions() {
    return this.conditions;
  }

  addFieldNode(node: FieldNode) {
    this.fieldNodes.push(node);
  }
  getFieldNodes() {
    return this.fieldNodes as readonly FieldNode[];
  }
}
