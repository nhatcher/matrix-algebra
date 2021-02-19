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
      line.push(`<span class="matrix-el">${val}</span>`);
    }
    mat.push(line.join(''));
  }
  return '<div class="matrix"><div class="matrix-row">' + mat.join('</div><div class="matrix-row">') + '</div></div>';
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
    const a_html = `<div class="equation"><div class="item">A = </div><div class="item">${printMatrix(A, N, 3)}</div></div>`;
    const b_html = `<div class="equation"><div class="item">A-1 = </div><div class="item">${printMatrix(Ainv, N, 3)}</div></div>`;
    const c_html = `<div class="equation"><div class="item">A*A-1 = </div><div class="item">${printMatrix(B, N, 3)}</div></div>`;
    el.innerHTML =  a_html + b_html + c_html
    //determinant(A, N) * determinant(B, N);   
  }
  test();
}