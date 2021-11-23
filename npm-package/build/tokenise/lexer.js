import{Position}from"../position.js";import{digits,identifierChars,KEYWORDS,singleLineComment,stringSurrounds}from"../constants.js";import{IllegalCharError}from"../errors.js";import{doubleCharTokens,singleCharTokens,Token,tripleCharTokens,tt}from"../parse/tokens.js";export class Lexer{constructor(t,i){this.text=t,this.position=new Position(-1,0,-1,i),this.advance()}advance(){this.position.advance(this.currentChar),this.currentChar=this.text[this.position.idx]}generate(){if(!this.text)return[[new Token(this.position,tt.EOF)],void 0];const t=[];for(;void 0!==this.currentChar;)if(" \t\n".includes(this.currentChar))this.advance();else if(digits.includes(this.currentChar))t.push(this.makeNumber());else if(this.currentChar===singleLineComment[0]&&this.text[this.position.idx+1]===singleLineComment[1])this.comment();else if(identifierChars.includes(this.currentChar))t.push(this.makeIdentifier());else if(-1!==stringSurrounds.indexOf(this.currentChar))t.push(this.makeString());else{const i=this.currentChar;let e=this.unknownChar();if(!e){let t=this.position.clone,i=this.currentChar;return this.advance(),[[],new IllegalCharError(t,i)]}e.type===tt.ASSIGN&&(e.value=i),t.push(e)}return t.push(new Token(this.position,tt.EOF)),[t,void 0]}makeNumber(){const t=this.position.clone;let i="",e=0;for(;void 0!==this.currentChar&&(digits+"._").includes(this.currentChar);){if("."===this.currentChar){if(1===e)break;e++,i+="."}else"_"!==this.currentChar&&(i+=this.currentChar);this.advance()}return new Token(t,tt.NUMBER,parseFloat(i))}makeString(){const t=this.position.clone;let i="",e=this.currentChar;for(this.advance();this.currentChar!==e&&void 0!==this.currentChar;)"\\"!==this.currentChar||(this.advance(),"n"!==this.currentChar)?(i+=this.currentChar,this.advance()):(i+="\n",this.advance());return this.advance(),new Token(t,tt.STRING,i)}makeIdentifier(){let t="";const i=this.position.clone;for(;void 0!==this.currentChar&&(identifierChars+digits).includes(this.currentChar);)t+=this.currentChar,this.advance();let e=tt.IDENTIFIER;return-1!==KEYWORDS.indexOf(t)&&(e=tt.KEYWORD),new Token(i,e,t)}unknownChar(){if(void 0!==this.currentChar){for(let t in tripleCharTokens)if(t[0]===this.currentChar&&t[1]===this.text[this.position.idx+1]&&t[2]===this.text[this.position.idx+2]){const i=this.position.clone;return this.advance(),this.advance(),this.advance(),new Token(i,tripleCharTokens[t])}for(let t in doubleCharTokens)if(t[0]===this.currentChar&&t[1]===this.text[this.position.idx+1]){const i=this.position.clone;return this.advance(),this.advance(),new Token(i,doubleCharTokens[t])}if(singleCharTokens.hasOwnProperty(this.currentChar)){let t=this.position.clone,i=singleCharTokens[this.currentChar];return this.advance(),new Token(t,i)}}}comment(){for(this.advance();"\n"!==this.currentChar&&void 0!==this.currentChar;)this.advance();this.advance()}}