var e={answerHtml:`<h2>简答</h2>
<ul>
<li>名称简短、可识别，例如“删除”“搜索”；描述是额外信息，例如“密码至少 8 位”。</li>
<li>名称计算顺序：<code>aria-labelledby</code> &gt; <code>aria-label</code> &gt; 原生方式（<code>&lt;label&gt;</code>、<code>alt</code>、按钮文字、<code>legend</code>、<code>caption</code>）&gt; <code>title</code>。</li>
<li>按钮和链接的名称来自内容；<code>input</code> 的名称来自 <code>&lt;label&gt;</code>，<code>placeholder</code> 不应当作名称。</li>
<li>有些角色不能从内容计算名称，例如 <code>listitem</code>、<code>div</code>；给它们加 <code>aria-label</code> 也常被读屏忽略。</li>
<li>可见文字和名称要一致：按钮显示“提交”，<code>aria-label</code> 却写“发送表单”，语音控制用户说“点击提交”会找不到（WCAG 2.5.3）。</li>
</ul>
<h2>示例</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-comment">&lt;!-- 图标按钮 --&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">aria-label</span>=<span class="hljs-string">&quot;关闭&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">svg</span> <span class="hljs-attr">aria-hidden</span>=<span class="hljs-string">&quot;true&quot;</span>&gt;</span>…<span class="hljs-tag">&lt;/<span class="hljs-name">svg</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>

<span class="hljs-comment">&lt;!-- 输入框加说明 --&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">label</span> <span class="hljs-attr">for</span>=<span class="hljs-string">&quot;pw&quot;</span>&gt;</span>密码<span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;pw&quot;</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;password&quot;</span> <span class="hljs-attr">aria-describedby</span>=<span class="hljs-string">&quot;pw-hint&quot;</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">p</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;pw-hint&quot;</span>&gt;</span>至少 8 位，包含字母和数字<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>

<span class="hljs-comment">&lt;!-- 用已有文字组成名称 --&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">h2</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;order-title&quot;</span>&gt;</span>订单 #1024<span class="hljs-tag">&lt;/<span class="hljs-name">h2</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;del&quot;</span> <span class="hljs-attr">aria-labelledby</span>=<span class="hljs-string">&quot;del order-title&quot;</span>&gt;</span>删除<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
</code></pre></div>
<p>最后一个按钮的名称是“删除 订单 #1024”。列表中有多个“删除”按钮时，这样能区分它们。</p>
<h2>常见错误</h2>
<ul>
<li>只用 <code>placeholder</code> 作提示：输入后就消失，部分读屏不会可靠读出。</li>
<li><code>title</code> 当名称：触屏和键盘用户看不到提示框。</li>
<li>图片 <code>alt</code> 写“图片”或文件名：装饰性图片用 <code>alt=&quot;&quot;</code>，有信息的图片写出它传达的内容。</li>
<li>名称里包含角色：按钮名称写“提交按钮”，读屏会读成“提交按钮，按钮”。</li>
</ul>
<h2>怎样查看</h2>
<p>开发者工具的 Accessibility 面板会显示元素的计算名称、名称来源、角色和描述，比看代码更可靠。</p>
<h2>常见追问</h2>
<ul>
<li><code>aria-label</code> 和 <code>aria-labelledby</code> 怎么选？页面上已有可见文字时用 <code>aria-labelledby</code> 引用它，翻译和文案修改会同步生效；没有可见文字时才用 <code>aria-label</code>。</li>
</ul>`};export{e as default};