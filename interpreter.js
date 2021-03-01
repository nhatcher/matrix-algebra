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
        result.push("" + evaluate(stmts[i], context));
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
        return evaluate(stmt.lhs, context) + evaluate(stmt.rhs, context);
    }
    else if (stmt.type === '-') {
        return evaluate(stmt.lhs, context) - evaluate(stmt.rhs, context);
    }
    else if (stmt.type === '*') {
        return evaluate(stmt.lhs, context) * evaluate(stmt.rhs, context);
    }
    else if (stmt.type === '/') {
        return evaluate(stmt.lhs, context) / evaluate(stmt.rhs, context);
    }
    else if (stmt.type === '^') {
        return Math.pow(evaluate(stmt.lhs, context), evaluate(stmt.rhs, context));
    }
    else if (stmt.type === 'variable') {
        var name_1 = stmt.name;
        if (!(name_1 in context)) {
            throw new InterpreterError("Undefined variable: \"" + name_1 + "\"");
        }
        return context[stmt.name];
    }
    else if (stmt.type === 'number') {
        return stmt.value;
    }
    else if (stmt.type === 'u-') {
        return -evaluate(stmt.rhs, context);
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
            return Math.sin(evaluate(args[0], context));
        }
        else if (name_2 === 'cos') {
            var args = stmt.args;
            if (args.length !== 1) {
                throw new InterpreterError('Wrong number of argument for function cos');
            }
            return Math.cos(evaluate(args[0], context));
        }
        else if (name_2 === 'tan') {
            var args = stmt.args;
            if (args.length !== 1) {
                throw new InterpreterError('Wrong number of argument for function tan');
            }
            return Math.tan(evaluate(args[0], context));
        }
        else {
            throw new InterpreterError("Undefined function \"" + name_2 + "\"");
        }
    }
    throw new InterpreterError("Unexpected node type: " + stmt.type);
}
//# sourceMappingURL=interpreter.js.map