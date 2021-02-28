import { Parser, Node } from "./parser.js";

interface Value {
    text: string
}

export function evaluate__str(value: string, context: any): string {
    const t = new Parser(value);
    return evaluate_stmts(t.parse(), context);
}

function evaluate_stmts(stmts: Node[], context: any): string {
    let result = [];
    for (let i=0; i<stmts.length; i++) {
        result.push(`${evaluate(stmts[i], context)}`);
    }
    return result.join('\n');
}

function evaluate(stmt: Node, context: any): number {
    if (stmt.type === 'definition') {
        const x = evaluate(stmt.rhs, context);
        context[stmt.lhs.name] = x;
        return x;
    } else if (stmt.type === '+') {
        return evaluate(stmt.lhs, context) + evaluate(stmt.rhs, context);
    } else if (stmt.type === '-') {
        return evaluate(stmt.lhs, context) - evaluate(stmt.rhs, context);
    } else if (stmt.type === '*') {
        return evaluate(stmt.lhs, context) * evaluate(stmt.rhs, context);
    } else if (stmt.type === '/') {
        // TODO division by 0
        return evaluate(stmt.lhs, context) / evaluate(stmt.rhs, context);
    } else if (stmt.type === '^') {
        // TODO: ...
        return Math.pow(evaluate(stmt.lhs, context), evaluate(stmt.rhs, context));
    } else if (stmt.type === 'variable') {
        return context[stmt.name];
    } else if (stmt.type === 'number') {
        return stmt.value;
    }
    throw new Error(`Unexpected node type: ${stmt.type}`);
}