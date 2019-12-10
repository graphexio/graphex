export const UNMARKED_OBJECT_FIELD = 'unmarkedObjectField';

export default class SDLSyntaxException extends Error {
  description: string;
  code: string;
  relatedObjects: any[];
  constructor(description: string, code: string, relatedObjects: any[]) {
    super();
    this.description = description;
    this.code = code;
    this.relatedObjects = relatedObjects;
  }

  toString = () => this.description;
}
