import { evaluate_str } from './interpreter.js';
import { matrixToLatex } from './util.js';

// Original console design by Matt Cowley https://codepen.io/MattCowley/pen/jqBbdG/

// Elements

const repl = document.getElementsByClassName('repl-wrapper')[0];
const replInput = document.getElementsByClassName('repl-input')[0];
const outputs = document.getElementsByClassName('outputs')[0];
const inputPrompt = document.getElementsByClassName('input-prompt')[0];

// Globals
const cmdHistory = [];
let level = 0;

// Init with an example matrix
const context = {
  a:  {type: "matrix", value: [1, 3, 2, 4], width: 2, height: 2}
}

function addCommand(value) {
  const wrapper = document.createElement('div');
  wrapper.className = 'wrapper';
  const prompt = document.createElement('div');
  prompt.className = 'input-prompt';
  prompt.innerText = `In[${level+1}]: `

  const command = document.createElement('div');
  command.className = 'command';
  command.innerText = value.trim();
  wrapper.appendChild(prompt);
  wrapper.appendChild(command);
  outputs.appendChild(wrapper);
  cmdHistory.push(value.trim());
}

function processCommand(value) {
  try {
    const result = evaluate_str(value, context);
    if (result.type === 'matrix') {
      say(matrixToLatex(result.value, result.width), true);
    } else {
      say(JSON.stringify(result.value))
    }
    context['$' + cmdHistory.length] = result;

  } catch (e) {
     console.trace();
     say(e.message)
  }
}

function say(text, process_latex=false) {
  const output = document.createElement('div');
  // output.className = 'output-prompt';
  if (process_latex) {
    katex.render(text, output, {
      throwOnError: true
    });
  } else {
    output.innerText = text;
  }
  const wrapper = document.createElement('div');
  wrapper.className = 'wrapper';
  const prompt = document.createElement('div');
  prompt.className = 'output-prompt';
  prompt.innerText = `Out[${level}]: `
  wrapper.appendChild(prompt);
  wrapper.appendChild(output);
  outputs.appendChild(wrapper);

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
          inputPrompt.innerText = `In[${level+1}]: `;
      }
  });
  replInput.value = '';
};



export default setupREPL;