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
    type: string,
    lhs: Node,
    rhs: Node
}

interface NumberNode {
    type: 'number'
    value: number
}

interface UnaryOpNode {
    type: '-' | '+',
    rhs: Node
}

type Node = OpNode | UnaryOpNode | NumberNode


function isOperation(s: string):boolean {
    return ['+', '-', '*', '/', '^'].includes(s);
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

    prefix_binding_power(op: string): [null, number] {
     if (op ===  '+' || op === '-') {
        return [null, 9];
     }
     throw new Error(`Bad op: ${op}`);
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
       } else if (op === '.') {
           return [14, 13];
       }
       return null;
    }

    parseExpression(bindingPower: number): Node {
        const token = this.currentToken;
        this.advanceTokens();
        const kind = token.kind;
        let lhs: Node;
        console.log(token);
        if (kind === TokenKind.Number) {
            lhs = {
                type: 'number',
                value: token.value || 0
            }
        } else if (kind === TokenKind['(']) {
            lhs = this.parseExpression(0);
            this.advanceTokens();
            console.assert(this.currentToken.kind === TokenKind[')']);
        } else if (token.str === '-' || token.str === '+') {
            const r_bp = this.prefix_binding_power(token.str)[1];
            const rhs = this.parseExpression(r_bp);
            lhs = {
                type: token.str,
                rhs: rhs
            }
        } else {
            throw new Error(`Unexpected token: ${JSON.stringify(token)}`);
        }

        for(;;) {
            // this.advanceTokens();
            const opToken = this.currentToken;
            if (opToken.kind === TokenKind.EOF || opToken.kind === TokenKind[')']) {
                break;
            } else if (!isOperation(opToken.str)) {
                throw new Error(`Unexpected token ${opToken.str}`);
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
                console.log('hola', this.currentToken);
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

    // parseDefinition(): Node {

    // }

    parse(): Node {
        return this.parseExpression(0);
    }

}