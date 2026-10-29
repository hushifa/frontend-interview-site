var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>每个对象都有一个内部原型，写作 <code>[[Prototype]]</code>，可以用 <code>Object.getPrototypeOf</code> 读到。读一个属性时，先在对象自己身上找，找不到就去原型上找，再找不到就去原型的原型上找，一直到 <code>null</code>，这条路线就是原型链。</p>
<p>容易混的是 <code>Fn.prototype</code>。它只是构造函数上一个普通的属性，用 <code>new Fn()</code> 创建的实例，会把它当成自己的原型。所以函数的 <code>prototype</code> 属性和对象的内部原型不是一回事。</p>
<p>class 就是在原型上搭起来的。方法定义在 <code>prototype</code> 上，所有实例共用一份；<code>static</code> 成员挂在构造函数本身上。<code>extends</code> 会连两条链：子类的 <code>prototype</code> 连到父类的 <code>prototype</code>，子类构造函数连到父类构造函数。子类构造函数里必须先调用 <code>super()</code>，才能用 <code>this</code>。</p>
<p>class 还带来了原型之外的规则，比如私有字段 <code>#x</code>。它是每个实例自己的，但只能在类的内部访问，不走原型查找，也不能用 <code>obj[&#x27;#x&#x27;]</code> 读到。</p>
</blockquote>
<h2>方法在实例上还是在原型上</h2>
<p>下面定义一个计数器类，然后检查实例自己有哪些属性，方法又是从哪来的。</p>
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
<p><code>value</code> 是 <code>first</code> 自己的属性，因为它是在构造函数里用 <code>this.value</code> 赋值的。<code>increment</code> 却不是 <code>first</code> 自己的，可 <code>first.increment()</code> 照样能调用。</p>
<p>因为 <code>first</code> 的原型是 <code>Counter.prototype</code>，<code>increment</code> 就定义在那里。<code>first</code> 身上找不到，就沿原型链找到了。查找路线是 <code>first → Counter.prototype → Object.prototype → null</code>。两个实例用的是同一个 <code>increment</code> 函数，所以 <code>first.increment === second.increment</code>。</p>
<p>方法虽然来自原型，调用时 <code>this</code> 还是 <code>first</code>，所以改的是 <code>first</code> 自己的 <code>value</code>，<code>second.value</code> 还是 5。<code>static</code> 方法 <code>from</code> 挂在 <code>Counter</code> 本身上，实例访问 <code>first.from</code> 是找不到的。</p>
<h2>给对象赋值会改到原型吗</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> defaults = { <span class="hljs-attr">theme</span>: <span class="hljs-string">&#x27;light&#x27;</span> };
<span class="hljs-keyword">const</span> settings = <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">create</span>(defaults);

settings.<span class="hljs-property">theme</span> = <span class="hljs-string">&#x27;dark&#x27;</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(defaults.<span class="hljs-property">theme</span>); <span class="hljs-comment">// light</span>
<span class="hljs-keyword">delete</span> settings.<span class="hljs-property">theme</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(settings.<span class="hljs-property">theme</span>); <span class="hljs-comment">// light</span>
</code></pre></div>
<p><code>settings.theme</code> 本来是从 <code>defaults</code> 继承的。给它赋值 <code>&#x27;dark&#x27;</code> 以后，<code>defaults.theme</code> 还是 <code>&#x27;light&#x27;</code>，原型没变。</p>
<p>因为赋值不会去改原型，而是在 <code>settings</code> 自己身上新建一个 <code>theme</code>，把原型上的那个挡住了，这叫遮蔽。删掉自己的 <code>theme</code> 以后，挡着的东西没了，读到的又是原型上的 <code>&#x27;light&#x27;</code>。</p>
<p>有两个例外。原型上的属性如果是 setter，赋值会调用这个 setter；原型上的属性如果是只读的，赋值会失败，严格模式下还会抛错。判断属性在哪里时，<code>Object.hasOwn</code> 只看自己，<code>in</code> 会连原型链一起看。</p>
<h2>extends 连了哪两条链</h2>
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
<p>第一条链让 <code>Student.prototype</code> 的原型指向 <code>User.prototype</code>，所以学生实例能用到 <code>User</code> 的实例方法。第二条链让 <code>Student</code> 构造函数的原型指向 <code>User</code>，所以 <code>User</code> 上的静态方法，<code>Student</code> 也能直接调用。</p>
<p>子类重写 <code>describe</code> 后，用 <code>super.describe()</code> 可以调用父类的版本，这时 <code>this</code> 仍然是当前这个学生实例。</p>
<h2>class 和构造函数写法有什么区别</h2>
<p>既然 class 建立在原型上，那它和以前的构造函数写法是不是完全一样？不是，它多了一些规则。</p>
<p>类的内部默认是严格模式。类不能不带 <code>new</code> 直接调用，否则抛 <code>TypeError</code>。类声明有暂时性死区，不能在声明之前使用。类的方法是不可枚举的，<code>for...in</code> 不会把它们列出来。</p>
<p>还有类字段，比如 <code>count = 0</code> 或 <code>handle = () =&gt; {}</code>。它们和方法不同，不在原型上，而是在创建实例时成为实例自己的属性，每个实例各有一份。</p>
<h2>instanceof 是怎么判断的</h2>
<p><code>a instanceof B</code> 检查的是：<code>B.prototype</code> 在不在 <code>a</code> 的原型链上。这个行为可以用 <code>Symbol.hasInstance</code> 自定义。</p>
<p>因为它依赖原型，所以跨 iframe 时会出问题。不同 iframe 有各自的 <code>Array.prototype</code>，从别的 iframe 传过来的数组，<code>instanceof Array</code> 会是 <code>false</code>。判断数组要用 <code>Array.isArray</code>。</p>
<h2>常见追问</h2>
<p><strong><code>new</code> 做了哪些事？</strong></p>
<blockquote>
<p>先创建一个新对象，它的原型是 <code>Fn.prototype</code>。然后把这个对象当作 <code>this</code> 调用 <code>Fn</code>。如果 <code>Fn</code> 返回了一个对象，就用这个返回值，否则返回新创建的对象。</p>
</blockquote>
<p><strong>为什么不建议修改 <code>__proto__</code>？</strong></p>
<blockquote>
<p><code>__proto__</code> 是为了兼容老代码保留的接口。运行时修改对象的原型，会让引擎之前做的优化失效。需要指定原型时，在创建对象时就用 <code>Object.create</code> 指定。</p>
</blockquote>
<p><strong>继承和组合怎么选？</strong></p>
<blockquote>
<p>继承适合稳定的“是一种”关系，比如学生是一种用户。层级一深就很难维护，如果只是想复用一段代码，优先用组合，把功能做成独立的对象或函数拿来用。</p>
</blockquote>`};export{e as default};