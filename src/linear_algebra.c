
#define WASM_EXPORT __attribute__((visibility("default")))
#include <wasm_simd128.h>

#ifdef __wasm32__
// List of clang defines
// clang --target=wasm32 -x c /dev/null -dM -E

// Memory management
#include "walloc.h"

#define memalloc(x) malloc(x)
#define memfree(x, y) free(x)

/*
// Memory management (stupid bump allocator)
extern unsigned char __heap_base;
unsigned int bump_pointer = (int) &__heap_base;

WASM_EXPORT
void *malloc(int n) {
  unsigned int r = bump_pointer;
  bump_pointer += n;
  return (void *)r;
}

WASM_EXPORT
void free(int n) {
  bump_pointer -= n;
}
#define memalloc(x) malloc(x)
#define memfree(x, y) free(x)
*/

double fabs(double x) {
  if (x>0) {
    return x;
  }
  return -x;
}

#else

#include<stdio.h>
#include<stdlib.h>
#include<math.h>

#define memalloc(x) malloc(x)
#define memfree(x, y) free(x)

#endif


// Private non-exported functions

double sqrt (double v) {
  return v;
}
double norm(double *u, int N) {
  double r = 0;
  for(int i=0; i<N; i++) {
    double s = u[i];
    r += s*s;
  };
  return sqrt(r);
}

// computes the Hoseholder matrix H from vector v
void householder(double *v, double *H, int N) {
  double beta = -2/norm(v, N);
  for (int i = 0; i < N; i++) {
    for (int j = i; j < N; j++) {
      if (i == j) {
        H[j*N+i] = 1-beta*v[i]*v[i];
      } else {
        double s = v[i]*v[j];
        H[j*N+i] = s;
        H[i*N+j] = s;
      }
    }
  }
}

void multiply_minor(double *q, double *A, double *B, int n, int N) {

}

// A will be destroyed and will contain R
int QRDecompose(double *A, int N, double *Q) {
  // Set Identity to Q
  for (int j = 0; j < N; j++) {
      for (int i = 0; i < N; i++) {
        if (i == j) {
          Q[i * N + j] = 1.0;
        } else {
          Q[i * N + j] = 0.0;
        }
      }
  }
  for (int i = 0; i < N; i++) {
    // A minor from A from column and row i dimension NxN
    double norm_a = 0;
    for (int k = i; k < N; k++) {
      norm_a += A[k*N+i];
    }
    norm_a = sqrt(norm_a);
    double *u = memalloc(sizeof(double)*(N-i));
    double a1 = A[i*N];
    int sign_a1 = 1;
    if (a1 <  0) {
      sign_a1 = -1;
    }
    u[0] = a1 - sign_a1*norm_a;
    for (int k = 0; k < N-i; k++) {
      u[k] = A[k*N+i];
    }
    int n = N - i;
    double *q = memalloc(sizeof(double)*n*n);
    householder(u, q, N);
    double *B = memalloc(sizeof(double)*n*n);
    multiply_minor(q, A, B, n, N);
  }
  return 0;
}

/* INPUT: A - array of pointers to rows of a square matrix having dimension N
 *        Tol - small tolerance number to detect failure when the matrix is near degenerate
 * OUTPUT: Matrix A is changed, it contains a copy of both matrices L-E and U as A=(L-E)+U such that P*A=L*U.
 *        The permutation matrix is not stored as a matrix, but in an integer vector P of size N+1
 *        containing column indexes where the permutation matrix has "1". The last element P[N]=S+N,
 *        where S is the number of row exchanges needed for determinant computation, det(P)=(-1)^S
 */
int LUPDecompose(double *A, int N, int *P) {
  double Tol = 0;

  for (int i = 0; i <= N; i++) {
    P[i] = i; // Unit permutation matrix, P[N] initialized with N
  }
  for (int i = 0; i < N; i++) {
    double maxA = 0.0;
    int imax = i;

    for (int k = i; k < N; k++) {
      double absA = fabs(A[k * N + i]);
      if (absA > maxA) {
        maxA = absA;
        imax = k;
      }
    }

    if (maxA <= Tol) {
      // failure, matrix is degenerate
      return 0;
    }

    if (imax != i) {
      // pivoting P
      int ii = P[i];
      P[i] = P[imax];
      P[imax] = ii;

      // pivoting rows of A
      for (int j=0; j<N; j++) {
        double ptr = A[i*N+j];
        A[i*N+j] = A[imax*N+j];
        A[imax*N+j] = ptr;
      }

      // counting pivots starting from N (for determinant)
      P[N]++;
    }

    for (int j = i + 1; j < N; j++) {
      A[j * N + i] /= A[i * N + i];

      for (int k = i + 1; k < N; k++) {
        A[j * N + k] -= A[j * N + i] * A[i * N + k];
      }
    }
  }

  return 1;
}

