import { Parser, Node } from "./parser.js";
import {init} from "./linear.js";
import {clog, cnorm} from './complex.js';


// FIXME: In the future we could use top level await:
// https://github.com/tc39/proposal-top-level-await
// At the time of writing is on stage 3 and implemented on Chrome 89
let wasm: any;
init().then(w => {
    wasm = w;
})

interface Number {
    type: 'number',
    value: number
}

interface ComplexNumber {
    type: 'complex-number',
    value: [number, number]
}

interface ComplexVector {
    type: 'complex-vector',
    real: number[]
    complex: number[]
}
interface Vector {
    type: 'vector',
    value: number[]
}

interface Matrix {
    type: 'matrix',
    value: Float64Array,
    width: number,
    height: number
}

interface ComplexMatrix {
    type: 'complex-matrix',
    real: Float64Array,
    complex: Float64Array,
    width: number,
    height: number
}

type Value = Number | Vector | Matrix | ComplexNumber | ComplexVector | ComplexMatrix;

class InterpreterError extends Error {
    constructor(message: string) {
        super(`[Interpreter]: ${message}`);
        this.name = 'InterpreterError';
    }
}


export function evaluate_str(value: string, context: any): Value {
    const t = new Parser(value.trim());
    const stmts = t.parse();
    return evaluate(stmts[0], context);
}

