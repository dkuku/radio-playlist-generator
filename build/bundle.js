
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35730/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
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
    	let tr;
    	let td0;
    	let a0;
    	let img;
    	let img_src_value;
    	let t0;
    	let t1_value = /*station*/ ctx[0].name + "";
    	let t1;
    	let a0_href_value;
    	let t2;
    	let td1;
    	let t3_value = /*station*/ ctx[0].codec + "";
    	let t3;
    	let t4;
    	let td2;
    	let t5_value = /*station*/ ctx[0].bitrate + "";
    	let t5;
    	let t6;
    	let td3;
    	let t7_value = /*station*/ ctx[0].votes + "";
    	let t7;
    	let t8;
    	let td4;
    	let a1;
    	let t9;
    	let a1_href_value;
    	let t10;
    	let td5;
    	let a2;
    	let t11;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			a0 = element("a");
    			img = element("img");
    			t0 = space();
    			t1 = text(t1_value);
    			t2 = space();
    			td1 = element("td");
    			t3 = text(t3_value);
    			t4 = space();
    			td2 = element("td");
    			t5 = text(t5_value);
    			t6 = space();
    			td3 = element("td");
    			t7 = text(t7_value);
    			t8 = space();
    			td4 = element("td");
    			a1 = element("a");
    			t9 = text("►");
    			t10 = space();
    			td5 = element("td");
    			a2 = element("a");
    			t11 = text(/*icon*/ ctx[2]);
    			if (img.src !== (img_src_value = /*station*/ ctx[0].favicon)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "icon svelte-1ejnbx");
    			add_location(img, file, 9, 12, 166);
    			attr_dev(a0, "class", "break");
    			attr_dev(a0, "href", a0_href_value = /*station*/ ctx[0].homepage);
    			add_location(a0, file, 8, 8, 112);
    			add_location(td0, file, 7, 4, 99);
    			add_location(td1, file, 13, 4, 262);
    			add_location(td2, file, 16, 4, 305);
    			add_location(td3, file, 19, 4, 350);
    			attr_dev(a1, "href", a1_href_value = /*station*/ ctx[0].url);
    			attr_dev(a1, "class", "btn tooltip svelte-1ejnbx");
    			attr_dev(a1, "target", "_blank");
    			attr_dev(a1, "data-tooltip", "Play in new window");
    			add_location(a1, file, 23, 8, 406);
    			add_location(td4, file, 22, 4, 393);
    			attr_dev(a2, "href", "#");
    			attr_dev(a2, "class", "btn tooltip svelte-1ejnbx");
    			attr_dev(a2, "data-tooltip", "send to playlist");
    			add_location(a2, file, 26, 8, 539);
    			add_location(td5, file, 25, 4, 526);
    			add_location(tr, file, 6, 0, 90);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, a0);
    			append_dev(a0, img);
    			append_dev(a0, t0);
    			append_dev(a0, t1);
    			append_dev(tr, t2);
    			append_dev(tr, td1);
    			append_dev(td1, t3);
    			append_dev(tr, t4);
    			append_dev(tr, td2);
    			append_dev(td2, t5);
    			append_dev(tr, t6);
    			append_dev(tr, td3);
    			append_dev(td3, t7);
    			append_dev(tr, t8);
    			append_dev(tr, td4);
    			append_dev(td4, a1);
    			append_dev(a1, t9);
    			append_dev(tr, t10);
    			append_dev(tr, td5);
    			append_dev(td5, a2);
    			append_dev(a2, t11);

    			if (!mounted) {
    				dispose = listen_dev(a2, "click", /*click_handler*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*station*/ 1 && img.src !== (img_src_value = /*station*/ ctx[0].favicon)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*station*/ 1 && t1_value !== (t1_value = /*station*/ ctx[0].name + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*station*/ 1 && a0_href_value !== (a0_href_value = /*station*/ ctx[0].homepage)) {
    				attr_dev(a0, "href", a0_href_value);
    			}

    			if (dirty & /*station*/ 1 && t3_value !== (t3_value = /*station*/ ctx[0].codec + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*station*/ 1 && t5_value !== (t5_value = /*station*/ ctx[0].bitrate + "")) set_data_dev(t5, t5_value);
    			if (dirty & /*station*/ 1 && t7_value !== (t7_value = /*station*/ ctx[0].votes + "")) set_data_dev(t7, t7_value);

    			if (dirty & /*station*/ 1 && a1_href_value !== (a1_href_value = /*station*/ ctx[0].url)) {
    				attr_dev(a1, "href", a1_href_value);
    			}

    			if (dirty & /*icon*/ 4) set_data_dev(t11, /*icon*/ ctx[2]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
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

    const { Object: Object_1 } = globals;
    const file$1 = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[19] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[19] = list[i];
    	return child_ctx;
    }

    // (98:8) {#if stations_downloaded.length}
    function create_if_block_1(ctx) {
    	let div;
    	let p;
    	let t0_value = /*stations_downloaded*/ ctx[2].length + "";
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let table;
    	let thead;
    	let tr;
    	let th0;
    	let t6;
    	let th1;
    	let t8;
    	let th2;
    	let t10;
    	let th3;
    	let t12;
    	let th4;
    	let t14;
    	let th5;
    	let t16;
    	let tbody;
    	let current;
    	let each_value_1 = /*stations_downloaded*/ ctx[2];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			t0 = text(t0_value);
    			t1 = text(" results for query \"");
    			t2 = text(/*search*/ ctx[0]);
    			t3 = text("\"");
    			t4 = space();
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			th0 = element("th");
    			th0.textContent = "Name";
    			t6 = space();
    			th1 = element("th");
    			th1.textContent = "Codec";
    			t8 = space();
    			th2 = element("th");
    			th2.textContent = "Bitrate";
    			t10 = space();
    			th3 = element("th");
    			th3.textContent = "Votes";
    			t12 = space();
    			th4 = element("th");
    			th4.textContent = "Play";
    			t14 = space();
    			th5 = element("th");
    			th5.textContent = "Add";
    			t16 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(p, file$1, 99, 12, 3349);
    			add_location(div, file$1, 98, 8, 3331);
    			add_location(th0, file$1, 104, 20, 3506);
    			add_location(th1, file$1, 107, 20, 3586);
    			add_location(th2, file$1, 110, 20, 3667);
    			add_location(th3, file$1, 113, 20, 3750);
    			add_location(th4, file$1, 116, 20, 3831);
    			add_location(th5, file$1, 119, 20, 3911);
    			add_location(tr, file$1, 103, 16, 3481);
    			add_location(thead, file$1, 102, 12, 3457);
    			add_location(tbody, file$1, 124, 12, 4025);
    			add_location(table, file$1, 101, 8, 3437);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(p, t0);
    			append_dev(p, t1);
    			append_dev(p, t2);
    			append_dev(p, t3);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, table, anchor);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t6);
    			append_dev(tr, th1);
    			append_dev(tr, t8);
    			append_dev(tr, th2);
    			append_dev(tr, t10);
    			append_dev(tr, th3);
    			append_dev(tr, t12);
    			append_dev(tr, th4);
    			append_dev(tr, t14);
    			append_dev(tr, th5);
    			append_dev(table, t16);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*stations_downloaded*/ 4) && t0_value !== (t0_value = /*stations_downloaded*/ ctx[2].length + "")) set_data_dev(t0, t0_value);
    			if (!current || dirty & /*search*/ 1) set_data_dev(t2, /*search*/ ctx[0]);

    			if (dirty & /*stations_downloaded, addItem*/ 36) {
    				each_value_1 = /*stations_downloaded*/ ctx[2];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(table);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(98:8) {#if stations_downloaded.length}",
    		ctx
    	});

    	return block;
    }

    // (126:20) {#each stations_downloaded as station}
    function create_each_block_1(ctx) {
    	let station;
    	let current;

    	station = new Station({
    			props: {
    				station: /*station*/ ctx[19],
    				_onclick: /*addItem*/ ctx[5],
    				icon: "→"
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
    			if (dirty & /*stations_downloaded*/ 4) station_changes.station = /*station*/ ctx[19];
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
    		source: "(126:20) {#each stations_downloaded as station}",
    		ctx
    	});

    	return block;
    }

    // (134:8) {#if stations_selected.length}
    function create_if_block(ctx) {
    	let h2;
    	let t1;
    	let button;
    	let t3;
    	let table;
    	let thead;
    	let tr;
    	let th0;
    	let t5;
    	let th1;
    	let t7;
    	let th2;
    	let t9;
    	let th3;
    	let t11;
    	let th4;
    	let t13;
    	let th5;
    	let t15;
    	let tbody;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*stations_selected*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "Selected stations";
    			t1 = space();
    			button = element("button");
    			button.textContent = "Download";
    			t3 = space();
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			th0 = element("th");
    			th0.textContent = "Name";
    			t5 = space();
    			th1 = element("th");
    			th1.textContent = "Codec";
    			t7 = space();
    			th2 = element("th");
    			th2.textContent = "Bitrate";
    			t9 = space();
    			th3 = element("th");
    			th3.textContent = "Votes";
    			t11 = space();
    			th4 = element("th");
    			th4.textContent = "Play";
    			t13 = space();
    			th5 = element("th");
    			th5.textContent = "Add";
    			t15 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h2, file$1, 134, 8, 4343);
    			add_location(button, file$1, 135, 8, 4378);
    			add_location(th0, file$1, 141, 20, 4535);
    			add_location(th1, file$1, 144, 20, 4615);
    			add_location(th2, file$1, 147, 20, 4696);
    			add_location(th3, file$1, 150, 20, 4779);
    			add_location(th4, file$1, 153, 20, 4860);
    			add_location(th5, file$1, 156, 20, 4940);
    			add_location(tr, file$1, 140, 16, 4510);
    			add_location(thead, file$1, 139, 12, 4486);
    			add_location(tbody, file$1, 161, 12, 5054);
    			add_location(table, file$1, 138, 8, 4466);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, table, anchor);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t5);
    			append_dev(tr, th1);
    			append_dev(tr, t7);
    			append_dev(tr, th2);
    			append_dev(tr, t9);
    			append_dev(tr, th3);
    			append_dev(tr, t11);
    			append_dev(tr, th4);
    			append_dev(tr, t13);
    			append_dev(tr, th5);
    			append_dev(table, t15);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*download_generator*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
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
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(table);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(134:8) {#if stations_selected.length}",
    		ctx
    	});

    	return block;
    }

    // (163:16) {#each stations_selected as station}
    function create_each_block(ctx) {
    	let station;
    	let current;

    	station = new Station({
    			props: {
    				station: /*station*/ ctx[19],
    				_onclick: /*deleteItem*/ ctx[4],
    				icon: "␡"
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
    			if (dirty & /*stations_selected*/ 2) station_changes.station = /*station*/ ctx[19];
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
    		source: "(163:16) {#each stations_selected as station}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div3;
    	let div0;
    	let t0;
    	let div1;
    	let h1;
    	let t2;
    	let div2;
    	let t3;
    	let div7;
    	let div5;
    	let h2;
    	let t5;
    	let form;
    	let input;
    	let t6;
    	let button0;
    	let t7;
    	let button0_disabled_value;
    	let t8;
    	let div4;
    	let button1;
    	let t10;
    	let button2;
    	let t12;
    	let button3;
    	let t14;
    	let button4;
    	let t16;
    	let button5;
    	let t18;
    	let t19;
    	let div6;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*stations_downloaded*/ ctx[2].length && create_if_block_1(ctx);
    	let if_block1 = /*stations_selected*/ ctx[1].length && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Radio playlist generator";
    			t2 = space();
    			div2 = element("div");
    			t3 = space();
    			div7 = element("div");
    			div5 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Search stations";
    			t5 = space();
    			form = element("form");
    			input = element("input");
    			t6 = space();
    			button0 = element("button");
    			t7 = text("Submit");
    			t8 = space();
    			div4 = element("div");
    			button1 = element("button");
    			button1.textContent = "classic rock";
    			t10 = space();
    			button2 = element("button");
    			button2.textContent = "pop";
    			t12 = space();
    			button3 = element("button");
    			button3.textContent = "party";
    			t14 = space();
    			button4 = element("button");
    			button4.textContent = "disco";
    			t16 = space();
    			button5 = element("button");
    			button5.textContent = "disco polo";
    			t18 = space();
    			if (if_block0) if_block0.c();
    			t19 = space();
    			div6 = element("div");
    			if (if_block1) if_block1.c();
    			attr_dev(div0, "class", "column-3");
    			add_location(div0, file$1, 64, 4, 2291);
    			add_location(h1, file$1, 66, 8, 2355);
    			attr_dev(div1, "class", "column-3");
    			add_location(div1, file$1, 65, 4, 2324);
    			attr_dev(div2, "class", "column-3");
    			add_location(div2, file$1, 68, 4, 2404);
    			attr_dev(div3, "class", "row");
    			add_location(div3, file$1, 63, 0, 2269);
    			add_location(h2, file$1, 73, 8, 2494);
    			add_location(input, file$1, 75, 12, 2598);
    			button0.disabled = button0_disabled_value = !/*search*/ ctx[0];
    			attr_dev(button0, "type", "submit");
    			add_location(button0, file$1, 76, 12, 2638);
    			add_location(form, file$1, 74, 8, 2527);
    			add_location(button1, file$1, 81, 12, 2765);
    			add_location(button2, file$1, 84, 12, 2877);
    			add_location(button3, file$1, 87, 12, 2971);
    			add_location(button4, file$1, 90, 12, 3069);
    			add_location(button5, file$1, 93, 12, 3167);
    			add_location(div4, file$1, 80, 8, 2747);
    			attr_dev(div5, "class", "column-2");
    			add_location(div5, file$1, 72, 4, 2463);
    			attr_dev(div6, "class", "column-2");
    			add_location(div6, file$1, 132, 4, 4273);
    			attr_dev(div7, "class", "row");
    			add_location(div7, file$1, 71, 0, 2441);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div3, t0);
    			append_dev(div3, div1);
    			append_dev(div1, h1);
    			append_dev(div3, t2);
    			append_dev(div3, div2);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div5);
    			append_dev(div5, h2);
    			append_dev(div5, t5);
    			append_dev(div5, form);
    			append_dev(form, input);
    			set_input_value(input, /*search*/ ctx[0]);
    			append_dev(form, t6);
    			append_dev(form, button0);
    			append_dev(button0, t7);
    			append_dev(div5, t8);
    			append_dev(div5, div4);
    			append_dev(div4, button1);
    			append_dev(div4, t10);
    			append_dev(div4, button2);
    			append_dev(div4, t12);
    			append_dev(div4, button3);
    			append_dev(div4, t14);
    			append_dev(div4, button4);
    			append_dev(div4, t16);
    			append_dev(div4, button5);
    			append_dev(div5, t18);
    			if (if_block0) if_block0.m(div5, null);
    			append_dev(div7, t19);
    			append_dev(div7, div6);
    			if (if_block1) if_block1.m(div6, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[7]),
    					listen_dev(form, "submit", prevent_default(/*submit_handler*/ ctx[8]), false, true, false),
    					listen_dev(button1, "click", /*click_handler*/ ctx[9], false, false, false),
    					listen_dev(button2, "click", /*click_handler_1*/ ctx[10], false, false, false),
    					listen_dev(button3, "click", /*click_handler_2*/ ctx[11], false, false, false),
    					listen_dev(button4, "click", /*click_handler_3*/ ctx[12], false, false, false),
    					listen_dev(button5, "click", /*click_handler_4*/ ctx[13], false, false, false)
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

    			if (/*stations_downloaded*/ ctx[2].length) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*stations_downloaded*/ 4) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div5, null);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*stations_selected*/ ctx[1].length) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*stations_selected*/ 2) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div6, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div7);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
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
    	let search = "classic rock";
    	let m3u_list = [];
    	let stations_selected = [];
    	let stations_downloaded = [];

    	async function handleSubmit(name) {
    		$$invalidate(0, search = name);
    		const res = await fetch(fullUrl({ name, order: "votes", reverse: true }), { method: "GET" });
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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		search = this.value;
    		$$invalidate(0, search);
    	}

    	const submit_handler = () => handleSubmit(search);
    	const click_handler = () => handleSubmit("classic rock");
    	const click_handler_1 = () => handleSubmit("pop");
    	const click_handler_2 = () => handleSubmit("party");
    	const click_handler_3 = () => handleSubmit("disco");
    	const click_handler_4 = () => handleSubmit("disco polo");

    	$$self.$capture_state = () => ({
    		Station,
    		search_url,
    		m3u_header,
    		m3u_entry,
    		generate_playlist,
    		queryString,
    		fullUrl,
    		search,
    		m3u_list,
    		stations_selected,
    		stations_downloaded,
    		handleSubmit,
    		deleteItem,
    		addItem,
    		download_generator
    	});

    	$$self.$inject_state = $$props => {
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
    		input_input_handler,
    		submit_handler,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4
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
