/**
 * empower - Power Assert feature enhancer for assert function/object.
 *
 * https://github.com/power-assert-js/empower
 *
 * Copyright (c) 2013-2015 Takuto Wada
 * Licensed under the MIT license.
 *   https://github.com/power-assert-js/empower/blob/master/MIT-LICENSE.txt
 */
var defaultOptions = require('./lib/default-options');
var Decorator = require('./lib/decorator');
var capturable = require('./lib/capturable');
var create = require('object-create');
var slice = Array.prototype.slice;
var extend = require('xtend/mutable');
var define = require('define-properties');

/**
 * Enhance Power Assert feature to assert function/object.
 * @param assert target assert function or object to enhance
 * @param options enhancement options
 * @return enhanced assert function/object
 */
function empower (assert, options) {
    var typeOfAssert = (typeof assert);
    var enhancedAssert;
    if ((typeOfAssert !== 'object' && typeOfAssert !== 'function') || assert === null) {
        throw new TypeError('empower argument should be a function or object.');
    }
    if (isEmpowered(assert)) {
        return assert;
    }
    switch (typeOfAssert) {
    case 'function':
        enhancedAssert = empowerAssertFunction(assert, options);
        break;
    case 'object':
        enhancedAssert = empowerAssertObject(assert, options);
        break;
    default:
        throw new Error('Cannot be here');
    }
    define(enhancedAssert, capturable());
    return enhancedAssert;
}

function empowerAssertObject (assertObject, options) {
    var config = extend(defaultOptions(), options);
    var target = config.destructive ? assertObject : create(assertObject);
    var decorator = new Decorator(target, config);
    return extend(target, decorator.enhancement());
}

function empowerAssertFunction (assertFunction, options) {
    var config = extend(defaultOptions(), options);
    if (config.destructive) {
        throw new Error('cannot use destructive:true to function.');
    }
    var decorator = new Decorator(assertFunction, config);
    var enhancement = decorator.enhancement();
    var powerAssert;
    if (typeof enhancement === 'function') {
        powerAssert = function powerAssert () {
            return enhancement.apply(null, slice.apply(arguments));
        };
    } else {
        powerAssert = function powerAssert () {
            return assertFunction.apply(null, slice.apply(arguments));
        };
    }
    extend(powerAssert, assertFunction);
    return extend(powerAssert, enhancement);
}

function isEmpowered (assertObjectOrFunction) {
    return (typeof assertObjectOrFunction._capt === 'function') && (typeof assertObjectOrFunction._expr === 'function');
}

empower.defaultOptions = defaultOptions;
module.exports = empower;