function evaluate(stmt: Node, context: any): Value {
    if (stmt.type === 'definition') {
        const x = evaluate(stmt.rhs, context);
        context[stmt.lhs.name] = x;
        return x;
    } else if (stmt.type === '+') {
        const lhs = evaluate(stmt.lhs, context);
        const rhs = evaluate(stmt.rhs, context);
        if (lhs.type === 'number' && rhs.type === 'number') {
            return {
                type: 'number',
                value: lhs.value + rhs.value
            }
        } else if (lhs.type === 'complex-number' && rhs.type === 'complex-number') {
            return {
                type: 'complex-number',
                value: [lhs.value[0] + rhs.value[0], lhs.value[1] + rhs.value[1]]
            }
        } else if (lhs.type === 'complex-number' && rhs.type === 'number') {
            return {
                type: 'complex-number',
                value: [lhs.value[0] + rhs.value, lhs.value[1]]
            }
        } else if (lhs.type === 'number' && rhs.type === 'complex-number') {
            return {
                type: 'complex-number',
                value: [lhs.value + rhs.value[0], rhs.value[1]]
            }
        } else if (lhs.type === 'vector' && rhs.type === 'vector') {
            const vector1 = lhs.value;
            const vector2 = rhs.value;
            const N1 = vector1.length;
            const N2 = vector2.length;
            if (N1 === N2) {
                const result = Array(N1);
                for (let i = 0; i< N1; i++) {
                    result[i] = vector1[i] + vector2[i];
                }
                return {
                    type: 'vector',
                    value: result
                }
            } else {
                throw new InterpreterError('Cannot add two vectors of different sizes');
            }
        } else if (lhs.type === 'matrix' && rhs.type === 'matrix') {
            const matrix1 = lhs.value;
            const matrix2 = rhs.value;
            const width = lhs.width;
            const height = lhs.height;
            if (lhs.width === width && lhs.height === height) {
                const N = lhs.width*lhs.height;
                const result = new Float64Array(N);
                for (let i = 0; i < N; i++) {
                    result[i] = matrix1[i] + matrix2[i];
                }
                return {
                    type: 'matrix',
                    value: result,
                    width,
                    height
                }
            } else {
                throw new InterpreterError('Cannot add matrices of different sizes');
            }
        } else {
            throw new InterpreterError('Cannot add two different objects');
        }
    } else if (stmt.type === '-') {
        const lhs = evaluate(stmt.lhs, context);
        const rhs = evaluate(stmt.rhs, context);
        if (lhs.type === 'number' && rhs.type === 'number') {
            return {
                type: 'number',
                value: lhs.value - rhs.value
            }
        }  else if (lhs.type === 'complex-number' && rhs.type === 'complex-number') {
            return {
                type: 'complex-number',
                value: [lhs.value[0] - rhs.value[0], lhs.value[1] - rhs.value[1]]
            }
        } else if (lhs.type === 'complex-number' && rhs.type === 'number') {
            return {
                type: 'complex-number',
                value: [lhs.value[0] - rhs.value, lhs.value[1]]
            }
        } else if (lhs.type === 'number' && rhs.type === 'complex-number') {
            return {
                type: 'complex-number',
                value: [lhs.value - rhs.value[0], -rhs.value[1]]
            }
        } else if (lhs.type === 'vector' && rhs.type === 'vector') {
            const vector1 = lhs.value;
            const vector2 = rhs.value;
            const N1 = vector1.length;
            const N2 = vector2.length;
            if (N1 === N2) {
                const result = Array(N1);
                for (let i = 0; i< N1; i++) {
                    result[i] = vector1[i] - vector2[i];
                }
            } else {
                throw new InterpreterError('Cannot subtract two vectors of different sizes');
            }
        } else if (lhs.type === 'matrix' && rhs.type === 'matrix') {
            const matrix1 = lhs.value;
            const matrix2 = rhs.value;
            const width = lhs.width;
            const height = lhs.height;
            if (lhs.width === width && lhs.height === height) {
                const N = lhs.width*lhs.height;
                const result = new Float64Array(N);
                for (let i = 0; i < N; i++) {
                    result[i] = matrix1[i] - matrix2[i];
                }
                return {
                    type: 'matrix',
                    value: result,
                    width,
                    height
                }
            } else {
                throw new InterpreterError('Cannot add matrices of different sizes');
            }
        } else {
            throw new InterpreterError('Cannot subtract two different objects');
        }
    } else if (stmt.type === '*') {
        const lhs = evaluate(stmt.lhs, context);
        const rhs = evaluate(stmt.rhs, context);
        if (lhs.type === 'number' && rhs.type === 'number') {
            return {
                type: 'number',
                value: lhs.value * rhs.value
            }
        }  else if (lhs.type === 'complex-number' && rhs.type === 'complex-number') {
            const x1 = lhs.value[0];
            const y1 = lhs.value[1];
            const x2 = rhs.value[0];
            const y2 = rhs.value[1];
            return {
                type: 'complex-number',
                value: [x1*x2-y1*y2, x1*y2+y1*x2]
            }
        } else if (lhs.type === 'complex-number' && rhs.type === 'number') {
            return {
                type: 'complex-number',
                value: [lhs.value[0] * rhs.value, lhs.value[1] * rhs.value]
            }
        } else if (lhs.type === 'number' && rhs.type === 'complex-number') {
            return {
                type: 'complex-number',
                value: [lhs.value * rhs.value[0], lhs.value * rhs.value[1]]
            }
        } else if (lhs.type === 'number' && rhs.type === 'vector') {
            const N = rhs.value.length;
            const r = Array(N);
            const v = lhs.value;
            for (let i = 0; i < N; i++) {
                r[i] = v*rhs.value[i];
            }
            return {
                type: 'vector',
                value: r
            }
        } else if (lhs.type === 'vector' && rhs.type === 'number') {
            const N = lhs.value.length;
            const r = Array(N);
            const v = rhs.value;
            for (let i = 0; i < N; i++) {
                r[i] = v*lhs.value[i];
            }
            return {
                type: 'vector',
                value: r
            }
        } else if (lhs.type === 'matrix' && rhs.type === 'matrix') {
            const matrix1 = lhs.value;
            const matrix2 = rhs.value;
            const width = lhs.width;
            const height = lhs.height;
            if (lhs.width === width && lhs.height === height) {
                const N = lhs.width*lhs.height;
                const result = wasm.multiply(matrix1, matrix2, width);
                return {
                    type: 'matrix',
                    value: result,
                    width,
                    height
                }
            } else {
                throw new InterpreterError('Cannot add matrices of different sizes');
            } 
        } else if (lhs.type === 'number' && rhs.type === 'matrix') {
            const value = lhs.value;
            const matrix = rhs.value;
            const N = rhs.width * rhs.height;
            const result = new Float64Array(N);
            for (let i = 0; i < N; i++) {
                result[i] = value*matrix[i];
            }
            return {
                type: 'matrix',
                value: result,
                width: rhs.width,
                height: rhs.height
            }
        } else if (lhs.type === 'matrix' && rhs.type === 'number') {
            const value = rhs.value;
            const matrix = lhs.value;
            const N = lhs.width * lhs.height;
            const result = new Float64Array(N);
            for (let i = 0; i < N; i++) {
                result[i] = value*matrix[i];
            }
            return {
                type: 'matrix',
                value: result,
                width: lhs.width,
                height: lhs.height
            }
        } else {
            throw new InterpreterError('Wrong types to multiply');
        }
    } else if (stmt.type === '/') {
        // TODO division by 0
        const lhs = evaluate(stmt.lhs, context);
        const rhs = evaluate(stmt.rhs, context);
        if (lhs.type === 'number' && rhs.type === 'number') {
            return {
                type: 'number',
                value: lhs.value / rhs.value
            }
        }  else if (lhs.type === 'complex-number' && rhs.type === 'complex-number') {
            const x1 = lhs.value[0];
            const y1 = lhs.value[1];
            const x2 = rhs.value[0];
            const y2 = rhs.value[1];
            const norm = x2*x2+y2*y2;
            return {
                type: 'complex-number',
                value: [(x1*x2-y1*y2)/norm, (-x1*y2+x2*y1)/norm]
            }
        } else if (lhs.type === 'complex-number' && rhs.type === 'number') {
            return {
                type: 'complex-number',
                value: [lhs.value[0] / rhs.value, lhs.value[1] / rhs.value]
            }
        } else if (lhs.type === 'number' && rhs.type === 'complex-number') {
            const x1 = lhs.value;
            const x2 = rhs.value[0];
            const y2 = rhs.value[1];
            const norm = x2*x2+y2*y2;
            return {
                type: 'complex-number',
                value: [x1*x2/norm, -x1*y2/norm]
            }
        } else if (lhs.type === 'vector' && rhs.type === 'number') {
            const N = lhs.value.length;
            const r = Array(N);
            const v = rhs.value;
            for (let i = 0; i < N; i++) {
                r[i] = lhs.value[i]/v;
            }
            return {
                type: 'vector',
                value: r
            }
        } else if (lhs.type === 'matrix' && rhs.type === 'matrix') {
            const matrix1 = lhs.value;
            const matrix2 = rhs.value;
            const width = lhs.width;
            const height = lhs.height;
            if (lhs.width === width && lhs.height === height) {
                const N = lhs.width*lhs.height;
                const result = wasm.multiply(matrix1, wasm.inverse(matrix2, width), width);
                return {
                    type: 'matrix',
                    value: result,
                    width,
                    height
                }
            } else {
                throw new InterpreterError('Cannot add matrices of different sizes');
            } 
        }  else if (lhs.type === 'number' && rhs.type === 'matrix') {
            const value = lhs.value;
            const matrix = rhs.value;
            const N = rhs.width * rhs.height;
            const result = new Float64Array(N);
            const inv = wasm.inverse(matrix, rhs.width);
            for (let i = 0; i < N; i++) {
                result[i] = value*inv[i];
            }
            return {
                type: 'matrix',
                value: result,
                width: rhs.width,
                height: rhs.height
            }
        } else if (lhs.type === 'matrix' && rhs.type === 'number') {
            const value = rhs.value;
            const matrix = lhs.value;
            const N = lhs.width * lhs.height;
            const result = new Float64Array(N);
            for (let i = 0; i < N; i++) {
                result[i] = matrix[i]/value;
            }
            return {
                type: 'matrix',
                value: result,
                width: lhs.width,
                height: lhs.height
            }
        } else {
            throw new InterpreterError('Can only divide numbers');
        }
    } else if (stmt.type === '^') {
        // TODO: ...
        const lhs = evaluate(stmt.lhs, context);
        const rhs = evaluate(stmt.rhs, context);
        if (lhs.type === 'number' && rhs.type === 'number') {
            return {
                type: 'number',
                value: Math.pow(lhs.value, rhs.value)
            }
        } else if (lhs.type === 'complex-number' && rhs.type === 'number') {
            const r = Math.log(cnorm(lhs.value));
        } else if (lhs.type === 'matrix' && rhs.type === 'number') {
            let value = rhs.value;
            // TODO: There are more efficient ways of doing this :)
            if (value >=0) {
                if (value === Math.floor(value)) {
                    let N = lhs.width; 
                    let result = lhs.value;
                    for (let i = 1; i < value; i++) {
                        result = wasm.multiply(result, lhs.value, N);
                    }
                    return {
                        type: 'matrix',
                        value: result,
                        width: N,
                        height: N
                    }
                }
            } else {
                if (value === Math.floor(value)) {
                    let N = lhs.width; 
                    let inverse = wasm.inverse(lhs.value, N);
                    let result = inverse;
                    for (let i = 1; i < -value; i++) {
                        result = wasm.multiply(result, inverse, N);
                    }
                    return {
                        type: 'matrix',
                        value: result,
                        width: N,
                        height: N
                    }
                } 
            }
        } else {
            throw new InterpreterError('Can only multiply numbers');
        }
    } else if (stmt.type === 'variable') {
        const name = stmt.name;
        if (!(name in context)) {
            throw new InterpreterError(`Undefined variable: "${name}"`);
        }
        return context[stmt.name];
    } else if (stmt.type === 'number') {
        return {
            type: 'number',
            value: stmt.value
        }
    } else if (stmt.type === 'complex') {
        return {
            type: "complex-number",
            value: stmt.value


        }
    } else if (stmt.type === 'vector') {
        const N = stmt.args.length;
        const r = Array(N);
        for (let i = 0; i < N; i++) {
            const t = evaluate(stmt.args[i], context);
            if (t.type !== 'number') {
                throw new InterpreterError(`Expected number got '${t.type}'`)
            }
            r[i] = t.value;
        }
        return {
            type: 'vector',
            value: r
        }

    } else if (stmt.type === 'matrix') {
        const width = stmt.matrix.length;
        const height = stmt.matrix[0].length;
        const r = new Float64Array(width*height);
        for (let i = 0; i < width; i++) {
            for (let j = 0; j < height; j++) {
                const t = evaluate(stmt.matrix[j][i], context);
                if (t.type !== 'number') {
                    throw new InterpreterError(`Expected number got '${t.type}'`)
                }
                r[i + j*width] = t.value;
            }
        }
        return {
            type: 'matrix',
            value: r,
            width,
            height
        }
    } else if (stmt.type === 'u-') {
        const result = evaluate(stmt.rhs, context);
        if (result.type === 'number') {
            return {
                type: 'number',
                value: -result.value
            }
        } else {
            throw new InterpreterError('Not implemented');
        }
    } else if (stmt.type === 'u+') {
        return evaluate(stmt.rhs, context);
    } else if (stmt.type === 'function') {
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
                }
            } else {
                throw new InterpreterError('Not implemented');
            }     
        } else if (name === 'cos') {
            const args = stmt.args;
            if (args.length !== 1) {
                throw new InterpreterError('Wrong number of argument for function sin');
            }
            const result = evaluate(args[0], context);
            if (result.type === 'number') {
                return {
                    type: 'number',
                    value: Math.cos(result.value)
                }
            } else {
                throw new InterpreterError('Not implemented');
            }
        } else if (name === 'tan') {
            const args = stmt.args;
            if (args.length !== 1) {
                throw new InterpreterError('Wrong number of argument for function sin');
            }
            const result = evaluate(args[0], context);
            if (result.type === 'number') {
                return {
                    type: 'number',
                    value: Math.tan(result.value)
                }
            } else {
                throw new InterpreterError('Not implemented');
            }
        } else if (name === 'log') {
            const args = stmt.args;
            if (args.length !== 1) {
                throw new InterpreterError('Wrong number of argument for function sin');
            }
            const result = evaluate(args[0], context);
            if (result.type === 'number') {
                if (result.value > 0) {
                    return {
                        type: 'number',
                        value: Math.log(result.value)
                    }
                } else {
                    return {
                        type: 'complex-number',
                        value: clog([result.value, 0])
                    } 
                }
            } else if (result.type === 'complex-number') {
                return {
                    type: 'complex-number',
                    value: clog(result.value)
                }
            } else {
                throw new InterpreterError('Not implemented');
            }
        } else if (name === 'sqrt') {
            const args = stmt.args;
            if (args.length !== 1) {
                throw new InterpreterError('Wrong number of argument for function sin');
            }
            const result = evaluate(args[0], context);
            if (result.type === 'number') {
                return {
                    type: 'number',
                    value: Math.sqrt(result.value)
                }
            } else if (result.type === 'complex-number') {
                return {
                    type: 'complex-number',
                    value: clog(result.value)
                }
            } else {
                throw new InterpreterError('Not implemented');
            } 
        } else if (name === 'det') {
            const args = stmt.args;
            if (args.length !== 1) {
                throw new InterpreterError('Wrong number of argument for function sin');
            }
            const result = evaluate(args[0], context);
            if (result.type === 'number') {
                return {
                    type: 'number',
                    value: result.value
                }
            } else if (result.type === 'matrix') {
                return {
                    type: 'number',
                    value: wasm.determinant(result.value, result.width)
                }
            } else {
                throw new InterpreterError('Not implemented');
            }
        } else if (name === 'norm') {
            const args = stmt.args;
            if (args.length !== 1) {
                throw new InterpreterError('Wrong number of argument for function sin');
            }
            const result = evaluate(args[0], context);
            if (result.type === 'number') {
                return {
                    type: 'number',
                    value: Math.abs(result.value)
                }
            } else if (result.type === 'vector') {
                let r = 0;
                for (let i =0; i< result.value.length; i++) {
                    r += Math.pow(result.value[i], 2);
                }
                return {
                    type: 'number',
                    value: Math.sqrt(r)
                }
            } else {
                throw new InterpreterError(`Function 'norm' not implemented for type ${result.type}`);
            }
        } else if (name === 'trace') {
            const args = stmt.args;
            if (args.length !== 1) {
                throw new InterpreterError('Wrong number of argument for function trace');
            }
            const result = evaluate(args[0], context);
            if (result.type === 'matrix') {
                return {
                    type: 'number',
                    value: wasm.trace(result.value, result.width)
                }
            } else {
                throw new InterpreterError('Not implemented');
            }
        } else if (name === 'transpose') {
            const args = stmt.args;
            if (args.length !== 1) {
                throw new InterpreterError('Wrong number of argument for function sin');
            }
            const result = evaluate(args[0], context);
            if (result.type === 'matrix') {
                return {
                    type: 'matrix',
                    value: wasm.transpose(result.value, result.width),
                    width: result.width,
                    height: result.height
                }
            } else {
                throw new InterpreterError('Not implemented');
            }
        } else {
            throw new InterpreterError(`Undefined function "${name}"`);
        }
    }
    throw new InterpreterError(`Unexpected node type: ${stmt.type}`);
}