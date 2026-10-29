var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>因为合法的 JSON 不等于正确的数据。比如 <code>{&quot;quantity&quot;:&quot;很多&quot;}</code> 能解析，但数量不是整数；<code>{&quot;productId&quot;:&quot;不存在&quot;}</code> 格式没问题，商品却根本没有。</p>
<p>TypeScript 的 <code>as Order</code> 帮不上忙，它只在编译时起作用，运行时什么都不检查。外部来的数据要用 Zod、Valibot 这类库在运行时校验。</p>
<p>服务商的结构化输出模式是第一道防线，能让模型尽量按格式生成；应用自己的 Schema 校验和业务检查是第二道，比如商品存不存在、库存够不够、用户有没有权限。价格、用户角色、<code>approved</code> 这类字段，根本不能让模型提供，要从可信的服务重新取。</p>
<p>流式输出时，中途拿到的半个对象只能用来预览，要等完整生成并通过校验才能执行。校验失败可以让模型重试，但次数要有上限。</p>
</blockquote>
<h2>运行时校验怎么写</h2>
<p>下面用 Zod 定义一个下单草稿的格式，然后分两步检查：先看是不是合法 JSON，再看符不符合格式。</p>
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
<p>两种失败原因分开返回，是因为处理方式可能不同：JSON 坏了多半是输出被截断，格式不对则是模型理解错了，重试时给它的提示也不一样。</p>
<p>为什么用 <code>z.strictObject</code>？它碰到没定义的字段会直接拒绝。如果模型多塞了一个 <code>isAdmin: true</code>，后面的代码又恰好用了展开运算符把整个对象传下去，这个字段就可能被误用。你也可以选择把多余字段剥掉，但这是要明确做的选择，不要依赖库的默认行为。</p>
<h2>两道防线分别管什么</h2>
<table><thead><tr><th></th><th>服务商结构化输出</th><th>应用校验</th></tr></thead><tbody><tr><td>作用</td><td>让模型尽量按 JSON Schema 生成</td><td>拒绝不符合契约的数据</td></tr><tr><td>能检查</td><td>类型、必填字段、枚举</td><td>加上自定义规则和跨字段关系</td></tr><tr><td>不能检查</td><td>商品是否存在、库存、权限</td><td>商品是否存在、库存、权限（需要业务层）</td></tr></tbody></table>
<p>还要知道，服务商支持的 JSON Schema 通常只是完整规范的一部分，复杂一点的规则，要在应用里自己补上。</p>
<h2>流式输出的半成品对象怎么办</h2>
<p>AI SDK 的 <code>streamObject</code> 这类接口，会在生成过程中不断返回部分对象，比如已经有 <code>productId</code>、还没有 <code>quantity</code>。这个可以显示成草稿给用户看，但保存、下单、调用工具，都要等最终对象通过校验。</p>
<p>如果生成被停止了，或者断线了，缺的字段不要自己补默认值。比如把数量默认成 1，看起来很贴心，结果可能是一张用户从没确认过的订单。正确做法是标成“不完整”，让用户重新生成或者手动填。</p>
<h2>校验失败以后</h2>
<p>可以把错误信息交给模型，让它重试一两次，超过上限就交给用户处理。</p>
<p>不要用正则从模型的解释文字里截第一对大括号，也不要用 <code>eval</code> 去解析“看起来像对象的字符串”。前者很容易截错，后者等于执行模型写的代码。</p>
<h2>常见追问</h2>
<p><strong>服务商保证 100% 符合 Schema，还需要校验吗？</strong></p>
<blockquote>
<p>需要。输出可能被截断，Schema 也表达不了业务规则，而且服务商和模型版本随时可能换。</p>
</blockquote>
<p><strong>校验应该放在前端还是后端？</strong></p>
<blockquote>
<p>两边都做。前端校验是为了及时给用户提示，后端校验才是安全边界，因为前端的代码用户可以改。</p>
</blockquote>`};export{e as default};