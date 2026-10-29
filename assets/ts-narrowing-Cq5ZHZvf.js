var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>一个变量声明成 <code>string | number | null</code>，写了 <code>if (value === null) return</code> 以后，后面的代码里它就只可能是 <code>string | number</code>。TypeScript 会顺着每条执行路径推出变量此刻可能的类型，这叫控制流收窄。<code>typeof</code>、<code>instanceof</code>、<code>in</code>、<code>===</code>、<code>Array.isArray</code>、真值判断，以及 <code>return</code>、<code>throw</code> 提前退出，都会触发收窄。</p>
<p>编译器自己看不懂的检查，可以写成类型守卫告诉它。返回值写成 <code>value is T</code> 的函数，返回 <code>true</code> 时参数就被收窄成 T；写成 <code>asserts value is T</code> 的断言函数，正常返回后就收窄。它们写得对不对，由写的人负责。<code>as T</code> 则完全不一样，它不生成任何检查，只是让编译器换个类型看这个值。</p>
<p>有几个常见的坑。<code>typeof x === &#x27;object&#x27;</code> 仍然包含 <code>null</code>。真值判断会把 <code>0</code>、<code>&#x27;&#x27;</code>、<code>false</code> 一起排除掉。</p>
<p>还有回调里的收窄可能失效。<code>const</code> 变量的收窄会保留；对象属性的收窄在回调里会退回原类型；<code>let</code> 变量和参数，在最后一次赋值之后创建的闭包里可以保留收窄（TS 5.4+）。拿不准时，先存进一个局部 <code>const</code>。</p>
</blockquote>
<h2>提前返回是怎样收窄的</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> <span class="hljs-title function_">format</span>(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">string</span> | <span class="hljs-built_in">number</span> | <span class="hljs-literal">null</span></span>): <span class="hljs-built_in">string</span> {
  <span class="hljs-keyword">if</span> (value === <span class="hljs-literal">null</span>) <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;暂无&#x27;</span>;
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> value === <span class="hljs-string">&#x27;number&#x27;</span>) <span class="hljs-keyword">return</span> value.<span class="hljs-title function_">toFixed</span>(<span class="hljs-number">2</span>);
  <span class="hljs-keyword">return</span> value.<span class="hljs-title function_">trim</span>();
}
</code></pre></div>
<p>一开始 <code>value</code> 有三种可能。第一个 <code>if</code> 排除了 <code>null</code>，第二个 <code>if</code> 排除了 <code>number</code>，走到最后一行，就只剩 <code>string</code>，所以能直接调用 <code>trim()</code>。每次 <code>return</code> 都相当于把一种情况从后面的路径上删掉。</p>
<h2>in 只证明属性存在</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> <span class="hljs-title function_">readTitle</span>(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">unknown</span></span>): <span class="hljs-built_in">string</span> | <span class="hljs-literal">undefined</span> {
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> value !== <span class="hljs-string">&#x27;object&#x27;</span> || value === <span class="hljs-literal">null</span>) <span class="hljs-keyword">return</span> <span class="hljs-literal">undefined</span>;
  <span class="hljs-keyword">if</span> (<span class="hljs-string">&#x27;title&#x27;</span> <span class="hljs-keyword">in</span> value &amp;&amp; <span class="hljs-keyword">typeof</span> value.<span class="hljs-property">title</span> === <span class="hljs-string">&#x27;string&#x27;</span>) {
    <span class="hljs-keyword">return</span> value.<span class="hljs-property">title</span>;
  }
  <span class="hljs-keyword">return</span> <span class="hljs-literal">undefined</span>;
}
</code></pre></div>
<p>先用 <code>typeof</code> 和 <code>=== null</code> 确认 <code>value</code> 是个对象。可为什么 <code>&#x27;title&#x27; in value</code> 以后还要判断一次 <code>typeof value.title</code>？因为 <code>in</code> 只证明这个属性存在（包括原型链上的），不知道它的值是什么类型，这时 <code>value.title</code> 的类型是 <code>unknown</code>。再判断一次是字符串，才能放心返回。</p>
<h2>类型守卫和断言函数</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">User</span> = { <span class="hljs-attr">name</span>: <span class="hljs-built_in">string</span>; <span class="hljs-attr">age</span>: <span class="hljs-built_in">number</span> };

