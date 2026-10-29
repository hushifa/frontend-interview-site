var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p><code>new Proxy(target, handler)</code> 会返回一个代理对象，对它做的读属性、写属性、<code>in</code>、<code>delete</code>、遍历、调用，都会先进入 <code>handler</code> 里对应的函数，这些函数叫陷阱。所以可以在里面记录、校验、改写这些操作。</p>
<p><code>Reflect</code> 上的方法和陷阱一一对应，比如 <code>Reflect.get</code>、<code>Reflect.set</code>，用来在陷阱里执行原本的默认行为。转发时要把 <code>receiver</code> 也传进去，这样 getter 里的 <code>this</code> 才会是代理，而不是原对象。</p>
<p>它有几个限制。陷阱的结果必须遵守一些规则，叫不变式，比如一个属性不可配置又不可写，<code>get</code> 就必须返回它的真实值，否则抛 <code>TypeError</code>。代理和原对象是两个不同的对象，直接改原对象不会经过陷阱。</p>
<p>还有，私有字段 <code>#x</code> 和 <code>Map</code>、<code>Set</code>、<code>Date</code> 这类对象的内部数据，都不经过陷阱，要把方法绑定到原对象上才能用。</p>
</blockquote>
<h2>先看一个记录读取、校验写入的例子</h2>
<p>下面的代理会把每次读取的属性名记下来，并且在写入价格时做校验。注意读 <code>total</code> 时一共记了几个属性。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> reads = [];
<span class="hljs-keyword">const</span> target = {
  <span class="hljs-attr">price</span>: <span class="hljs-number">10</span>,
  <span class="hljs-keyword">get</span> <span class="hljs-title function_">total</span>() {
    <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>.<span class="hljs-property">price</span> * <span class="hljs-number">2</span>;
  },
};

<span class="hljs-keyword">const</span> product = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Proxy</span>(target, {
  <span class="hljs-title function_">get</span>(<span class="hljs-params">object, key, receiver</span>) {
    reads.<span class="hljs-title function_">push</span>(<span class="hljs-title class_">String</span>(key));
    <span class="hljs-keyword">return</span> <span class="hljs-title class_">Reflect</span>.<span class="hljs-title function_">get</span>(object, key, receiver);
  },
  <span class="hljs-title function_">set</span>(<span class="hljs-params">object, key, value, receiver</span>) {
    <span class="hljs-keyword">if</span> (key === <span class="hljs-string">&#x27;price&#x27;</span> &amp;&amp; (!<span class="hljs-title class_">Number</span>.<span class="hljs-built_in">isFinite</span>(value) || value &lt; <span class="hljs-number">0</span>)) {
      <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;价格必须是非负有限数值&#x27;</span>);
    }
    <span class="hljs-keyword">return</span> <span class="hljs-title class_">Reflect</span>.<span class="hljs-title function_">set</span>(object, key, value, receiver);
  },
});

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(product.<span class="hljs-property">total</span>); <span class="hljs-comment">// 20</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(reads.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// total,price</span>
product.<span class="hljs-property">price</span> = <span class="hljs-number">12</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(target.<span class="hljs-property">price</span>); <span class="hljs-comment">// 12</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(product === target); <span class="hljs-comment">// false</span>
</code></pre></div>
<p>只读了一次 <code>product.total</code>，记录里却有 <code>total</code> 和 <code>price</code> 两个。</p>
<p>这是 <code>receiver</code> 的作用。<code>Reflect.get(object, key, receiver)</code> 会让 <code>total</code> 的 getter 以 <code>receiver</code>，也就是代理为 <code>this</code> 执行。getter 里读 <code>this.price</code>，读的是代理的 <code>price</code>，所以又进了一次 <code>get</code> 陷阱。如果写成 <code>return object[key]</code>，getter 的 <code>this</code> 就是原对象，读 <code>price</code> 不经过代理，这次读取就漏掉了。</p>
<p>Vue 3 的响应式正是依赖这一点：计算属性里用到了哪些属性，都要被记录下来，之后这些属性变了才能通知更新。</p>
<p>写入时，<code>product.price = 12</code> 通过了校验，改到了原对象上，所以 <code>target.price</code> 是 12。但 <code>product</code> 和 <code>target</code> 不是同一个对象，比较结果是 <code>false</code>。</p>
<h2>常用的陷阱有哪些</h2>
<table><thead><tr><th>操作</th><th>陷阱</th></tr></thead><tbody><tr><td><code>proxy.x</code></td><td><code>get</code></td></tr><tr><td><code>proxy.x = v</code></td><td><code>set</code></td></tr><tr><td><code>&#x27;x&#x27; in proxy</code></td><td><code>has</code></td></tr><tr><td><code>delete proxy.x</code></td><td><code>deleteProperty</code></td></tr><tr><td><code>Object.keys(proxy)</code>、<code>for...in</code></td><td><code>ownKeys</code> + <code>getOwnPropertyDescriptor</code></td></tr><tr><td><code>Object.defineProperty</code></td><td><code>defineProperty</code></td></tr><tr><td><code>proxy()</code>、<code>new proxy()</code></td><td><code>apply</code>、<code>construct</code>（目标必须可调用、可构造）</td></tr></tbody></table>
<p><code>set</code> 陷阱要返回 <code>true</code> 表示写入成功。返回 <code>false</code> 的话，严格模式下会抛 <code>TypeError</code>。</p>
<h2>陷阱为什么不能随便返回值</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> locked = {};
<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">defineProperty</span>(locked, <span class="hljs-string">&#x27;id&#x27;</span>, { <span class="hljs-attr">value</span>: <span class="hljs-number">7</span>, <span class="hljs-attr">writable</span>: <span class="hljs-literal">false</span>, <span class="hljs-attr">configurable</span>: <span class="hljs-literal">false</span> });

