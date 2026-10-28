var e={answerHtml:`<h2>简答</h2>
<ul>
<li>不开 <code>experimentalDecorators</code> 时，TypeScript 5.0+ 使用标准装饰器；开启后使用旧实现，两者签名不同。</li>
<li>标准装饰器：<code>(value, context) =&gt; 替换值 | void</code>，<code>context</code> 提供 <code>kind</code>、<code>name</code>、<code>static</code>、<code>private</code>、<code>addInitializer</code>、<code>metadata</code>。</li>
<li>旧装饰器：方法装饰器收 <code>(target, propertyKey, descriptor)</code>，通过修改描述符替换方法。</li>
<li>标准装饰器没有参数装饰器，也不生成 <code>design:type</code> 等反射元数据；依赖这些的 DI 框架需要旧模式。</li>
<li>装饰器是运行时代码，在类定义时执行；不会改变类的类型，增加的成员需要另外声明。装饰器语法不可擦除，Node.js 类型剥离无法运行。</li>
</ul>
<h2>标准方法装饰器</h2>
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
<p>包装函数必须是普通函数并转发 <code>this</code>。被装饰的方法如果返回 Promise，日志会在异步工作完成之前打印。</p>
<h2>旧方法装饰器</h2>
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
<p>把这个函数用在标准模式下，TypeScript 报 <code>TS1241</code>：运行时只会传 2 个参数。</p>
<h2>addInitializer：自动绑定</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> bound&lt;<span class="hljs-title class_">This</span>&gt;(
  <span class="hljs-attr">method</span>: <span class="hljs-function">(<span class="hljs-params"><span class="hljs-attr">this</span>: <span class="hljs-title class_">This</span>, ...<span class="hljs-attr">args</span>: <span class="hljs-built_in">never</span>[]</span>) =&gt;</span> <span class="hljs-built_in">unknown</span>,
  <span class="hljs-attr">context</span>: <span class="hljs-title class_">ClassMethodDecoratorContext</span>&lt;<span class="hljs-title class_">This</span>&gt;,
) {
  context.<span class="hljs-title function_">addInitializer</span>(<span class="hljs-keyword">function</span> (<span class="hljs-params"><span class="hljs-attr">this</span>: <span class="hljs-title class_">This</span></span>) {
    (<span class="hljs-variable language_">this</span> <span class="hljs-keyword">as</span> <span class="hljs-title class_">Record</span>&lt;<span class="hljs-built_in">string</span> | <span class="hljs-built_in">symbol</span>, <span class="hljs-built_in">unknown</span>&gt;)[context.<span class="hljs-property">name</span>] = method.<span class="hljs-title function_">bind</span>(<span class="hljs-variable language_">this</span>);
  });
}
</code></pre></div>
<p>初始化器在每个实例构造时运行，所以 <code>const fn = obj.method</code> 后仍能拿到正确的 <code>this</code>。</p>
<h2>对比</h2>
<table><thead><tr><th></th><th>标准装饰器</th><th><code>experimentalDecorators</code></th></tr></thead><tbody><tr><td>方法装饰器参数</td><td><code>(value, context)</code></td><td><code>(target, key, descriptor)</code></td></tr><tr><td>参数装饰器</td><td>无</td><td>有</td></tr><tr><td>反射元数据</td><td><code>context.metadata</code> / <code>Symbol.metadata</code>（TS 5.2）</td><td><code>emitDecoratorMetadata</code> + <code>reflect-metadata</code></td></tr><tr><td><code>accessor</code> 字段</td><td>支持</td><td>不支持</td></tr></tbody></table>
<p>迁移时先确认框架要求的模式；两种模式不能在同一个项目里混用。</p>
<h2>常见追问</h2>
<ul>
<li>装饰器的执行顺序？同一成员上多个装饰器从下往上应用，<code>@a @b method</code> 先应用 <code>b</code> 再应用 <code>a</code>，最终调用时 <code>a</code> 的包装在最外层。</li>
<li>浏览器能直接运行吗？装饰器提案还未进入 TC39 已完成提案列表，目前需要 TypeScript、Babel 或 esbuild 转换。</li>
</ul>`};export{e as default};