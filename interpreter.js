import { Parser } from "./parser.js";
export function evaluate__str(value, context) {
    var t = new Parser(value);
    return evaluate_stmts(t.parse(), context);
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
        var name_1 = stmt.name;
        if (name_1 === 'sin') {
            var args = stmt.args;
            if (args.length !== 1) {
                throw new Error('Wrong number of argument for function sin');
            }
            return Math.sin(evaluate(args[0], context));
        }
        else if (name_1 === 'cos') {
            var args = stmt.args;
            if (args.length !== 1) {
                throw new Error('Wrong number of argument for function cos');
            }
            return Math.cos(evaluate(args[0], context));
        }
        else if (name_1 === 'tan') {
            var args = stmt.args;
            if (args.length !== 1) {
                throw new Error('Wrong number of argument for function tan');
            }
            return Math.tan(evaluate(args[0], context));
        }
        else {
            throw new Error("Undefined function name " + name_1);
        }
    }
    throw new Error("Unexpected node type: " + stmt.type);
}
//# sourceMappingURL=interpreter.js.map