test:
	@NODE_ENV=test ./node_modules/.bin/mocha --reporter spec "./**/*.mspec.js"

test-grep:
	@NODE_ENV=test ./node_modules/.bin/mocha --reporter spec "./**/*.mspec.js" --grep $(search)

test-cov:
	@NODE_NV=test ./node_modules/.bin/istanbul cover --hook-run-in-context ./node_modules/.bin/_mocha -- "./**/*.mspec.js"

.PHONY: test test-grep test-cov