var e={answerHtml:`<h2>简答</h2>
<ul>
<li>TypeScript 根据 typeof、instanceof、in、相等比较和真值判断，在控制流中收窄类型。</li>
<li>自定义类型守卫 value is T 和断言函数 asserts value is T 能把运行时检查的结果告诉编译器。</li>
<li>as 断言不做任何检查，只改变编译器的视角。</li>
<li>对象属性在函数调用后可能变化，收窄结果可能失效，必要时先存入局部常量。</li>
</ul>
<p>一个变量声明为 string | number，并不意味着每次使用都只能得到模糊的联合类型。代码如果先检查 typeof，编译器就能在对应路径里知道它现在是哪一种。</p>
<p>这就是控制流收窄：根据判断与执行路径更新某个位置上的类型信息。它不是把原始声明永久改掉，而是在特定位置利用已经建立的证据。</p>
<h2>提前返回也能形成收窄</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> <span class="hljs-title function_">format</span>(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">string</span> | <span class="hljs-built_in">number</span> | <span class="hljs-literal">null</span></span>): <span class="hljs-built_in">string</span> {
  <span class="hljs-keyword">if</span> (value === <span class="hljs-literal">null</span>) <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;暂无&#x27;</span>;
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> value === <span class="hljs-string">&#x27;number&#x27;</span>) <span class="hljs-keyword">return</span> value.<span class="hljs-title function_">toFixed</span>(<span class="hljs-number">2</span>);
  <span class="hljs-keyword">return</span> value.<span class="hljs-title function_">trim</span>();
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">format</span>(<span class="hljs-number">12</span>)); <span class="hljs-comment">// 12.00</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">format</span>(<span class="hljs-string">&#x27; Lin &#x27;</span>)); <span class="hljs-comment">// Lin</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">format</span>(<span class="hljs-literal">null</span>)); <span class="hljs-comment">// 暂无</span>
</code></pre></div>
<p>第一条返回排除了后续路径上的 null；第二条返回排除了 number。走到最后时只剩 string，所以可以调用 trim。并不一定要把所有代码都写进一个很长的 if/else，控制流分析也会考虑哪些路径已经结束。</p>
<p>赋值还可能改变当前观察到的类型，但变量最初声明的联合仍然限制以后允许赋什么值。不能因为某一行把它收窄成 string，就认为其他合法分支再也不能赋 number。</p>
<h2>每一种判断提供的证据不同</h2>
<p><code>typeof</code> 适合区分字符串、数字、函数等运行时类别；<code>instanceof</code> 检查原型或自定义实例关系；相等比较可以排除 null、undefined 或某些字面量；判别字段则可以关联联合对象的其他属性。</p>
<p><code>typeof value === &#x27;object&#x27;</code> 还包含 null，不能直接据此访问属性。数组也是对象，若需要确定数组，应继续使用 Array.isArray 等对应判断。</p>
<p>truthy 判断也会收窄，但它可能同时排除空字符串、0、false 等有效业务值。检查“用户有没有填写数量”时，应先决定 0 是否有效，而不是把 <code>if (value)</code> 当成所有缺失值检查。</p>
<h2>in 说明属性存在，不自动证明它是什么</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> <span class="hljs-title function_">readTitle</span>(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">unknown</span></span>): <span class="hljs-built_in">string</span> | <span class="hljs-literal">undefined</span> {
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> value !== <span class="hljs-string">&#x27;object&#x27;</span> || value === <span class="hljs-literal">null</span>) <span class="hljs-keyword">return</span> <span class="hljs-literal">undefined</span>;
  <span class="hljs-keyword">if</span> (<span class="hljs-string">&#x27;title&#x27;</span> <span class="hljs-keyword">in</span> value &amp;&amp; <span class="hljs-keyword">typeof</span> value.<span class="hljs-property">title</span> === <span class="hljs-string">&#x27;string&#x27;</span>) {
    <span class="hljs-keyword">return</span> value.<span class="hljs-property">title</span>;
  }
  <span class="hljs-keyword">return</span> <span class="hljs-literal">undefined</span>;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">readTitle</span>({ <span class="hljs-attr">title</span>: <span class="hljs-string">&#x27;浏览器&#x27;</span> })); <span class="hljs-comment">// 浏览器</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">readTitle</span>({ <span class="hljs-attr">title</span>: <span class="hljs-number">123</span> })); <span class="hljs-comment">// undefined</span>
</code></pre></div>
<p>in 会考虑原型链，所以它不等同于 Object.hasOwn。即便某个字段存在，它也可能是 undefined、数字或访问器返回的其他值，仍要检查所需类型。</p>
<p>联合中的可选属性也可能出现在 true 和 false 两条路径里。不能仅凭“这个分支写了某个可选字段”就假定 in 的反分支一定排除了整个分支类型。</p>
<p>对于外部 JSON，常见目标是检查一个普通数据结构；对于任意对象，还要考虑 getter、Proxy 和原型行为。类型收窄不是绕过这些运行时机制的安全沙箱。</p>
<h2>自定义类型守卫把检查与类型结论连接起来</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">User</span> = { <span class="hljs-attr">name</span>: <span class="hljs-built_in">string</span>; <span class="hljs-attr">age</span>: <span class="hljs-built_in">number</span> };

<span class="hljs-keyword">function</span> <span class="hljs-title function_">isUser</span>(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">unknown</span></span>): value is <span class="hljs-title class_">User</span> {
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">typeof</span> value === <span class="hljs-string">&#x27;object&#x27;</span> &amp;&amp; value !== <span class="hljs-literal">null</span> &amp;&amp;
    <span class="hljs-string">&#x27;name&#x27;</span> <span class="hljs-keyword">in</span> value &amp;&amp; <span class="hljs-keyword">typeof</span> value.<span class="hljs-property">name</span> === <span class="hljs-string">&#x27;string&#x27;</span> &amp;&amp;
    <span class="hljs-string">&#x27;age&#x27;</span> <span class="hljs-keyword">in</span> value &amp;&amp; <span class="hljs-keyword">typeof</span> value.<span class="hljs-property">age</span> === <span class="hljs-string">&#x27;number&#x27;</span>;
}

<span class="hljs-keyword">const</span> <span class="hljs-attr">input</span>: <span class="hljs-built_in">unknown</span> = { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;Lin&#x27;</span>, <span class="hljs-attr">age</span>: <span class="hljs-number">24</span> };
<span class="hljs-keyword">if</span> (<span class="hljs-title function_">isUser</span>(input)) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(input.<span class="hljs-property">name</span>.<span class="hljs-title function_">toUpperCase</span>()); <span class="hljs-comment">// LIN</span>
}
</code></pre></div>
<p><code>value is User</code> 告诉编译器：返回 true 时，可以按 User 理解这个参数。编译器会检查谓词声明是否符合基本类型规则，但不会证明你的所有判断真的构成了正确验证。</p>
<p>如果实现只是无条件返回 true，它依然可能骗过调用方。因此守卫的测试应该包括缺失字段、错误类型和边界输入，而不只是成功对象。</p>
<p>还要考虑 false 的含义。把“是一个非空字符串”的函数声明成 <code>value is string</code>，可能让 false 分支错误排除空字符串这种仍然是 string 的值。业务筛选条件与类型判定不完全相同，额外约束应通过合适的专门类型或单独的布尔判断表达。</p>
<p>上面的 User 只要求 age 是 number，不包含有限、非负等业务规则。需要这些约束时应明确增加验证与类型契约，不能把简单字段检查说成完整用户数据校验。</p>
<h2>断言函数与 as 断言不是同一种机制</h2>
<p>继续使用上面的 User 与 isUser，可以定义失败时抛错的检查函数：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> <span class="hljs-title function_">assertUser</span>(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">unknown</span></span>): asserts value is <span class="hljs-title class_">User</span> {
  <span class="hljs-keyword">if</span> (!<span class="hljs-title function_">isUser</span>(value)) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;不是有效的 User 结构&#x27;</span>);
}

<span class="hljs-keyword">const</span> <span class="hljs-attr">candidate</span>: <span class="hljs-built_in">unknown</span> = { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;Lin&#x27;</span>, <span class="hljs-attr">age</span>: <span class="hljs-number">24</span> };
<span class="hljs-title function_">assertUser</span>(candidate);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(candidate.<span class="hljs-property">age</span>.<span class="hljs-title function_">toFixed</span>(<span class="hljs-number">0</span>)); <span class="hljs-comment">// 24</span>
</code></pre></div>
<p>函数如果正常返回，调用后的 candidate 就按 User 继续处理；如果不满足结构，运行时真的会抛错。<code>candidate as User</code> 没有这个检查过程。</p>
<p>断言函数的实现也需要可信，不能把错误数据放过后再期待编译器在后面替你发现。它适合把“验证失败就不能继续”的边界集中表达。</p>
<h2>异步回调中的证据可能已经过时</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> <span class="hljs-title function_">printLater</span>(<span class="hljs-params"><span class="hljs-attr">box</span>: { label?: <span class="hljs-built_in">string</span> }</span>) {
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> box.<span class="hljs-property">label</span> === <span class="hljs-string">&#x27;string&#x27;</span>) {
    <span class="hljs-keyword">const</span> label = box.<span class="hljs-property">label</span>;
    <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(label.<span class="hljs-title function_">toUpperCase</span>()), <span class="hljs-number">0</span>);
  }
}
</code></pre></div>
<p>这里先保存当前字符串，再让回调使用它。等待期间外部即使修改 box.label，也不会改变这个局部字符串值。反过来，如果回调需要最新标签，就应在回调执行时重新读取并检查，而不是有意保存旧值。</p>
<p>TypeScript 能保留一些稳定变量或满足条件的闭包收窄，但对可能变化的属性、赋值和调用有不同限制，具体能力也随版本演进。编译器拒绝沿用某个证据时，先确认值在真实运行时是否确实稳定，再决定保存局部值、重新检查还是调整接口。</p>
<p>类型收窄最有价值的地方，是让代码中的真实判断与后续允许的操作一致。它不能替代运行时验证，但可以让验证建立的事实沿控制流传递，减少重复检查与不必要断言。</p>`};export{e as default};