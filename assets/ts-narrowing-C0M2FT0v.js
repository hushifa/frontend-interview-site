var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>typeof</code>、<code>instanceof</code>、<code>in</code>、<code>===</code>、<code>Array.isArray</code>、真值判断、<code>return</code>/<code>throw</code> 提前退出都会让后续代码中的类型变窄。</li>
<li><code>typeof x === &#x27;object&#x27;</code> 仍包含 <code>null</code>；真值判断会同时排除 <code>0</code>、<code>&#x27;&#x27;</code>、<code>false</code>。</li>
<li>自定义类型守卫 <code>(v): v is T</code> 在返回 <code>true</code> 时把参数收窄为 <code>T</code>；断言函数 <code>asserts v is T</code> 在正常返回后收窄。两者的正确性都由实现者负责。</li>
<li><code>as T</code> 只改变编译器看待值的方式，不生成任何检查。</li>
<li>收窄在回调中可能失效：<code>const</code> 变量的收窄会保留，<code>let</code> 变量和对象属性在回调里会退回原类型，先存入局部 <code>const</code> 再使用。</li>
</ul>
<h2>提前返回</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> <span class="hljs-title function_">format</span>(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">string</span> | <span class="hljs-built_in">number</span> | <span class="hljs-literal">null</span></span>): <span class="hljs-built_in">string</span> {
  <span class="hljs-keyword">if</span> (value === <span class="hljs-literal">null</span>) <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;暂无&#x27;</span>;
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> value === <span class="hljs-string">&#x27;number&#x27;</span>) <span class="hljs-keyword">return</span> value.<span class="hljs-title function_">toFixed</span>(<span class="hljs-number">2</span>);
  <span class="hljs-keyword">return</span> value.<span class="hljs-title function_">trim</span>();
}
</code></pre></div>
<p>每次 <code>return</code> 都从后续路径上排除一种类型，最后只剩 <code>string</code>。</p>
<h2>in 与属性类型</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> <span class="hljs-title function_">readTitle</span>(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">unknown</span></span>): <span class="hljs-built_in">string</span> | <span class="hljs-literal">undefined</span> {
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> value !== <span class="hljs-string">&#x27;object&#x27;</span> || value === <span class="hljs-literal">null</span>) <span class="hljs-keyword">return</span> <span class="hljs-literal">undefined</span>;
  <span class="hljs-keyword">if</span> (<span class="hljs-string">&#x27;title&#x27;</span> <span class="hljs-keyword">in</span> value &amp;&amp; <span class="hljs-keyword">typeof</span> value.<span class="hljs-property">title</span> === <span class="hljs-string">&#x27;string&#x27;</span>) {
    <span class="hljs-keyword">return</span> value.<span class="hljs-property">title</span>;
  }
  <span class="hljs-keyword">return</span> <span class="hljs-literal">undefined</span>;
}
</code></pre></div>
<p><code>&#x27;title&#x27; in value</code> 只证明属性存在（含原型链），类型是 <code>unknown</code>，还需要再判断类型。</p>
<h2>类型守卫与断言函数</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">User</span> = { <span class="hljs-attr">name</span>: <span class="hljs-built_in">string</span>; <span class="hljs-attr">age</span>: <span class="hljs-built_in">number</span> };

<span class="hljs-keyword">function</span> <span class="hljs-title function_">isUser</span>(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">unknown</span></span>): value is <span class="hljs-title class_">User</span> {
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">typeof</span> value === <span class="hljs-string">&#x27;object&#x27;</span> &amp;&amp; value !== <span class="hljs-literal">null</span> &amp;&amp;
    <span class="hljs-string">&#x27;name&#x27;</span> <span class="hljs-keyword">in</span> value &amp;&amp; <span class="hljs-keyword">typeof</span> value.<span class="hljs-property">name</span> === <span class="hljs-string">&#x27;string&#x27;</span> &amp;&amp;
    <span class="hljs-string">&#x27;age&#x27;</span> <span class="hljs-keyword">in</span> value &amp;&amp; <span class="hljs-keyword">typeof</span> value.<span class="hljs-property">age</span> === <span class="hljs-string">&#x27;number&#x27;</span>;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">assertUser</span>(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">unknown</span></span>): asserts value is <span class="hljs-title class_">User</span> {
  <span class="hljs-keyword">if</span> (!<span class="hljs-title function_">isUser</span>(value)) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;不是有效的 User&#x27;</span>);
}

<span class="hljs-keyword">const</span> <span class="hljs-attr">input</span>: <span class="hljs-built_in">unknown</span> = <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">parse</span>(<span class="hljs-string">&#x27;{&quot;name&quot;:&quot;Lin&quot;,&quot;age&quot;:24}&#x27;</span>);
<span class="hljs-title function_">assertUser</span>(input);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(input.<span class="hljs-property">name</span>.<span class="hljs-title function_">toUpperCase</span>());
</code></pre></div>
<p>守卫写错（例如总是返回 <code>true</code>），编译器不会发现。TypeScript 5.5 起，<code>filter(x =&gt; x !== undefined)</code> 这类简单箭头函数会被自动推断为类型守卫，结果类型去掉 <code>undefined</code>。</p>
<h2>回调中的收窄</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> <span class="hljs-title function_">printLater</span>(<span class="hljs-params"><span class="hljs-attr">box</span>: { label?: <span class="hljs-built_in">string</span> }</span>) {
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> box.<span class="hljs-property">label</span> === <span class="hljs-string">&#x27;string&#x27;</span>) {
    <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> {
      <span class="hljs-comment">// box.label 在这里是 string | undefined，外部可能已修改</span>
    }, <span class="hljs-number">0</span>);
    <span class="hljs-keyword">const</span> label = box.<span class="hljs-property">label</span>;
    <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(label.<span class="hljs-title function_">toUpperCase</span>()), <span class="hljs-number">0</span>);
  }
}
</code></pre></div>
<p>TypeScript 5.4 起，在最后一次赋值之后创建的闭包中，<code>let</code> 变量和参数的收窄可以保留；对象属性的收窄在回调中仍会失效。</p>
<h2>常见追问</h2>
<ul>
<li><code>never</code> 在收窄中的作用？所有分支都被排除后变量变成 <code>never</code>，用于穷尽检查，见《如何用可辨识联合避免不合理的状态组合？》。</li>
<li>外部数据怎样安全地收窄？用 schema 解析，见《为什么 TypeScript 不能替代接口数据校验？》。</li>
</ul>`};export{e as default};