var e={answerHtml:`<h2>简答</h2>
<ul>
<li>JSON 合法不代表字段符合运行时契约，也不代表数据可以执行。</li>
<li>所有模型输出都要经过解析、Schema 校验和业务核验。</li>
<li>服务商的结构化输出约束和应用校验是两道防线。</li>
<li>流式的部分对象只能预览，不能提前执行；修复重试要有次数上限。</li>
</ul>
<h2>JSON 合法不等于应用可以使用</h2>
<p><code>{&quot;quantity&quot;:&quot;很多&quot;}</code> 是合法 JSON，但数量不是应用需要的整数；<code>{&quot;productId&quot;:&quot;不存在&quot;,&quot;quantity&quot;:2}</code> 结构正确，却不能直接创建订单。模型还可能输出截断对象、缺失字段、未知字段或夹带解释文本。</p>
<p>TypeScript 的 <code>as Order</code> 只改变编译器的看法，不会在运行时检查数据。结构化输出模式能提高符合度，但仍可能受模型能力、Schema 子集、网络截断和业务语义影响。</p>
<h2>让所有外部数据经过运行时入口</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">import</span> { z } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;zod&#x27;</span>;

<span class="hljs-keyword">const</span> <span class="hljs-title class_">DraftSchema</span> = z.<span class="hljs-title function_">strictObject</span>({
  <span class="hljs-attr">productId</span>: z.<span class="hljs-title function_">string</span>().<span class="hljs-title function_">regex</span>(<span class="hljs-regexp">/^[A-Za-z0-9_-]{1,64}$/</span>),
  <span class="hljs-attr">quantity</span>: z.<span class="hljs-title function_">number</span>().<span class="hljs-title function_">int</span>().<span class="hljs-title function_">min</span>(<span class="hljs-number">1</span>).<span class="hljs-title function_">max</span>(<span class="hljs-number">100</span>),
});

<span class="hljs-keyword">function</span> <span class="hljs-title function_">parseDraft</span>(<span class="hljs-params"><span class="hljs-attr">text</span>: <span class="hljs-built_in">string</span></span>) {
  <span class="hljs-keyword">let</span> <span class="hljs-attr">value</span>: <span class="hljs-built_in">unknown</span>;
  <span class="hljs-keyword">try</span> {
    value = <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">parse</span>(text);
  } <span class="hljs-keyword">catch</span> {
    <span class="hljs-keyword">return</span> { <span class="hljs-attr">ok</span>: <span class="hljs-literal">false</span>, <span class="hljs-attr">reason</span>: <span class="hljs-string">&#x27;invalid-json&#x27;</span> <span class="hljs-keyword">as</span> <span class="hljs-keyword">const</span> };
  }

  <span class="hljs-keyword">const</span> result = <span class="hljs-title class_">DraftSchema</span>.<span class="hljs-title function_">safeParse</span>(value);
  <span class="hljs-keyword">if</span> (!result.<span class="hljs-property">success</span>) <span class="hljs-keyword">return</span> { <span class="hljs-attr">ok</span>: <span class="hljs-literal">false</span>, <span class="hljs-attr">reason</span>: <span class="hljs-string">&#x27;invalid-schema&#x27;</span> <span class="hljs-keyword">as</span> <span class="hljs-keyword">const</span> };
  <span class="hljs-keyword">return</span> { <span class="hljs-attr">ok</span>: <span class="hljs-literal">true</span>, <span class="hljs-attr">data</span>: result.<span class="hljs-property">data</span> };
}
</code></pre></div>
<p>Schema 约束了类型、范围和字段集合，但 <code>productId</code> 格式正确不代表商品存在，数量合法也不代表库存足够。价格、用户身份、角色、权限和 <code>approved</code> 字段不能由模型提供，必须从可信服务和当前会话重新取得。</p>
<p>未知字段是协议选择：可以严格拒绝、明确剥离或保留到另一个扩展字段，但不能让库默认行为悄悄把 <code>role</code>、<code>isAdmin</code> 或 <code>approved</code> 变成可信控制值。</p>
<h2>生成约束和应用校验是两道防线</h2>
<p>服务商或 SDK 的结构化输出可以帮助模型更接近 Schema，生成完成时也可能提供验证结果。要确认读取的是最终已验证对象，还是流式预览中的部分对象。模型支持的 JSON Schema 子集可能不支持自定义 refinement、跨字段关系和所有业务规则。</p>
<p>因此应用和执行端仍要检查事实、资源归属、版本、权限和状态。Schema 合法的日期可能已过期，合法的引用可能属于另一个租户，合法的金额可能与当前价格不一致。</p>
<h2>流式对象只能展示，不能提前执行</h2>
<p>中途可能只有 <code>productId</code>，嵌套对象也可能尚未闭合。界面可以把部分字段作为草案预览，但不能因为当前看起来合理就保存、下单或调用有副作用工具。只有协议确认正常完成、获得最终对象并通过校验后，才能进入下一阶段。</p>
<p>用户停止、超时和断线后，不能给缺失字段补默认值来伪装完整结果。前端应标记为不完整，允许重新生成或让用户手动修正。</p>
<h2>修复和重试必须有上限</h2>
<p>格式错误可以重新生成、提示用户修改或放弃，但修复次数、总时长和费用必须有限。模型与校验器无限互相纠错，会把一次简单失败变成不可控循环。</p>
<p>不要用正则从解释文本中截第一对大括号，也不要用 <code>eval</code> 解析“像 JavaScript 的对象”。去掉代码围栏等兼容步骤也要有明确协议和失败路径，不能默默吞掉真正的格式错误。</p>
<p>高风险数据缺失时不能填入会改变业务的默认值。数量缺失默认 1 可能导致用户未确认的订单，更安全的流程是回到草案或人工确认。</p>
<p>测试要覆盖非法 JSON、截断、类型错误、边界数值、未知字段、结构合法但业务拒绝、权限变化和重复执行。结构整齐只是输入契约的一部分，安全可用还需要可信数据和业务校验。</p>`};export{e as default};