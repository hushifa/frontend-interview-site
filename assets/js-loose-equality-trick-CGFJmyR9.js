var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>这道题考的是 <code>==</code> 遇到对象时会做什么。<code>a == 1</code> 里一边是对象、一边是数字，规范要求先把对象转成原始值再比较，而转换过程会调用对象自己的方法，所以只要让这个方法每次返回的数加 1，三次比较就分别拿到 1、2、3。</p>
<p>对象转原始值时，先看有没有 <code>Symbol.toPrimitive</code> 方法，有就用它；没有就在 <code>valueOf</code> 和 <code>toString</code> 之间按顺序试，<code>==</code> 这种场合先试 <code>valueOf</code>。所以最常见的写法是给对象写一个 <code>valueOf</code>，里面让计数器自增并返回。</p>
<p>另一种思路是不让 <code>a</code> 是普通变量。把 <code>a</code> 定义成全局对象上的 getter，每次读 <code>a</code> 都会执行函数，返回一个递增的数。这种写法连 <code>a === 1 &amp;&amp; a === 2 &amp;&amp; a === 3</code> 都能成立，因为严格相等虽然不做类型转换，但读取 <code>a</code> 本身就有副作用。</p>
<p>要注意，这些写法利用的都是“比较时会调用你的代码”，实际项目里不应该这样写。它真正的启示是：<code>==</code> 和对象比较时行为可以被改写，所以业务代码里应该用 <code>===</code>，并避免让对象和原始值直接比较。</p>
</blockquote>
<h2>用 valueOf 和 toString 实现</h2>
<p>下面三种写法都成立，先看运行结果，再看各自依赖的规则。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> a = {
  <span class="hljs-attr">value</span>: <span class="hljs-number">0</span>,
  <span class="hljs-title function_">valueOf</span>(<span class="hljs-params"></span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">value</span> += <span class="hljs-number">1</span>;
    <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>.<span class="hljs-property">value</span>;
  },
};
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(a == <span class="hljs-number">1</span> &amp;&amp; a == <span class="hljs-number">2</span> &amp;&amp; a == <span class="hljs-number">3</span> ? <span class="hljs-string">&#x27;成立&#x27;</span> : <span class="hljs-string">&#x27;不成立&#x27;</span>); <span class="hljs-comment">// 成立</span>

<span class="hljs-keyword">const</span> list = [<span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>];
list.<span class="hljs-property">toString</span> = list.<span class="hljs-property">shift</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(list == <span class="hljs-number">1</span> &amp;&amp; list == <span class="hljs-number">2</span> &amp;&amp; list == <span class="hljs-number">3</span> ? <span class="hljs-string">&#x27;成立&#x27;</span> : <span class="hljs-string">&#x27;不成立&#x27;</span>); <span class="hljs-comment">// 成立</span>

<span class="hljs-keyword">let</span> count = <span class="hljs-number">0</span>;
<span class="hljs-keyword">const</span> b = {
  [<span class="hljs-title class_">Symbol</span>.<span class="hljs-property">toPrimitive</span>](hint) {
    count += <span class="hljs-number">1</span>;
    <span class="hljs-keyword">return</span> hint === <span class="hljs-string">&#x27;string&#x27;</span> ? <span class="hljs-string">&#x27;第&#x27;</span> + count + <span class="hljs-string">&#x27;次&#x27;</span> : count;
  },
};
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(b == <span class="hljs-number">1</span> &amp;&amp; b == <span class="hljs-number">2</span> &amp;&amp; b == <span class="hljs-number">3</span> ? <span class="hljs-string">&#x27;成立&#x27;</span> : <span class="hljs-string">&#x27;不成立&#x27;</span>); <span class="hljs-comment">// 成立</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">\`<span class="hljs-subst">\${b}</span>\`</span>); <span class="hljs-comment">// 第4次</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(b === <span class="hljs-number">5</span> ? <span class="hljs-string">&#x27;成立&#x27;</span> : <span class="hljs-string">&#x27;不成立&#x27;</span>); <span class="hljs-comment">// 不成立</span>
</code></pre></div>
<p>第一种为什么成立？ECMAScript 的 <code>IsLooselyEqual</code> 规定，一边是对象、另一边是数字或字符串时，先对对象调用 <code>ToPrimitive</code>。对象没有 <code>Symbol.toPrimitive</code>，<code>ToPrimitive</code> 就按默认顺序先调 <code>valueOf</code>。每比较一次，<code>valueOf</code> 就执行一次，返回 1、2、3，正好和右边对上。</p>
<p>第二种是第一种的变形。数组自带的 <code>valueOf</code> 返回数组自己，还是对象，不是原始值，于是转换接着调 <code>toString</code>。把 <code>toString</code> 换成 <code>shift</code>，每次调用就从数组头部取出一个元素，依次是 1、2、3。</p>
<p>第三种用 <code>Symbol.toPrimitive</code>，它的优先级最高，有它就不再看 <code>valueOf</code> 和 <code>toString</code>。它还会收到一个 <code>hint</code> 参数，说明调用方想要什么类型：<code>==</code> 传的是 <code>&#x27;default&#x27;</code>，模板字符串传的是 <code>&#x27;string&#x27;</code>。所以第 4 次在模板字符串里调用时，返回的是“第4次”。</p>
<p>最后一行说明了这种写法的边界：<code>===</code> 不做类型转换，对象和数字直接判定为不相等，<code>Symbol.toPrimitive</code> 根本不会被调用。对象转原始值的完整规则见<a href="/questions/js-coercion/">《隐式类型转换有哪些容易踩坑的规则？》</a>。</p>
<h2>用 getter 让 === 也成立</h2>
<p>如果想让严格相等也成立，就不能靠类型转换了，要让“读取 <code>a</code>”这个动作本身返回不同的值。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">let</span> n = <span class="hljs-number">0</span>;
<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">defineProperty</span>(globalThis, <span class="hljs-string">&#x27;c&#x27;</span>, {
  <span class="hljs-title function_">get</span>(<span class="hljs-params"></span>) {
    n += <span class="hljs-number">1</span>;
    <span class="hljs-keyword">return</span> n;
  },
});
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(c === <span class="hljs-number">1</span> &amp;&amp; c === <span class="hljs-number">2</span> &amp;&amp; c === <span class="hljs-number">3</span> ? <span class="hljs-string">&#x27;成立&#x27;</span> : <span class="hljs-string">&#x27;不成立&#x27;</span>); <span class="hljs-comment">// 成立</span>
</code></pre></div>
<p>在非严格的脚本里，直接写变量名 <code>c</code>，找不到局部变量时会去全局对象上找属性。这个属性是 getter，每读一次就执行一次函数，所以三次读到的分别是 1、2、3，比较的都是数字，<code>===</code> 自然成立。属性描述符和 getter 的用法见<a href="/questions/js-property-descriptors/">《属性描述符、Object.freeze 和只读有什么区别？》</a>。</p>
<p>用 <code>with</code> 语句把一个带 getter 的对象放进作用域链，效果也一样，不过 <code>with</code> 在严格模式下不能用。</p>
<h2>用 Proxy 拦截转换</h2>
<p><code>Proxy</code> 可以拦截对属性的读取，<code>ToPrimitive</code> 在内部会读对象的 <code>Symbol.toPrimitive</code> 属性，所以可以在 <code>get</code> 里拦住它，返回一个自增的函数：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> counter = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Proxy</span>({ <span class="hljs-attr">n</span>: <span class="hljs-number">0</span> }, {
  <span class="hljs-title function_">get</span>(<span class="hljs-params">target, key</span>) {
    <span class="hljs-keyword">if</span> (key === <span class="hljs-title class_">Symbol</span>.<span class="hljs-property">toPrimitive</span>) <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> ++target.<span class="hljs-property">n</span>;
    <span class="hljs-keyword">return</span> <span class="hljs-title class_">Reflect</span>.<span class="hljs-title function_">get</span>(target, key);
  },
});
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(counter == <span class="hljs-number">1</span> &amp;&amp; counter == <span class="hljs-number">2</span> &amp;&amp; counter == <span class="hljs-number">3</span> ? <span class="hljs-string">&#x27;成立&#x27;</span> : <span class="hljs-string">&#x27;不成立&#x27;</span>); <span class="hljs-comment">// 成立</span>
</code></pre></div>
<p>这和第三种写法本质相同，只是方法不是写在对象上，而是读取时临时给出来的。<code>Proxy</code> 的其他用法见<a href="/questions/js-proxy-reflect/">《Proxy 与 Reflect 能实现什么，存在哪些限制？》</a>。</p>
<h2>常见追问</h2>
<p><strong>为什么 <code>valueOf</code> 写法里，<code>===</code> 不成立？</strong></p>
<blockquote>
<p>因为 <code>===</code> 不做类型转换。两边类型不同，一个是对象一个是数字，直接返回 <code>false</code>，不会调用 <code>valueOf</code>。想让 <code>===</code> 成立，只能让读取变量本身返回不同的数字，也就是 getter 的写法。</p>
</blockquote>
<p><strong><code>a</code> 同时有 <code>valueOf</code> 和 <code>toString</code>，<code>a == &#x27;1&#x27;</code> 用哪个？</strong></p>
<blockquote>
<p>没有 <code>Symbol.toPrimitive</code> 时，<code>==</code> 用的是 <code>&#x27;default&#x27;</code> 提示，普通对象按数字的顺序处理，先调 <code>valueOf</code>，它返回原始值就不再调 <code>toString</code>。<code>Date</code> 是例外，它在 <code>&#x27;default&#x27;</code> 提示下先调 <code>toString</code>。</p>
</blockquote>`};export{e as default};