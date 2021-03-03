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
import { Lexer, TokenKind } from './lexer.js';
function isOperation(s) {
    return ['+', '-', '*', '/', '^'].includes(s);
}
var ParserError = (function (_super) {
    __extends(ParserError, _super);
    function ParserError(message) {
        var _this = _super.call(this, "[Parser]: " + message) || this;
        _this.name = 'ParserError';
        return _this;
    }
    return ParserError;
}(Error));
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
    Parser.prototype.readCurrentToken = function () {
        return this.currentToken;
    };
    Parser.prototype.prefix_binding_power = function (op) {
        if (op === '+' || op === '-') {
            return [null, 9];
        }
        throw new ParserError("Bad op: " + op);
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
        else if (op === '^') {
            return [9, 10];
        }
        return null;
    };
    Parser.prototype.parseVector = function () {
        var args = [];
        for (;;) {
            args.push(this.parseExpression(0));
            var k = this.readCurrentToken().kind;
            if (k === TokenKind[']']) {
                break;
            }
            if (k !== TokenKind[',']) {
                throw new ParserError("Expecting ',' found '" + this.readCurrentToken().str + "'");
            }
            this.advanceTokens();
        }
        this.advanceTokens();
        return {
            type: 'vector',
            args: args
        };
    };
    Parser.prototype.parseExpression = function (bindingPower) {
        var token = this.currentToken;
        var kind = token.kind;
        this.advanceTokens();
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
            if (this.currentToken.kind === TokenKind['(']) {
                var args = [];
                this.advanceTokens();
                for (;;) {
                    args.push(this.parseExpression(0));
                    var k = this.readCurrentToken().kind;
                    if (k === TokenKind[')'] || k === TokenKind[',']) {
                        break;
                    }
                }
                lhs = {
                    type: 'function',
                    name: token.str,
                    args: args
                };
                this.advanceTokens();
            }
        }
        else if (kind === TokenKind['(']) {
            lhs = this.parseExpression(0);
            if (this.currentToken.kind !== TokenKind[')']) {
                throw new ParserError("Expecting ')' found " + this.currentToken.kind);
            }
            this.advanceTokens();
        }
        else if (kind === TokenKind['[']) {
            var k = this.readCurrentToken();
            if (k.kind === TokenKind['[']) {
                throw new ParserError('Matrices not implemented yet!');
            }
            else {
                lhs = this.parseVector();
            }
        }
        else if (token.str === '-' || token.str === '+') {
            var r_bp = this.prefix_binding_power(token.str)[1];
            var rhs = this.parseExpression(r_bp);
            lhs = {
                type: token.str === '-' ? 'u-' : 'u+',
                rhs: rhs
            };
        }
        else {
            throw new ParserError("Unexpected token (expecting number, atom or prefix). Found: " + token.str);
        }
        for (;;) {
            var opToken = this.currentToken;
            if (opToken.kind === TokenKind.EOF || opToken.kind === TokenKind[')'] || opToken.kind === TokenKind[','] || opToken.kind === TokenKind[']']) {
                break;
            }
            else if (!isOperation(opToken.str)) {
                throw new ParserError("Unexpected token (expecting operator) " + opToken.str);
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
            throw new ParserError("Expecting '=' found " + this.peekToken.str);
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