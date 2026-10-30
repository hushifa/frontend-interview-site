var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>一个下单接口函数已经写好了，现在想在调用前后打日志、加参数校验，但不想改它本身的代码。做法是写一个函数把它包起来，调用包装后的版本时先校验、再调用原函数、最后打日志，调用方式和原来完全一样。这就是装饰器模式。</p>
<p>它的意义在于功能可以按需叠加和拆掉。日志、校验、缓存、重试各写成一个包装函数，需要哪几个就套哪几个，原函数始终保持单一职责，也不用为每种组合写一个子类。</p>
<p>在 JavaScript 里，函数可以当参数传、当返回值返回，所以装饰器最自然的写法就是高阶函数：接收一个函数，返回一个增强后的新函数。React 的高阶组件是同一个思路，接收一个组件，返回一个注入了数据或行为的新组件。</p>
<p>要注意，包了几层以后执行顺序是从外到内的，顺序不同结果可能不同。<code>@</code> 开头的装饰器语法目前还是 TC39 提案，浏览器不能直接运行，要靠 TypeScript 或 Babel 编译，而且新旧两套语义不兼容。</p>
</blockquote>
<h2>用高阶函数实现装饰器</h2>
<p>下面给 <code>add</code> 套上两层：一层校验参数类型，一层打印调用日志。重点看包装后的函数和原函数在调用方式和结果上的差别：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">withLog</span>(<span class="hljs-params">fn</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">function</span> (<span class="hljs-params">...args</span>) {
    <span class="hljs-keyword">const</span> result = fn.<span class="hljs-title function_">apply</span>(<span class="hljs-variable language_">this</span>, args);
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">\`<span class="hljs-subst">\${fn.name}</span>(<span class="hljs-subst">\${args.join(<span class="hljs-string">&#x27;, &#x27;</span>)}</span>) = <span class="hljs-subst">\${result}</span>\`</span>);
    <span class="hljs-keyword">return</span> result;
  };
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">withValidate</span>(<span class="hljs-params">fn</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">function</span> (<span class="hljs-params">...args</span>) {
    <span class="hljs-keyword">if</span> (args.<span class="hljs-title function_">some</span>(<span class="hljs-function">(<span class="hljs-params">n</span>) =&gt;</span> <span class="hljs-keyword">typeof</span> n !== <span class="hljs-string">&#x27;number&#x27;</span>)) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;参数必须是数字&#x27;</span>);
    <span class="hljs-keyword">return</span> fn.<span class="hljs-title function_">apply</span>(<span class="hljs-variable language_">this</span>, args);
  };
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">add</span>(<span class="hljs-params">a, b</span>) {
  <span class="hljs-keyword">return</span> a + b;
}

<span class="hljs-keyword">const</span> safeAdd = <span class="hljs-title function_">withValidate</span>(<span class="hljs-title function_">withLog</span>(add));
<span class="hljs-title function_">safeAdd</span>(<span class="hljs-number">1</span>, <span class="hljs-number">2</span>); <span class="hljs-comment">// add(1, 2) = 3</span>
<span class="hljs-keyword">try</span> {
  <span class="hljs-title function_">safeAdd</span>(<span class="hljs-number">1</span>, <span class="hljs-string">&#x27;2&#x27;</span>);
} <span class="hljs-keyword">catch</span> (err) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(err.<span class="hljs-property">message</span>); <span class="hljs-comment">// 参数必须是数字</span>
}
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">add</span>(<span class="hljs-number">1</span>, <span class="hljs-string">&#x27;2&#x27;</span>)); <span class="hljs-comment">// 12</span>
</code></pre></div>
<p><code>safeAdd(1, 2)</code> 的用法和 <code>add(1, 2)</code> 一样，可多了一行日志。传入字符串时，最外层的 <code>withValidate</code> 先检查参数，直接抛错，<code>add</code> 根本没有执行，所以也没有日志。最后一行说明原来的 <code>add</code> 没有被改动，它仍然会把 <code>1 + &#x27;2&#x27;</code> 拼成字符串 <code>&#x27;12&#x27;</code>。</p>
<p>为什么用 <code>fn.apply(this, args)</code> 而不是 <code>fn(...args)</code>？因为被装饰的可能是对象的方法，要把调用时的 <code>this</code> 原样传下去，否则方法里读 <code>this</code> 会出错。</p>
<p>为什么日志里的函数名是 <code>add</code>？因为 <code>withLog</code> 包的是 <code>add</code> 本身。如果写成 <code>withLog(withValidate(add))</code>，<code>withLog</code> 拿到的是 <code>withValidate</code> 返回的匿名函数，<code>fn.name</code> 就成了空字符串。这也说明包装的顺序会影响结果：写在最外面的装饰器最先执行。</p>
<h2>和代理模式有什么区别</h2>
<p>装饰器和代理都是“包一层、接口不变”，结构几乎一样。区别在意图：装饰器给对象叠加新功能，原有的调用一般都会发生；代理侧重控制访问，可以决定调不调、什么时候调，比如缓存命中时就不调用原函数。上面的 <code>withValidate</code> 会拦住不合法的调用，更接近代理的用法。实际讨论时说清楚这一层做了什么比纠结名字更重要，代理模式见<a href="/questions/pattern-strategy-proxy/">《策略模式和代理模式分别解决什么问题？前端怎样使用？》</a>。</p>
<h2>高阶组件就是组件的装饰器</h2>
<p>高阶组件接收一个组件，返回一个新组件，新组件渲染原组件，同时注入额外的 props 或包一层布局：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">withOnlineStatus</span>(<span class="hljs-params">Component</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">WithOnlineStatus</span>(<span class="hljs-params">props</span>) {
    <span class="hljs-keyword">const</span> isOnline = <span class="hljs-title function_">useOnlineStatus</span>();
    <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">Component</span> {<span class="hljs-attr">...props</span>} <span class="hljs-attr">isOnline</span>=<span class="hljs-string">{isOnline}</span> /&gt;</span></span>;
  };
}

