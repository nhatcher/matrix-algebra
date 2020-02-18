
#define WASM_EXPORT __attribute__((visibility("default")))

#ifdef __wasm32__
// List of clang defines
// clang --target=wasm32 -x c /dev/null -dM -E

// Memory management
extern unsigned char __heap_base;
unsigned int bump_pointer = (int) &__heap_base;

WASM_EXPORT
void *pmalloc(int n) {
  unsigned int r = bump_pointer;
  bump_pointer += n;
  return (void *)r;
}

WASM_EXPORT
void pfree(int n) {
  bump_pointer -= n;
}

double fabs(double x) {
  if (x>0) {
    return x;
  }
  return -x;
}

#define memalloc(x) pmalloc(x)
#define memfree(x, y) pfree(y)

#else

#include<stdio.h>
#include<stdlib.h>
#include<math.h>

#define memalloc(x) malloc(x)
#define memfree(x, y) free(x)

#endif


// Private non-exported functions


/* INPUT: A - array of pointers to rows of a square matrix having dimension N
 *        Tol - small tolerance number to detect failure when the matrix is near degenerate
 * OUTPUT: Matrix A is changed, it contains a copy of both matrices L-E and U as A=(L-E)+U such that P*A=L*U.
 *        The permutation matrix is not stored as a matrix, but in an integer vector P of size N+1 
 *        containing column indexes where the permutation matrix has "1". The last element P[N]=S+N, 
 *        where S is the number of row exchanges needed for determinant computation, det(P)=(-1)^S    
 */
int LUPDecompose(double *A, int N, int *P) {
  int i, j, k, imax; 
  double maxA, absA;
  double Tol = 0;

  for (i = 0; i <= N; i++) {
    P[i] = i; // Unit permutation matrix, P[N] initialized with N
  }
  for (i = 0; i < N; i++) {
    maxA = 0.0;
    imax = i;

    for (k = i; k < N; k++) {
      if ((absA = fabs(A[k * N + i])) > maxA) { 
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
      j = P[i];
      P[i] = P[imax];
      P[imax] = j;

      // pivoting rows of A
      for (int j=0; j<N; j++) {
        double ptr = A[i*N+j];
        A[i*N+j] = A[imax*N+j];
        A[imax*N+j] = ptr;
      }

      // counting pivots starting from N (for determinant)
      P[N]++;
    }

    for (j = i + 1; j < N; j++) {
      A[j * N + i] /= A[i * N + i];

      for (k = i + 1; k < N; k++) {
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
  int *P = memalloc((N+1)*sizeof(int));
  int r = LUPDecompose(A, N, P);
  LUPInvert(A, P, N, IA);
  memfree(P, (N+1)*sizeof(int));
}

WASM_EXPORT
double determinant(double *A, int N) {
  int *P = memalloc((N+1)*sizeof(int));
  int r = LUPDecompose(A, N, P);
  double d = LUPDeterminant(A, P, N);
  memfree(P, (N+1)*sizeof(int));
  return d;
}

WASM_EXPORT
void multiply(double *X, double *Y, double *R, int N) {
  // Multiplies two matrices X*Y.
  for (int i = 0; i < N; i++) {
    for (int j = 0; j < N; j++) {
      double r = 0;
      for (int k = 0; k < N; k++) {
        r += X[i * N + k] * Y[k * N + j];
      }
      R[i * N + j] = r;
    }
  }
}
