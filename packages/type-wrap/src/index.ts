import {
  GraphQLInt,
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLEnumType,
  GraphQLBoolean,
  GraphQLType,
} from 'graphql';
import _ from 'lodash';

function getDirective(field, name) {
  if (field.astNode && field.astNode.directives) {
    return field.astNode.directives.find(
      directive => directive.name.value === name
    );
  }
  return undefined;
}

export default class TypeWrap {
  private _type = null;
  private _realType: GraphQLType = null;
  private _required = false;
  private _many = false;
  private _requiredArrayItem = false;
  private _nested = false;
  private _interface = false;
  private _inherited = null; //deprecated
  private _interfaces = [];
  private _abstract = false;

  constructor(type) {
    if (type instanceof TypeWrap) {
      this._type = type._type;
      this._realType = type._realType;
      this._required = type._required;
      this._many = type._many;
      this._requiredArrayItem = type._requiredArrayItem;
      this._nested = type._nested;
      this._interface = type._interface;
      this._inherited = type._inherited; //deprecated
      this._abstract = type._abstract;
      this._interfaces = type._interfaces;
      return;
    }

    this._type = type;

    let realType = type;

    //required
    if (realType instanceof GraphQLNonNull) {
      this._required = true;
      realType = realType.ofType;
    }

    //array
    if (realType instanceof GraphQLList) {
      this._many = true;
      realType = realType.ofType;
    }

    //required array item
    if (realType instanceof GraphQLNonNull) {
      this._requiredArrayItem = true;
      realType = realType.ofType;
    }

    //object
    this._updateNestedInterface(realType);

    //inherited
    this._interfaces = realType._interfaces;
    if (
      Array.isArray(realType._interfaces) &&
      realType._interfaces.length > 0
    ) {
      this._inherited = _.head(realType._interfaces);
    }

    this._abstract = realType.mmAbstract;
    this._realType = realType;
  }

  _updateNestedInterface = realType => {
    this._nested = false;
    this._interface = false;

    if (
      realType instanceof GraphQLObjectType ||
      realType instanceof GraphQLInputObjectType
    ) {
      this._nested = true;
      this._interface = false;
    } else if (realType instanceof GraphQLInterfaceType) {
      this._nested = true;
      this._interface = true;
    }
  };

  //getters
  realType = () => this._realType;
  isRequired = () => this._required;
  isMany = () => this._many;
  isRequiredArrayItem = () => this._requiredArrayItem;
  isNested = () => this._nested;
  isInterface = () => this._interface;
  isInherited = () => _.size(this._interfaces) > 0;
  isAbstract = () => Boolean(this._abstract);
  interfaceType = () => this._inherited; //deprecated
  interfaceWithDirective = directive => {
    return _.find(this._interfaces, iface => getDirective(iface, directive));
  };
  clone = () => {
    return new TypeWrap(this);
  };
  type = () => {
    let type = this._realType;
    if (this._requiredArrayItem && this._many) {
      type = new GraphQLNonNull(type);
    }
    if (this._many) {
      type = new GraphQLList(type);
    }
    if (this._required) {
      type = new GraphQLNonNull(type);
    }
    return type;
  };

  //setters
  setRealType = realType => {
    this._realType = realType;
    this._updateNestedInterface(realType);
    return this;
  };
  setRequired = value => {
    this._required = Boolean(value);
    return this;
  };
  setMany = value => {
    this._many = Boolean(value);
    return this;
  };
  setRequiredArrayItem = value => {
    this._requiredArrayItem = Boolean(value);
    return this;
  };
}
