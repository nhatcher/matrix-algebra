
function isDigit(c: string): boolean {
    return /^[0-9]$/.test(c);
}

function isWhiteSpace(c: string): boolean {
    return [' ', '\t'].includes(c);
}

function isAlphabetic(c: string): boolean {
    return /^[a-zA-Z]$/.test(c);
}

function isAlphanumeric(c: string): boolean {
    return /^[a-zA-Z0-9]$/.test(c);
}

class LexerError extends Error {
    constructor(message: string) {
        super(`[Lexer]: ${message}`);
        this.name = 'LexerError';
    }
}

export class Lexer {
    position: number;
    text: string;
    len: number;
    constructor(text: string) {
        this.text = text;
        this.position = 0;
        this.len = text.length;
    }
    readNextChar(): string {
        if (this.position >= this.len) {
            return '';
        }
        const c = this.text[this.position];
        this.position += 1;
        return c;
    }
    peekNextChar(): string {
        if (this.position >= this.len) {
            return '';
        }
        return this.text[this.position];
    }
    advanceChar(): void {
        this.position += 1;
    }
    advanceWhiteSpace(): void {
        while (isWhiteSpace(this.text[this.position])) {
            this.position += 1;
        }
    }
    parseInteger(): number {
        let str = '';
        while (isDigit(this.text[this.position])) {
            str += this.text[this.position];
            this.position += 1;
        }
        if (str === '') {
            return 0;
        }
        return Number(str);
    }
    parseIdentifier(): string {
        let str = '';
        let state = 1;
        for (;;) {
            let c = this.peekNextChar();
            if (state === 1) {
                if (isAlphabetic(c)) {
                    state = 2;
                } else {
                    throw new LexerError('First char of an identifier must be alphabetic');
                }
            } else if (!isAlphanumeric(c)) {
                break;
            }
            str += c;
            this.advanceChar();
        }
        return str;
    }
//                         digit                       digit                                  digit
//    +-----+-----+       +------+                   +-----+             +-----+-----+       +-----+
//    |     +     |       |      |                   |     |             |     +     |       |     |
//    |           |       |      |                   |     v             |           v       |     v
// +--+--+     +--+--+    |   +--+--+     +-----+    |  +--+--+      +---+-+      +--+--+    |  +--+--+
// |  1  |     |  2  |    +---+  3  |  .  |  4  |    +--+  5  |      |  6  |      |  7  |    +--+  8  |
// |     |     |     +------->+     +-----+     +-------+     +----->+     |      |     +------>+     |
// ++-+--+     +--+--+ digit  +-+-+-+     +-----+ digit +-----+  E   +-+-+-+      +--+--+       +-----+
//  | |           ^             | |                                    ^ |           ^
//  | |     -     |             | |                                    | |     -     |
//  | +-----+-----+             | |                                    | +-----+-----+
//  |                           | |                                    |
//  |         digit             | |                 E                  |
//  +---------------------------+ +------------------------------------+
    parseNumber(): string {
        let state = 1;
        let str = '';
        let accept = true;
        while (accept) {
            let c = this.peekNextChar();
            switch(state) {
                case 1:
                    if (isDigit(c)) {
                        state = 3;
                    } else if (c === '-' || '+') {
                        state = 2;
                    } else {
                        throw new LexerError(`Expecting digit or + or -, got ${c}`);
                    }
                break;
                case 2:
                    if (isDigit(c)) {
                        state = 3;
                    } else {
                        throw new LexerError(`Expecting digit got ${c}`);
                    }
                break;
                case 3:
                    // Accepting state
                    if (c === '.') {
                        state = 4;
                    } else if (c === 'E' || c === 'e') {
                        state = 6;
                    } else if (!isDigit(c)) {
                        accept = false;
                    }
                break;
                case 4:
                    if (isDigit(c)) {
                        state = 5;
                    } else {
                        throw new LexerError(`Expecting digit got ${c}`);
                    }
                break;
                case 5:
                    // Accepting state
                    if (c === 'e' || c === 'E') {
                        state = 6;
                    } else if (!isDigit(c)) {
                        accept = false;
                    }
                break;
                case 6:
                    if (c=== '+' || c === '-') {
                        state = 7;
                    } else {
                        throw new LexerError(`Expecting "+" or "-" got ${c}`);
                    }
                break;
                case 7:
                    if (isDigit(c)) {
                        state = 8;
                    } else {
                        throw new LexerError(`Expecting digit got ${c}`);
                    }
                break;
                case 8:
                    // Accepting state
                    if (!isDigit(c)) {
                        accept = false;
                    }
                break;
                default:
                    throw new LexerError(`Unknown state ${state}`);
            }
            if (accept) {
                str += c;
                this.advanceChar();
            }
        }
        return str;
    }

