var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>装饰器就是写在类或类成员上面的 <code>@xxx</code>，它是一个函数，类定义的时候会被调用，可以包装或替换被装饰的东西。TypeScript 现在有两套：5.0 起，不开 <code>experimentalDecorators</code> 就用 TC39 标准装饰器；开了就用旧实现，两者签名不同。</p>
<p>标准装饰器接收 <code>(value, context)</code>。<code>value</code> 是原来的方法，返回一个新函数就能替换它；<code>context</code> 提供 <code>kind</code>、<code>name</code>、<code>static</code>、<code>private</code>、<code>addInitializer</code>、<code>metadata</code> 这些信息。旧装饰器的方法装饰器接收 <code>(target, propertyKey, descriptor)</code>，靠修改属性描述符来替换方法。</p>
<p>区别最大的是生态。标准装饰器没有参数装饰器，也不会生成 <code>design:type</code> 这类反射元数据，所以 NestJS、TypeORM 这类依赖注入框架还得用旧模式，不能直接切换。</p>
<p>还要注意，装饰器是运行时代码，它不会改变类的类型，加出来的成员要另外声明。装饰器语法也不能被直接擦掉，Node.js 的类型剥离运行不了它。</p>
</blockquote>
<h2>标准方法装饰器长什么样</h2>
<p>下面写一个 <code>logged</code>，每次调用方法前打印一行日志。</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> logged&lt;<span class="hljs-title class_">This</span>, <span class="hljs-title class_">Args</span> <span class="hljs-keyword">extends</span> <span class="hljs-built_in">unknown</span>[], <span class="hljs-title class_">Result</span>&gt;(
  <span class="hljs-attr">method</span>: <span class="hljs-function">(<span class="hljs-params"><span class="hljs-attr">this</span>: <span class="hljs-title class_">This</span>, ...<span class="hljs-attr">args</span>: <span class="hljs-title class_">Args</span></span>) =&gt;</span> <span class="hljs-title class_">Result</span>,
  <span class="hljs-attr">context</span>: <span class="hljs-title class_">ClassMethodDecoratorContext</span>&lt;<span class="hljs-title class_">This</span>, <span class="hljs-function">(<span class="hljs-params"><span class="hljs-attr">this</span>: <span class="hljs-title class_">This</span>, ...<span class="hljs-attr">args</span>: <span class="hljs-title class_">Args</span></span>) =&gt;</span> <span class="hljs-title class_">Result</span>&gt;,
) {
  <span class="hljs-keyword">const</span> name = <span class="hljs-title class_">String</span>(context.<span class="hljs-property">name</span>);
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">function</span> (<span class="hljs-params"><span class="hljs-attr">this</span>: <span class="hljs-title class_">This</span>, ...<span class="hljs-attr">args</span>: <span class="hljs-title class_">Args</span></span>): <span class="hljs-title class_">Result</span> {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">\`调用 <span class="hljs-subst">\${name}</span>\`</span>);
    <span class="hljs-keyword">return</span> method.<span class="hljs-title function_">apply</span>(<span class="hljs-variable language_">this</span>, args);
  };
}

<span class="hljs-keyword">class</span> <span class="hljs-title class_">Counter</span> {
  value = <span class="hljs-number">0</span>;

  <span class="hljs-meta">@logged</span>
  <span class="hljs-title function_">add</span>(<span class="hljs-attr">step</span>: <span class="hljs-built_in">number</span>): <span class="hljs-built_in">number</span> {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">value</span> += step;
    <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>.<span class="hljs-property">value</span>;
  }
}

<span class="hljs-keyword">new</span> <span class="hljs-title class_">Counter</span>().<span class="hljs-title function_">add</span>(<span class="hljs-number">2</span>); <span class="hljs-comment">// 输出：调用 add</span>
</code></pre></div>
<p><code>logged</code> 拿到原来的 <code>add</code> 和一个 <code>context</code>，返回一个新函数，类里的 <code>add</code> 就被换成了这个新函数。方法名从 <code>context.name</code> 读出来。</p>
<p>这里返回的包装函数必须是普通函数，并用 <code>method.apply(this, args)</code> 把 <code>this</code> 转发过去。要是写成箭头函数，<code>this</code> 就不是实例了，原方法里的 <code>this.value</code> 会出错。还有一点：如果被装饰的方法返回 Promise，日志是在调用时打印的，那时异步工作还没完成。</p>
<h2>旧装饰器为什么不能直接拿来用</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// 需要 &quot;experimentalDecorators&quot;: true</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">legacyLogged</span>(<span class="hljs-params">
  <span class="hljs-attr">_target</span>: <span class="hljs-built_in">object</span>,
  <span class="hljs-attr">name</span>: <span class="hljs-built_in">string</span> | <span class="hljs-built_in">symbol</span>,
  <span class="hljs-attr">descriptor</span>: <span class="hljs-title class_">PropertyDescriptor</span>,
</span>): <span class="hljs-built_in">void</span> {
  <span class="hljs-keyword">const</span> original = descriptor.<span class="hljs-property">value</span>;
  descriptor.<span class="hljs-property">value</span> = <span class="hljs-keyword">function</span> (<span class="hljs-params"><span class="hljs-attr">this</span>: <span class="hljs-built_in">unknown</span>, ...<span class="hljs-attr">args</span>: <span class="hljs-built_in">unknown</span>[]</span>) {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">\`旧方案调用 <span class="hljs-subst">\${<span class="hljs-built_in">String</span>(name)}</span>\`</span>);
    <span class="hljs-keyword">return</span> original.<span class="hljs-title function_">apply</span>(<span class="hljs-variable language_">this</span>, args);
  };
}
</code></pre></div>
<p>旧写法要三个参数，通过改 <code>descriptor.value</code> 换掉方法。在标准模式下用它，TypeScript 会报 <code>TS1241</code>，因为标准装饰器运行时只传两个参数，第三个 <code>descriptor</code> 根本拿不到。</p>
<h2>addInitializer 能做什么</h2>
<p><code>context.addInitializer</code> 可以注册一段在每个实例构造时执行的代码。用它可以实现自动绑定 <code>this</code>：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> bound&lt;<span class="hljs-title class_">This</span>&gt;(
  <span class="hljs-attr">method</span>: <span class="hljs-function">(<span class="hljs-params"><span class="hljs-attr">this</span>: <span class="hljs-title class_">This</span>, ...<span class="hljs-attr">args</span>: <span class="hljs-built_in">never</span>[]</span>) =&gt;</span> <span class="hljs-built_in">unknown</span>,
  <span class="hljs-attr">context</span>: <span class="hljs-title class_">ClassMethodDecoratorContext</span>&lt;<span class="hljs-title class_">This</span>&gt;,
) {
  context.<span class="hljs-title function_">addInitializer</span>(<span class="hljs-keyword">function</span> (<span class="hljs-params"><span class="hljs-attr">this</span>: <span class="hljs-title class_">This</span></span>) {
    (<span class="hljs-variable language_">this</span> <span class="hljs-keyword">as</span> <span class="hljs-title class_">Record</span>&lt;<span class="hljs-built_in">string</span> | <span class="hljs-built_in">symbol</span>, <span class="hljs-built_in">unknown</span>&gt;)[context.<span class="hljs-property">name</span>] = method.<span class="hljs-title function_">bind</span>(<span class="hljs-variable language_">this</span>);
  });
}
</code></pre></div>
<p>每创建一个实例，初始化器就把绑定好的方法放到实例自己身上。所以把方法单独拿出来，比如 <code>const fn = obj.method</code>，再调用也能拿到正确的 <code>this</code>。</p>
<h2>两套装饰器对比</h2>
<table><thead><tr><th></th><th>标准装饰器</th><th><code>experimentalDecorators</code></th></tr></thead><tbody><tr><td>方法装饰器参数</td><td><code>(value, context)</code></td><td><code>(target, key, descriptor)</code></td></tr><tr><td>参数装饰器</td><td>无</td><td>有</td></tr><tr><td>反射元数据</td><td><code>context.metadata</code> / <code>Symbol.metadata</code>（TS 5.2）</td><td><code>emitDecoratorMetadata</code> + <code>reflect-metadata</code></td></tr><tr><td><code>accessor</code> 字段</td><td>支持</td><td>不支持</td></tr></tbody></table>
<p>迁移前先确认框架要求哪种模式。两种模式不能在同一个项目里混用。</p>
<h2>常见追问</h2>
<p><strong>多个装饰器的执行顺序是怎样的？</strong></p>
<blockquote>
<p>同一个成员上的多个装饰器从下往上应用。写 <code>@a @b method</code>，先应用 <code>b</code>，再应用 <code>a</code>，所以最后调用时 <code>a</code> 的包装在最外层，先执行。</p>
</blockquote>
<p><strong>浏览器能直接运行装饰器吗？</strong></p>
<blockquote>
<p>目前还不行。装饰器提案曾在 Stage 3 停留多年，因为迟迟没有引擎实现，2026 年 5 月 TC39 会议把它和装饰器元数据一起退回 Stage 2.7，提案细节还可能调整。现在需要 TypeScript、Babel 或 esbuild 转换以后才能运行。</p>
</blockquote>`};export{e as default};