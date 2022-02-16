import { ESError, IndexError, ReferenceError, TypeError } from '../../errors.js';
import { Position } from '../../position.js';
import { ESFunction, ESType } from '../../runtime/primitiveTypes.js';
import { wrap } from '../../runtime/primitives/wrapStrip.js';
import { ESObject, ESString } from '../../runtime/primitiveTypes.js';
import { str } from '../../util/util.js';
const NODE_KEY = new ESString('node');
function getThisFromContext(context) {
    const self = context.get('this');
    if (self instanceof ESError) {
        return self;
    }
    if (!(self instanceof ESObject)) {
        return new TypeError(Position.unknown, 'object', '~object');
    }
    return self;
}
function getDomNode(context) {
    const self = getThisFromContext(context);
    if (!(self instanceof ESObject)) {
        return self;
    }
    if (!self.hasProperty({ context }, NODE_KEY)) {
        return new IndexError(Position.unknown, 'node', self);
    }
    let val = self.__getProperty__({ context }, NODE_KEY).valueOf();
    if (!(val instanceof HTMLElement)) {
        return new TypeError(Position.unknown, 'JS DOM Node', typeof val);
    }
    return val;
}
const DOMNode = new ESType(false, 'DOMNode', [
    new ESFunction(({ context }, content) => {
        const node = getDomNode(context);
        if (!(node instanceof HTMLElement)) {
            return node;
        }
        if (content instanceof ESString) {
            node.innerHTML = str(content);
        }
        return wrap(node.innerHTML);
    }, undefined, 'html')
], undefined, new ESFunction(({ context }, domNode) => {
    const self = getThisFromContext(context);
    if (!(self instanceof ESObject)) {
        return self;
    }
    const res = self.__setProperty__({ context }, NODE_KEY, domNode);
    if (res instanceof ESError) {
        return res;
    }
}));
const module = {
    DOMNode,
    $: ({ context }, arg) => {
        if (!window || !document) {
            return new ESError(Position.unknown, 'RunTimeError', `Invalid JavaScript runtime for using dom module - must be in browser`);
        }
        const element = document.querySelector(str(arg));
        if (element == null) {
            return new ReferenceError(Position.unknown, str(arg));
        }
        return DOMNode.__call__({ context }, element);
    },
    'test': 1,
};
export default module;
