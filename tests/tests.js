const fs = require('fs');
const lin = require('./linalg.js');


async function getAssembly(env) {
  const bytes = new Uint8Array(fs.readFileSync("tests/linear_algebra.wasm"));
  const {instance} = await WebAssembly.instantiate(bytes, env);
  return instance;
}
async function run() {
  try {
    const linalg = await lin.linalg(getAssembly);
    const A = [1, 2, 3, 4];
    const d = linalg.determinant(A, 2);
    console.assert(d === -2, `Got ${d}`);
  } catch(e) {
    console.error(e);
  }
}

run();


