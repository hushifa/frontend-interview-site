var e={answerHtml:`<h2>简答</h2>
<ul>
<li>组件函数每次渲染都重新执行，其中定义的函数通过闭包捕获这一轮的 props 和 state。</li>
<li>函数被长期保存后（例如 <code>setInterval</code> 回调、事件订阅、<code>useCallback</code> 依赖不完整），后续调用读到的是它创建那一轮的值，这就是过期闭包。</li>
<li>只需要基于前值计算新状态时，用函数式更新 <code>setCount(c =&gt; c + 1)</code>，回调不必读 <code>count</code>。</li>
<li>需要读到最新值并且值变化时应重新同步，把它补进依赖数组。</li>
<li>需要读最新值但不想因它重新订阅，用 <code>useEffectEvent</code>（React 19.2 起稳定）；在事件之外保存最新值也可以用 ref。</li>
</ul>
<h2>典型问题</h2>
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
<p>Effect 只在挂载时执行一次，回调捕获的 <code>count</code> 是 0，所以显示停在 1。</p>
<h2>三种修复</h2>
<p>函数式更新，最适合这个场景：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-title function_">useEffect</span>(<span class="hljs-function">() =&gt;</span> {
  <span class="hljs-keyword">const</span> id = <span class="hljs-built_in">setInterval</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">setCount</span>(<span class="hljs-function">(<span class="hljs-params">c</span>) =&gt;</span> c + <span class="hljs-number">1</span>), <span class="hljs-number">1000</span>);
  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> <span class="hljs-built_in">clearInterval</span>(id);
}, []);
</code></pre></div>
<p>补全依赖，代价是每次 <code>count</code> 变化都会重建计时器：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-title function_">useEffect</span>(<span class="hljs-function">() =&gt;</span> {
  <span class="hljs-keyword">const</span> id = <span class="hljs-built_in">setInterval</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">setCount</span>(count + <span class="hljs-number">1</span>), <span class="hljs-number">1000</span>);
  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> <span class="hljs-built_in">clearInterval</span>(id);
}, [count]);
</code></pre></div>
<p><code>useEffectEvent</code>，用于读取不该触发重新同步的值：</p>
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
<h2>用 ref 保存最新值</h2>
<p>不在 Effect 中的场景，例如传给第三方库、只注册一次的回调：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">const</span> latestQuery = <span class="hljs-title function_">useRef</span>(query);
<span class="hljs-title function_">useEffect</span>(<span class="hljs-function">() =&gt;</span> {
  latestQuery.<span class="hljs-property">current</span> = query;
});

<span class="hljs-title function_">useEffect</span>(<span class="hljs-function">() =&gt;</span> {
  <span class="hljs-keyword">return</span> editor.<span class="hljs-title function_">on</span>(<span class="hljs-string">&#x27;save&#x27;</span>, <span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">submit</span>(latestQuery.<span class="hljs-property">current</span>));
}, [editor]);
</code></pre></div>
<p>ref 在 Effect 中更新，不要在渲染期间写 <code>ref.current</code>。</p>
<h2>不要用删依赖来&quot;修复&quot;</h2>
<p>为了让 Effect 少执行而删掉依赖，会把过期闭包变成隐藏 bug。开启 <code>eslint-plugin-react-hooks</code> 的 <code>exhaustive-deps</code> 规则，让工具检查依赖是否完整。</p>
<h2>常见追问</h2>
<ul>
<li>事件处理器会有过期闭包吗？一般不会，每次渲染都会传入新的处理器。异步处理器在 <code>await</code> 之后读到的仍是点击时那一轮的值，这是快照语义，通常正是想要的。</li>
<li>详细的快照规则见《为什么调用 setState 后，当前变量还是旧值？》。</li>
</ul>`};export{e as default};