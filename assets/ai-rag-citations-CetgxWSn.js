var e={answerHtml:`<h2>RAG 解决的是“模型当前没有这份资料”</h2>
<p>RAG 不是把公司资料重新训练进模型，也不要求一定使用向量数据库。系统可以使用关键词、向量、结构化查询或混合检索，先从外部数据中找出相关片段，再把片段作为本次回答的上下文。</p>
<p>回答质量取决于两段链路：资料有没有找对，模型有没有忠实使用资料。前端除了渲染文字，还要让用户知道答案依据、资料是否过期、哪些内容没有找到，以及引用能否打开。</p>
<h2>检索失败和生成失败要分开</h2>
<p>检索可能无结果、超时、被权限拒绝或返回相关性很低的片段；生成可能在检索成功后超时、中断或拒绝回答。它们不能都显示为“AI 正在思考”。</p>
<p>没有找到足够资料时，应说明检索范围和不足，让用户补充问题、选择数据源或接受“无法确认”的答案。不能为了始终返回文字，让模型把常识猜测包装成知识库结论。</p>
<p>检索命中关键词也不代表语境正确。相同术语可能来自另一版本、另一产品或相反条件，排序器需要考虑语义、权限、时间和来源质量。</p>
<h2>引用要绑定真实检索记录</h2>
<p>服务端应为命中文档和片段分配稳定 ID，记录标题、版本、时间、片段位置和允许展示的元信息。模型输出的是引用 ID，前端再映射到本次检索结果，而不是让模型随意生成 URL：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">Citation</span> = {
  <span class="hljs-attr">id</span>: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">documentId</span>: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">title</span>: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">version</span>?: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">excerpt</span>: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">start</span>?: <span class="hljs-built_in">number</span>;
  <span class="hljs-attr">updatedAt</span>?: <span class="hljs-built_in">string</span>;
};

<span class="hljs-keyword">function</span> <span class="hljs-title function_">resolveCitation</span>(<span class="hljs-params"><span class="hljs-attr">id</span>: <span class="hljs-built_in">string</span>, <span class="hljs-attr">allowed</span>: <span class="hljs-title class_">Citation</span>[]</span>) {
  <span class="hljs-keyword">return</span> allowed.<span class="hljs-title function_">find</span>(<span class="hljs-function">(<span class="hljs-params">citation</span>) =&gt;</span> citation.<span class="hljs-property">id</span> === id) ?? <span class="hljs-literal">null</span>;
}
</code></pre></div>
<p>引用 ID 不在本次允许集合中时，应显示为无效引用或隐藏链接，不能把一个模型生成的地址渲染成可信证据。文档有多个版本时，要保留能定位到实际片段的版本和位置，不能只链接到会持续变化的首页。</p>
<h2>“有来源”不等于“来源支持这句话”</h2>
<p>真实文档可能只支持结论的一半，模型还可能把相关性写成因果关系、把条件限制省略或混合不同版本。引用数量和链接数量不能直接代表忠实度。</p>
<p>界面可以展示可展开片段、更新时间、冲突来源和“未找到依据”的标记，但不要给没有计算方法的回答贴“可信度 98%”。如果服务只返回回答级来源列表，就不能在前端伪装成逐句引用；展示精度必须与服务端实际归因能力一致。</p>
<h2>权限必须在检索之前执行</h2>
<p>检索时就要按用户、租户、文档权限和数据状态过滤，不能把所有内部资料先送进模型，再要求模型不要泄露。未授权内容即使最后没显示，也已经越过了边界。</p>
<p>用户点击引用查看原文时，前端或服务端要重新校验权限。权限撤销、文档删除或链接过期后，应显示不可访问或已删除，而不是从历史缓存继续展示全文。标题、文件名和文档存在性本身也可能属于敏感元信息。</p>
<h2>检索内容也是不可信输入</h2>
<p>文档中可能包含提示词注入，例如要求忽略任务、读取秘密或调用工具。它是待分析资料，不是系统指令；来源内部、排序靠前或由工具返回，都不会自动提升其权限。</p>
<p>引用原文时要按不可信内容安全渲染，限制链接协议、外部目标和下载行为。不能因为它来自知识库就直接执行 HTML、脚本或文档宏。</p>
<h2>评测要拆开检索、生成和引用</h2>
<p>用户说“答案不对”时，需要知道是没有召回必要资料、排序把错误片段放前、模型没有遵循证据，还是引用 ID 映射错误。评测可以分别检查：</p>
<ul>
<li>检索是否找到必要文档</li>
<li>排序是否把相关片段放在合理位置</li>
<li>回答断言是否被片段支持</li>
<li>引用是否指向正确版本和位置</li>
<li>无资料或权限不足时是否合理拒答</li>
</ul>
<p>反馈记录应关联问题、检索集合、片段版本和生成配置，同时按隐私要求脱敏。RAG 界面的价值不是给答案贴一个“自动正确”的标签，而是让用户能检查证据、看见不足并决定下一步。</p>`};export{e as default};