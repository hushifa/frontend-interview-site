var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>call(thisArg, ...args)</code> 和 <code>apply(thisArg, argsArray)</code> 立即调用函数，只是参数形式不同。手写时把函数挂到 <code>thisArg</code> 的一个 Symbol 属性上调用，避免覆盖已有属性。</li>
<li>非严格模式下，<code>thisArg</code> 为 <code>null</code> 或 <code>undefined</code> 时 this 是全局对象，原始值会被包装成对象。严格模式函数收到的 this 原样不变，挂属性的手写方法无法模拟这一点。</li>
<li><code>bind</code> 返回新函数，调用时把预设参数放在前面、调用参数接在后面。</li>
<li>用 <code>new</code> 调用 bind 后的函数时，绑定的 this 被忽略，等同于用预设参数 <code>new</code> 原函数，得到的实例 <code>instanceof</code> 原函数和绑定函数都为 <code>true</code>。</li>
<li>手写 bind 用 <code>new.target</code> 判断是否被 <code>new</code> 调用，再用 <code>Reflect.construct</code> 构造。</li>
</ul>
<h2>call 和 apply</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-title class_">Function</span>.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span>.<span class="hljs-property">myCall</span> = <span class="hljs-keyword">function</span> (<span class="hljs-params">thisArg, ...args</span>) {
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> <span class="hljs-variable language_">this</span> !== <span class="hljs-string">&#x27;function&#x27;</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;not a function&#x27;</span>);
  <span class="hljs-comment">// 模拟非严格模式：null/undefined 指向全局对象，原始值被包装</span>
  <span class="hljs-keyword">const</span> context = thisArg == <span class="hljs-literal">null</span> ? globalThis : <span class="hljs-title class_">Object</span>(thisArg);
  <span class="hljs-keyword">const</span> key = <span class="hljs-title class_">Symbol</span>(<span class="hljs-string">&#x27;fn&#x27;</span>);
  context[key] = <span class="hljs-variable language_">this</span>;
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">return</span> context[key](...args);
  } <span class="hljs-keyword">finally</span> {
    <span class="hljs-keyword">delete</span> context[key];
  }
};

<span class="hljs-title class_">Function</span>.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span>.<span class="hljs-property">myApply</span> = <span class="hljs-keyword">function</span> (<span class="hljs-params">thisArg, args</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">myCall</span>(thisArg, ...(args ?? []));
};

<span class="hljs-keyword">function</span> <span class="hljs-title function_">show</span>(<span class="hljs-params">a, b</span>) {
  <span class="hljs-keyword">return</span> [<span class="hljs-variable language_">this</span>.<span class="hljs-property">name</span>, a, b];
}
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(show.<span class="hljs-title function_">myCall</span>({ <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;x&#x27;</span> }, <span class="hljs-number">1</span>, <span class="hljs-number">2</span>)); <span class="hljs-comment">// [ &#x27;x&#x27;, 1, 2 ]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(show.<span class="hljs-title function_">myApply</span>({ <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;y&#x27;</span> }, [<span class="hljs-number">3</span>])); <span class="hljs-comment">// [ &#x27;y&#x27;, 3, undefined ]</span>
</code></pre></div>
<p>Symbol 键不会与对象原有属性冲突。<code>finally</code> 保证函数抛错时也会删除临时属性。对冻结对象调用时临时属性无法添加，这是该写法的局限。</p>
<h2>bind</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-title class_">Function</span>.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span>.<span class="hljs-property">myBind</span> = <span class="hljs-keyword">function</span> (<span class="hljs-params">thisArg, ...preset</span>) {
  <span class="hljs-keyword">const</span> target = <span class="hljs-variable language_">this</span>;
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> target !== <span class="hljs-string">&#x27;function&#x27;</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;not a function&#x27;</span>);

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">bound</span>(<span class="hljs-params">...args</span>) {
    <span class="hljs-comment">// 被 new 调用时忽略绑定的 this，按原函数构造</span>
    <span class="hljs-keyword">if</span> (<span class="hljs-keyword">new</span>.<span class="hljs-property">target</span>) {
      <span class="hljs-keyword">return</span> <span class="hljs-title class_">Reflect</span>.<span class="hljs-title function_">construct</span>(target, [...preset, ...args], <span class="hljs-keyword">new</span>.<span class="hljs-property">target</span>);
    }
    <span class="hljs-keyword">return</span> target.<span class="hljs-title function_">apply</span>(thisArg, [...preset, ...args]);
  }

  <span class="hljs-comment">// 让 instanceof bound 与原生行为一致；箭头函数等没有 prototype</span>
  <span class="hljs-keyword">if</span> (target.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span>) bound.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span> = target.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span>;
  <span class="hljs-keyword">return</span> bound;
};
</code></pre></div>
<h2>new 调用绑定函数</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">Point</span>(<span class="hljs-params">x, y</span>) {
  <span class="hljs-variable language_">this</span>.<span class="hljs-property">x</span> = x;
  <span class="hljs-variable language_">this</span>.<span class="hljs-property">y</span> = y;
}

<span class="hljs-keyword">const</span> <span class="hljs-title class_">Bound</span> = <span class="hljs-title class_">Point</span>.<span class="hljs-title function_">myBind</span>({ <span class="hljs-attr">ignored</span>: <span class="hljs-literal">true</span> }, <span class="hljs-number">10</span>);
<span class="hljs-keyword">const</span> p = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Bound</span>(<span class="hljs-number">20</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(p); <span class="hljs-comment">// Point { x: 10, y: 20 }</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(p <span class="hljs-keyword">instanceof</span> <span class="hljs-title class_">Point</span>, p <span class="hljs-keyword">instanceof</span> <span class="hljs-title class_">Bound</span>); <span class="hljs-comment">// true true</span>

<span class="hljs-keyword">const</span> <span class="hljs-title class_">NativeBound</span> = <span class="hljs-title class_">Point</span>.<span class="hljs-title function_">bind</span>({}, <span class="hljs-number">10</span>);
<span class="hljs-keyword">const</span> q = <span class="hljs-keyword">new</span> <span class="hljs-title class_">NativeBound</span>(<span class="hljs-number">20</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(q <span class="hljs-keyword">instanceof</span> <span class="hljs-title class_">Point</span>, q <span class="hljs-keyword">instanceof</span> <span class="hljs-title class_">NativeBound</span>); <span class="hljs-comment">// true true</span>
</code></pre></div>
<p>原生绑定函数没有 <code>prototype</code> 属性，<code>instanceof</code> 会转而检查目标函数的 <code>prototype</code>。手写版本把 <code>bound.prototype</code> 指向原函数的 <code>prototype</code>，得到同样的判断结果。</p>
<h2>常见追问</h2>
<ul>
<li>绑定函数再 bind 一次能改变 this 吗？不能，this 已经固定，再次 bind 只能继续追加预设参数。</li>
<li>箭头函数能用 call 改变 this 吗？不能，箭头函数没有自己的 this，传入的 thisArg 被忽略。</li>
<li>原生 bind 返回函数的 <code>name</code> 和 <code>length</code> 是什么？<code>name</code> 是 <code>bound 原函数名</code>，<code>length</code> 是原函数的形参数减去预设参数个数，最小为 0。上面的手写版用剩余参数，<code>length</code> 为 0、<code>name</code> 为 <code>bound</code>；需要一致时用 <code>Object.defineProperty</code> 改写这两个属性。</li>
</ul>`};export{e as default};