var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p><code>call</code> 和 <code>apply</code> 都是马上调用函数，并指定这一次的 <code>this</code>，区别只是参数怎么传：<code>call(thisArg, 1, 2)</code> 一个个传，<code>apply(thisArg, [1, 2])</code> 放在数组里传。手写的思路是利用“<code>obj.fn()</code> 里的 <code>this</code> 就是 <code>obj</code>”这条规则，把函数临时挂到 <code>thisArg</code> 上调用，调用完再删掉。挂的时候用 Symbol 做属性名，免得覆盖对象原有的属性。</p>
<p><code>bind</code> 不会马上调用，而是返回一个新函数。新函数的 <code>this</code> 被固定住，调用时预设的参数放在前面，新传的参数接在后面。</p>
<p>有个特殊情况：用 <code>new</code> 调用 bind 出来的函数，绑定的 <code>this</code> 会被忽略，等于用预设参数去 <code>new</code> 原函数。得到的实例，<code>instanceof</code> 原函数和绑定函数都是 <code>true</code>。手写时用 <code>new.target</code> 判断是不是被 <code>new</code> 调用的，再用 <code>Reflect.construct</code> 来构造。</p>
<p>要注意，手写的 call 只能模拟非严格模式的行为：<code>thisArg</code> 是 <code>null</code> 或 <code>undefined</code> 时用全局对象，原始值会被包装成对象。严格模式函数本来会原样收到 <code>this</code>，挂属性的写法做不到这一点。</p>
</blockquote>
<h2>手写 call 和 apply</h2>
<p>调用 <code>obj.fn()</code> 时，<code>fn</code> 里的 <code>this</code> 就是 <code>obj</code>。所以想让函数以某个对象为 <code>this</code> 运行，最直接的办法就是把函数挂到这个对象上，用 <code>对象.函数()</code> 的方式调一次。</p>
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
<p><code>myCall</code> 里的 <code>this</code> 是谁？是调用它的那个函数，也就是 <code>show</code>。因为写的是 <code>show.myCall(...)</code>，前面是 <code>show.</code>。</p>
<p>为什么用 <code>Symbol(&#x27;fn&#x27;)</code> 做属性名？如果用一个普通字符串，比如 <code>&#x27;fn&#x27;</code>，万一对象本来就有 <code>fn</code> 属性，就被覆盖掉了，最后还会被 <code>delete</code> 删掉。每个 Symbol 都是唯一的，不会和已有属性撞上。</p>
<p><code>finally</code> 的作用是，就算函数抛错，临时属性也一定会被删掉。</p>
<p>这种写法也有局限。对象被冻结了，属性加不上去，就没法调用。还有严格模式的差别，下面单独看。</p>
<h2>手写版和原生版在严格模式下不一样</h2>
<p>下面用一个严格模式函数，分别用原生 <code>call</code> 和手写的 <code>myCall</code> 传入数字 5：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">strictFn</span>(<span class="hljs-params"></span>) {
  <span class="hljs-string">&#x27;use strict&#x27;</span>;
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">typeof</span> <span class="hljs-variable language_">this</span>;
}
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(strictFn.<span class="hljs-title function_">call</span>(<span class="hljs-number">5</span>));   <span class="hljs-comment">// number</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(strictFn.<span class="hljs-title function_">myCall</span>(<span class="hljs-number">5</span>)); <span class="hljs-comment">// object</span>
</code></pre></div>
<p>原生 <code>call</code> 传给严格模式函数的 <code>this</code> 就是原始值 5，所以是 <code>number</code>。手写版必须先 <code>Object(5)</code> 把它包装成对象，才能往上挂属性，所以得到的是 <code>object</code>。这是挂属性写法的固有限制，面试时说清楚就行。</p>
<h2>手写 bind</h2>
<p><code>bind</code> 要处理两种调用方式：普通调用和 <code>new</code> 调用。</p>
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
<p>普通调用时，用 <code>apply</code> 把绑定的 <code>thisArg</code> 和拼好的参数传给原函数。</p>
<p><code>new.target</code> 是什么？函数被 <code>new</code> 调用时，它指向被 <code>new</code> 的那个函数；普通调用时它是 <code>undefined</code>。所以用它就能分辨这次是不是 <code>new</code> 调用。</p>
<p>如果是 <code>new</code> 调用，就用 <code>Reflect.construct</code> 按原函数去构造，效果和 <code>new target(...参数)</code> 一样，绑定的 <code>thisArg</code> 完全不用。</p>
<h2>用 new 调用绑定函数会怎样</h2>
<p>下面分别用手写版和原生版试一下：</p>
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
<p><code>{ ignored: true }</code> 果然被忽略了，<code>p</code> 是一个正常的 <code>Point</code> 实例，预设的 10 也生效了，成了 <code>x</code>。</p>
<p>那 <code>q instanceof NativeBound</code> 为什么也是 <code>true</code>？原生的绑定函数其实没有 <code>prototype</code> 属性，<code>instanceof</code> 碰到绑定函数时，会转而去检查它的目标函数，也就是 <code>Point</code> 的 <code>prototype</code>。手写版没法做到这种特殊处理，所以把 <code>bound.prototype</code> 直接指向原函数的 <code>prototype</code>，判断结果就一样了。</p>
<h2>常见追问</h2>
<p><strong>绑定过的函数再 bind 一次，能改变 this 吗？</strong></p>
<blockquote>
<p>不能。<code>this</code> 第一次就固定了，再 bind 只能继续往后追加预设参数。</p>
</blockquote>
<p><strong>箭头函数能用 call 改变 this 吗？</strong></p>
<blockquote>
<p>不能。箭头函数没有自己的 <code>this</code>，用的是外层的，传进去的 <code>thisArg</code> 会被忽略。</p>
</blockquote>
<p><strong>原生 bind 返回的函数，<code>name</code> 和 <code>length</code> 是什么？</strong></p>
<blockquote>
<p><code>name</code> 是“bound 原函数名”，比如 <code>bound Point</code>。<code>length</code> 是原函数的形参个数减去预设参数的个数，最小为 0，上面的 <code>NativeBound</code> 就是 1。手写版用的是剩余参数，<code>length</code> 是 0，<code>name</code> 是 <code>bound</code>。需要一致的话，可以用 <code>Object.defineProperty</code> 改写这两个属性。</p>
</blockquote>`};export{e as default};