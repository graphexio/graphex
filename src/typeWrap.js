import {
  GraphQLInt,
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLEnumType,
  GraphQLBoolean,
} from 'graphql';
import _ from 'lodash';

export default class TypeWrap {
  _type = null;
  _realType = null;
  _required = false;
  _many = false;
  _requiredArrayItem = false;
  _nested = false;
  _interface = false;
  _inherited = null;

  constructor(type) {
    if (type instanceof TypeWrap) {
      this._type = type._type;
      this._realType = type._realType;
      this._required = type._required;
      this._many = type._many;
      this._requiredArrayItem = type._requiredArrayItem;
      this._nested = type._nested;
      this._interface = type._interface;
      this._inherited = type._inherited;
      this._abstract = type._abstract;
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
    if (_.isArray(realType._interfaces) && realType._interfaces.length > 0) {
      this._inherited = _.head(realType._interfaces);
      this._abstract = realType.mmAbstract;
    }

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
  isInherited = () => Boolean(this._inherited);
  isAbstract = () => this._abstract;
  interfaceType = () => this._inherited;
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
