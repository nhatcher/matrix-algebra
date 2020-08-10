
async function linalg(getAssembly) {
  // 256 => 16MB
  const memory = new WebAssembly.Memory({initial: 512});
  const env = {memory: memory};
  const instance = await getAssembly({env});
  
  const pmalloc = instance.exports.pmalloc;
  const pfree = instance.exports.pfree;

  function multiply(A, B, N) {
    const L = N * N;
    console.assert(A.length === L);
    const pA = pmalloc(L * 8);
    const cA = new Float64Array(memory.buffer, pA, L);
    cA.set(A);
    const pB = pmalloc(L * 8);
    const cB = new Float64Array(memory.buffer, pB, L);
    cB.set(B);
    const pC = pmalloc(L * 8);
    const cC = new Float64Array(memory.buffer, pC, L);
    instance.exports.multiply(pA, pB, pC, N);
    const D = new Float64Array(L);
    D.set(cC)
    pfree(L * 8 * 3);
    return D;
  }

  function determinant(A, N) {
    const L = N * N;
    console.assert(A.length === L);
    const pA = pmalloc(L * 8);
    const cA = new Float64Array(memory.buffer, pA, L);
    cA.set(A);
    const d = instance.exports.determinant(pA, N);
    pfree(L * 8);
    return d;
  }

  function inverse(A, N) {
    const L = N * N;
    console.assert(A.length === L);
    const pA = pmalloc(L * 8);
    const cA = new Float64Array(memory.buffer, pA, L);
    cA.set(A);
    const pIA = pmalloc(L * 8);
    const cIA = new Float64Array(memory.buffer, pIA, L);
    instance.exports.inverse(pA, pIA, N);
    const B = new Float64Array(L);
    B.set(cIA);
    pfree(L * 8 * 2);
    return B;
  }
  return {
    multiply,
    inverse,
    determinant
  }
}

if (typeof module !== 'undefined') {
  module.exports = {linalg}
}