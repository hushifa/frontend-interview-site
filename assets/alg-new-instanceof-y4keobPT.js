var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>写 <code>new Person(&#x27;小明&#x27;)</code> 时，引擎做了四件事：创建一个空对象；把这个对象的原型指向 <code>Person.prototype</code>；把它当作 <code>this</code> 调用 <code>Person</code>；如果 <code>Person</code> 返回了一个对象，就用这个返回值，否则返回刚才创建的对象。手写时用 <code>Object.create(Fn.prototype)</code> 一步完成前两件事，再用 <code>apply</code> 调用构造函数。</p>
<p><code>a instanceof B</code> 判断的是 <code>B.prototype</code> 在不在 <code>a</code> 的原型链上。手写就是一个循环：从 <code>Object.getPrototypeOf(a)</code> 开始往上走，遇到 <code>B.prototype</code> 返回 <code>true</code>，走到 <code>null</code> 还没遇到就返回 <code>false</code>。</p>
<p>这两个手写版本都是教学用的。真正的 <code>new</code> 还会检查目标能不能被构造，比如箭头函数和 class 有不同的规则；真正的 <code>instanceof</code> 会先看右边有没有 <code>Symbol.hasInstance</code>。</p>
<p>要注意，<code>instanceof</code> 依赖原型链，所以跨 iframe 的数组会判断失败，原型也能被手动改掉。判断数组用 <code>Array.isArray</code> 更可靠。</p>
</blockquote>
<h2>手写 new</h2>
<p>先看 <code>new</code> 的完整过程，再对照代码。下面的 <code>myNew</code> 接收一个构造函数和参数，返回和 <code>new</code> 一样的结果。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">myNew</span>(<span class="hljs-params">Fn, ...args</span>) {
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> <span class="hljs-title class_">Fn</span> !== <span class="hljs-string">&#x27;function&#x27;</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;Fn 必须是函数&#x27;</span>);
  <span class="hljs-comment">// prototype 不是对象时，新对象的原型退回 Object.prototype，和原生 new 一致</span>
  <span class="hljs-keyword">const</span> proto = <span class="hljs-title class_">Fn</span>.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span> !== <span class="hljs-literal">null</span> &amp;&amp; <span class="hljs-keyword">typeof</span> <span class="hljs-title class_">Fn</span>.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span> === <span class="hljs-string">&#x27;object&#x27;</span>
    ? <span class="hljs-title class_">Fn</span>.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span>
    : <span class="hljs-title class_">Object</span>.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span>;
  <span class="hljs-keyword">const</span> instance = <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">create</span>(proto);
  <span class="hljs-keyword">const</span> result = <span class="hljs-title class_">Fn</span>.<span class="hljs-title function_">apply</span>(instance, args);
  <span class="hljs-keyword">const</span> isObject = result !== <span class="hljs-literal">null</span> &amp;&amp; (<span class="hljs-keyword">typeof</span> result === <span class="hljs-string">&#x27;object&#x27;</span> || <span class="hljs-keyword">typeof</span> result === <span class="hljs-string">&#x27;function&#x27;</span>);
  <span class="hljs-keyword">return</span> isObject ? result : instance;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">Person</span>(<span class="hljs-params">name</span>) {
  <span class="hljs-variable language_">this</span>.<span class="hljs-property">name</span> = name;
}
<span class="hljs-title class_">Person</span>.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span>.<span class="hljs-property">greet</span> = <span class="hljs-keyword">function</span> (<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-string">\`你好，我是<span class="hljs-subst">\${<span class="hljs-variable language_">this</span>.name}</span>\`</span>;
};

<span class="hljs-keyword">function</span> <span class="hljs-title function_">Box</span>(<span class="hljs-params"></span>) {
  <span class="hljs-variable language_">this</span>.<span class="hljs-property">value</span> = <span class="hljs-number">1</span>;
  <span class="hljs-keyword">return</span> { <span class="hljs-attr">value</span>: <span class="hljs-number">2</span> };
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">Num</span>(<span class="hljs-params"></span>) {
  <span class="hljs-variable language_">this</span>.<span class="hljs-property">value</span> = <span class="hljs-number">1</span>;
  <span class="hljs-keyword">return</span> <span class="hljs-number">42</span>;
}

<span class="hljs-keyword">const</span> p = <span class="hljs-title function_">myNew</span>(<span class="hljs-title class_">Person</span>, <span class="hljs-string">&#x27;小明&#x27;</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(p.<span class="hljs-title function_">greet</span>()); <span class="hljs-comment">// 你好，我是小明</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(p <span class="hljs-keyword">instanceof</span> <span class="hljs-title class_">Person</span>); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">myNew</span>(<span class="hljs-title class_">Box</span>).<span class="hljs-property">value</span>); <span class="hljs-comment">// 2</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">myNew</span>(<span class="hljs-title class_">Num</span>).<span class="hljs-property">value</span>); <span class="hljs-comment">// 1</span>
</code></pre></div>
<p><code>p.greet()</code> 能调用，是因为 <code>Object.create(proto)</code> 创建的对象，原型就是 <code>Person.prototype</code>，<code>greet</code> 定义在那里。<code>Fn.apply(instance, args)</code> 让构造函数里的 <code>this</code> 指向这个新对象，所以 <code>this.name = name</code> 写进的是 <code>p</code> 自己。</p>
<p>为什么 <code>Box</code> 得到的是 2，<code>Num</code> 得到的是 1？因为构造函数返回值的规则只认对象。<code>Box</code> 返回了一个对象，这个对象就替代了新创建的实例；<code>Num</code> 返回的是数字 42，原始值会被忽略，结果还是新创建的那个实例。判断时函数也算对象，所以 <code>typeof result === &#x27;function&#x27;</code> 也要算进去。</p>
<h2>手写 instanceof</h2>
<p><code>instanceof</code> 不关心对象是怎么创建的，只顺着原型链往上找。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">myInstanceof</span>(<span class="hljs-params">value, Ctor</span>) {
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> <span class="hljs-title class_">Ctor</span> !== <span class="hljs-string">&#x27;function&#x27;</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;右侧必须是函数&#x27;</span>);
  <span class="hljs-comment">// 原始值没有原型链，原生 instanceof 对它们直接返回 false</span>
  <span class="hljs-keyword">if</span> (value === <span class="hljs-literal">null</span> || (<span class="hljs-keyword">typeof</span> value !== <span class="hljs-string">&#x27;object&#x27;</span> &amp;&amp; <span class="hljs-keyword">typeof</span> value !== <span class="hljs-string">&#x27;function&#x27;</span>)) {
    <span class="hljs-keyword">return</span> <span class="hljs-literal">false</span>;
  }
  <span class="hljs-keyword">const</span> target = <span class="hljs-title class_">Ctor</span>.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span>;
  <span class="hljs-keyword">let</span> proto = <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">getPrototypeOf</span>(value);
  <span class="hljs-keyword">while</span> (proto !== <span class="hljs-literal">null</span>) {
    <span class="hljs-keyword">if</span> (proto === target) <span class="hljs-keyword">return</span> <span class="hljs-literal">true</span>;
    proto = <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">getPrototypeOf</span>(proto);
  }
  <span class="hljs-keyword">return</span> <span class="hljs-literal">false</span>;
}

<span class="hljs-keyword">class</span> <span class="hljs-title class_">Animal</span> {}
<span class="hljs-keyword">class</span> <span class="hljs-title class_">Dog</span> <span class="hljs-keyword">extends</span> <span class="hljs-title class_ inherited__">Animal</span> {}
<span class="hljs-keyword">const</span> dog = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Dog</span>();

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">myInstanceof</span>(dog, <span class="hljs-title class_">Dog</span>)); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">myInstanceof</span>(dog, <span class="hljs-title class_">Animal</span>)); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">myInstanceof</span>(dog, <span class="hljs-title class_">Array</span>)); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">myInstanceof</span>(<span class="hljs-number">1</span>, <span class="hljs-title class_">Number</span>)); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">myInstanceof</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">create</span>(<span class="hljs-literal">null</span>), <span class="hljs-title class_">Object</span>)); <span class="hljs-comment">// false</span>
</code></pre></div>
<p><code>dog</code> 的原型链是 <code>Dog.prototype → Animal.prototype → Object.prototype → null</code>。找 <code>Animal</code> 时，第一步遇到 <code>Dog.prototype</code> 不是，第二步遇到 <code>Animal.prototype</code>，返回 <code>true</code>。</p>
<p><code>myInstanceof(1, Number)</code> 为什么是 <code>false</code>？数字 1 是原始值，原生的 <code>1 instanceof Number</code> 也是 <code>false</code>，它不会先把 1 包装成对象。<code>Object.create(null)</code> 创建的对象没有原型，循环一开始就走到 <code>null</code>，所以连 <code>Object</code> 都不是。</p>
<h2>手写版本和原生有哪些差距</h2>
<p>手写的 <code>myNew</code> 只检查了参数是不是函数。原生 <code>new</code> 检查的是函数能不能被构造：箭头函数、对象方法简写都不能 <code>new</code>，会抛 <code>TypeError</code>，<code>myNew</code> 却会照常调用它们。反过来，class 必须用 <code>new</code> 调用，<code>Fn.apply</code> 调用 class 会直接抛错，所以 <code>myNew</code> 不能处理 class。要完整模拟，可以改用 <code>Reflect.construct(Fn, args)</code>，但那样就等于直接调用了原生的构造流程。</p>
<p>手写的 <code>myInstanceof</code> 没有处理 <code>Symbol.hasInstance</code>。原生 <code>instanceof</code> 会先看右边有没有这个方法，有就调用它决定结果，所以类可以自定义 <code>instanceof</code> 的判断逻辑。</p>
<h2>常见追问</h2>
<p><strong>为什么跨 iframe 的数组 instanceof Array 是 false？</strong></p>
<blockquote>
<p>每个 iframe 有自己的一套全局对象，也就有自己的 <code>Array.prototype</code>。从别的 iframe 传过来的数组，原型链上是那个 iframe 的 <code>Array.prototype</code>，跟当前页面的不是同一个对象，所以找不到。判断数组用 <code>Array.isArray</code>，它不依赖原型链。</p>
</blockquote>
<p><strong>构造函数里 return 一个原始值会怎样？</strong></p>
<blockquote>
<p>会被忽略，<code>new</code> 还是返回新创建的实例。只有返回对象（包括函数）时，才会替代新实例。</p>
</blockquote>
<p><strong>Object.create 和 new 有什么区别？</strong></p>
<blockquote>
<p><code>Object.create(proto)</code> 只创建一个原型是 <code>proto</code> 的空对象，不调用任何构造函数。<code>new Fn()</code> 除了设置原型，还会调用 <code>Fn</code> 初始化这个对象。所以手写 <code>new</code> 时用 <code>Object.create</code> 处理原型，再自己调用构造函数。</p>
</blockquote>`};export{e as default};