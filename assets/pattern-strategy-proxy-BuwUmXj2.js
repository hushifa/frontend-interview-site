var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>表单要校验必填、手机号、最小长度，如果全写在一个函数里，就是一长串 <code>if (rule === &#x27;required&#x27;) ... else if (rule === &#x27;mobile&#x27;) ...</code>，每加一种规则都得改这个函数。策略模式的做法是把每种校验写成一个独立的函数，放进一个对象里，按规则名取出来调用。新增规则只要往对象里加一项，调用的代码不用改。</p>
<p>代理模式是在使用者和真实对象之间加一层，使用者以为自己在直接用对象，其实每次访问都先经过代理。代理可以在这里做额外的事：缓存结果，避免重复计算或请求；先显示占位图，图片加载好再换上；检查权限；记录访问。JS 的 <code>Proxy</code> 能拦截属性读写，Vue 3 的响应式就是用它在读属性时收集依赖、写属性时触发更新。</p>
<p>两者的区别是关注点不同。策略模式解决的是“同一件事有多种做法，怎么选”；代理模式解决的是“访问一个对象时，怎么在不改它的前提下加控制或增强”。</p>
<p>要注意，规则只有两三种、以后也不会增加时，直接写 if-else 更清楚，不要为了用模式而用模式。</p>
</blockquote>
<h2>用策略模式写表单校验</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> strategies = {
  <span class="hljs-attr">required</span>: <span class="hljs-function">(<span class="hljs-params">value</span>) =&gt;</span> (value.<span class="hljs-title function_">trim</span>() ? <span class="hljs-string">&#x27;&#x27;</span> : <span class="hljs-string">&#x27;不能为空&#x27;</span>),
  <span class="hljs-attr">mobile</span>: <span class="hljs-function">(<span class="hljs-params">value</span>) =&gt;</span> (<span class="hljs-regexp">/^1\\d{10}$/</span>.<span class="hljs-title function_">test</span>(value) ? <span class="hljs-string">&#x27;&#x27;</span> : <span class="hljs-string">&#x27;手机号格式不正确&#x27;</span>),
  <span class="hljs-attr">minLength</span>: <span class="hljs-function">(<span class="hljs-params">value, length</span>) =&gt;</span> (value.<span class="hljs-property">length</span> &gt;= length ? <span class="hljs-string">&#x27;&#x27;</span> : <span class="hljs-string">\`至少 <span class="hljs-subst">\${length}</span> 个字符\`</span>),
};

<span class="hljs-keyword">function</span> <span class="hljs-title function_">validate</span>(<span class="hljs-params">value, rules</span>) {
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> [name, ...args] <span class="hljs-keyword">of</span> rules) {
    <span class="hljs-keyword">const</span> strategy = strategies[name];
    <span class="hljs-keyword">if</span> (!strategy) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`未知规则：<span class="hljs-subst">\${name}</span>\`</span>);
    <span class="hljs-keyword">const</span> message = <span class="hljs-title function_">strategy</span>(value, ...args);
    <span class="hljs-keyword">if</span> (message) <span class="hljs-keyword">return</span> message;
  }
  <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;&#x27;</span>;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">validate</span>(<span class="hljs-string">&#x27;&#x27;</span>, [[<span class="hljs-string">&#x27;required&#x27;</span>]])); <span class="hljs-comment">// 不能为空</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">validate</span>(<span class="hljs-string">&#x27;1380000&#x27;</span>, [[<span class="hljs-string">&#x27;required&#x27;</span>], [<span class="hljs-string">&#x27;mobile&#x27;</span>]])); <span class="hljs-comment">// 手机号格式不正确</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">validate</span>(<span class="hljs-string">&#x27;ab&#x27;</span>, [[<span class="hljs-string">&#x27;minLength&#x27;</span>, <span class="hljs-number">6</span>]])); <span class="hljs-comment">// 至少 6 个字符</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">validate</span>(<span class="hljs-string">&#x27;13800000000&#x27;</span>, [[<span class="hljs-string">&#x27;required&#x27;</span>], [<span class="hljs-string">&#x27;mobile&#x27;</span>]]) === <span class="hljs-string">&#x27;&#x27;</span>); <span class="hljs-comment">// true</span>
</code></pre></div>
<p><code>validate</code> 本身不知道有哪些规则，它只按名字去 <code>strategies</code> 里找函数调用。所以要加一个“邮箱”规则，只需在 <code>strategies</code> 里加一个 <code>email</code> 函数，<code>validate</code> 一行都不用改。规则写成 <code>[名称, ...参数]</code> 的数组，像 <code>minLength</code> 这种需要参数的规则也能用同一种方式表达。</p>
<p>遇到未知规则名为什么要抛错，而不是忽略？因为拼错规则名时如果静默跳过，校验就悄悄失效了，用户能提交本该被拦住的数据。</p>
<h2>用代理模式加缓存</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">withCache</span>(<span class="hljs-params">fn</span>) {
  <span class="hljs-keyword">const</span> cache = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>();
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">function</span> (<span class="hljs-params">key</span>) {
    <span class="hljs-keyword">if</span> (!cache.<span class="hljs-title function_">has</span>(key)) cache.<span class="hljs-title function_">set</span>(key, <span class="hljs-title function_">fn</span>(key));
    <span class="hljs-keyword">return</span> cache.<span class="hljs-title function_">get</span>(key);
  };
}

<span class="hljs-keyword">const</span> getUser = <span class="hljs-title function_">withCache</span>(<span class="hljs-function">(<span class="hljs-params">id</span>) =&gt;</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">\`/api/users/<span class="hljs-subst">\${id}</span>\`</span>).<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">res</span>) =&gt;</span> res.<span class="hljs-title function_">json</span>()));
</code></pre></div>
<p>调用 <code>getUser(1)</code> 的代码和直接调用原函数没有区别，可同一个 <code>id</code> 第二次调用时直接返回缓存里的 Promise，不再发请求。这里缓存的是 Promise，所以两个组件同时请求同一个用户，也只会发出一次请求。实际项目里还要处理请求失败时删除缓存，否则失败的结果会一直被缓存。</p>
<p>用 <code>Proxy</code> 可以代理对象的属性访问，原理和限制见<a href="/questions/js-proxy-reflect/">《Proxy 与 Reflect 能实现什么，存在哪些限制？》</a>，Vue 3 怎样用它收集依赖见<a href="/questions/vue-reactivity-tracking/">《Vue 3 响应式依赖是怎样收集和触发的？》</a>。</p>
<h2>常见追问</h2>
<p><strong>代理模式和装饰器模式有什么区别？</strong></p>
<blockquote>
<p>两者都是包一层再调用原对象，结构很像。区别在意图：代理侧重控制访问，比如决定要不要真的调用、什么时候调用；装饰器侧重给对象叠加新功能，原有的调用总会发生。实际讨论中不必纠结名字，说清楚这一层做了什么就行。</p>
</blockquote>
<p><strong>前端还有哪些常见的设计模式？</strong></p>
<blockquote>
<p>工厂模式用一个函数按参数创建不同的对象，比如根据类型创建不同的图表实例；适配器模式把一个接口转换成另一个，比如把不同后端返回的数据整理成统一格式；装饰器模式比如高阶组件给组件增加功能。</p>
</blockquote>`};export{e as default};