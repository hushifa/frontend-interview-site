var e={answerHtml:`<p>JavaScript 对象可以通过内部原型关联另一个对象。读取一个普通属性时，先找自身有没有这个属性，找不到就到原型上找，再继续沿原型链查找，直到 null。</p>
<p>class 并没有把这套机制换成另一种完全独立的对象系统。它提供清楚的构造与继承语法，让实例共享原型方法，同时也引入了一些不能用“把方法随便赋给 prototype”概括的语义。</p>
<h3>实例拥有状态，原型上共享方法</h3>
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
<p>value 是构造时赋给各实例自身的状态，所以 first 和 second 可以有不同值。increment 是定义在 Counter.prototype 上的共享方法，两次读取通常获得同一个函数对象。</p>
<p>执行 first.increment() 时，虽然方法来自原型，调用接收者仍然是 first，方法里的 this 指向 first。它不会因为“方法写在原型上”就把所有实例的状态都写进 Counter.prototype。</p>
<p>static from 属于 Counter 这个构造函数对象，不属于每个实例。通常可以调用 Counter.from，不能因为它写在同一个 class 中，就假定 first.from 也存在。</p>
<h3>prototype 和内部原型不是一回事</h3>
<p>Counter.prototype 是构造函数对象上的一个普通属性，它提供给实例作为原型的对象。first 的内部原型则是语言维护的关联，可以用 Object.getPrototypeOf(first) 观察。</p>
<p>在本例中，查找关系是：</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">first → Counter.prototype → Object.prototype → null
</code></pre></div>
<p>first 通常没有一个叫 prototype 的自身属性。Counter 作为函数对象也有它自己的内部原型链，那条链和 Counter.prototype 所在的实例原型链不能混为一谈。</p>
<p><code>__proto__</code> 是历史兼容访问方式，日常解释与检查应优先使用 Object.getPrototypeOf、Object.create 等明确接口。没有必要为了修改行为就在运行中频繁重设原型，这还可能影响引擎优化和其他使用者的预期。</p>
<h3>读取继承属性，写入却未必修改原型</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> defaults = { <span class="hljs-attr">theme</span>: <span class="hljs-string">&#x27;light&#x27;</span> };
<span class="hljs-keyword">const</span> settings = <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">create</span>(defaults);

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(settings.<span class="hljs-property">theme</span>); <span class="hljs-comment">// light</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">hasOwn</span>(settings, <span class="hljs-string">&#x27;theme&#x27;</span>)); <span class="hljs-comment">// false</span>

settings.<span class="hljs-property">theme</span> = <span class="hljs-string">&#x27;dark&#x27;</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(settings.<span class="hljs-property">theme</span>); <span class="hljs-comment">// dark</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(defaults.<span class="hljs-property">theme</span>); <span class="hljs-comment">// light</span>

<span class="hljs-keyword">delete</span> settings.<span class="hljs-property">theme</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(settings.<span class="hljs-property">theme</span>); <span class="hljs-comment">// light</span>
</code></pre></div>
<p>这里继承的是一个可写数据属性。赋值在 settings 上建立自身属性，遮住了原型上的同名属性；删除自身属性之后，读取又落回原型。</p>
<p>但“赋值一定创建自身属性”也不够准确：如果原型上有 setter，它可能被调用；只读描述符、不可扩展对象和 Proxy 也会影响结果。读取、赋值、定义属性与删除属性，是不同操作，应结合属性描述符理解。</p>
<p>Object.hasOwn 只检查自身属性，而 <code>in</code> 会检查原型链上是否存在属性。使用来自外部的数据时，区分这两种意图很重要，不能把继承来的名字都当成数据自身字段。</p>
<h3>extends 建立两层相关继承关系</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">class</span> <span class="hljs-title class_">User</span> {
  <span class="hljs-title function_">constructor</span>(<span class="hljs-params">name</span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">name</span> = name;
  }
  <span class="hljs-title function_">describe</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>.<span class="hljs-property">name</span>;
  }
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

<span class="hljs-keyword">const</span> student = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Student</span>(<span class="hljs-string">&#x27;小林&#x27;</span>, <span class="hljs-string">&#x27;CSS&#x27;</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">getPrototypeOf</span>(<span class="hljs-title class_">Student</span>.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span>) === <span class="hljs-title class_">User</span>.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span>); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">getPrototypeOf</span>(<span class="hljs-title class_">Student</span>) === <span class="hljs-title class_">User</span>); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(student.<span class="hljs-title function_">describe</span>()); <span class="hljs-comment">// 小林：CSS</span>
</code></pre></div>
<p>Student.prototype 关联到 User.prototype，让实例方法沿这条链查找；Student 构造函数对象自身也关联到 User，因此静态成员可以沿相应链继承。它不是把父类方法全部复制一份放进子类实例。</p>
<p>派生类构造函数中通常需要先调用 super() 初始化 this，之后才能使用 this。super.describe() 查找父级相应方法，但调用时仍使用当前实例作为接收者，所以可以读取 student 的 name。</p>
<p>方法里的 super 依据方法定义时的所属对象关系解析，不是一个可以随意替换为 this.<strong>proto</strong> 的缩写。把方法复制到其他对象上，也不一定改变其 super 的查找起点。</p>
<h3>class 还有哪些需要记住的语义</h3>
<p>类体中的代码默认严格模式，类不能不带 new 当普通函数调用，类声明也不能像普通函数声明那样在初始化前直接使用。原型方法通常是不可枚举的，所以与简单赋值创建方法的属性描述符也可能不同。</p>
<p>实例字段属于实例自身。类字段箭头函数通常每个实例各有一份，适合固定实例 this 的回调，但不能再把它当成所有实例共享的同一个原型函数。</p>
<p><code>#private</code> 元素不是普通字符串属性，不能通过 obj[&#x27;#name&#x27;] 访问，也不走一般的原型属性查找。调用涉及私有元素的方法时，还需要接收者具备正确的私有品牌；复制普通属性或伪造相同原型，都不等于完成了类的初始化。</p>
<h3>instanceof 和继承设计的边界</h3>
<p>普通情况下，instanceof 会沿对象原型链检查构造函数的 prototype 是否在其中；Symbol.hasInstance 可以自定义行为，因此它也不是不可改变的类型判定。</p>
<p>跨窗口、iframe 等不同 realm 时，各自的 Array.prototype 不同，一个真实数组可能不满足当前窗口的 <code>value instanceof Array</code>。判断数组应优先使用 Array.isArray，而不是把原型关系测试当成所有业务类型的唯一依据。</p>
<p>继承适合稳定的“是一种”关系，但层次太深会让行为分散、重写规则复杂。仅仅为了复用几段逻辑，组合对象或普通函数常常更直观。理解原型链，是为了知道共享、覆盖和查找实际发生在哪里，而不是鼓励给所有代码都建立一条长继承链。</p>`};export{e as default};