var e={answerHtml:`<p>“请返回 JSON”只是语言要求，不保证输出完整或字段符合应用契约。结构化输出模式可以通过模型或 SDK 提供更强约束，但仍要处理截断、拒绝、传输失败、支持的 Schema 子集以及业务语义。</p>
<p>应该分三层判断：有没有得到完整结果，格式与结构是否合法，这些数据是否真实且允许执行。</p>
<h3>JSON.parse 只解决语法</h3>
<p><code>{&quot;quantity&quot;:&quot;很多&quot;}</code> 是合法 JSON，但数量类型不符合要求；<code>{&quot;productId&quot;:&quot;不存在&quot;,&quot;quantity&quot;:2}</code> 结构可能正确，却不能直接创建订单。</p>
<p>TypeScript 类型断言也不会检查运行时数据。把 JSON.parse 的结果 <code>as Order</code>，只是让编译器相信你，不能阻止模型输出错误字段。</p>
<h3>用运行时 Schema 建立明确数据入口</h3>
<p>下面只解析一个订单草案，不执行下单。它使用 Zod，并对未知字段采用拒绝策略：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { z } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;zod&#x27;</span>;

<span class="hljs-keyword">const</span> <span class="hljs-title class_">DraftSchema</span> = z.<span class="hljs-title function_">strictObject</span>({
  <span class="hljs-attr">productId</span>: z.<span class="hljs-title function_">string</span>().<span class="hljs-title function_">regex</span>(<span class="hljs-regexp">/^[a-zA-Z0-9_-]{1,64}$/</span>),
  <span class="hljs-attr">quantity</span>: z.<span class="hljs-title function_">number</span>().<span class="hljs-title function_">int</span>().<span class="hljs-title function_">min</span>(<span class="hljs-number">1</span>).<span class="hljs-title function_">max</span>(<span class="hljs-number">100</span>),
});

<span class="hljs-keyword">function</span> <span class="hljs-title function_">parseDraft</span>(<span class="hljs-params">text</span>) {
  <span class="hljs-keyword">let</span> value;
  <span class="hljs-keyword">try</span> {
    value = <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">parse</span>(text);
  } <span class="hljs-keyword">catch</span> {
    <span class="hljs-keyword">return</span> { <span class="hljs-attr">ok</span>: <span class="hljs-literal">false</span>, <span class="hljs-attr">reason</span>: <span class="hljs-string">&#x27;invalid-json&#x27;</span> };
  }
  <span class="hljs-keyword">const</span> result = <span class="hljs-title class_">DraftSchema</span>.<span class="hljs-title function_">safeParse</span>(value);
  <span class="hljs-keyword">if</span> (!result.<span class="hljs-property">success</span>) <span class="hljs-keyword">return</span> { <span class="hljs-attr">ok</span>: <span class="hljs-literal">false</span>, <span class="hljs-attr">reason</span>: <span class="hljs-string">&#x27;invalid-schema&#x27;</span> };
  <span class="hljs-keyword">return</span> { <span class="hljs-attr">ok</span>: <span class="hljs-literal">true</span>, <span class="hljs-attr">data</span>: result.<span class="hljs-property">data</span> };
}
</code></pre></div>
<p>quantity 为字符串、负数或超出范围都会失败，额外的 approved 字段也不会悄悄成为可信授权。具体是拒绝、剥离还是保留未知字段，应按协议明确，不能依赖库默认行为而不知情。</p>
<p>这个正则只定义商品 ID 的格式，不证明商品存在。示例也不接受模型提供的价格，实际金额应由可信商品与定价服务计算。</p>
<h3>约束生成与应用校验各有作用</h3>
<p>服务商的结构化输出可以提高结构符合度，SDK 也可能在生成完成时做 Schema 验证。应确认你读取的是已经验证的输出，还是流式预览中的部分对象。</p>
<p>模型支持的 JSON Schema 能力可能有限，自定义 refinement 或跨字段规则未必能直接转成模型约束。因此不要因为传过 schema，就删除应用与执行端必要的业务检查。</p>
<p>schema 合法也不表示事实正确。日期、引用、库存、收件人和资源归属仍要核验；模型输出 userId、role 或 approved 不能决定当前用户权限。</p>
<h3>流式部分对象只能作为预览</h3>
<p>中途可能只有 productId，还没接到 quantity；也可能字符串或嵌套对象未结束。界面可以逐步展示字段，但不能以“目前看起来合理”为由提前保存或调用有副作用工具。</p>
<p>必须等协议确认正常完成，取得最终对象并验证，才能进入后续流程。用户停止、超时或断线后，不应把暂存部分字段补默认值就当成完整结果。</p>
<h3>修复策略应有边界</h3>
<p>格式失败可以请求重新生成、提示用户检查或放弃。修复次数、总时长和费用要有上限，避免模型与校验器无限互相纠错。</p>
<p>不要用正则从任意解释文本中随便截取第一对大括号，也不要用 eval 解析“像 JavaScript 的对象”。去掉代码围栏等兼容操作也应有严格约定，避免把真正的错误默默吞掉。</p>
<p>对高风险数据，缺失字段不能自动填成会改变业务的值。例如数量缺失默认为 1 可能导致用户未确认的订单；先回到草案或人工确认阶段更可靠。</p>
<p>测试应覆盖非法 JSON、类型错误、边界数值、未知字段、结构合法但业务拒绝，以及中途截断。这样才把“格式整齐”与“可以安全使用”真正区分开。</p>`};export{e as default};