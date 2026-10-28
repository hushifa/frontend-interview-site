var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>{&quot;quantity&quot;:&quot;很多&quot;}</code> 是合法 JSON，但数量不是整数；<code>{&quot;productId&quot;:&quot;不存在&quot;}</code> 结构对，商品却不存在。</li>
<li>TypeScript 的 <code>as Order</code> 只影响编译期，运行时不做任何检查。外部数据要经过 Zod、Valibot 这类运行时校验。</li>
<li>服务商的结构化输出模式是第一道防线，应用的 Schema 校验和业务核验（商品是否存在、库存、权限）是第二道。</li>
<li>价格、用户角色、<code>approved</code> 这类字段不能由模型提供，要从可信服务重新获取。</li>
<li>流式输出的部分对象只用于预览，完成并通过校验后才能执行；校验失败时的重试要有次数上限。</li>
</ul>
<h2>运行时校验示例</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">import</span> { z } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;zod&#x27;</span>;

<span class="hljs-keyword">const</span> <span class="hljs-title class_">DraftSchema</span> = z.<span class="hljs-title function_">strictObject</span>({
  <span class="hljs-attr">productId</span>: z.<span class="hljs-title function_">string</span>().<span class="hljs-title function_">regex</span>(<span class="hljs-regexp">/^[A-Za-z0-9_-]{1,64}$/</span>),
  <span class="hljs-attr">quantity</span>: z.<span class="hljs-title function_">number</span>().<span class="hljs-title function_">int</span>().<span class="hljs-title function_">min</span>(<span class="hljs-number">1</span>).<span class="hljs-title function_">max</span>(<span class="hljs-number">100</span>),
});

<span class="hljs-keyword">type</span> <span class="hljs-title class_">ParseResult</span> =
  | { <span class="hljs-attr">ok</span>: <span class="hljs-literal">true</span>; <span class="hljs-attr">data</span>: z.<span class="hljs-property">infer</span>&lt;<span class="hljs-keyword">typeof</span> <span class="hljs-title class_">DraftSchema</span>&gt; }
  | { <span class="hljs-attr">ok</span>: <span class="hljs-literal">false</span>; <span class="hljs-attr">reason</span>: <span class="hljs-string">&#x27;invalid-json&#x27;</span> | <span class="hljs-string">&#x27;invalid-schema&#x27;</span> };

<span class="hljs-keyword">function</span> <span class="hljs-title function_">parseDraft</span>(<span class="hljs-params"><span class="hljs-attr">text</span>: <span class="hljs-built_in">string</span></span>): <span class="hljs-title class_">ParseResult</span> {
  <span class="hljs-keyword">let</span> <span class="hljs-attr">value</span>: <span class="hljs-built_in">unknown</span>;
  <span class="hljs-keyword">try</span> {
    value = <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">parse</span>(text);
  } <span class="hljs-keyword">catch</span> {
    <span class="hljs-keyword">return</span> { <span class="hljs-attr">ok</span>: <span class="hljs-literal">false</span>, <span class="hljs-attr">reason</span>: <span class="hljs-string">&#x27;invalid-json&#x27;</span> };
  }
  <span class="hljs-keyword">const</span> result = <span class="hljs-title class_">DraftSchema</span>.<span class="hljs-title function_">safeParse</span>(value);
  <span class="hljs-keyword">return</span> result.<span class="hljs-property">success</span>
    ? { <span class="hljs-attr">ok</span>: <span class="hljs-literal">true</span>, <span class="hljs-attr">data</span>: result.<span class="hljs-property">data</span> }
    : { <span class="hljs-attr">ok</span>: <span class="hljs-literal">false</span>, <span class="hljs-attr">reason</span>: <span class="hljs-string">&#x27;invalid-schema&#x27;</span> };
}
</code></pre></div>
<p><code>z.strictObject</code> 遇到未知字段直接拒绝，防止模型塞进 <code>isAdmin: true</code> 之类的字段被后续代码误用。也可以选择剥离未知字段，但要明确选择，不要依赖库的默认行为。</p>
<h2>两道防线各管什么</h2>
<table><thead><tr><th></th><th>服务商结构化输出</th><th>应用校验</th></tr></thead><tbody><tr><td>作用</td><td>让模型尽量按 JSON Schema 生成</td><td>拒绝不符合契约的数据</td></tr><tr><td>能检查</td><td>类型、必填字段、枚举</td><td>加上自定义规则和跨字段关系</td></tr><tr><td>不能检查</td><td>商品是否存在、库存、权限</td><td>商品是否存在、库存、权限（需要业务层）</td></tr></tbody></table>
<p>服务商支持的 JSON Schema 通常只是一个子集，复杂规则要在应用里补。</p>
<h2>流式对象</h2>
<p>AI SDK 的 <code>streamObject</code> 等接口会在生成中途返回部分对象，例如只有 <code>productId</code>、还没有 <code>quantity</code>。可以展示成草稿，但保存、下单、调用工具要等最终对象通过校验。</p>
<p>生成被停止或断线时，不要给缺失字段补默认值，例如把数量默认成 1，这可能造成用户没确认过的订单。应标记为不完整，让用户重新生成或手动填写。</p>
<h2>失败处理</h2>
<ul>
<li>校验失败后可以把错误信息交给模型重试一次或两次，超过上限就交给用户处理。</li>
<li>不要用正则从解释文本里截取第一对大括号，也不要用 <code>eval</code> 解析&quot;像对象的字符串&quot;。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li><strong>服务商保证 100% 符合 Schema，还需要校验吗？</strong> 需要。输出可能被截断，Schema 也表达不了业务规则，而且服务商、模型版本随时可能更换。</li>
<li><strong>校验应放在前端还是后端？</strong> 两边都做。前端校验用于即时提示，后端校验才是安全边界。</li>
</ul>`};export{e as default};