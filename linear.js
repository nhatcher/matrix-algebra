export async function init() {
    const memory = new WebAssembly.Memory({ initial: 512 });
    const env = { memory: memory };
    const { instance } = await WebAssembly.instantiateStreaming(fetch("./linear_algebra.wasm"), { env });
    const malloc = instance.exports.malloc;
    const free = instance.exports.free;
    const multiplyMat = instance.exports.multiply;
    const determinantMat = instance.exports.determinant;
    const inverseMat = instance.exports.inverse;
    const traceMat = instance.exports.trace;
    const transposeMat = instance.exports.transpose;
    function multiply(A, B, N) {
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
        multiplyMat(pA, pB, pC, N);
        const D = new Float64Array(L);
        D.set(cC);
        free(pA);
        free(pB);
        free(pC);
        return D;
    }
    function determinant(A, N) {
        const L = N * N;
        console.assert(A.length === L);
        const pA = malloc(L * 8);
        const cA = new Float64Array(memory.buffer, pA, L);
        cA.set(A);
        const d = determinantMat(pA, N);
        free(pA);
        return d;
    }
    function trace(A, N) {
        const L = N * N;
        const pA = malloc(L * 8);
        const cA = new Float64Array(memory.buffer, pA, L);
        cA.set(A);
        const d = traceMat(pA, N);
        free(pA);
        return d;
    }
    function transpose(A, N) {
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
    function inverse(A, N) {
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
    };
}
//# sourceMappingURL=linear.js.map