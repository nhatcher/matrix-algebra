import {Token, Lexer, TokenKind} from './lexer.js';


/*

Input ->
   expr
   var_definition

var_def -> var_name "=" expr
expr


Pratt Parser based on:
https://matklad.github.io/2020/04/13/simple-but-powerful-pratt-parsing.html
*/


interface OpNode {
    type: '+' | '-' | '*' | '/' | '^',
    lhs: Node,
    rhs: Node
}

interface NumberNode {
    type: 'number'
    value: number
}

interface ComplexNode {
    type: 'complex'
    value: [number, number]
}

interface UnaryOpNode {
    type: 'u-' | 'u+',
    rhs: Node
}

interface VariableNode {
    type: 'variable',
    name: string
}

interface DefinitionNode {
    type: 'definition',
    lhs: VariableNode,
    rhs: Node
}

interface FunctionCallNode {
    type: 'function',
    name: string,
    args: Node[]
}

interface Matrix {
    type: 'matrix'
    matrix: Node[][]
}
interface Vector {
    type: 'vector',
    args: Node[]
}

export type Node = DefinitionNode | OpNode | UnaryOpNode | NumberNode | VariableNode | FunctionCallNode | Vector | Matrix | ComplexNode;


function isOperation(s: string): s is '+' | '-' | '*' | '/' | '^' {
    return ['+', '-', '*', '/', '^'].includes(s);
}

class ParserError extends Error {
    constructor(message: string) {
        super(`[Parser]: ${message}`);
        this.name = 'ParserError';
    }
}

export class Parser {
    text: string;
    lexer: Lexer;
    currentToken: Token;
    peekToken: Token;

    constructor(text: string) {
        this.text = text;
        this.lexer = new Lexer(text);

        // Or simply advanceTokens twice
        this.currentToken = this.lexer.nextToken();
        this.peekToken = this.lexer.nextToken();
    }

    advanceTokens() {
        this.currentToken = this.peekToken;
        this.peekToken = this.lexer.nextToken();
    }

    readCurrentToken() {
        // This is horrible (a TypeScript bug)
        // https://github.com/microsoft/TypeScript/issues/9998
        // https://github.com/microsoft/TypeScript/issues/25642
        return this.currentToken;
    }

    prefix_binding_power(op: string): [null, number] {
        if (op ===  '+' || op === '-') {
            return [null, 9];
        }
        throw new ParserError(`Bad op: ${op}`);
    }

    postfix_binding_power(op: string): [number, null] | null {
        if (op === '!') {
            return [11, null];
        } else if (op === '[') {
            return [11, null];
        }
        return null;
    }

    infix_binding_power(op: string): [number, number] | null {
       if (op === '=') {
           return [2, 1];
       } else if (op === '?') {
           return [4, 3];
       } else if (op === '+' || op === '-') {
           return [5, 6];
       } else if (op === '*' || op === '/') {
           return [7, 8];
       } else if (op === '^') {
           return [9, 10];
       }
       return null;
    }

    parseVector(): {type:'vector', args: Node[]} {
        const args: Node[] = [];
        this.advanceTokens();
        for (;;) {
            args.push(this.parseExpression(0));
            // FIXME: We can't do k = this.currentToken because TypeScript gets confused.
            const k = this.readCurrentToken().kind;
            if (k === TokenKind[']']) {
                break;
            }
            if (k !== TokenKind[',']) {
                throw new ParserError(`Expecting ',' found '${this.readCurrentToken().str}'`);
            }
            this.advanceTokens();
        }
        this.advanceTokens();
        return {
            type: 'vector',
            args
        }
    }

    parseMatrix(): {type: 'matrix', matrix: Node[][]} {
        const matrix: Node[][] = [];
        this.advanceTokens();
        for (;;) {
            matrix.push(this.parseVector().args);
            const kind = this.currentToken.kind;
            if (kind === TokenKind[']']) {
                this.advanceTokens();
                break;
            } else if (kind !== TokenKind[',']) {
                throw new ParserError(`(M) Expecting ',' found '${this.peekToken.str}'`);
            }
            this.advanceTokens();
        }
        return {
            type: 'matrix',
            matrix
        }
    }

