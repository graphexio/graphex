export default class SDLSyntaxException extends Error {
  constructor(description, code, relatedObjects) {
    super();
    this.description = description;
    this.code = code;
    this.relatedObjects = relatedObjects;
  }

  toString = () => this.description;
}
