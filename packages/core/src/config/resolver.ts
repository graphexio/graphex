import {
  AMConfig,
  AMModelType,
  AMSchemaInfo,
  AMTypeFactory,
} from '../definitions';
import {
  GraphQLNamedType,
  GraphQLInputType,
  GraphQLInputObjectType,
} from 'graphql';

export class AMConfigResolver {
  private config: AMConfig;
  private schemaInfo: AMSchemaInfo;

  constructor(params: { configs: AMConfig[]; schemaInfo: AMSchemaInfo }) {
    this.config = params.configs[0];
    this.schemaInfo = params.schemaInfo;
  }

  private getNamespace(type: AMModelType) {
    const typeName = type.name;
    return this.config[typeName] || this.config._default;
  }

  resolveMethodFactory(type: AMModelType, link: string) {
    const factoryItem = this.getNamespace(type).methodFactories[link];
    if (!factoryItem) throw new Error('Unknown factory');
    return new factoryItem.factory({
      links: factoryItem.links,
      schemaInfo: this.schemaInfo,
      configResolver: this,
    });
  }

  resolveTypeFactory(type: AMModelType, link: string) {
    const factoryItem = this.getNamespace(type).typeFactories[link];
    if (!factoryItem)
      throw new Error(`Unknown factory ${link} for type ${type.name}`);
    return new factoryItem.factory({
      links: factoryItem.links,
      schemaInfo: this.schemaInfo,
      configResolver: this,
    });
  }

  resolveType(inputType: AMModelType, link: string | string[]) {
    let typeFactory: AMTypeFactory<GraphQLNamedType>;
    if (Array.isArray(link)) {
      typeFactory = link
        .map(l => this.resolveTypeFactory(inputType, l))
        .find(factory => factory.isApplicable(inputType));
    } else {
      typeFactory = this.resolveTypeFactory(inputType, link);
    }
    if (!typeFactory) {
      throw new Error(
        `Now factory for type ${inputType.name} and link: ${link}`
      );
    }
    return this.schemaInfo.resolveFactoryType(inputType, typeFactory);
  }

  resolveInputTypeFactory(type: AMModelType, link: string) {
    const factoryItem = this.getNamespace(type).inputTypeFactories[link];
    if (!factoryItem)
      throw new Error(`Unknown factory ${link} for type ${type.name}`);
    return new factoryItem.factory({
      links: factoryItem.links,
      schemaInfo: this.schemaInfo,
      configResolver: this,
    });
  }

  resolveInputType(inputType: AMModelType, link: string | string[]) {
    let typeFactory: AMTypeFactory<GraphQLInputObjectType>;
    if (Array.isArray(link)) {
      typeFactory = link
        .map(l => this.resolveInputTypeFactory(inputType, l))
        .find(factory => factory.isApplicable(inputType));
    } else {
      typeFactory = this.resolveInputTypeFactory(inputType, link);
    }
    if (!typeFactory) {
      throw new Error(
        `Now factory for type ${inputType.name} and link: ${link}`
      );
    }
    return this.schemaInfo.resolveFactoryType(inputType, typeFactory);
  }

  resolveInputFieldFactory(type: AMModelType, link: string) {
    const factoryItem = this.getNamespace(type).inputFieldFactories[link];
    if (!factoryItem)
      throw new Error(`Unknown factory ${link} for type ${type.name}`);
    return new factoryItem.factory({
      links: factoryItem.links,
      schemaInfo: this.schemaInfo,
      configResolver: this,
    });
  }

  resolveInputFieldFactories(type: AMModelType, links: string[]) {
    return links.map(link => this.resolveInputFieldFactory(type, link));
  }
}
