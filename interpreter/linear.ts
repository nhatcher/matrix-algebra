export async function init() {
  // 256 => 16MB
  const memory = new WebAssembly.Memory({initial: 512});
  const env = {memory: memory};
  const { instance } = await WebAssembly.instantiateStreaming(
    fetch("./linear_algebra.wasm"), {env}
  );

  const malloc = instance.exports.malloc as CallableFunction;
  const free = instance.exports.free as CallableFunction;
  const multiplyMat = instance.exports.multiply as CallableFunction;
  const determinantMat = instance.exports.determinant as CallableFunction;
  const inverseMat = instance.exports.inverse as CallableFunction;
  const traceMat = instance.exports.trace as CallableFunction;
  const transposeMat = instance.exports.transpose as CallableFunction;

  function multiply(A: any, B: any, N:any): any {
    const L = N * N;
    console.assert(A.length === L);
    const pA = malloc(L * 8);
    const cA = new Float64Array(memory.buffer, pA, L);
    cA.set(A);
    const pB = malloc(L * 8);
    const cB = new Float64Array(memory.buffer, pB, L);
    cB.set(B);
    const pC = malloc(L * 8);
    const cC = new Float64Array(memory.buffer, pC, L);
    console.time('multiply-internal');
    multiplyMat(pA, pB, pC, N);
    console.timeEnd('multiply-internal');
    const D = new Float64Array(L);
    D.set(cC)
    free(pA);
    free(pB);
    free(pC);
    return D;
  }

  function determinant(A: any, N: any): number {
    const L = N * N;
    console.assert(A.length === L);
    const pA = malloc(L * 8);
    const cA = new Float64Array(memory.buffer, pA, L);
    cA.set(A);
    const d = determinantMat(pA, N);
    free(pA);
    return d;
  }

  function trace(A: any, N: any): number {
    const L = N * N;
    const pA = malloc(L * 8);
    const cA = new Float64Array(memory.buffer, pA, L);
    cA.set(A);
    const d = traceMat(pA, N);
    free(pA);
    return d;
  }

  function transpose(A: any, N: any): any {
    const L = N * N;
    const pA = malloc(L * 8);
    const cA = new Float64Array(memory.buffer, pA, L);
    cA.set(A);
    transposeMat(pA, N);
    const B = new Float64Array(L);
    B.set(cA);
    free(pA);
    return B;
  }

  function inverse(A: any, N: number): any {
    const L = N * N;
    console.assert(A.length === L);
    const pA = malloc(L * 8);
    const cA = new Float64Array(memory.buffer, pA, L);
    cA.set(A);
    const pIA = malloc(L * 8);
    const cIA = new Float64Array(memory.buffer, pIA, L);
    inverseMat(pA, pIA, N);
    const B = new Float64Array(L);
    B.set(cIA);
    free(pA);
    free(pIA);
    return B;
  }

  return {
    multiply,
    determinant,
    inverse,
    trace,
    transpose
  }
}
