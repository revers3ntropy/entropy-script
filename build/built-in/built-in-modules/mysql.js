import { ESFunction } from '../../runtime/primitiveTypes.js';
import { str } from '../../util/util.js';
export default function (mysql, print) {
    const connect = new ESFunction(({ context }, options_) => {
        const options = options_.valueOf() || {};
        const connection = new mysql(options);
        const query = new ESFunction(({ context }, query) => {
            return connection.query(str(query));
        }, [], 'queryMySQL');
        query.info = Object.assign(Object.assign({}, query.info), { description: 'Queries MySQl database synchronously.', args: [{
                    name: 'query',
                    type: 'string',
                    required: true
                }] });
        return query;
    });
    connect.info = Object.assign(Object.assign({}, connect.info), { description: 'Connect to a MySQl database', args: [{
                name: 'options',
                type: '{ host: string, user: string, password: string, database: string }',
                defaultValue: '{}',
                required: true
            }], returns: 'Query function', returnType: '( (query: string) => object | error | array | void ) | error' });
    return {
        connect
    };
}
