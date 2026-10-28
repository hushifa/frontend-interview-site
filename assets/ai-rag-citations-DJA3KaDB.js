var e={answerHtml:`<h2>简答</h2>
<ul>
<li>RAG 不是把资料训练进模型，而是每次回答前检索相关片段，放进本次请求的上下文。检索可以用关键词、向量或混合方式。</li>
<li>回答质量取决于两段：资料有没有找对，模型有没有忠实使用资料。界面要分别显示&quot;没找到资料&quot;和&quot;生成失败&quot;。</li>
<li>模型输出引用 ID，前端把它映射到本次检索返回的记录上；不在本次结果里的 ID 显示为无效，不渲染模型自己编的 URL。</li>
<li>有引用不等于引用支持这句话，界面提供可展开的原文片段和更新时间，让用户自己核对。</li>
<li>权限过滤在检索阶段完成。检索到的文档也可能含有提示词注入，按不可信内容处理。</li>
</ul>
<h2>引用怎样绑定</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">Citation</span> = {
  <span class="hljs-attr">id</span>: <span class="hljs-built_in">string</span>; <span class="hljs-comment">// 本次检索内唯一</span>
  <span class="hljs-attr">documentId</span>: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">title</span>: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">version</span>?: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">excerpt</span>: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">updatedAt</span>?: <span class="hljs-built_in">string</span>;
};

<span class="hljs-keyword">function</span> <span class="hljs-title function_">resolveCitation</span>(<span class="hljs-params"><span class="hljs-attr">id</span>: <span class="hljs-built_in">string</span>, <span class="hljs-attr">retrieved</span>: <span class="hljs-title class_">Map</span>&lt;<span class="hljs-built_in">string</span>, <span class="hljs-title class_">Citation</span>&gt;</span>) {
  <span class="hljs-keyword">return</span> retrieved.<span class="hljs-title function_">get</span>(id) ?? <span class="hljs-literal">null</span>; <span class="hljs-comment">// 找不到就显示&quot;无效引用&quot;</span>
}
</code></pre></div>
<p>文档有多个版本时，引用要指向具体版本和位置，不要只链接到会变化的首页。</p>
<p>如果服务端只能给出&quot;整段回答用了哪些来源&quot;，界面就不要伪装成逐句引用。</p>
<h2>界面状态</h2>
<table><thead><tr><th>情况</th><th>展示</th></tr></thead><tbody><tr><td>检索中</td><td>&quot;正在查找资料&quot;，可以显示检索范围</td></tr><tr><td>没有足够资料</td><td>说明没找到，建议换个问法或选择其他数据源，不要让模型凭常识编答案</td></tr><tr><td>检索成功、生成失败</td><td>保留已找到的来源，提供重试</td></tr><tr><td>回答完成</td><td>引用标号可点击展开片段，显示文档标题、版本和更新时间</td></tr></tbody></table>
<p>不要显示没有计算依据的&quot;可信度 98%&quot;。</p>
<h2>权限</h2>
<ul>
<li>检索时就按用户、租户、文档权限过滤。把所有资料都交给模型、再要求它别泄露，权限早已越界。</li>
<li>用户点开引用查看原文时再校验一次权限；文档删除或权限撤销后显示&quot;无法访问&quot;。</li>
<li>文档标题和文件名本身也可能是敏感信息。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li><strong>用户反馈&quot;答案不对&quot;，怎么定位？</strong> 分开检查：必要文档有没有召回、排序是否把错误片段放前面、回答是否被片段支持、引用是否指向正确版本。反馈记录要关联本次检索结果和片段版本。</li>
<li><strong>检索内容让模型&quot;忽略之前的指令&quot;怎么办？</strong> 见<a href="/questions/ai-prompt-injection/">《提示词注入与普通 XSS 有什么区别？》</a>。</li>
</ul>`};export{e as default};