var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>var</code> 是函数作用域，进入函数时绑定已创建并初始化为 <code>undefined</code>，所以声明前读取得到 <code>undefined</code>。</li>
<li><code>let</code>、<code>const</code> 是块作用域，绑定在进入块时就存在，但到声明执行前处于暂时性死区（TDZ），访问抛 <code>ReferenceError</code>。</li>
<li><code>const</code> 禁止重新赋值，对象属性仍可修改。</li>
<li><code>for</code> 循环头的 <code>let</code> 每次迭代创建新绑定，<code>var</code> 整个循环只有一个绑定。</li>
<li>函数声明会整体提升，可以在声明前调用；<code>var fn = function () {}</code> 只提升变量。</li>
</ul>
<h2>声明前读取</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">inspectBindings</span>(<span class="hljs-params"></span>) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(count); <span class="hljs-comment">// undefined</span>
  <span class="hljs-keyword">var</span> count = <span class="hljs-number">1</span>;
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(count); <span class="hljs-comment">// 1</span>

  <span class="hljs-keyword">try</span> {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(score);
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">name</span>); <span class="hljs-comment">// ReferenceError</span>
  }

  <span class="hljs-keyword">let</span> score = <span class="hljs-number">2</span>;
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(score); <span class="hljs-comment">// 2</span>
}

<span class="hljs-title function_">inspectBindings</span>();
</code></pre></div>
<p>&quot;提升&quot;只是对现象的描述：引擎在执行前为作用域内的所有声明创建绑定，<code>var</code> 同时初始化为 <code>undefined</code>，<code>let</code>/<code>const</code> 要等执行到声明那一行才初始化。</p>
<h2>TDZ 会遮住外层同名变量</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> value = <span class="hljs-string">&#x27;外层&#x27;</span>;
{
  <span class="hljs-keyword">try</span> {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(value);
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">name</span>); <span class="hljs-comment">// ReferenceError</span>
  }
  <span class="hljs-keyword">let</span> value = <span class="hljs-string">&#x27;内层&#x27;</span>;
}
</code></pre></div>
<p>块内的 <code>value</code> 从块开始就存在，所以第一次读取命中的是还在 TDZ 里的内层绑定，而不是外层的 <code>&#x27;外层&#x27;</code>。这也说明 <code>let</code> 并非&quot;没有提升&quot;。</p>
<p><code>typeof</code> 对从未声明的名字返回 <code>&#x27;undefined&#x27;</code>，但对 TDZ 中的名字同样抛 <code>ReferenceError</code>。</p>
<h2>const 与对象</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> settings = { <span class="hljs-attr">theme</span>: <span class="hljs-string">&#x27;light&#x27;</span> };
settings.<span class="hljs-property">theme</span> = <span class="hljs-string">&#x27;dark&#x27;</span>; <span class="hljs-comment">// 允许，修改的是对象</span>
settings = {};           <span class="hljs-comment">// TypeError，重新赋值绑定</span>
</code></pre></div>
<p>需要防止属性被修改时用 <code>Object.freeze</code>，它只冻结一层。</p>
<h2>循环中的闭包</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> fromVar = [];
<span class="hljs-keyword">for</span> (<span class="hljs-keyword">var</span> i = <span class="hljs-number">0</span>; i &lt; <span class="hljs-number">3</span>; i++) fromVar.<span class="hljs-title function_">push</span>(<span class="hljs-function">() =&gt;</span> i);

<span class="hljs-keyword">const</span> fromLet = [];
<span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> j = <span class="hljs-number">0</span>; j &lt; <span class="hljs-number">3</span>; j++) fromLet.<span class="hljs-title function_">push</span>(<span class="hljs-function">() =&gt;</span> j);

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(fromVar.<span class="hljs-title function_">map</span>(<span class="hljs-function"><span class="hljs-params">read</span> =&gt;</span> <span class="hljs-title function_">read</span>()).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 3,3,3</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(fromLet.<span class="hljs-title function_">map</span>(<span class="hljs-function"><span class="hljs-params">read</span> =&gt;</span> <span class="hljs-title function_">read</span>()).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 0,1,2</span>
</code></pre></div>
<p><code>var</code> 的三个回调共享同一个 <code>i</code>，循环结束时是 3。<code>let</code> 每轮有独立的 <code>j</code>。以前用立即执行函数制造新作用域来解决，现在直接用 <code>let</code>。</p>
<h2>其他区别</h2>
<table><thead><tr><th></th><th><code>var</code></th><th><code>let</code></th><th><code>const</code></th></tr></thead><tbody><tr><td>作用域</td><td>函数</td><td>块</td><td>块</td></tr><tr><td>同作用域重复声明</td><td>允许</td><td>语法错误</td><td>语法错误</td></tr><tr><td>声明前访问</td><td><code>undefined</code></td><td><code>ReferenceError</code></td><td><code>ReferenceError</code></td></tr><tr><td>经典脚本顶层</td><td>成为 <code>window</code> 属性</td><td>不会</td><td>不会</td></tr><tr><td>必须初始化</td><td>否</td><td>否</td><td>是</td></tr></tbody></table>
<h2>常见追问</h2>
<ul>
<li><code>let x = x</code> 为什么报错？右侧读取 <code>x</code> 时它还在 TDZ。</li>
<li>ES 模块顶层的 <code>var</code> 会挂到 <code>window</code> 上吗？不会，模块有自己的作用域。</li>
</ul>`};export{e as default};