    parseExpression(bindingPower: number): Node {
        const token = this.currentToken;
        const kind = token.kind;
        let lhs: Node;
        if (kind === TokenKind.Number) {
            lhs = {
                type: 'number',
                value: token.value || 0
            }
            this.advanceTokens();
        } else if (kind === TokenKind.ComplexNumber) {
            lhs = {
                type: 'complex',
                value: token.complex || [0, 0]
            }
            this.advanceTokens();
        } else if (kind === TokenKind['Identifier']) {
            lhs = {
                type: 'variable',
                name: token.str
            }
            this.advanceTokens();
            if (this.currentToken.kind === TokenKind['(']) {
                const args: Node[] = [];
                this.advanceTokens();
                for (;;) {
                    args.push(this.parseExpression(0));
                    // FIXME: We can't do k = this.currentToken because TypeScript gets confused.
                    const k = this.readCurrentToken().kind;
                    if (k === TokenKind[')'] || k === TokenKind[',']) {
                        break;
                    }
                }
                lhs = {
                    type: 'function',
                    name: token.str,
                    args
                }
                this.advanceTokens();
            }
            // Vector or matrix access mat[2][5]
        } else if (kind === TokenKind['(']) {
            this.advanceTokens();
            lhs = this.parseExpression(0);
            if (this.currentToken.kind !== TokenKind[')']) {
                throw new ParserError(`Expecting ')' found ${this.currentToken.kind}`);
            }
            this.advanceTokens();
        } else if (kind === TokenKind['|']) {
            this.advanceTokens();
            lhs = {
                type: 'function',
                name: 'norm',
                args: [this.parseExpression(0)]
            }
            if (this.currentToken.kind !== TokenKind['|']) {
                throw new ParserError(`Expecting '|' found ${this.currentToken.kind}`);
            }
            this.advanceTokens();
        } else if (kind === TokenKind['[']) {
            // Vector or Matrix
            const k = this.peekToken;
            if (k.kind === TokenKind['[']) {
                // It's a matrix
                // a = [[1,2],[3,4]]
                lhs = this.parseMatrix();
            } else {
                // It's a vector
                lhs = this.parseVector();
            }
        } else if (token.str === '-' || token.str === '+') {
            this.advanceTokens();
            const r_bp = this.prefix_binding_power(token.str)[1];
            const rhs = this.parseExpression(r_bp);
            lhs = {
                type: token.str === '-' ? 'u-': 'u+',
                rhs: rhs
            }
        } else if (kind === TokenKind.History) {
            lhs = {
                type: 'variable',
                name: token.str
            }
            this.advanceTokens();
        } else {
            throw new ParserError(`Unexpected token (expecting number, atom or prefix). Found: ${token.str}`);
        }

        for(;;) {
            const opToken = this.currentToken;
            if (opToken.kind === TokenKind.EOF || opToken.kind === TokenKind[')'] || opToken.kind === TokenKind[','] || opToken.kind === TokenKind[']'] || opToken.kind === TokenKind['|']) {
                break;
            } else if (!isOperation(opToken.str)) {
                throw new ParserError(`Unexpected token (expecting operator) ${opToken.str}`);
            }
            const postfix = this.postfix_binding_power(opToken.str);
            if (postfix) {
                const leftBindingPower = postfix[0];
                if (leftBindingPower < bindingPower) {
                    break;
                }
                this.advanceTokens();
                // TODO: '['
                // lhs = {
                //     type: opToken.str,
                //     rhs: lhs
                // };
                continue;
            }
            const infix = this.infix_binding_power(opToken.str);
            if (infix) {
                const [leftBindingPower, rightBidingPower] = infix;
                if (leftBindingPower < bindingPower) {
                    break;
                }
                this.advanceTokens();
                // TODO: ternary operator '?'
                const rhs = this.parseExpression(rightBidingPower);
                lhs = {
                    type: opToken.str,
                    lhs: lhs,
                    rhs: rhs
                };
                continue;
            }
            break;
        }
        return lhs;
    }

    parseDefinition(): Node {
        if (this.peekToken.kind !== TokenKind['=']) {
            throw new ParserError(`Expecting '=' found ${this.peekToken.str}`);
        }
        const lhs: VariableNode = {
            type: 'variable',
            name: this.currentToken.str
        }
        this.advanceTokens();
        this.advanceTokens();
        const rhs = this.parseExpression(0);
        
        return {
            type: 'definition',
            lhs,
            rhs
        }

    }

    parse(): Node[] {
        const statements = [];
        while (this.currentToken.kind !== TokenKind.EOF) {
            if (this.currentToken.kind === TokenKind.Identifier && this.peekToken.kind === TokenKind['=']) {
                statements.push(this.parseDefinition());
            } else {
                statements.push(this.parseExpression(0));
            }
        }
        return statements;
    }

}