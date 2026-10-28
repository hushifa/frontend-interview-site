var e={answerHtml:`<p>把中文直接写进组件，短期最省事；当产品增加英文、阿拉伯文和日文后，问题会变成：哪些文案需要翻译、占位符怎样保证、复数规则在哪里处理、翻译缺失时显示什么，以及翻译更新后如何不破坏页面布局。</p>
<p>国际化不是把每个字符串换成另一种语言，而是建立一条可维护的消息数据流：组件提供稳定的消息键和变量，语言目录提供翻译，格式化层根据 locale 处理数字、日期、列表和复数。</p>
<h2>消息键应表达用途，不要把原文当唯一 ID</h2>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;profile.save&quot;: &quot;保存资料&quot;,
  &quot;profile.saveSuccess&quot;: &quot;资料已保存&quot;,
  &quot;search.resultCount&quot;: &quot;找到 {count} 条结果&quot;
}
</code></pre></div>
<p>组件使用 <code>profile.save</code>，英文目录可以提供对应消息：</p>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;profile.save&quot;: &quot;Save profile&quot;,
  &quot;profile.saveSuccess&quot;: &quot;Profile saved&quot;,
  &quot;search.resultCount&quot;: &quot;{count} results found&quot;
}
</code></pre></div>
<p>稳定键便于重命名中文文案、查找缺失翻译和由翻译平台导出目录。键名不能包含用户输入或动态路径，否则难以审查和统计。也不要只用完整中文句子作为键，因为改动原文会让所有语言目录失去对应关系。</p>
<h2>插值必须按消息格式处理</h2>
<p>不要用字符串拼接把变量塞进句子：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 不推荐：不同语言的词序和标点可能完全不同。</span>
<span class="hljs-string">\`<span class="hljs-subst">\${userName}</span> 有 <span class="hljs-subst">\${count}</span> 条消息\`</span>
</code></pre></div>
<p>应让消息格式决定变量位置，并限制变量类型。变量内容是用户输入时，渲染层仍要按文本处理，不能把翻译结果或插值内容当 HTML 执行。需要富文本时，要使用明确的安全组件标记和允许的元素，不要开放任意 HTML。</p>
<p>复数不能只用 <code>count === 1</code> 判断。不同语言有零、单数、双数、少数和多种复数类别，应该使用 <code>Intl.PluralRules</code> 或成熟的消息格式库：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> rules = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">PluralRules</span>(<span class="hljs-string">&#x27;ar&#x27;</span>);
<span class="hljs-keyword">const</span> category = rules.<span class="hljs-title function_">select</span>(count);
<span class="hljs-keyword">const</span> messages = {
  <span class="hljs-attr">zero</span>: <span class="hljs-string">&#x27;没有消息&#x27;</span>,
  <span class="hljs-attr">one</span>: <span class="hljs-string">&#x27;有一条消息&#x27;</span>,
  <span class="hljs-attr">two</span>: <span class="hljs-string">&#x27;有两条消息&#x27;</span>,
  <span class="hljs-attr">few</span>: <span class="hljs-string">&#x27;有 {count} 条消息&#x27;</span>,
  <span class="hljs-attr">many</span>: <span class="hljs-string">&#x27;有 {count} 条消息&#x27;</span>,
  <span class="hljs-attr">other</span>: <span class="hljs-string">&#x27;有 {count} 条消息&#x27;</span>,
};
</code></pre></div>
<p>真实产品应让翻译目录负责完整句子和类别，而不是让组件自己拼接词尾。<code>Intl.PluralRules</code> 只决定类别，不会替你生成自然语言，也不包含所有 ICU 消息格式能力。</p>
<h2>语言回退和缺失消息要可见</h2>
<p>用户选择 <code>zh-Hant-TW</code> 时，目录可能按 <code>zh-Hant-TW → zh-Hant → zh → 默认语言</code> 的顺序查找。回退链要统一定义，避免一个组件回退英文、另一个组件回退简体中文。区域标签还应按 BCP 47 规则处理，不能只用字符串切掉最后两个字符。</p>
<p>缺失消息应在开发和 CI 中暴露键名、文件和语言；生产环境可以回退默认语言，但不能静默返回空字符串。空字符串可能让按钮没有名称、错误提示消失或布局出现不可解释的空白。</p>
<p>翻译平台导入的 JSON/YAML 仍需做 schema 和占位符检查：每种语言都应包含必需键，变量名称和类型不能丢失，消息格式必须能解析。翻译者可以调整句子顺序，但不能删除业务必需的变量。</p>
<h2>异步加载语言目录要处理竞态</h2>
<p>只在用户切换语言时动态加载目录，可以减少首屏资源，但切换过程中要显示明确状态，且旧语言的慢加载结果不能覆盖最新选择。每次加载使用语言代次或 AbortSignal，组件卸载时停止无关更新。</p>
<p>切换语言后，页面标题、文档方向、日期数字格式、服务端请求头和缓存键也可能需要同步。只替换按钮文字不等于整页已经切换完成。公共 HTML 的语言和方向属性应与实际内容一致，例如 <code>lang=&quot;ar&quot;</code> 和 <code>dir=&quot;rtl&quot;</code>。</p>
<p>服务端渲染或静态生成时，要保证服务端和客户端使用相同的初始 locale 与消息目录，否则 hydration 可能出现文本不一致。翻译目录进入客户端包后属于公开内容，不能把密钥或内部注释放进去。</p>
<h2>日期、数字、列表和货币不要手写格式</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> locale = <span class="hljs-string">&#x27;de-DE&#x27;</span>;
<span class="hljs-keyword">const</span> date = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">DateTimeFormat</span>(locale, { <span class="hljs-attr">dateStyle</span>: <span class="hljs-string">&#x27;medium&#x27;</span> }).<span class="hljs-title function_">format</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>());
<span class="hljs-keyword">const</span> amount = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">NumberFormat</span>(locale, { <span class="hljs-attr">style</span>: <span class="hljs-string">&#x27;currency&#x27;</span>, <span class="hljs-attr">currency</span>: <span class="hljs-string">&#x27;EUR&#x27;</span> }).<span class="hljs-title function_">format</span>(<span class="hljs-number">1234.5</span>);
<span class="hljs-keyword">const</span> names = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">ListFormat</span>(locale, { <span class="hljs-attr">style</span>: <span class="hljs-string">&#x27;long&#x27;</span>, <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;conjunction&#x27;</span> }).<span class="hljs-title function_">format</span>([<span class="hljs-string">&#x27;A&#x27;</span>, <span class="hljs-string">&#x27;B&#x27;</span>, <span class="hljs-string">&#x27;C&#x27;</span>]);
</code></pre></div>
<p>这些 API 处理小数分隔符、货币位置、列表连接词和语言规则。业务仍需明确时区、货币、精度和四舍五入；<code>Intl</code> 不会替你决定订单金额应按哪个时区或汇率展示。服务端和前端也要统一数据语义，不能把已经格式化的字符串再格式化一次。</p>
<h2>布局和测试要按最坏文案验收</h2>
<p>英文可能比中文更长，德文复合词、阿拉伯文 RTL、日文换行和复数消息都会改变布局。按钮、表格、弹窗、错误提示和导航应测试长文案、缺失字体、文字放大、窄屏和混合方向文本。不要用截断或缩小字体把翻译问题隐藏起来。</p>
<p>伪本地化可以把文字扩展、加入重音字符或模拟 RTL，提前发现硬编码、拼接、固定宽度和字符编码问题。自动检查可以验证键集合、占位符和格式语法；真正的语言质量和任务理解仍需要母语审校。</p>
<p>一个可靠的翻译工作流让组件只负责表达任务和变量，消息目录负责语言，<code>Intl</code> 负责格式规则，构建和测试负责发现缺失与布局回归。这样新增语言时不会把每个组件改成一套难以维护的条件分支。</p>`};export{e as default};