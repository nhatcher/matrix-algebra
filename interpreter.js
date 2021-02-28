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
    throw new Error("Unexpected node type: " + stmt.type);
}
//# sourceMappingURL=interpreter.js.map