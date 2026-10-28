var e={answerHtml:`<h2>简答</h2>
<ul>
<li>假值只有 <code>undefined</code>、<code>null</code>、<code>false</code>、<code>0</code>、<code>-0</code>、<code>0n</code>、<code>NaN</code>、<code>&#x27;&#x27;</code>；空数组、空对象、<code>&#x27;0&#x27;</code>、<code>&#x27;false&#x27;</code> 都是真值。</li>
<li><code>+</code> 先把两侧转成原始值，结果有一侧是字符串就拼接，否则做数值加法；所以 <code>[] + 1</code> 是 <code>&#x27;1&#x27;</code>。</li>
<li><code>-</code>、<code>*</code>、<code>/</code> 没有拼接语义，总是转数字：<code>&#x27;5&#x27; - 2</code> 是 <code>3</code>。</li>
<li>对象转原始值依次尝试 <code>Symbol.toPrimitive</code>、<code>valueOf</code>、<code>toString</code>（字符串场景先试 <code>toString</code>）。</li>
<li><code>Number</code> 要求整个字符串是数值，<code>&#x27;&#x27;</code> 得 <code>0</code>；<code>parseInt</code> 读取前缀，<code>&#x27;12px&#x27;</code> 得 <code>12</code>。</li>
</ul>
<h2>真假值</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Boolean</span>([])); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Boolean</span>(<span class="hljs-string">&#x27;0&#x27;</span>)); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Number</span>(<span class="hljs-string">&#x27;&#x27;</span>)); <span class="hljs-comment">// 0</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-built_in">parseInt</span>(<span class="hljs-string">&#x27;12px&#x27;</span>, <span class="hljs-number">10</span>)); <span class="hljs-comment">// 12</span>
</code></pre></div>
<p><code>if (count)</code> 会把合法的 <code>0</code> 当成&quot;没有&quot;。判断数组是否为空看 <code>length</code>，判断字段是否缺失用 <code>value == null</code> 或 <code>??</code>。</p>
<h2>加号</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;5&#x27;</span> + <span class="hljs-number">2</span>); <span class="hljs-comment">// 52</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;5&#x27;</span> - <span class="hljs-number">2</span>); <span class="hljs-comment">// 3</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>([] + <span class="hljs-number">1</span>);  <span class="hljs-comment">// 1，字符串</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">typeof</span> ([] + <span class="hljs-number">1</span>)); <span class="hljs-comment">// string</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">1</span> + <span class="hljs-literal">true</span>); <span class="hljs-comment">// 2</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">1</span> + <span class="hljs-literal">null</span>); <span class="hljs-comment">// 1</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">1</span> + <span class="hljs-literal">undefined</span>); <span class="hljs-comment">// NaN</span>
</code></pre></div>
<p><code>[]</code> 转原始值得到 <code>&#x27;&#x27;</code>，<code>&#x27;&#x27; + 1</code> 拼接成 <code>&#x27;1&#x27;</code>。两侧都不是字符串时转数字相加：<code>true</code> 为 1，<code>null</code> 为 0，<code>undefined</code> 为 <code>NaN</code>。</p>
<p>BigInt 与 Number 混合算术会抛 <code>TypeError</code>（<code>1n + 1</code>）；BigInt 与字符串相加仍会拼接。Symbol 不能隐式转成字符串或数字，会抛错。</p>
<h2>对象转原始值</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> price = {
  [<span class="hljs-title class_">Symbol</span>.<span class="hljs-property">toPrimitive</span>](hint) {
    <span class="hljs-keyword">return</span> hint === <span class="hljs-string">&#x27;string&#x27;</span> ? <span class="hljs-string">&#x27;10 元&#x27;</span> : <span class="hljs-number">10</span>;
  },
};

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Number</span>(price)); <span class="hljs-comment">// 10</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">String</span>(price)); <span class="hljs-comment">// 10 元</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(price + <span class="hljs-number">2</span>); <span class="hljs-comment">// 12</span>
</code></pre></div>
<p><code>hint</code> 是 <code>&#x27;number&#x27;</code>、<code>&#x27;string&#x27;</code> 或 <code>&#x27;default&#x27;</code>，<code>+</code> 和 <code>==</code> 传 <code>&#x27;default&#x27;</code>。没有 <code>Symbol.toPrimitive</code> 时，数字和默认场景先调 <code>valueOf</code>，字符串场景先调 <code>toString</code>；普通对象的 <code>valueOf</code> 返回自身，所以最终用 <code>toString</code> 得到 <code>&#x27;[object Object]&#x27;</code>。<code>Date</code> 的默认场景按字符串处理。</p>
<h2>Number 与 parseInt</h2>
<table><thead><tr><th>输入</th><th><code>Number</code></th><th><code>parseInt(x, 10)</code></th></tr></thead><tbody><tr><td><code>&#x27;&#x27;</code> / <code>&#x27;  &#x27;</code></td><td><code>0</code></td><td><code>NaN</code></td></tr><tr><td><code>&#x27;12px&#x27;</code></td><td><code>NaN</code></td><td><code>12</code></td></tr><tr><td><code>&#x27;1e3&#x27;</code></td><td><code>1000</code></td><td><code>1</code></td></tr><tr><td><code>&#x27;0x10&#x27;</code></td><td><code>16</code></td><td><code>0</code></td></tr></tbody></table>
<p><code>parseInt</code> 始终传第二个参数。两者都不是输入校验，入口处应按业务格式用正则或 schema 校验后再转换。</p>
<h2>输入边界示例</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">parseCount</span>(<span class="hljs-params">raw</span>) {
  <span class="hljs-keyword">const</span> text = <span class="hljs-title class_">String</span>(raw).<span class="hljs-title function_">trim</span>();
  <span class="hljs-keyword">if</span> (!<span class="hljs-regexp">/^(0|[1-9][0-9]*)$/</span>.<span class="hljs-title function_">test</span>(text)) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;请输入不带前导零的非负整数&#x27;</span>);
  }
  <span class="hljs-keyword">const</span> value = <span class="hljs-title class_">Number</span>(text);
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isSafeInteger</span>(value)) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;数量超出安全整数范围&#x27;</span>);
  }
  <span class="hljs-keyword">return</span> value;
}
</code></pre></div>
<p>在数据入口统一转换一次，内部代码只处理确定的类型。</p>
<h2>常见追问</h2>
<ul>
<li><code>[] == ![]</code> 为什么是 true？<code>![]</code> 是 <code>false</code>，转成 <code>0</code>；<code>[]</code> 转成 <code>&#x27;&#x27;</code> 再转 <code>0</code>。</li>
<li><code>{} + []</code> 在控制台为什么是 0？行首的 <code>{}</code> 被解析成代码块，实际计算的是 <code>+[]</code>。</li>
</ul>`};export{e as default};