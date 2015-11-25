'use strict';

var signature = require('call-signature');
var forEach = require('array-foreach');
var map = require('array-map');
var filter = require('array-filter');
var decorate = require('./decorate');


function Decorator (receiver, config) {
    this.receiver = receiver;
    this.config = config;
    this.onError = config.onError;
    this.onSuccess = config.onSuccess;
    this.signatures = map(config.patterns, signature.parse);
}

Decorator.prototype.enhancement = function () {
    var that = this;
    var container = this.container();
    forEach(filter(this.signatures, methodCall), function (matcher) {
        var methodName = detectMethodName(matcher.callee);
        if (typeof that.receiver[methodName] === 'function') {
            var callSpec = {
                thisObj: that.receiver,
                func: that.receiver[methodName],
                numArgsToCapture: numberOfArgumentsToCapture(matcher)
            };
            container[methodName] = decorate(callSpec, that);
        }
    });
    return container;
};

Decorator.prototype.container = function () {
    var basement = {};
    if (typeof this.receiver === 'function') {
        var candidates = filter(this.signatures, functionCall);
        if (candidates.length === 1) {
            var callSpec = {
                thisObj: null,
                func: this.receiver,
                numArgsToCapture: numberOfArgumentsToCapture(candidates[0])
            };
            basement = decorate(callSpec, this);
        }
    }
    return basement;
};

Decorator.prototype.concreteAssert = function (invocation, context) {
    var func = invocation.func;
    var thisObj = invocation.thisObj;
    var args = invocation.values;
    var message = invocation.message;
    var ret;
    try {
        ret = func.apply(thisObj, args.concat(message));
    } catch (e) {
        return this.onError({error: e, originalMessage: message, powerAssertContext: context});
    }
    return this.onSuccess({returnValue: ret, originalMessage: message, powerAssertContext: context});
};

Decorator.prototype.fallbackAssert = function (invocation) {
    var func = invocation.func;
    var thisObj = invocation.thisObj;
    var args = invocation.values;
    var message = invocation.message;
    args = args.concat(message);
    var ret;
    try {
        ret = func.apply(thisObj, args);
    } catch (e) {
        return this.onError({error: e, originalMessage: message, args: args});
    }
    return this.onSuccess({returnValue: ret, originalMessage: message, args: args});
};

function numberOfArgumentsToCapture (matcher) {
    var len = matcher.args.length;
    var lastArg;
    if (0 < len) {
        lastArg = matcher.args[len - 1];
        if (lastArg.name === 'message' && lastArg.optional) {
            len -= 1;
        }
    }
    return len;
}


function detectMethodName (callee) {
    if (callee.type === 'MemberExpression') {
        return callee.member;
    }
    return null;
}


function functionCall (matcher) {
    return matcher.callee.type === 'Identifier';
}


function methodCall (matcher) {
    return matcher.callee.type === 'MemberExpression';
}


module.exports = Decorator;
