CC= clang
CFLAGS= --target=wasm32 -Oz -flto -nostdlib

LFLAGS= -Wl,--no-entry -Wl,--export-dynamic -Wl,--lto-O3 -Wl,--import-memory
# -Wl,-z,stack-size=$$[8 * 1024 * 1024]

all: js
	$(CC) $(CFLAGS) $(LFLAGS) -o bin/linear_algebra.wasm src/linear_algebra.c src/walloc.c

js:
	mkdir -p bin
	cp src/linalg.js bin/linalg.js

tests: all
	cp bin/linalg.js tests/linalg.js
	cp bin/linear_algebra.wasm tests/linear_algebra.wasm
	node tests/tests.js

deploy: all
	cp bin/linalg.js docs/linalg.js
	cp bin/linear_algebra.wasm docs/linear_algebra.wasm

clean:
	rm -f docs/linear_algebra.wasm
	rm -f docs/linalg.js
	rm -f tests/linear_algebra.wasm
	rm -f tests/linalg.js
	rm -f bin/linear_algebra.wasm
	rm -f bin/linalg.js