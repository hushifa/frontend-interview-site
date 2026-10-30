var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>接口返回的数据层级很深，<code>res.data.list[0].name</code> 中间任何一层是 <code>undefined</code> 就会报错。<code>get(res, &#x27;data.list[0].name&#x27;, &#x27;无&#x27;)</code> 就是安全地按路径取值，取不到时返回默认值。</p>
<p>写法分两步。先把路径字符串拆成数组，<code>&#x27;a[0].b&#x27;</code> 变成 <code>[&#x27;a&#x27;, &#x27;0&#x27;, &#x27;b&#x27;]</code>；再从对象开始一层层往下取，中途遇到 <code>null</code> 或 <code>undefined</code> 就停下。lodash 文档写明，只有最后结果是 <code>undefined</code> 时才返回默认值，所以取到 <code>null</code> 会原样返回 <code>null</code>。</p>
<p><code>set</code> 是反过来往里写。沿着路径往下走，某一层不存在或不是对象，就新建一个：下一段是数字下标就建数组，否则建对象，所以 <code>set({}, &#x27;x[0].y&#x27;, 5)</code> 得到的是 <code>{ x: [{ y: 5 }] }</code>。</p>
<p>要注意原型污染。如果路径来自用户输入，<code>set(obj, &#x27;__proto__.isAdmin&#x27;, true)</code> 会改到所有对象共享的原型上。lodash 4.17.21 的 <code>set</code> 遇到 <code>__proto__</code>、<code>constructor</code>、<code>prototype</code> 这几个键会直接放弃写入，手写时也要这样拦住。</p>
</blockquote>
<h2>手写 get 和 set</h2>
<p>下面先写一个把路径拆成数组的函数，<code>get</code> 和 <code>set</code> 都用它。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">toPath</span>(<span class="hljs-params">path</span>) {
  <span class="hljs-keyword">if</span> (<span class="hljs-title class_">Array</span>.<span class="hljs-title function_">isArray</span>(path)) <span class="hljs-keyword">return</span> path.<span class="hljs-title function_">map</span>(<span class="hljs-title class_">String</span>);
  <span class="hljs-comment">// 把 a[0].b 统一成 a.0.b 再按点号拆开，空段丢掉。</span>
  <span class="hljs-keyword">return</span> <span class="hljs-title class_">String</span>(path)
    .<span class="hljs-title function_">replace</span>(<span class="hljs-regexp">/\\[(\\w+)\\]/g</span>, <span class="hljs-string">&#x27;.$1&#x27;</span>)
    .<span class="hljs-title function_">split</span>(<span class="hljs-string">&#x27;.&#x27;</span>)
    .<span class="hljs-title function_">filter</span>(<span class="hljs-title class_">Boolean</span>);
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">get</span>(<span class="hljs-params">object, path, defaultValue</span>) {
  <span class="hljs-keyword">let</span> current = object;
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> key <span class="hljs-keyword">of</span> <span class="hljs-title function_">toPath</span>(path)) {
    <span class="hljs-keyword">if</span> (current == <span class="hljs-literal">null</span>) <span class="hljs-keyword">return</span> defaultValue;
    current = current[key];
  }
  <span class="hljs-keyword">return</span> current === <span class="hljs-literal">undefined</span> ? defaultValue : current;
}

<span class="hljs-keyword">const</span> <span class="hljs-variable constant_">UNSAFE_KEYS</span> = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>([<span class="hljs-string">&#x27;__proto__&#x27;</span>, <span class="hljs-string">&#x27;constructor&#x27;</span>, <span class="hljs-string">&#x27;prototype&#x27;</span>]);

<span class="hljs-keyword">function</span> <span class="hljs-title function_">set</span>(<span class="hljs-params">object, path, value</span>) {
  <span class="hljs-keyword">if</span> (object == <span class="hljs-literal">null</span> || <span class="hljs-keyword">typeof</span> object !== <span class="hljs-string">&#x27;object&#x27;</span>) <span class="hljs-keyword">return</span> object;
  <span class="hljs-keyword">const</span> keys = <span class="hljs-title function_">toPath</span>(path);
  <span class="hljs-keyword">if</span> (keys.<span class="hljs-title function_">some</span>(<span class="hljs-function">(<span class="hljs-params">key</span>) =&gt;</span> <span class="hljs-variable constant_">UNSAFE_KEYS</span>.<span class="hljs-title function_">has</span>(key))) <span class="hljs-keyword">return</span> object;

  <span class="hljs-keyword">let</span> current = object;
  keys.<span class="hljs-title function_">forEach</span>(<span class="hljs-function">(<span class="hljs-params">key, index</span>) =&gt;</span> {
    <span class="hljs-keyword">if</span> (index === keys.<span class="hljs-property">length</span> - <span class="hljs-number">1</span>) {
      current[key] = value;
      <span class="hljs-keyword">return</span>;
    }
    <span class="hljs-keyword">const</span> next = current[key];
    <span class="hljs-keyword">if</span> (next === <span class="hljs-literal">null</span> || <span class="hljs-keyword">typeof</span> next !== <span class="hljs-string">&#x27;object&#x27;</span>) {
      <span class="hljs-comment">// 下一段是纯数字就建数组，否则建对象，与 lodash 的行为一致。</span>
      current[key] = <span class="hljs-regexp">/^\\d+$/</span>.<span class="hljs-title function_">test</span>(keys[index + <span class="hljs-number">1</span>]) ? [] : {};
    }
    current = current[key];
  });
  <span class="hljs-keyword">return</span> object;
}

<span class="hljs-keyword">const</span> data = { <span class="hljs-attr">a</span>: [{ <span class="hljs-attr">b</span>: { <span class="hljs-attr">c</span>: <span class="hljs-number">3</span> } }], <span class="hljs-attr">empty</span>: <span class="hljs-literal">null</span> };

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">get</span>(data, <span class="hljs-string">&#x27;a[0].b.c&#x27;</span>)); <span class="hljs-comment">// 3</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">get</span>(data, <span class="hljs-string">&#x27;a.0.b.c&#x27;</span>)); <span class="hljs-comment">// 3</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">get</span>(data, <span class="hljs-string">&#x27;a.1.b&#x27;</span>, <span class="hljs-string">&#x27;默认&#x27;</span>)); <span class="hljs-comment">// 默认</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">get</span>(data, <span class="hljs-string">&#x27;empty&#x27;</span>, <span class="hljs-string">&#x27;默认&#x27;</span>)); <span class="hljs-comment">// null</span>

<span class="hljs-keyword">const</span> target = {};
<span class="hljs-title function_">set</span>(target, <span class="hljs-string">&#x27;x[0].y&#x27;</span>, <span class="hljs-number">5</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(target)); <span class="hljs-comment">// {&quot;x&quot;:[{&quot;y&quot;:5}]}</span>

<span class="hljs-title function_">set</span>({}, <span class="hljs-string">&#x27;__proto__.polluted&#x27;</span>, <span class="hljs-literal">true</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>({}.<span class="hljs-property">polluted</span>); <span class="hljs-comment">// undefined</span>
</code></pre></div>
<p><code>get(data, &#x27;empty&#x27;, &#x27;默认&#x27;)</code> 为什么返回 <code>null</code> 而不是“默认”？因为循环走完时 <code>current</code> 是 <code>null</code>，不是 <code>undefined</code>。lodash 文档的原话是“如果解析出的值是 <code>undefined</code>，就用默认值代替”，<code>null</code> 是一个确实存在的值，所以原样返回。如果路径还没走完就碰到 <code>null</code>，后面已经取不下去了，这时才返回默认值。</p>
<p><code>set</code> 里为什么要看下一段是不是数字？因为 <code>&#x27;x[0].y&#x27;</code> 的意思是“x 是数组，第 0 项有个 y”。如果一律建对象，得到的是 <code>{ x: { 0: { y: 5 } } }</code>，形状就不对了。</p>
<h2>为什么要拦住 <strong>proto</strong></h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> obj = {};
obj[<span class="hljs-string">&#x27;__proto__&#x27;</span>][<span class="hljs-string">&#x27;isAdmin&#x27;</span>] = <span class="hljs-literal">true</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>({}.<span class="hljs-property">isAdmin</span>); <span class="hljs-comment">// true</span>
</code></pre></div>
<p><code>obj[&#x27;__proto__&#x27;]</code> 拿到的不是 <code>obj</code> 自己的属性，而是 <code>Object.prototype</code>。往它上面写属性，所有普通对象都会“继承”到这个值，这就是原型污染。没有拦截的 <code>set</code> 会一步步走到这里。所以路径里只要出现 <code>__proto__</code>、<code>constructor</code>、<code>prototype</code>，就不写。lodash 4.17.21 的 <code>baseSet</code> 也是遇到这三个键就直接返回原对象。</p>
<h2>和可选链怎么选</h2>
<p>如果路径在写代码时就确定，<code>data.a?.[0]?.b?.c ?? &#x27;默认&#x27;</code> 更直接，不需要字符串解析。可是两者有一点不同：<code>??</code> 遇到 <code>null</code> 和 <code>undefined</code> 都会用默认值，而 <code>get</code> 只在 <code>undefined</code> 时用。路径是运行时才知道的，比如表单配置里写着 <code>&#x27;address.city&#x27;</code>，才需要 <code>get</code>。</p>
<h2>常见追问</h2>
<p><strong>键名里本身带点号怎么办？</strong></p>
<blockquote>
<p>用字符串路径就没法区分了，<code>&#x27;a.b&#x27;</code> 会被拆成两段。这时传数组路径，<code>get(obj, [&#x27;a.b&#x27;])</code>。lodash 还会先检查整个字符串能不能直接作为对象上的键（用 <code>in</code> 判断），<code>_.get({ &#x27;a.b&#x27;: 1 }, &#x27;a.b&#x27;)</code> 能取到 1，手写版本没做这一步。</p>
</blockquote>
<p><strong><code>set</code> 遇到中间层是数字或字符串会怎样？</strong></p>
<blockquote>
<p>原始值上不能挂属性，所以要把它换成新的对象或数组再往下写，上面代码里 <code>typeof next !== &#x27;object&#x27;</code> 就是在处理这种情况。lodash 也是这样做的，原来的值会被覆盖。</p>
</blockquote>`};export{e as default};