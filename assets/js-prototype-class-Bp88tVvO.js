var e={answerHtml:`<h2>简答</h2>
<ul>
<li>每个对象有内部原型 <code>[[Prototype]]</code>，用 <code>Object.getPrototypeOf</code> 读取；读属性先找自身，再沿原型链找，直到 <code>null</code>。</li>
<li><code>Fn.prototype</code> 是构造函数上的普通属性，<code>new Fn()</code> 创建的实例以它为原型；两者不是一回事。</li>
<li>class 的方法定义在 <code>prototype</code> 上供实例共享，<code>static</code> 成员挂在构造函数上；<code>extends</code> 让子类 prototype 和子类构造函数分别继承父类的对应对象。</li>
<li>派生类构造函数必须先调用 <code>super()</code> 才能使用 <code>this</code>。</li>
<li><code>#x</code> 私有字段是每个实例自己的，但只能在类体内访问，不走原型查找，也不能用 <code>obj[&#x27;#x&#x27;]</code> 读取。</li>
</ul>
<h2>实例状态与共享方法</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">class</span> <span class="hljs-title class_">Counter</span> {
  <span class="hljs-title function_">constructor</span>(<span class="hljs-params">value = <span class="hljs-number">0</span></span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">value</span> = value;
  }

  <span class="hljs-title function_">increment</span>(<span class="hljs-params"></span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">value</span> += <span class="hljs-number">1</span>;
    <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>.<span class="hljs-property">value</span>;
  }

  <span class="hljs-keyword">static</span> <span class="hljs-title function_">from</span>(<span class="hljs-params">value</span>) {
    <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Counter</span>(value);
  }
}

<span class="hljs-keyword">const</span> first = <span class="hljs-title class_">Counter</span>.<span class="hljs-title function_">from</span>(<span class="hljs-number">1</span>);
<span class="hljs-keyword">const</span> second = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Counter</span>(<span class="hljs-number">5</span>);

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">getPrototypeOf</span>(first) === <span class="hljs-title class_">Counter</span>.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span>); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">hasOwn</span>(first, <span class="hljs-string">&#x27;value&#x27;</span>)); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">hasOwn</span>(first, <span class="hljs-string">&#x27;increment&#x27;</span>)); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(first.<span class="hljs-property">increment</span> === second.<span class="hljs-property">increment</span>); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(first.<span class="hljs-title function_">increment</span>()); <span class="hljs-comment">// 2</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(second.<span class="hljs-property">value</span>); <span class="hljs-comment">// 5</span>
</code></pre></div>
<p>查找链是 <code>first → Counter.prototype → Object.prototype → null</code>。<code>increment</code> 来自原型，但调用时 <code>this</code> 仍是 <code>first</code>。<code>from</code> 属于 <code>Counter</code> 本身，<code>first.from</code> 不存在。</p>
<h2>写入会遮蔽原型属性</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> defaults = { <span class="hljs-attr">theme</span>: <span class="hljs-string">&#x27;light&#x27;</span> };
<span class="hljs-keyword">const</span> settings = <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">create</span>(defaults);

settings.<span class="hljs-property">theme</span> = <span class="hljs-string">&#x27;dark&#x27;</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(defaults.<span class="hljs-property">theme</span>); <span class="hljs-comment">// light</span>
<span class="hljs-keyword">delete</span> settings.<span class="hljs-property">theme</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(settings.<span class="hljs-property">theme</span>); <span class="hljs-comment">// light</span>
</code></pre></div>
<p>给继承来的数据属性赋值，会在对象自身新建属性，原型不变。例外：原型上是 setter 时调用 setter，原型上是只读属性时赋值失败（严格模式抛错）。<code>Object.hasOwn</code> 只看自身，<code>in</code> 包含原型链。</p>
<h2>extends 做了什么</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">class</span> <span class="hljs-title class_">User</span> {
  <span class="hljs-title function_">constructor</span>(<span class="hljs-params">name</span>) { <span class="hljs-variable language_">this</span>.<span class="hljs-property">name</span> = name; }
  <span class="hljs-title function_">describe</span>(<span class="hljs-params"></span>) { <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>.<span class="hljs-property">name</span>; }
}

<span class="hljs-keyword">class</span> <span class="hljs-title class_">Student</span> <span class="hljs-keyword">extends</span> <span class="hljs-title class_ inherited__">User</span> {
  <span class="hljs-title function_">constructor</span>(<span class="hljs-params">name, course</span>) {
    <span class="hljs-variable language_">super</span>(name);
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">course</span> = course;
  }
  <span class="hljs-title function_">describe</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">return</span> <span class="hljs-string">\`<span class="hljs-subst">\${<span class="hljs-variable language_">super</span>.describe()}</span>：<span class="hljs-subst">\${<span class="hljs-variable language_">this</span>.course}</span>\`</span>;
  }
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">getPrototypeOf</span>(<span class="hljs-title class_">Student</span>.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span>) === <span class="hljs-title class_">User</span>.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span>); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">getPrototypeOf</span>(<span class="hljs-title class_">Student</span>) === <span class="hljs-title class_">User</span>); <span class="hljs-comment">// true</span>
</code></pre></div>
<p>第一条链让实例方法可以继承，第二条链让静态方法可以继承。<code>super.describe()</code> 调用父类方法，<code>this</code> 仍是当前实例。</p>
<h2>class 与构造函数写法的区别</h2>
<ul>
<li>类体默认严格模式。</li>
<li>不能不带 <code>new</code> 调用，否则抛 <code>TypeError</code>。</li>
<li>类声明有 TDZ，不能在声明前使用。</li>
<li>方法不可枚举，<code>for...in</code> 不会列出。</li>
<li>类字段（<code>count = 0</code>、<code>handle = () =&gt; {}</code>）在构造时成为实例自身属性，每个实例一份。</li>
</ul>
<h2>instanceof</h2>
<p><code>a instanceof B</code> 检查 <code>B.prototype</code> 是否在 <code>a</code> 的原型链上，可被 <code>Symbol.hasInstance</code> 自定义。不同 iframe 的 <code>Array.prototype</code> 不同，判断数组用 <code>Array.isArray</code>。</p>
<h2>常见追问</h2>
<ul>
<li>手写 <code>new</code> 做了什么？以 <code>Fn.prototype</code> 为原型创建对象，用它作 <code>this</code> 调用 <code>Fn</code>，如果返回的是对象则用返回值，否则返回新对象。</li>
<li>为什么不建议修改 <code>__proto__</code>？它是历史兼容接口，运行时改原型会让引擎优化失效；创建时用 <code>Object.create</code> 指定原型。</li>
<li>继承和组合怎么选？继承适合稳定的&quot;是一种&quot;关系，层级深了会难以维护，仅为复用代码时优先组合。</li>
</ul>`};export{e as default};