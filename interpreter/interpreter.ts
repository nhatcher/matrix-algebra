import { Parser, Node } from "./parser.js";

interface Value {
    text: string
}

class InterpreterError extends Error {
    constructor(message: string) {
        super(`[Interpreter]: ${message}`);
        this.name = 'InterpreterError';
    }
}

export function evaluate__str(value: string, context: any): string {
    try {
        const t = new Parser(value);
        return evaluate_stmts(t.parse(), context);
    } catch(e) {
        return e.message;
    }
}

function evaluate_stmts(stmts: Node[], context: any): string {
    let result = [];
    for (let i = 0; i < stmts.length; i++) {
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
        const name = stmt.name;
        if (!(name in context)) {
            throw new InterpreterError(`Undefined variable: "${name}"`);
        }
        return context[stmt.name];
    } else if (stmt.type === 'number') {
        return stmt.value;
    } else if (stmt.type === 'u-') {
        return -evaluate(stmt.rhs, context);
    } else if (stmt.type === 'u+') {
        return evaluate(stmt.rhs, context);
    } else if (stmt.type === 'function') {
        const name = stmt.name;
        if (name === 'sin') {
            const args = stmt.args;
            if (args.length !== 1) {
                throw new InterpreterError('Wrong number of argument for function sin');
            }
            return Math.sin(evaluate(args[0], context));
        } else if (name === 'cos') {
            const args = stmt.args;
            if (args.length !== 1) {
                throw new InterpreterError('Wrong number of argument for function cos');
            }
            return Math.cos(evaluate(args[0], context));
        } else if (name === 'tan') {
            const args = stmt.args;
            if (args.length !== 1) {
                throw new InterpreterError('Wrong number of argument for function tan');
            }
            return Math.tan(evaluate(args[0], context));
        } else {
            throw new InterpreterError(`Undefined function "${name}"`);
        }
    }
    throw new InterpreterError(`Unexpected node type: ${stmt.type}`);
}