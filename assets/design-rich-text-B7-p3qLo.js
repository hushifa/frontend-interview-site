var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>在后台写文章，可以选中一段文字点“加粗”，插入图片、列表、链接，所见即所得。这类编辑器就是富文本编辑器。</p>
<p>它的基础是 HTML 的 <code>contenteditable</code> 属性。元素加上它，用户就能在里面输入、删除、选中文字，光标、输入法、拼写检查都由浏览器提供。早期的编辑器再配合 <code>document.execCommand(&#x27;bold&#x27;)</code> 这类命令做格式化，浏览器直接改 DOM。</p>
<p>问题在于，<code>execCommand</code> 现在被 MDN 标为弃用、不标准，不同浏览器执行同一个命令生成的 HTML 不一样，粘贴进来的内容也会带上各种格式。所以现代编辑器一般自己维护一份文档数据，拦截 <code>beforeinput</code> 等输入事件，先改数据，再按数据重新渲染 DOM，<code>contenteditable</code> 只负责提供光标和输入能力。</p>
<p>要注意两件事：粘贴和输出的 HTML 必须清洗，否则就是 XSS 漏洞；中文输入法输入时，组合过程中的事件不一定能取消，编辑器要等组合结束再同步数据。</p>
</blockquote>
<h2>contenteditable 提供了什么</h2>
<p><code>contenteditable</code> 是一个全局属性。MDN 说明它可以取 <code>true</code>（或空字符串）、<code>false</code>、<code>plaintext-only</code>；属性缺失或取值无效时，从父元素继承，所以父元素可编辑，子元素也可编辑。</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">contenteditable</span>=<span class="hljs-string">&quot;true&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>在这里输入<span class="hljs-tag">&lt;<span class="hljs-name">strong</span>&gt;</span>正文<span class="hljs-tag">&lt;/<span class="hljs-name">strong</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
</code></pre></div>
<p>加上以后，浏览器把它变成一个可编辑区域：能聚焦，能用 Tab 进入，用户可以直接打字、选中、删除，光标移动和输入法都由浏览器处理。这些能力自己实现成本极高，所以几乎所有网页富文本编辑器都建立在它之上。</p>
<p>MDN 还提到粘贴的区别：内容粘贴进 <code>contenteditable=&quot;true&quot;</code> 的元素时，格式全部保留；粘贴进 <code>plaintext-only</code> 时，格式全部去掉。只需要纯文本的场景，比如评论框，用 <code>plaintext-only</code> 省事很多。</p>
<h2>execCommand 为什么不推荐用了</h2>
<p>早期做加粗，只要一行：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">document</span>.<span class="hljs-title function_">execCommand</span>(<span class="hljs-string">&#x27;bold&#x27;</span>);
</code></pre></div>
<p>浏览器会把当前选区包上加粗标签。插入列表、链接、图片也都有对应命令。</p>
<p>MDN 现在把这个方法标为弃用（Deprecated）和不标准（Non-standard），不建议在生产环境用。MDN 同时承认，它还有一些暂时没有替代品的用法：和直接操作 DOM 不同，<code>execCommand</code> 的修改会进入浏览器的撤销栈，用户按 Ctrl+Z 能撤回。如果非用不可，要测试跨浏览器兼容性。复制粘贴相关的命令，MDN 建议改用 Clipboard API。</p>
<p>它的问题在于结果不可控。MDN 介绍的 <code>styleWithCSS</code> 命令就能切换输出方式：设为 <code>true</code> 时生成 <code>style</code> 属性，设为 <code>false</code> 时生成 <code>&lt;b&gt;</code> 这类表现型标签，各浏览器的默认行为和细节也不完全一样；连续操作后 DOM 里会堆积大量嵌套标签。MDN 还提到，它的修改是否触发 <code>beforeinput</code> 和 <code>input</code> 事件，取决于浏览器和配置。编辑器的数据如果直接取 <code>innerHTML</code>，就很难保持干净和一致。</p>
<h2>现代编辑器是怎样工作的</h2>
<p>主流方案的思路是把“数据”和“显示”分开。</p>
<p>编辑器内部用一份结构化的数据描述文档，比如“一个段落，里面有一段普通文字和一段加粗文字”。界面上的 DOM 只是这份数据渲染出来的结果。</p>
<p>用户输入时，编辑器监听 <code>beforeinput</code> 事件。MDN 介绍，这个事件在可编辑内容即将被修改前触发，适用于 <code>contenteditable</code> 元素，能让应用在浏览器改 DOM 之前接管编辑行为。事件对象的 <code>inputType</code> 说明这是什么操作（插入文字、删除、换行、加粗等），编辑器取消默认行为，自己去改数据，再重新渲染。</p>
<p>光标位置用 Selection API 读取和设置。MDN 说明 <code>Selection</code> 对象表示用户选中的文字范围或当前光标位置，通过 <code>window.getSelection()</code> 获取。编辑器把 DOM 里的选区换算成数据里的位置；重新渲染后，再把数据里的位置换算回 DOM，设置回去，否则光标会跳。</p>
<p>这样做以后，格式化、撤销重做、协同编辑都基于数据进行，输出的 HTML 也由编辑器统一生成，结构可控。代价是实现复杂，所以通常直接用成熟的开源编辑器框架。</p>
<h2>beforeinput 能拦住所有输入吗</h2>
<p>拦不住。MDN 明确写了：并不是每次修改都会触发 <code>beforeinput</code>，有时它触发了但不能取消。自动完成、拼写纠正、密码管理器填充、输入法输入等情况都可能这样，具体因浏览器和操作系统而异。MDN 的建议是同时处理 <code>input</code> 事件，必要时撤销 <code>beforeinput</code> 没处理到的修改。</p>
<p>中文输入法是最常见的情况。用户打拼音时，候选字还没确定，DOM 里已经出现了临时文字。编辑器在这期间不能重新渲染那块 DOM，否则会打断输入法。通常的做法是在 <code>compositionstart</code> 到 <code>compositionend</code> 之间暂停同步，组合结束后读出最终文字再更新数据。</p>
<h2>粘贴和保存时为什么要清洗 HTML</h2>
<p>粘贴从网页或 Word 复制的内容，剪贴板里的 HTML 会带着各种样式、类名、注释，甚至脚本和事件属性。直接插进编辑区，既会污染格式，也有安全风险。编辑器应该读出剪贴板的 HTML，按白名单只保留允许的标签和属性，转换成自己的数据结构。</p>
<p>保存后展示文章时也一样。富文本最终以 HTML 输出，展示页如果直接用 <code>innerHTML</code> 插入，别人提交的 <code>&lt;img src=x onerror=...&gt;</code> 就会执行。所以服务端保存前和展示前都要用成熟的清洗库过滤，XSS 的原理和防范见<a href="/questions/http-xss/">《XSS 和 CSRF 有什么区别？分别如何防范？》</a>。</p>
<h2>常见追问</h2>
<p><strong>只需要支持加粗和链接，也要自己做文档模型吗？</strong></p>
<blockquote>
<p>不一定。需求很简单时，用 <code>contenteditable</code> 加少量命令，保存前清洗 HTML 就能用。但要接受跨浏览器的标签不一致。功能一多、需要协同或者对输出格式有要求，就该换成基于数据模型的编辑器框架。</p>
</blockquote>
<p><strong>为什么有的编辑器不用 contenteditable，而是自己画光标？</strong></p>
<blockquote>
<p>在线文档、表格这类对排版控制要求极高的产品，会用隐藏的输入框接收键盘和输入法，自己用 DOM 或 Canvas 画文字和光标。这样排版完全可控，但光标、选区、输入法候选框位置、无障碍都要自己实现，成本非常高。</p>
</blockquote>
<p><strong>contenteditable 里嵌套 contenteditable 有什么要注意的？</strong></p>
<blockquote>
<p>MDN 提到，嵌套在另一个 <code>contenteditable</code> 元素里的 <code>contenteditable</code> 元素，默认不会加入 Tab 键的顺序，需要的话要加 <code>tabindex=&quot;0&quot;</code>。另外属性会继承，想让编辑区里某一块不可编辑，要显式写 <code>contenteditable=&quot;false&quot;</code>。</p>
</blockquote>`};export{e as default};