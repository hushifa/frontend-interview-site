var e={answerHtml:`<h2>简答</h2>
<ul>
<li>可访问名称说明“这是什么”，描述提供额外上下文，必填、无效、展开等用各自的状态属性表达。</li>
<li>优先用可见文字和原生语义提供名称：输入框用 label，按钮用内部文字，表格用 caption，字段组用 legend。</li>
<li><code>aria-describedby</code> 关联补充说明或错误文本，名称不必包含角色已表达的“按钮”二字。</li>
<li>出现错误时保持名称不变，更新错误文本和 <code>aria-invalid</code> 等状态。</li>
</ul>
<p>读屏用户进入一个输入框时，需要先知道“这是什么字段”，再知道“填写时要注意什么”。前者由可访问名称承担，后者通常属于描述。</p>
<p>例如名称是“联系邮箱”，描述是“用于接收保存通知”；必填、无效、展开等信息则有各自的状态语义。不能把所有内容都拼进 aria-label，也不能只有一段说明却没有字段名称。</p>
<h2>名称帮助识别控件，描述提供额外上下文</h2>
<table><thead><tr><th>信息</th><th>例子</th><th>作用</th></tr></thead><tbody><tr><td>名称</td><td>联系邮箱</td><td>识别当前字段或操作</td></tr><tr><td>角色</td><td>文本框、按钮</td><td>表达元素是什么类型的交互</td></tr><tr><td>状态</td><td>必填、无效、已展开</td><td>表达当前可操作状态</td></tr><tr><td>描述</td><td>用于接收保存通知</td><td>补充用途、格式或错误原因</td></tr></tbody></table>
<p>浏览器把这些信息组织到可访问性树中，辅助技术再决定具体怎样呈现。实际朗读顺序和措辞可能因浏览器、读屏设置而不同，所以不能把一次输出写死成所有用户都会听到的固定句子。</p>
<p>名称应足够简洁且能区分对象，不必包含已经由角色表达的“按钮”二字。描述也不应把整个页面说明全部塞进去，避免每次聚焦都被迫听一大段重复内容。</p>
<h2>优先让可见文字与原生语义提供名称</h2>
<p>输入框通常使用 label，按钮使用内部可见文本，表格可以使用 caption，字段组可以使用 legend。这样的名称容易随着界面文案和翻译一起维护，也能帮助不使用读屏的用户。</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">label</span> <span class="hljs-attr">for</span>=<span class="hljs-string">&quot;contact-email&quot;</span>&gt;</span>联系邮箱<span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">input</span>
  <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;contact-email&quot;</span>
  <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;email&quot;</span>
  <span class="hljs-attr">required</span>
  <span class="hljs-attr">aria-invalid</span>=<span class="hljs-string">&quot;false&quot;</span>
  <span class="hljs-attr">aria-describedby</span>=<span class="hljs-string">&quot;email-help email-error&quot;</span>
/&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">p</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;email-help&quot;</span>&gt;</span>用于接收保存通知。<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">p</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;email-error&quot;</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
</code></pre></div>
<p>这里的名称来自 label 的“联系邮箱”，描述来自被 aria-describedby 引用的文本，required 表达必填状态。label 的 for 必须与 input 的 id 对应，仅在视觉上把文字放在旁边不等于建立了程序关联。</p>
<p>错误出现时，可以保持名称不变，更新错误文本和状态：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">setFieldError</span>(<span class="hljs-params">input, errorElement, message</span>) {
  errorElement.<span class="hljs-property">textContent</span> = message;
  input.<span class="hljs-title function_">setAttribute</span>(<span class="hljs-string">&#x27;aria-invalid&#x27;</span>, message ? <span class="hljs-string">&#x27;true&#x27;</span> : <span class="hljs-string">&#x27;false&#x27;</span>);
}
</code></pre></div>
<p>调用时传入上面的输入框、email-error 元素和实际错误字符串；清除错误时传空字符串。描述引用保留在原字段上，用户再次来到字段时仍能找到原因。若还需要立即通知错误，应另外考虑合适的 live region 或焦点策略，aria-invalid 本身不是完整错误播报方案。</p>
<h2>aria-label 与 aria-labelledby 分别适合什么情况</h2>
<p>只有图标、没有可引用文字的按钮，可以提供简短的 aria-label：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span> <span class="hljs-attr">aria-label</span>=<span class="hljs-string">&quot;关闭设置&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">span</span> <span class="hljs-attr">aria-hidden</span>=<span class="hljs-string">&quot;true&quot;</span>&gt;</span>×<span class="hljs-tag">&lt;/<span class="hljs-name">span</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
</code></pre></div>
<p>可见标题或其他文字已经存在时，aria-labelledby 可以直接引用它们，减少重复文案维护。多个 ID 按属性中列出的顺序参与名称组合：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">span</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;draft-title&quot;</span>&gt;</span>闭包笔记<span class="hljs-tag">&lt;/<span class="hljs-name">span</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span> <span class="hljs-attr">aria-labelledby</span>=<span class="hljs-string">&quot;delete-label draft-title&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">span</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;delete-label&quot;</span>&gt;</span>删除<span class="hljs-tag">&lt;/<span class="hljs-name">span</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
</code></pre></div>
<p>这个按钮的名称可以是“删除 闭包笔记”，帮助用户区分一组相似的删除按钮。真正列表中的每一组 ID 都必须唯一，不能复制一百行后都叫同一个 draft-title。</p>
<p>ARIA 并非放在任何元素上都有同样效果。某些角色不允许命名，普通无语义容器也不是加一个 aria-label 就自动成为有意义的控件。应先选择正确元素和角色，再补齐需要的信息。</p>
<h2>覆盖名称时，别把用户看到的词换掉</h2>
<p>在常见可命名控件上，有效的 aria-labelledby 通常优先于 aria-label，后者又可能覆盖元素原本通过可见内容或原生关联得到的名称。具体计算有角色与宿主语言规则，不能简单把所有属性无条件相加。</p>
<p>例如按钮可见文字是“提交”，却写了 <code>aria-label=&quot;保存&quot;</code>，辅助技术可能把它称为“保存”。语音输入用户看着屏幕说“点击提交”时，名称对不上就可能操作困难。</p>
<p>通常应让名称包含对应可见标签的文字，必要时再加区分上下文。不要为了“读屏专用文案”随意创造另一套完全不同的词汇。</p>
<p>如果某个引用 ID 不存在、重复或错误地指向了别处，最终名称也可能与预期不同。代码里有 aria-labelledby，不证明浏览器成功算出了正确名称。</p>
<h2>placeholder、title 和隐藏文本有什么边界</h2>
<p>placeholder 是填写示例或提示，输入后通常消失，不适合替代持久可见的 label。部分环境可能把它作为后备名称，但依赖这种后备行为既不稳健，也让已填写字段更难理解。</p>
<p>title 同样可能在某些名称或描述计算中作为后备，但鼠标悬停提示不等于可靠的键盘、触摸和读屏标签。重要名称和帮助文字应明确呈现与关联。</p>
<p>隐藏文本的规则也不能简单理解成“看不见就永远不参与名称”。被 aria-labelledby 或 aria-describedby 直接引用的隐藏内容，在相应计算规则下仍可能参与；某些普通后代的 aria-hidden 内容则会被排除。要去掉错误描述，应清理内容或引用，而不是只把它视觉隐藏后就假定读屏不会读到。</p>
<h2>图片名称要体现用途，而不只是外观</h2>
<p>有信息意义的图片需要合适的替代文本；装饰图片通常使用空 alt，让它不制造无意义的阅读负担。缺少 alt 与 <code>alt=&quot;&quot;</code> 不相同，前者可能造成文件名等不理想的回退。</p>
<p>图片如果本身是链接或按钮的主要内容，替代文本还应表达操作或目的。例如用于下载报告的图标，不应只描述成“向下的箭头”，而忽略用户真正要执行的动作。</p>
<p>同时避免同一操作既有清晰文字，又把旁边的装饰图标命名成重复的内容，让用户每次都听到两遍。</p>
<h2>验证应看计算结果，而不仅是源码</h2>
<p>在浏览器 Accessibility 面板中查看控件的 computed name、description、role 和状态，追踪名称来自哪里，特别留意被覆盖的原生标签和错误引用。</p>
<p>然后用目标读屏和语音输入方式检查字段、图标按钮、重复列表操作和动态错误。自动化能判断部分名称是否存在，却不能保证名称准确、有区分度、与可见界面一致，也不能代替真实使用中的理解过程。</p>`};export{e as default};