/* INPUT: A,P filled in LUPDecompose; b - rhs vector; N - dimension
 * OUTPUT: x - solution vector of A*x=b
 */
void LUPSolve(double *A, int *P, double *b, int N, double *x) {
  for (int i = 0; i < N; i++) {
    x[i] = b[P[i]];
    for (int k = 0; k < i; k++) {
      x[i] -= A[i * N + k] * x[k];
    }
  }

  for (int i = N - 1; i >= 0; i--) {
    for (int k = i + 1; k < N; k++) {
      x[i] -= A[i * N + k] * x[k];
    }

    x[i] = x[i] / A[i * N + i];
  }
}

/* INPUT: A,P filled in LUPDecompose; N - dimension
 * OUTPUT: IA is the inverse of the initial matrix
 */
void LUPInvert(double *A, int *P, int N, double *IA) {

    for (int j = 0; j < N; j++) {
      for (int i = 0; i < N; i++) {
        if (P[i] == j) {
          IA[i * N + j] = 1.0;
        } else {
          IA[i * N + j] = 0.0;
        }

        for (int k = 0; k < i; k++) {
          IA[i * N + j] -= A[i * N + k] * IA[k * N + j];
        }
      }

      for (int i = N - 1; i >= 0; i--) {
        for (int k = i + 1; k < N; k++) {
          IA[i * N + j] -= A[i *N+k] * IA[k * N + j];
        }

        IA[i * N + j] = IA[i * N + j] / A[i * N + i];
      }
    }
}

/* INPUT: A,P filled in LUPDecompose; N - dimension.
 * OUTPUT: Function returns the determinant of the initial matrix
 */
double LUPDeterminant(double *A, int *P, int N) {
    double det = A[0];
    for (int i = 1; i < N; i++) {
      det *= A[i * N + i];
    }

    if ((P[N] - N) % 2 == 0) {
      return det;
    } else {
      return -det;
    }
}



// Public functions


WASM_EXPORT
void inverse(double *A, double *IA, int N) {
  int *P = (int *)memalloc((N+1)*sizeof(int));
  LUPDecompose(A, N, P);
  LUPInvert(A, P, N, IA);
  memfree(P, (N+1)*sizeof(int));
}

WASM_EXPORT
double determinant(double *A, int N) {
  int *P = (int *)memalloc((N+1)*sizeof(int));
  LUPDecompose(A, N, P);
  double d = LUPDeterminant(A, P, N);
  memfree(P, (N+1)*sizeof(int));
  return d;
}

WASM_EXPORT
double trace(double *A, int N) {
  double t = 0;
  for (int i = 0 ; i < N; i++) {
    t += A[i+N*i];
  };
  return t;
}

WASM_EXPORT
void multiply(double *X, double *Y, double *R, int N) {
  // Multiplies two matrices X*Y.
  for (int i = 0; i < N; i++) {
    for (int j = 0; j < N; j++) {
      double r = 0;
      for (int k = 0; k < N; k++) {
        r += X[j * N + k] * Y[k * N + i];
      }
      R[j * N + i] = r;
    }
  }
}

// WASM_EXPORT
// void multiply(double *X, double *Y, double *R, int N) {
//   // Multiplies two matrices X*Y.
//   for (int i = 0; i < N; i++) {
//     for (int j = 0; j < N; j++) {
//       v128_t r = wasm_f64x2_make(0, 0);
//       for (int k = 0; k < N; k += 2) {
//         int x1 = j * N + k;
//         int y1 = k * N + i;
//         v128_t a = wasm_f64x2_make(X[x1], X[x1 + 1]);
//         v128_t b = wasm_f64x2_make(Y[y1], Y[y1 + N]);
//         v128_t prod = wasm_f64x2_mul(a, b);
//         r = wasm_f64x2_add(prod, r);
//       }
//       double left = wasm_f64x2_extract_lane(r, 0);
//       double right = wasm_f64x2_extract_lane(r, 1);
//       R[j * N + i] = left+right;
//     }
//   }
// }

WASM_EXPORT
void transpose(double *A, int N) {
  for (int i = 0; i < N; i++) {
    for (int j = i + 1; j < N; j++) {
      double swap = A[i + j*N];
      A[i + j*N] = A [j + i*N];
      A[j + i*N] = swap;
    }
  }
}
