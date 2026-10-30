var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>给第三方传进来的对象挂一个内部标记，如果用字符串键 <code>&#x27;id&#x27;</code>，可能和对象原有的 <code>id</code> 冲突。用 <code>Symbol(&#x27;id&#x27;)</code> 作键就不会，因为每次调用 <code>Symbol()</code> 都返回一个独一无二的值，哪怕描述一样也不相等。</p>
<p>Symbol 键还比较“隐蔽”，<code>Object.keys</code>、<code>for...in</code>、<code>JSON.stringify</code> 都不会列出它，要用 <code>Object.getOwnPropertySymbols</code> 或 <code>Reflect.ownKeys</code> 才能拿到。不过它不是私有属性，知道办法的代码照样能读到。</p>
<p>如果几个文件甚至几个 iframe 需要共用同一个 Symbol，就用 <code>Symbol.for(&#x27;key&#x27;)</code>，它从全局注册表里按键取，同一个键总是返回同一个 Symbol。</p>
<p>另一个重要用途是内置 Symbol，它们是语言留给对象的“钩子”。实现 <code>Symbol.iterator</code> 就能被 <code>for...of</code> 遍历，<code>Symbol.toPrimitive</code> 控制转成原始值的结果，<code>Symbol.toStringTag</code> 改变 <code>Object.prototype.toString</code> 的输出，<code>Symbol.hasInstance</code> 定制 <code>instanceof</code>。</p>
</blockquote>
<h2>唯一的属性键</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> a = <span class="hljs-title class_">Symbol</span>(<span class="hljs-string">&#x27;id&#x27;</span>);
<span class="hljs-keyword">const</span> b = <span class="hljs-title class_">Symbol</span>(<span class="hljs-string">&#x27;id&#x27;</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(a === b); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Symbol</span>.<span class="hljs-title function_">for</span>(<span class="hljs-string">&#x27;app&#x27;</span>) === <span class="hljs-title class_">Symbol</span>.<span class="hljs-title function_">for</span>(<span class="hljs-string">&#x27;app&#x27;</span>)); <span class="hljs-comment">// true</span>
<span class="hljs-keyword">const</span> user = { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;小明&#x27;</span>, [a]: <span class="hljs-number">1</span> };
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">keys</span>(user)); <span class="hljs-comment">// [ &#x27;name&#x27; ]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(user)); <span class="hljs-comment">// {&quot;name&quot;:&quot;小明&quot;}</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">getOwnPropertySymbols</span>(user).<span class="hljs-property">length</span>); <span class="hljs-comment">// 1</span>
<span class="hljs-keyword">const</span> money = {
  [<span class="hljs-title class_">Symbol</span>.<span class="hljs-property">toPrimitive</span>](hint) {
    <span class="hljs-keyword">return</span> hint === <span class="hljs-string">&#x27;number&#x27;</span> ? <span class="hljs-number">100</span> : <span class="hljs-string">&#x27;100 元&#x27;</span>;
  },
  get [<span class="hljs-title class_">Symbol</span>.<span class="hljs-property">toStringTag</span>]() {
    <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;Money&#x27;</span>;
  },
};
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(+money); <span class="hljs-comment">// 100</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">\`<span class="hljs-subst">\${money}</span>\`</span>); <span class="hljs-comment">// 100 元</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span>.<span class="hljs-property">toString</span>.<span class="hljs-title function_">call</span>(money)); <span class="hljs-comment">// [object Money]</span>
</code></pre></div>
<p><code>a</code> 和 <code>b</code> 描述都是 <code>&#x27;id&#x27;</code>，为什么不相等？描述只是方便调试时看，不参与比较。MDN 写明每次 <code>Symbol()</code> 调用都保证返回唯一的 Symbol。<code>Symbol.for</code> 不同，它先查全局 Symbol 注册表，有这个键就返回已有的，没有才新建，所以两次拿到的是同一个。</p>
<p><code>user</code> 有两个属性，<code>Object.keys</code> 和 <code>JSON.stringify</code> 却只看到 <code>name</code>。这正是 Symbol 键的用处：给对象附加的信息不会混进遍历、序列化这些常规操作里，别人的代码基本不会碰到。</p>
<h2>内置 Symbol 在做什么</h2>
<p>后半段的 <code>money</code> 对象实现了两个内置 Symbol。<code>+money</code> 需要数字，引擎调用 <code>[Symbol.toPrimitive](&#x27;number&#x27;)</code>，得到 100；模板字符串需要字符串，传入的提示是 <code>&#x27;string&#x27;</code>，得到 <code>&#x27;100 元&#x27;</code>。<code>Object.prototype.toString</code> 会读 <code>Symbol.toStringTag</code>，所以输出 <code>[object Money]</code>，这也是为什么用它判断类型不是绝对可靠，见<a href="/questions/js-type-checking/">《怎样准确判断一个值的类型？typeof、instanceof 和 Object.prototype.toString 各有什么局限？》</a>。</p>
<p>最常用的内置 Symbol 是 <code>Symbol.iterator</code>，数组、Map、Set、字符串能被 <code>for...of</code> 和展开语法使用，都是因为实现了它，见<a href="/questions/js-iterators-generators/">《迭代器、可迭代对象和 Generator 有什么关系？》</a>。异步迭代对应的是 <code>Symbol.asyncIterator</code>。</p>
<h2>常见追问</h2>
<p><strong>Symbol 能用 new 创建吗？</strong></p>
<blockquote>
<p>不能。<code>Symbol</code> 只能当函数调用，<code>new Symbol()</code> 会抛 <code>TypeError</code>。它返回的是原始值，<code>typeof</code> 结果是 <code>&#x27;symbol&#x27;</code>。</p>
</blockquote>
<p><strong>Symbol 能隐式转成字符串吗？</strong></p>
<blockquote>
<p>不能，<code>&#x27;&#x27; + Symbol(&#x27;a&#x27;)</code> 会抛 <code>TypeError</code>，防止不小心把它当字符串键拼接。要显式转换，用 <code>String(sym)</code> 或 <code>sym.toString()</code>，或者读 <code>sym.description</code> 拿描述。</p>
</blockquote>`};export{e as default};