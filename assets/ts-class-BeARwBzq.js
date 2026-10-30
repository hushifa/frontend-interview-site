var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如写一个 <code>Account</code> 类，账户名谁都能看，余额只给子类改，密码只在类里面用。TypeScript 用三个修饰符表达：<code>public</code> 是默认值，哪里都能访问；<code>protected</code> 只能在这个类和它的子类里访问；<code>private</code> 连子类都不行，只能在声明它的类里访问。</p>
<p>要注意 <code>private</code> 和 JavaScript 的 <code>#</code> 私有字段不一样。Handbook 说明，<code>private</code> 和 <code>protected</code> 只在类型检查时生效，编译后就是普通属性，而且类型检查时也允许用 <code>obj[&#x27;pin&#x27;]</code> 这种方括号写法访问，所以叫“软私有”。<code>#token</code> 是 JavaScript 语言本身的私有字段，编译以后外部依然访问不到，是“硬私有”。需要真正藏起数据时用 <code>#</code>。</p>
<p>还有几个常用写法。<code>readonly</code> 属性只能在声明时或构造函数里赋值。参数属性是在构造函数参数前加 <code>public</code>、<code>private</code>、<code>protected</code> 或 <code>readonly</code>，TypeScript 会自动声明同名属性并把参数赋给它，省去重复的样板代码。<code>abstract</code> 类不能直接 <code>new</code>，里面的抽象方法没有实现，必须由子类实现。</p>
<p><code>extends</code> 和 <code>implements</code> 的区别是：<code>extends</code> 继承父类的实现，一个类只能继承一个父类；<code>implements</code> 只检查这个类有没有满足接口的要求，可以同时实现多个接口。Handbook 特别提醒，<code>implements</code> 不会改变类的类型，方法参数也不会因此得到接口里的类型，仍要自己写注解。</p>
</blockquote>
<h2>四种访问控制</h2>
<p>下面的代码用 <code>tsc --strict --target es2022</code> 验证过（TypeScript 7.0.2），每个 <code>@ts-expect-error</code> 后面写的是实际报出的错误码。</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">class</span> <span class="hljs-title class_">Account</span> {
  <span class="hljs-keyword">public</span> <span class="hljs-attr">owner</span>: <span class="hljs-built_in">string</span>;
  <span class="hljs-keyword">protected</span> balance = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">private</span> <span class="hljs-attr">pin</span>: <span class="hljs-built_in">string</span>;
  #token = <span class="hljs-string">&#x27;secret&#x27;</span>;
  <span class="hljs-keyword">readonly</span> <span class="hljs-attr">createdAt</span>: <span class="hljs-built_in">number</span>;

  <span class="hljs-title function_">constructor</span>(<span class="hljs-params"><span class="hljs-attr">owner</span>: <span class="hljs-built_in">string</span>, <span class="hljs-attr">pin</span>: <span class="hljs-built_in">string</span></span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">owner</span> = owner;
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">pin</span> = pin;
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">createdAt</span> = <span class="hljs-title class_">Date</span>.<span class="hljs-title function_">now</span>();
  }

  <span class="hljs-title function_">checkPin</span>(<span class="hljs-params"><span class="hljs-attr">input</span>: <span class="hljs-built_in">string</span></span>) {
    <span class="hljs-keyword">return</span> input === <span class="hljs-variable language_">this</span>.<span class="hljs-property">pin</span> &amp;&amp; <span class="hljs-variable language_">this</span>.#token.<span class="hljs-property">length</span> &gt; <span class="hljs-number">0</span>;
  }
}

<span class="hljs-keyword">class</span> <span class="hljs-title class_">Savings</span> <span class="hljs-keyword">extends</span> <span class="hljs-title class_ inherited__">Account</span> {
  <span class="hljs-title function_">addInterest</span>(<span class="hljs-params"></span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">balance</span> += <span class="hljs-number">1</span>;
    <span class="hljs-comment">// @ts-expect-error 2341：private 成员子类也不能访问</span>
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">pin</span>;
  }
}

