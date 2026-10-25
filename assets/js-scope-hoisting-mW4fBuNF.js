var e={answerHtml:`<p>理解这三个关键字，最好把两个问题分开：这个名字在哪一块代码里能被找到，以及找到之后现在能不能读取它。作用域决定查找范围，绑定的初始化状态决定是否允许访问。</p>
<p>所谓“声明提升”是对可观察行为的概括，不是浏览器真的把源码中的某一行搬到了文件顶部。更准确的理解是：执行代码前会建立相应的绑定，不同声明采用不同的初始化规则。</p>
<h3>var 已有 undefined，let 还没完成初始化</h3>
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
<p>进入函数执行时，count 的 var 绑定已经建立并初始化为 undefined，所以第一次读取合法，只是还没执行赋值。运行到 <code>var count = 1</code> 时才写入 1，不能把“声明提前可用”理解成“赋值也提前完成”。</p>
<p>score 的词法绑定在这个函数作用域中也已经存在，但到达 let 声明的初始化之前不能访问。从进入相应作用域到完成初始化之间的时段，就叫暂时性死区，也就是 TDZ。</p>
<p><code>let score;</code> 没有显式初始值时，执行到该声明会把绑定初始化为 undefined。从这一刻之后可以正常读取；这与 TDZ 中“不允许访问”是两种状态。</p>
<h3>内层绑定会从一开始遮住外层同名变量</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> value = <span class="hljs-string">&#x27;外层&#x27;</span>;

{
  <span class="hljs-keyword">try</span> {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(value);
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">name</span>); <span class="hljs-comment">// ReferenceError</span>
  }

  <span class="hljs-keyword">let</span> value = <span class="hljs-string">&#x27;内层&#x27;</span>;
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(value); <span class="hljs-comment">// 内层</span>
}
</code></pre></div>
<p>第一处读取不会绕过尚未初始化的内层 value，去找外层的“外层”。名字查找已经命中当前块的绑定，只是这个绑定还在 TDZ 中，所以报错。</p>
<p>这也是为什么“let 完全没有提升”容易造成误解：如果直到声明那一行才有这个局部名字，前面的读取就应当找到外层，但实际并不是这样。描述其块级作用域与初始化限制，比争论“提升”这个口头术语更有用。</p>
<p>TDZ 关注运行时的访问时机，不只是源码文本是否写在上面。可以先定义一个引用变量的函数，只要调用它时相关变量已经完成初始化，就不一定报错；反过来，在初始化表达式中直接读取尚未初始化的自己，例如 <code>let x = x</code>，也会失败。</p>
<h3>typeof 不是对所有未就绪名字都安全</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">typeof</span> aNameThatWasNeverDeclared); <span class="hljs-comment">// undefined</span>

<span class="hljs-keyword">try</span> {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">typeof</span> pending);
  <span class="hljs-keyword">let</span> pending = <span class="hljs-number">1</span>;
} <span class="hljs-keyword">catch</span> (error) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">name</span>); <span class="hljs-comment">// ReferenceError</span>
}
</code></pre></div>
<p>typeof 对一个根本没有解析到绑定的标识符有特殊处理，会返回字符串 <code>undefined</code>。但 pending 是已经存在、还没初始化的词法绑定，仍会触发 TDZ 错误。</p>
<p>所以需要区分三件事：名字根本未声明；名字已声明，当前值是 undefined；名字存在但尚未初始化。它们的读取行为不一样。</p>
<h3>const 固定的是绑定，不是对象的全部内容</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> settings = { <span class="hljs-attr">theme</span>: <span class="hljs-string">&#x27;light&#x27;</span> };
settings.<span class="hljs-property">theme</span> = <span class="hljs-string">&#x27;dark&#x27;</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(settings.<span class="hljs-property">theme</span>); <span class="hljs-comment">// dark</span>

<span class="hljs-keyword">try</span> {
  settings = { <span class="hljs-attr">theme</span>: <span class="hljs-string">&#x27;light&#x27;</span> };
} <span class="hljs-keyword">catch</span> (error) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">name</span>); <span class="hljs-comment">// TypeError</span>
}
</code></pre></div>
<p>第一步修改对象的属性，settings 仍然指向同一个对象；第二步试图让这个名字指向另一个对象，是对 const 绑定重新赋值，因此失败。</p>
<p>普通 const 声明需要提供初始化值，但 for...of、for...in 的声明头会按迭代规则给绑定赋值，例如 <code>for (const item of items)</code> 是合法写法。const 与 let 一样具有块级作用域，也有 TDZ。</p>
<p>若需要限制对象被修改，Object.freeze 等机制是另一个层面；浅冻结也不会自动递归冻结所有嵌套对象。不要把 const 解释成通用的深度不可变数据。</p>
<h3>循环回调读到的是哪个绑定</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> fromVar = [];
<span class="hljs-keyword">for</span> (<span class="hljs-keyword">var</span> i = <span class="hljs-number">0</span>; i &lt; <span class="hljs-number">3</span>; i++) {
  fromVar.<span class="hljs-title function_">push</span>(<span class="hljs-function">() =&gt;</span> i);
}

<span class="hljs-keyword">const</span> fromLet = [];
<span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> j = <span class="hljs-number">0</span>; j &lt; <span class="hljs-number">3</span>; j++) {
  fromLet.<span class="hljs-title function_">push</span>(<span class="hljs-function">() =&gt;</span> j);
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(fromVar.<span class="hljs-title function_">map</span>(<span class="hljs-function"><span class="hljs-params">read</span> =&gt;</span> <span class="hljs-title function_">read</span>()).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 3,3,3</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(fromLet.<span class="hljs-title function_">map</span>(<span class="hljs-function"><span class="hljs-params">read</span> =&gt;</span> <span class="hljs-title function_">read</span>()).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 0,1,2</span>
</code></pre></div>
<p>这里没有计时器，仍然能看到同样的问题。var 的回调共享同一个 i，循环结束时它是 3；for 循环头里的 let 会为迭代提供独立的绑定，回调分别访问各自的 j。</p>
<p>因此关键不是“异步函数把值改错了”，而是多个函数究竟引用同一个绑定，还是不同绑定。把回调放进定时器只会让这种差异在更晚的时间暴露出来。</p>
<h3>作用域和环境还要限定清楚</h3>
<p>函数内部的 var 不受普通 if、for 块限制，let、const 则由相应词法块限定。var 在同一函数中可以重复声明同名变量，let、const 在同一作用域中的重复声明通常是语法错误；内外两个不同作用域的同名声明则可以形成遮蔽。</p>
<p>浏览器经典脚本的顶层 var 常与全局对象属性相关，顶层 let、const 则不会因此成为 window 属性。ES 模块的顶层声明属于模块作用域，不能再套用经典脚本的全局规则。不同宿主与模块封装也会影响观察结果，所以示例讨论提升时使用函数作用域更清楚。</p>
<p>函数声明与函数表达式也不同：函数作用域内的普通函数声明通常能在其文本位置之前调用，而 <code>var fn = function () {}</code> 前面读取到的仍只是尚未赋值的变量。块级函数还涉及严格模式、模块与旧式兼容规则，不应把一个环境中的偶发现象推广为全部情况。</p>`};export{e as default};