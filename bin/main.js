function createRandomMatrix(N) {
  const L = N * N;
  const A = new Float64Array(L);
  for (let i=0; i<L; i++) {
    A[i] = 1+2*(1-0.5*Math.random())
  }
  return A;
};
function printMatrix(A, N, prec=15) {
  let mat = [];
  for (let i=0; i<N; i++) {
    let line = [];
    for (let j=0; j<N; j++) {
      const val = parseFloat(A[i + N*j].toFixed(prec));
      line.push(`${val}`);
    }
    mat.push(line.join(' & '));
  }
  return '\\begin{pmatrix}' + mat.join('\\\\') + '\\end{pmatrix}';
};

async function main(N) {
  async function getAssembly(env) {
    const { instance } = await WebAssembly.instantiateStreaming(
      fetch("./linear_algebra.wasm"), env
    );
    return instance;
  }
  const lin = await linalg(getAssembly);
  function test() {
    const A = createRandomMatrix(N);
    const Ainv = lin.inverse(A, N);
    const B = lin.multiply(A, Ainv, N);
    const el = document.getElementById('result');
    if (N > 100) {
      const det = lin.determinant(B, N);
      el.innerHTML = `Too large to display matris of size ${N}x${N}. det(A*A^(-1)) = ${det}`;
      return;
    };
    el.innerHTML = '';
    const elA = document.createElement('div');
    katex.render(String.raw`A = ${printMatrix(A, N, 3)}`, elA, {
      throwOnError: false
    });
    el.appendChild(elA);
    const elAinv = document.createElement('div');
    katex.render(String.raw`A^{-1} = ${printMatrix(Ainv, N, 3)}`, elAinv, {
      throwOnError: false
    });
    el.appendChild(elAinv);
    const elB = document.createElement('div');
    katex.render(String.raw`A \cdot A^{-1} = ${printMatrix(B, N, 3)}`, elB, {
      throwOnError: false
    });
    el.appendChild(elB);
  }
  test();
}