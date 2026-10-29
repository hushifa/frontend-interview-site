var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>Signal 可以理解成一个装着值的盒子。<code>signal(0)</code> 创建一个，<code>count()</code> 读取，<code>count.set(1)</code> 或 <code>count.update(fn)</code> 修改。</p>
<p>它的关键在于“谁读了它，它就记住谁”。<code>computed</code> 里读了哪些 Signal，这些 Signal 就成了它的依赖。依赖是按实际执行的那条路线收集的，条件分支没走到的 Signal 不算。<code>computed</code> 也是惰性的，第一次被读取时才计算，结果会缓存，依赖变了以后，下次读取才重新算。</p>
<p>需要把状态同步到外面，比如写 localStorage、打日志、驱动第三方库，用 <code>effect()</code>。不要用 <code>effect</code> 去同步另一个 Signal，那种情况用 <code>computed</code> 或 <code>linkedSignal</code>。</p>
<p>要注意，Signal 用 <code>Object.is</code> 判断值有没有变。直接改对象里的属性，引用没变，就不会通知；要用 <code>update</code> 返回一个新对象。</p>
</blockquote>
<h2>先看一个购物车</h2>
<p>下面的组件里，<code>items</code> 是可写的 Signal，<code>count</code> 和 <code>total</code> 是从它派生出来的 <code>computed</code>。</p>
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
<p>点击按钮时，<code>add</code> 没有改原来的数组，而是用 <code>update</code> 返回了一个新数组。因为 Signal 比较的是引用，新数组才会被当成“变了”。如果写成 <code>this.items().push(...)</code>，数组内容变了，引用没变，界面就不会更新。</p>
<p>模板读取了 <code>count()</code> 和 <code>total()</code>，所以 Angular 知道这个组件依赖它们。<code>items</code> 一变，Angular 只把这个组件标记为需要更新。</p>
<h2>依赖为什么会随分支变化</h2>
<p><code>computed</code> 不是提前分析代码里写了哪些 Signal，而是在执行时记录“这一次实际读了谁”。</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">const</span> showDetail = <span class="hljs-title function_">signal</span>(<span class="hljs-literal">false</span>);
<span class="hljs-keyword">const</span> name = <span class="hljs-title function_">signal</span>(<span class="hljs-string">&#x27;Lin&#x27;</span>);
<span class="hljs-keyword">const</span> detail = <span class="hljs-title function_">signal</span>(<span class="hljs-string">&#x27;...&#x27;</span>);
<span class="hljs-keyword">const</span> label = <span class="hljs-title function_">computed</span>(<span class="hljs-function">() =&gt;</span> (<span class="hljs-title function_">showDetail</span>() ? <span class="hljs-string">\`<span class="hljs-subst">\${name()}</span>：<span class="hljs-subst">\${detail()}</span>\`</span> : <span class="hljs-title function_">name</span>()));
</code></pre></div>
<p><code>showDetail</code> 是 <code>false</code> 时，函数只走了后半段，读了 <code>showDetail</code> 和 <code>name</code>，没读 <code>detail</code>。所以这时改 <code>detail</code>，<code>label</code> 不会重新计算。等 <code>showDetail</code> 变成 <code>true</code>，下一次计算读到了 <code>detail</code>，它才成为依赖。</p>
<h2>默认值来自别处，用户又能改，用 linkedSignal</h2>
<p>有一种常见需求：选项列表变了，选中项要重置成第一项；但用户也可以手动选别的。很多人会写一个 <code>effect</code> 去同步，其实 <code>linkedSignal</code> 就是为这个准备的。</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">import</span> { linkedSignal } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@angular/core&#x27;</span>;

<span class="hljs-keyword">const</span> options = <span class="hljs-title function_">signal</span>([<span class="hljs-string">&#x27;标准&#x27;</span>, <span class="hljs-string">&#x27;加急&#x27;</span>]);
<span class="hljs-keyword">const</span> selected = <span class="hljs-title function_">linkedSignal</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">options</span>()[<span class="hljs-number">0</span>]);

selected.<span class="hljs-title function_">set</span>(<span class="hljs-string">&#x27;加急&#x27;</span>); <span class="hljs-comment">// 用户手动选择</span>
options.<span class="hljs-title function_">set</span>([<span class="hljs-string">&#x27;自提&#x27;</span>, <span class="hljs-string">&#x27;标准&#x27;</span>]); <span class="hljs-comment">// 来源变化，selected 重置为 &#x27;自提&#x27;</span>
</code></pre></div>
<p><code>selected</code> 本身可写，所以用户能改。可它又跟着 <code>options</code> 走，来源一变就按函数重新算出默认值。</p>
<h2>异步数据用 resource</h2>
<p>请求数据也能接进 Signal。<code>resource</code> 把“参数 Signal”和“加载函数”连在一起。</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">import</span> { resource } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@angular/core&#x27;</span>;

<span class="hljs-keyword">const</span> userId = <span class="hljs-title function_">signal</span>(<span class="hljs-number">1</span>);
<span class="hljs-keyword">const</span> user = <span class="hljs-title function_">resource</span>({
  <span class="hljs-attr">params</span>: <span class="hljs-function">() =&gt;</span> ({ <span class="hljs-attr">id</span>: <span class="hljs-title function_">userId</span>() }),
  <span class="hljs-attr">loader</span>: <span class="hljs-function">(<span class="hljs-params">{ params, abortSignal }</span>) =&gt;</span>
    <span class="hljs-title function_">fetch</span>(<span class="hljs-string">\`/api/users/<span class="hljs-subst">\${params.id}</span>\`</span>, { <span class="hljs-attr">signal</span>: abortSignal }).<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">r</span>) =&gt;</span> r.<span class="hljs-title function_">json</span>()),
});
</code></pre></div>
<p><code>params</code> 里读了 <code>userId</code>，所以 <code>userId</code> 一变就会重新请求，上一次没完成的请求通过 <code>abortSignal</code> 取消。</p>
<p>请求的状态用 <code>user.status()</code> 读，取值有 <code>&#x27;idle&#x27;</code>、<code>&#x27;loading&#x27;</code>、<code>&#x27;reloading&#x27;</code>、<code>&#x27;resolved&#x27;</code>、<code>&#x27;error&#x27;</code>、<code>&#x27;local&#x27;</code>。这里有个坑：处于 error 状态时读 <code>user.value()</code> 会直接抛错，所以读之前先用 <code>user.hasValue()</code> 判断，它在 TypeScript 里还能当类型守卫用。</p>
<p>如果项目用 <code>HttpClient</code>，可以换成 <code>httpResource</code>，这样请求会经过拦截器。</p>
<h2>组件的输入输出也是 Signal</h2>
<p>组件的输入输出也换成了函数写法：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">import</span> { input, model, output } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@angular/core&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">class</span> <span class="hljs-title class_">Slider</span> {
  <span class="hljs-keyword">readonly</span> max = <span class="hljs-title function_">input</span>(<span class="hljs-number">100</span>); <span class="hljs-comment">// 只读 Signal 输入</span>
  <span class="hljs-keyword">readonly</span> label = input.<span class="hljs-property">required</span>&lt;<span class="hljs-built_in">string</span>&gt;(); <span class="hljs-comment">// 必填</span>
  <span class="hljs-keyword">readonly</span> value = <span class="hljs-title function_">model</span>(<span class="hljs-number">0</span>); <span class="hljs-comment">// 双向绑定：[(value)]=&quot;v&quot;</span>
  <span class="hljs-keyword">readonly</span> changed = output&lt;<span class="hljs-built_in">number</span>&gt;();
}
</code></pre></div>
<p><code>input()</code> 得到的是只读 Signal，组件内部读 <code>this.max()</code>。<code>model()</code> 是可写的，组件内部改了它，父组件用 <code>[(value)]</code> 绑定的值也会跟着变。</p>
<h2>常见追问</h2>
<p><strong>Signal 和 RxJS 是什么关系？</strong></p>
<blockquote>
<p>Signal 表示“当前值”，随时可以同步读；Observable 表示“随时间到达的一串事件”。两者可以用 <code>toSignal</code>、<code>toObservable</code> 互转，详见<a href="/questions/frameworks-angular-rxjs/">《Angular 中 Observable 和 Signals 怎样协作？》</a>。</p>
</blockquote>
<p><strong>Signals 对变更检测有什么影响？</strong></p>
<blockquote>
<p>模板读取的 Signal 变了，Angular 能精确知道是哪个组件需要检查，不用把整棵树都查一遍。这也是 zoneless 模式能成立的基础，详见<a href="/questions/frameworks-angular-zoneless/">《Angular Zoneless 模式会改变哪些更新假设？》</a>。</p>
</blockquote>`};export{e as default};