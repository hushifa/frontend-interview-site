var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>any</code>：任何操作都允许，读取它的属性结果还是 <code>any</code>，错误会传播到别处。只在迁移旧代码等场景局部使用。</li>
<li><code>unknown</code>：任何值都能赋给它，但不能直接读属性或调用，必须先用 <code>typeof</code>、<code>in</code>、类型守卫等收窄。外部输入、<code>catch</code> 中的错误应按 <code>unknown</code> 处理。</li>
<li><code>never</code>：没有任何值属于它。函数总是抛错或死循环时返回 <code>never</code>；联合的所有分支都处理完后剩下的类型是 <code>never</code>。</li>
<li><code>void</code>：函数正常结束但不返回有意义的值。</li>
<li><code>any</code> 可以赋给任何类型，<code>unknown</code> 只能赋给 <code>unknown</code> 和 <code>any</code>，<code>never</code> 可以赋给任何类型。</li>
</ul>
<h2>any 会扩散</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> <span class="hljs-title function_">unsafeName</span>(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">any</span></span>) {
  <span class="hljs-keyword">return</span> value.<span class="hljs-property">profile</span>.<span class="hljs-property">name</span>.<span class="hljs-title function_">toUpperCase</span>(); <span class="hljs-comment">// 不报错，返回 any</span>
}
<span class="hljs-keyword">const</span> <span class="hljs-attr">name</span>: <span class="hljs-built_in">number</span> = <span class="hljs-title function_">unsafeName</span>({}); <span class="hljs-comment">// 也不报错</span>
</code></pre></div>
<p>开启 <code>noImplicitAny</code>（<code>strict</code> 的一部分）可以禁止参数被隐式推断为 <code>any</code>。typescript-eslint 的 <code>no-unsafe-*</code> 规则可以追踪 <code>any</code> 的传播。</p>
<h2>unknown 要求先证明</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> <span class="hljs-title function_">readName</span>(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">unknown</span></span>): <span class="hljs-built_in">string</span> {
  <span class="hljs-keyword">if</span> (
    <span class="hljs-keyword">typeof</span> value !== <span class="hljs-string">&#x27;object&#x27;</span> || value === <span class="hljs-literal">null</span> ||
    !(<span class="hljs-string">&#x27;name&#x27;</span> <span class="hljs-keyword">in</span> value) || <span class="hljs-keyword">typeof</span> value.<span class="hljs-property">name</span> !== <span class="hljs-string">&#x27;string&#x27;</span>
  ) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;输入必须包含字符串 name&#x27;</span>);
  }
  <span class="hljs-keyword">return</span> value.<span class="hljs-property">name</span>.<span class="hljs-title function_">trim</span>();
}
</code></pre></div>
<p><code>useUnknownInCatchVariables</code>（<code>strict</code> 的一部分）让 <code>catch (e)</code> 中的 <code>e</code> 为 <code>unknown</code>，访问 <code>e.message</code> 前要判断 <code>e instanceof Error</code>。<code>JSON.parse</code> 的返回类型是 <code>any</code>，建议立刻赋给 <code>unknown</code> 变量再校验。</p>
<p><code>value as User</code> 跳过了证明过程，不是 <code>unknown</code> 的使用方式，见《为什么 TypeScript 不能替代接口数据校验？》。</p>
<h2>never</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> <span class="hljs-title function_">fail</span>(<span class="hljs-params"><span class="hljs-attr">message</span>: <span class="hljs-built_in">string</span></span>): <span class="hljs-built_in">never</span> {
  <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(message);
}

<span class="hljs-keyword">type</span> <span class="hljs-title class_">Shape</span> = { <span class="hljs-attr">kind</span>: <span class="hljs-string">&#x27;circle&#x27;</span> } | { <span class="hljs-attr">kind</span>: <span class="hljs-string">&#x27;square&#x27;</span> };
<span class="hljs-keyword">function</span> <span class="hljs-title function_">area</span>(<span class="hljs-params"><span class="hljs-attr">shape</span>: <span class="hljs-title class_">Shape</span></span>) {
  <span class="hljs-keyword">switch</span> (shape.<span class="hljs-property">kind</span>) {
    <span class="hljs-keyword">case</span> <span class="hljs-string">&#x27;circle&#x27;</span>: <span class="hljs-keyword">return</span> <span class="hljs-number">1</span>;
    <span class="hljs-keyword">case</span> <span class="hljs-string">&#x27;square&#x27;</span>: <span class="hljs-keyword">return</span> <span class="hljs-number">2</span>;
    <span class="hljs-attr">default</span>: {
      <span class="hljs-keyword">const</span> <span class="hljs-attr">unreachable</span>: <span class="hljs-built_in">never</span> = shape; <span class="hljs-comment">// 新增分支未处理时这里报错</span>
      <span class="hljs-keyword">return</span> unreachable;
    }
  }
}
</code></pre></div>
<p><code>string &amp; number</code> 也是 <code>never</code>。条件类型中，<code>never</code> 作为裸类型参数时会得到 <code>never</code>，见《条件类型、infer 和分布式条件类型如何理解？》。</p>
<h2>void 与 never</h2>
<table><thead><tr><th></th><th><code>void</code></th><th><code>never</code></th></tr></thead><tbody><tr><td>函数能否正常返回</td><td>能</td><td>不能</td></tr><tr><td>典型例子</td><td>事件回调、<code>console.log</code></td><td>抛错函数、<code>process.exit</code></td></tr><tr><td>async 版本</td><td><code>Promise&lt;void&gt;</code></td><td><code>Promise&lt;never&gt;</code></td></tr></tbody></table>
<p>返回类型为 <code>() =&gt; void</code> 的回调类型，允许传入有返回值的函数，返回值被忽略，所以 <code>arr.forEach(x =&gt; list.push(x))</code> 不会报错。</p>
<h2>常见追问</h2>
<ul>
<li><code>{}</code> 和 <code>object</code> 是什么？<code>{}</code> 接受除 <code>null</code>、<code>undefined</code> 外的所有值；<code>object</code> 只接受非原始值。</li>
<li>为什么不能用 <code>any</code> 消除报错？报错往往说明代码确实有未处理的情况，<code>any</code> 让它在运行时才暴露。</li>
</ul>`};export{e as default};