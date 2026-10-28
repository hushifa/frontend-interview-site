var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>name + &#x27; 上传了 &#x27; + count + &#x27; 个文件&#x27;</code> 把句子切成碎片，翻译者无法调整词序，也处理不了单复数。ICU 把整句写成一条消息，代码只传变量。</li>
<li><code>plural</code> 按语言的复数类别选分支，<code>=0</code> 这类写法精确匹配数值，<code>#</code> 代表格式化后的数字，<code>other</code> 必须存在。</li>
<li><code>select</code> 按字符串值选分支，适合状态、性别等有限选项，未知值进 <code>other</code>。</li>
<li><code>offset:1</code> 适合&quot;你和其他 N 人&quot;：类别和 <code>#</code> 都按减去 1 之后的值计算，精确匹配仍比较原值。</li>
<li>浏览器没有内置的 ICU 消息解析器，需要 FormatJS（<code>intl-messageformat</code>）等库，最好在构建时校验消息语法。</li>
</ul>
<h2>plural</h2>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">{count, plural, =0 {No files uploaded.} one {# file uploaded.} other {# files uploaded.}}
</code></pre></div>
<p>中文翻译只需要自己语言的类别：</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">{count, plural, =0 {尚未上传文件。} other {已上传 # 个文件。}}
</code></pre></div>
<p>每种语言有哪些类别由 CLDR 规定，可以用 <code>new Intl.PluralRules(locale).resolvedOptions().pluralCategories</code> 查看，见<a href="/questions/i18n-plural-rules/">《Intl.PluralRules 怎样帮助实现国际化复数？》</a>。</p>
<h2>select</h2>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">{status, select, pending {正在等待上传。} failed {上传失败。} other {查看上传结果。}}
</code></pre></div>
<p>每个分支写完整的句子，不要先选一个动词再拼名词。分支可以嵌套变量和 plural，但维度组合多了翻译量会成倍增加，必要时拆成独立消息。</p>
<h2>offset</h2>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">{count, plural, offset:1
  =0 {还没有人参加。}
  =1 {你已参加。}
  other {你和其他 # 人已参加。}}
</code></pre></div>
<p><code>count</code> 为 3 时，没有命中 <code>=0</code>、<code>=1</code>，按 3 − 1 = 2 选类别，<code>#</code> 显示 2。调用方传总人数，不要自己先减 1。</p>
<h2>在 JavaScript 中使用</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { <span class="hljs-title class_">IntlMessageFormat</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;intl-messageformat&#x27;</span>;

<span class="hljs-keyword">const</span> message = <span class="hljs-keyword">new</span> <span class="hljs-title class_">IntlMessageFormat</span>(
  <span class="hljs-string">&#x27;{count, plural, one {# file} other {# files}}&#x27;</span>,
  <span class="hljs-string">&#x27;en&#x27;</span>,
);
message.<span class="hljs-title function_">format</span>({ <span class="hljs-attr">count</span>: <span class="hljs-number">3</span> }); <span class="hljs-comment">// &#x27;3 files&#x27;</span>
</code></pre></div>
<ul>
<li>构建时解析所有消息，语法错误、变量名不一致（中文用 <code>count</code>、英文写成 <code>total</code>）在 CI 中报错。</li>
<li><code>{</code>、<code>}</code>、<code>#</code> 和单引号有语法含义，显示这些字符要按 ICU 的引用规则转义。</li>
</ul>
<h2>安全</h2>
<p>用户名等内容作为变量值传给 <code>format()</code>。如果先拼进模板再解析，用户输入里的花括号会改变消息结构。富文本用库的标签映射功能（<code>&lt;b&gt;{name}&lt;/b&gt;</code> 映射成组件），不要把结果交给 <code>innerHTML</code>。</p>
<h2>常见追问</h2>
<ul>
<li><strong>MessageFormat 2 是什么？</strong> Unicode 制定的新一代消息语法，和 ICU MessageFormat 1 的语法不兼容，不要在同一个项目里混用。</li>
<li><strong>组件库里的文案怎样翻译？</strong> 组件接收已经格式化好的字符串或消息键，由应用的消息层统一处理。</li>
</ul>`};export{e as default};