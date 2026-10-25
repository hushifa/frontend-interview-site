var e={answerHtml:`<p>如果代码写成 <code>name + &#x27; 上传了 &#x27; + count + &#x27; 个文件&#x27;</code>，翻译人员只能替换零散片段，无法自由调整词序。遇到英语单复数、不同语言的动词变化或可选状态，条件判断会散落在组件里，翻译资源反而看不到完整意思。</p>
<p>ICU MessageFormat 将变量和语言分支放在一条完整消息中。代码提供结构化的值，消息决定怎样表达，让翻译人员有机会按照目标语言重组整句话。</p>
<p>以下示例使用常见的 ICU MessageFormat 1 风格语法。不同库支持范围不同，不能与 MessageFormat 2 的语法直接混用。</p>
<h3>一条消息处理数量变化</h3>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">{count, plural, =0 {No files uploaded.} one {# file uploaded.} other {# files uploaded.}}
</code></pre></div>
<p>count 是输入变量，plural 表示按当前语言的基数复数规则选分支。<code>=0</code> 是精确匹配，one、other 是语言类别；<code>#</code> 在该复数分支中表示按规则格式化的数量。</p>
<p>对于英文 locale，count 为 0、1、3 时分别表达没有文件、一个文件、三个文件。中文翻译可以写成另一条完整消息：</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">{count, plural, =0 {尚未上传文件。} other {已上传 # 个文件。}}
</code></pre></div>
<p>中文不必照抄英文的 one 分支，也不能要求其他语言只保留英文的两种形式。翻译资源需要覆盖各自语言真正使用的类别，并保留 other 作为兜底。</p>
<h3>select 处理状态，不必把逻辑塞回组件</h3>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">{status, select, pending {Your upload is waiting.} failed {Your upload failed.} other {View your upload.}}
</code></pre></div>
<p>select 根据字符串值选择分支，适合有限的状态或身份类别；未知状态进入 other。它不同于 plural，不会根据数字自动选择语法类别。</p>
<p>分支里可以再包含变量或复数规则。比如不同上传状态分别需要不同句子，就应让每个分支表达完整意思，而不是先选一个动词，再把名词片段拼在后面。</p>
<p>嵌套也有代价：多个维度组合会迅速增加翻译分支。必要时拆成语义独立的消息，但不要把一句自然语言拆成无法独立翻译的碎片。</p>
<h3>offset 用于“你和其他几个人”</h3>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">{count, plural, offset:1 =0 {Nobody joined.} =1 {You joined.} one {You and one other person joined.} other {You and # other people joined.}}
</code></pre></div>
<p>这里假设总人数包含当前用户。精确分支比较原始 count；没有命中精确分支时，复数类别按减去 offset 后的值选择，<code>#</code> 也显示减去 offset 后的数量。</p>
<p>因此 count 为 3 时，文案中的“其他人”是 2。offset 不是让调用方也先减一次，否则就会重复扣减。负数、超出业务范围的值应在进入消息前验证，语法不会替你判断人数是否合法。</p>
<h3>在 JavaScript 中需要消息实现库</h3>
<p>浏览器的 Intl 提供 NumberFormat、PluralRules 等基础能力，但没有一个可直接解析以上所有 ICU 消息的通用 <code>Intl.MessageFormat</code> 构造器。实际应用需要选择对应的消息库或编译工具，例如支持此语法的 FormatJS 实现。</p>
<p>通常在构建阶段校验或预编译翻译资源，在运行时只传入变量。要定义变量名称、类型和语义，避免中文使用 count、英文误写 total，直到用户切换语言才发现错误。</p>
<p>花括号、井号和 ASCII 单引号在相应位置有语法意义。需要显示这些字符时，应遵循所用实现的引用与转义规则，不要用随意的反斜杠替换处理整份翻译。</p>
<h3>模板来自可信资源，用户内容作为值传入</h3>
<p>用户姓名可以作为变量值，但不能先拼进模板再解析，否则姓名里的语法字符可能改变消息结构。普通变量替换与再次解析模板是不同操作。</p>
<p>富文本消息还取决于库的元素映射机制。优先使用明确允许的组件插槽或文本节点，不要把翻译结果直接交给 innerHTML。消息库解决语言表达，不自动承担所有 HTML 安全责任。</p>
<p>测试应覆盖每个选择分支、精确数值、目标语言复数类别、缺失变量和回退语言。这样发现的是实际文案问题，而不只是“字符串文件能被加载”。</p>`};export{e as default};