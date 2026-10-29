var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>继承要做到两件事：子类实例有自己的一份父类属性，比如每只狗有自己的 <code>name</code> 和 <code>tags</code>；子类实例能用父类原型上的方法，比如 <code>eat</code>。ES5 的几种继承方式，就是围绕这两件事一步步改进的。</p>
<p>原型链继承是 <code>Child.prototype = new Parent()</code>，方法能用了，可是父类的属性挂在子类原型上，被所有实例共享，一只狗往 <code>tags</code> 里加东西，所有狗都变了。构造函数继承是在子类构造函数里 <code>Parent.call(this)</code>，每个实例有了自己的属性，可是父类原型上的方法拿不到。组合继承把两者合起来，属性和方法都对了，但父类构造函数被调用了两次，子类原型上还多出一份没用的属性。</p>
<p>寄生组合继承把 <code>Child.prototype = new Parent()</code> 换成 <code>Child.prototype = Object.create(Parent.prototype)</code>。<code>Object.create</code> 只创建一个以父类原型为原型的空对象，不执行父类构造函数，于是父构造函数只在 <code>Parent.call(this)</code> 时调用一次，原型链也连上了。再把 <code>constructor</code> 指回子类，就是 ES5 里最完整的写法。</p>
<p>要注意，现在直接用 <code>class</code> 和 <code>extends</code>，它在原型链上的效果和寄生组合继承一致，还额外连上了构造函数之间的原型链，让子类能继承父类的静态方法。</p>
</blockquote>
<h2>前几种写法各有什么问题</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">Animal</span>(<span class="hljs-params">name</span>) {
  <span class="hljs-variable language_">this</span>.<span class="hljs-property">name</span> = name;
  <span class="hljs-variable language_">this</span>.<span class="hljs-property">tags</span> = [];
}
<span class="hljs-title class_">Animal</span>.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span>.<span class="hljs-property">eat</span> = <span class="hljs-keyword">function</span> (<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-string">\`<span class="hljs-subst">\${<span class="hljs-variable language_">this</span>.name}</span> 在吃\`</span>;
};

<span class="hljs-comment">// 原型链继承</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">Dog1</span>(<span class="hljs-params"></span>) {}
<span class="hljs-title class_">Dog1</span>.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span> = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Animal</span>(<span class="hljs-string">&#x27;默认&#x27;</span>);
<span class="hljs-keyword">const</span> a = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Dog1</span>();
<span class="hljs-keyword">const</span> b = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Dog1</span>();
a.<span class="hljs-property">tags</span>.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;黑色&#x27;</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(b.<span class="hljs-property">tags</span>); <span class="hljs-comment">// [&#x27;黑色&#x27;]，被共享了</span>

<span class="hljs-comment">// 构造函数继承</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">Dog2</span>(<span class="hljs-params">name</span>) {
  <span class="hljs-title class_">Animal</span>.<span class="hljs-title function_">call</span>(<span class="hljs-variable language_">this</span>, name);
}
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">typeof</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Dog2</span>(<span class="hljs-string">&#x27;小黑&#x27;</span>).<span class="hljs-property">eat</span>); <span class="hljs-comment">// undefined，拿不到原型方法</span>
</code></pre></div>
<p>原型链继承里，<code>tags</code> 只在 <code>new Animal(&#x27;默认&#x27;)</code> 时创建了一次，存在 <code>Dog1.prototype</code> 上。<code>a.tags.push</code> 没有给 <code>a</code> 新建属性，而是沿原型链找到这个共享数组改了它，所以 <code>b.tags</code> 也变了。而且所有实例的 <code>name</code> 都是“默认”，创建子类实例时没法给父类传参。</p>
<p>构造函数继承里，<code>Animal.call(this, name)</code> 把父类的属性赋到了每个实例自己身上，问题解决了。可是 <code>Dog2.prototype</code> 和 <code>Animal.prototype</code> 没有任何联系，<code>eat</code> 自然找不到。</p>
<h2>寄生组合继承</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">Animal</span>(<span class="hljs-params">name</span>) {
  <span class="hljs-variable language_">this</span>.<span class="hljs-property">name</span> = name;
  <span class="hljs-variable language_">this</span>.<span class="hljs-property">tags</span> = [];
}
<span class="hljs-title class_">Animal</span>.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span>.<span class="hljs-property">eat</span> = <span class="hljs-keyword">function</span> (<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-string">\`<span class="hljs-subst">\${<span class="hljs-variable language_">this</span>.name}</span> 在吃\`</span>;
};

