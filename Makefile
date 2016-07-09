PROJECT = "Deployment Dashboard"

PATH  := node_modules/.bin:$(PATH)
SHELL := /bin/bash

ifndef VERBOSE
	Q := @
	NIL := > /dev/null 2>&1
endif

NODE_ENV ?= development

NO_COLOR=\033[0m
OK_COLOR=\033[32;01m
OK_STRING=$(OK_COLOR)[OK]$(NO_COLOR)
AWK_CMD = awk '{ printf "%-30s %-10s\n",$$1, $$2; }'
PRINT_OK = printf "$@ $(OK_STRING)\n" | $(AWK_CMD)
NODE_ENV_STRING = $(OK_COLOR)[$(NODE_ENV)]$(NO_COLOR)
PRINT_ENV = printf "$@ $(NODE_ENV_STRING)\n" | $(AWK_CMD)

.PHONY: server
server:
	$(Q) nodemon --debug --delay 1000ms --ignore lib/ -e js dist

.PHONY: install
install:
	$(Q) npm install --loglevel error
	@$(PRINT_OK)

.PHONY: watch
watch:
	$(Q) babel lib --out-dir dist --watch --source-maps
	@$(PRINT_OK)

.PHONY: build
build: clean
	$(Q) babel lib --out-dir dist
	@$(PRINT_OK)

.PHONY: update
update:
	$(Q) david
	@$(PRINT_OK)

.PHONY: upgrade
upgrade:
	$(Q) david update
	@$(PRINT_OK)

.PHONY: lint
lint:
	$(Q) eslint lib/*.js
	@$(PRINT_OK)

.PHONY: clean
clean:
	$(Q) rm -rf dist
	@$(PRINT_OK)
