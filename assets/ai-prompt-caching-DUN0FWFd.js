var e={answerHtml:`<h2>它缓存的不是上一条回答</h2>
<p>提示词缓存通常复用重复输入前缀的处理结果。系统规则、稳定工具定义和固定背景如果在多次请求中保持一致，服务商可能不必每次从头处理它们；当前用户问题和新增输出仍然需要计算。</p>
<p>因此缓存命中不代表答案被直接返回，也不保证下一次输出相同。排队、网络、工具调用和输出长度仍会决定用户等待时间。</p>
<h2>请求结构决定有没有可复用前缀</h2>
<p>假设每次请求都把时间戳、随机 ID 或变化的工具定义放在最前面，后面的长文档就难以形成相同前缀。通常可以让稳定部分保持顺序，把会变化的用户问题和临时检索结果放在后面：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">buildMessages</span>(<span class="hljs-params">{ systemRules, tools, history, question, documents }</span>) {
  <span class="hljs-keyword">return</span> [
    { <span class="hljs-attr">role</span>: <span class="hljs-string">&#x27;system&#x27;</span>, <span class="hljs-attr">content</span>: systemRules },
    { <span class="hljs-attr">role</span>: <span class="hljs-string">&#x27;system&#x27;</span>, <span class="hljs-attr">content</span>: <span class="hljs-title function_">serializeTools</span>(tools) },
    ...history,
    { <span class="hljs-attr">role</span>: <span class="hljs-string">&#x27;user&#x27;</span>, <span class="hljs-attr">content</span>: <span class="hljs-title function_">buildQuestion</span>(question, documents) },
  ];
}
</code></pre></div>
<p>这只是请求组织示意。不能为了命中率把本来与用户身份绑定的权限约束挪成所有用户共享的内容，也不能为了稳定前缀保留不再适用的背景。正确性和最小权限优先于命中率。</p>
<p>“看起来相同”不等于缓存键相同。角色、内容块顺序、工具配置、模型版本、系统参数和服务商的断点规则都可能影响命中。应查看目标服务最终接收的结构和返回的缓存 usage，而不是只看前端字符串。</p>
<h2>自动缓存和显式断点不是通用标准</h2>
<p>有的服务自动识别前缀，有的要求 <code>cache_control</code> 或内容块级断点；有效期、最小长度、可缓存内容和读写价格也不同。不能把一个供应商的字段复制到另一个模型，就认为都支持同样语义。SDK 还可能改写请求，必要时检查最终网络载荷和文档版本。</p>
<p>缓存写入可能收费，读取也未必免费。只有一次请求、很少重复或前缀很短时，启用缓存可能增加成本而没有收益。应按请求类型比较缓存读、写、未命中的实际 usage 和延迟。</p>
<h2>命中和未命中都必须保持正确</h2>
<p>模型版本变化、系统提示词更新、工具定义变化、缓存过期和平台调度都会导致未命中。未命中时应用仍应正常生成，只是成本或延迟不同，不能把缓存当作业务数据来源。</p>
<p>Prompt Cache 也不是对话数据库。页面刷新或跨设备恢复时，历史必须从自己的持久化系统读取，再按当前权限和版本构造请求。不能假设服务商会永久保留之前的上下文。</p>
<p>系统提示词和工具配置可以版本化，用于解释命中变化；但不要每次请求无意义地改变版本字段，否则会主动破坏复用。用户权限、租户和数据版本变化时，宁愿失去命中也不能复用错误上下文。</p>
<h2>缓存不是权限隔离</h2>
<p>不能因为平台声称按账户或组织隔离，就把用户 A 的私有资料放进可能被用户 B 复用的前缀。应用仍要在构造提示词和检索上下文前完成租户过滤，限制敏感字段和保留期限。缓存命中也不应被前端用来推断其他用户是否发过某段内容。</p>
<p>生产监控可以分别记录输入输出用量、缓存读写、模型版本、前缀版本、首 Token 延迟和完整响应时间，但默认不要记录完整私有提示词。优化顺序应是先保证权限和答案正确，再稳定结构，最后用实际 usage 证明成本和延迟确实下降。</p>`};export{e as default};