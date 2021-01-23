
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
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
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
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
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
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
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
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

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
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
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
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
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
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
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.31.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/Station.svelte generated by Svelte v3.31.2 */

    const file = "src/Station.svelte";

    function create_fragment(ctx) {
    	let li;
    	let a0;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let t1_value = /*station*/ ctx[0].name + "";
    	let t1;
    	let t2;
    	let a0_href_value;
    	let br;
    	let t3;
    	let t4_value = /*station*/ ctx[0].codec + "";
    	let t4;
    	let t5;
    	let t6_value = /*station*/ ctx[0].bitrate + "";
    	let t6;
    	let t7;
    	let t8_value = /*station*/ ctx[0].votes + "";
    	let t8;
    	let t9;
    	let a1;
    	let t10;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			li = element("li");
    			a0 = element("a");
    			img = element("img");
    			t0 = space();
    			t1 = text(t1_value);
    			t2 = space();
    			br = element("br");
    			t3 = text("\n    Format: ");
    			t4 = text(t4_value);
    			t5 = space();
    			t6 = text(t6_value);
    			t7 = text(", voted: ");
    			t8 = text(t8_value);
    			t9 = space();
    			a1 = element("a");
    			t10 = text(/*icon*/ ctx[2]);
    			if (img.src !== (img_src_value = /*station*/ ctx[0].favicon)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*station*/ ctx[0].name);
    			attr_dev(img, "class", "icon svelte-18qbx5p");
    			add_location(img, file, 8, 8, 135);
    			attr_dev(a0, "href", a0_href_value = /*station*/ ctx[0].homepage);
    			add_location(a0, file, 7, 4, 99);
    			add_location(br, file, 10, 8, 227);
    			attr_dev(a1, "class", "btn");
    			add_location(a1, file, 12, 4, 306);
    			add_location(li, file, 6, 0, 90);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a0);
    			append_dev(a0, img);
    			append_dev(a0, t0);
    			append_dev(a0, t1);
    			append_dev(a0, t2);
    			append_dev(li, br);
    			append_dev(li, t3);
    			append_dev(li, t4);
    			append_dev(li, t5);
    			append_dev(li, t6);
    			append_dev(li, t7);
    			append_dev(li, t8);
    			append_dev(li, t9);
    			append_dev(li, a1);
    			append_dev(a1, t10);

    			if (!mounted) {
    				dispose = listen_dev(a1, "click", /*click_handler*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*station*/ 1 && img.src !== (img_src_value = /*station*/ ctx[0].favicon)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*station*/ 1 && img_alt_value !== (img_alt_value = /*station*/ ctx[0].name)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*station*/ 1 && t1_value !== (t1_value = /*station*/ ctx[0].name + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*station*/ 1 && a0_href_value !== (a0_href_value = /*station*/ ctx[0].homepage)) {
    				attr_dev(a0, "href", a0_href_value);
    			}

    			if (dirty & /*station*/ 1 && t4_value !== (t4_value = /*station*/ ctx[0].codec + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*station*/ 1 && t6_value !== (t6_value = /*station*/ ctx[0].bitrate + "")) set_data_dev(t6, t6_value);
    			if (dirty & /*station*/ 1 && t8_value !== (t8_value = /*station*/ ctx[0].votes + "")) set_data_dev(t8, t8_value);
    			if (dirty & /*icon*/ 4) set_data_dev(t10, /*icon*/ ctx[2]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Station", slots, []);
    	let { station } = $$props;
    	let { _onclick } = $$props;
    	let { icon } = $$props;
    	const writable_props = ["station", "_onclick", "icon"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Station> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => _onclick(station);

    	$$self.$$set = $$props => {
    		if ("station" in $$props) $$invalidate(0, station = $$props.station);
    		if ("_onclick" in $$props) $$invalidate(1, _onclick = $$props._onclick);
    		if ("icon" in $$props) $$invalidate(2, icon = $$props.icon);
    	};

    	$$self.$capture_state = () => ({ station, _onclick, icon });

    	$$self.$inject_state = $$props => {
    		if ("station" in $$props) $$invalidate(0, station = $$props.station);
    		if ("_onclick" in $$props) $$invalidate(1, _onclick = $$props._onclick);
    		if ("icon" in $$props) $$invalidate(2, icon = $$props.icon);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [station, _onclick, icon, click_handler];
    }

    class Station extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { station: 0, _onclick: 1, icon: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Station",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*station*/ ctx[0] === undefined && !("station" in props)) {
    			console.warn("<Station> was created without expected prop 'station'");
    		}

    		if (/*_onclick*/ ctx[1] === undefined && !("_onclick" in props)) {
    			console.warn("<Station> was created without expected prop '_onclick'");
    		}

    		if (/*icon*/ ctx[2] === undefined && !("icon" in props)) {
    			console.warn("<Station> was created without expected prop 'icon'");
    		}
    	}

    	get station() {
    		throw new Error("<Station>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set station(value) {
    		throw new Error("<Station>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get _onclick() {
    		throw new Error("<Station>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set _onclick(value) {
    		throw new Error("<Station>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get icon() {
    		throw new Error("<Station>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<Station>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.31.2 */

    const { Object: Object_1, console: console_1 } = globals;
    const file$1 = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	return child_ctx;
    }

    // (84:12) {#each stations_downloaded as station}
    function create_each_block_1(ctx) {
    	let station;
    	let current;

    	station = new Station({
    			props: {
    				station: /*station*/ ctx[15],
    				_onclick: /*addItem*/ ctx[5],
    				icon: ">"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(station.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(station, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const station_changes = {};
    			if (dirty & /*stations_downloaded*/ 4) station_changes.station = /*station*/ ctx[15];
    			station.$set(station_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(station.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(station.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(station, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(84:12) {#each stations_downloaded as station}",
    		ctx
    	});

    	return block;
    }

    // (92:12) {#each stations_selected as station}
    function create_each_block(ctx) {
    	let station;
    	let current;

    	station = new Station({
    			props: {
    				station: /*station*/ ctx[15],
    				_onclick: /*deleteItem*/ ctx[4],
    				icon: "x"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(station.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(station, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const station_changes = {};
    			if (dirty & /*stations_selected*/ 2) station_changes.station = /*station*/ ctx[15];
    			station.$set(station_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(station.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(station.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(station, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(92:12) {#each stations_selected as station}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div2;
    	let div0;
    	let h20;
    	let t1;
    	let form;
    	let input;
    	let t2;
    	let button0;
    	let t3;
    	let button0_disabled_value;
    	let t4;
    	let ul0;
    	let t5;
    	let div1;
    	let h21;
    	let t7;
    	let ul1;
    	let t8;
    	let button1;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*stations_downloaded*/ ctx[2];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks_1[i], 1, 1, () => {
    		each_blocks_1[i] = null;
    	});

    	let each_value = /*stations_selected*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out_1 = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			h20 = element("h2");
    			h20.textContent = "Search stations";
    			t1 = space();
    			form = element("form");
    			input = element("input");
    			t2 = space();
    			button0 = element("button");
    			t3 = text("Submit");
    			t4 = space();
    			ul0 = element("ul");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t5 = space();
    			div1 = element("div");
    			h21 = element("h2");
    			h21.textContent = "Selected stations";
    			t7 = space();
    			ul1 = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t8 = space();
    			button1 = element("button");
    			button1.textContent = "Download";
    			add_location(h20, file$1, 75, 8, 2484);
    			attr_dev(input, "class", "svelte-lae16h");
    			add_location(input, file$1, 77, 12, 2576);
    			button0.disabled = button0_disabled_value = !/*search*/ ctx[0];
    			attr_dev(button0, "type", "submit");
    			add_location(button0, file$1, 78, 12, 2616);
    			add_location(form, file$1, 76, 8, 2517);
    			add_location(ul0, file$1, 82, 8, 2725);
    			attr_dev(div0, "class", "column svelte-lae16h");
    			add_location(div0, file$1, 74, 4, 2455);
    			add_location(h21, file$1, 89, 8, 2932);
    			add_location(ul1, file$1, 90, 8, 2967);
    			add_location(button1, file$1, 95, 8, 3139);
    			attr_dev(div1, "class", "column svelte-lae16h");
    			add_location(div1, file$1, 88, 4, 2903);
    			attr_dev(div2, "class", "row svelte-lae16h");
    			add_location(div2, file$1, 73, 0, 2433);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, h20);
    			append_dev(div0, t1);
    			append_dev(div0, form);
    			append_dev(form, input);
    			set_input_value(input, /*search*/ ctx[0]);
    			append_dev(form, t2);
    			append_dev(form, button0);
    			append_dev(button0, t3);
    			append_dev(div0, t4);
    			append_dev(div0, ul0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(ul0, null);
    			}

    			append_dev(div2, t5);
    			append_dev(div2, div1);
    			append_dev(div1, h21);
    			append_dev(div1, t7);
    			append_dev(div1, ul1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul1, null);
    			}

    			append_dev(div1, t8);
    			append_dev(div1, button1);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[7]),
    					listen_dev(form, "submit", prevent_default(/*handleSubmit*/ ctx[3]), false, true, false),
    					listen_dev(button1, "click", /*download_generator*/ ctx[6], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*search*/ 1 && input.value !== /*search*/ ctx[0]) {
    				set_input_value(input, /*search*/ ctx[0]);
    			}

    			if (!current || dirty & /*search*/ 1 && button0_disabled_value !== (button0_disabled_value = !/*search*/ ctx[0])) {
    				prop_dev(button0, "disabled", button0_disabled_value);
    			}

    			if (dirty & /*stations_downloaded, addItem*/ 36) {
    				each_value_1 = /*stations_downloaded*/ ctx[2];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    						transition_in(each_blocks_1[i], 1);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						transition_in(each_blocks_1[i], 1);
    						each_blocks_1[i].m(ul0, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks_1.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (dirty & /*stations_selected, deleteItem*/ 18) {
    				each_value = /*stations_selected*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(ul1, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out_1(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks_1[i]);
    			}

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks_1 = each_blocks_1.filter(Boolean);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				transition_out(each_blocks_1[i]);
    			}

    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const search_url = "https://de1.api.radio-browser.info/json/stations/search";
    const m3u_header = "#EXTM3U";

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const m3u_entry = station => `#EXTINF:-1, ${station.name}\n${station.url}`;
    	const generate_playlist = () => [m3u_header, ...stations_selected.map(m3u_entry)].join("\n");
    	const queryString = params => "?" + Object.keys(params).map(key => key + "=" + params[key]).join("&");
    	const fullUrl = params => search_url + queryString(params);
    	let countries = [{ id: 1, name: `all` }, { id: 2, name: `pl` }, { id: 3, name: `uk` }];
    	let search = "";
    	let m3u_list = [];
    	let stations_selected = [];
    	let stations_downloaded = [];

    	function handleSubmit() {
    		doPost();
    	}

    	

    	async function doPost() {
    		console.log(search);

    		const res = await fetch(
    			fullUrl({
    				name: search,
    				order: "votes",
    				reverse: true
    			}),
    			{ method: "GET" }
    		);

    		$$invalidate(2, stations_downloaded = await res.json());
    	}

    	const deleteItem = selectedStation => {
    		$$invalidate(1, stations_selected = stations_selected.filter(station => station.stationuuid !== selectedStation.stationuuid));
    	};

    	const addItem = station => {
    		deleteItem(station);
    		stations_selected.push(station);
    		$$invalidate(1, stations_selected);
    	};

    	const download_generator = () => {
    		var result = generate_playlist();
    		var blob = new Blob([result]);

    		if (navigator.msSaveBlob) {
    			// IE 10+
    			navigator.msSaveBlob(blob, exportedFilenmae);
    		} else if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
    			var hiddenElement = window.document.createElement("a");
    			hiddenElement.href = "data:text/m3u;charset=utf-8," + encodeURI(result);
    			hiddenElement.target = "_blank";
    			hiddenElement.download = fileName;
    			hiddenElement.click();
    		} else {
    			let link = document.createElement("a");

    			if (link.download !== undefined) {
    				// Browsers that support HTML5 download attribute
    				var url = URL.createObjectURL(blob);

    				link.setAttribute("href", url);
    				link.setAttribute("download", "playlist.m3u");
    				link.style.visibility = "hidden";
    				document.body.appendChild(link);
    				link.click();
    				document.body.removeChild(link);
    			}
    		}
    	};

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		search = this.value;
    		$$invalidate(0, search);
    	}

    	$$self.$capture_state = () => ({
    		Station,
    		search_url,
    		m3u_header,
    		m3u_entry,
    		generate_playlist,
    		queryString,
    		fullUrl,
    		countries,
    		search,
    		m3u_list,
    		stations_selected,
    		stations_downloaded,
    		handleSubmit,
    		doPost,
    		deleteItem,
    		addItem,
    		download_generator
    	});

    	$$self.$inject_state = $$props => {
    		if ("countries" in $$props) countries = $$props.countries;
    		if ("search" in $$props) $$invalidate(0, search = $$props.search);
    		if ("m3u_list" in $$props) m3u_list = $$props.m3u_list;
    		if ("stations_selected" in $$props) $$invalidate(1, stations_selected = $$props.stations_selected);
    		if ("stations_downloaded" in $$props) $$invalidate(2, stations_downloaded = $$props.stations_downloaded);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		search,
    		stations_selected,
    		stations_downloaded,
    		handleSubmit,
    		deleteItem,
    		addItem,
    		download_generator,
    		input_input_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
