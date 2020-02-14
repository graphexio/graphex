import {
  GraphQLList,
  GraphQLInputFieldConfig,
  isInterfaceType,
  getNamedType,
} from 'graphql';
import {
  AMInputFieldConfigMap,
  AMInputObjectType,
  AMModelField,
  IAMQuerySelector,
  AMTypeFactory,
  AMModelType,
} from '../definitions';
import { getSelectors } from './querySelectors';
import {
  defaultObjectFieldVisitorHandler,
  whereTypeVisitorHandler,
} from './visitorHandlers';
import { AMWhereACLTypeFactory } from './whereACL';

export class AMWhereTypeFactory extends AMTypeFactory<AMInputObjectType> {
  isApplicable(type: AMModelType) {
    return !isInterfaceType(type);
  }
  getTypeName(modelType: AMModelType): string {
    return `${modelType.name}WhereInput`;
  }
  getType(modelType: AMModelType) {
    return new AMInputObjectType({
      name: this.getTypeName(modelType),
      fields: () => {
        const fields = <AMInputFieldConfigMap>{};

        if (this.schemaInfo.options.aclWhere) {
          fields.aclWhere = <GraphQLInputFieldConfig>{
            type: this.configResolver.resolveInputType(
              modelType,
              this.links.whereACL
            ),
            ...defaultObjectFieldVisitorHandler('aclWhere'),
          };
        }

        fields.AND = {
          type: new GraphQLList(
            this.configResolver.resolveInputType(modelType, this.links.and)
          ),
          ...defaultObjectFieldVisitorHandler('$and'),
        };
        fields.OR = {
          type: new GraphQLList(
            this.configResolver.resolveInputType(modelType, this.links.or)
          ),
          ...defaultObjectFieldVisitorHandler('$or'),
        };

        Object.values(modelType.getFields()).forEach(field => {
          const fieldType = getNamedType(field.type) as AMModelType;
          let links = this.links.selectors;
          if (!Array.isArray(links)) links = [links];

          const fieldFactories = this.configResolver
            .resolveInputFieldFactories(fieldType, links)
            .filter(factory => factory.isApplicable(field));

          fieldFactories.forEach(factory => {
            const fieldName = factory.getFieldName(field);
            fields[fieldName] = factory.getField(field);
          });
        });

        return fields;
      },
      ...whereTypeVisitorHandler(),
    });
  }
}