<span class="hljs-keyword">const</span> a = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Account</span>(<span class="hljs-string">&#x27;Ada&#x27;</span>, <span class="hljs-string">&#x27;1234&#x27;</span>);
<span class="hljs-comment">// @ts-expect-error 2445：protected 只能在类和子类内部访问</span>
a.<span class="hljs-property">balance</span>;
<span class="hljs-comment">// @ts-expect-error 2341：private 只能在类内部访问</span>
a.<span class="hljs-property">pin</span>;
<span class="hljs-keyword">const</span> leaked = a[<span class="hljs-string">&#x27;pin&#x27;</span>];
<span class="hljs-comment">// @ts-expect-error 18013：#token 在类外不可访问</span>
a.#token;
<span class="hljs-comment">// @ts-expect-error 2540：readonly 只能在构造函数里赋值</span>
a.<span class="hljs-property">createdAt</span> = <span class="hljs-number">0</span>;
</code></pre></div>
<p><code>a.pin</code> 报错，可 <code>a[&#x27;pin&#x27;]</code> 却能通过，这就是 Handbook 说的方括号“逃生口”。Handbook 认为这在写单元测试时方便，代价是 <code>private</code> 并没有真正强制私有。编译成 JavaScript 以后，<code>pin</code> 就是实例上的普通属性，<code>Object.keys(a)</code> 能看到它，<code>console.log(a)</code> 也能打印出来。</p>
<p><code>#token</code> 不一样。它是 ES2022 的私有字段，MDN 说明在类外部访问会直接是语法错误，<code>Object.keys</code> 也看不到。TypeScript 编译到 ES2021 及以下时，会用 WeakMap 模拟它，效果仍然是外部访问不到。</p>
<p><code>readonly</code> 只限制赋值的时机：声明处和构造函数里可以赋值，之后就不行了。它和 <code>private</code> 一样只在编译期检查。</p>
<h2>参数属性省掉样板代码</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">class</span> <span class="hljs-title class_">Point</span> {
  <span class="hljs-title function_">constructor</span>(<span class="hljs-params"><span class="hljs-keyword">public</span> <span class="hljs-keyword">readonly</span> <span class="hljs-attr">x</span>: <span class="hljs-built_in">number</span>, <span class="hljs-keyword">private</span> <span class="hljs-attr">y</span>: <span class="hljs-built_in">number</span></span>) {}
  <span class="hljs-title function_">sum</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>.<span class="hljs-property">x</span> + <span class="hljs-variable language_">this</span>.<span class="hljs-property">y</span>;
  }
}
<span class="hljs-keyword">const</span> p = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Point</span>(<span class="hljs-number">1</span>, <span class="hljs-number">2</span>);
p.<span class="hljs-property">x</span>.<span class="hljs-title function_">toFixed</span>();
</code></pre></div>
<p>构造函数参数前加了修饰符，TypeScript 就会自动声明 <code>x</code>、<code>y</code> 两个属性，并在构造时赋值，效果等同于先声明字段、再在构造函数里写 <code>this.x = x</code>。不加修饰符的参数只是普通参数，不会变成属性。</p>
<p>要注意，参数属性不是 JavaScript 语法，编译时会生成赋值代码。开启 <code>erasableSyntaxOnly</code> 后 tsc 会对它报 TS1294，Node.js 只剥离类型直接运行 TypeScript 时也不支持它，详见<a href="/questions/ts-type-imports/">《import type 和 verbatimModuleSyntax 如何影响模块输出？》</a>。</p>
<h2>abstract、extends 和 implements</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">interface</span> <span class="hljs-title class_">Pingable</span> {
  <span class="hljs-title function_">ping</span>(): <span class="hljs-built_in">void</span>;
}

<span class="hljs-keyword">abstract</span> <span class="hljs-keyword">class</span> <span class="hljs-title class_">Shape</span> {
  <span class="hljs-keyword">abstract</span> <span class="hljs-title function_">area</span>(): <span class="hljs-built_in">number</span>;
  <span class="hljs-title function_">describe</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">return</span> <span class="hljs-string">\`面积是 <span class="hljs-subst">\${<span class="hljs-variable language_">this</span>.area()}</span>\`</span>;
  }
}