<span class="hljs-keyword">const</span> proxy = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Proxy</span>(locked, { <span class="hljs-attr">get</span>: <span class="hljs-function">() =&gt;</span> <span class="hljs-number">8</span> });
<span class="hljs-keyword">try</span> {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(proxy.<span class="hljs-property">id</span>);
} <span class="hljs-keyword">catch</span> (error) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">name</span>); <span class="hljs-comment">// TypeError</span>
}
</code></pre></div>
<p><code>get</code> 陷阱想把 <code>id</code> 改成 8，结果读取直接抛了 <code>TypeError</code>。</p>
<p>因为 <code>id</code> 在原对象上是不可写、不可配置的，语言保证它的值永远是 7。代理如果能返回别的值，这个保证就被破坏了，所以引擎会检查陷阱的结果，违反就报错。这类规则叫不变式。</p>
<p>类似的规则还有：<code>ownKeys</code> 返回的键必须包含所有不可配置的键；原对象不可扩展时，<code>ownKeys</code> 必须正好返回原对象的那些键，不能多也不能少。</p>
<h2>为什么代理 Map 会报错</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> map = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>();
<span class="hljs-keyword">const</span> values = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Proxy</span>(map, {
  <span class="hljs-title function_">get</span>(<span class="hljs-params">target, key</span>) {
    <span class="hljs-keyword">const</span> value = <span class="hljs-title class_">Reflect</span>.<span class="hljs-title function_">get</span>(target, key);
    <span class="hljs-keyword">return</span> <span class="hljs-keyword">typeof</span> value === <span class="hljs-string">&#x27;function&#x27;</span> ? value.<span class="hljs-title function_">bind</span>(target) : value;
  },
});
values.<span class="hljs-title function_">set</span>(<span class="hljs-string">&#x27;a&#x27;</span>, <span class="hljs-number">1</span>); <span class="hljs-comment">// 不绑定时抛 TypeError</span>
</code></pre></div>
<p>如果不做 <code>bind</code>，<code>values.set(&#x27;a&#x27;, 1)</code> 会抛 <code>TypeError</code>。</p>
<p><code>Map</code> 的数据不存在普通属性里，而是存在引擎内部的槽里。<code>Map.prototype.set</code> 要求 <code>this</code> 必须是真正带这个内部槽的 Map。不绑定时，<code>this</code> 是代理，代理没有内部槽，于是报错。改法就是像上面这样，把取到的方法绑定到原来的 <code>map</code> 上。Vue 对 Map、Set 这类集合类型用的是专门的处理器。</p>
<h2>用 Proxy 做响应式还要做什么</h2>
<p>Proxy 只解决了“拦截”这一步，一套完整的响应式还要做很多事。嵌套对象要在 <code>get</code> 时才包装成代理，这样不用一开始就把整棵树都包一遍；还要用 <code>WeakMap</code> 缓存原对象到代理的对应关系，保证同一个对象每次拿到的都是同一个代理。数组的 <code>push</code> 会同时读写 <code>length</code>，要避免因此重复触发更新。依赖收集、批量调度更新、清理过时的依赖，这些也都是代理之外的工作。</p>
<h2>常见追问</h2>
<p><strong>用 <code>Object.defineProperty</code> 实现响应式有什么不足？</strong></p>
<blockquote>
<p>它只能劫持已经存在的属性。新增属性、删除属性、通过下标修改数组都劫持不到，需要额外的 API，所以 Vue 2 才提供了 <code>Vue.set</code>。</p>
</blockquote>
<p><strong><code>Proxy.revocable</code> 做什么？</strong></p>
<blockquote>
<p>它返回 <code>{ proxy, revoke }</code>。调用 <code>revoke()</code> 以后，对这个代理的任何操作都会抛 <code>TypeError</code>。适合把访问权临时交给第三方代码，用完就收回。</p>
</blockquote>`};export{e as default};