<span class="hljs-keyword">function</span> <span class="hljs-title function_">Dog</span>(<span class="hljs-params">name, breed</span>) {
  <span class="hljs-title class_">Animal</span>.<span class="hljs-title function_">call</span>(<span class="hljs-variable language_">this</span>, name);
  <span class="hljs-variable language_">this</span>.<span class="hljs-property">breed</span> = breed;
}
<span class="hljs-title class_">Dog</span>.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span> = <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">create</span>(<span class="hljs-title class_">Animal</span>.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span>);
<span class="hljs-title class_">Dog</span>.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span>.<span class="hljs-property">constructor</span> = <span class="hljs-title class_">Dog</span>;
<span class="hljs-title class_">Dog</span>.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span>.<span class="hljs-property">bark</span> = <span class="hljs-keyword">function</span> (<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-string">\`<span class="hljs-subst">\${<span class="hljs-variable language_">this</span>.name}</span> 汪汪\`</span>;
};

<span class="hljs-keyword">const</span> a = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Dog</span>(<span class="hljs-string">&#x27;小黑&#x27;</span>, <span class="hljs-string">&#x27;柴犬&#x27;</span>);
<span class="hljs-keyword">const</span> b = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Dog</span>(<span class="hljs-string">&#x27;小白&#x27;</span>, <span class="hljs-string">&#x27;柯基&#x27;</span>);
a.<span class="hljs-property">tags</span>.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;黑色&#x27;</span>);

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(b.<span class="hljs-property">tags</span>.<span class="hljs-property">length</span>); <span class="hljs-comment">// 0</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(a.<span class="hljs-title function_">eat</span>()); <span class="hljs-comment">// 小黑 在吃</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(a.<span class="hljs-title function_">bark</span>()); <span class="hljs-comment">// 小黑 汪汪</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(a <span class="hljs-keyword">instanceof</span> <span class="hljs-title class_">Animal</span>); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(a.<span class="hljs-property">constructor</span> === <span class="hljs-title class_">Dog</span>); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">hasOwn</span>(<span class="hljs-title class_">Dog</span>.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span>, <span class="hljs-string">&#x27;name&#x27;</span>)); <span class="hljs-comment">// false</span>
</code></pre></div>
<p><code>b.tags.length</code> 是 0，因为每个实例都通过 <code>Animal.call(this, name)</code> 拿到了自己的 <code>tags</code>。<code>a.eat()</code> 能调用，因为查找路线是 <code>a → Dog.prototype → Animal.prototype</code>，<code>eat</code> 在最后这一层。</p>
<p>最后一行是和组合继承的区别。组合继承写的是 <code>Dog.prototype = new Animal()</code>，这次调用会在 <code>Dog.prototype</code> 上留下一份 <code>name</code> 和 <code>tags</code>，虽然被实例自己的属性挡住用不到，但白白多占内存、多调用一次构造函数。<code>Object.create</code> 不调用构造函数，<code>Dog.prototype</code> 上就干干净净的。</p>
<p>为什么要写 <code>Dog.prototype.constructor = Dog</code>？因为整个原型对象被换掉了，新对象上没有 <code>constructor</code>，沿原型链会找到 <code>Animal</code>。不改的话 <code>a.constructor</code> 是 <code>Animal</code>，依赖它的代码会出错。</p>
<p>原型链本身怎样工作，见<a href="/questions/js-prototype-class/">《原型链、class 和继承之间是什么关系？》</a>。</p>
<h2>常见追问</h2>
<p><strong>class extends 和寄生组合继承完全一样吗？</strong></p>
<blockquote>
<p>实例方法的原型链效果一样。另外 <code>extends</code> 还会执行 <code>Object.setPrototypeOf(Dog, Animal)</code>，让子类构造函数能继承父类的静态方法；子类构造函数里必须先调用 <code>super()</code> 才能用 <code>this</code>；class 也不能不带 <code>new</code> 调用。</p>
</blockquote>
<p><strong>什么是原型式继承和寄生式继承？</strong></p>
<blockquote>
<p>原型式继承就是 <code>Object.create(obj)</code>，以一个现有对象为原型创建新对象，适合简单地复用一个对象。寄生式继承是在原型式继承的基础上，再给新对象添加一些方法后返回。寄生组合继承的名字就来自用这种方式处理原型。</p>
</blockquote>`};export{e as default};