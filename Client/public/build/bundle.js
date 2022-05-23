
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
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
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
    }
    Hasura.Messages = function() {
    };
    Hasura.Messages.CreateMessage = function(content, post_id, user_id, reply_id = null) {
        Hasura.Execute(`
    mutation($content: String!, $post_id: Int!, $user_id: Int!, $reply_id: Int = null) {
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
    };
    Hasura.Messages.DeleteMessage = function(id) {
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
    };
    Hasura.Messages.UpdateMessage = function(id, content) {
        Hasura.Execute(`
    mutation MyMutation($id: Int!, $content: String!) {
        UpdateMessage(id: $id, content: $content) {
            created
            post_id
            replies
            reply_id
            user_id
        }
    }          
    `, { id, content });
    };
    Hasura.Users = function() {
    };
    Hasura.Users.CreateUser = function() {
        Hasura.Execute(`
    
    `);
    };
    Hasura.Users.DeleteUser = function() {

    };
    Hasura.Users.UpdateUser = function() {

    };

    /* src\App.svelte generated by Svelte v3.48.0 */
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let div16;
    	let div3;
    	let div0;
    	let input0;
    	let t0;
    	let button0;
    	let t2;
    	let div1;
    	let input1;
    	let t3;
    	let button1;
    	let t5;
    	let div2;
    	let input2;
    	let t6;
    	let input3;
    	let t7;
    	let button2;
    	let t9;
    	let div7;
    	let div4;
    	let input4;
    	let t10;
    	let button3;
    	let t12;
    	let div5;
    	let input5;
    	let t13;
    	let button4;
    	let t15;
    	let div6;
    	let input6;
    	let t16;
    	let input7;
    	let t17;
    	let button5;
    	let t19;
    	let div11;
    	let div8;
    	let input8;
    	let t20;
    	let button6;
    	let t22;
    	let div9;
    	let input9;
    	let t23;
    	let button7;
    	let t25;
    	let div10;
    	let input10;
    	let t26;
    	let input11;
    	let t27;
    	let button8;
    	let t29;
    	let div15;
    	let div12;
    	let input12;
    	let t30;
    	let button9;
    	let t32;
    	let div13;
    	let input13;
    	let t33;
    	let button10;
    	let t35;
    	let div14;
    	let input14;
    	let t36;
    	let input15;
    	let t37;
    	let button11;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div16 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			input0 = element("input");
    			t0 = space();
    			button0 = element("button");
    			button0.textContent = "Poslat zprávu";
    			t2 = space();
    			div1 = element("div");
    			input1 = element("input");
    			t3 = space();
    			button1 = element("button");
    			button1.textContent = "Odebrat zprávu";
    			t5 = space();
    			div2 = element("div");
    			input2 = element("input");
    			t6 = space();
    			input3 = element("input");
    			t7 = space();
    			button2 = element("button");
    			button2.textContent = "Editovat zprávu";
    			t9 = space();
    			div7 = element("div");
    			div4 = element("div");
    			input4 = element("input");
    			t10 = space();
    			button3 = element("button");
    			button3.textContent = "Přidat příspěvek";
    			t12 = space();
    			div5 = element("div");
    			input5 = element("input");
    			t13 = space();
    			button4 = element("button");
    			button4.textContent = "Odebrat příspěvek";
    			t15 = space();
    			div6 = element("div");
    			input6 = element("input");
    			t16 = space();
    			input7 = element("input");
    			t17 = space();
    			button5 = element("button");
    			button5.textContent = "Editovat příspěvek";
    			t19 = space();
    			div11 = element("div");
    			div8 = element("div");
    			input8 = element("input");
    			t20 = space();
    			button6 = element("button");
    			button6.textContent = "Přidat skupinu";
    			t22 = space();
    			div9 = element("div");
    			input9 = element("input");
    			t23 = space();
    			button7 = element("button");
    			button7.textContent = "Odebrat skupinu";
    			t25 = space();
    			div10 = element("div");
    			input10 = element("input");
    			t26 = space();
    			input11 = element("input");
    			t27 = space();
    			button8 = element("button");
    			button8.textContent = "Editovat skupinu";
    			t29 = space();
    			div15 = element("div");
    			div12 = element("div");
    			input12 = element("input");
    			t30 = space();
    			button9 = element("button");
    			button9.textContent = "Přidat účet";
    			t32 = space();
    			div13 = element("div");
    			input13 = element("input");
    			t33 = space();
    			button10 = element("button");
    			button10.textContent = "Odebrat účet";
    			t35 = space();
    			div14 = element("div");
    			input14 = element("input");
    			t36 = space();
    			input15 = element("input");
    			t37 = space();
    			button11 = element("button");
    			button11.textContent = "Editovat účet";
    			attr_dev(input0, "placeholder", "Content");
    			attr_dev(input0, "id", "content");
    			attr_dev(input0, "type", "text");
    			add_location(input0, file, 7, 3, 80);
    			add_location(button0, file, 8, 3, 140);
    			add_location(div0, file, 6, 2, 71);
    			attr_dev(input1, "placeholder", "Id");
    			attr_dev(input1, "id", "id");
    			attr_dev(input1, "type", "text");
    			add_location(input1, file, 21, 3, 342);
    			add_location(button1, file, 22, 3, 392);
    			add_location(div1, file, 20, 2, 333);
    			attr_dev(input2, "placeholder", "Id");
    			attr_dev(input2, "id", "id-edit");
    			attr_dev(input2, "type", "text");
    			add_location(input2, file, 31, 3, 559);
    			attr_dev(input3, "placeholder", "Content");
    			attr_dev(input3, "id", "content-edit");
    			attr_dev(input3, "type", "text");
    			add_location(input3, file, 32, 3, 614);
    			add_location(button2, file, 33, 3, 679);
    			add_location(div2, file, 30, 2, 550);
    			add_location(div3, file, 5, 1, 63);
    			attr_dev(input4, "placeholder", "Content");
    			attr_dev(input4, "id", "content");
    			attr_dev(input4, "type", "text");
    			add_location(input4, file, 47, 3, 933);
    			add_location(button3, file, 48, 3, 993);
    			add_location(div4, file, 46, 2, 924);
    			attr_dev(input5, "placeholder", "Id");
    			attr_dev(input5, "id", "id");
    			attr_dev(input5, "type", "text");
    			add_location(input5, file, 61, 3, 1189);
    			add_location(button4, file, 62, 3, 1239);
    			add_location(div5, file, 60, 2, 1180);
    			attr_dev(input6, "placeholder", "Id");
    			attr_dev(input6, "id", "id-edit");
    			attr_dev(input6, "type", "text");
    			add_location(input6, file, 71, 3, 1400);
    			attr_dev(input7, "placeholder", "Content");
    			attr_dev(input7, "id", "content-edit");
    			attr_dev(input7, "type", "text");
    			add_location(input7, file, 72, 3, 1455);
    			add_location(button5, file, 73, 3, 1520);
    			add_location(div6, file, 70, 2, 1391);
    			add_location(div7, file, 45, 1, 916);
    			attr_dev(input8, "placeholder", "Content");
    			attr_dev(input8, "id", "content");
    			attr_dev(input8, "type", "text");
    			add_location(input8, file, 87, 3, 1766);
    			add_location(button6, file, 88, 3, 1826);
    			add_location(div8, file, 86, 2, 1757);
    			attr_dev(input9, "placeholder", "Id");
    			attr_dev(input9, "id", "id");
    			attr_dev(input9, "type", "text");
    			add_location(input9, file, 101, 3, 2020);
    			add_location(button7, file, 102, 3, 2070);
    			add_location(div9, file, 100, 2, 2011);
    			attr_dev(input10, "placeholder", "Id");
    			attr_dev(input10, "id", "id-edit");
    			attr_dev(input10, "type", "text");
    			add_location(input10, file, 111, 3, 2229);
    			attr_dev(input11, "placeholder", "Content");
    			attr_dev(input11, "id", "content-edit");
    			attr_dev(input11, "type", "text");
    			add_location(input11, file, 112, 3, 2284);
    			add_location(button8, file, 113, 3, 2349);
    			add_location(div10, file, 110, 2, 2220);
    			add_location(div11, file, 85, 1, 1749);
    			attr_dev(input12, "placeholder", "Content");
    			attr_dev(input12, "id", "content");
    			attr_dev(input12, "type", "text");
    			add_location(input12, file, 127, 3, 2593);
    			add_location(button9, file, 128, 3, 2653);
    			add_location(div12, file, 126, 2, 2584);
    			attr_dev(input13, "placeholder", "Id");
    			attr_dev(input13, "id", "id");
    			attr_dev(input13, "type", "text");
    			add_location(input13, file, 141, 3, 2844);
    			add_location(button10, file, 142, 3, 2894);
    			add_location(div13, file, 140, 2, 2835);
    			attr_dev(input14, "placeholder", "Id");
    			attr_dev(input14, "id", "id-edit");
    			attr_dev(input14, "type", "text");
    			add_location(input14, file, 151, 3, 3050);
    			attr_dev(input15, "placeholder", "Content");
    			attr_dev(input15, "id", "content-edit");
    			attr_dev(input15, "type", "text");
    			add_location(input15, file, 152, 3, 3105);
    			add_location(button11, file, 153, 3, 3170);
    			add_location(div14, file, 150, 2, 3041);
    			add_location(div15, file, 125, 1, 2576);
    			add_location(div16, file, 4, 0, 56);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div16, anchor);
    			append_dev(div16, div3);
    			append_dev(div3, div0);
    			append_dev(div0, input0);
    			append_dev(div0, t0);
    			append_dev(div0, button0);
    			append_dev(div3, t2);
    			append_dev(div3, div1);
    			append_dev(div1, input1);
    			append_dev(div1, t3);
    			append_dev(div1, button1);
    			append_dev(div3, t5);
    			append_dev(div3, div2);
    			append_dev(div2, input2);
    			append_dev(div2, t6);
    			append_dev(div2, input3);
    			append_dev(div2, t7);
    			append_dev(div2, button2);
    			append_dev(div16, t9);
    			append_dev(div16, div7);
    			append_dev(div7, div4);
    			append_dev(div4, input4);
    			append_dev(div4, t10);
    			append_dev(div4, button3);
    			append_dev(div7, t12);
    			append_dev(div7, div5);
    			append_dev(div5, input5);
    			append_dev(div5, t13);
    			append_dev(div5, button4);
    			append_dev(div7, t15);
    			append_dev(div7, div6);
    			append_dev(div6, input6);
    			append_dev(div6, t16);
    			append_dev(div6, input7);
    			append_dev(div6, t17);
    			append_dev(div6, button5);
    			append_dev(div16, t19);
    			append_dev(div16, div11);
    			append_dev(div11, div8);
    			append_dev(div8, input8);
    			append_dev(div8, t20);
    			append_dev(div8, button6);
    			append_dev(div11, t22);
    			append_dev(div11, div9);
    			append_dev(div9, input9);
    			append_dev(div9, t23);
    			append_dev(div9, button7);
    			append_dev(div11, t25);
    			append_dev(div11, div10);
    			append_dev(div10, input10);
    			append_dev(div10, t26);
    			append_dev(div10, input11);
    			append_dev(div10, t27);
    			append_dev(div10, button8);
    			append_dev(div16, t29);
    			append_dev(div16, div15);
    			append_dev(div15, div12);
    			append_dev(div12, input12);
    			append_dev(div12, t30);
    			append_dev(div12, button9);
    			append_dev(div15, t32);
    			append_dev(div15, div13);
    			append_dev(div13, input13);
    			append_dev(div13, t33);
    			append_dev(div13, button10);
    			append_dev(div15, t35);
    			append_dev(div15, div14);
    			append_dev(div14, input14);
    			append_dev(div14, t36);
    			append_dev(div14, input15);
    			append_dev(div14, t37);
    			append_dev(div14, button11);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[0], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[1], false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[2], false, false, false),
    					listen_dev(button3, "click", /*click_handler_3*/ ctx[3], false, false, false),
    					listen_dev(button4, "click", /*click_handler_4*/ ctx[4], false, false, false),
    					listen_dev(button5, "click", /*click_handler_5*/ ctx[5], false, false, false),
    					listen_dev(button6, "click", /*click_handler_6*/ ctx[6], false, false, false),
    					listen_dev(button7, "click", /*click_handler_7*/ ctx[7], false, false, false),
    					listen_dev(button8, "click", /*click_handler_8*/ ctx[8], false, false, false),
    					listen_dev(button9, "click", /*click_handler_9*/ ctx[9], false, false, false),
    					listen_dev(button10, "click", /*click_handler_10*/ ctx[10], false, false, false),
    					listen_dev(button11, "click", /*click_handler_11*/ ctx[11], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div16);
    			mounted = false;
    			run_all(dispose);
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

    	const click_handler = () => {
    		Hasura.Messages.CreateMessage(document.getElementById("content").value, 4, 3);
    	};

    	const click_handler_1 = () => {
    		Hasura.Messages.DeleteMessage(document.getElementById("id").value);
    	};

    	const click_handler_2 = () => {
    		Hasura.Messages.UpdateMessage(document.getElementById("id-edit").value, document.getElementById("content-edit").value);
    	};

    	const click_handler_3 = () => {
    		Hasura.CreateMessage(document.getElementById("content").value, 4, 3);
    	};

    	const click_handler_4 = () => {
    		Hasura.DeleteMessage(document.getElementById("id").value);
    	};

    	const click_handler_5 = () => {
    		Hasura.EditMessage(document.getElementById("id-edit").value, document.getElementById("content-edit").value);
    	};

    	const click_handler_6 = () => {
    		Hasura.CreateMessage(document.getElementById("content").value, 4, 3);
    	};

    	const click_handler_7 = () => {
    		Hasura.DeleteMessage(document.getElementById("id").value);
    	};

    	const click_handler_8 = () => {
    		Hasura.EditMessage(document.getElementById("id-edit").value, document.getElementById("content-edit").value);
    	};

    	const click_handler_9 = () => {
    		Hasura.CreateMessage(document.getElementById("content").value, 4, 3);
    	};

    	const click_handler_10 = () => {
    		Hasura.DeleteMessage(document.getElementById("id").value);
    	};

    	const click_handler_11 = () => {
    		Hasura.EditMessage(document.getElementById("id-edit").value, document.getElementById("content-edit").value);
    	};

    	$$self.$capture_state = () => ({ Hasura });

    	return [
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6,
    		click_handler_7,
    		click_handler_8,
    		click_handler_9,
    		click_handler_10,
    		click_handler_11
    	];
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
