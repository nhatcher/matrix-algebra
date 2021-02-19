async function main() {
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
  async function getAssembly(env) {
    const { instance } = await WebAssembly.instantiateStreaming(
      fetch("./linear_algebra.wasm"), env
    );
    return instance;
  }
  const lin = await linalg(getAssembly);
  function test() {
    const N = 1000;
    const A = createRandomMatrix(N);
    console.time('start');
    const B = lin.multiply(A, lin.inverse(A, N), N);
    console.log(lin.determinant(B, N));
    console.timeEnd('start');
    // console.log('all', A, B, determinant(A, N), determinant(B, N));
    /*const el = document.getElementById('result');
    const b_html = 'B = ' + printMatrix(B, N, 3);
    const a_html = 'A = ' + printMatrix(A, N, 3);
    el.innerHTML =  a_html + b_html;*/
    //determinant(A, N) * determinant(B, N);
  }
  test();
}