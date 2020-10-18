WEBASSEMBLY INDOMITABLE
=======================

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