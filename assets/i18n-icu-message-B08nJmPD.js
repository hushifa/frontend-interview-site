var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>写 <code>name + &#x27; 上传了 &#x27; + count + &#x27; 个文件&#x27;</code>，句子就被切成了碎片。翻译者拿到的是几段零散的词，没法调整词序，也处理不了单复数。ICU MessageFormat 的做法是把整句话写成一条消息，代码只负责传变量。</p>
<p>消息里有两种常用分支。<code>plural</code> 按数字所属的复数类别选句子，<code>=0</code> 这种写法是精确匹配某个数，<code>#</code> 代表格式化后的数字，<code>other</code> 必须有。<code>select</code> 按字符串值选句子，适合状态、性别这类有限选项，没列出的值进 <code>other</code>。</p>
<p>还有一个 <code>offset:1</code>，专门做“你和其他 N 人”这种文案。类别和 <code>#</code> 都按减去 1 之后的值算，但精确匹配比较的仍是原值。</p>
<p>要注意，浏览器没有内置 ICU 消息解析器，要用 FormatJS 的 <code>intl-messageformat</code> 这类库，最好在构建时就校验消息语法。用户输入只能当变量值传进去，不能拼进模板。</p>
</blockquote>
<h2>plural 怎样按数量选句子</h2>
<p>先看英文消息。它用大括号把变量 <code>count</code> 包起来，后面列出每种情况对应的整句。</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">{count, plural, =0 {No files uploaded.} one {# file uploaded.} other {# files uploaded.}}
</code></pre></div>
<p><code>count</code> 是 0 时命中 <code>=0</code>；是 1 时属于英文的 <code>one</code> 类别；其他数字都进 <code>other</code>。<code>#</code> 会被替换成格式化后的数字。</p>
<p>中文翻译只需要写中文用得到的类别：</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">{count, plural, =0 {尚未上传文件。} other {已上传 # 个文件。}}
</code></pre></div>
<p>中文没有单复数变化，所以只有 <code>other</code>。每种语言有哪些类别是 CLDR 规定的，可以用 <code>new Intl.PluralRules(locale).resolvedOptions().pluralCategories</code> 查看，详见<a href="/questions/i18n-plural-rules/">《Intl.PluralRules 怎样帮助实现国际化复数？》</a>。</p>
<h2>select 怎样按状态选句子</h2>
<p><code>select</code> 不看数字，看字符串的值。</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">{status, select, pending {正在等待上传。} failed {上传失败。} other {查看上传结果。}}
</code></pre></div>
<p>每个分支都要写完整的句子，不要先选出一个动词，再去拼名词，因为别的语言里词序和变形可能完全不同。分支里也能嵌套变量和 <code>plural</code>，可是维度一多，组合就成倍增加，翻译量跟着翻倍。组合太多时，干脆拆成几条独立消息。</p>
<h2>offset 解决“你和其他 N 人”</h2>
<p>这种文案的难点在于，显示的数字比总人数少 1。</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">{count, plural, offset:1
  =0 {还没有人参加。}
  =1 {你已参加。}
  other {你和其他 # 人已参加。}}
</code></pre></div>
<p>假设 <code>count</code> 是 3。它没有命中 <code>=0</code> 和 <code>=1</code>，于是先算 3 − 1 = 2，按 2 选类别，<code>#</code> 也显示 2，结果是“你和其他 2 人已参加”。所以调用方传总人数就行，不要自己先减 1，否则会减两次。</p>
<h2>在 JavaScript 中怎么用</h2>
<p>浏览器不会解析这种语法，要借助库。下面用的是 FormatJS 的 <code>intl-messageformat</code>。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { <span class="hljs-title class_">IntlMessageFormat</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;intl-messageformat&#x27;</span>;

<span class="hljs-keyword">const</span> message = <span class="hljs-keyword">new</span> <span class="hljs-title class_">IntlMessageFormat</span>(
  <span class="hljs-string">&#x27;{count, plural, one {# file} other {# files}}&#x27;</span>,
  <span class="hljs-string">&#x27;en&#x27;</span>,
);
message.<span class="hljs-title function_">format</span>({ <span class="hljs-attr">count</span>: <span class="hljs-number">3</span> }); <span class="hljs-comment">// &#x27;3 files&#x27;</span>
</code></pre></div>
<p>上线前最好在构建时把所有消息都解析一遍。这样语法错误，或者变量名对不上（中文用 <code>count</code>，英文写成了 <code>total</code>），都能在 CI 里报出来，而不是等用户看到。</p>
<p>另外，<code>{</code>、<code>}</code>、<code>#</code> 和单引号在消息里有语法含义。要显示这些字符本身，得按 ICU 的引用规则转义。</p>
<h2>为什么用户内容不能拼进模板</h2>
<p>用户名这类内容，要作为变量值传给 <code>format()</code>。如果先把它拼进模板再解析，用户输入里的花括号就会被当成语法，改变整条消息的结构。</p>
<p>富文本也一样。需要加粗或链接时，用库提供的标签映射，比如把 <code>&lt;b&gt;{name}&lt;/b&gt;</code> 映射成组件，不要把格式化结果交给 <code>innerHTML</code>。</p>
<h2>常见追问</h2>
<p><strong>MessageFormat 2 是什么？</strong></p>
<blockquote>
<p>它是 Unicode 制定的新一代消息语法，和 ICU MessageFormat 1 的语法不兼容。所以同一个项目里不要两种混着用。</p>
</blockquote>
<p><strong>组件库里的文案怎样翻译？</strong></p>
<blockquote>
<p>组件只接收已经格式化好的字符串，或者消息键，翻译交给应用的消息层统一处理。这样组件库本身不用关心用的是哪种消息格式。</p>
</blockquote>`};export{e as default};