<span class="hljs-keyword">class</span> <span class="hljs-title class_">Square</span> <span class="hljs-keyword">extends</span> <span class="hljs-title class_ inherited__">Shape</span> <span class="hljs-keyword">implements</span> <span class="hljs-title class_">Pingable</span> {
  <span class="hljs-title function_">constructor</span>(<span class="hljs-params"><span class="hljs-keyword">private</span> <span class="hljs-attr">size</span>: <span class="hljs-built_in">number</span></span>) {
    <span class="hljs-variable language_">super</span>();
  }
  <span class="hljs-title function_">area</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>.<span class="hljs-property">size</span> ** <span class="hljs-number">2</span>;
  }
  <span class="hljs-title function_">ping</span>(<span class="hljs-params"></span>) {}
}

<span class="hljs-comment">// @ts-expect-error 2511：不能直接 new 抽象类</span>
<span class="hljs-keyword">new</span> <span class="hljs-title class_">Shape</span>();

<span class="hljs-comment">// @ts-expect-error 2420：缺少 ping</span>
<span class="hljs-keyword">class</span> <span class="hljs-title class_">Ball</span> <span class="hljs-keyword">implements</span> <span class="hljs-title class_">Pingable</span> {
  <span class="hljs-title function_">pong</span>(<span class="hljs-params"></span>) {}
}
</code></pre></div>
<p><code>Shape</code> 把公共逻辑 <code>describe</code> 写好了，<code>area</code> 留给子类。<code>Square</code> 用 <code>extends</code> 继承了 <code>describe</code> 的实现，同时必须实现 <code>area</code>，否则会报错。这就是抽象类和接口的主要区别：抽象类可以带实现，接口只描述形状。</p>
<p><code>implements Pingable</code> 只做检查。<code>Ball</code> 没有 <code>ping</code>，所以报 2420。可它不会给类添加任何东西，也不会影响类里的推断：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">interface</span> <span class="hljs-title class_">Checkable</span> {
  <span class="hljs-title function_">check</span>(<span class="hljs-attr">name</span>: <span class="hljs-built_in">string</span>): <span class="hljs-built_in">boolean</span>;
}
<span class="hljs-keyword">class</span> <span class="hljs-title class_">NameChecker</span> <span class="hljs-keyword">implements</span> <span class="hljs-title class_">Checkable</span> {
  <span class="hljs-comment">// @ts-expect-error 7006：implements 不会给参数推断类型</span>
  <span class="hljs-title function_">check</span>(<span class="hljs-params">s</span>) {
    <span class="hljs-keyword">return</span> s === <span class="hljs-string">&#x27;ok&#x27;</span>;
  }
}
</code></pre></div>
<p>很多人以为 <code>s</code> 会自动得到接口里的 <code>string</code>，实际上它是隐式的 <code>any</code>，在 <code>strict</code> 下报 7006。Handbook 把这一点单独列为注意事项。</p>
<h2>常见追问</h2>
<p><strong>同一个类的两个实例，能互相访问对方的 private 成员吗？</strong></p>
<blockquote>
<p>可以。Handbook 说明 TypeScript 允许跨实例访问 <code>private</code>，比如在 <code>sameAs(other: A)</code> 方法里读 <code>other.x</code>。这和 Java、C# 一样，和 Ruby 不同。</p>
</blockquote>
<p><strong>子类能把父类的 protected 成员改成 public 吗？</strong></p>
<blockquote>
<p>可以。子类重新声明这个属性而不写修饰符，它就变成 <code>public</code> 了。Handbook 提醒，如果不是有意公开，子类里要记得重复写 <code>protected</code>。反过来，<code>private</code> 成员子类根本看不到，也就不能提升可见性。</p>
</blockquote>
<p><strong>抽象类和接口怎么选？</strong></p>
<blockquote>
<p>只描述形状、需要多实现时用接口，一个类可以 <code>implements</code> 多个接口，接口本身编译后也不会留下代码。需要共享一部分实现、或者希望用 <code>instanceof</code> 判断时用抽象类，因为抽象类编译后是真实存在的 JavaScript 类。接口和类型别名的区别见<a href="/questions/ts-interface-type/">《type 和 interface 有哪些区别？》</a>。</p>
</blockquote>`};export{e as default};