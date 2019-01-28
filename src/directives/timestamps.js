import _ from 'lodash';

import {SchemaDirectiveVisitor} from 'graphql-tools';

export class TimestampDirective extends SchemaDirectiveVisitor {
    _setDate = (fieldName, dbName) => params => {
        if (!dbName) {
            dbName = fieldName;
        }
        return {
            ..._.omit(params, fieldName),
            [dbName]: new Date(),
        };
    }
}

export function TimestampResolver(next, source, args, ctx, info) {
    const {name} = args;
    if (name) {
        info.fieldName = name;
    }
    return next();
}
