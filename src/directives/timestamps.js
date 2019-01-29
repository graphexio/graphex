import _ from 'lodash';
import {SchemaDirectiveVisitor} from 'graphql-tools';

export class TimestampDirective extends SchemaDirectiveVisitor {
    _setDateCreate = (fieldName) => params => {
        return {
            ..._.omit(params, fieldName),
            [fieldName]: new Date()
        };
    };
    _setDateUpdate = (fieldName) => params => {
        return {
            ..._.omit(params, fieldName),
            [fieldName]: new Date().toISOString(),
        };
    };
}

export function TimestampResolver(next, source, args, ctx, info) {
    return next();
}
