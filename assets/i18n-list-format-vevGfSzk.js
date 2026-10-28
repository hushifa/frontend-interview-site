var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>names.join(&#x27;, &#x27;)</code> 处理不了各语言的连接词和标点：英文是 &quot;Alice, Bob, and Carol&quot;，中文是&quot;张三、李四和王五&quot;。</li>
<li><code>type: &#x27;conjunction&#x27;</code> 表示&quot;和&quot;，<code>&#x27;disjunction&#x27;</code> 表示&quot;或&quot;，<code>&#x27;unit&#x27;</code> 用于&quot;5 小时 30 分&quot;这类单位列表。</li>
<li>只接受字符串。对象要先取显示名，数字要先用 <code>NumberFormat</code> 格式化。</li>
<li>空数组返回空字符串，显示&quot;暂无参与者&quot;还是隐藏整行由业务决定；去重和排序也要事先完成。</li>
<li>需要给每一项加链接时用 <code>formatToParts()</code>，它把输入项和连接词分开返回。</li>
</ul>
<h2>基本用法（Node 22 实测）</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> names = [<span class="hljs-string">&#x27;Alice&#x27;</span>, <span class="hljs-string">&#x27;Bob&#x27;</span>, <span class="hljs-string">&#x27;Carol&#x27;</span>];
<span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">ListFormat</span>(<span class="hljs-string">&#x27;en&#x27;</span>, { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;conjunction&#x27;</span> }).<span class="hljs-title function_">format</span>(names); <span class="hljs-comment">// &#x27;Alice, Bob, and Carol&#x27;</span>
<span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">ListFormat</span>(<span class="hljs-string">&#x27;en&#x27;</span>, { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;disjunction&#x27;</span> }).<span class="hljs-title function_">format</span>(names); <span class="hljs-comment">// &#x27;Alice, Bob, or Carol&#x27;</span>
<span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">ListFormat</span>(<span class="hljs-string">&#x27;zh-CN&#x27;</span>).<span class="hljs-title function_">format</span>([<span class="hljs-string">&#x27;张三&#x27;</span>, <span class="hljs-string">&#x27;李四&#x27;</span>, <span class="hljs-string">&#x27;王五&#x27;</span>]); <span class="hljs-comment">// &#x27;张三、李四和王五&#x27;</span>
<span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">ListFormat</span>(<span class="hljs-string">&#x27;en&#x27;</span>).<span class="hljs-title function_">format</span>([]); <span class="hljs-comment">// &#x27;&#x27;</span>
<span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">ListFormat</span>(<span class="hljs-string">&#x27;en&#x27;</span>).<span class="hljs-title function_">format</span>([<span class="hljs-string">&#x27;Alice&#x27;</span>]); <span class="hljs-comment">// &#x27;Alice&#x27;</span>
</code></pre></div>
<p><code>style</code> 有 <code>long</code>、<code>short</code>、<code>narrow</code>，影响连接词的写法，不是长度截断。</p>
<h2>每项渲染成链接</h2>
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
<p><code>element</code> 按输入顺序出现，用顺序映射回用户 ID，不要用名字当键，因为可能重名。不要把拼好的整句按逗号拆开，名字里也可能有逗号。</p>
<p><code>ListFormat</code> 不做 HTML 转义，结果按普通文本渲染。</p>
<h2>列表很长时</h2>
<p>&quot;Alice、Bob 和其他 3 人&quot;要单独设计一条带复数的翻译消息，不要拼一个英文的 &quot;3 more&quot; 塞进列表。几十个成员更适合用真正的列表元素、分页或折叠展示。</p>
<h2>常见追问</h2>
<ul>
<li><strong>测试时能直接比对输出字符串吗？</strong> 固定运行时版本时可以；跨环境时 CLDR 数据可能调整标点和空格，更稳妥的是检查各项都在、顺序正确、<code>formatToParts</code> 拼起来等于 <code>format</code> 的结果。</li>
<li><strong>和 <code>Array.prototype.toLocaleString()</code> 有什么区别？</strong> 后者只用逗号连接各项的本地化字符串，没有&quot;和&quot;&quot;或&quot;之类的连接词。</li>
</ul>`};export{e as default};