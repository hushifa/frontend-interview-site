var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>signal(initial)</code> 创建可写 Signal，<code>count()</code> 读取，<code>count.set(v)</code> 或 <code>count.update(fn)</code> 修改。</li>
<li><code>computed(() =&gt; ...)</code> 是只读的派生 Signal：第一次读取时才计算，结果被缓存，依赖变化后下次读取才重新计算。</li>
<li>依赖按实际执行路径收集：条件分支没有读取的 Signal 不会成为依赖。</li>
<li><code>effect()</code> 在依赖变化后执行副作用，用于同步到 localStorage、日志、第三方库，不要用它来同步另一个 Signal。</li>
<li>Signal 用 <code>Object.is</code> 判断是否变化，直接修改对象内部属性不会通知；要用 <code>update</code> 返回新对象。</li>
</ul>
<h2>基本用法</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">import</span> { <span class="hljs-title class_">Component</span>, computed, signal } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@angular/core&#x27;</span>;

<span class="hljs-meta">@Component</span>({
  <span class="hljs-attr">selector</span>: <span class="hljs-string">&#x27;app-cart&#x27;</span>,
  <span class="hljs-attr">template</span>: <span class="hljs-string">\`
    &lt;p&gt;共 {{ count() }} 件，合计 {{ total() }}&lt;/p&gt;
    &lt;button (click)=&quot;add()&quot;&gt;加一件&lt;/button&gt;
  \`</span>,
})
<span class="hljs-keyword">export</span> <span class="hljs-keyword">class</span> <span class="hljs-title class_">CartComponent</span> {
  <span class="hljs-keyword">readonly</span> items = <span class="hljs-title function_">signal</span>([{ <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;书&#x27;</span>, <span class="hljs-attr">price</span>: <span class="hljs-number">30</span> }]);
  <span class="hljs-keyword">readonly</span> count = <span class="hljs-title function_">computed</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">items</span>().<span class="hljs-property">length</span>);
  <span class="hljs-keyword">readonly</span> total = <span class="hljs-title function_">computed</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">items</span>().<span class="hljs-title function_">reduce</span>(<span class="hljs-function">(<span class="hljs-params">s, i</span>) =&gt;</span> s + i.<span class="hljs-property">price</span>, <span class="hljs-number">0</span>));

  <span class="hljs-title function_">add</span>(<span class="hljs-params"></span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">items</span>.<span class="hljs-title function_">update</span>(<span class="hljs-function">(<span class="hljs-params">list</span>) =&gt;</span> [...list, { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;笔&#x27;</span>, <span class="hljs-attr">price</span>: <span class="hljs-number">5</span> }]);
  }
}
</code></pre></div>
<p>模板读取了 <code>count()</code> 和 <code>total()</code>，<code>items</code> 变化时 Angular 只标记这个组件需要更新。</p>
<h2>依赖随分支变化</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">const</span> showDetail = <span class="hljs-title function_">signal</span>(<span class="hljs-literal">false</span>);
<span class="hljs-keyword">const</span> name = <span class="hljs-title function_">signal</span>(<span class="hljs-string">&#x27;Lin&#x27;</span>);
<span class="hljs-keyword">const</span> detail = <span class="hljs-title function_">signal</span>(<span class="hljs-string">&#x27;...&#x27;</span>);
<span class="hljs-keyword">const</span> label = <span class="hljs-title function_">computed</span>(<span class="hljs-function">() =&gt;</span> (<span class="hljs-title function_">showDetail</span>() ? <span class="hljs-string">\`<span class="hljs-subst">\${name()}</span>：<span class="hljs-subst">\${detail()}</span>\`</span> : <span class="hljs-title function_">name</span>()));
</code></pre></div>
<p><code>showDetail</code> 为 <code>false</code> 时，<code>detail</code> 变化不会让 <code>label</code> 重新计算。</p>
<h2>linkedSignal：随来源重置的可写状态</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">import</span> { linkedSignal } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@angular/core&#x27;</span>;

<span class="hljs-keyword">const</span> options = <span class="hljs-title function_">signal</span>([<span class="hljs-string">&#x27;标准&#x27;</span>, <span class="hljs-string">&#x27;加急&#x27;</span>]);
<span class="hljs-keyword">const</span> selected = <span class="hljs-title function_">linkedSignal</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">options</span>()[<span class="hljs-number">0</span>]);

selected.<span class="hljs-title function_">set</span>(<span class="hljs-string">&#x27;加急&#x27;</span>); <span class="hljs-comment">// 用户手动选择</span>
options.<span class="hljs-title function_">set</span>([<span class="hljs-string">&#x27;自提&#x27;</span>, <span class="hljs-string">&#x27;标准&#x27;</span>]); <span class="hljs-comment">// 来源变化，selected 重置为 &#x27;自提&#x27;</span>
</code></pre></div>
<p>用于&quot;默认值来自另一个 Signal，用户也可以修改&quot;的场景，不用写 effect 去同步。</p>
<h2>resource：异步数据</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">import</span> { resource } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@angular/core&#x27;</span>;

<span class="hljs-keyword">const</span> userId = <span class="hljs-title function_">signal</span>(<span class="hljs-number">1</span>);
<span class="hljs-keyword">const</span> user = <span class="hljs-title function_">resource</span>({
  <span class="hljs-attr">params</span>: <span class="hljs-function">() =&gt;</span> ({ <span class="hljs-attr">id</span>: <span class="hljs-title function_">userId</span>() }),
  <span class="hljs-attr">loader</span>: <span class="hljs-function">(<span class="hljs-params">{ params, abortSignal }</span>) =&gt;</span>
    <span class="hljs-title function_">fetch</span>(<span class="hljs-string">\`/api/users/<span class="hljs-subst">\${params.id}</span>\`</span>, { <span class="hljs-attr">signal</span>: abortSignal }).<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">r</span>) =&gt;</span> r.<span class="hljs-title function_">json</span>()),
});
</code></pre></div>
<ul>
<li><code>userId</code> 变化时自动重新请求，旧请求通过 <code>abortSignal</code> 取消。</li>
<li><code>user.status()</code> 的取值包括 <code>&#x27;idle&#x27;</code>、<code>&#x27;loading&#x27;</code>、<code>&#x27;reloading&#x27;</code>、<code>&#x27;resolved&#x27;</code>、<code>&#x27;error&#x27;</code>、<code>&#x27;local&#x27;</code>；<code>user.hasValue()</code> 可以作为类型守卫。</li>
<li>在 error 状态读取 <code>user.value()</code> 会抛错，读取前先判断 <code>hasValue()</code>。</li>
<li><code>httpResource</code> 是基于 <code>HttpClient</code> 的版本，请求会经过拦截器。</li>
</ul>
<h2>组件输入输出</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">import</span> { input, model, output } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@angular/core&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">class</span> <span class="hljs-title class_">Slider</span> {
  <span class="hljs-keyword">readonly</span> max = <span class="hljs-title function_">input</span>(<span class="hljs-number">100</span>); <span class="hljs-comment">// 只读 Signal 输入</span>
  <span class="hljs-keyword">readonly</span> label = input.<span class="hljs-property">required</span>&lt;<span class="hljs-built_in">string</span>&gt;(); <span class="hljs-comment">// 必填</span>
  <span class="hljs-keyword">readonly</span> value = <span class="hljs-title function_">model</span>(<span class="hljs-number">0</span>); <span class="hljs-comment">// 双向绑定：[(value)]=&quot;v&quot;</span>
  <span class="hljs-keyword">readonly</span> changed = output&lt;<span class="hljs-built_in">number</span>&gt;();
}
</code></pre></div>
<h2>常见追问</h2>
<ul>
<li>和 RxJS 的关系？Signal 表示&quot;当前值&quot;，Observable 表示&quot;随时间到达的事件流&quot;，可以用 <code>toSignal</code>、<code>toObservable</code> 互转，见<a href="/questions/frameworks-angular-rxjs/">《Angular 中 Observable 和 Signals 怎样协作？》</a>。</li>
<li>Signals 对变更检测有什么影响？模板读取的 Signal 变化时，Angular 能精确知道哪个组件需要检查，是 zoneless 模式的基础，见<a href="/questions/frameworks-angular-zoneless/">《Angular Zoneless 模式会改变哪些更新假设？》</a>。</li>
</ul>`};export{e as default};