    nextToken(): Token {
        this.advanceWhiteSpace();
        const c = this.peekNextChar();
        if (c === '') {
            return {
                kind: TokenKind.EOF,
                str: ''
            }
        }
        if (isDigit(c)) {
            const value = this.parseNumber();
            return {
                kind: TokenKind.Number,
                str: `${value}`,
                value: parseFloat(value)
            }
        } else if (c === '+') {
            this.advanceChar();
            return {
                kind: TokenKind['+'],
                str: '+'
            }
        } else if (c === '-') {
            this.advanceChar();
            return {
                kind: TokenKind['-'],
                str: '-'
            }
        } else if (c === '*') {
            this.advanceChar();
            return {
                kind: TokenKind['*'],
                str: '*'
            }
        } else if (c === '/') {
            this.advanceChar();
            return {
                kind: TokenKind['/'],
                str: '/'
            }
        } else if (c === '^') {
            this.advanceChar();
            return {
                kind: TokenKind['^'],
                str: '^'
            }
        } else if (c === '(') {
            this.advanceChar();
            return {
                kind: TokenKind['('],
                str: '('
            }
        } else if (c === ')') {
            this.advanceChar();
            return {
                kind: TokenKind[')'],
                str: ')'
            }
        } else if (c === '[') {
            this.advanceChar();
            return {
                kind: TokenKind['['],
                str: '['
            }
        } else if (c === ']') {
            this.advanceChar();
            return {
                kind: TokenKind[']'],
                str: ']'
            }
        } else if (c === '=') {
            this.advanceChar();
            return {
                kind: TokenKind['='],
                str: '='
            }
        } else if (c === ',') {
            this.advanceChar();
            return {
                kind: TokenKind[','],
                str: ','
            }
        } else if (c === '|') {
            this.advanceChar();
            return {
                kind: TokenKind['|'],
                str: '|'
            }
        } else if (c === '$') {
            this.advanceChar();
            const value = this.parseInteger();
            return {
                kind: TokenKind.History,
                str: '$' + value,
                value: this.parseInteger(),
            }

        } else if(isAlphabetic(c)) {
            const str = this.parseIdentifier();
            return {
                kind: TokenKind.Identifier,
                str: str
            }
        }
        throw new LexerError(`Invalid character '${c}'`);

    }
}

export enum TokenKind {
    Number,
    Identifier,
    History,
    '+',
    '-',
    '*',
    '/',
    '^',
    '=',
    '<',
    '>',
    '<=',
    '>=',
    '!=',
    ',',
    '(',
    ')',
    '[',
    ']',
    '|',
    EOF,
}

export interface Token {
    kind: TokenKind;
    str: string;
    value?: number;
}


// Tokens
// numbers
// '[', ']', '(',')', '+', '-', '*', '/', '^', ','
// Identifier names
// function names: det,..
// EOF

// a = [1,2,3]
// b = [a, [4,5,6],[7,8,9]]
// c = det(b)

/**
 * expr => expr op atom
 * vector => '[' expr (',' expr)* ']'
 * matrix => '[', vector_expr (',' vector_expr)* ']'
 * vector_expr => vector_expr op vector
 * atom => number, Identifier, '(' expr ')', function '(' expr ')'
 */