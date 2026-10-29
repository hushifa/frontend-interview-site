var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>隐式转换就是运算时 JavaScript 自动帮你换类型，换成什么取决于运算本身。<code>if</code> 判断换成布尔，<code>-</code>、<code>*</code>、<code>/</code> 换成数字，所以 <code>&#x27;5&#x27; - 2</code> 是 3。</p>
<p>最容易错的是加号。<code>+</code> 先把两边都转成原始值，有一边是字符串就拼接，否则才做数字加法，所以 <code>[] + 1</code> 得到的是字符串 <code>&#x27;1&#x27;</code>。对象转原始值时，会依次尝试 <code>Symbol.toPrimitive</code>、<code>valueOf</code>、<code>toString</code>；在需要字符串的场合，会先试 <code>toString</code>。</p>
<p>判断真假也要注意。假值只有 <code>undefined</code>、<code>null</code>、<code>false</code>、<code>0</code>、<code>-0</code>、<code>0n</code>、<code>NaN</code> 和空字符串，空数组、空对象、<code>&#x27;0&#x27;</code>、<code>&#x27;false&#x27;</code> 全都是真值。</p>
<p>字符串转数字时，<code>Number</code> 要求整个字符串都是数字，空字符串得 0；<code>parseInt</code> 只读开头的数字部分，<code>&#x27;12px&#x27;</code> 得 12。两者都不能当输入校验用。</p>
</blockquote>
<h2>哪些值是假值</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Boolean</span>([])); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Boolean</span>(<span class="hljs-string">&#x27;0&#x27;</span>)); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Number</span>(<span class="hljs-string">&#x27;&#x27;</span>)); <span class="hljs-comment">// 0</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-built_in">parseInt</span>(<span class="hljs-string">&#x27;12px&#x27;</span>, <span class="hljs-number">10</span>)); <span class="hljs-comment">// 12</span>
</code></pre></div>
<p>空数组是真值，字符串 <code>&#x27;0&#x27;</code> 也是真值，因为它们不在那 8 个假值里。</p>
<p>实际写代码时，这会带来一个常见 bug：<code>if (count)</code> 本来想判断“有没有数量”，结果合法的 <code>0</code> 也被当成“没有”。所以判断数组是否为空要看 <code>length</code>，判断字段是否缺失用 <code>value == null</code> 或 <code>??</code>，它们只把 <code>null</code> 和 <code>undefined</code> 当成缺失。</p>
<h2>加号为什么有时拼接有时相加</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;5&#x27;</span> + <span class="hljs-number">2</span>); <span class="hljs-comment">// 52</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;5&#x27;</span> - <span class="hljs-number">2</span>); <span class="hljs-comment">// 3</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>([] + <span class="hljs-number">1</span>);  <span class="hljs-comment">// 1，字符串</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">typeof</span> ([] + <span class="hljs-number">1</span>)); <span class="hljs-comment">// string</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">1</span> + <span class="hljs-literal">true</span>); <span class="hljs-comment">// 2</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">1</span> + <span class="hljs-literal">null</span>); <span class="hljs-comment">// 1</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">1</span> + <span class="hljs-literal">undefined</span>); <span class="hljs-comment">// NaN</span>
</code></pre></div>
<p>同样是 <code>&#x27;5&#x27;</code> 和 <code>2</code>，加号得到 <code>&#x27;52&#x27;</code>，减号得到 3。减号只有减法一个意思，只能转数字；加号既能拼字符串又能做加法，所以要先看两边。</p>
<p><code>[] + 1</code> 的过程是：<code>[]</code> 先转原始值，得到空字符串 <code>&#x27;&#x27;</code>；这时有一边是字符串了，就拼接成 <code>&#x27;1&#x27;</code>。如果两边都不是字符串，就都转成数字相加，<code>true</code> 转成 1，<code>null</code> 转成 0，<code>undefined</code> 转成 <code>NaN</code>。</p>
<p>还有两种类型比较特殊。BigInt 和 Number 混在一起做算术会抛 <code>TypeError</code>，比如 <code>1n + 1</code>；但 BigInt 和字符串相加还是会拼接。Symbol 不能被隐式转成字符串或数字，强行转会抛错。</p>
<h2>对象怎样变成原始值</h2>
<p>对象参与运算前，要先变成原始值。对象可以用 <code>Symbol.toPrimitive</code> 自己决定怎么变：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> price = {
  [<span class="hljs-title class_">Symbol</span>.<span class="hljs-property">toPrimitive</span>](hint) {
    <span class="hljs-keyword">return</span> hint === <span class="hljs-string">&#x27;string&#x27;</span> ? <span class="hljs-string">&#x27;10 元&#x27;</span> : <span class="hljs-number">10</span>;
  },
};

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Number</span>(price)); <span class="hljs-comment">// 10</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">String</span>(price)); <span class="hljs-comment">// 10 元</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(price + <span class="hljs-number">2</span>); <span class="hljs-comment">// 12</span>
</code></pre></div>
<p><code>hint</code> 是引擎传进来的提示，告诉对象“现在更想要什么类型”，可能是 <code>&#x27;number&#x27;</code>、<code>&#x27;string&#x27;</code> 或 <code>&#x27;default&#x27;</code>。<code>Number(price)</code> 传 <code>&#x27;number&#x27;</code>，<code>String(price)</code> 传 <code>&#x27;string&#x27;</code>，而 <code>+</code> 和 <code>==</code> 传的是 <code>&#x27;default&#x27;</code>，所以这里 <code>price + 2</code> 走了返回 10 的分支，得到 12。</p>
<p>大多数对象没有 <code>Symbol.toPrimitive</code>。这时在数字和默认场合，先调 <code>valueOf</code>，在字符串场合先调 <code>toString</code>。普通对象的 <code>valueOf</code> 返回对象自己，不是原始值，于是接着调 <code>toString</code>，得到 <code>&#x27;[object Object]&#x27;</code>。<code>Date</code> 是个例外，它在默认场合按字符串处理。</p>
<h2>Number 和 parseInt 有什么不同</h2>
<table><thead><tr><th>输入</th><th><code>Number</code></th><th><code>parseInt(x, 10)</code></th></tr></thead><tbody><tr><td><code>&#x27;&#x27;</code> / <code>&#x27;  &#x27;</code></td><td><code>0</code></td><td><code>NaN</code></td></tr><tr><td><code>&#x27;12px&#x27;</code></td><td><code>NaN</code></td><td><code>12</code></td></tr><tr><td><code>&#x27;1e3&#x27;</code></td><td><code>1000</code></td><td><code>1</code></td></tr><tr><td><code>&#x27;0x10&#x27;</code></td><td><code>16</code></td><td><code>0</code></td></tr></tbody></table>
<p><code>Number</code> 看整个字符串，只要有一个字符不合法就是 <code>NaN</code>，但空字符串和纯空格例外，会得到 0。<code>parseInt</code> 从头开始读，读到不认识的字符就停，所以 <code>&#x27;1e3&#x27;</code> 只读出 1。<code>parseInt</code> 要始终传第二个参数 10，明确按十进制解析。</p>
<p>这两个函数都太宽松了，不能拿来校验用户输入。在入口处应该先按业务格式校验，再转换：</p>
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
<p>先用正则确认是不带前导零的非负整数，转换后再检查是否超出安全整数范围。在数据入口统一转换一次，后面的代码就只用处理确定的类型。</p>
<h2>常见追问</h2>
<p><strong><code>[] == ![]</code> 为什么是 <code>true</code>？</strong></p>
<blockquote>
<p>先算右边，<code>[]</code> 是真值，所以 <code>![]</code> 是 <code>false</code>，<code>false</code> 再转成数字 0。左边的 <code>[]</code> 转原始值得到空字符串，再转数字也是 0。两边都是 0，所以相等。</p>
</blockquote>
<p><strong><code>{} + []</code> 在控制台里为什么是 0？</strong></p>
<blockquote>
<p>因为写在行首的 <code>{}</code> 被当成了一个空代码块，不是对象。实际计算的只有 <code>+[]</code>，空数组转成数字是 0。</p>
</blockquote>`};export{e as default};