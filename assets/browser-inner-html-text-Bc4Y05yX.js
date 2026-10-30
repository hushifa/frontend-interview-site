var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>假设页面上有 <code>&lt;div id=&quot;box&quot;&gt;你好，&lt;b&gt;小明&lt;/b&gt;&lt;/div&gt;</code>。<code>box.textContent</code> 和 <code>box.innerText</code> 读到的都是文字“你好，小明”，<code>box.innerHTML</code> 读到的是带标签的 <code>你好，&lt;b&gt;小明&lt;/b&gt;</code>，<code>box.outerHTML</code> 还要把外面的 <code>&lt;div id=&quot;box&quot;&gt;</code> 也包含进去。</p>
<p>两个读文字的属性，差别在于看不看 CSS。<code>textContent</code> 只管 DOM，<code>&lt;script&gt;</code>、<code>&lt;style&gt;</code> 里的内容和 <code>display: none</code> 的文字都会读出来。<code>innerText</code> 读的是渲染后用户看得到的文字，接近用鼠标选中再复制的结果，隐藏的文字不读，所以读取时要先算好样式，会触发重排。</p>
<p>写入时差别更大。给 <code>textContent</code> 或 <code>innerText</code> 赋值，字符串只会变成文字，写 <code>&lt;b&gt;</code> 页面上就显示 <code>&lt;b&gt;</code>。给 <code>innerHTML</code> 或 <code>outerHTML</code> 赋值，字符串会被当成 HTML 解析成元素，这正是 XSS 的入口：<code>&lt;script&gt;</code> 虽然不会执行，但 <code>&lt;img src=x onerror=...&gt;</code> 里的代码会执行。</p>
<p>所以显示用户输入的纯文本时，用 <code>textContent</code>。确实要插入 HTML，先用 DOMPurify 这类库净化，再配合 Trusted Types 限制只能传入净化过的内容。还要注意 <code>outerHTML</code> 赋值会把元素本身替换掉，原来的变量仍然指向旧元素。</p>
</blockquote>
<h2>读取时各自返回什么</h2>
<p>先看一段结构，里面有普通文字、样式、隐藏元素和换行：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;box&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">style</span>&gt;</span><span class="css"><span class="hljs-selector-id">#box</span> <span class="hljs-selector-tag">b</span> { <span class="hljs-attribute">color</span>: red; }</span><span class="hljs-tag">&lt;/<span class="hljs-name">style</span>&gt;</span>
  你好，<span class="hljs-tag">&lt;<span class="hljs-name">b</span>&gt;</span>小明<span class="hljs-tag">&lt;/<span class="hljs-name">b</span>&gt;</span><span class="hljs-tag">&lt;<span class="hljs-name">br</span> /&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">span</span> <span class="hljs-attr">style</span>=<span class="hljs-string">&quot;display: none&quot;</span>&gt;</span>隐藏文字<span class="hljs-tag">&lt;/<span class="hljs-name">span</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">box.<span class="hljs-property">textContent</span>; <span class="hljs-comment">// 包含 style 里的 CSS 文本、“你好，小明”和“隐藏文字”</span>
