import { Lexer, TokenKind } from './lexer.js';
function isOperation(s) {
    return ['+', '-', '*', '/', '^'].includes(s);
}
var Parser = (function () {
    function Parser(text) {
        this.text = text;
        this.lexer = new Lexer(text);
        this.currentToken = this.lexer.nextToken();
        this.peekToken = this.lexer.nextToken();
    }
    Parser.prototype.advanceTokens = function () {
        this.currentToken = this.peekToken;
        this.peekToken = this.lexer.nextToken();
    };
    Parser.prototype.prefix_binding_power = function (op) {
        if (op === '+' || op === '-') {
            return [null, 9];
        }
        throw new Error("Bad op: " + op);
    };
    Parser.prototype.postfix_binding_power = function (op) {
        if (op === '!') {
            return [11, null];
        }
        else if (op === '[') {
            return [11, null];
        }
        return null;
    };
    Parser.prototype.infix_binding_power = function (op) {
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
        else if (op === '.') {
            return [14, 13];
        }
        return null;
    };
    Parser.prototype.parseExpression = function (bindingPower) {
        var token = this.currentToken;
        this.advanceTokens();
        var kind = token.kind;
        var lhs;
        if (kind === TokenKind.Number) {
            lhs = {
                type: 'number',
                value: token.value || 0
            };
        }
        else if (kind === TokenKind['Identifier']) {
            lhs = {
                type: 'variable',
                name: token.str
            };
        }
        else if (kind === TokenKind['(']) {
            lhs = this.parseExpression(0);
            this.advanceTokens();
            if (this.currentToken.kind !== TokenKind[')']) {
                throw new Error("[Parser] Expecting ')' found " + token.str);
            }
        }
        else if (token.str === 'u-' || token.str === 'u+') {
            var r_bp = this.prefix_binding_power(token.str)[1];
            var rhs = this.parseExpression(r_bp);
            lhs = {
                type: token.str,
                rhs: rhs
            };
        }
        else {
            throw new Error("[Parser] Unexpected token (expecting number, atom or prefix). Found: " + token.str);
        }
        for (;;) {
            var opToken = this.currentToken;
            if (opToken.kind === TokenKind.EOF || opToken.kind === TokenKind[')']) {
                break;
            }
            else if (!isOperation(opToken.str)) {
                throw new Error("[Parser] Unexpected token (expecting operator) " + opToken.str);
            }
            var postfix = this.postfix_binding_power(opToken.str);
            if (postfix) {
                var leftBindingPower = postfix[0];
                if (leftBindingPower < bindingPower) {
                    break;
                }
                this.advanceTokens();
                continue;
            }
            var infix = this.infix_binding_power(opToken.str);
            if (infix) {
                var leftBindingPower = infix[0], rightBidingPower = infix[1];
                if (leftBindingPower < bindingPower) {
                    break;
                }
                this.advanceTokens();
                var rhs = this.parseExpression(rightBidingPower);
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
    };
    Parser.prototype.parseDefinition = function () {
        if (this.peekToken.kind !== TokenKind['=']) {
            throw new Error("Expecting '=' found " + this.peekToken.str);
        }
        var lhs = {
            type: 'variable',
            name: this.currentToken.str
        };
        this.advanceTokens();
        this.advanceTokens();
        var rhs = this.parseExpression(0);
        return {
            type: 'definition',
            lhs: lhs,
            rhs: rhs
        };
    };
    Parser.prototype.parse = function () {
        var statements = [];
        while (this.currentToken.kind !== TokenKind.EOF) {
            if (this.currentToken.kind === TokenKind.Identifier && this.peekToken.kind === TokenKind['=']) {
                statements.push(this.parseDefinition());
            }
            else {
                statements.push(this.parseExpression(0));
            }
        }
        return statements;
    };
    return Parser;
}());
export { Parser };
//# sourceMappingURL=parser.js.map