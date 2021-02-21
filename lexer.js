function isDigit(c) {
    return /^[0-9]$/.test(c);
}
function isWhiteSpace(c) {
    return [' ', '\t'].includes(c);
}
function isAlphabetic(c) {
    return /^[a-z][A-Z]$/.test(c);
}
function isAlphanumeric(c) {
    return /^[a-z][A-Z][0-9]$/.test(c);
}
var Lexer = (function () {
    function Lexer(text) {
        this.text = text;
        this.position = 0;
        this.len = text.length;
    }
    Lexer.prototype.readNextChar = function () {
        if (this.position >= this.len) {
            return '';
        }
        var c = this.text[this.position];
        this.position += 1;
        return c;
    };
    Lexer.prototype.peekNextChar = function () {
        if (this.position >= this.len) {
            return '';
        }
        return this.text[this.position];
    };
    Lexer.prototype.advanceChar = function () {
        this.position += 1;
    };
    Lexer.prototype.advanceWhiteSpace = function () {
        while (isWhiteSpace(this.text[this.position])) {
            this.position += 1;
        }
    };
    Lexer.prototype.parseIdentifier = function () {
        var str = '';
        var accept = true;
        var state = 1;
        while (accept) {
            var c = this.peekNextChar();
            if (state === 1) {
                if (isAlphabetic(c)) {
                    state = 2;
                }
                else {
                    throw Error('First char of an identifier must be alphabetic');
                }
            }
            else {
                if (!isAlphanumeric(c)) {
                    break;
                }
            }
            str += c;
            this.advanceChar();
        }
        return str;
    };
    Lexer.prototype.parseNumber = function () {
        var state = 1;
        var str = '';
        var accept = true;
        while (accept) {
            var c = this.peekNextChar();
            switch (state) {
                case 1:
                    if (isDigit(c)) {
                        state = 3;
                    }
                    else if (c === '-' || '+') {
                        state = 2;
                    }
                    else {
                        throw Error("Expecting digit or + or -, got " + c);
                    }
                    break;
                case 2:
                    if (isDigit(c)) {
                        state = 3;
                    }
                    else {
                        throw Error("Expecting digit got " + c);
                    }
                    break;
                case 3:
                    if (c === '.') {
                        state = 4;
                    }
                    else if (c === 'E' || c === 'e') {
                        state = 6;
                    }
                    else if (!isDigit(c)) {
                        accept = false;
                    }
                    break;
                case 4:
                    if (isDigit(c)) {
                        state = 5;
                    }
                    else {
                        throw Error("Expecting digit got " + c);
                    }
                    break;
                case 5:
                    if (c === 'e' || c === 'E') {
                        state = 6;
                    }
                    else if (!isDigit(c)) {
                        accept = false;
                    }
                    break;
                case 6:
                    if (c === '+' || c === '-') {
                        state = 7;
                    }
                    else {
                        throw Error("Expecting \"+\" or \"-\" got " + c);
                    }
                    break;
                case 7:
                    if (isDigit(c)) {
                        state = 8;
                    }
                    else {
                        throw Error("Expecting digit got " + c);
                    }
                    break;
                case 8:
                    if (!isDigit(c)) {
                        accept = false;
                    }
                    break;
                default:
                    throw Error("Unknown state " + state);
            }
            if (accept) {
                str += c;
                this.advanceChar();
            }
        }
        return str;
    };
    Lexer.prototype.peekToken = function () {
        var position = this.position;
        var token = this.nextToken();
        this.position = position;
        return token;
    };
    Lexer.prototype.nextToken = function () {
        this.advanceWhiteSpace();
        var c = this.peekNextChar();
        if (c === '') {
            return {
                kind: TokenKind.EOF,
                str: ''
            };
        }
        if (isDigit(c)) {
            var value = this.parseNumber();
            return {
                kind: TokenKind.Number,
                str: "" + value,
                value: parseFloat(value)
            };
        }
        else if (c === '+') {
            this.advanceChar();
            return {
                kind: TokenKind['+'],
                str: '+'
            };
        }
        else if (c === '-') {
            this.advanceChar();
            return {
                kind: TokenKind['-'],
                str: '-'
            };
        }
        else if (c === '*') {
            this.advanceChar();
            return {
                kind: TokenKind['*'],
                str: '*'
            };
        }
        else if (c === '/') {
            this.advanceChar();
            return {
                kind: TokenKind['/'],
                str: '/'
            };
        }
        else if (c === '^') {
            this.advanceChar();
            return {
                kind: TokenKind['^'],
                str: '^'
            };
        }
        if (isAlphabetic(c)) {
            var str = this.parseIdentifier();
            return {
                kind: TokenKind.Identifier,
                str: str
            };
        }
        return {
            kind: TokenKind.EOF,
            str: ''
        };
    };
    return Lexer;
}());
export { Lexer };
export var TokenKind;
(function (TokenKind) {
    TokenKind[TokenKind["Number"] = 0] = "Number";
    TokenKind[TokenKind["Identifier"] = 1] = "Identifier";
    TokenKind[TokenKind["+"] = 2] = "+";
    TokenKind[TokenKind["-"] = 3] = "-";
    TokenKind[TokenKind["*"] = 4] = "*";
    TokenKind[TokenKind["/"] = 5] = "/";
    TokenKind[TokenKind["^"] = 6] = "^";
    TokenKind[TokenKind["="] = 7] = "=";
    TokenKind[TokenKind["<"] = 8] = "<";
    TokenKind[TokenKind[">"] = 9] = ">";
    TokenKind[TokenKind["<="] = 10] = "<=";
    TokenKind[TokenKind[">="] = 11] = ">=";
    TokenKind[TokenKind["!="] = 12] = "!=";
    TokenKind[TokenKind[","] = 13] = ",";
    TokenKind[TokenKind["("] = 14] = "(";
    TokenKind[TokenKind[")"] = 15] = ")";
    TokenKind[TokenKind["["] = 16] = "[";
    TokenKind[TokenKind["]"] = 17] = "]";
    TokenKind[TokenKind["EOF"] = 18] = "EOF";
})(TokenKind || (TokenKind = {}));
//# sourceMappingURL=lexer.js.map