var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p><code>var</code> 声明的变量在整个函数里都有效，叫函数作用域。进入函数时它就已经存在了，值是 <code>undefined</code>，所以在声明之前读取不会报错，只会拿到 <code>undefined</code>。</p>
<p><code>let</code> 和 <code>const</code> 只在所在的代码块，也就是一对大括号里有效，叫块作用域。它们在进入代码块时其实也已经存在，但在执行到声明那一行之前不能访问，一访问就抛 <code>ReferenceError</code>。从块开始到声明这一段，叫暂时性死区，简称 TDZ。</p>
<p><code>const</code> 只是禁止重新赋值，如果它指向一个对象，对象的属性照样能改。</p>
<p>还有两个常考点。<code>for</code> 循环头里用 <code>let</code>，每一轮都会创建一个新变量，而 <code>var</code> 整个循环只有一个。函数声明会整体提升，可以在声明之前调用；<code>var fn = function () {}</code> 只提升了变量，提前调用会报错。</p>
</blockquote>
<h2>声明之前读取会发生什么</h2>
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
<p>同样是在声明之前读取，<code>var</code> 声明的 <code>count</code> 读到了 <code>undefined</code>，<code>let</code> 声明的 <code>score</code> 却抛了 <code>ReferenceError</code>。</p>
<p>原因要从函数开始执行时说起。引擎在运行函数里的代码之前，会先把里面所有声明的变量都创建出来。<code>var</code> 的变量在这时就被初始化成 <code>undefined</code>，所以随时能读。<code>let</code> 和 <code>const</code> 的变量也被创建了，但要等执行到声明那一行才初始化，在这之前访问就会报错。</p>
<p>平时说的“变量提升”，只是对这种现象的一种描述，代码并没有真的被挪到函数开头。</p>
<h2>let 到底有没有提升</h2>
<p>很多人说 <code>let</code> 没有提升，下面这个例子能说明并不是这样：</p>
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
<p>如果 <code>let</code> 没有提升，块里第一次读 <code>value</code>，应该读到外层的 <code>&#x27;外层&#x27;</code>。可实际上抛了 <code>ReferenceError</code>。</p>
<p>因为块里的 <code>value</code> 从块开始就已经存在了，它把外层的同名变量挡住了。第一次读取找到的是这个还在暂时性死区里的内层变量，所以报错。</p>
<p><code>typeof</code> 也逃不过这个规则。对一个从来没声明过的名字，<code>typeof</code> 会返回 <code>&#x27;undefined&#x27;</code>；但对一个还在暂时性死区里的变量，<code>typeof</code> 也会抛 <code>ReferenceError</code>。</p>
<h2>const 为什么还能改对象</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> settings = { <span class="hljs-attr">theme</span>: <span class="hljs-string">&#x27;light&#x27;</span> };
settings.<span class="hljs-property">theme</span> = <span class="hljs-string">&#x27;dark&#x27;</span>; <span class="hljs-comment">// 允许，修改的是对象</span>
settings = {};           <span class="hljs-comment">// TypeError，重新赋值绑定</span>
</code></pre></div>
<p><code>const</code> 锁住的是 <code>settings</code> 这个变量，让它不能再指向别的值。可它指向的那个对象本身没被锁，改属性是允许的。想让属性也不能改，要用 <code>Object.freeze</code>，而且它只冻结一层。</p>
<h2>for 循环里 var 和 let 有什么不同</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> fromVar = [];
<span class="hljs-keyword">for</span> (<span class="hljs-keyword">var</span> i = <span class="hljs-number">0</span>; i &lt; <span class="hljs-number">3</span>; i++) fromVar.<span class="hljs-title function_">push</span>(<span class="hljs-function">() =&gt;</span> i);

<span class="hljs-keyword">const</span> fromLet = [];
<span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> j = <span class="hljs-number">0</span>; j &lt; <span class="hljs-number">3</span>; j++) fromLet.<span class="hljs-title function_">push</span>(<span class="hljs-function">() =&gt;</span> j);

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(fromVar.<span class="hljs-title function_">map</span>(<span class="hljs-function"><span class="hljs-params">read</span> =&gt;</span> <span class="hljs-title function_">read</span>()).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 3,3,3</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(fromLet.<span class="hljs-title function_">map</span>(<span class="hljs-function"><span class="hljs-params">read</span> =&gt;</span> <span class="hljs-title function_">read</span>()).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 0,1,2</span>
</code></pre></div>
<p>两个循环写法几乎一样，<code>var</code> 那组函数全都返回 3，<code>let</code> 那组返回 0、1、2。</p>
<p><code>var</code> 整个循环只有一个 <code>i</code>，三个函数记住的都是这同一个变量。等调用它们时，循环早就跑完了，<code>i</code> 已经是 3。<code>let</code> 不一样，循环每一轮都会创建一个新的 <code>j</code>，每个函数记住的是自己那一轮的 <code>j</code>。以前没有 <code>let</code> 时，要用立即执行函数给每一轮造一个新作用域，现在直接用 <code>let</code> 就行。</p>
<h2>三者的其他区别</h2>
<table><thead><tr><th></th><th><code>var</code></th><th><code>let</code></th><th><code>const</code></th></tr></thead><tbody><tr><td>作用域</td><td>函数</td><td>块</td><td>块</td></tr><tr><td>同作用域重复声明</td><td>允许</td><td>语法错误</td><td>语法错误</td></tr><tr><td>声明前访问</td><td><code>undefined</code></td><td><code>ReferenceError</code></td><td><code>ReferenceError</code></td></tr><tr><td>经典脚本顶层</td><td>成为 <code>window</code> 属性</td><td>不会</td><td>不会</td></tr><tr><td>必须初始化</td><td>否</td><td>否</td><td>是</td></tr></tbody></table>
<p><code>var</code> 在经典脚本最外层声明时，会变成 <code>window</code> 的属性，容易和别的脚本互相覆盖。<code>const</code> 声明时必须给初始值，因为之后不能再赋值了。</p>
<h2>常见追问</h2>
<p><strong><code>let x = x</code> 为什么会报错？</strong></p>
<blockquote>
<p>右边读取 <code>x</code> 的时候，左边这个 <code>x</code> 已经存在了，但还没初始化，正处在暂时性死区里，所以抛 <code>ReferenceError</code>。</p>
</blockquote>
<p><strong>ES 模块最外层的 <code>var</code> 会挂到 <code>window</code> 上吗？</strong></p>
<blockquote>
<p>不会。模块有自己的作用域，模块里的顶层变量只属于这个模块。</p>
</blockquote>`};export{e as default};