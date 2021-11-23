import {ESFunction, Primitive} from '../../runtime/primitiveTypes.js';
import {str} from '../../util/util.js';

export default function (mysql: any, print: (...args: string[]) => void) {

    const connect = new ESFunction(({context}, options_) => {
        const options: {
            host: string,
            user: string,
            password: string,
            database: string
        } = options_.valueOf() || {};
        const connection: any = new mysql(options);
        const query = new ESFunction(
            ({context}, query: Primitive) => {
                return connection.query(str(query))
            }, [], 'queryMySQL'
        );

        query.info = {
            ...query.info,
            description: 'Queries MySQl database synchronously.',
            args: [{
                name: 'query',
                type: 'string',
                required: true
            }]
        };

        return query;
    });

    connect.info = {
        ...connect.info,
        description: 'Connect to a MySQl database',
        args: [{
            name: 'options',
            type: '{ host: string, user: string, password: string, database: string }',
            defaultValue: '{}',
            required: true
        }],
        returns: 'Query function',
        returnType: '( (query: string) => object | error | array | void ) | error'
    }

    return {
        connect
    }
}