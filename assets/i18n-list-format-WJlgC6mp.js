var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>显示参与者名单时，很多人直接写 <code>names.join(&#x27;, &#x27;)</code>。可是各语言的连接词和标点不一样，英文是“Alice, Bob, and Carol”，中文是“张三、李四和王五”。<code>Intl.ListFormat</code> 就是按语言把一组字符串连成自然的一句话。</p>
<p>用 <code>type</code> 选连接方式。<code>&#x27;conjunction&#x27;</code> 是“和”，<code>&#x27;disjunction&#x27;</code> 是“或”，<code>&#x27;unit&#x27;</code> 用来写“5 小时 30 分”这类单位列表。</p>
<p>它只接受字符串。对象要先取出显示名，数字要先用 <code>NumberFormat</code> 格式化。需要给每一项加链接时，用 <code>formatToParts()</code>，它会把列表项和连接词分开返回。</p>
<p>要注意，空数组返回空字符串，这时显示“暂无参与者”还是隐藏整行，由业务决定。去重和排序也要在传进去之前做好。</p>
</blockquote>
<h2>基本用法</h2>
<p>下面同一组名字，分别用“和”与“或”连接，再看中文和边界情况。结果是 Node 22 实测的。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> names = [<span class="hljs-string">&#x27;Alice&#x27;</span>, <span class="hljs-string">&#x27;Bob&#x27;</span>, <span class="hljs-string">&#x27;Carol&#x27;</span>];
<span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">ListFormat</span>(<span class="hljs-string">&#x27;en&#x27;</span>, { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;conjunction&#x27;</span> }).<span class="hljs-title function_">format</span>(names); <span class="hljs-comment">// &#x27;Alice, Bob, and Carol&#x27;</span>
<span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">ListFormat</span>(<span class="hljs-string">&#x27;en&#x27;</span>, { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;disjunction&#x27;</span> }).<span class="hljs-title function_">format</span>(names); <span class="hljs-comment">// &#x27;Alice, Bob, or Carol&#x27;</span>
<span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">ListFormat</span>(<span class="hljs-string">&#x27;zh-CN&#x27;</span>).<span class="hljs-title function_">format</span>([<span class="hljs-string">&#x27;张三&#x27;</span>, <span class="hljs-string">&#x27;李四&#x27;</span>, <span class="hljs-string">&#x27;王五&#x27;</span>]); <span class="hljs-comment">// &#x27;张三、李四和王五&#x27;</span>
<span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">ListFormat</span>(<span class="hljs-string">&#x27;en&#x27;</span>).<span class="hljs-title function_">format</span>([]); <span class="hljs-comment">// &#x27;&#x27;</span>
<span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">ListFormat</span>(<span class="hljs-string">&#x27;en&#x27;</span>).<span class="hljs-title function_">format</span>([<span class="hljs-string">&#x27;Alice&#x27;</span>]); <span class="hljs-comment">// &#x27;Alice&#x27;</span>
</code></pre></div>
<p>英文最后一项前面有个逗号再加“and”，中文用顿号和“和”，这些细节手写 <code>join</code> 都照顾不到。只有一项时直接返回这一项，空数组返回空字符串。</p>
<p>还有一个 <code>style</code> 选项，可选 <code>long</code>、<code>short</code>、<code>narrow</code>。它改变的是连接词的写法，不是把列表截短。</p>
<h2>每一项要渲染成链接怎么办</h2>
<p><code>format()</code> 返回的是一整句字符串，没法给某个名字单独加链接。这时要用 <code>formatToParts()</code>。</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">UserList</span>(<span class="hljs-params">{ users, locale }</span>) {
  <span class="hljs-keyword">const</span> parts = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">ListFormat</span>(locale).<span class="hljs-title function_">formatToParts</span>(users.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">u</span>) =&gt;</span> u.<span class="hljs-property">name</span>));
  <span class="hljs-keyword">let</span> index = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">return</span> parts.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">part, i</span>) =&gt;</span>
    part.<span class="hljs-property">type</span> === <span class="hljs-string">&#x27;element&#x27;</span> ? (
      <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">a</span> <span class="hljs-attr">key</span>=<span class="hljs-string">{i}</span> <span class="hljs-attr">href</span>=<span class="hljs-string">{</span>\`/<span class="hljs-attr">users</span>/\${<span class="hljs-attr">users</span>[<span class="hljs-attr">index</span>++]<span class="hljs-attr">.id</span>}\`}&gt;</span>
        {part.value}
      <span class="hljs-tag">&lt;/<span class="hljs-name">a</span>&gt;</span></span>
    ) : (
      <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">span</span> <span class="hljs-attr">key</span>=<span class="hljs-string">{i}</span>&gt;</span>{part.value}<span class="hljs-tag">&lt;/<span class="hljs-name">span</span>&gt;</span></span>
    ),
  );
}
</code></pre></div>
<p><code>formatToParts()</code> 返回一个数组，<code>type</code> 是 <code>element</code> 的是列表项，其余是连接词和标点。</p>
<p>怎样知道某个 <code>element</code> 对应哪个用户？靠顺序。<code>element</code> 一定按输入顺序出现，所以用计数器映射回用户 ID 就行。不要用名字去找，因为可能有重名。也不要把拼好的整句按逗号拆开，名字里本身就可能有逗号。</p>
<p>另外，<code>ListFormat</code> 不做 HTML 转义，结果要当普通文本渲染。</p>
<h2>列表很长时怎么办</h2>
<p>“Alice、Bob 和其他 3 人”这种文案，要单独设计一条带复数的翻译消息。不要拼一个英文的“3 more”塞进列表里，换了语言就不通了。</p>
<p>成员有几十个时，与其拼成一句话，不如用真正的列表元素，加上分页或折叠。</p>
<h2>常见追问</h2>
<p><strong>测试时能直接比对输出字符串吗？</strong></p>
<blockquote>
<p>固定运行时版本时可以。跨环境时，CLDR 数据可能会调整标点和空格，直接比字符串容易误报。更稳妥的是检查每一项都在、顺序正确，并且 <code>formatToParts</code> 的各段拼起来等于 <code>format</code> 的结果。</p>
</blockquote>
<p><strong>它和 <code>Array.prototype.toLocaleString()</code> 有什么区别？</strong></p>
<blockquote>
<p><code>toLocaleString()</code> 只是把每一项本地化后用逗号连起来，没有“和”“或”这样的连接词。要生成能读的句子，还是用 <code>ListFormat</code>。</p>
</blockquote>`};export{e as default};