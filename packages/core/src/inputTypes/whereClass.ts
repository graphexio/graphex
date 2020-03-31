import {
  getNamedType,
  GraphQLInputFieldConfig,
  GraphQLList,
  isInterfaceType,
} from 'graphql';
import {
  AMInputFieldConfigMap,
  AMInputObjectType,
  AMModelType,
  AMTypeFactory,
} from '../definitions';
import {
  defaultObjectFieldVisitorHandler,
  whereTypeVisitorHandler,
} from './visitorHandlers';

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
          let links = this.getDynamicLinksForType(fieldType.name).selectors;
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
