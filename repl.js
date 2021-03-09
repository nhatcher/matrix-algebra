import { evaluate_str } from './interpreter.js';
import { matrixToLatex } from './util.js';

//import { Lexer, TokenKind } from './lexer.js';


// Original console design by Matt Cowley https://codepen.io/MattCowley/pen/jqBbdG/

// Elements

const repl = document.getElementsByClassName('repl-wrapper')[0];
const replInput = document.getElementsByClassName('repl-input')[0];
const outputs = document.getElementsByClassName('outputs')[0];

// Globals
const cmdHistory = [];
let level = 0;
// Init with an example matrix
const context = {
  a:  {type: "matrix", value: [1, 3, 2, 4], width: 2, height: 2}
}
//

function addCommand(value) {
  const command = document.createElement('div');
  command.className = 'command';
  command.innerText = value;
  outputs.appendChild(command);
  cmdHistory.push(value);
}

function processCommand(value) {
  try {
    const result = evaluate_str(value, context);
    if (result.type === 'matrix') {
      say(matrixToLatex(result.value, result.width), true);
    } else {
      say(JSON.stringify(result.value))
    }
  } catch (e) {
     console.trace();
     say(e.message)
  }
}

function say(text, process_latex=false) {
  const node = document.createElement('div');
  if (process_latex) {
    katex.render(text, node, {
      throwOnError: true
    });
  } else {
    node.innerText = text;
  }
  outputs.appendChild(node);
  const inner = repl.getElementsByClassName('repl-inner')[0];
  const bb = inner.getBoundingClientRect();
  repl.scrollTop = bb.height;
}

function setupREPL() {
  // Listen to keyboard events
  // keydown is problematic because Android tends toi send many 229 events.
  // See, for instance:
  // * https://www.reddit.com/r/javascript/comments/3hr100/the_dreaded_keydown_keycode_of_229_for_android/
  // * https://stackoverflow.com/questions/36753548/keycode-on-android-is-always-229
  replInput.addEventListener('keyup', (event) => {
      const key = event.key;
      if (key === 'ArrowUp') {
          level = Math.max(0, level - 1);
          replInput.value = cmdHistory[level] || '';
      } else if (key === 'ArrowDown') {
          level = Math.min(level + 1, cmdHistory.length - 1);
          replInput.value = cmdHistory[level];
      } else if (key === 'Enter') {
          event.preventDefault();
          const value = replInput.value;
          addCommand(value);
          level = cmdHistory.length;
          processCommand(value);
          replInput.value = '';
      }

  });


  say('Matrix Algebra at your fingertips!');
  replInput.value = '';

  // Fun particles Background!
  particlesJS('particles-js',{'particles':{'number':{'value':50},'color':{'value':'#ffffff'},'shape':{'type':'triangle','polygon':{'nb_sides':5}},'opacity':{'value':0.06,'random':false},'size':{'value':11,'random':true},'line_linked':{'enable':true,'distance':150,'color':'#ffffff','opacity':0.4,'width':1},'move':{'enable':true,'speed':4,'direction':'none','random':false,'straight':false,'out_mode':'out','bounce':false}},'interactivity':{'detect_on':'canvas','events':{'onhover':{'enable':false},'onclick':{'enable':true,'mode':'push'},'resize':true},'modes':{'push':{'particles_nb':4}}},'retina_detect':true},function(){});
};



export default setupREPL;