<span class="hljs-keyword">function</span> <span class="hljs-title function_">isUser</span>(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">unknown</span></span>): value is <span class="hljs-title class_">User</span> {
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">typeof</span> value === <span class="hljs-string">&#x27;object&#x27;</span> &amp;&amp; value !== <span class="hljs-literal">null</span> &amp;&amp;
    <span class="hljs-string">&#x27;name&#x27;</span> <span class="hljs-keyword">in</span> value &amp;&amp; <span class="hljs-keyword">typeof</span> value.<span class="hljs-property">name</span> === <span class="hljs-string">&#x27;string&#x27;</span> &amp;&amp;
    <span class="hljs-string">&#x27;age&#x27;</span> <span class="hljs-keyword">in</span> value &amp;&amp; <span class="hljs-keyword">typeof</span> value.<span class="hljs-property">age</span> === <span class="hljs-string">&#x27;number&#x27;</span>;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">assertUser</span>(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">unknown</span></span>): asserts value is <span class="hljs-title class_">User</span> {
  <span class="hljs-keyword">if</span> (!<span class="hljs-title function_">isUser</span>(value)) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;不是有效的 User&#x27;</span>);
}

<span class="hljs-keyword">const</span> <span class="hljs-attr">input</span>: <span class="hljs-built_in">unknown</span> = <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">parse</span>(<span class="hljs-string">&#x27;{&quot;name&quot;:&quot;Lin&quot;,&quot;age&quot;:24}&#x27;</span>);
<span class="hljs-title function_">assertUser</span>(input);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(input.<span class="hljs-property">name</span>.<span class="hljs-title function_">toUpperCase</span>());
</code></pre></div>
<p><code>isUser</code> 返回的是普通布尔值，但返回类型写的是 <code>value is User</code>，意思是“返回 true 时，value 就是 User”，这样的函数叫类型守卫。<code>assertUser</code> 的写法是“不是就抛错”，调用完没抛错，后面的代码里 <code>input</code> 就被当成 <code>User</code>，所以最后一行能直接读 <code>name</code>。</p>
<p>要注意，编译器只信你的结论，不检查你的实现。要是 <code>isUser</code> 写成总是返回 <code>true</code>，编译器也发现不了。TypeScript 5.5 起，像 <code>filter(x =&gt; x !== undefined)</code> 这类简单的箭头函数会被自动推断成类型守卫，结果类型会去掉 <code>undefined</code>。</p>
<h2>回调里的收窄为什么会失效</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> <span class="hljs-title function_">printLater</span>(<span class="hljs-params"><span class="hljs-attr">box</span>: { label?: <span class="hljs-built_in">string</span> }</span>) {
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> box.<span class="hljs-property">label</span> === <span class="hljs-string">&#x27;string&#x27;</span>) {
    <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> {
      <span class="hljs-comment">// box.label 在这里是 string | undefined，外部可能已修改</span>
    }, <span class="hljs-number">0</span>);
    <span class="hljs-keyword">const</span> label = box.<span class="hljs-property">label</span>;
    <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(label.<span class="hljs-title function_">toUpperCase</span>()), <span class="hljs-number">0</span>);
  }
}
</code></pre></div>
<p><code>if</code> 里已经判断过 <code>box.label</code> 是字符串，可到了第一个 <code>setTimeout</code> 的回调里，它又变回了 <code>string | undefined</code>。原因是回调要等一会儿才执行，这段时间里别的代码可能把 <code>box.label</code> 改掉了，编译器没法保证它还是字符串。</p>
<p>改法就是第二个 <code>setTimeout</code> 的写法：先把值存进局部 <code>const</code>。<code>const</code> 不会再被赋值，所以回调里的 <code>label</code> 一定还是 <code>string</code>。TypeScript 5.4 起，对 <code>let</code> 变量和参数，只要回调是在最后一次赋值之后创建的，收窄也能保留；但对象属性在回调里仍然会失效。</p>
<h2>常见追问</h2>
<p><strong><code>never</code> 在收窄里起什么作用？</strong></p>
<blockquote>
<p>所有可能都被排除以后，变量的类型就变成 <code>never</code>。利用这一点可以做穷尽检查，漏处理了分支就会报错，见<a href="/questions/ts-discriminated-union/">《如何用可辨识联合避免不合理的状态组合？》</a>。</p>
</blockquote>
<p><strong>外部数据怎样安全地收窄？</strong></p>
<blockquote>
<p>手写守卫只适合简单结构，复杂数据用 schema 库解析更可靠，见<a href="/questions/ts-runtime-schema/">《为什么 TypeScript 不能替代接口数据校验？》</a>。</p>
</blockquote>`};export{e as default};