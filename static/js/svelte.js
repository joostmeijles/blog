
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function create_slot(definition, ctx, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.ctx, definition[1](fn ? fn(ctx) : {})))
            : ctx.$$scope.ctx;
    }
    function get_slot_changes(definition, ctx, changed, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.changed || {}, definition[1](fn ? fn(changed) : {})))
            : ctx.$$scope.changed || {};
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = current_component;
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
                return ret;
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* svelte/Modal.svelte generated by Svelte v3.12.1 */

    const file = "svelte/Modal.svelte";

    function create_fragment(ctx) {
    	var div0, t0, div1, button, t2, current, dispose;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			button = element("button");
    			button.textContent = "X";
    			t2 = space();

    			if (default_slot) default_slot.c();
    			attr_dev(div0, "class", "modal-background svelte-n55dj6");
    			add_location(div0, file, 37, 0, 527);
    			attr_dev(button, "class", "svelte-n55dj6");
    			add_location(button, file, 40, 1, 619);

    			attr_dev(div1, "class", "modal svelte-n55dj6");
    			add_location(div1, file, 39, 0, 598);

    			dispose = [
    				listen_dev(div0, "click", ctx.click_handler),
    				listen_dev(button, "click", ctx.click_handler_1)
    			];
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(div1_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, button);
    			append_dev(div1, t2);

    			if (default_slot) {
    				default_slot.m(div1, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div0);
    				detach_dev(t0);
    				detach_dev(div1);
    			}

    			if (default_slot) default_slot.d(detaching);
    			run_all(dispose);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();

    	let { $$slots = {}, $$scope } = $$props;

    	const click_handler = () => dispatch("close");

    	const click_handler_1 = () => dispatch("close");

    	$$self.$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {};

    	return {
    		dispatch,
    		click_handler,
    		click_handler_1,
    		$$slots,
    		$$scope
    	};
    }

    class Modal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Modal", options, id: create_fragment.name });
    	}
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function commonjsRequire () {
    	throw new Error('Dynamic requires are not currently supported by rollup-plugin-commonjs');
    }

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var inherits_browser = createCommonjsModule(function (module) {
    if (typeof Object.create === 'function') {
      // implementation from standard node.js 'util' module
      module.exports = function inherits(ctor, superCtor) {
        ctor.super_ = superCtor;
        ctor.prototype = Object.create(superCtor.prototype, {
          constructor: {
            value: ctor,
            enumerable: false,
            writable: true,
            configurable: true
          }
        });
      };
    } else {
      // old school shim for old browsers
      module.exports = function inherits(ctor, superCtor) {
        ctor.super_ = superCtor;
        var TempCtor = function () {};
        TempCtor.prototype = superCtor.prototype;
        ctor.prototype = new TempCtor();
        ctor.prototype.constructor = ctor;
      };
    }
    });

    var hasOwn = Object.prototype.hasOwnProperty;
    var toString = Object.prototype.toString;

    var foreach = function forEach (obj, fn, ctx) {
        if (toString.call(fn) !== '[object Function]') {
            throw new TypeError('iterator must be a function');
        }
        var l = obj.length;
        if (l === +l) {
            for (var i = 0; i < l; i++) {
                fn.call(ctx, obj[i], i, obj);
            }
        } else {
            for (var k in obj) {
                if (hasOwn.call(obj, k)) {
                    fn.call(ctx, obj[k], k, obj);
                }
            }
        }
    };

    // This file hosts our error definitions
    // We use custom error "types" so that we can act on them when we need it
    // e.g.: if error instanceof errors.UnparsableJSON then..



    function AlgoliaSearchError(message, extraProperties) {
      var forEach = foreach;

      var error = this;

      // try to get a stacktrace
      if (typeof Error.captureStackTrace === 'function') {
        Error.captureStackTrace(this, this.constructor);
      } else {
        error.stack = (new Error()).stack || 'Cannot get a stacktrace, browser is too old';
      }

      this.name = 'AlgoliaSearchError';
      this.message = message || 'Unknown error';

      if (extraProperties) {
        forEach(extraProperties, function addToErrorObject(value, key) {
          error[key] = value;
        });
      }
    }

    inherits_browser(AlgoliaSearchError, Error);

    function createCustomError(name, message) {
      function AlgoliaSearchCustomError() {
        var args = Array.prototype.slice.call(arguments, 0);

        // custom message not set, use default
        if (typeof args[0] !== 'string') {
          args.unshift(message);
        }

        AlgoliaSearchError.apply(this, args);
        this.name = 'AlgoliaSearch' + name + 'Error';
      }

      inherits_browser(AlgoliaSearchCustomError, AlgoliaSearchError);

      return AlgoliaSearchCustomError;
    }

    // late exports to let various fn defs and inherits take place
    var errors = {
      AlgoliaSearchError: AlgoliaSearchError,
      UnparsableJSON: createCustomError(
        'UnparsableJSON',
        'Could not parse the incoming response as JSON, see err.more for details'
      ),
      RequestTimeout: createCustomError(
        'RequestTimeout',
        'Request timed out before getting a response'
      ),
      Network: createCustomError(
        'Network',
        'Network issue, see err.more for details'
      ),
      JSONPScriptFail: createCustomError(
        'JSONPScriptFail',
        '<script> was loaded but did not call our provided callback'
      ),
      ValidUntilNotFound: createCustomError(
        'ValidUntilNotFound',
        'The SecuredAPIKey does not have a validUntil parameter.'
      ),
      JSONPScriptError: createCustomError(
        'JSONPScriptError',
        '<script> unable to load due to an `error` event on it'
      ),
      ObjectNotFound: createCustomError(
        'ObjectNotFound',
        'Object not found'
      ),
      Unknown: createCustomError(
        'Unknown',
        'Unknown error occured'
      )
    };

    // Parse cloud does not supports setTimeout
    // We do not store a setTimeout reference in the client everytime
    // We only fallback to a fake setTimeout when not available
    // setTimeout cannot be override globally sadly
    var exitPromise = function exitPromise(fn, _setTimeout) {
      _setTimeout(fn, 0);
    };

    var buildSearchMethod_1 = buildSearchMethod;



    /**
     * Creates a search method to be used in clients
     * @param {string} queryParam the name of the attribute used for the query
     * @param {string} url the url
     * @return {function} the search method
     */
    function buildSearchMethod(queryParam, url) {
      /**
       * The search method. Prepares the data and send the query to Algolia.
       * @param {string} query the string used for query search
       * @param {object} args additional parameters to send with the search
       * @param {function} [callback] the callback to be called with the client gets the answer
       * @return {undefined|Promise} If the callback is not provided then this methods returns a Promise
       */
      return function search(query, args, callback) {
        // warn V2 users on how to search
        if (typeof query === 'function' && typeof args === 'object' ||
          typeof callback === 'object') {
          // .search(query, params, cb)
          // .search(cb, params)
          throw new errors.AlgoliaSearchError('index.search usage is index.search(query, params, cb)');
        }

        // Normalizing the function signature
        if (arguments.length === 0 || typeof query === 'function') {
          // Usage : .search(), .search(cb)
          callback = query;
          query = '';
        } else if (arguments.length === 1 || typeof args === 'function') {
          // Usage : .search(query/args), .search(query, cb)
          callback = args;
          args = undefined;
        }
        // At this point we have 3 arguments with values

        // Usage : .search(args) // careful: typeof null === 'object'
        if (typeof query === 'object' && query !== null) {
          args = query;
          query = undefined;
        } else if (query === undefined || query === null) { // .search(undefined/null)
          query = '';
        }

        var params = '';

        if (query !== undefined) {
          params += queryParam + '=' + encodeURIComponent(query);
        }

        var additionalUA;
        if (args !== undefined) {
          if (args.additionalUA) {
            additionalUA = args.additionalUA;
            delete args.additionalUA;
          }
          // `_getSearchParams` will augment params, do not be fooled by the = versus += from previous if
          params = this.as._getSearchParams(args, params);
        }


        return this._search(params, url, callback, additionalUA);
      };
    }

    var deprecate = function deprecate(fn, message) {
      var warned = false;

      function deprecated() {
        if (!warned) {
          /* eslint no-console:0 */
          console.warn(message);
          warned = true;
        }

        return fn.apply(this, arguments);
      }

      return deprecated;
    };

    var deprecatedMessage = function deprecatedMessage(previousUsage, newUsage) {
      var githubAnchorLink = previousUsage.toLowerCase()
        .replace(/[\.\(\)]/g, '');

      return 'algoliasearch: `' + previousUsage + '` was replaced by `' + newUsage +
        '`. Please see https://github.com/algolia/algoliasearch-client-javascript/wiki/Deprecated#' + githubAnchorLink;
    };

    var merge = function merge(destination/* , sources */) {
      var sources = Array.prototype.slice.call(arguments);

      foreach(sources, function(source) {
        for (var keyName in source) {
          if (source.hasOwnProperty(keyName)) {
            if (typeof destination[keyName] === 'object' && typeof source[keyName] === 'object') {
              destination[keyName] = merge({}, destination[keyName], source[keyName]);
            } else if (source[keyName] !== undefined) {
              destination[keyName] = source[keyName];
            }
          }
        }
      });

      return destination;
    };

    var clone = function clone(obj) {
      return JSON.parse(JSON.stringify(obj));
    };

    var toStr = Object.prototype.toString;

    var isArguments = function isArguments(value) {
    	var str = toStr.call(value);
    	var isArgs = str === '[object Arguments]';
    	if (!isArgs) {
    		isArgs = str !== '[object Array]' &&
    			value !== null &&
    			typeof value === 'object' &&
    			typeof value.length === 'number' &&
    			value.length >= 0 &&
    			toStr.call(value.callee) === '[object Function]';
    	}
    	return isArgs;
    };

    var keysShim;
    if (!Object.keys) {
    	// modified from https://github.com/es-shims/es5-shim
    	var has = Object.prototype.hasOwnProperty;
    	var toStr$1 = Object.prototype.toString;
    	var isArgs = isArguments; // eslint-disable-line global-require
    	var isEnumerable = Object.prototype.propertyIsEnumerable;
    	var hasDontEnumBug = !isEnumerable.call({ toString: null }, 'toString');
    	var hasProtoEnumBug = isEnumerable.call(function () {}, 'prototype');
    	var dontEnums = [
    		'toString',
    		'toLocaleString',
    		'valueOf',
    		'hasOwnProperty',
    		'isPrototypeOf',
    		'propertyIsEnumerable',
    		'constructor'
    	];
    	var equalsConstructorPrototype = function (o) {
    		var ctor = o.constructor;
    		return ctor && ctor.prototype === o;
    	};
    	var excludedKeys = {
    		$applicationCache: true,
    		$console: true,
    		$external: true,
    		$frame: true,
    		$frameElement: true,
    		$frames: true,
    		$innerHeight: true,
    		$innerWidth: true,
    		$onmozfullscreenchange: true,
    		$onmozfullscreenerror: true,
    		$outerHeight: true,
    		$outerWidth: true,
    		$pageXOffset: true,
    		$pageYOffset: true,
    		$parent: true,
    		$scrollLeft: true,
    		$scrollTop: true,
    		$scrollX: true,
    		$scrollY: true,
    		$self: true,
    		$webkitIndexedDB: true,
    		$webkitStorageInfo: true,
    		$window: true
    	};
    	var hasAutomationEqualityBug = (function () {
    		/* global window */
    		if (typeof window === 'undefined') { return false; }
    		for (var k in window) {
    			try {
    				if (!excludedKeys['$' + k] && has.call(window, k) && window[k] !== null && typeof window[k] === 'object') {
    					try {
    						equalsConstructorPrototype(window[k]);
    					} catch (e) {
    						return true;
    					}
    				}
    			} catch (e) {
    				return true;
    			}
    		}
    		return false;
    	}());
    	var equalsConstructorPrototypeIfNotBuggy = function (o) {
    		/* global window */
    		if (typeof window === 'undefined' || !hasAutomationEqualityBug) {
    			return equalsConstructorPrototype(o);
    		}
    		try {
    			return equalsConstructorPrototype(o);
    		} catch (e) {
    			return false;
    		}
    	};

    	keysShim = function keys(object) {
    		var isObject = object !== null && typeof object === 'object';
    		var isFunction = toStr$1.call(object) === '[object Function]';
    		var isArguments = isArgs(object);
    		var isString = isObject && toStr$1.call(object) === '[object String]';
    		var theKeys = [];

    		if (!isObject && !isFunction && !isArguments) {
    			throw new TypeError('Object.keys called on a non-object');
    		}

    		var skipProto = hasProtoEnumBug && isFunction;
    		if (isString && object.length > 0 && !has.call(object, 0)) {
    			for (var i = 0; i < object.length; ++i) {
    				theKeys.push(String(i));
    			}
    		}

    		if (isArguments && object.length > 0) {
    			for (var j = 0; j < object.length; ++j) {
    				theKeys.push(String(j));
    			}
    		} else {
    			for (var name in object) {
    				if (!(skipProto && name === 'prototype') && has.call(object, name)) {
    					theKeys.push(String(name));
    				}
    			}
    		}

    		if (hasDontEnumBug) {
    			var skipConstructor = equalsConstructorPrototypeIfNotBuggy(object);

    			for (var k = 0; k < dontEnums.length; ++k) {
    				if (!(skipConstructor && dontEnums[k] === 'constructor') && has.call(object, dontEnums[k])) {
    					theKeys.push(dontEnums[k]);
    				}
    			}
    		}
    		return theKeys;
    	};
    }
    var implementation = keysShim;

    var slice = Array.prototype.slice;


    var origKeys = Object.keys;
    var keysShim$1 = origKeys ? function keys(o) { return origKeys(o); } : implementation;

    var originalKeys = Object.keys;

    keysShim$1.shim = function shimObjectKeys() {
    	if (Object.keys) {
    		var keysWorksWithArguments = (function () {
    			// Safari 5.0 bug
    			var args = Object.keys(arguments);
    			return args && args.length === arguments.length;
    		}(1, 2));
    		if (!keysWorksWithArguments) {
    			Object.keys = function keys(object) { // eslint-disable-line func-name-matching
    				if (isArguments(object)) {
    					return originalKeys(slice.call(object));
    				}
    				return originalKeys(object);
    			};
    		}
    	} else {
    		Object.keys = keysShim$1;
    	}
    	return Object.keys || keysShim$1;
    };

    var objectKeys = keysShim$1;

    var omit = function omit(obj, test) {
      var keys = objectKeys;
      var foreach$1 = foreach;

      var filtered = {};

      foreach$1(keys(obj), function doFilter(keyName) {
        if (test(keyName) !== true) {
          filtered[keyName] = obj[keyName];
        }
      });

      return filtered;
    };

    var toString$1 = {}.toString;

    var isarray = Array.isArray || function (arr) {
      return toString$1.call(arr) == '[object Array]';
    };

    var map = function map(arr, fn) {
      var newArr = [];
      foreach(arr, function(item, itemIndex) {
        newArr.push(fn(item, itemIndex, arr));
      });
      return newArr;
    };

    var IndexCore_1 = IndexCore;

    /*
    * Index class constructor.
    * You should not use this method directly but use initIndex() function
    */
    function IndexCore(algoliasearch, indexName) {
      this.indexName = indexName;
      this.as = algoliasearch;
      this.typeAheadArgs = null;
      this.typeAheadValueOption = null;

      // make sure every index instance has it's own cache
      this.cache = {};
    }

    /*
    * Clear all queries in cache
    */
    IndexCore.prototype.clearCache = function() {
      this.cache = {};
    };

    /*
    * Search inside the index using XMLHttpRequest request (Using a POST query to
    * minimize number of OPTIONS queries: Cross-Origin Resource Sharing).
    *
    * @param {string} [query] the full text query
    * @param {object} [args] (optional) if set, contains an object with query parameters:
    * - page: (integer) Pagination parameter used to select the page to retrieve.
    *                   Page is zero-based and defaults to 0. Thus,
    *                   to retrieve the 10th page you need to set page=9
    * - hitsPerPage: (integer) Pagination parameter used to select the number of hits per page. Defaults to 20.
    * - attributesToRetrieve: a string that contains the list of object attributes
    * you want to retrieve (let you minimize the answer size).
    *   Attributes are separated with a comma (for example "name,address").
    *   You can also use an array (for example ["name","address"]).
    *   By default, all attributes are retrieved. You can also use '*' to retrieve all
    *   values when an attributesToRetrieve setting is specified for your index.
    * - attributesToHighlight: a string that contains the list of attributes you
    *   want to highlight according to the query.
    *   Attributes are separated by a comma. You can also use an array (for example ["name","address"]).
    *   If an attribute has no match for the query, the raw value is returned.
    *   By default all indexed text attributes are highlighted.
    *   You can use `*` if you want to highlight all textual attributes.
    *   Numerical attributes are not highlighted.
    *   A matchLevel is returned for each highlighted attribute and can contain:
    *      - full: if all the query terms were found in the attribute,
    *      - partial: if only some of the query terms were found,
    *      - none: if none of the query terms were found.
    * - attributesToSnippet: a string that contains the list of attributes to snippet alongside
    * the number of words to return (syntax is `attributeName:nbWords`).
    *    Attributes are separated by a comma (Example: attributesToSnippet=name:10,content:10).
    *    You can also use an array (Example: attributesToSnippet: ['name:10','content:10']).
    *    By default no snippet is computed.
    * - minWordSizefor1Typo: the minimum number of characters in a query word to accept one typo in this word.
    * Defaults to 3.
    * - minWordSizefor2Typos: the minimum number of characters in a query word
    * to accept two typos in this word. Defaults to 7.
    * - getRankingInfo: if set to 1, the result hits will contain ranking
    * information in _rankingInfo attribute.
    * - aroundLatLng: search for entries around a given
    * latitude/longitude (specified as two floats separated by a comma).
    *   For example aroundLatLng=47.316669,5.016670).
    *   You can specify the maximum distance in meters with the aroundRadius parameter (in meters)
    *   and the precision for ranking with aroundPrecision
    *   (for example if you set aroundPrecision=100, two objects that are distant of
    *   less than 100m will be considered as identical for "geo" ranking parameter).
    *   At indexing, you should specify geoloc of an object with the _geoloc attribute
    *   (in the form {"_geoloc":{"lat":48.853409, "lng":2.348800}})
    * - insideBoundingBox: search entries inside a given area defined by the two extreme points
    * of a rectangle (defined by 4 floats: p1Lat,p1Lng,p2Lat,p2Lng).
    *   For example insideBoundingBox=47.3165,4.9665,47.3424,5.0201).
    *   At indexing, you should specify geoloc of an object with the _geoloc attribute
    *   (in the form {"_geoloc":{"lat":48.853409, "lng":2.348800}})
    * - numericFilters: a string that contains the list of numeric filters you want to
    * apply separated by a comma.
    *   The syntax of one filter is `attributeName` followed by `operand` followed by `value`.
    *   Supported operands are `<`, `<=`, `=`, `>` and `>=`.
    *   You can have multiple conditions on one attribute like for example numericFilters=price>100,price<1000.
    *   You can also use an array (for example numericFilters: ["price>100","price<1000"]).
    * - tagFilters: filter the query by a set of tags. You can AND tags by separating them by commas.
    *   To OR tags, you must add parentheses. For example, tags=tag1,(tag2,tag3) means tag1 AND (tag2 OR tag3).
    *   You can also use an array, for example tagFilters: ["tag1",["tag2","tag3"]]
    *   means tag1 AND (tag2 OR tag3).
    *   At indexing, tags should be added in the _tags** attribute
    *   of objects (for example {"_tags":["tag1","tag2"]}).
    * - facetFilters: filter the query by a list of facets.
    *   Facets are separated by commas and each facet is encoded as `attributeName:value`.
    *   For example: `facetFilters=category:Book,author:John%20Doe`.
    *   You can also use an array (for example `["category:Book","author:John%20Doe"]`).
    * - facets: List of object attributes that you want to use for faceting.
    *   Comma separated list: `"category,author"` or array `['category','author']`
    *   Only attributes that have been added in **attributesForFaceting** index setting
    *   can be used in this parameter.
    *   You can also use `*` to perform faceting on all attributes specified in **attributesForFaceting**.
    * - queryType: select how the query words are interpreted, it can be one of the following value:
    *    - prefixAll: all query words are interpreted as prefixes,
    *    - prefixLast: only the last word is interpreted as a prefix (default behavior),
    *    - prefixNone: no query word is interpreted as a prefix. This option is not recommended.
    * - optionalWords: a string that contains the list of words that should
    * be considered as optional when found in the query.
    *   Comma separated and array are accepted.
    * - distinct: If set to 1, enable the distinct feature (disabled by default)
    * if the attributeForDistinct index setting is set.
    *   This feature is similar to the SQL "distinct" keyword: when enabled
    *   in a query with the distinct=1 parameter,
    *   all hits containing a duplicate value for the attributeForDistinct attribute are removed from results.
    *   For example, if the chosen attribute is show_name and several hits have
    *   the same value for show_name, then only the best
    *   one is kept and others are removed.
    * - restrictSearchableAttributes: List of attributes you want to use for
    * textual search (must be a subset of the attributesToIndex index setting)
    * either comma separated or as an array
    * @param {function} [callback] the result callback called with two arguments:
    *  error: null or Error('message'). If false, the content contains the error.
    *  content: the server answer that contains the list of results.
    */
    IndexCore.prototype.search = buildSearchMethod_1('query');

    /*
    * -- BETA --
    * Search a record similar to the query inside the index using XMLHttpRequest request (Using a POST query to
    * minimize number of OPTIONS queries: Cross-Origin Resource Sharing).
    *
    * @param {string} [query] the similar query
    * @param {object} [args] (optional) if set, contains an object with query parameters.
    *   All search parameters are supported (see search function), restrictSearchableAttributes and facetFilters
    *   are the two most useful to restrict the similar results and get more relevant content
    */
    IndexCore.prototype.similarSearch = deprecate(
      buildSearchMethod_1('similarQuery'),
      deprecatedMessage(
        'index.similarSearch(query[, callback])',
        'index.search({ similarQuery: query }[, callback])'
      )
    );

    /*
    * Browse index content. The response content will have a `cursor` property that you can use
    * to browse subsequent pages for this query. Use `index.browseFrom(cursor)` when you want.
    *
    * @param {string} query - The full text query
    * @param {Object} [queryParameters] - Any search query parameter
    * @param {Function} [callback] - The result callback called with two arguments
    *   error: null or Error('message')
    *   content: the server answer with the browse result
    * @return {Promise|undefined} Returns a promise if no callback given
    * @example
    * index.browse('cool songs', {
    *   tagFilters: 'public,comments',
    *   hitsPerPage: 500
    * }, callback);
    * @see {@link https://www.algolia.com/doc/rest_api#Browse|Algolia REST API Documentation}
    */
    IndexCore.prototype.browse = function(query, queryParameters, callback) {
      var merge$1 = merge;

      var indexObj = this;

      var page;
      var hitsPerPage;

      // we check variadic calls that are not the one defined
      // .browse()/.browse(fn)
      // => page = 0
      if (arguments.length === 0 || arguments.length === 1 && typeof arguments[0] === 'function') {
        page = 0;
        callback = arguments[0];
        query = undefined;
      } else if (typeof arguments[0] === 'number') {
        // .browse(2)/.browse(2, 10)/.browse(2, fn)/.browse(2, 10, fn)
        page = arguments[0];
        if (typeof arguments[1] === 'number') {
          hitsPerPage = arguments[1];
        } else if (typeof arguments[1] === 'function') {
          callback = arguments[1];
          hitsPerPage = undefined;
        }
        query = undefined;
        queryParameters = undefined;
      } else if (typeof arguments[0] === 'object') {
        // .browse(queryParameters)/.browse(queryParameters, cb)
        if (typeof arguments[1] === 'function') {
          callback = arguments[1];
        }
        queryParameters = arguments[0];
        query = undefined;
      } else if (typeof arguments[0] === 'string' && typeof arguments[1] === 'function') {
        // .browse(query, cb)
        callback = arguments[1];
        queryParameters = undefined;
      }

      // otherwise it's a .browse(query)/.browse(query, queryParameters)/.browse(query, queryParameters, cb)

      // get search query parameters combining various possible calls
      // to .browse();
      queryParameters = merge$1({}, queryParameters || {}, {
        page: page,
        hitsPerPage: hitsPerPage,
        query: query
      });

      var params = this.as._getSearchParams(queryParameters, '');

      return this.as._jsonRequest({
        method: 'POST',
        url: '/1/indexes/' + encodeURIComponent(indexObj.indexName) + '/browse',
        body: {params: params},
        hostType: 'read',
        callback: callback
      });
    };

    /*
    * Continue browsing from a previous position (cursor), obtained via a call to `.browse()`.
    *
    * @param {string} query - The full text query
    * @param {Object} [queryParameters] - Any search query parameter
    * @param {Function} [callback] - The result callback called with two arguments
    *   error: null or Error('message')
    *   content: the server answer with the browse result
    * @return {Promise|undefined} Returns a promise if no callback given
    * @example
    * index.browseFrom('14lkfsakl32', callback);
    * @see {@link https://www.algolia.com/doc/rest_api#Browse|Algolia REST API Documentation}
    */
    IndexCore.prototype.browseFrom = function(cursor, callback) {
      return this.as._jsonRequest({
        method: 'POST',
        url: '/1/indexes/' + encodeURIComponent(this.indexName) + '/browse',
        body: {cursor: cursor},
        hostType: 'read',
        callback: callback
      });
    };

    /*
    * Search for facet values
    * https://www.algolia.com/doc/rest-api/search#search-for-facet-values
    *
    * @param {string} params.facetName Facet name, name of the attribute to search for values in.
    * Must be declared as a facet
    * @param {string} params.facetQuery Query for the facet search
    * @param {string} [params.*] Any search parameter of Algolia,
    * see https://www.algolia.com/doc/api-client/javascript/search#search-parameters
    * Pagination is not supported. The page and hitsPerPage parameters will be ignored.
    * @param callback (optional)
    */
    IndexCore.prototype.searchForFacetValues = function(params, callback) {
      var clone$1 = clone;
      var omit$1 = omit;
      var usage = 'Usage: index.searchForFacetValues({facetName, facetQuery, ...params}[, callback])';

      if (params.facetName === undefined || params.facetQuery === undefined) {
        throw new Error(usage);
      }

      var facetName = params.facetName;
      var filteredParams = omit$1(clone$1(params), function(keyName) {
        return keyName === 'facetName';
      });
      var searchParameters = this.as._getSearchParams(filteredParams, '');

      return this.as._jsonRequest({
        method: 'POST',
        url: '/1/indexes/' +
          encodeURIComponent(this.indexName) + '/facets/' + encodeURIComponent(facetName) + '/query',
        hostType: 'read',
        body: {params: searchParameters},
        callback: callback
      });
    };

    IndexCore.prototype.searchFacet = deprecate(function(params, callback) {
      return this.searchForFacetValues(params, callback);
    }, deprecatedMessage(
      'index.searchFacet(params[, callback])',
      'index.searchForFacetValues(params[, callback])'
    ));

    IndexCore.prototype._search = function(params, url, callback, additionalUA) {
      return this.as._jsonRequest({
        cache: this.cache,
        method: 'POST',
        url: url || '/1/indexes/' + encodeURIComponent(this.indexName) + '/query',
        body: {params: params},
        hostType: 'read',
        fallback: {
          method: 'GET',
          url: '/1/indexes/' + encodeURIComponent(this.indexName),
          body: {params: params}
        },
        callback: callback,
        additionalUA: additionalUA
      });
    };

    /*
    * Get an object from this index
    *
    * @param objectID the unique identifier of the object to retrieve
    * @param attrs (optional) if set, contains the array of attribute names to retrieve
    * @param callback (optional) the result callback called with two arguments
    *  error: null or Error('message')
    *  content: the object to retrieve or the error message if a failure occurred
    */
    IndexCore.prototype.getObject = function(objectID, attrs, callback) {
      var indexObj = this;

      if (arguments.length === 1 || typeof attrs === 'function') {
        callback = attrs;
        attrs = undefined;
      }

      var params = '';
      if (attrs !== undefined) {
        params = '?attributes=';
        for (var i = 0; i < attrs.length; ++i) {
          if (i !== 0) {
            params += ',';
          }
          params += attrs[i];
        }
      }

      return this.as._jsonRequest({
        method: 'GET',
        url: '/1/indexes/' + encodeURIComponent(indexObj.indexName) + '/' + encodeURIComponent(objectID) + params,
        hostType: 'read',
        callback: callback
      });
    };

    /*
    * Get several objects from this index
    *
    * @param objectIDs the array of unique identifier of objects to retrieve
    */
    IndexCore.prototype.getObjects = function(objectIDs, attributesToRetrieve, callback) {
      var isArray = isarray;
      var map$1 = map;

      var usage = 'Usage: index.getObjects(arrayOfObjectIDs[, callback])';

      if (!isArray(objectIDs)) {
        throw new Error(usage);
      }

      var indexObj = this;

      if (arguments.length === 1 || typeof attributesToRetrieve === 'function') {
        callback = attributesToRetrieve;
        attributesToRetrieve = undefined;
      }

      var body = {
        requests: map$1(objectIDs, function prepareRequest(objectID) {
          var request = {
            indexName: indexObj.indexName,
            objectID: objectID
          };

          if (attributesToRetrieve) {
            request.attributesToRetrieve = attributesToRetrieve.join(',');
          }

          return request;
        })
      };

      return this.as._jsonRequest({
        method: 'POST',
        url: '/1/indexes/*/objects',
        hostType: 'read',
        body: body,
        callback: callback
      });
    };

    IndexCore.prototype.as = null;
    IndexCore.prototype.indexName = null;
    IndexCore.prototype.typeAheadArgs = null;
    IndexCore.prototype.typeAheadValueOption = null;

    /**
     * Helpers.
     */

    var s = 1000;
    var m = s * 60;
    var h = m * 60;
    var d = h * 24;
    var y = d * 365.25;

    /**
     * Parse or format the given `val`.
     *
     * Options:
     *
     *  - `long` verbose formatting [false]
     *
     * @param {String|Number} val
     * @param {Object} [options]
     * @throws {Error} throw an error if val is not a non-empty string or a number
     * @return {String|Number}
     * @api public
     */

    var ms = function(val, options) {
      options = options || {};
      var type = typeof val;
      if (type === 'string' && val.length > 0) {
        return parse(val);
      } else if (type === 'number' && isNaN(val) === false) {
        return options.long ? fmtLong(val) : fmtShort(val);
      }
      throw new Error(
        'val is not a non-empty string or a valid number. val=' +
          JSON.stringify(val)
      );
    };

    /**
     * Parse the given `str` and return milliseconds.
     *
     * @param {String} str
     * @return {Number}
     * @api private
     */

    function parse(str) {
      str = String(str);
      if (str.length > 100) {
        return;
      }
      var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(
        str
      );
      if (!match) {
        return;
      }
      var n = parseFloat(match[1]);
      var type = (match[2] || 'ms').toLowerCase();
      switch (type) {
        case 'years':
        case 'year':
        case 'yrs':
        case 'yr':
        case 'y':
          return n * y;
        case 'days':
        case 'day':
        case 'd':
          return n * d;
        case 'hours':
        case 'hour':
        case 'hrs':
        case 'hr':
        case 'h':
          return n * h;
        case 'minutes':
        case 'minute':
        case 'mins':
        case 'min':
        case 'm':
          return n * m;
        case 'seconds':
        case 'second':
        case 'secs':
        case 'sec':
        case 's':
          return n * s;
        case 'milliseconds':
        case 'millisecond':
        case 'msecs':
        case 'msec':
        case 'ms':
          return n;
        default:
          return undefined;
      }
    }

    /**
     * Short format for `ms`.
     *
     * @param {Number} ms
     * @return {String}
     * @api private
     */

    function fmtShort(ms) {
      if (ms >= d) {
        return Math.round(ms / d) + 'd';
      }
      if (ms >= h) {
        return Math.round(ms / h) + 'h';
      }
      if (ms >= m) {
        return Math.round(ms / m) + 'm';
      }
      if (ms >= s) {
        return Math.round(ms / s) + 's';
      }
      return ms + 'ms';
    }

    /**
     * Long format for `ms`.
     *
     * @param {Number} ms
     * @return {String}
     * @api private
     */

    function fmtLong(ms) {
      return plural(ms, d, 'day') ||
        plural(ms, h, 'hour') ||
        plural(ms, m, 'minute') ||
        plural(ms, s, 'second') ||
        ms + ' ms';
    }

    /**
     * Pluralization helper.
     */

    function plural(ms, n, name) {
      if (ms < n) {
        return;
      }
      if (ms < n * 1.5) {
        return Math.floor(ms / n) + ' ' + name;
      }
      return Math.ceil(ms / n) + ' ' + name + 's';
    }

    var debug = createCommonjsModule(function (module, exports) {
    /**
     * This is the common logic for both the Node.js and web browser
     * implementations of `debug()`.
     *
     * Expose `debug()` as the module.
     */

    exports = module.exports = createDebug.debug = createDebug['default'] = createDebug;
    exports.coerce = coerce;
    exports.disable = disable;
    exports.enable = enable;
    exports.enabled = enabled;
    exports.humanize = ms;

    /**
     * The currently active debug mode names, and names to skip.
     */

    exports.names = [];
    exports.skips = [];

    /**
     * Map of special "%n" handling functions, for the debug "format" argument.
     *
     * Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
     */

    exports.formatters = {};

    /**
     * Previous log timestamp.
     */

    var prevTime;

    /**
     * Select a color.
     * @param {String} namespace
     * @return {Number}
     * @api private
     */

    function selectColor(namespace) {
      var hash = 0, i;

      for (i in namespace) {
        hash  = ((hash << 5) - hash) + namespace.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
      }

      return exports.colors[Math.abs(hash) % exports.colors.length];
    }

    /**
     * Create a debugger with the given `namespace`.
     *
     * @param {String} namespace
     * @return {Function}
     * @api public
     */

    function createDebug(namespace) {

      function debug() {
        // disabled?
        if (!debug.enabled) return;

        var self = debug;

        // set `diff` timestamp
        var curr = +new Date();
        var ms = curr - (prevTime || curr);
        self.diff = ms;
        self.prev = prevTime;
        self.curr = curr;
        prevTime = curr;

        // turn the `arguments` into a proper Array
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i];
        }

        args[0] = exports.coerce(args[0]);

        if ('string' !== typeof args[0]) {
          // anything else let's inspect with %O
          args.unshift('%O');
        }

        // apply any `formatters` transformations
        var index = 0;
        args[0] = args[0].replace(/%([a-zA-Z%])/g, function(match, format) {
          // if we encounter an escaped % then don't increase the array index
          if (match === '%%') return match;
          index++;
          var formatter = exports.formatters[format];
          if ('function' === typeof formatter) {
            var val = args[index];
            match = formatter.call(self, val);

            // now we need to remove `args[index]` since it's inlined in the `format`
            args.splice(index, 1);
            index--;
          }
          return match;
        });

        // apply env-specific formatting (colors, etc.)
        exports.formatArgs.call(self, args);

        var logFn = debug.log || exports.log || console.log.bind(console);
        logFn.apply(self, args);
      }

      debug.namespace = namespace;
      debug.enabled = exports.enabled(namespace);
      debug.useColors = exports.useColors();
      debug.color = selectColor(namespace);

      // env-specific initialization logic for debug instances
      if ('function' === typeof exports.init) {
        exports.init(debug);
      }

      return debug;
    }

    /**
     * Enables a debug mode by namespaces. This can include modes
     * separated by a colon and wildcards.
     *
     * @param {String} namespaces
     * @api public
     */

    function enable(namespaces) {
      exports.save(namespaces);

      exports.names = [];
      exports.skips = [];

      var split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
      var len = split.length;

      for (var i = 0; i < len; i++) {
        if (!split[i]) continue; // ignore empty strings
        namespaces = split[i].replace(/\*/g, '.*?');
        if (namespaces[0] === '-') {
          exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
        } else {
          exports.names.push(new RegExp('^' + namespaces + '$'));
        }
      }
    }

    /**
     * Disable debug output.
     *
     * @api public
     */

    function disable() {
      exports.enable('');
    }

    /**
     * Returns true if the given mode name is enabled, false otherwise.
     *
     * @param {String} name
     * @return {Boolean}
     * @api public
     */

    function enabled(name) {
      var i, len;
      for (i = 0, len = exports.skips.length; i < len; i++) {
        if (exports.skips[i].test(name)) {
          return false;
        }
      }
      for (i = 0, len = exports.names.length; i < len; i++) {
        if (exports.names[i].test(name)) {
          return true;
        }
      }
      return false;
    }

    /**
     * Coerce `val`.
     *
     * @param {Mixed} val
     * @return {Mixed}
     * @api private
     */

    function coerce(val) {
      if (val instanceof Error) return val.stack || val.message;
      return val;
    }
    });
    var debug_1 = debug.coerce;
    var debug_2 = debug.disable;
    var debug_3 = debug.enable;
    var debug_4 = debug.enabled;
    var debug_5 = debug.humanize;
    var debug_6 = debug.names;
    var debug_7 = debug.skips;
    var debug_8 = debug.formatters;

    var browser = createCommonjsModule(function (module, exports) {
    /**
     * This is the web browser implementation of `debug()`.
     *
     * Expose `debug()` as the module.
     */

    exports = module.exports = debug;
    exports.log = log;
    exports.formatArgs = formatArgs;
    exports.save = save;
    exports.load = load;
    exports.useColors = useColors;
    exports.storage = 'undefined' != typeof chrome
                   && 'undefined' != typeof chrome.storage
                      ? chrome.storage.local
                      : localstorage();

    /**
     * Colors.
     */

    exports.colors = [
      'lightseagreen',
      'forestgreen',
      'goldenrod',
      'dodgerblue',
      'darkorchid',
      'crimson'
    ];

    /**
     * Currently only WebKit-based Web Inspectors, Firefox >= v31,
     * and the Firebug extension (any Firefox version) are known
     * to support "%c" CSS customizations.
     *
     * TODO: add a `localStorage` variable to explicitly enable/disable colors
     */

    function useColors() {
      // NB: In an Electron preload script, document will be defined but not fully
      // initialized. Since we know we're in Chrome, we'll just detect this case
      // explicitly
      if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
        return true;
      }

      // is webkit? http://stackoverflow.com/a/16459606/376773
      // document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
      return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
        // is firebug? http://stackoverflow.com/a/398120/376773
        (typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
        // is firefox >= v31?
        // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
        (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) ||
        // double check webkit in userAgent just in case we are in a worker
        (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
    }

    /**
     * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
     */

    exports.formatters.j = function(v) {
      try {
        return JSON.stringify(v);
      } catch (err) {
        return '[UnexpectedJSONParseError]: ' + err.message;
      }
    };


    /**
     * Colorize log arguments if enabled.
     *
     * @api public
     */

    function formatArgs(args) {
      var useColors = this.useColors;

      args[0] = (useColors ? '%c' : '')
        + this.namespace
        + (useColors ? ' %c' : ' ')
        + args[0]
        + (useColors ? '%c ' : ' ')
        + '+' + exports.humanize(this.diff);

      if (!useColors) return;

      var c = 'color: ' + this.color;
      args.splice(1, 0, c, 'color: inherit');

      // the final "%c" is somewhat tricky, because there could be other
      // arguments passed either before or after the %c, so we need to
      // figure out the correct index to insert the CSS into
      var index = 0;
      var lastC = 0;
      args[0].replace(/%[a-zA-Z%]/g, function(match) {
        if ('%%' === match) return;
        index++;
        if ('%c' === match) {
          // we only are interested in the *last* %c
          // (the user may have provided their own)
          lastC = index;
        }
      });

      args.splice(lastC, 0, c);
    }

    /**
     * Invokes `console.log()` when available.
     * No-op when `console.log` is not a "function".
     *
     * @api public
     */

    function log() {
      // this hackery is required for IE8/9, where
      // the `console.log` function doesn't have 'apply'
      return 'object' === typeof console
        && console.log
        && Function.prototype.apply.call(console.log, console, arguments);
    }

    /**
     * Save `namespaces`.
     *
     * @param {String} namespaces
     * @api private
     */

    function save(namespaces) {
      try {
        if (null == namespaces) {
          exports.storage.removeItem('debug');
        } else {
          exports.storage.debug = namespaces;
        }
      } catch(e) {}
    }

    /**
     * Load `namespaces`.
     *
     * @return {String} returns the previously persisted debug modes
     * @api private
     */

    function load() {
      var r;
      try {
        r = exports.storage.debug;
      } catch(e) {}

      // If debug isn't set in LS, and we're in Electron, try to load $DEBUG
      if (!r && typeof process !== 'undefined' && 'env' in process) {
        r = process.env.DEBUG;
      }

      return r;
    }

    /**
     * Enable namespaces listed in `localStorage.debug` initially.
     */

    exports.enable(load());

    /**
     * Localstorage attempts to return the localstorage.
     *
     * This is necessary because safari throws
     * when a user disables cookies/localstorage
     * and you attempt to access it.
     *
     * @return {LocalStorage}
     * @api private
     */

    function localstorage() {
      try {
        return window.localStorage;
      } catch (e) {}
    }
    });
    var browser_1 = browser.log;
    var browser_2 = browser.formatArgs;
    var browser_3 = browser.save;
    var browser_4 = browser.load;
    var browser_5 = browser.useColors;
    var browser_6 = browser.storage;
    var browser_7 = browser.colors;

    var debug$1 = browser('algoliasearch:src/hostIndexState.js');
    var localStorageNamespace = 'algoliasearch-client-js';

    var store;
    var moduleStore = {
      state: {},
      set: function(key, data) {
        this.state[key] = data;
        return this.state[key];
      },
      get: function(key) {
        return this.state[key] || null;
      }
    };

    var localStorageStore = {
      set: function(key, data) {
        moduleStore.set(key, data); // always replicate localStorageStore to moduleStore in case of failure

        try {
          var namespace = JSON.parse(commonjsGlobal.localStorage[localStorageNamespace]);
          namespace[key] = data;
          commonjsGlobal.localStorage[localStorageNamespace] = JSON.stringify(namespace);
          return namespace[key];
        } catch (e) {
          return localStorageFailure(key, e);
        }
      },
      get: function(key) {
        try {
          return JSON.parse(commonjsGlobal.localStorage[localStorageNamespace])[key] || null;
        } catch (e) {
          return localStorageFailure(key, e);
        }
      }
    };

    function localStorageFailure(key, e) {
      debug$1('localStorage failed with', e);
      cleanup();
      store = moduleStore;
      return store.get(key);
    }

    store = supportsLocalStorage() ? localStorageStore : moduleStore;

    var store_1 = {
      get: getOrSet,
      set: getOrSet,
      supportsLocalStorage: supportsLocalStorage
    };

    function getOrSet(key, data) {
      if (arguments.length === 1) {
        return store.get(key);
      }

      return store.set(key, data);
    }

    function supportsLocalStorage() {
      try {
        if ('localStorage' in commonjsGlobal &&
          commonjsGlobal.localStorage !== null) {
          if (!commonjsGlobal.localStorage[localStorageNamespace]) {
            // actual creation of the namespace
            commonjsGlobal.localStorage.setItem(localStorageNamespace, JSON.stringify({}));
          }
          return true;
        }

        return false;
      } catch (_) {
        return false;
      }
    }

    // In case of any error on localStorage, we clean our own namespace, this should handle
    // quota errors when a lot of keys + data are used
    function cleanup() {
      try {
        commonjsGlobal.localStorage.removeItem(localStorageNamespace);
      } catch (_) {
        // nothing to do
      }
    }

    var AlgoliaSearchCore_1 = AlgoliaSearchCore;






    // We will always put the API KEY in the JSON body in case of too long API KEY,
    // to avoid query string being too long and failing in various conditions (our server limit, browser limit,
    // proxies limit)
    var MAX_API_KEY_LENGTH = 500;
    var RESET_APP_DATA_TIMER =
      process.env.RESET_APP_DATA_TIMER && parseInt(process.env.RESET_APP_DATA_TIMER, 10) ||
      60 * 2 * 1000; // after 2 minutes reset to first host

    /*
     * Algolia Search library initialization
     * https://www.algolia.com/
     *
     * @param {string} applicationID - Your applicationID, found in your dashboard
     * @param {string} apiKey - Your API key, found in your dashboard
     * @param {Object} [opts]
     * @param {number} [opts.timeout=2000] - The request timeout set in milliseconds,
     * another request will be issued after this timeout
     * @param {string} [opts.protocol='https:'] - The protocol used to query Algolia Search API.
     *                                        Set to 'http:' to force using http.
     * @param {Object|Array} [opts.hosts={
     *           read: [this.applicationID + '-dsn.algolia.net'].concat([
     *             this.applicationID + '-1.algolianet.com',
     *             this.applicationID + '-2.algolianet.com',
     *             this.applicationID + '-3.algolianet.com']
     *           ]),
     *           write: [this.applicationID + '.algolia.net'].concat([
     *             this.applicationID + '-1.algolianet.com',
     *             this.applicationID + '-2.algolianet.com',
     *             this.applicationID + '-3.algolianet.com']
     *           ]) - The hosts to use for Algolia Search API.
     *           If you provide them, you will less benefit from our HA implementation
     */
    function AlgoliaSearchCore(applicationID, apiKey, opts) {
      var debug = browser('algoliasearch');

      var clone$1 = clone;
      var isArray = isarray;
      var map$1 = map;

      var usage = 'Usage: algoliasearch(applicationID, apiKey, opts)';

      if (opts._allowEmptyCredentials !== true && !applicationID) {
        throw new errors.AlgoliaSearchError('Please provide an application ID. ' + usage);
      }

      if (opts._allowEmptyCredentials !== true && !apiKey) {
        throw new errors.AlgoliaSearchError('Please provide an API key. ' + usage);
      }

      this.applicationID = applicationID;
      this.apiKey = apiKey;

      this.hosts = {
        read: [],
        write: []
      };

      opts = opts || {};

      this._timeouts = opts.timeouts || {
        connect: 1 * 1000, // 500ms connect is GPRS latency
        read: 2 * 1000,
        write: 30 * 1000
      };

      // backward compat, if opts.timeout is passed, we use it to configure all timeouts like before
      if (opts.timeout) {
        this._timeouts.connect = this._timeouts.read = this._timeouts.write = opts.timeout;
      }

      var protocol = opts.protocol || 'https:';
      // while we advocate for colon-at-the-end values: 'http:' for `opts.protocol`
      // we also accept `http` and `https`. It's a common error.
      if (!/:$/.test(protocol)) {
        protocol = protocol + ':';
      }

      if (protocol !== 'http:' && protocol !== 'https:') {
        throw new errors.AlgoliaSearchError('protocol must be `http:` or `https:` (was `' + opts.protocol + '`)');
      }

      this._checkAppIdData();

      if (!opts.hosts) {
        var defaultHosts = map$1(this._shuffleResult, function(hostNumber) {
          return applicationID + '-' + hostNumber + '.algolianet.com';
        });

        // no hosts given, compute defaults
        var mainSuffix = (opts.dsn === false ? '' : '-dsn') + '.algolia.net';
        this.hosts.read = [this.applicationID + mainSuffix].concat(defaultHosts);
        this.hosts.write = [this.applicationID + '.algolia.net'].concat(defaultHosts);
      } else if (isArray(opts.hosts)) {
        // when passing custom hosts, we need to have a different host index if the number
        // of write/read hosts are different.
        this.hosts.read = clone$1(opts.hosts);
        this.hosts.write = clone$1(opts.hosts);
      } else {
        this.hosts.read = clone$1(opts.hosts.read);
        this.hosts.write = clone$1(opts.hosts.write);
      }

      // add protocol and lowercase hosts
      this.hosts.read = map$1(this.hosts.read, prepareHost(protocol));
      this.hosts.write = map$1(this.hosts.write, prepareHost(protocol));

      this.extraHeaders = {};

      // In some situations you might want to warm the cache
      this.cache = opts._cache || {};

      this._ua = opts._ua;
      this._useCache = opts._useCache === undefined || opts._cache ? true : opts._useCache;
      this._useRequestCache = this._useCache && opts._useRequestCache;
      this._useFallback = opts.useFallback === undefined ? true : opts.useFallback;

      this._setTimeout = opts._setTimeout;

      debug('init done, %j', this);
    }

    /*
     * Get the index object initialized
     *
     * @param indexName the name of index
     * @param callback the result callback with one argument (the Index instance)
     */
    AlgoliaSearchCore.prototype.initIndex = function(indexName) {
      return new IndexCore_1(this, indexName);
    };

    /**
    * Add an extra field to the HTTP request
    *
    * @param name the header field name
    * @param value the header field value
    */
    AlgoliaSearchCore.prototype.setExtraHeader = function(name, value) {
      this.extraHeaders[name.toLowerCase()] = value;
    };

    /**
    * Get the value of an extra HTTP header
    *
    * @param name the header field name
    */
    AlgoliaSearchCore.prototype.getExtraHeader = function(name) {
      return this.extraHeaders[name.toLowerCase()];
    };

    /**
    * Remove an extra field from the HTTP request
    *
    * @param name the header field name
    */
    AlgoliaSearchCore.prototype.unsetExtraHeader = function(name) {
      delete this.extraHeaders[name.toLowerCase()];
    };

    /**
    * Augment sent x-algolia-agent with more data, each agent part
    * is automatically separated from the others by a semicolon;
    *
    * @param algoliaAgent the agent to add
    */
    AlgoliaSearchCore.prototype.addAlgoliaAgent = function(algoliaAgent) {
      var algoliaAgentWithDelimiter = '; ' + algoliaAgent;

      if (this._ua.indexOf(algoliaAgentWithDelimiter) === -1) {
        this._ua += algoliaAgentWithDelimiter;
      }
    };

    /*
     * Wrapper that try all hosts to maximize the quality of service
     */
    AlgoliaSearchCore.prototype._jsonRequest = function(initialOpts) {
      this._checkAppIdData();

      var requestDebug = browser('algoliasearch:' + initialOpts.url);


      var body;
      var cacheID;
      var additionalUA = initialOpts.additionalUA || '';
      var cache = initialOpts.cache;
      var client = this;
      var tries = 0;
      var usingFallback = false;
      var hasFallback = client._useFallback && client._request.fallback && initialOpts.fallback;
      var headers;

      if (
        this.apiKey.length > MAX_API_KEY_LENGTH &&
        initialOpts.body !== undefined &&
        (initialOpts.body.params !== undefined || // index.search()
        initialOpts.body.requests !== undefined) // client.search()
      ) {
        initialOpts.body.apiKey = this.apiKey;
        headers = this._computeRequestHeaders({
          additionalUA: additionalUA,
          withApiKey: false,
          headers: initialOpts.headers
        });
      } else {
        headers = this._computeRequestHeaders({
          additionalUA: additionalUA,
          headers: initialOpts.headers
        });
      }

      if (initialOpts.body !== undefined) {
        body = safeJSONStringify(initialOpts.body);
      }

      requestDebug('request start');
      var debugData = [];


      function doRequest(requester, reqOpts) {
        client._checkAppIdData();

        var startTime = new Date();

        if (client._useCache && !client._useRequestCache) {
          cacheID = initialOpts.url;
        }

        // as we sometime use POST requests to pass parameters (like query='aa'),
        // the cacheID must also include the body to be different between calls
        if (client._useCache && !client._useRequestCache && body) {
          cacheID += '_body_' + reqOpts.body;
        }

        // handle cache existence
        if (isCacheValidWithCurrentID(!client._useRequestCache, cache, cacheID)) {
          requestDebug('serving response from cache');

          var responseText = cache[cacheID];

          // Cache response must match the type of the original one
          return client._promise.resolve({
            body: JSON.parse(responseText),
            responseText: responseText
          });
        }

        // if we reached max tries
        if (tries >= client.hosts[initialOpts.hostType].length) {
          if (!hasFallback || usingFallback) {
            requestDebug('could not get any response');
            // then stop
            return client._promise.reject(new errors.AlgoliaSearchError(
              'Cannot connect to the AlgoliaSearch API.' +
              ' Send an email to support@algolia.com to report and resolve the issue.' +
              ' Application id was: ' + client.applicationID, {debugData: debugData}
            ));
          }

          requestDebug('switching to fallback');

          // let's try the fallback starting from here
          tries = 0;

          // method, url and body are fallback dependent
          reqOpts.method = initialOpts.fallback.method;
          reqOpts.url = initialOpts.fallback.url;
          reqOpts.jsonBody = initialOpts.fallback.body;
          if (reqOpts.jsonBody) {
            reqOpts.body = safeJSONStringify(reqOpts.jsonBody);
          }
          // re-compute headers, they could be omitting the API KEY
          headers = client._computeRequestHeaders({
            additionalUA: additionalUA,
            headers: initialOpts.headers
          });

          reqOpts.timeouts = client._getTimeoutsForRequest(initialOpts.hostType);
          client._setHostIndexByType(0, initialOpts.hostType);
          usingFallback = true; // the current request is now using fallback
          return doRequest(client._request.fallback, reqOpts);
        }

        var currentHost = client._getHostByType(initialOpts.hostType);

        var url = currentHost + reqOpts.url;
        var options = {
          body: reqOpts.body,
          jsonBody: reqOpts.jsonBody,
          method: reqOpts.method,
          headers: headers,
          timeouts: reqOpts.timeouts,
          debug: requestDebug,
          forceAuthHeaders: reqOpts.forceAuthHeaders
        };

        requestDebug('method: %s, url: %s, headers: %j, timeouts: %d',
          options.method, url, options.headers, options.timeouts);

        if (requester === client._request.fallback) {
          requestDebug('using fallback');
        }

        // `requester` is any of this._request or this._request.fallback
        // thus it needs to be called using the client as context
        return requester.call(client, url, options).then(success, tryFallback);

        function success(httpResponse) {
          // compute the status of the response,
          //
          // When in browser mode, using XDR or JSONP, we have no statusCode available
          // So we rely on our API response `status` property.
          // But `waitTask` can set a `status` property which is not the statusCode (it's the task status)
          // So we check if there's a `message` along `status` and it means it's an error
          //
          // That's the only case where we have a response.status that's not the http statusCode
          var status = httpResponse && httpResponse.body && httpResponse.body.message && httpResponse.body.status ||

            // this is important to check the request statusCode AFTER the body eventual
            // statusCode because some implementations (jQuery XDomainRequest transport) may
            // send statusCode 200 while we had an error
            httpResponse.statusCode ||

            // When in browser mode, using XDR or JSONP
            // we default to success when no error (no response.status && response.message)
            // If there was a JSON.parse() error then body is null and it fails
            httpResponse && httpResponse.body && 200;

          requestDebug('received response: statusCode: %s, computed statusCode: %d, headers: %j',
            httpResponse.statusCode, status, httpResponse.headers);

          var httpResponseOk = Math.floor(status / 100) === 2;

          var endTime = new Date();
          debugData.push({
            currentHost: currentHost,
            headers: removeCredentials(headers),
            content: body || null,
            contentLength: body !== undefined ? body.length : null,
            method: reqOpts.method,
            timeouts: reqOpts.timeouts,
            url: reqOpts.url,
            startTime: startTime,
            endTime: endTime,
            duration: endTime - startTime,
            statusCode: status
          });

          if (httpResponseOk) {
            if (client._useCache && !client._useRequestCache && cache) {
              cache[cacheID] = httpResponse.responseText;
            }

            return {
              responseText: httpResponse.responseText,
              body: httpResponse.body
            };
          }

          var shouldRetry = Math.floor(status / 100) !== 4;

          if (shouldRetry) {
            tries += 1;
            return retryRequest();
          }

          requestDebug('unrecoverable error');

          // no success and no retry => fail
          var unrecoverableError = new errors.AlgoliaSearchError(
            httpResponse.body && httpResponse.body.message, {debugData: debugData, statusCode: status}
          );

          return client._promise.reject(unrecoverableError);
        }

        function tryFallback(err) {
          // error cases:
          //  While not in fallback mode:
          //    - CORS not supported
          //    - network error
          //  While in fallback mode:
          //    - timeout
          //    - network error
          //    - badly formatted JSONP (script loaded, did not call our callback)
          //  In both cases:
          //    - uncaught exception occurs (TypeError)
          requestDebug('error: %s, stack: %s', err.message, err.stack);

          var endTime = new Date();
          debugData.push({
            currentHost: currentHost,
            headers: removeCredentials(headers),
            content: body || null,
            contentLength: body !== undefined ? body.length : null,
            method: reqOpts.method,
            timeouts: reqOpts.timeouts,
            url: reqOpts.url,
            startTime: startTime,
            endTime: endTime,
            duration: endTime - startTime
          });

          if (!(err instanceof errors.AlgoliaSearchError)) {
            err = new errors.Unknown(err && err.message, err);
          }

          tries += 1;

          // stop the request implementation when:
          if (
            // we did not generate this error,
            // it comes from a throw in some other piece of code
            err instanceof errors.Unknown ||

            // server sent unparsable JSON
            err instanceof errors.UnparsableJSON ||

            // max tries and already using fallback or no fallback
            tries >= client.hosts[initialOpts.hostType].length &&
            (usingFallback || !hasFallback)) {
            // stop request implementation for this command
            err.debugData = debugData;
            return client._promise.reject(err);
          }

          // When a timeout occurred, retry by raising timeout
          if (err instanceof errors.RequestTimeout) {
            return retryRequestWithHigherTimeout();
          }

          return retryRequest();
        }

        function retryRequest() {
          requestDebug('retrying request');
          client._incrementHostIndex(initialOpts.hostType);
          return doRequest(requester, reqOpts);
        }

        function retryRequestWithHigherTimeout() {
          requestDebug('retrying request with higher timeout');
          client._incrementHostIndex(initialOpts.hostType);
          client._incrementTimeoutMultipler();
          reqOpts.timeouts = client._getTimeoutsForRequest(initialOpts.hostType);
          return doRequest(requester, reqOpts);
        }
      }

      function isCacheValidWithCurrentID(
        useRequestCache,
        currentCache,
        currentCacheID
      ) {
        return (
          client._useCache &&
          useRequestCache &&
          currentCache &&
          currentCache[currentCacheID] !== undefined
        );
      }


      function interopCallbackReturn(request, callback) {
        if (isCacheValidWithCurrentID(client._useRequestCache, cache, cacheID)) {
          request.catch(function() {
            // Release the cache on error
            delete cache[cacheID];
          });
        }

        if (typeof initialOpts.callback === 'function') {
          // either we have a callback
          request.then(function okCb(content) {
            exitPromise(function() {
              initialOpts.callback(null, callback(content));
            }, client._setTimeout || setTimeout);
          }, function nookCb(err) {
            exitPromise(function() {
              initialOpts.callback(err);
            }, client._setTimeout || setTimeout);
          });
        } else {
          // either we are using promises
          return request.then(callback);
        }
      }

      if (client._useCache && client._useRequestCache) {
        cacheID = initialOpts.url;
      }

      // as we sometime use POST requests to pass parameters (like query='aa'),
      // the cacheID must also include the body to be different between calls
      if (client._useCache && client._useRequestCache && body) {
        cacheID += '_body_' + body;
      }

      if (isCacheValidWithCurrentID(client._useRequestCache, cache, cacheID)) {
        requestDebug('serving request from cache');

        var maybePromiseForCache = cache[cacheID];

        // In case the cache is warmup with value that is not a promise
        var promiseForCache = typeof maybePromiseForCache.then !== 'function'
          ? client._promise.resolve({responseText: maybePromiseForCache})
          : maybePromiseForCache;

        return interopCallbackReturn(promiseForCache, function(content) {
          // In case of the cache request, return the original value
          return JSON.parse(content.responseText);
        });
      }

      var request = doRequest(
        client._request, {
          url: initialOpts.url,
          method: initialOpts.method,
          body: body,
          jsonBody: initialOpts.body,
          timeouts: client._getTimeoutsForRequest(initialOpts.hostType),
          forceAuthHeaders: initialOpts.forceAuthHeaders
        }
      );

      if (client._useCache && client._useRequestCache && cache) {
        cache[cacheID] = request;
      }

      return interopCallbackReturn(request, function(content) {
        // In case of the first request, return the JSON value
        return content.body;
      });
    };

    /*
    * Transform search param object in query string
    * @param {object} args arguments to add to the current query string
    * @param {string} params current query string
    * @return {string} the final query string
    */
    AlgoliaSearchCore.prototype._getSearchParams = function(args, params) {
      if (args === undefined || args === null) {
        return params;
      }
      for (var key in args) {
        if (key !== null && args[key] !== undefined && args.hasOwnProperty(key)) {
          params += params === '' ? '' : '&';
          params += key + '=' + encodeURIComponent(Object.prototype.toString.call(args[key]) === '[object Array]' ? safeJSONStringify(args[key]) : args[key]);
        }
      }
      return params;
    };

    /**
     * Compute the headers for a request
     *
     * @param [string] options.additionalUA semi-colon separated string with other user agents to add
     * @param [boolean=true] options.withApiKey Send the api key as a header
     * @param [Object] options.headers Extra headers to send
     */
    AlgoliaSearchCore.prototype._computeRequestHeaders = function(options) {
      var forEach = foreach;

      var ua = options.additionalUA ?
        this._ua + '; ' + options.additionalUA :
        this._ua;

      var requestHeaders = {
        'x-algolia-agent': ua,
        'x-algolia-application-id': this.applicationID
      };

      // browser will inline headers in the url, node.js will use http headers
      // but in some situations, the API KEY will be too long (big secured API keys)
      // so if the request is a POST and the KEY is very long, we will be asked to not put
      // it into headers but in the JSON body
      if (options.withApiKey !== false) {
        requestHeaders['x-algolia-api-key'] = this.apiKey;
      }

      if (this.userToken) {
        requestHeaders['x-algolia-usertoken'] = this.userToken;
      }

      if (this.securityTags) {
        requestHeaders['x-algolia-tagfilters'] = this.securityTags;
      }

      forEach(this.extraHeaders, function addToRequestHeaders(value, key) {
        requestHeaders[key] = value;
      });

      if (options.headers) {
        forEach(options.headers, function addToRequestHeaders(value, key) {
          requestHeaders[key] = value;
        });
      }

      return requestHeaders;
    };

    /**
     * Search through multiple indices at the same time
     * @param  {Object[]}   queries  An array of queries you want to run.
     * @param {string} queries[].indexName The index name you want to target
     * @param {string} [queries[].query] The query to issue on this index. Can also be passed into `params`
     * @param {Object} queries[].params Any search param like hitsPerPage, ..
     * @param  {Function} callback Callback to be called
     * @return {Promise|undefined} Returns a promise if no callback given
     */
    AlgoliaSearchCore.prototype.search = function(queries, opts, callback) {
      var isArray = isarray;
      var map$1 = map;

      var usage = 'Usage: client.search(arrayOfQueries[, callback])';

      if (!isArray(queries)) {
        throw new Error(usage);
      }

      if (typeof opts === 'function') {
        callback = opts;
        opts = {};
      } else if (opts === undefined) {
        opts = {};
      }

      var client = this;

      var postObj = {
        requests: map$1(queries, function prepareRequest(query) {
          var params = '';

          // allow query.query
          // so we are mimicing the index.search(query, params) method
          // {indexName:, query:, params:}
          if (query.query !== undefined) {
            params += 'query=' + encodeURIComponent(query.query);
          }

          return {
            indexName: query.indexName,
            params: client._getSearchParams(query.params, params)
          };
        })
      };

      var JSONPParams = map$1(postObj.requests, function prepareJSONPParams(request, requestId) {
        return requestId + '=' +
          encodeURIComponent(
            '/1/indexes/' + encodeURIComponent(request.indexName) + '?' +
            request.params
          );
      }).join('&');

      var url = '/1/indexes/*/queries';

      if (opts.strategy !== undefined) {
        postObj.strategy = opts.strategy;
      }

      return this._jsonRequest({
        cache: this.cache,
        method: 'POST',
        url: url,
        body: postObj,
        hostType: 'read',
        fallback: {
          method: 'GET',
          url: '/1/indexes/*',
          body: {
            params: JSONPParams
          }
        },
        callback: callback
      });
    };

    /**
    * Search for facet values
    * https://www.algolia.com/doc/rest-api/search#search-for-facet-values
    * This is the top-level API for SFFV.
    *
    * @param {object[]} queries An array of queries to run.
    * @param {string} queries[].indexName Index name, name of the index to search.
    * @param {object} queries[].params Query parameters.
    * @param {string} queries[].params.facetName Facet name, name of the attribute to search for values in.
    * Must be declared as a facet
    * @param {string} queries[].params.facetQuery Query for the facet search
    * @param {string} [queries[].params.*] Any search parameter of Algolia,
    * see https://www.algolia.com/doc/api-client/javascript/search#search-parameters
    * Pagination is not supported. The page and hitsPerPage parameters will be ignored.
    */
    AlgoliaSearchCore.prototype.searchForFacetValues = function(queries) {
      var isArray = isarray;
      var map$1 = map;

      var usage = 'Usage: client.searchForFacetValues([{indexName, params: {facetName, facetQuery, ...params}}, ...queries])'; // eslint-disable-line max-len

      if (!isArray(queries)) {
        throw new Error(usage);
      }

      var client = this;

      return client._promise.all(map$1(queries, function performQuery(query) {
        if (
          !query ||
          query.indexName === undefined ||
          query.params.facetName === undefined ||
          query.params.facetQuery === undefined
        ) {
          throw new Error(usage);
        }

        var clone$1 = clone;
        var omit$1 = omit;

        var indexName = query.indexName;
        var params = query.params;

        var facetName = params.facetName;
        var filteredParams = omit$1(clone$1(params), function(keyName) {
          return keyName === 'facetName';
        });
        var searchParameters = client._getSearchParams(filteredParams, '');

        return client._jsonRequest({
          cache: client.cache,
          method: 'POST',
          url:
            '/1/indexes/' +
            encodeURIComponent(indexName) +
            '/facets/' +
            encodeURIComponent(facetName) +
            '/query',
          hostType: 'read',
          body: {params: searchParameters}
        });
      }));
    };

    /**
     * Set the extra security tagFilters header
     * @param {string|array} tags The list of tags defining the current security filters
     */
    AlgoliaSearchCore.prototype.setSecurityTags = function(tags) {
      if (Object.prototype.toString.call(tags) === '[object Array]') {
        var strTags = [];
        for (var i = 0; i < tags.length; ++i) {
          if (Object.prototype.toString.call(tags[i]) === '[object Array]') {
            var oredTags = [];
            for (var j = 0; j < tags[i].length; ++j) {
              oredTags.push(tags[i][j]);
            }
            strTags.push('(' + oredTags.join(',') + ')');
          } else {
            strTags.push(tags[i]);
          }
        }
        tags = strTags.join(',');
      }

      this.securityTags = tags;
    };

    /**
     * Set the extra user token header
     * @param {string} userToken The token identifying a uniq user (used to apply rate limits)
     */
    AlgoliaSearchCore.prototype.setUserToken = function(userToken) {
      this.userToken = userToken;
    };

    /**
     * Clear all queries in client's cache
     * @return undefined
     */
    AlgoliaSearchCore.prototype.clearCache = function() {
      this.cache = {};
    };

    /**
    * Set the number of milliseconds a request can take before automatically being terminated.
    * @deprecated
    * @param {Number} milliseconds
    */
    AlgoliaSearchCore.prototype.setRequestTimeout = function(milliseconds) {
      if (milliseconds) {
        this._timeouts.connect = this._timeouts.read = this._timeouts.write = milliseconds;
      }
    };

    /**
    * Set the three different (connect, read, write) timeouts to be used when requesting
    * @param {Object} timeouts
    */
    AlgoliaSearchCore.prototype.setTimeouts = function(timeouts) {
      this._timeouts = timeouts;
    };

    /**
    * Get the three different (connect, read, write) timeouts to be used when requesting
    * @param {Object} timeouts
    */
    AlgoliaSearchCore.prototype.getTimeouts = function() {
      return this._timeouts;
    };

    AlgoliaSearchCore.prototype._getAppIdData = function() {
      var data = store_1.get(this.applicationID);
      if (data !== null) this._cacheAppIdData(data);
      return data;
    };

    AlgoliaSearchCore.prototype._setAppIdData = function(data) {
      data.lastChange = (new Date()).getTime();
      this._cacheAppIdData(data);
      return store_1.set(this.applicationID, data);
    };

    AlgoliaSearchCore.prototype._checkAppIdData = function() {
      var data = this._getAppIdData();
      var now = (new Date()).getTime();
      if (data === null || now - data.lastChange > RESET_APP_DATA_TIMER) {
        return this._resetInitialAppIdData(data);
      }

      return data;
    };

    AlgoliaSearchCore.prototype._resetInitialAppIdData = function(data) {
      var newData = data || {};
      newData.hostIndexes = {read: 0, write: 0};
      newData.timeoutMultiplier = 1;
      newData.shuffleResult = newData.shuffleResult || shuffle([1, 2, 3]);
      return this._setAppIdData(newData);
    };

    AlgoliaSearchCore.prototype._cacheAppIdData = function(data) {
      this._hostIndexes = data.hostIndexes;
      this._timeoutMultiplier = data.timeoutMultiplier;
      this._shuffleResult = data.shuffleResult;
    };

    AlgoliaSearchCore.prototype._partialAppIdDataUpdate = function(newData) {
      var foreach$1 = foreach;
      var currentData = this._getAppIdData();
      foreach$1(newData, function(value, key) {
        currentData[key] = value;
      });

      return this._setAppIdData(currentData);
    };

    AlgoliaSearchCore.prototype._getHostByType = function(hostType) {
      return this.hosts[hostType][this._getHostIndexByType(hostType)];
    };

    AlgoliaSearchCore.prototype._getTimeoutMultiplier = function() {
      return this._timeoutMultiplier;
    };

    AlgoliaSearchCore.prototype._getHostIndexByType = function(hostType) {
      return this._hostIndexes[hostType];
    };

    AlgoliaSearchCore.prototype._setHostIndexByType = function(hostIndex, hostType) {
      var clone$1 = clone;
      var newHostIndexes = clone$1(this._hostIndexes);
      newHostIndexes[hostType] = hostIndex;
      this._partialAppIdDataUpdate({hostIndexes: newHostIndexes});
      return hostIndex;
    };

    AlgoliaSearchCore.prototype._incrementHostIndex = function(hostType) {
      return this._setHostIndexByType(
        (this._getHostIndexByType(hostType) + 1) % this.hosts[hostType].length, hostType
      );
    };

    AlgoliaSearchCore.prototype._incrementTimeoutMultipler = function() {
      var timeoutMultiplier = Math.max(this._timeoutMultiplier + 1, 4);
      return this._partialAppIdDataUpdate({timeoutMultiplier: timeoutMultiplier});
    };

    AlgoliaSearchCore.prototype._getTimeoutsForRequest = function(hostType) {
      return {
        connect: this._timeouts.connect * this._timeoutMultiplier,
        complete: this._timeouts[hostType] * this._timeoutMultiplier
      };
    };

    function prepareHost(protocol) {
      return function prepare(host) {
        return protocol + '//' + host.toLowerCase();
      };
    }

    // Prototype.js < 1.7, a widely used library, defines a weird
    // Array.prototype.toJSON function that will fail to stringify our content
    // appropriately
    // refs:
    //   - https://groups.google.com/forum/#!topic/prototype-core/E-SAVvV_V9Q
    //   - https://github.com/sstephenson/prototype/commit/038a2985a70593c1a86c230fadbdfe2e4898a48c
    //   - http://stackoverflow.com/a/3148441/147079
    function safeJSONStringify(obj) {
      /* eslint no-extend-native:0 */

      if (Array.prototype.toJSON === undefined) {
        return JSON.stringify(obj);
      }

      var toJSON = Array.prototype.toJSON;
      delete Array.prototype.toJSON;
      var out = JSON.stringify(obj);
      Array.prototype.toJSON = toJSON;

      return out;
    }

    function shuffle(array) {
      var currentIndex = array.length;
      var temporaryValue;
      var randomIndex;

      // While there remain elements to shuffle...
      while (currentIndex !== 0) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
      }

      return array;
    }

    function removeCredentials(headers) {
      var newHeaders = {};

      for (var headerName in headers) {
        if (Object.prototype.hasOwnProperty.call(headers, headerName)) {
          var value;

          if (headerName === 'x-algolia-api-key' || headerName === 'x-algolia-application-id') {
            value = '**hidden for security purposes**';
          } else {
            value = headers[headerName];
          }

          newHeaders[headerName] = value;
        }
      }

      return newHeaders;
    }

    var win;

    if (typeof window !== "undefined") {
        win = window;
    } else if (typeof commonjsGlobal !== "undefined") {
        win = commonjsGlobal;
    } else if (typeof self !== "undefined"){
        win = self;
    } else {
        win = {};
    }

    var window_1 = win;

    var es6Promise = createCommonjsModule(function (module, exports) {
    /*!
     * @overview es6-promise - a tiny implementation of Promises/A+.
     * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
     * @license   Licensed under MIT license
     *            See https://raw.githubusercontent.com/stefanpenner/es6-promise/master/LICENSE
     * @version   v4.2.8+1e68dce6
     */

    (function (global, factory) {
    	 module.exports = factory() ;
    }(commonjsGlobal, (function () {
    function objectOrFunction(x) {
      var type = typeof x;
      return x !== null && (type === 'object' || type === 'function');
    }

    function isFunction(x) {
      return typeof x === 'function';
    }



    var _isArray = void 0;
    if (Array.isArray) {
      _isArray = Array.isArray;
    } else {
      _isArray = function (x) {
        return Object.prototype.toString.call(x) === '[object Array]';
      };
    }

    var isArray = _isArray;

    var len = 0;
    var vertxNext = void 0;
    var customSchedulerFn = void 0;

    var asap = function asap(callback, arg) {
      queue[len] = callback;
      queue[len + 1] = arg;
      len += 2;
      if (len === 2) {
        // If len is 2, that means that we need to schedule an async flush.
        // If additional callbacks are queued before the queue is flushed, they
        // will be processed by this flush that we are scheduling.
        if (customSchedulerFn) {
          customSchedulerFn(flush);
        } else {
          scheduleFlush();
        }
      }
    };

    function setScheduler(scheduleFn) {
      customSchedulerFn = scheduleFn;
    }

    function setAsap(asapFn) {
      asap = asapFn;
    }

    var browserWindow = typeof window !== 'undefined' ? window : undefined;
    var browserGlobal = browserWindow || {};
    var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
    var isNode = typeof self === 'undefined' && typeof process !== 'undefined' && {}.toString.call(process) === '[object process]';

    // test for web worker but not in IE10
    var isWorker = typeof Uint8ClampedArray !== 'undefined' && typeof importScripts !== 'undefined' && typeof MessageChannel !== 'undefined';

    // node
    function useNextTick() {
      // node version 0.10.x displays a deprecation warning when nextTick is used recursively
      // see https://github.com/cujojs/when/issues/410 for details
      return function () {
        return process.nextTick(flush);
      };
    }

    // vertx
    function useVertxTimer() {
      if (typeof vertxNext !== 'undefined') {
        return function () {
          vertxNext(flush);
        };
      }

      return useSetTimeout();
    }

    function useMutationObserver() {
      var iterations = 0;
      var observer = new BrowserMutationObserver(flush);
      var node = document.createTextNode('');
      observer.observe(node, { characterData: true });

      return function () {
        node.data = iterations = ++iterations % 2;
      };
    }

    // web worker
    function useMessageChannel() {
      var channel = new MessageChannel();
      channel.port1.onmessage = flush;
      return function () {
        return channel.port2.postMessage(0);
      };
    }

    function useSetTimeout() {
      // Store setTimeout reference so es6-promise will be unaffected by
      // other code modifying setTimeout (like sinon.useFakeTimers())
      var globalSetTimeout = setTimeout;
      return function () {
        return globalSetTimeout(flush, 1);
      };
    }

    var queue = new Array(1000);
    function flush() {
      for (var i = 0; i < len; i += 2) {
        var callback = queue[i];
        var arg = queue[i + 1];

        callback(arg);

        queue[i] = undefined;
        queue[i + 1] = undefined;
      }

      len = 0;
    }

    function attemptVertx() {
      try {
        var vertx = Function('return this')().require('vertx');
        vertxNext = vertx.runOnLoop || vertx.runOnContext;
        return useVertxTimer();
      } catch (e) {
        return useSetTimeout();
      }
    }

    var scheduleFlush = void 0;
    // Decide what async method to use to triggering processing of queued callbacks:
    if (isNode) {
      scheduleFlush = useNextTick();
    } else if (BrowserMutationObserver) {
      scheduleFlush = useMutationObserver();
    } else if (isWorker) {
      scheduleFlush = useMessageChannel();
    } else if (browserWindow === undefined && typeof commonjsRequire === 'function') {
      scheduleFlush = attemptVertx();
    } else {
      scheduleFlush = useSetTimeout();
    }

    function then(onFulfillment, onRejection) {
      var parent = this;

      var child = new this.constructor(noop);

      if (child[PROMISE_ID] === undefined) {
        makePromise(child);
      }

      var _state = parent._state;


      if (_state) {
        var callback = arguments[_state - 1];
        asap(function () {
          return invokeCallback(_state, child, callback, parent._result);
        });
      } else {
        subscribe(parent, child, onFulfillment, onRejection);
      }

      return child;
    }

    /**
      `Promise.resolve` returns a promise that will become resolved with the
      passed `value`. It is shorthand for the following:

      ```javascript
      let promise = new Promise(function(resolve, reject){
        resolve(1);
      });

      promise.then(function(value){
        // value === 1
      });
      ```

      Instead of writing the above, your code now simply becomes the following:

      ```javascript
      let promise = Promise.resolve(1);

      promise.then(function(value){
        // value === 1
      });
      ```

      @method resolve
      @static
      @param {Any} value value that the returned promise will be resolved with
      Useful for tooling.
      @return {Promise} a promise that will become fulfilled with the given
      `value`
    */
    function resolve$1(object) {
      /*jshint validthis:true */
      var Constructor = this;

      if (object && typeof object === 'object' && object.constructor === Constructor) {
        return object;
      }

      var promise = new Constructor(noop);
      resolve(promise, object);
      return promise;
    }

    var PROMISE_ID = Math.random().toString(36).substring(2);

    function noop() {}

    var PENDING = void 0;
    var FULFILLED = 1;
    var REJECTED = 2;

    function selfFulfillment() {
      return new TypeError("You cannot resolve a promise with itself");
    }

    function cannotReturnOwn() {
      return new TypeError('A promises callback cannot return that same promise.');
    }

    function tryThen(then$$1, value, fulfillmentHandler, rejectionHandler) {
      try {
        then$$1.call(value, fulfillmentHandler, rejectionHandler);
      } catch (e) {
        return e;
      }
    }

    function handleForeignThenable(promise, thenable, then$$1) {
      asap(function (promise) {
        var sealed = false;
        var error = tryThen(then$$1, thenable, function (value) {
          if (sealed) {
            return;
          }
          sealed = true;
          if (thenable !== value) {
            resolve(promise, value);
          } else {
            fulfill(promise, value);
          }
        }, function (reason) {
          if (sealed) {
            return;
          }
          sealed = true;

          reject(promise, reason);
        }, 'Settle: ' + (promise._label || ' unknown promise'));

        if (!sealed && error) {
          sealed = true;
          reject(promise, error);
        }
      }, promise);
    }

    function handleOwnThenable(promise, thenable) {
      if (thenable._state === FULFILLED) {
        fulfill(promise, thenable._result);
      } else if (thenable._state === REJECTED) {
        reject(promise, thenable._result);
      } else {
        subscribe(thenable, undefined, function (value) {
          return resolve(promise, value);
        }, function (reason) {
          return reject(promise, reason);
        });
      }
    }

    function handleMaybeThenable(promise, maybeThenable, then$$1) {
      if (maybeThenable.constructor === promise.constructor && then$$1 === then && maybeThenable.constructor.resolve === resolve$1) {
        handleOwnThenable(promise, maybeThenable);
      } else {
        if (then$$1 === undefined) {
          fulfill(promise, maybeThenable);
        } else if (isFunction(then$$1)) {
          handleForeignThenable(promise, maybeThenable, then$$1);
        } else {
          fulfill(promise, maybeThenable);
        }
      }
    }

    function resolve(promise, value) {
      if (promise === value) {
        reject(promise, selfFulfillment());
      } else if (objectOrFunction(value)) {
        var then$$1 = void 0;
        try {
          then$$1 = value.then;
        } catch (error) {
          reject(promise, error);
          return;
        }
        handleMaybeThenable(promise, value, then$$1);
      } else {
        fulfill(promise, value);
      }
    }

    function publishRejection(promise) {
      if (promise._onerror) {
        promise._onerror(promise._result);
      }

      publish(promise);
    }

    function fulfill(promise, value) {
      if (promise._state !== PENDING) {
        return;
      }

      promise._result = value;
      promise._state = FULFILLED;

      if (promise._subscribers.length !== 0) {
        asap(publish, promise);
      }
    }

    function reject(promise, reason) {
      if (promise._state !== PENDING) {
        return;
      }
      promise._state = REJECTED;
      promise._result = reason;

      asap(publishRejection, promise);
    }

    function subscribe(parent, child, onFulfillment, onRejection) {
      var _subscribers = parent._subscribers;
      var length = _subscribers.length;


      parent._onerror = null;

      _subscribers[length] = child;
      _subscribers[length + FULFILLED] = onFulfillment;
      _subscribers[length + REJECTED] = onRejection;

      if (length === 0 && parent._state) {
        asap(publish, parent);
      }
    }

    function publish(promise) {
      var subscribers = promise._subscribers;
      var settled = promise._state;

      if (subscribers.length === 0) {
        return;
      }

      var child = void 0,
          callback = void 0,
          detail = promise._result;

      for (var i = 0; i < subscribers.length; i += 3) {
        child = subscribers[i];
        callback = subscribers[i + settled];

        if (child) {
          invokeCallback(settled, child, callback, detail);
        } else {
          callback(detail);
        }
      }

      promise._subscribers.length = 0;
    }

    function invokeCallback(settled, promise, callback, detail) {
      var hasCallback = isFunction(callback),
          value = void 0,
          error = void 0,
          succeeded = true;

      if (hasCallback) {
        try {
          value = callback(detail);
        } catch (e) {
          succeeded = false;
          error = e;
        }

        if (promise === value) {
          reject(promise, cannotReturnOwn());
          return;
        }
      } else {
        value = detail;
      }

      if (promise._state !== PENDING) ; else if (hasCallback && succeeded) {
        resolve(promise, value);
      } else if (succeeded === false) {
        reject(promise, error);
      } else if (settled === FULFILLED) {
        fulfill(promise, value);
      } else if (settled === REJECTED) {
        reject(promise, value);
      }
    }

    function initializePromise(promise, resolver) {
      try {
        resolver(function resolvePromise(value) {
          resolve(promise, value);
        }, function rejectPromise(reason) {
          reject(promise, reason);
        });
      } catch (e) {
        reject(promise, e);
      }
    }

    var id = 0;
    function nextId() {
      return id++;
    }

    function makePromise(promise) {
      promise[PROMISE_ID] = id++;
      promise._state = undefined;
      promise._result = undefined;
      promise._subscribers = [];
    }

    function validationError() {
      return new Error('Array Methods must be provided an Array');
    }

    var Enumerator = function () {
      function Enumerator(Constructor, input) {
        this._instanceConstructor = Constructor;
        this.promise = new Constructor(noop);

        if (!this.promise[PROMISE_ID]) {
          makePromise(this.promise);
        }

        if (isArray(input)) {
          this.length = input.length;
          this._remaining = input.length;

          this._result = new Array(this.length);

          if (this.length === 0) {
            fulfill(this.promise, this._result);
          } else {
            this.length = this.length || 0;
            this._enumerate(input);
            if (this._remaining === 0) {
              fulfill(this.promise, this._result);
            }
          }
        } else {
          reject(this.promise, validationError());
        }
      }

      Enumerator.prototype._enumerate = function _enumerate(input) {
        for (var i = 0; this._state === PENDING && i < input.length; i++) {
          this._eachEntry(input[i], i);
        }
      };

      Enumerator.prototype._eachEntry = function _eachEntry(entry, i) {
        var c = this._instanceConstructor;
        var resolve$$1 = c.resolve;


        if (resolve$$1 === resolve$1) {
          var _then = void 0;
          var error = void 0;
          var didError = false;
          try {
            _then = entry.then;
          } catch (e) {
            didError = true;
            error = e;
          }

          if (_then === then && entry._state !== PENDING) {
            this._settledAt(entry._state, i, entry._result);
          } else if (typeof _then !== 'function') {
            this._remaining--;
            this._result[i] = entry;
          } else if (c === Promise$1) {
            var promise = new c(noop);
            if (didError) {
              reject(promise, error);
            } else {
              handleMaybeThenable(promise, entry, _then);
            }
            this._willSettleAt(promise, i);
          } else {
            this._willSettleAt(new c(function (resolve$$1) {
              return resolve$$1(entry);
            }), i);
          }
        } else {
          this._willSettleAt(resolve$$1(entry), i);
        }
      };

      Enumerator.prototype._settledAt = function _settledAt(state, i, value) {
        var promise = this.promise;


        if (promise._state === PENDING) {
          this._remaining--;

          if (state === REJECTED) {
            reject(promise, value);
          } else {
            this._result[i] = value;
          }
        }

        if (this._remaining === 0) {
          fulfill(promise, this._result);
        }
      };

      Enumerator.prototype._willSettleAt = function _willSettleAt(promise, i) {
        var enumerator = this;

        subscribe(promise, undefined, function (value) {
          return enumerator._settledAt(FULFILLED, i, value);
        }, function (reason) {
          return enumerator._settledAt(REJECTED, i, reason);
        });
      };

      return Enumerator;
    }();

    /**
      `Promise.all` accepts an array of promises, and returns a new promise which
      is fulfilled with an array of fulfillment values for the passed promises, or
      rejected with the reason of the first passed promise to be rejected. It casts all
      elements of the passed iterable to promises as it runs this algorithm.

      Example:

      ```javascript
      let promise1 = resolve(1);
      let promise2 = resolve(2);
      let promise3 = resolve(3);
      let promises = [ promise1, promise2, promise3 ];

      Promise.all(promises).then(function(array){
        // The array here would be [ 1, 2, 3 ];
      });
      ```

      If any of the `promises` given to `all` are rejected, the first promise
      that is rejected will be given as an argument to the returned promises's
      rejection handler. For example:

      Example:

      ```javascript
      let promise1 = resolve(1);
      let promise2 = reject(new Error("2"));
      let promise3 = reject(new Error("3"));
      let promises = [ promise1, promise2, promise3 ];

      Promise.all(promises).then(function(array){
        // Code here never runs because there are rejected promises!
      }, function(error) {
        // error.message === "2"
      });
      ```

      @method all
      @static
      @param {Array} entries array of promises
      @param {String} label optional string for labeling the promise.
      Useful for tooling.
      @return {Promise} promise that is fulfilled when all `promises` have been
      fulfilled, or rejected if any of them become rejected.
      @static
    */
    function all(entries) {
      return new Enumerator(this, entries).promise;
    }

    /**
      `Promise.race` returns a new promise which is settled in the same way as the
      first passed promise to settle.

      Example:

      ```javascript
      let promise1 = new Promise(function(resolve, reject){
        setTimeout(function(){
          resolve('promise 1');
        }, 200);
      });

      let promise2 = new Promise(function(resolve, reject){
        setTimeout(function(){
          resolve('promise 2');
        }, 100);
      });

      Promise.race([promise1, promise2]).then(function(result){
        // result === 'promise 2' because it was resolved before promise1
        // was resolved.
      });
      ```

      `Promise.race` is deterministic in that only the state of the first
      settled promise matters. For example, even if other promises given to the
      `promises` array argument are resolved, but the first settled promise has
      become rejected before the other promises became fulfilled, the returned
      promise will become rejected:

      ```javascript
      let promise1 = new Promise(function(resolve, reject){
        setTimeout(function(){
          resolve('promise 1');
        }, 200);
      });

      let promise2 = new Promise(function(resolve, reject){
        setTimeout(function(){
          reject(new Error('promise 2'));
        }, 100);
      });

      Promise.race([promise1, promise2]).then(function(result){
        // Code here never runs
      }, function(reason){
        // reason.message === 'promise 2' because promise 2 became rejected before
        // promise 1 became fulfilled
      });
      ```

      An example real-world use case is implementing timeouts:

      ```javascript
      Promise.race([ajax('foo.json'), timeout(5000)])
      ```

      @method race
      @static
      @param {Array} promises array of promises to observe
      Useful for tooling.
      @return {Promise} a promise which settles in the same way as the first passed
      promise to settle.
    */
    function race(entries) {
      /*jshint validthis:true */
      var Constructor = this;

      if (!isArray(entries)) {
        return new Constructor(function (_, reject) {
          return reject(new TypeError('You must pass an array to race.'));
        });
      } else {
        return new Constructor(function (resolve, reject) {
          var length = entries.length;
          for (var i = 0; i < length; i++) {
            Constructor.resolve(entries[i]).then(resolve, reject);
          }
        });
      }
    }

    /**
      `Promise.reject` returns a promise rejected with the passed `reason`.
      It is shorthand for the following:

      ```javascript
      let promise = new Promise(function(resolve, reject){
        reject(new Error('WHOOPS'));
      });

      promise.then(function(value){
        // Code here doesn't run because the promise is rejected!
      }, function(reason){
        // reason.message === 'WHOOPS'
      });
      ```

      Instead of writing the above, your code now simply becomes the following:

      ```javascript
      let promise = Promise.reject(new Error('WHOOPS'));

      promise.then(function(value){
        // Code here doesn't run because the promise is rejected!
      }, function(reason){
        // reason.message === 'WHOOPS'
      });
      ```

      @method reject
      @static
      @param {Any} reason value that the returned promise will be rejected with.
      Useful for tooling.
      @return {Promise} a promise rejected with the given `reason`.
    */
    function reject$1(reason) {
      /*jshint validthis:true */
      var Constructor = this;
      var promise = new Constructor(noop);
      reject(promise, reason);
      return promise;
    }

    function needsResolver() {
      throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
    }

    function needsNew() {
      throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
    }

    /**
      Promise objects represent the eventual result of an asynchronous operation. The
      primary way of interacting with a promise is through its `then` method, which
      registers callbacks to receive either a promise's eventual value or the reason
      why the promise cannot be fulfilled.

      Terminology
      -----------

      - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
      - `thenable` is an object or function that defines a `then` method.
      - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
      - `exception` is a value that is thrown using the throw statement.
      - `reason` is a value that indicates why a promise was rejected.
      - `settled` the final resting state of a promise, fulfilled or rejected.

      A promise can be in one of three states: pending, fulfilled, or rejected.

      Promises that are fulfilled have a fulfillment value and are in the fulfilled
      state.  Promises that are rejected have a rejection reason and are in the
      rejected state.  A fulfillment value is never a thenable.

      Promises can also be said to *resolve* a value.  If this value is also a
      promise, then the original promise's settled state will match the value's
      settled state.  So a promise that *resolves* a promise that rejects will
      itself reject, and a promise that *resolves* a promise that fulfills will
      itself fulfill.


      Basic Usage:
      ------------

      ```js
      let promise = new Promise(function(resolve, reject) {
        // on success
        resolve(value);

        // on failure
        reject(reason);
      });

      promise.then(function(value) {
        // on fulfillment
      }, function(reason) {
        // on rejection
      });
      ```

      Advanced Usage:
      ---------------

      Promises shine when abstracting away asynchronous interactions such as
      `XMLHttpRequest`s.

      ```js
      function getJSON(url) {
        return new Promise(function(resolve, reject){
          let xhr = new XMLHttpRequest();

          xhr.open('GET', url);
          xhr.onreadystatechange = handler;
          xhr.responseType = 'json';
          xhr.setRequestHeader('Accept', 'application/json');
          xhr.send();

          function handler() {
            if (this.readyState === this.DONE) {
              if (this.status === 200) {
                resolve(this.response);
              } else {
                reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
              }
            }
          };
        });
      }

      getJSON('/posts.json').then(function(json) {
        // on fulfillment
      }, function(reason) {
        // on rejection
      });
      ```

      Unlike callbacks, promises are great composable primitives.

      ```js
      Promise.all([
        getJSON('/posts'),
        getJSON('/comments')
      ]).then(function(values){
        values[0] // => postsJSON
        values[1] // => commentsJSON

        return values;
      });
      ```

      @class Promise
      @param {Function} resolver
      Useful for tooling.
      @constructor
    */

    var Promise$1 = function () {
      function Promise(resolver) {
        this[PROMISE_ID] = nextId();
        this._result = this._state = undefined;
        this._subscribers = [];

        if (noop !== resolver) {
          typeof resolver !== 'function' && needsResolver();
          this instanceof Promise ? initializePromise(this, resolver) : needsNew();
        }
      }

      /**
      The primary way of interacting with a promise is through its `then` method,
      which registers callbacks to receive either a promise's eventual value or the
      reason why the promise cannot be fulfilled.
       ```js
      findUser().then(function(user){
        // user is available
      }, function(reason){
        // user is unavailable, and you are given the reason why
      });
      ```
       Chaining
      --------
       The return value of `then` is itself a promise.  This second, 'downstream'
      promise is resolved with the return value of the first promise's fulfillment
      or rejection handler, or rejected if the handler throws an exception.
       ```js
      findUser().then(function (user) {
        return user.name;
      }, function (reason) {
        return 'default name';
      }).then(function (userName) {
        // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
        // will be `'default name'`
      });
       findUser().then(function (user) {
        throw new Error('Found user, but still unhappy');
      }, function (reason) {
        throw new Error('`findUser` rejected and we're unhappy');
      }).then(function (value) {
        // never reached
      }, function (reason) {
        // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
        // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
      });
      ```
      If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.
       ```js
      findUser().then(function (user) {
        throw new PedagogicalException('Upstream error');
      }).then(function (value) {
        // never reached
      }).then(function (value) {
        // never reached
      }, function (reason) {
        // The `PedgagocialException` is propagated all the way down to here
      });
      ```
       Assimilation
      ------------
       Sometimes the value you want to propagate to a downstream promise can only be
      retrieved asynchronously. This can be achieved by returning a promise in the
      fulfillment or rejection handler. The downstream promise will then be pending
      until the returned promise is settled. This is called *assimilation*.
       ```js
      findUser().then(function (user) {
        return findCommentsByAuthor(user);
      }).then(function (comments) {
        // The user's comments are now available
      });
      ```
       If the assimliated promise rejects, then the downstream promise will also reject.
       ```js
      findUser().then(function (user) {
        return findCommentsByAuthor(user);
      }).then(function (comments) {
        // If `findCommentsByAuthor` fulfills, we'll have the value here
      }, function (reason) {
        // If `findCommentsByAuthor` rejects, we'll have the reason here
      });
      ```
       Simple Example
      --------------
       Synchronous Example
       ```javascript
      let result;
       try {
        result = findResult();
        // success
      } catch(reason) {
        // failure
      }
      ```
       Errback Example
       ```js
      findResult(function(result, err){
        if (err) {
          // failure
        } else {
          // success
        }
      });
      ```
       Promise Example;
       ```javascript
      findResult().then(function(result){
        // success
      }, function(reason){
        // failure
      });
      ```
       Advanced Example
      --------------
       Synchronous Example
       ```javascript
      let author, books;
       try {
        author = findAuthor();
        books  = findBooksByAuthor(author);
        // success
      } catch(reason) {
        // failure
      }
      ```
       Errback Example
       ```js
       function foundBooks(books) {
       }
       function failure(reason) {
       }
       findAuthor(function(author, err){
        if (err) {
          failure(err);
          // failure
        } else {
          try {
            findBoooksByAuthor(author, function(books, err) {
              if (err) {
                failure(err);
              } else {
                try {
                  foundBooks(books);
                } catch(reason) {
                  failure(reason);
                }
              }
            });
          } catch(error) {
            failure(err);
          }
          // success
        }
      });
      ```
       Promise Example;
       ```javascript
      findAuthor().
        then(findBooksByAuthor).
        then(function(books){
          // found books
      }).catch(function(reason){
        // something went wrong
      });
      ```
       @method then
      @param {Function} onFulfilled
      @param {Function} onRejected
      Useful for tooling.
      @return {Promise}
      */

      /**
      `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
      as the catch block of a try/catch statement.
      ```js
      function findAuthor(){
      throw new Error('couldn't find that author');
      }
      // synchronous
      try {
      findAuthor();
      } catch(reason) {
      // something went wrong
      }
      // async with promises
      findAuthor().catch(function(reason){
      // something went wrong
      });
      ```
      @method catch
      @param {Function} onRejection
      Useful for tooling.
      @return {Promise}
      */


      Promise.prototype.catch = function _catch(onRejection) {
        return this.then(null, onRejection);
      };

      /**
        `finally` will be invoked regardless of the promise's fate just as native
        try/catch/finally behaves
      
        Synchronous example:
      
        ```js
        findAuthor() {
          if (Math.random() > 0.5) {
            throw new Error();
          }
          return new Author();
        }
      
        try {
          return findAuthor(); // succeed or fail
        } catch(error) {
          return findOtherAuther();
        } finally {
          // always runs
          // doesn't affect the return value
        }
        ```
      
        Asynchronous example:
      
        ```js
        findAuthor().catch(function(reason){
          return findOtherAuther();
        }).finally(function(){
          // author was either found, or not
        });
        ```
      
        @method finally
        @param {Function} callback
        @return {Promise}
      */


      Promise.prototype.finally = function _finally(callback) {
        var promise = this;
        var constructor = promise.constructor;

        if (isFunction(callback)) {
          return promise.then(function (value) {
            return constructor.resolve(callback()).then(function () {
              return value;
            });
          }, function (reason) {
            return constructor.resolve(callback()).then(function () {
              throw reason;
            });
          });
        }

        return promise.then(callback, callback);
      };

      return Promise;
    }();

    Promise$1.prototype.then = then;
    Promise$1.all = all;
    Promise$1.race = race;
    Promise$1.resolve = resolve$1;
    Promise$1.reject = reject$1;
    Promise$1._setScheduler = setScheduler;
    Promise$1._setAsap = setAsap;
    Promise$1._asap = asap;

    /*global self*/
    function polyfill() {
      var local = void 0;

      if (typeof commonjsGlobal !== 'undefined') {
        local = commonjsGlobal;
      } else if (typeof self !== 'undefined') {
        local = self;
      } else {
        try {
          local = Function('return this')();
        } catch (e) {
          throw new Error('polyfill failed because global object is unavailable in this environment');
        }
      }

      var P = local.Promise;

      if (P) {
        var promiseToString = null;
        try {
          promiseToString = Object.prototype.toString.call(P.resolve());
        } catch (e) {
          // silently ignored
        }

        if (promiseToString === '[object Promise]' && !P.cast) {
          return;
        }
      }

      local.Promise = Promise$1;
    }

    // Strange compat..
    Promise$1.polyfill = polyfill;
    Promise$1.Promise = Promise$1;

    return Promise$1;

    })));




    });

    // Copyright Joyent, Inc. and other Node contributors.

    var stringifyPrimitive = function(v) {
      switch (typeof v) {
        case 'string':
          return v;

        case 'boolean':
          return v ? 'true' : 'false';

        case 'number':
          return isFinite(v) ? v : '';

        default:
          return '';
      }
    };

    var encode = function(obj, sep, eq, name) {
      sep = sep || '&';
      eq = eq || '=';
      if (obj === null) {
        obj = undefined;
      }

      if (typeof obj === 'object') {
        return map$1(objectKeys$1(obj), function(k) {
          var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
          if (isArray(obj[k])) {
            return map$1(obj[k], function(v) {
              return ks + encodeURIComponent(stringifyPrimitive(v));
            }).join(sep);
          } else {
            return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
          }
        }).join(sep);

      }

      if (!name) return '';
      return encodeURIComponent(stringifyPrimitive(name)) + eq +
             encodeURIComponent(stringifyPrimitive(obj));
    };

    var isArray = Array.isArray || function (xs) {
      return Object.prototype.toString.call(xs) === '[object Array]';
    };

    function map$1 (xs, f) {
      if (xs.map) return xs.map(f);
      var res = [];
      for (var i = 0; i < xs.length; i++) {
        res.push(f(xs[i], i));
      }
      return res;
    }

    var objectKeys$1 = Object.keys || function (obj) {
      var res = [];
      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
      }
      return res;
    };

    var inlineHeaders_1 = inlineHeaders;



    function inlineHeaders(url, headers) {
      if (/\?/.test(url)) {
        url += '&';
      } else {
        url += '?';
      }

      return url + encode(headers);
    }

    var jsonpRequest_1 = jsonpRequest;



    var JSONPCounter = 0;

    function jsonpRequest(url, opts, cb) {
      if (opts.method !== 'GET') {
        cb(new Error('Method ' + opts.method + ' ' + url + ' is not supported by JSONP.'));
        return;
      }

      opts.debug('JSONP: start');

      var cbCalled = false;
      var timedOut = false;

      JSONPCounter += 1;
      var head = document.getElementsByTagName('head')[0];
      var script = document.createElement('script');
      var cbName = 'algoliaJSONP_' + JSONPCounter;
      var done = false;

      window[cbName] = function(data) {
        removeGlobals();

        if (timedOut) {
          opts.debug('JSONP: Late answer, ignoring');
          return;
        }

        cbCalled = true;

        clean();

        cb(null, {
          body: data,
          responseText: JSON.stringify(data)/* ,
          // We do not send the statusCode, there's no statusCode in JSONP, it will be
          // computed using data.status && data.message like with XDR
          statusCode*/
        });
      };

      // add callback by hand
      url += '&callback=' + cbName;

      // add body params manually
      if (opts.jsonBody && opts.jsonBody.params) {
        url += '&' + opts.jsonBody.params;
      }

      var ontimeout = setTimeout(timeout, opts.timeouts.complete);

      // script onreadystatechange needed only for
      // <= IE8
      // https://github.com/angular/angular.js/issues/4523
      script.onreadystatechange = readystatechange;
      script.onload = success;
      script.onerror = error;

      script.async = true;
      script.defer = true;
      script.src = url;
      head.appendChild(script);

      function success() {
        opts.debug('JSONP: success');

        if (done || timedOut) {
          return;
        }

        done = true;

        // script loaded but did not call the fn => script loading error
        if (!cbCalled) {
          opts.debug('JSONP: Fail. Script loaded but did not call the callback');
          clean();
          cb(new errors.JSONPScriptFail());
        }
      }

      function readystatechange() {
        if (this.readyState === 'loaded' || this.readyState === 'complete') {
          success();
        }
      }

      function clean() {
        clearTimeout(ontimeout);
        script.onload = null;
        script.onreadystatechange = null;
        script.onerror = null;
        head.removeChild(script);
      }

      function removeGlobals() {
        try {
          delete window[cbName];
          delete window[cbName + '_loaded'];
        } catch (e) {
          window[cbName] = window[cbName + '_loaded'] = undefined;
        }
      }

      function timeout() {
        opts.debug('JSONP: Script timeout');
        timedOut = true;
        clean();
        cb(new errors.RequestTimeout());
      }

      function error() {
        opts.debug('JSONP: Script error');

        if (done || timedOut) {
          return;
        }

        clean();
        cb(new errors.JSONPScriptError());
      }
    }

    // Copyright Joyent, Inc. and other Node contributors.

    // If obj.hasOwnProperty has been overridden, then calling
    // obj.hasOwnProperty(prop) will break.
    // See: https://github.com/joyent/node/issues/1707
    function hasOwnProperty(obj, prop) {
      return Object.prototype.hasOwnProperty.call(obj, prop);
    }

    var decode = function(qs, sep, eq, options) {
      sep = sep || '&';
      eq = eq || '=';
      var obj = {};

      if (typeof qs !== 'string' || qs.length === 0) {
        return obj;
      }

      var regexp = /\+/g;
      qs = qs.split(sep);

      var maxKeys = 1000;
      if (options && typeof options.maxKeys === 'number') {
        maxKeys = options.maxKeys;
      }

      var len = qs.length;
      // maxKeys <= 0 means that we should not limit keys count
      if (maxKeys > 0 && len > maxKeys) {
        len = maxKeys;
      }

      for (var i = 0; i < len; ++i) {
        var x = qs[i].replace(regexp, '%20'),
            idx = x.indexOf(eq),
            kstr, vstr, k, v;

        if (idx >= 0) {
          kstr = x.substr(0, idx);
          vstr = x.substr(idx + 1);
        } else {
          kstr = x;
          vstr = '';
        }

        k = decodeURIComponent(kstr);
        v = decodeURIComponent(vstr);

        if (!hasOwnProperty(obj, k)) {
          obj[k] = v;
        } else if (isArray$1(obj[k])) {
          obj[k].push(v);
        } else {
          obj[k] = [obj[k], v];
        }
      }

      return obj;
    };

    var isArray$1 = Array.isArray || function (xs) {
      return Object.prototype.toString.call(xs) === '[object Array]';
    };

    var querystringEs3 = createCommonjsModule(function (module, exports) {

    exports.decode = exports.parse = decode;
    exports.encode = exports.stringify = encode;
    });
    var querystringEs3_1 = querystringEs3.decode;
    var querystringEs3_2 = querystringEs3.parse;
    var querystringEs3_3 = querystringEs3.encode;
    var querystringEs3_4 = querystringEs3.stringify;

    var places = createPlacesClient;




    function createPlacesClient(algoliasearch) {
      return function places(appID, apiKey, opts) {
        var cloneDeep = clone;

        opts = opts && cloneDeep(opts) || {};
        opts.hosts = opts.hosts || [
          'places-dsn.algolia.net',
          'places-1.algolianet.com',
          'places-2.algolianet.com',
          'places-3.algolianet.com'
        ];

        // allow initPlaces() no arguments => community rate limited
        if (arguments.length === 0 || typeof appID === 'object' || appID === undefined) {
          appID = '';
          apiKey = '';
          opts._allowEmptyCredentials = true;
        }

        var client = algoliasearch(appID, apiKey, opts);
        var index = client.initIndex('places');
        index.search = buildSearchMethod_1('query', '/1/places/query');
        index.reverse = function(options, callback) {
          var encoded = querystringEs3.encode(options);

          return this.as._jsonRequest({
            method: 'GET',
            url: '/1/places/reverse?' + encoded,
            hostType: 'read',
            callback: callback
          });
        };

        index.getObject = function(objectID, callback) {
          return this.as._jsonRequest({
            method: 'GET',
            url: '/1/places/' + encodeURIComponent(objectID),
            hostType: 'read',
            callback: callback
          });
        };
        return index;
      };
    }

    var version = '3.35.1';

    var Promise$1 = window_1.Promise || es6Promise.Promise;

    // This is the standalone browser build entry point
    // Browser implementation of the Algolia Search JavaScript client,
    // using XMLHttpRequest, XDomainRequest and JSONP as fallback
    var createAlgoliasearch = function createAlgoliasearch(AlgoliaSearch, uaSuffix) {
      var inherits = inherits_browser;
      var errors$1 = errors;
      var inlineHeaders = inlineHeaders_1;
      var jsonpRequest = jsonpRequest_1;
      var places$1 = places;
      uaSuffix = uaSuffix || '';

      if (process.env.NODE_ENV === 'debug') {
        browser.enable('algoliasearch*');
      }

      function algoliasearch(applicationID, apiKey, opts) {
        var cloneDeep = clone;

        opts = cloneDeep(opts || {});

        opts._ua = opts._ua || algoliasearch.ua;

        return new AlgoliaSearchBrowser(applicationID, apiKey, opts);
      }

      algoliasearch.version = version;

      algoliasearch.ua =
        'Algolia for JavaScript (' + algoliasearch.version + '); ' + uaSuffix;

      algoliasearch.initPlaces = places$1(algoliasearch);

      // we expose into window no matter how we are used, this will allow
      // us to easily debug any website running algolia
      window_1.__algolia = {
        debug: browser,
        algoliasearch: algoliasearch
      };

      var support = {
        hasXMLHttpRequest: 'XMLHttpRequest' in window_1,
        hasXDomainRequest: 'XDomainRequest' in window_1
      };

      if (support.hasXMLHttpRequest) {
        support.cors = 'withCredentials' in new XMLHttpRequest();
      }

      function AlgoliaSearchBrowser() {
        // call AlgoliaSearch constructor
        AlgoliaSearch.apply(this, arguments);
      }

      inherits(AlgoliaSearchBrowser, AlgoliaSearch);

      AlgoliaSearchBrowser.prototype._request = function request(url, opts) {
        return new Promise$1(function wrapRequest(resolve, reject) {
          // no cors or XDomainRequest, no request
          if (!support.cors && !support.hasXDomainRequest) {
            // very old browser, not supported
            reject(new errors$1.Network('CORS not supported'));
            return;
          }

          url = inlineHeaders(url, opts.headers);

          var body = opts.body;
          var req = support.cors ? new XMLHttpRequest() : new XDomainRequest();
          var reqTimeout;
          var timedOut;
          var connected = false;

          reqTimeout = setTimeout(onTimeout, opts.timeouts.connect);
          // we set an empty onprogress listener
          // so that XDomainRequest on IE9 is not aborted
          // refs:
          //  - https://github.com/algolia/algoliasearch-client-js/issues/76
          //  - https://social.msdn.microsoft.com/Forums/ie/en-US/30ef3add-767c-4436-b8a9-f1ca19b4812e/ie9-rtm-xdomainrequest-issued-requests-may-abort-if-all-event-handlers-not-specified?forum=iewebdevelopment
          req.onprogress = onProgress;
          if ('onreadystatechange' in req) req.onreadystatechange = onReadyStateChange;
          req.onload = onLoad;
          req.onerror = onError;

          // do not rely on default XHR async flag, as some analytics code like hotjar
          // breaks it and set it to false by default
          if (req instanceof XMLHttpRequest) {
            req.open(opts.method, url, true);

            // The Analytics API never accepts Auth headers as query string
            // this option exists specifically for them.
            if (opts.forceAuthHeaders) {
              req.setRequestHeader(
                'x-algolia-application-id',
                opts.headers['x-algolia-application-id']
              );
              req.setRequestHeader(
                'x-algolia-api-key',
                opts.headers['x-algolia-api-key']
              );
            }
          } else {
            req.open(opts.method, url);
          }

          // headers are meant to be sent after open
          if (support.cors) {
            if (body) {
              if (opts.method === 'POST') {
                // https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS#Simple_requests
                req.setRequestHeader('content-type', 'application/x-www-form-urlencoded');
              } else {
                req.setRequestHeader('content-type', 'application/json');
              }
            }
            req.setRequestHeader('accept', 'application/json');
          }

          if (body) {
            req.send(body);
          } else {
            req.send();
          }

          // event object not received in IE8, at least
          // but we do not use it, still important to note
          function onLoad(/* event */) {
            // When browser does not supports req.timeout, we can
            // have both a load and timeout event, since handled by a dumb setTimeout
            if (timedOut) {
              return;
            }

            clearTimeout(reqTimeout);

            var out;

            try {
              out = {
                body: JSON.parse(req.responseText),
                responseText: req.responseText,
                statusCode: req.status,
                // XDomainRequest does not have any response headers
                headers: req.getAllResponseHeaders && req.getAllResponseHeaders() || {}
              };
            } catch (e) {
              out = new errors$1.UnparsableJSON({
                more: req.responseText
              });
            }

            if (out instanceof errors$1.UnparsableJSON) {
              reject(out);
            } else {
              resolve(out);
            }
          }

          function onError(event) {
            if (timedOut) {
              return;
            }

            clearTimeout(reqTimeout);

            // error event is trigerred both with XDR/XHR on:
            //   - DNS error
            //   - unallowed cross domain request
            reject(
              new errors$1.Network({
                more: event
              })
            );
          }

          function onTimeout() {
            timedOut = true;
            req.abort();

            reject(new errors$1.RequestTimeout());
          }

          function onConnect() {
            connected = true;
            clearTimeout(reqTimeout);
            reqTimeout = setTimeout(onTimeout, opts.timeouts.complete);
          }

          function onProgress() {
            if (!connected) onConnect();
          }

          function onReadyStateChange() {
            if (!connected && req.readyState > 1) onConnect();
          }
        });
      };

      AlgoliaSearchBrowser.prototype._request.fallback = function requestFallback(url, opts) {
        url = inlineHeaders(url, opts.headers);

        return new Promise$1(function wrapJsonpRequest(resolve, reject) {
          jsonpRequest(url, opts, function jsonpRequestDone(err, content) {
            if (err) {
              reject(err);
              return;
            }

            resolve(content);
          });
        });
      };

      AlgoliaSearchBrowser.prototype._promise = {
        reject: function rejectPromise(val) {
          return Promise$1.reject(val);
        },
        resolve: function resolvePromise(val) {
          return Promise$1.resolve(val);
        },
        delay: function delayPromise(ms) {
          return new Promise$1(function resolveOnTimeout(resolve/* , reject*/) {
            setTimeout(resolve, ms);
          });
        },
        all: function all(promises) {
          return Promise$1.all(promises);
        }
      };

      return algoliasearch;
    };

    var algoliasearchLite = createAlgoliasearch(AlgoliaSearchCore_1, 'Browser (lite)');

    /* svelte/Search.svelte generated by Svelte v3.12.1 */

    const file$1 = "svelte/Search.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.hit = list[i];
    	child_ctx.each_value = list;
    	child_ctx.hit_index = i;
    	return child_ctx;
    }

    // (58:0) {#each hits as hit}
    function create_each_block(ctx) {
    	var article, h1, a0, t0_value = ctx.hit.title + "", t0, a0_href_value, t1, div, p, t2, a1, t3, span, i, a1_href_value, t4, dispose;

    	function p_input_handler() {
    		ctx.p_input_handler.call(p, ctx);
    	}

    	const block = {
    		c: function create() {
    			article = element("article");
    			h1 = element("h1");
    			a0 = element("a");
    			t0 = text(t0_value);
    			t1 = space();
    			div = element("div");
    			p = element("p");
    			t2 = space();
    			a1 = element("a");
    			t3 = text("Read more\n\t\t\t\t");
    			span = element("span");
    			i = element("i");
    			t4 = space();
    			attr_dev(a0, "href", a0_href_value = ctx.hit.permalink);
    			add_location(a0, file$1, 60, 3, 1064);
    			attr_dev(h1, "class", "title");
    			add_location(h1, file$1, 59, 2, 1042);
    			if (ctx.hit._highlightResult.summary.value === void 0) add_render_callback(p_input_handler);
    			attr_dev(p, "contenteditable", "");
    			add_location(p, file$1, 63, 3, 1147);
    			attr_dev(i, "class", "fa fa-angle-double-right");
    			add_location(i, file$1, 67, 5, 1327);
    			attr_dev(span, "class", "icon is-small");
    			add_location(span, file$1, 66, 4, 1293);
    			attr_dev(a1, "class", "button is-link");
    			attr_dev(a1, "href", a1_href_value = ctx.hit.permalink);
    			add_location(a1, file$1, 64, 3, 1226);
    			attr_dev(div, "class", "content summary");
    			add_location(div, file$1, 62, 2, 1114);
    			add_location(article, file$1, 58, 1, 1030);
    			dispose = listen_dev(p, "input", p_input_handler);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);
    			append_dev(article, h1);
    			append_dev(h1, a0);
    			append_dev(a0, t0);
    			append_dev(article, t1);
    			append_dev(article, div);
    			append_dev(div, p);

    			if (ctx.hit._highlightResult.summary.value !== void 0) p.innerHTML = ctx.hit._highlightResult.summary.value;

    			append_dev(div, t2);
    			append_dev(div, a1);
    			append_dev(a1, t3);
    			append_dev(a1, span);
    			append_dev(span, i);
    			append_dev(article, t4);
    		},

    		p: function update(changed, new_ctx) {
    			ctx = new_ctx;
    			if ((changed.hits) && t0_value !== (t0_value = ctx.hit.title + "")) {
    				set_data_dev(t0, t0_value);
    			}

    			if ((changed.hits) && a0_href_value !== (a0_href_value = ctx.hit.permalink)) {
    				attr_dev(a0, "href", a0_href_value);
    			}

    			if (changed.hits && ctx.hit._highlightResult.summary.value !== p.innerHTML) p.innerHTML = ctx.hit._highlightResult.summary.value;

    			if ((changed.hits) && a1_href_value !== (a1_href_value = ctx.hit.permalink)) {
    				attr_dev(a1, "href", a1_href_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(article);
    			}

    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block.name, type: "each", source: "(58:0) {#each hits as hit}", ctx });
    	return block;
    }

    function create_fragment$1(ctx) {
    	var input, t, section, dispose;

    	let each_value = ctx.hits;

    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			t = space();
    			section = element("section");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Type to search...");
    			attr_dev(input, "class", "svelte-1oderd3");
    			add_location(input, file$1, 55, 0, 906);
    			add_location(section, file$1, 56, 0, 999);

    			dispose = [
    				listen_dev(input, "input", ctx.input_input_handler),
    				listen_dev(input, "keyup", (ctx.search))
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);

    			set_input_value(input, ctx.query);

    			insert_dev(target, t, anchor);
    			insert_dev(target, section, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(section, null);
    			}
    		},

    		p: function update(changed, ctx) {
    			if (changed.query && (input.value !== ctx.query)) set_input_value(input, ctx.query);

    			if (changed.hits) {
    				each_value = ctx.hits;

    				let i;
    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(section, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(input);
    				detach_dev(t);
    				detach_dev(section);
    			}

    			destroy_each(each_blocks, detaching);

    			run_all(dispose);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$1.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	

    let searchClient;
    let index;

    let query = '';
    let hits = [];

    onMount(() => {
    	searchClient = algoliasearchLite(
    		'050Q9I7JU4',
    		'd39a178000a6d0adb751524350c881fe'
    	);

    	index = searchClient.initIndex('joost.meijles.com');

    	// Warm up search
    	index.search({ query }).then(console.log);
    });

    // Fires on each keyup in form
    async function search() {
    	if (query == '') {
    		$$invalidate('hits', hits = []);
    		return;
    	}

        const result = await index.search({ query, 
            facetFilters: [ 'kind:page' ]
        });
    	$$invalidate('hits', hits = result.hits);
    }

    	function input_input_handler() {
    		query = this.value;
    		$$invalidate('query', query);
    	}

    	function p_input_handler({ hit, each_value, hit_index }) {
    		each_value[hit_index]._highlightResult.summary.value = this.innerHTML;
    		$$invalidate('hits', hits);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ('searchClient' in $$props) searchClient = $$props.searchClient;
    		if ('index' in $$props) index = $$props.index;
    		if ('query' in $$props) $$invalidate('query', query = $$props.query);
    		if ('hits' in $$props) $$invalidate('hits', hits = $$props.hits);
    	};

    	return {
    		query,
    		hits,
    		search,
    		input_input_handler,
    		p_input_handler
    	};
    }

    class Search extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Search", options, id: create_fragment$1.name });
    	}
    }

    /* svelte/SearchModal.svelte generated by Svelte v3.12.1 */

    const file$2 = "svelte/SearchModal.svelte";

    // (12:0) {#if showModal}
    function create_if_block(ctx) {
    	var current;

    	var modal = new Modal({
    		props: {
    		$$slots: { default: [create_default_slot] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	modal.$on("close", ctx.close_handler);

    	const block = {
    		c: function create() {
    			modal.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(modal, target, anchor);
    			current = true;
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(modal.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(modal.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(modal, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block.name, type: "if", source: "(12:0) {#if showModal}", ctx });
    	return block;
    }

    // (13:1) <Modal on:close="{() => showModal = false}">
    function create_default_slot(ctx) {
    	var current;

    	var search = new Search({ $$inline: true });

    	const block = {
    		c: function create() {
    			search.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(search, target, anchor);
    			current = true;
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(search.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(search.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(search, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot.name, type: "slot", source: "(13:1) <Modal on:close=\"{() => showModal = false}\">", ctx });
    	return block;
    }

    function create_fragment$2(ctx) {
    	var button, t_1, if_block_anchor, current, dispose;

    	var if_block = (ctx.showModal) && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "🔍";
    			t_1 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			add_location(button, file$2, 7, 0, 127);
    			dispose = listen_dev(button, "click", ctx.click_handler);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			insert_dev(target, t_1, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (ctx.showModal) {
    				if (!if_block) {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else transition_in(if_block, 1);
    			} else if (if_block) {
    				group_outros();
    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(button);
    				detach_dev(t_1);
    			}

    			if (if_block) if_block.d(detaching);

    			if (detaching) {
    				detach_dev(if_block_anchor);
    			}

    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$2.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	

        let showModal = false;

    	const click_handler = () => $$invalidate('showModal', showModal = true);

    	const close_handler = () => $$invalidate('showModal', showModal = false);

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ('showModal' in $$props) $$invalidate('showModal', showModal = $$props.showModal);
    	};

    	return { showModal, click_handler, close_handler };
    }

    class SearchModal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "SearchModal", options, id: create_fragment$2.name });
    	}
    }

    const app = new SearchModal({
    	target: document.querySelector('div.search')
    });

    return app;

}());
//# sourceMappingURL=svelte.js.map
