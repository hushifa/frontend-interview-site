var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>React 每渲染一次，就把组件函数重新执行一遍。这一遍里定义的函数，通过闭包记住的是这一遍的 props 和 state。</p>
<p>如果这个函数被长期保存下来，比如 <code>setInterval</code> 回调、事件订阅，或者 <code>useCallback</code>、<code>useEffect</code> 的依赖没写全，那之后不管过多久调用它，读到的都是它创建那一次的值。这就叫过期闭包。</p>
<p>怎么改要看你想要什么。只是根据旧值算新值，用函数式更新 <code>setCount(c =&gt; c + 1)</code>，回调根本不用读 <code>count</code>。值变了确实应该重新同步，就把它补进依赖数组。想读最新值、又不想因为它重新订阅，用 <code>useEffectEvent</code>，它从 React 19.2 起稳定。不在 Effect 里的场景，也可以用 ref 保存最新值。</p>
<p>最不该做的是为了少执行几次就删依赖，那只是把过期闭包藏了起来。</p>
</blockquote>
<h2>先看一个停住的计时器</h2>
<p>下面的计时器想每秒加 1，结果数字到 1 就不动了：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">Timer</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> [count, setCount] = <span class="hljs-title function_">useState</span>(<span class="hljs-number">0</span>);

  <span class="hljs-title function_">useEffect</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-keyword">const</span> id = <span class="hljs-built_in">setInterval</span>(<span class="hljs-function">() =&gt;</span> {
      <span class="hljs-title function_">setCount</span>(count + <span class="hljs-number">1</span>); <span class="hljs-comment">// count 永远是 0</span>
    }, <span class="hljs-number">1000</span>);
    <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> <span class="hljs-built_in">clearInterval</span>(id);
  }, []); <span class="hljs-comment">// 缺少 count 依赖</span>

  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">span</span>&gt;</span>{count}<span class="hljs-tag">&lt;/<span class="hljs-name">span</span>&gt;</span></span>;
}
</code></pre></div>
<p>依赖数组是 <code>[]</code>，Effect 只在挂载时跑一次，定时器回调也只在那时创建了一次。创建它的那次渲染里 <code>count</code> 是 0，它就一直记着这个 0。</p>
<p>之后组件确实重新渲染了，也有了值为 1 的新 <code>count</code>，可是那是另一次渲染里的另一个变量，旧回调看不到。所以它每秒执行的都是 <code>setCount(0 + 1)</code>。闭包的原理可以看<a href="/questions/js-closure/">《什么是闭包？它有哪些实际应用？》</a>。</p>
<h2>三种改法</h2>
<p>如果只是想基于旧值加 1，函数式更新最合适。回调不读外面的 <code>count</code>，由 React 把最新值传进来：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-title function_">useEffect</span>(<span class="hljs-function">() =&gt;</span> {
  <span class="hljs-keyword">const</span> id = <span class="hljs-built_in">setInterval</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">setCount</span>(<span class="hljs-function">(<span class="hljs-params">c</span>) =&gt;</span> c + <span class="hljs-number">1</span>), <span class="hljs-number">1000</span>);
  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> <span class="hljs-built_in">clearInterval</span>(id);
}, []);
</code></pre></div>
<p>也可以老老实实补上依赖。这样每次 <code>count</code> 变化，Effect 都会清掉旧定时器、用新的 <code>count</code> 建一个新的。能用，但定时器反复重建：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-title function_">useEffect</span>(<span class="hljs-function">() =&gt;</span> {
  <span class="hljs-keyword">const</span> id = <span class="hljs-built_in">setInterval</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">setCount</span>(count + <span class="hljs-number">1</span>), <span class="hljs-number">1000</span>);
  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> <span class="hljs-built_in">clearInterval</span>(id);
}, [count]);
</code></pre></div>
<p>第三种场景是：回调要读某个值的最新版本，但这个值变了不应该重建定时器。这时用 <code>useEffectEvent</code>：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { useEffect, useEffectEvent } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">Ticker</span>(<span class="hljs-params">{ step }</span>) {
  <span class="hljs-keyword">const</span> [count, setCount] = <span class="hljs-title function_">useState</span>(<span class="hljs-number">0</span>);
  <span class="hljs-keyword">const</span> onTick = <span class="hljs-title function_">useEffectEvent</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">setCount</span>(<span class="hljs-function">(<span class="hljs-params">c</span>) =&gt;</span> c + step));

  <span class="hljs-title function_">useEffect</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-keyword">const</span> id = <span class="hljs-built_in">setInterval</span>(onTick, <span class="hljs-number">1000</span>);
    <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> <span class="hljs-built_in">clearInterval</span>(id);
  }, []);
  <span class="hljs-comment">// 修改 step 时不重建计时器，下一次 tick 使用新的 step</span>
}
</code></pre></div>
<p><code>onTick</code> 每次被调用时都能读到最新的 <code>step</code>，而且它不用写进依赖数组，所以改 <code>step</code> 不会重建定时器。</p>
<h2>不在 Effect 里时用 ref</h2>
<p>有些回调是交给第三方库、只注册一次的，这时可以用 ref 存最新值：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">const</span> latestQuery = <span class="hljs-title function_">useRef</span>(query);
<span class="hljs-title function_">useEffect</span>(<span class="hljs-function">() =&gt;</span> {
  latestQuery.<span class="hljs-property">current</span> = query;
});

<span class="hljs-title function_">useEffect</span>(<span class="hljs-function">() =&gt;</span> {
  <span class="hljs-keyword">return</span> editor.<span class="hljs-title function_">on</span>(<span class="hljs-string">&#x27;save&#x27;</span>, <span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">submit</span>(latestQuery.<span class="hljs-property">current</span>));
}, [editor]);
</code></pre></div>
<p>ref 是同一个对象，每次渲染后 Effect 都把最新的 <code>query</code> 写进 <code>current</code>。回调读的是 <code>latestQuery.current</code>，不是某一次渲染的 <code>query</code>，所以总是新的。注意要在 Effect 里更新 ref，不要在渲染期间写 <code>ref.current</code>。</p>
<h2>为什么不能靠删依赖来解决</h2>
<p>删掉依赖，Effect 确实少执行了，可它里面用到的值就再也不会更新，过期闭包从明面上的警告变成了藏起来的 bug。打开 <code>eslint-plugin-react-hooks</code> 的 <code>exhaustive-deps</code> 规则，让工具检查依赖是否写全。</p>
<h2>常见追问</h2>
<p><strong>事件处理器会有过期闭包吗？</strong></p>
<blockquote>
<p>一般不会，因为每次渲染都会给按钮传一个新的处理器。但异步处理器在 <code>await</code> 之后读到的，仍然是点击那一次渲染的值。这是快照语义，通常正是你想要的。</p>
</blockquote>
<p><strong>state 快照的规则在哪里讲？</strong></p>
<blockquote>
<p>详见<a href="/questions/react-state/">《为什么调用 setState 后，当前变量还是旧值？》</a>。</p>
</blockquote>`};export{e as default};