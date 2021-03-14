MATRIX ALGEBRA
==============

**⚠️ WARNING: This is work in progress**

**⚠️ WARNING: This is only meant as a proof of concept. Real product will be done in Rust and use a wasm compiler.**

This is a simple RPEL to work with matrix algebra.

Numbers (basic operations):

> b = 5.6

> c = 9

> c*b+7


Vectors:

> v = [1, 2, 3]

Norm of a vector

> |v|

or

> norm(v)

Operations with matrices:

Define

> A = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]

Multiply
> B = A*A

Multiply by numbers
> C = 7*A

Power (only integers at the moment), division
> F = A^2

> E = A/C

Output is shown in LaTex with Katex


Building and running locally
-----------------------------

You need TypeScript and clang version > 11.0.0.

```bash
$ make
$ cd build
build $ python -m http.server 1234
```


ROADMAP
-------

- [ ] QR decomposition
- [ ] Eigenvalues and eigenvectors
- [ ] Complex numbers
- [ ] Example matrices (Identity, quaternions, octonions...)
- [ ] Functions on matrices
- [ ] Tests!!!!
- [ ] Pretify UI?

Implementation details
----------------------

This a very simple test of how to use a C program compiled to webassembly without the standard library (libc).

We use [walloc][1] as a [memory allocator][2] (!).

You might find in the git history an even simpler implementation of malloc and free.


Links
-----

* https://dassur.ma/things/c-to-webassembly/
* https://medium.com/@dougschaefer/going-straight-to-clang-for-webassembly-928df1484430
* https://github.com/PetterS/clang-wasm/blob/master/Makefile
* https://lld.llvm.org/WebAssembly.html

* https://gist.github.com/ichenq/2166882
* https://gist.github.com/ichenq/2166885
* https://github.com/ARMmbed/dlmalloc/blob/master/source/dlmalloc.c

[1]: https://github.com/wingo/walloc
[2]: https://wingolog.org/archives/2020/10/13/malloc-as-a-service