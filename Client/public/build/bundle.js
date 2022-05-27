
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
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
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
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
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
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
        seen_callbacks.clear();
        set_current_component(saved_component);
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
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
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
        }
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
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
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
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
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
            mount_component(component, options.target, options.anchor, options.customElement);
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.48.0' }, detail), { bubbles: true }));
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

    /* src\CRUD.svelte generated by Svelte v3.48.0 */

    const file$1 = "src\\CRUD.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (42:4) {#each names as name}
    function create_each_block$1(ctx) {
    	let input;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "placeholder", /*name*/ ctx[6].split("_").map(func$1).join(" "));
    			attr_dev(input, "class", /*className*/ ctx[3]);
    			attr_dev(input, "type", "text");
    			add_location(input, file$1, 42, 8, 1278);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(42:4) {#each names as name}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let t0;
    	let button;
    	let mounted;
    	let dispose;
    	let each_value = /*names*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t0 = space();
    			button = element("button");
    			button.textContent = `${/*text*/ ctx[2]}`;
    			add_location(button, file$1, 53, 4, 1585);
    			add_location(div, file$1, 40, 0, 1236);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t0);
    			append_dev(div, button);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*names, className*/ 10) {
    				each_value = /*names*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, t0);
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
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function GetParams(func) {
    	let str = func.toString();
    	str = str.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/(.)*/g, "").replace(/{[\s\S]*}/, "").replace(/=>/g, "").trim();
    	let start = str.indexOf("(") + 1;
    	let end = str.length - 1;
    	let result = str.substring(start, end).split(", ");
    	let params = [];

    	result.forEach(element => {
    		element = element.replace(/=[\s\S]*/g, "").trim();
    		if (element.length > 0) params.push(element);
    	});

    	return params;
    }

    function Translate(str, dict) {
    	for (let word in dict) {
    		str = str.replaceAll(word, dict[word]);
    	}

    	return str;
    }

    const func$1 = function (n) {
    	return n.charAt(0).toUpperCase() + n.slice(1);
    };

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CRUD', slots, []);
    	let { hasuraFunction } = $$props;
    	let { hasuraName } = $$props;
    	let names = GetParams(hasuraFunction);

    	let text = Translate(hasuraName, {
    		"create": "Přidat",
    		"update": "Editovat",
    		"delete": "Odebrat",
    		"message": "Zprávu",
    		"group": "Skupinu",
    		"user": "Uživatele",
    		"post": "Příspěvek"
    	});

    	let className = hasuraName.replace(" ", "-");
    	const writable_props = ['hasuraFunction', 'hasuraName'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<CRUD> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		hasuraFunction(...[].slice.call(document.getElementsByClassName(className)).map(e => e.value));
    	};

    	$$self.$$set = $$props => {
    		if ('hasuraFunction' in $$props) $$invalidate(0, hasuraFunction = $$props.hasuraFunction);
    		if ('hasuraName' in $$props) $$invalidate(4, hasuraName = $$props.hasuraName);
    	};

    	$$self.$capture_state = () => ({
    		GetParams,
    		Translate,
    		hasuraFunction,
    		hasuraName,
    		names,
    		text,
    		className
    	});

    	$$self.$inject_state = $$props => {
    		if ('hasuraFunction' in $$props) $$invalidate(0, hasuraFunction = $$props.hasuraFunction);
    		if ('hasuraName' in $$props) $$invalidate(4, hasuraName = $$props.hasuraName);
    		if ('names' in $$props) $$invalidate(1, names = $$props.names);
    		if ('text' in $$props) $$invalidate(2, text = $$props.text);
    		if ('className' in $$props) $$invalidate(3, className = $$props.className);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [hasuraFunction, names, text, className, hasuraName, click_handler];
    }

    class CRUD extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { hasuraFunction: 0, hasuraName: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CRUD",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*hasuraFunction*/ ctx[0] === undefined && !('hasuraFunction' in props)) {
    			console.warn("<CRUD> was created without expected prop 'hasuraFunction'");
    		}

    		if (/*hasuraName*/ ctx[4] === undefined && !('hasuraName' in props)) {
    			console.warn("<CRUD> was created without expected prop 'hasuraName'");
    		}
    	}

    	get hasuraFunction() {
    		throw new Error("<CRUD>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hasuraFunction(value) {
    		throw new Error("<CRUD>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hasuraName() {
    		throw new Error("<CRUD>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hasuraName(value) {
    		throw new Error("<CRUD>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    class Hasura {
        static Execute(query, variables) {
            fetch(
                "https://praxe-forum.hasura.app/v1/graphql",
                {
                    method: 'POST',
                    headers: {
                        "Content-Type": "application/json",
                        "Hasura-Client-Name": "hasura-console",
                        "x-hasura-admin-secret": "j0kFhQGqGIGEkob641HrG6DIXij8tcHsQJmwZ0RmLpuvMJ7XlQjNJoHO6mtE2mp0"
                    },
                    body: JSON.stringify({
                        query,
                        variables
                    })
                }
            ).then(response => response.json()).then(data => console.log(data));
        }
        static all = "qwertzuiopasdfghjklyxcvbnmQWERTZUIOPASDFGHJKLYXCVBNM0123456789),.-(?!_*<>";
        static GetLoginKey() {
            let key = "";
            let a = this.all;
            let l = a.length-1;
            for (let i=0;i<31;i++) {
                key += a[Math.floor(Math.random()*l)];
            }
            return key;
        }
    }
    Hasura.Messages = {
        CreateMessage: function (content, post_id, user_id, reply_id = null) {
            if (reply_id == "") {
                reply_id = null;
            }
            Hasura.Execute(`
    mutation($content: String!, $post_id: Int!, $user_id: Int!, $reply_id: Int) {
        CreateMessage(content: $content, post_id: $post_id, user_id: $user_id, reply_id: $reply_id) {
            id
        }
    }
    `, {
                content,
                post_id,
                user_id,
                reply_id
            });
        },
        DeleteMessage: function (id) {
            Hasura.Execute(`
    mutation($id: Int!) {
        DeleteMessage(id: $id) {
            content
            created
            post_id
            replies
            reply_id
            user_id
        }
    }
    `, { id });
        },
        UpdateMessage: function (id, content) {
            if (content == "") return;
            Hasura.Execute(`
    mutation($id: Int!, $content: String!) {
        UpdateMessage(id: $id, content: $content) {
            created
            post_id
            replies
            reply_id
            user_id
        }
    }          
    `, { id, content });
        }
    };
    Hasura.Posts = {
        CreatePost: function (title, content, user_id, group_id) {
            Hasura.Execute(`
        mutation($title: String!, $content: String!, $user_id: Int!, $group_id: Int!) {
            CreatePost(title: $title, content: $content, user_id: $user_id, group_id: $group_id) {
                id
            }
        }
        `, { title, content, user_id, group_id });
        },
        DeletePost: function (id) {
            Hasura.Execute(`
        mutation($id: Int!) {
            DeletePost(id: $id) {
                user_id
                title
                message_count
                group_id
                created
                content
            }
        }          
        `, { id });
        },
        UpdatePost: function (id, title = null, content = null) {
            if ((title == null || title == "") && (content == null || content == "")) return;
            if (title == "") title = null;
            if (content == "") content = null;
            Hasura.Execute(`
        mutation($id: Int!, $content: String, $title: String) {
            UpdatePost(id: $id, content: $content, title: $title) {
              user_id
              message_count
              group_id
              created
            }
          }
        `, { id, title, content });
        }
    };
    Hasura.Groups = {
        CreateGroup: function (name, user_id, description = null) {
            Hasura.Execute(`
        mutation MyMutation($name: String!, $user_id: Int!, $description: String) {
            CreateGroup(name: $name, user_id: $user_id, description: $description) {
              id
            }
          }          
        `, { name, user_id, description });
        },
        DeleteGroup: function (id) {
            Hasura.Execute(`
        mutation MyMutation($id: Int!) {
            DeleteGroup(id: $id) {
              user_id
              posts
              name
              members
              description
              created
            }
          }          
        `, { id });
        },
        UpdateGroup: function (id, name = null, description = null, user_id = null) {
            if ((name == null || name == "") && (description == null || description == "") && (user_id == null || user_id == "")) return;
            if (name == "") name = null;
            if (description == "") description = null;
            if (user_id == "") user_id = null;
            Hasura.Execute(`
        mutation MyMutation($id: Int!, $name: String, $user_id: Int, $description: String) {
            UpdateGroup(id: $id, name: $name, user_id: $user_id, description: $description) {
              user_id
              posts
              name
              members
              id
              description
              created
            }
          }          
        `, { id, name, description, user_id });
        }
    };
    Hasura.Users = {
        CreateUser: function (first_name, last_name, username, email, password, bio = null) {
            if (bio == "") bio = null;
            Hasura.Execute(`
        mutation MyMutation($first_name: String!, $last_name: String!, $username: String!, $email: String!, $password: String!, $bio: String, $login_key: String) {
            CreateUser(email: $email, first_name: $first_name, last_name: $last_name, password: $password, username: $username, bio: $bio, login_key: $login_key) {
              id
            }
          }          
        `, { first_name, last_name, username, email, password, bio, "login_key": Hasura.GetLoginKey() });
        },
        DeleteUser: function (id) {
            Hasura.Execute(`
        mutation MyMutation($id: Int!) {
            DeleteUser(id: $id) {
              first_name
              last_name
              username
              email
              password
              bio
              login_key
              created
            }
          }          
        `, { id });
        },
        UpdateUser: function (id, first_name = null, last_name = null, username = null, email = null, password = null, bio = null) {
            if ((first_name == null || first_name == "") && (last_name == null || last_name == "") && (username == null || username == "") && (email == null || email == "") && (password == null || password == "") && (bio == null || bio == "")) return;
            if (first_name == "") first_name = null;
            if (last_name == "") last_name = null;
            if (username == "") username = null;
            if (email == "") email = null;
            if (password == "") password = null;
            if (bio == "") bio = null;
            Hasura.Execute(`
        mutation MyMutation($id: Int!, $first_name: String, $last_name: String, $username: String, $email: String, $password: String, $bio: String, $login_key: String) {
            UpdateUser(id: $id, first_name: $first_name, last_name: $last_name, username: $username, email: $email, password: $password, bio: $bio, login_key: $login_key) {
              first_name
              last_name
              username
              email
              password
              bio
              login_key
              created
            }
          }          
        `, { id, first_name, last_name, username, email, password, bio, "login_key": null });
        }
    };

    /* src\CRUDGroup.svelte generated by Svelte v3.48.0 */

    const { Object: Object_1 } = globals;

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i][0];
    	child_ctx[2] = list[i][1];
    	return child_ctx;
    }

    // (7:0) {#each Object.entries(Hasura[name]) as [funcName, func]}
    function create_each_block(ctx) {
    	let crud;
    	let current;

    	crud = new CRUD({
    			props: {
    				hasuraName: /*funcName*/ ctx[1].split(/(?=[A-Z])/).map(func).join(" "),
    				hasuraFunction: /*func*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(crud.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(crud, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const crud_changes = {};
    			if (dirty & /*name*/ 1) crud_changes.hasuraName = /*funcName*/ ctx[1].split(/(?=[A-Z])/).map(func).join(" ");
    			if (dirty & /*name*/ 1) crud_changes.hasuraFunction = /*func*/ ctx[2];
    			crud.$set(crud_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(crud.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(crud.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(crud, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(7:0) {#each Object.entries(Hasura[name]) as [funcName, func]}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = Object.entries(Hasura[/*name*/ ctx[0]]);
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
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*Object, Hasura, name*/ 1) {
    				each_value = Object.entries(Hasura[/*name*/ ctx[0]]);
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
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
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
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
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

    const func = e => e.toLowerCase();

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CRUDGroup', slots, []);
    	let { name } = $$props;
    	const writable_props = ['name'];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<CRUDGroup> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({ Crud: CRUD, Hasura, name });

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name];
    }

    class CRUDGroup extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { name: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CRUDGroup",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !('name' in props)) {
    			console.warn("<CRUDGroup> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<CRUDGroup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<CRUDGroup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.48.0 */
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let div;
    	let h30;
    	let t1;
    	let crudgroup0;
    	let t2;
    	let br0;
    	let t3;
    	let h31;
    	let t5;
    	let crudgroup1;
    	let t6;
    	let br1;
    	let t7;
    	let h32;
    	let t9;
    	let crudgroup2;
    	let t10;
    	let br2;
    	let t11;
    	let h33;
    	let t13;
    	let crudgroup3;
    	let current;
    	crudgroup0 = new CRUDGroup({ props: { name: "Users" }, $$inline: true });

    	crudgroup1 = new CRUDGroup({
    			props: { name: "Messages" },
    			$$inline: true
    		});

    	crudgroup2 = new CRUDGroup({ props: { name: "Posts" }, $$inline: true });

    	crudgroup3 = new CRUDGroup({
    			props: { name: "Groups" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			h30 = element("h3");
    			h30.textContent = "Uživatelé";
    			t1 = space();
    			create_component(crudgroup0.$$.fragment);
    			t2 = space();
    			br0 = element("br");
    			t3 = space();
    			h31 = element("h3");
    			h31.textContent = "Zprávy";
    			t5 = space();
    			create_component(crudgroup1.$$.fragment);
    			t6 = space();
    			br1 = element("br");
    			t7 = space();
    			h32 = element("h3");
    			h32.textContent = "Příspěvky";
    			t9 = space();
    			create_component(crudgroup2.$$.fragment);
    			t10 = space();
    			br2 = element("br");
    			t11 = space();
    			h33 = element("h3");
    			h33.textContent = "Skupiny";
    			t13 = space();
    			create_component(crudgroup3.$$.fragment);
    			add_location(h30, file, 6, 1, 73);
    			add_location(br0, file, 8, 1, 120);
    			add_location(h31, file, 9, 1, 126);
    			add_location(br1, file, 11, 1, 173);
    			add_location(h32, file, 12, 1, 179);
    			add_location(br2, file, 14, 1, 226);
    			add_location(h33, file, 15, 1, 232);
    			add_location(div, file, 5, 0, 66);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h30);
    			append_dev(div, t1);
    			mount_component(crudgroup0, div, null);
    			append_dev(div, t2);
    			append_dev(div, br0);
    			append_dev(div, t3);
    			append_dev(div, h31);
    			append_dev(div, t5);
    			mount_component(crudgroup1, div, null);
    			append_dev(div, t6);
    			append_dev(div, br1);
    			append_dev(div, t7);
    			append_dev(div, h32);
    			append_dev(div, t9);
    			mount_component(crudgroup2, div, null);
    			append_dev(div, t10);
    			append_dev(div, br2);
    			append_dev(div, t11);
    			append_dev(div, h33);
    			append_dev(div, t13);
    			mount_component(crudgroup3, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(crudgroup0.$$.fragment, local);
    			transition_in(crudgroup1.$$.fragment, local);
    			transition_in(crudgroup2.$$.fragment, local);
    			transition_in(crudgroup3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(crudgroup0.$$.fragment, local);
    			transition_out(crudgroup1.$$.fragment, local);
    			transition_out(crudgroup2.$$.fragment, local);
    			transition_out(crudgroup3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(crudgroup0);
    			destroy_component(crudgroup1);
    			destroy_component(crudgroup2);
    			destroy_component(crudgroup3);
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
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ CrudGroup: CRUDGroup });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
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

})();
//# sourceMappingURL=bundle.js.map
