CC= ./clang+llvm-11.0.0-x86_64-linux-gnu-ubuntu-20.04/bin/clang
CFLAGS= --target=wasm32 -Oz -flto -nostdlib

LFLAGS= -Wl,--no-entry -Wl,--export-dynamic -Wl,--lto-O3 -Wl,--import-memory
# -Wl,-z,stack-size=$$[8 * 1024 * 1024]

all:
	$(CC) $(CFLAGS) $(LFLAGS) -o bin/linear_algebra.wasm src/linear_algebra.c src/walloc.c

tests: all
	cp bin/linalg.js tests/linalg.js
	cp bin/linear_algebra.wasm tests/linear_algebra.wasm
	node tests/tests.js


clean:
	rm -f tests/linear_algebra.wasm
	rm -f tests/linalg.js
	rm -f bin/linear_algebra.wasm