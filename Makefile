CC= $(CLANG)
CFLAGS= --target=wasm32 -Oz -flto -nostdlib

LFLAGS= -Wl,--no-entry -Wl,--export-dynamic -Wl,--lto-O3 -Wl,--import-memory
# -Wl,-z,stack-size=$$[8 * 1024 * 1024]

all:
	mkdir -p build
	$(CC) $(CFLAGS) $(LFLAGS) -o build/linear_algebra.wasm src/linear_algebra.c src/walloc.c
	tsc
	cp repl/* build/
	cp bin/* build/

tests: all
	cp build/linalg.js tests/linalg.js
	cp build/linear_algebra.wasm tests/linear_algebra.wasm
	node tests/tests.js


clean:
	rm -f tests/linear_algebra.wasm
	rm -f tests/linalg.js
	rm -f build/linear_algebra.wasm