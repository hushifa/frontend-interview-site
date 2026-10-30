var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>收货表单里，城市列表和区县列表都要按参数请求接口，两段 <code>useEffect</code> 几乎一样。把这段逻辑抽成 <code>useData(url)</code>，组件里写 <code>const cities = useData(url)</code>，这就是自定义 Hook：一个名字以 <code>use</code> 加大写字母开头、内部调用了其他 Hook 的函数。</p>
<p>抽出来是为了复用有状态的逻辑，同时让数据流一目了然：传进去 <code>url</code>，拿回来 <code>data</code>，Effect 藏在 Hook 里面。它共享的是逻辑，不是状态，两个组件调用同一个 Hook，各有一份独立的状态。</p>
<p>设计时有几条规则。名字要说清用途，比如 <code>useData(url)</code>、<code>useInterval(callback, delay)</code>；函数里没调用任何 Hook，就别加 <code>use</code> 前缀。参数会随组件每次渲染传进来，Effect 用到的参数要写进依赖。有副作用就要清理：请求在清理函数里把过期结果丢掉，定时器在清理函数里清除。传进来的回调函数用 <code>useEffectEvent</code> 包起来，免得每次渲染都重建定时器或连接。</p>
<p>要注意，React 文档不建议写 <code>useMount</code> 这类只是包一层 <code>useEffect</code> 的“生命周期 Hook”，因为它不会随参数变化重新同步，lint 也检查不到。网上常见的 <code>usePrevious</code> 在渲染期间读 <code>ref.current</code>，也和文档的要求冲突，文档给的写法是在渲染时比较并更新 state。</p>
</blockquote>
<h2>什么样的函数算自定义 Hook</h2>
<p>React 文档给的命名规则是，组件名以大写字母开头，Hook 名以 <code>use</code> 加大写字母开头。这个前缀不只是约定，看到 <code>use</code> 开头的函数，读代码的人和 lint 工具就知道它里面可能有状态和 Effect，必须遵守 Hook 的调用规则，规则见<a href="/questions/react-hooks-rules/">《为什么 Hook 通常必须在组件顶层调用？》</a>。</p>
<p>反过来，函数里没有调用任何 Hook，就应该写成普通函数。文档举的例子是 <code>useSorted(items)</code> 只做了排序，应该改名 <code>getSorted</code>，这样它能在条件分支里调用。</p>
<p>自定义 Hook 里的代码在组件每次重新渲染时都会重新执行，所以它和组件一样要保持纯粹，可以看成组件函数体的一部分。也正因为每次渲染都会执行，它总能拿到最新的 props 和 state。</p>
<p>自定义 Hook 和高阶组件、Render Props 的取舍，见<a href="/questions/react-hoc-render-props/">《高阶组件、Render Props 和自定义 Hook 怎样选择？》</a>。</p>
<h2>useRequest：依赖和过期结果</h2>
<p>文档里的 <code>useData</code> 就是一个最小的请求 Hook。接收 <code>url</code>，返回数据，<code>url</code> 变了就重新请求：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">useData</span>(<span class="hljs-params">url</span>) {
  <span class="hljs-keyword">const</span> [data, setData] = <span class="hljs-title function_">useState</span>(<span class="hljs-literal">null</span>);
  <span class="hljs-title function_">useEffect</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-keyword">if</span> (url) {
      <span class="hljs-keyword">let</span> ignore = <span class="hljs-literal">false</span>;
      <span class="hljs-title function_">fetch</span>(url)
        .<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">response</span>) =&gt;</span> response.<span class="hljs-title function_">json</span>())
        .<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">json</span>) =&gt;</span> {
          <span class="hljs-keyword">if</span> (!ignore) {
            <span class="hljs-title function_">setData</span>(json);
          }
        });
      <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {
        ignore = <span class="hljs-literal">true</span>;
      };
    }
  }, [url]);
  <span class="hljs-keyword">return</span> data;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">ShippingForm</span>(<span class="hljs-params">{ country }</span>) {
  <span class="hljs-keyword">const</span> cities = <span class="hljs-title function_">useData</span>(<span class="hljs-string">\`/api/cities?country=<span class="hljs-subst">\${country}</span>\`</span>);
  <span class="hljs-keyword">const</span> [city, setCity] = <span class="hljs-title function_">useState</span>(<span class="hljs-literal">null</span>);
  <span class="hljs-keyword">const</span> areas = <span class="hljs-title function_">useData</span>(city ? <span class="hljs-string">\`/api/areas?city=<span class="hljs-subst">\${city}</span>\`</span> : <span class="hljs-literal">null</span>);
  <span class="hljs-comment">// ...</span>
}
</code></pre></div>
<p><code>url</code> 是从组件传进来的响应式值，Effect 里用到了它，所以要写进依赖数组。这样用户切换国家时，Hook 会自动重新请求。</p>
<p><code>ignore</code> 标志解决的是竞态。用户先选中国、马上又选美国，两个请求都发出去了，可能中国的请求后回来，把美国的结果覆盖掉。切换时 React 会先执行上一次 Effect 的清理函数，把那一次的 <code>ignore</code> 设为 <code>true</code>，旧请求回来也不会写进 state。下面用 Promise 模拟这个过程：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">createFetcher</span>(<span class="hljs-params">log</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">useDataEffect</span>(<span class="hljs-params">url, response</span>) {
    <span class="hljs-keyword">let</span> ignore = <span class="hljs-literal">false</span>;
    response.<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">data</span>) =&gt;</span> {
      <span class="hljs-keyword">if</span> (!ignore) {
        log.<span class="hljs-title function_">push</span>(url + <span class="hljs-string">&#x27; -&gt; &#x27;</span> + data);
      }
    });
    <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {
      ignore = <span class="hljs-literal">true</span>;
    };
  };
}

<span class="hljs-keyword">const</span> log = [];
<span class="hljs-keyword">const</span> runEffect = <span class="hljs-title function_">createFetcher</span>(log);

<span class="hljs-keyword">let</span> resolveSlow;
<span class="hljs-keyword">const</span> slow = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve</span>) =&gt;</span> {
  resolveSlow = resolve;
});
<span class="hljs-keyword">const</span> cleanupA = <span class="hljs-title function_">runEffect</span>(<span class="hljs-string">&#x27;/api/cities?country=cn&#x27;</span>, slow);
<span class="hljs-title function_">cleanupA</span>();
<span class="hljs-title function_">runEffect</span>(<span class="hljs-string">&#x27;/api/cities?country=us&#x27;</span>, <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>(<span class="hljs-string">&#x27;纽约&#x27;</span>));
<span class="hljs-title function_">resolveSlow</span>(<span class="hljs-string">&#x27;北京&#x27;</span>);

<span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>()
  .<span class="hljs-title function_">then</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>())
  .<span class="hljs-title function_">then</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(log.<span class="hljs-property">length</span>); <span class="hljs-comment">// 1</span>
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(log[<span class="hljs-number">0</span>]); <span class="hljs-comment">// /api/cities?country=us -&gt; 纽约</span>
  });
</code></pre></div>
<p>中国的请求最后才返回“北京”，可是它所在那次 Effect 已经被清理，<code>ignore</code> 是 <code>true</code>，结果被丢掉，记录里只剩美国的结果。</p>
<p>实际项目里的 <code>useRequest</code> 往往还要返回 <code>loading</code>、<code>error</code>，支持手动刷新。这些都可以在同一个结构上加 state，关键的两点不变：参数写进依赖，清理函数里处理过期结果。文档还提到，React 内置的数据请求写法还在完善中，把请求封装在 <code>useData</code> 这样的 Hook 里，以后迁移到官方推荐的写法时要改的地方更少。</p>
<h2>useInterval：清理定时器，回调不进依赖</h2>
<p>文档练习题里的 <code>useInterval</code> 最终写成这样：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">useInterval</span>(<span class="hljs-params">callback, delay</span>) {
  <span class="hljs-keyword">const</span> onTick = <span class="hljs-title function_">useEffectEvent</span>(callback);
  <span class="hljs-title function_">useEffect</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-keyword">const</span> id = <span class="hljs-built_in">setInterval</span>(onTick, delay);
    <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> <span class="hljs-built_in">clearInterval</span>(id);
  }, [delay]);
}
</code></pre></div>
<p>清理函数里的 <code>clearInterval</code> 保证组件卸载、或者 <code>delay</code> 变化重建定时器时，旧定时器不会继续跑。</p>
<p>读者可能会问，为什么不把 <code>callback</code> 也写进依赖？因为调用方通常写的是内联函数，<code>useInterval(() =&gt; setCount((c) =&gt; c + 1), 1000)</code>，每次渲染都是一个新函数。写进依赖，每次渲染都会清掉定时器重建，间隔就总被重置。<code>useEffectEvent</code> 返回的函数在 Effect 里调用时总是执行最新的 <code>callback</code>，又不需要写进依赖，所以只有 <code>delay</code> 变化才重建定时器。<code>useEffectEvent</code> 的用法和限制见<a href="/questions/react-use-effect-event/">《React useEffectEvent 适合解决什么依赖问题？》</a>。</p>
<h2>usePrevious：别在渲染时读 ref</h2>
<p>网上流行的 <code>usePrevious</code> 是这样写的：用一个 ref 存值，在 Effect 里更新 <code>ref.current</code>，渲染时返回 <code>ref.current</code>。可是 <code>useRef</code> 文档明确要求，除了初始化，渲染期间不要读写 <code>ref.current</code>，否则组件的行为难以预测。</p>
<p>文档在 <code>useState</code> 页面给了另一种做法，叫“保存上一次渲染的信息”：用一个 state 记住上一次的值，渲染时发现不一样就更新它。</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">usePrevious</span>(<span class="hljs-params">value</span>) {
  <span class="hljs-keyword">const</span> [current, setCurrent] = <span class="hljs-title function_">useState</span>(value);
  <span class="hljs-keyword">const</span> [previous, setPrevious] = <span class="hljs-title function_">useState</span>(<span class="hljs-literal">undefined</span>);
  <span class="hljs-keyword">if</span> (value !== current) {
    <span class="hljs-title function_">setPrevious</span>(current);
    <span class="hljs-title function_">setCurrent</span>(value);
  }
  <span class="hljs-keyword">return</span> previous;
}
</code></pre></div>
<p>在渲染期间调用 <code>set</code> 函数，React 会丢弃这次输出，立即用新 state 重新渲染。文档对这种写法有几个要求：<code>set</code> 调用必须放在 <code>value !== current</code> 这样的条件里，否则会无限循环；只能更新正在渲染的组件自己的 state。文档也说这种写法很少需要、不好理解，一般尽量避免，只是比在 Effect 里更新 state 要好。</p>
<h2>不要写 useMount 这类 Hook</h2>
<p>有人会把 <code>useEffect(fn, [])</code> 包成 <code>useMount(fn)</code>。文档不推荐这样做。比如 <code>useMount(() =&gt; connect(roomId))</code>，<code>roomId</code> 变了它不会重新连接，这是个 bug，可是 lint 只检查直接写出来的 <code>useEffect</code>，查不到 <code>useMount</code> 里面。</p>
<p>所以自定义 Hook 应该对应一个具体的用途，比如 <code>useChatRoom(options)</code>、<code>useOnlineStatus()</code>，而不是给 <code>useEffect</code> 换个名字。文档还给了一个判断方法：如果很难给 Hook 起一个清楚的名字，说明这段 Effect 和组件其他逻辑耦合得太紧，还不适合抽出来。</p>
<h2>常见追问</h2>
<p><strong>两个组件调用同一个自定义 Hook，状态是共享的吗？</strong></p>
<blockquote>
<p>不是。每次调用 Hook，里面的 <code>useState</code> 都是独立的一份，和直接在两个组件里各写一遍效果一样。想让多个组件共享同一份状态，要把状态提升到共同的父组件，或者用 Context、外部 store。</p>
</blockquote>
<p><strong>自定义 Hook 里能调用另一个自定义 Hook 吗？</strong></p>
<blockquote>
<p>可以。比如 <code>useCounter</code> 里调用 <code>useInterval</code>。一个 Hook 返回的值传给另一个 Hook，每次渲染都会传最新的值，像链条一样串起来。</p>
</blockquote>
<p><strong>为什么自定义 Hook 收到的回调要用 useEffectEvent 包？</strong></p>
<blockquote>
<p>因为调用方传的回调通常每次渲染都是新函数，直接写进 Effect 依赖，Effect 就会每次渲染都重新执行，比如聊天室每次渲染都断线重连。用 <code>useEffectEvent</code> 包起来以后，Effect 里调用的始终是最新的回调，但它不算依赖，Effect 只在真正的依赖变化时重新同步。</p>
</blockquote>`};export{e as default};