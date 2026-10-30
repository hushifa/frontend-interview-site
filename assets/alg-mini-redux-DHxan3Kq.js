var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p><code>createStore(reducer)</code> 返回一个 store，里面用闭包存着当前的 <code>state</code> 和一组监听函数。<code>getState</code> 返回 state，<code>subscribe</code> 添加监听并返回取消函数，<code>dispatch(action)</code> 调用 <code>reducer(state, action)</code> 算出新 state，然后挨个通知监听函数。创建时它会先派发一个内部的初始化 action，让 reducer 返回默认值。</p>
<p><code>combineReducers({ count, user })</code> 把一个大 reducer 拆成几个小的：每个 key 只交给对应的 reducer 处理自己那一块 state。它还会比较每一块前后是不是同一个引用，全都没变就返回原来的 state 对象，这样订阅方用引用比较就能知道有没有更新。</p>
<p>中间件用来在 action 到达 reducer 之前做事情，比如打日志、处理函数形式的异步 action。每个中间件的形状是 <code>({ getState, dispatch }) =&gt; next =&gt; action</code>，<code>next</code> 是下一个中间件的 dispatch。<code>applyMiddleware</code> 用 <code>compose</code> 把它们一层层包在原始 <code>dispatch</code> 外面，返回一个 dispatch 被换掉的 store。</p>
<p>要注意，<code>compose(f, g, h)</code> 的执行顺序是 <code>f(g(h(x)))</code>，所以写在前面的中间件在最外层，最先拿到 action。另外 Redux 官方现在把 <code>createStore</code> 标为不推荐，建议用 Redux Toolkit 的 <code>configureStore</code>，但 <code>createStore</code> 不会被删除，手写它仍是理解 Redux 的好办法。</p>
</blockquote>
<h2>先写 compose 和 createStore</h2>
<p><code>compose</code> 把多个函数从右往左串起来，手写思路见<a href="/questions/alg-curry-compose/">《怎样手写函数柯里化和 compose？》</a>。这里直接用 Redux 源码里的写法。<code>createStore</code> 的第二个参数既可以是初始 state，也可以直接传增强器，所以开头要判断一下。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">compose</span>(<span class="hljs-params">...funcs</span>) {
  <span class="hljs-keyword">if</span> (funcs.<span class="hljs-property">length</span> === <span class="hljs-number">0</span>) <span class="hljs-keyword">return</span> <span class="hljs-function">(<span class="hljs-params">arg</span>) =&gt;</span> arg;
  <span class="hljs-keyword">return</span> funcs.<span class="hljs-title function_">reduce</span>(<span class="hljs-function">(<span class="hljs-params">a, b</span>) =&gt;</span> <span class="hljs-function">(<span class="hljs-params">...args</span>) =&gt;</span> <span class="hljs-title function_">a</span>(<span class="hljs-title function_">b</span>(...args)));
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">createStore</span>(<span class="hljs-params">reducer, preloadedState, enhancer</span>) {
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> preloadedState === <span class="hljs-string">&#x27;function&#x27;</span> &amp;&amp; enhancer === <span class="hljs-literal">undefined</span>) {
    enhancer = preloadedState;
    preloadedState = <span class="hljs-literal">undefined</span>;
  }
  <span class="hljs-keyword">if</span> (enhancer) <span class="hljs-keyword">return</span> <span class="hljs-title function_">enhancer</span>(createStore)(reducer, preloadedState);

  <span class="hljs-keyword">let</span> state = preloadedState;
  <span class="hljs-keyword">let</span> listeners = [];
  <span class="hljs-keyword">let</span> isDispatching = <span class="hljs-literal">false</span>;

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">getState</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">return</span> state;
  }

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">subscribe</span>(<span class="hljs-params">listener</span>) {
    listeners.<span class="hljs-title function_">push</span>(listener);
    <span class="hljs-keyword">return</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">unsubscribe</span>(<span class="hljs-params"></span>) {
      listeners = listeners.<span class="hljs-title function_">filter</span>(<span class="hljs-function">(<span class="hljs-params">item</span>) =&gt;</span> item !== listener);
    };
  }

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">dispatch</span>(<span class="hljs-params">action</span>) {
    <span class="hljs-keyword">if</span> (isDispatching) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;reducer 里不能 dispatch&#x27;</span>);
    <span class="hljs-keyword">try</span> {
      isDispatching = <span class="hljs-literal">true</span>;
      state = <span class="hljs-title function_">reducer</span>(state, action);
    } <span class="hljs-keyword">finally</span> {
      isDispatching = <span class="hljs-literal">false</span>;
    }
    <span class="hljs-comment">// 先拷贝一份，监听函数里订阅或退订只影响下一次 dispatch。</span>
    listeners.<span class="hljs-title function_">slice</span>().<span class="hljs-title function_">forEach</span>(<span class="hljs-function">(<span class="hljs-params">listener</span>) =&gt;</span> <span class="hljs-title function_">listener</span>());
    <span class="hljs-keyword">return</span> action;
  }

  <span class="hljs-comment">// 用一个不会被业务 reducer 处理的 action 拿到各个 reducer 的默认 state。</span>
  <span class="hljs-title function_">dispatch</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;@@mini-redux/INIT&#x27;</span> });
  <span class="hljs-keyword">return</span> { getState, subscribe, dispatch };
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">combineReducers</span>(<span class="hljs-params">reducers</span>) {
  <span class="hljs-keyword">const</span> keys = <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">keys</span>(reducers);
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">combination</span>(<span class="hljs-params">state = {}, action</span>) {
    <span class="hljs-keyword">let</span> hasChanged = <span class="hljs-literal">false</span>;
    <span class="hljs-keyword">const</span> nextState = {};
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> key <span class="hljs-keyword">of</span> keys) {
      <span class="hljs-keyword">const</span> previous = state[key];
      <span class="hljs-keyword">const</span> next = reducers[key](previous, action);
      nextState[key] = next;
      hasChanged = hasChanged || next !== previous;
    }
    <span class="hljs-keyword">return</span> hasChanged ? nextState : state;
  };
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">applyMiddleware</span>(<span class="hljs-params">...middlewares</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-function">(<span class="hljs-params">createStore</span>) =&gt;</span> <span class="hljs-function">(<span class="hljs-params">reducer, preloadedState</span>) =&gt;</span> {
    <span class="hljs-keyword">const</span> store = <span class="hljs-title function_">createStore</span>(reducer, preloadedState);
    <span class="hljs-keyword">let</span> <span class="hljs-title function_">dispatch</span> = (<span class="hljs-params"></span>) =&gt; {
      <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;构建中间件时不能 dispatch&#x27;</span>);
    };
    <span class="hljs-keyword">const</span> api = {
      <span class="hljs-attr">getState</span>: store.<span class="hljs-property">getState</span>,
      <span class="hljs-attr">dispatch</span>: <span class="hljs-function">(<span class="hljs-params">action</span>) =&gt;</span> <span class="hljs-title function_">dispatch</span>(action),
    };
    <span class="hljs-keyword">const</span> chain = middlewares.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">middleware</span>) =&gt;</span> <span class="hljs-title function_">middleware</span>(api));
    dispatch = <span class="hljs-title function_">compose</span>(...chain)(store.<span class="hljs-property">dispatch</span>);
    <span class="hljs-keyword">return</span> { ...store, dispatch };
  };
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">count</span>(<span class="hljs-params">state = <span class="hljs-number">0</span>, action</span>) {
  <span class="hljs-keyword">return</span> action.<span class="hljs-property">type</span> === <span class="hljs-string">&#x27;add&#x27;</span> ? state + <span class="hljs-number">1</span> : state;
}
<span class="hljs-keyword">function</span> <span class="hljs-title function_">user</span>(<span class="hljs-params">state = { name: <span class="hljs-string">&#x27;游客&#x27;</span> }, action</span>) {
  <span class="hljs-keyword">return</span> action.<span class="hljs-property">type</span> === <span class="hljs-string">&#x27;login&#x27;</span> ? { <span class="hljs-attr">name</span>: action.<span class="hljs-property">name</span> } : state;
}

<span class="hljs-keyword">const</span> logs = [];
<span class="hljs-keyword">const</span> <span class="hljs-title function_">logger</span> = (<span class="hljs-params"></span>) =&gt; <span class="hljs-function">(<span class="hljs-params">next</span>) =&gt;</span> <span class="hljs-function">(<span class="hljs-params">action</span>) =&gt;</span> {
  logs.<span class="hljs-title function_">push</span>(<span class="hljs-string">\`进入 <span class="hljs-subst">\${action.type ?? <span class="hljs-string">&#x27;函数&#x27;</span>}</span>\`</span>);
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">next</span>(action);
};
<span class="hljs-keyword">const</span> <span class="hljs-title function_">thunk</span> = (<span class="hljs-params">{ dispatch, getState }</span>) =&gt; <span class="hljs-function">(<span class="hljs-params">next</span>) =&gt;</span> <span class="hljs-function">(<span class="hljs-params">action</span>) =&gt;</span>
  <span class="hljs-keyword">typeof</span> action === <span class="hljs-string">&#x27;function&#x27;</span> ? <span class="hljs-title function_">action</span>(dispatch, getState) : <span class="hljs-title function_">next</span>(action);

<span class="hljs-keyword">const</span> store = <span class="hljs-title function_">createStore</span>(<span class="hljs-title function_">combineReducers</span>({ count, user }), <span class="hljs-title function_">applyMiddleware</span>(logger, thunk));
<span class="hljs-keyword">const</span> before = store.<span class="hljs-title function_">getState</span>();
store.<span class="hljs-title function_">dispatch</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;unknown&#x27;</span> });
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(store.<span class="hljs-title function_">getState</span>() === before ? <span class="hljs-string">&#x27;同一个对象&#x27;</span> : <span class="hljs-string">&#x27;新对象&#x27;</span>); <span class="hljs-comment">// 同一个对象</span>

store.<span class="hljs-title function_">subscribe</span>(<span class="hljs-function">() =&gt;</span> logs.<span class="hljs-title function_">push</span>(<span class="hljs-string">\`通知 <span class="hljs-subst">\${store.getState().count}</span>\`</span>));
store.<span class="hljs-title function_">dispatch</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;add&#x27;</span> });
store.<span class="hljs-title function_">dispatch</span>(<span class="hljs-function">(<span class="hljs-params">dispatch</span>) =&gt;</span> <span class="hljs-title function_">dispatch</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;login&#x27;</span>, <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;小明&#x27;</span> }));
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(store.<span class="hljs-title function_">getState</span>())); <span class="hljs-comment">// {&quot;count&quot;:1,&quot;user&quot;:{&quot;name&quot;:&quot;小明&quot;}}</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(logs.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27; | &#x27;</span>)); <span class="hljs-comment">// 进入 unknown | 进入 add | 通知 1 | 进入 函数 | 进入 login | 通知 1</span>
</code></pre></div>
<h2>createStore 里的几个细节</h2>
<p>为什么创建时要先 <code>dispatch</code> 一次？因为 state 一开始是 <code>undefined</code>，reducer 的默认参数 <code>state = 0</code> 这时才会生效。Redux 官方文档说，创建 store 时会派发一个内部的假 action 来填充初始 state，业务 reducer 不用处理它，只要在收到 <code>undefined</code> 时返回初始值就行。示例里 <code>count</code> 和 <code>user</code> 也是这样拿到 <code>0</code> 和 <code>{ name: &#x27;游客&#x27; }</code> 的。</p>
<p>为什么通知前要 <code>slice()</code> 一份？如果监听函数在执行时又调用了 <code>subscribe</code> 或取消订阅，直接遍历原数组会让这一轮的通知名单跟着变。先拷贝，这一轮通知的就是 dispatch 开始时的那批监听函数。Redux 源码里用的是另一种做法：维护当前和下一份两个监听列表，要修改时才复制，效果一样。</p>
<p><code>isDispatching</code> 是为了阻止在 reducer 里 dispatch。reducer 应该是纯函数，见<a href="/questions/state-redux/">《Redux 的单向数据流为什么强调 reducer 的纯粹性？》</a>，在里面再 dispatch 会让状态更新嵌套起来。Redux 源码遇到这种情况会抛出 “Reducers may not dispatch actions.”，在 reducer 执行期间调用 <code>getState</code> 和 <code>subscribe</code> 也会报错，示例只保留了 dispatch 这一条。</p>
<h2>combineReducers 为什么要比较引用</h2>
<p>示例里派发了一个谁都不处理的 <code>unknown</code>，<code>getState()</code> 前后是同一个对象。这是因为每个子 reducer 遇到不认识的 action 都原样返回自己那一块，<code>combination</code> 发现每一块都是原来的引用，就返回原来的 state，而不是新建一个内容相同的对象。Redux 源码也是这样判断的，此外它还会检查 key 的数量有没有变化。</p>
<p>这样做的好处是，订阅方用 <code>===</code> 就能判断状态有没有变化。React Redux 的 <code>useSelector</code> 默认也是用 <code>===</code> 比较前后两次选出来的值，来决定组件要不要重新渲染，没变化的分支保持原引用，选它的组件就不会白白重渲染。</p>
<p>官方的 <code>combineReducers</code> 还会做一些检查，比如用 <code>undefined</code> 调用每个 reducer，如果有 reducer 返回 <code>undefined</code> 就直接报错，提醒它必须返回初始值。示例为了突出主线，没有写这些检查。</p>
<h2>applyMiddleware 怎样把中间件串起来</h2>
<p><code>applyMiddleware</code> 本身是一个 store 增强器，官方文档写的签名是 <code>createStore =&gt; createStore</code>：拿到原来的 <code>createStore</code>，返回一个新的。新的 <code>createStore</code> 先正常创建 store，再把 <code>dispatch</code> 换掉。</p>
<p>换的过程分两步。第一步，把 <code>{ getState, dispatch }</code> 传给每个中间件，得到一组 <code>next =&gt; action =&gt; ...</code> 的函数。第二步，用 <code>compose</code> 把它们串起来，再传入原始的 <code>store.dispatch</code>。展开来就是 <code>logger(thunk(store.dispatch))</code>：<code>thunk</code> 拿到的 <code>next</code> 是原始 dispatch，<code>logger</code> 拿到的 <code>next</code> 是 <code>thunk</code> 包好的那层。所以 action 先进 <code>logger</code>，再进 <code>thunk</code>，最后才到 reducer。</p>
<p>日志里的顺序说明了这一点。派发函数时，先记下“进入 函数”，<code>thunk</code> 发现它是函数，就调用它，函数里又 <code>dispatch</code> 了一个 <code>login</code>，于是“进入 login”出现在后面。</p>
<p>为什么传给中间件的 <code>dispatch</code> 要写成 <code>(action) =&gt; dispatch(action)</code>，而不是直接传 <code>store.dispatch</code>？因为 <code>thunk</code> 里调用的 <code>dispatch</code> 应该是包好中间件以后的那个，这样函数里派发的 action 也会重新经过整条中间件链。写成箭头函数，调用时才去读变量 <code>dispatch</code>，这时它已经被替换成最终版本了。在替换之前，变量 <code>dispatch</code> 是一个会抛错的函数，Redux 源码的提示是 “Dispatching while constructing your middleware is not allowed”，因为这时其他中间件还没装好。</p>
<h2>常见追问</h2>
<p><strong>中间件和 store 增强器有什么区别？</strong></p>
<blockquote>
<p>中间件只包装 <code>dispatch</code>，官方说中间件能做的事，手动包装每次 <code>dispatch</code> 调用也能做到，只是放在一个地方更好管理。增强器能包装整个 <code>createStore</code>，可以改 <code>getState</code>、<code>subscribe</code> 等任何东西，<code>applyMiddleware</code> 本身就是一个增强器。官方也说，自己写增强器的情况很少，写中间件更简单。</p>
</blockquote>
<p><strong>多个增强器怎么一起用？</strong></p>
<blockquote>
<p>用 <code>compose</code> 把它们组合成一个增强器再传给 <code>createStore</code>。官方建议把 <code>applyMiddleware</code> 放在其他增强器前面，因为中间件可能是异步的，比如放在 DevTools 增强器之前，DevTools 才能看到 Promise 中间件之类发出的原始 action。</p>
</blockquote>`};export{e as default};