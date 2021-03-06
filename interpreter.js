import { Parser } from "./parser.js";
import { init } from "./linear.js";
let wasm;
init().then(w => {
    wasm = w;
});
class InterpreterError extends Error {
    constructor(message) {
        super(`[Interpreter]: ${message}`);
        this.name = 'InterpreterError';
    }
}
export function evaluate__str(value, context) {
    try {
        const t = new Parser(value);
        return evaluate_stmts(t.parse(), context);
    }
    catch (e) {
        return e.message;
    }
}
function evaluate_stmts(stmts, context) {
    let result = [];
    for (let i = 0; i < stmts.length; i++) {
        const r = evaluate(stmts[i], context);
        if (r.type === 'number') {
            result.push(`${r.value}`);
        }
        else {
            result.push(JSON.stringify(r.value));
        }
    }
    return result.join('\n');
}
function evaluate(stmt, context) {
    if (stmt.type === 'definition') {
        const x = evaluate(stmt.rhs, context);
        context[stmt.lhs.name] = x;
        return x;
    }
    else if (stmt.type === '+') {
        const lhs = evaluate(stmt.lhs, context);
        const rhs = evaluate(stmt.rhs, context);
        if (lhs.type === 'number' && rhs.type === 'number') {
            return {
                type: 'number',
                value: lhs.value + rhs.value
            };
        }
        else if (lhs.type === 'vector' && rhs.type === 'vector') {
            const vector1 = lhs.value;
            const vector2 = rhs.value;
            const N1 = vector1.length;
            const N2 = vector2.length;
            if (N1 === N2) {
                const result = Array(N1);
                for (let i = 0; i < N1; i++) {
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
        else if (lhs.type === 'matrix' && rhs.type === 'matrix') {
            const matrix1 = lhs.value;
            const matrix2 = rhs.value;
            const width = lhs.width;
            const height = lhs.height;
            if (lhs.width === width && lhs.height === height) {
                const N = lhs.width * lhs.height;
                const result = Array(N);
                for (let i = 0; i < N; i++) {
                    result[i] = matrix1[i] + matrix2[i];
                }
                return {
                    type: 'matrix',
                    value: result,
                    width,
                    height
                };
            }
            else {
                throw new InterpreterError('Cannot add matrices of different sizes');
            }
        }
        else {
            throw new InterpreterError('Cannot add two different objects');
        }
    }
    else if (stmt.type === '-') {
        const lhs = evaluate(stmt.lhs, context);
        const rhs = evaluate(stmt.rhs, context);
        if (lhs.type === 'number' && rhs.type === 'number') {
            return {
                type: 'number',
                value: lhs.value + rhs.value
            };
        }
        else if (lhs.type === 'vector' && rhs.type === 'vector') {
            const vector1 = lhs.value;
            const vector2 = rhs.value;
            const N1 = vector1.length;
            const N2 = vector2.length;
            if (N1 === N2) {
                const result = Array(N1);
                for (let i = 0; i < N1; i++) {
                    result[i] = vector1[i] - vector2[i];
                }
            }
            else {
                throw new InterpreterError('Cannot subtract two vectors of different sizes');
            }
        }
        else if (lhs.type === 'matrix' && rhs.type === 'matrix') {
            const matrix1 = lhs.value;
            const matrix2 = rhs.value;
            const width = lhs.width;
            const height = lhs.height;
            if (lhs.width === width && lhs.height === height) {
                const N = lhs.width * lhs.height;
                const result = Array(N);
                for (let i = 0; i < N; i++) {
                    result[i] = matrix1[i] - matrix2[i];
                }
                return {
                    type: 'matrix',
                    value: result,
                    width,
                    height
                };
            }
            else {
                throw new InterpreterError('Cannot add matrices of different sizes');
            }
        }
        else {
            throw new InterpreterError('Cannot subtract two different objects');
        }
    }
    else if (stmt.type === '*') {
        const lhs = evaluate(stmt.lhs, context);
        const rhs = evaluate(stmt.rhs, context);
        if (lhs.type === 'number' && rhs.type === 'number') {
            return {
                type: 'number',
                value: lhs.value * rhs.value
            };
        }
        else if (lhs.type === 'number' && rhs.type === 'vector') {
            const N = rhs.value.length;
            const r = Array(N);
            const v = lhs.value;
            for (let i = 0; i < N; i++) {
                r[i] = v * rhs.value[i];
            }
            return {
                type: 'vector',
                value: r
            };
        }
        else if (lhs.type === 'vector' && rhs.type === 'number') {
            const N = lhs.value.length;
            const r = Array(N);
            const v = rhs.value;
            for (let i = 0; i < N; i++) {
                r[i] = v * lhs.value[i];
            }
            return {
                type: 'vector',
                value: r
            };
        }
        else if (lhs.type === 'matrix' && rhs.type === 'matrix') {
            const matrix1 = lhs.value;
            const matrix2 = rhs.value;
            const width = lhs.width;
            const height = lhs.height;
            if (lhs.width === width && lhs.height === height) {
                const N = lhs.width * lhs.height;
                const result = wasm.multiply(matrix1, matrix2, width);
                return {
                    type: 'matrix',
                    value: result,
                    width,
                    height
                };
            }
            else {
                throw new InterpreterError('Cannot add matrices of different sizes');
            }
        }
        else {
            throw new InterpreterError('Wrong types to multiply');
        }
    }
    else if (stmt.type === '/') {
        const lhs = evaluate(stmt.lhs, context);
        const rhs = evaluate(stmt.rhs, context);
        if (lhs.type === 'number' && rhs.type === 'number') {
            return {
                type: 'number',
                value: lhs.value / rhs.value
            };
        }
        else if (lhs.type === 'vector' && rhs.type === 'number') {
            const N = lhs.value.length;
            const r = Array(N);
            const v = rhs.value;
            for (let i = 0; i < N; i++) {
                r[i] = lhs.value[i] / v;
            }
            return {
                type: 'vector',
                value: r
            };
        }
        else if (lhs.type === 'matrix' && rhs.type === 'matrix') {
            const matrix1 = lhs.value;
            const matrix2 = rhs.value;
            const width = lhs.width;
            const height = lhs.height;
            if (lhs.width === width && lhs.height === height) {
                const N = lhs.width * lhs.height;
                const result = wasm.multiply(matrix1, wasm.inverse(matrix2, width), width);
                return {
                    type: 'matrix',
                    value: result,
                    width,
                    height
                };
            }
            else {
                throw new InterpreterError('Cannot add matrices of different sizes');
            }
        }
        else {
            throw new InterpreterError('Can only divide numbers');
        }
    }
    else if (stmt.type === '^') {
        const lhs = evaluate(stmt.lhs, context);
        const rhs = evaluate(stmt.rhs, context);
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
        const name = stmt.name;
        if (!(name in context)) {
            throw new InterpreterError(`Undefined variable: "${name}"`);
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
        const N = stmt.args.length;
        const r = Array(N);
        for (let i = 0; i < N; i++) {
            const t = evaluate(stmt.args[i], context);
            if (t.type !== 'number') {
                throw new InterpreterError(`Expected number got '${t.type}'`);
            }
            r[i] = t.value;
        }
        return {
            type: 'vector',
            value: r
        };
    }
    else if (stmt.type === 'matrix') {
        const width = stmt.matrix.length;
        const height = stmt.matrix[0].length;
        const r = Array(width * height);
        for (let i = 0; i < width; i++) {
            for (let j = 0; j < height; j++) {
                const t = evaluate(stmt.matrix[i][j], context);
                if (t.type !== 'number') {
                    throw new InterpreterError(`Expected number got '${t.type}'`);
                }
                r[i + j * width] = t.value;
            }
        }
        return {
            type: 'matrix',
            value: r,
            width,
            height
        };
    }
    else if (stmt.type === 'u-') {
        const result = evaluate(stmt.rhs, context);
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
        const name = stmt.name;
        if (name === 'sin') {
            const args = stmt.args;
            if (args.length !== 1) {
                throw new InterpreterError('Wrong number of argument for function sin');
            }
            const result = evaluate(args[0], context);
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
        else if (name === 'cos') {
            const args = stmt.args;
            if (args.length !== 1) {
                throw new InterpreterError('Wrong number of argument for function sin');
            }
            const result = evaluate(args[0], context);
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
        else if (name === 'tan') {
            const args = stmt.args;
            if (args.length !== 1) {
                throw new InterpreterError('Wrong number of argument for function sin');
            }
            const result = evaluate(args[0], context);
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
            throw new InterpreterError(`Undefined function "${name}"`);
        }
    }
    throw new InterpreterError(`Unexpected node type: ${stmt.type}`);
}
//# sourceMappingURL=interpreter.js.map