import { Lexer, TokenKind } from './lexer.js';
function isOperation(s) {
    return ['+', '-', '*', '/', '^'].includes(s);
}
class ParserError extends Error {
    constructor(message) {
        super(`[Parser]: ${message}`);
        this.name = 'ParserError';
    }
}
export class Parser {
    constructor(text) {
        this.text = text;
        this.lexer = new Lexer(text);
        this.currentToken = this.lexer.nextToken();
        this.peekToken = this.lexer.nextToken();
    }
    advanceTokens() {
        this.currentToken = this.peekToken;
        this.peekToken = this.lexer.nextToken();
    }
    readCurrentToken() {
        return this.currentToken;
    }
    prefix_binding_power(op) {
        if (op === '+' || op === '-') {
            return [null, 9];
        }
        throw new ParserError(`Bad op: ${op}`);
    }
    postfix_binding_power(op) {
        if (op === '!') {
            return [11, null];
        }
        else if (op === '[') {
            return [11, null];
        }
        return null;
    }
    infix_binding_power(op) {
        if (op === '=') {
            return [2, 1];
        }
        else if (op === '?') {
            return [4, 3];
        }
        else if (op === '+' || op === '-') {
            return [5, 6];
        }
        else if (op === '*' || op === '/') {
            return [7, 8];
        }
        else if (op === '^') {
            return [9, 10];
        }
        return null;
    }
    parseVector() {
        const args = [];
        this.advanceTokens();
        for (;;) {
            args.push(this.parseExpression(0));
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
        };
    }
    parseMatrix() {
        const matrix = [];
        this.advanceTokens();
        for (;;) {
            matrix.push(this.parseVector().args);
            const kind = this.currentToken.kind;
            if (kind === TokenKind[']']) {
                this.advanceTokens();
                break;
            }
            else if (kind !== TokenKind[',']) {
                throw new ParserError(`(M) Expecting ',' found '${this.peekToken.str}'`);
            }
            this.advanceTokens();
        }
        return {
            type: 'matrix',
            matrix
        };
    }
    parseExpression(bindingPower) {
        const token = this.currentToken;
        const kind = token.kind;
        let lhs;
        if (kind === TokenKind.Number) {
            lhs = {
                type: 'number',
                value: token.value || 0
            };
            this.advanceTokens();
        }
        else if (kind === TokenKind['Identifier']) {
            lhs = {
                type: 'variable',
                name: token.str
            };
            this.advanceTokens();
            if (this.currentToken.kind === TokenKind['(']) {
                const args = [];
                this.advanceTokens();
                for (;;) {
                    args.push(this.parseExpression(0));
                    const k = this.readCurrentToken().kind;
                    if (k === TokenKind[')'] || k === TokenKind[',']) {
                        break;
                    }
                }
                lhs = {
                    type: 'function',
                    name: token.str,
                    args
                };
                this.advanceTokens();
            }
        }
        else if (kind === TokenKind['(']) {
            this.advanceTokens();
            lhs = this.parseExpression(0);
            if (this.currentToken.kind !== TokenKind[')']) {
                throw new ParserError(`Expecting ')' found ${this.currentToken.kind}`);
            }
            this.advanceTokens();
        }
        else if (kind === TokenKind['|']) {
            this.advanceTokens();
            lhs = {
                type: 'function',
                name: 'norm',
                args: [this.parseExpression(0)]
            };
            if (this.currentToken.kind !== TokenKind['|']) {
                throw new ParserError(`Expecting '|' found ${this.currentToken.kind}`);
            }
            this.advanceTokens();
        }
        else if (kind === TokenKind['[']) {
            const k = this.peekToken;
            if (k.kind === TokenKind['[']) {
                lhs = this.parseMatrix();
            }
            else {
                lhs = this.parseVector();
            }
        }
        else if (token.str === '-' || token.str === '+') {
            this.advanceTokens();
            const r_bp = this.prefix_binding_power(token.str)[1];
            const rhs = this.parseExpression(r_bp);
            lhs = {
                type: token.str === '-' ? 'u-' : 'u+',
                rhs: rhs
            };
        }
        else if (kind === TokenKind.History) {
            lhs = {
                type: 'variable',
                name: token.str
            };
            this.advanceTokens();
        }
        else {
            throw new ParserError(`Unexpected token (expecting number, atom or prefix). Found: ${token.str}`);
        }
        for (;;) {
            const opToken = this.currentToken;
            if (opToken.kind === TokenKind.EOF || opToken.kind === TokenKind[')'] || opToken.kind === TokenKind[','] || opToken.kind === TokenKind[']'] || opToken.kind === TokenKind['|']) {
                break;
            }
            else if (!isOperation(opToken.str)) {
                throw new ParserError(`Unexpected token (expecting operator) ${opToken.str}`);
            }
            const postfix = this.postfix_binding_power(opToken.str);
            if (postfix) {
                const leftBindingPower = postfix[0];
                if (leftBindingPower < bindingPower) {
                    break;
                }
                this.advanceTokens();
                continue;
            }
            const infix = this.infix_binding_power(opToken.str);
            if (infix) {
                const [leftBindingPower, rightBidingPower] = infix;
                if (leftBindingPower < bindingPower) {
                    break;
                }
                this.advanceTokens();
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
    parseDefinition() {
        if (this.peekToken.kind !== TokenKind['=']) {
            throw new ParserError(`Expecting '=' found ${this.peekToken.str}`);
        }
        const lhs = {
            type: 'variable',
            name: this.currentToken.str
        };
        this.advanceTokens();
        this.advanceTokens();
        const rhs = this.parseExpression(0);
        return {
            type: 'definition',
            lhs,
            rhs
        };
    }
    parse() {
        const statements = [];
        while (this.currentToken.kind !== TokenKind.EOF) {
            if (this.currentToken.kind === TokenKind.Identifier && this.peekToken.kind === TokenKind['=']) {
                statements.push(this.parseDefinition());
            }
            else {
                statements.push(this.parseExpression(0));
            }
        }
        return statements;
    }
}
//# sourceMappingURL=parser.js.map