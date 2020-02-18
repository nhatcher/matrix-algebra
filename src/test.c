
#include<stdio.h>
#include<stdlib.h>
#include<math.h>

#include "linear_algebra.h"

double *createRandomMatrix(int N) {
  int L = N * N;
  double *A = malloc(L * sizeof(double));
  for (int i=0; i<L; i++) {
    A[i] = 1+2*(1-0.5*random());
  };
  return A;
};

double *copy(double *A, int L) {
  double *B = malloc(L * sizeof(double));
  for (int i=0; i<L; i++) {
    B[i] = A[i];
  }
  return B;
}

int main() {
  int N = 1000;
  int L = N * N;
  double *A = createRandomMatrix(N);
  double *AC = copy(A, L);
  printf("Random matrix created!\n");
  double *B = malloc(L * sizeof(double));
  double *C = malloc(L * sizeof(double));
  inverse(AC, B, N);
  multiply(A, B, C, N);
  double d = determinant(C, N);
  printf("Determinant: %f\n", d);
  free(A);
  free(B);
  free(C);
  free(AC);
  return 0;
}
