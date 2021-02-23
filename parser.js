import { Lexer, TokenKind } from './lexer.js';
function isOperation(s) {
    return ['+', '-', '*', '/', '^'].includes(s);
}
var Parser = (function () {
    function Parser(text) {
        this.text = text;
        this.lexer = new Lexer(text);
    }
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
        var lexer = this.lexer;
        var token = lexer.nextToken();
        var kind = token.kind;
        var lhs;
        if (kind === TokenKind.Number) {
            lhs = {
                type: 'number',
                value: token.value || 0
            };
        }
        else if (kind === TokenKind['(']) {
            lhs = this.parseExpression(bindingPower);
            console.assert(lexer.nextToken().kind === TokenKind[')']);
        }
        else if (token.str === '-' || token.str === '+') {
            var r_bp = this.prefix_binding_power(token.str)[1];
            var rhs = this.parseExpression(r_bp);
            lhs = {
                type: token.str,
                rhs: rhs
            };
        }
        else {
            throw new Error("Unexpected token: " + token);
        }
        for (;;) {
            var opToken = lexer.peekToken();
            if (opToken.kind === TokenKind.EOF) {
                break;
            }
            else if (!isOperation(opToken.str)) {
                throw new Error("Unexpected token " + opToken.str);
            }
            var postfix = this.postfix_binding_power(opToken.str);
            if (postfix) {
                var leftBindingPower = postfix[0];
                if (leftBindingPower < bindingPower) {
                    break;
                }
                lexer.nextToken();
                continue;
            }
            var infix = this.infix_binding_power(opToken.str);
            if (infix) {
                var leftBindingPower = infix[0], rightBidingPower = infix[1];
                if (leftBindingPower < bindingPower) {
                    break;
                }
                lexer.nextToken();
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
    Parser.prototype.parse = function () {
        var lexer = this.lexer;
        return this.parseExpression(0);
    };
    return Parser;
}());
export { Parser };
//# sourceMappingURL=parser.js.map