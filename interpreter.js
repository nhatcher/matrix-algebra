var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import { Parser } from "./parser.js";
var InterpreterError = (function (_super) {
    __extends(InterpreterError, _super);
    function InterpreterError(message) {
        var _this = _super.call(this, "[Interpreter]: " + message) || this;
        _this.name = 'InterpreterError';
        return _this;
    }
    return InterpreterError;
}(Error));
export function evaluate__str(value, context) {
    try {
        var t = new Parser(value);
        return evaluate_stmts(t.parse(), context);
    }
    catch (e) {
        return e.message;
    }
}
function evaluate_stmts(stmts, context) {
    var result = [];
    for (var i = 0; i < stmts.length; i++) {
        var r = evaluate(stmts[i], context);
        if (r.type === 'number') {
            result.push("" + r.value);
        }
        else {
            result.push(JSON.stringify(r.value));
        }
    }
    return result.join('\n');
}
function evaluate(stmt, context) {
    if (stmt.type === 'definition') {
        var x = evaluate(stmt.rhs, context);
        context[stmt.lhs.name] = x;
        return x;
    }
    else if (stmt.type === '+') {
        var lhs = evaluate(stmt.lhs, context);
        var rhs = evaluate(stmt.rhs, context);
        if (lhs.type === 'number' && rhs.type === 'number') {
            return {
                type: 'number',
                value: lhs.value + rhs.value
            };
        }
        else if (lhs.type === 'vector' && rhs.type === 'vector') {
            var vector1 = lhs.value;
            var vector2 = rhs.value;
            var N1 = vector1.length;
            var N2 = vector2.length;
            if (N1 == N2) {
                var result = Array(N1);
                for (var i = 0; i < N1; i++) {
                    result[i] = vector1[i] + vector2[i];
                }
                return {
                    type: 'vector',
                    value: result
                };
            }
            else {
                throw new InterpreterError('Cannot add two vectors of different sizes');
            }
        }
        else {
            throw new InterpreterError('Cannot add two different objects');
        }
    }
    else if (stmt.type === '-') {
        var lhs = evaluate(stmt.lhs, context);
        var rhs = evaluate(stmt.rhs, context);
        if (lhs.type === 'number' && rhs.type === 'number') {
            return {
                type: 'number',
                value: lhs.value + rhs.value
            };
        }
        else if (lhs.type === 'vector' && rhs.type === 'vector') {
            var vector1 = lhs.value;
            var vector2 = rhs.value;
            var N1 = vector1.length;
            var N2 = vector2.length;
            if (N1 == N2) {
                var result = Array(N1);
                for (var i = 0; i < N1; i++) {
                    result[i] = vector1[i] - vector2[i];
                }
            }
            else {
                throw new InterpreterError('Cannot subtract two vectors of different sizes');
            }
        }
        else {
            throw new InterpreterError('Cannot subtract two different objects');
        }
    }
    else if (stmt.type === '*') {
        var lhs = evaluate(stmt.lhs, context);
        var rhs = evaluate(stmt.rhs, context);
        if (lhs.type === 'number' && rhs.type === 'number') {
            return {
                type: 'number',
                value: lhs.value * rhs.value
            };
        }
        else if (lhs.type === 'number' && rhs.type === 'vector') {
            var N = rhs.value.length;
            var r = Array(N);
            var v = lhs.value;
            for (var i = 0; i < N; i++) {
                r[i] = v * rhs.value[i];
            }
            return {
                type: 'vector',
                value: r
            };
        }
        else if (lhs.type === 'vector' && rhs.type === 'number') {
            var N = lhs.value.length;
            var r = Array(N);
            var v = rhs.value;
            for (var i = 0; i < N; i++) {
                r[i] = v * lhs.value[i];
            }
            return {
                type: 'vector',
                value: r
            };
        }
        else {
            throw new InterpreterError('Can only multiply numbers');
        }
    }
    else if (stmt.type === '/') {
        var lhs = evaluate(stmt.lhs, context);
        var rhs = evaluate(stmt.rhs, context);
        if (lhs.type === 'number' && rhs.type === 'number') {
            return {
                type: 'number',
                value: lhs.value / rhs.value
            };
        }
        else if (lhs.type === 'vector' && rhs.type === 'number') {
            var N = lhs.value.length;
            var r = Array(N);
            var v = rhs.value;
            for (var i = 0; i < N; i++) {
                r[i] = lhs.value[i] / v;
            }
            return {
                type: 'vector',
                value: r
            };
        }
        else {
            throw new InterpreterError('Can only divide numbers');
        }
    }
    else if (stmt.type === '^') {
        var lhs = evaluate(stmt.lhs, context);
        var rhs = evaluate(stmt.rhs, context);
        if (lhs.type === 'number' && rhs.type === 'number') {
            return {
                type: 'number',
                value: Math.pow(lhs.value, rhs.value)
            };
        }
        else {
            throw new InterpreterError('Can only multiply numbers');
        }
    }
    else if (stmt.type === 'variable') {
        var name_1 = stmt.name;
        if (!(name_1 in context)) {
            throw new InterpreterError("Undefined variable: \"" + name_1 + "\"");
        }
        return context[stmt.name];
    }
    else if (stmt.type === 'number') {
        return {
            type: 'number',
            value: stmt.value
        };
    }
    else if (stmt.type === 'vector') {
        var N = stmt.args.length;
        var r = Array(N);
        for (var i = 0; i < N; i++) {
            var t = evaluate(stmt.args[i], context);
            if (t.type !== 'number') {
                throw new InterpreterError("Expected number got '" + t.type + "'");
            }
            r[i] = t.value;
        }
        return {
            type: 'vector',
            value: r
        };
    }
    else if (stmt.type === 'u-') {
        var result = evaluate(stmt.rhs, context);
        if (result.type === 'number') {
            return {
                type: 'number',
                value: -result.value
            };
        }
        else {
            throw new InterpreterError('Not implemented');
        }
    }
    else if (stmt.type === 'u+') {
        return evaluate(stmt.rhs, context);
    }
    else if (stmt.type === 'function') {
        var name_2 = stmt.name;
        if (name_2 === 'sin') {
            var args = stmt.args;
            if (args.length !== 1) {
                throw new InterpreterError('Wrong number of argument for function sin');
            }
            var result = evaluate(args[0], context);
            if (result.type === 'number') {
                return {
                    type: 'number',
                    value: Math.sin(result.value)
                };
            }
            else {
                throw new InterpreterError('Not implemented');
            }
        }
        else if (name_2 === 'cos') {
            var args = stmt.args;
            if (args.length !== 1) {
                throw new InterpreterError('Wrong number of argument for function sin');
            }
            var result = evaluate(args[0], context);
            if (result.type === 'number') {
                return {
                    type: 'number',
                    value: Math.cos(result.value)
                };
            }
            else {
                throw new InterpreterError('Not implemented');
            }
        }
        else if (name_2 === 'tan') {
            var args = stmt.args;
            if (args.length !== 1) {
                throw new InterpreterError('Wrong number of argument for function sin');
            }
            var result = evaluate(args[0], context);
            if (result.type === 'number') {
                return {
                    type: 'number',
                    value: Math.tan(result.value)
                };
            }
            else {
                throw new InterpreterError('Not implemented');
            }
        }
        else {
            throw new InterpreterError("Undefined function \"" + name_2 + "\"");
        }
    }
    throw new InterpreterError("Unexpected node type: " + stmt.type);
}
//# sourceMappingURL=interpreter.js.map