box.<span class="hljs-property">innerText</span>; <span class="hljs-comment">// “你好，小明”，br 处有换行，不含 CSS 文本和隐藏文字</span>
box.<span class="hljs-property">innerHTML</span>; <span class="hljs-comment">// 内部的 HTML 字符串，包括 style、b、br、span 标签</span>
box.<span class="hljs-property">outerHTML</span>; <span class="hljs-comment">// 在 innerHTML 外面再包上 &lt;div id=&quot;box&quot;&gt;…&lt;/div&gt;</span>
</code></pre></div>
<p>为什么 <code>textContent</code> 会读到 CSS 文本？MDN 的解释是，<code>textContent</code> 获取所有元素的内容，包括 <code>&lt;script&gt;</code> 和 <code>&lt;style&gt;</code>，它只是把所有子文本节点拼起来，不关心页面上显示成什么样。注释和处理指令会被跳过。</p>
<p><code>innerText</code> 正好相反，MDN 说它表示节点渲染后的文本，近似于用户选中内容复制到剪贴板得到的文字。所以它知道 <code>&lt;br&gt;</code> 是换行，会跳过隐藏元素，也会受 <code>text-transform</code> 这类样式影响。因为要考虑 CSS，读取 <code>innerText</code> 会触发重排，以拿到最新的计算样式，循环里频繁读取时要留意，重排的代价见<a href="/questions/browser-reflow-repaint/">《重排和重绘有什么区别？哪些操作会触发它们？》</a>。元素本身没有渲染时，比如已经从文档移除或被隐藏，<code>innerText</code> 返回的就和 <code>textContent</code> 一样。</p>
<p>还有一个边界：对 <code>document</code> 或 doctype 读 <code>textContent</code> 返回 <code>null</code>，想拿整页文字要读 <code>document.documentElement.textContent</code>。</p>
<h2>写入时谁会解析 HTML</h2>
<p>四个属性都能赋值，但对字符串的处理不同。</p>
<p><code>textContent</code> 赋值时，会移除元素的所有子节点，换成一个文本节点。字符串里写 <code>&lt;b&gt;</code> 也只是文字，不会变成元素。<code>innerText</code> 赋值也会替换所有子节点，区别是字符串里的换行会被转成 <code>&lt;br&gt;</code> 元素。</p>
<p><code>innerHTML</code> 赋值时，字符串会交给 HTML 解析器，解析出来的元素替换掉原来的子节点。MDN 也因此不建议用 <code>innerHTML</code> 设置纯文本：它处理的是原始 HTML，有 XSS 风险，而且要调用 HTML 解析器，比 <code>textContent</code> 慢。</p>
<p><code>outerHTML</code> 赋值会把元素自己连同后代一起替换掉。这里有两个容易踩的坑。一是替换以后，原来的变量还指向旧元素：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> p = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;p&#x27;</span>);
p.<span class="hljs-property">outerHTML</span> = <span class="hljs-string">&#x27;&lt;div&gt;替换后的内容&lt;/div&gt;&#x27;</span>;
p.<span class="hljs-property">nodeName</span>; <span class="hljs-comment">// 还是 &quot;P&quot;，页面上已经是 div 了</span>
</code></pre></div>
<p>二是元素的父节点是 <code>document</code> 时不能设置，比如对 <code>document.documentElement</code> 赋值 <code>outerHTML</code> 会抛出 <code>NoModificationAllowedError</code>。</p>
<h2>为什么 innerHTML 是 XSS 的入口</h2>
<p>MDN 把 <code>innerHTML</code> 称为最常见的 XSS 注入途径之一。它确实会阻止通过它插入的 <code>&lt;script&gt;</code> 执行，但攻击者有很多别的办法：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> name = <span class="hljs-string">&quot;&lt;img src=&#x27;x&#x27; onerror=&#x27;alert(1)&#x27;&gt;&quot;</span>;
el.<span class="hljs-property">innerHTML</span> = name; <span class="hljs-comment">// 图片地址无效，onerror 里的代码会执行</span>
</code></pre></div>
<p><code>outerHTML</code> 的情况相同。所以只要字符串可能来自用户，比如评论内容、URL 参数，就不能直接交给这两个属性。</p>
<p>只是显示文字时，直接用 <code>textContent</code>，MDN 也是这样建议的。确实需要渲染用户提供的 HTML，比如富文本评论，要先用 DOMPurify 这类库去掉危险的标签和属性。更进一步，可以用 CSP 的 <code>require-trusted-types-for &#x27;script&#x27;</code> 强制这些属性只接受 <code>TrustedHTML</code> 对象，这样漏掉的地方会直接报错，见<a href="/questions/sec-trusted-types/">《Trusted Types 会自动过滤所有危险 HTML 吗？》</a>。XSS 的分类和整体防范见<a href="/questions/http-xss/">《XSS 有哪几种？前端怎样防范？》</a>。</p>
<h2>常见追问</h2>
<p><strong>React 和 Vue 里对应的是哪个？</strong></p>
<blockquote>
<p>Vue 文档写明，双大括号插值把数据当纯文本，不当 HTML，要插入 HTML 得用 <code>v-html</code>，它更新的就是元素的 <code>innerHTML</code>。React 对应的是 <code>dangerouslySetInnerHTML</code>，文档说它会覆盖 DOM 节点的 <code>innerHTML</code>。两者的文档都警告不要用在用户提供的内容上，确实要用时先净化。</p>
</blockquote>
<p><strong>只是想清空一个元素，用哪个？</strong></p>
<blockquote>
<p><code>el.textContent = &#x27;&#x27;</code> 或 <code>el.replaceChildren()</code> 都可以，它们不需要解析 HTML。<code>el.innerHTML = &#x27;&#x27;</code> 也能清空，只是要经过 HTML 解析器。</p>
</blockquote>`};export{e as default};