<span class="hljs-keyword">const</span> <span class="hljs-title class_">StatusButton</span> = <span class="hljs-title function_">withOnlineStatus</span>(<span class="hljs-title class_">Button</span>);
</code></pre></div>
<p><code>Button</code> 本身不知道网络状态，被包装后多拿到一个 <code>isOnline</code>，其他 props 原样透传，这就是装饰器的思路。现在的 React 里，复用有状态的逻辑首选自定义 Hook，高阶组件要注意的问题和三种写法的比较见<a href="/questions/react-hoc-render-props/">《高阶组件、Render Props 和自定义 Hook 怎样选择？》</a>。</p>
<h2>@ 语法装饰器是什么</h2>
<p>很多框架里能看到 <code>@Component</code>、<code>@observable</code> 这样的写法，这是语言层面的装饰器语法，作用在类和类成员上。它目前是 TC39 的提案，浏览器和 Node 还不能直接运行，需要 TypeScript 或 Babel 编译。TypeScript 有新旧两套实现：5.0 开始支持的标准装饰器，和老的 <code>experimentalDecorators</code>，两者参数和行为不同，详见<a href="/questions/ts-decorators-modern/">《TypeScript 新装饰器与 experimentalDecorators 有何区别？》</a>。</p>
<p>无论哪种语法，背后的思路都和高阶函数一样，都是拿到原来的东西，返回一个增强后的版本。</p>
<h2>常见追问</h2>
<p><strong>装饰器和继承相比有什么好处？</strong></p>
<blockquote>
<p>继承要为每种功能组合写一个子类，日志加校验、日志加缓存、三个都要，组合一多类就爆炸了。装饰器把每种功能写成独立的一层，运行时按需组合，原类也不用改。</p>
</blockquote>
<p><strong>多个装饰器叠加时怎样避免出错？</strong></p>
<blockquote>
<p>每一层都要保持接口不变：参数原样传下去、返回值原样返回、<code>this</code> 用 <code>apply</code> 传递。顺序有讲究的要写清楚，比如校验通常放在最外层，让不合法的调用尽早被拦住。</p>
</blockquote>
<p><strong>防抖、节流算装饰器吗？</strong></p>
<blockquote>
<p>写法上是。<code>debounce(fn, 300)</code> 接收一个函数、返回一个包装后的函数，接口不变，只是改变了调用时机。从意图上说它控制了原函数什么时候执行，也可以看作代理，这两个模式本来就很接近。</p>
</blockquote>`};export{e as default};