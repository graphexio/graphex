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
  GraphQLEnumType,
  GraphQLScalarType,
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

  private getDefaultNamespace() {
    return this.config._default;
  }

  resolveMethodFactory(type: AMModelType, link: string) {
    let factoryItem = this.getNamespace(type).methodFactories
      ? this.getNamespace(type).methodFactories[link]
      : undefined;
    if (!factoryItem) {
      factoryItem = this.getDefaultNamespace().methodFactories[link];
    }
    if (!factoryItem) throw new Error('Unknown factory');
    return new factoryItem.factory({
      links: factoryItem.links,
      dynamicLinks: factoryItem.dynamicLinks,
      schemaInfo: this.schemaInfo,
      configResolver: this,
    });
  }

  resolveTypeFactory(type: AMModelType, link: string) {
    let factoryItem = this.getNamespace(type).typeFactories
      ? this.getNamespace(type).typeFactories[link]
      : undefined;
    if (!factoryItem) {
      factoryItem = this.getDefaultNamespace().typeFactories[link];
    }
    if (!factoryItem)
      throw new Error(`Unknown factory ${link} for type ${type.name}`);
    return new factoryItem.factory({
      links: factoryItem.links,
      dynamicLinks: factoryItem.dynamicLinks,
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
    // if (type.name === 'GeoJSONPoint') {
    // console.log('inputType', type, link);
    // }
    let factoryItem = this.getNamespace(type).inputTypeFactories
      ? this.getNamespace(type).inputTypeFactories[link]
      : undefined;
    if (!factoryItem) {
      factoryItem = this.getDefaultNamespace().inputTypeFactories[link];
    }
    if (!factoryItem)
      throw new Error(`Unknown factory ${link} for type ${type.name}`);
    return new factoryItem.factory({
      links: factoryItem.links,
      dynamicLinks: factoryItem.dynamicLinks,
      schemaInfo: this.schemaInfo,
      configResolver: this,
    });
  }

  resolveInputType(inputType: AMModelType, link: string | string[]) {
    let typeFactory: AMTypeFactory<
      GraphQLInputObjectType | GraphQLEnumType | GraphQLScalarType
    >;
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
    let factoryItem = this.getNamespace(type).inputFieldFactories
      ? this.getNamespace(type).inputFieldFactories[link]
      : undefined;
    if (!factoryItem) {
      factoryItem = this.getDefaultNamespace().inputFieldFactories[link];
    }
    if (!factoryItem)
      throw new Error(`Unknown factory ${link} for type ${type.name}`);
    return new factoryItem.factory({
      links: factoryItem.links,
      dynamicLinks: factoryItem.dynamicLinks,
      schemaInfo: this.schemaInfo,
      configResolver: this,
    });
  }

  resolveInputFieldFactories(type: AMModelType, links: string[]) {
    return links.map(link => this.resolveInputFieldFactory(type, link));
  }

  resolveFieldFactory(type: AMModelType, link: string) {
    let factoryItem = this.getNamespace(type).fieldFactories
      ? this.getNamespace(type).fieldFactories[link]
      : undefined;
    if (!factoryItem) {
      factoryItem = this.getDefaultNamespace()?.fieldFactories[link];
    }
    if (!factoryItem)
      throw new Error(`Unknown factory ${link} for type ${type.name}`);
    return new factoryItem.factory({
      links: factoryItem.links,
      dynamicLinks: factoryItem.dynamicLinks,
      schemaInfo: this.schemaInfo,
      configResolver: this,
    });
  }

  resolveFieldFactories(type: AMModelType, links: string[]) {
    return links.map(link => this.resolveFieldFactory(type, link));
  }
}
