var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>RAG 不是把资料训练进模型，而是每次回答之前，先去资料库里查出相关的片段，放进这次请求里让模型参考。查的方式可以是关键词、向量，或者两者结合。</p>
<p>所以回答好不好取决于两步：资料有没有找对，模型有没有老老实实照着资料说。界面上要把“没找到资料”和“生成失败”分开显示。</p>
<p>引用要对得上。模型输出的是引用 ID，前端拿它去本次检索结果里找；找不到的显示为无效引用，模型自己编的 URL 不要渲染。而且有引用不代表引用真的支持这句话，要让用户能展开看原文片段和更新时间，自己核对。</p>
<p>权限要在检索时就过滤好。检索出来的文档里也可能藏着提示词注入，要当成不可信内容处理。</p>
</blockquote>
<h2>引用怎么对应到真实的资料</h2>
<p>下面是引用的数据结构，以及前端怎么查找它：</p>
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
<p>为什么不直接显示模型给的链接？因为模型可能编。它可能写出一个看起来很像样、但根本不存在的文档地址。前端只认这次检索真实返回的记录，模型只负责说“我用了第几条”，标题、链接、原文都从检索记录里取。</p>
<p>文档有多个版本时，引用要指向具体的版本和位置，不要只链到一个会变的首页，不然过几天用户点进去，内容已经对不上了。</p>
<p>还有一点：如果服务端只能给出“整段回答参考了哪些来源”，界面就不要假装成每一句都有对应引用。</p>
<h2>每种情况界面显示什么</h2>
<table><thead><tr><th>情况</th><th>展示</th></tr></thead><tbody><tr><td>检索中</td><td>“正在查找资料”，可以显示检索范围</td></tr><tr><td>没有足够资料</td><td>说明没找到，建议换个问法或选择其他数据源，不要让模型凭常识编答案</td></tr><tr><td>检索成功、生成失败</td><td>保留已找到的来源，提供重试</td></tr><tr><td>回答完成</td><td>引用标号可点击展开片段，显示文档标题、版本和更新时间</td></tr></tbody></table>
<p>不要显示“可信度 98%”这种没有计算依据的数字，它会让用户误以为答案经过了验证。</p>
<h2>权限为什么要在检索时就过滤</h2>
<p>如果先把所有资料都交给模型，再叮嘱它“别把用户没权限的内容说出来”，那权限其实早就越界了，模型已经看到了，说不说只能看运气。所以检索阶段就要按用户、租户、文档权限过滤。</p>
<p>用户点开引用查看原文时，还要再校验一次权限。文档被删了或者权限被撤销了，显示“无法访问”。</p>
<p>别忘了，文档标题和文件名本身也可能是敏感信息，比如“某某裁员名单.xlsx”。</p>
<h2>常见追问</h2>
<p><strong>用户反馈“答案不对”，怎么定位问题？</strong></p>
<blockquote>
<p>一段段查：需要的文档有没有被查出来；排序有没有把错误的片段排到前面；回答是不是真的被片段支持；引用有没有指向正确的版本。所以反馈记录要和这次的检索结果、片段版本关联起来，不然没法复现。</p>
</blockquote>
<p><strong>检索出来的内容让模型“忽略之前的指令”怎么办？</strong></p>
<blockquote>
<p>这就是间接提示词注入，处理方法见<a href="/questions/ai-prompt-injection/">《提示词注入与普通 XSS 有什么区别？》</a>。</p>
</blockquote>`};export{e as default};