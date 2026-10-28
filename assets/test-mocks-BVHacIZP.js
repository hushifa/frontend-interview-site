var e={answerHtml:`<h2>简答</h2>
<ul>
<li>Mock 用来控制外部不确定性，让测试稳定触发目标场景。</li>
<li>替换得太深时，测试只证明假对象之间的调用，真实代码几乎没参与。</li>
<li>选择离目标行为合适的边界，常见做法是在网络边界提供响应。</li>
<li>clear 清调用记录，reset 还清替代实现，restore 恢复原始方法。</li>
</ul>
<p>测试订单超时提示时，不必真的等待第三方服务偶发超时；测试随机抽样逻辑时，也不应让随机结果决定用例是否通过。Mock 可以控制这些外部不确定性，让测试稳定触发目标场景。</p>
<p>问题在于替换得太深：如果请求函数、数据转换、状态管理和子组件全被替换，测试可能只证明几个假对象按预设方式互相调用，真实代码反而几乎没参与。</p>
<h2>选择离目标行为合适的边界</h2>
<p>测试纯计算时通常直接传入数据，不需要 Mock。测试组件的错误提示，可以在网络边界提供失败响应，让真实请求处理与 UI 状态继续运行。测试一次通知是否发出，可以替换公开通知接口并检查参数。</p>
<p>替身不一定都用复杂 Mock 框架。一个返回固定值的函数、一个内存仓库或一个可控时钟都可能足够。关键是替身代替了什么真实能力，以及哪些行为仍由真实代码完成。</p>
<p>例如要验证“失败后重试”，可以让依赖第一次拒绝、第二次成功，但仍应验证成功结果和错误恢复。只断言被调用两次，无法证明重试的是正确请求，也无法证明结果最终到达用户。</p>
<h2>clear、reset、restore 不要混为一谈</h2>
<p>下面是当前 Vitest 行为的独立用例：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { expect, test, vi } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;vitest&#x27;</span>;

<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;区分调用记录、替代实现和原始方法&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-keyword">const</span> service = { <span class="hljs-attr">read</span>: <span class="hljs-function">() =&gt;</span> <span class="hljs-string">&#x27;真实结果&#x27;</span> };
  <span class="hljs-keyword">const</span> original = service.<span class="hljs-property">read</span>;
  <span class="hljs-keyword">const</span> spy = vi.<span class="hljs-title function_">spyOn</span>(service, <span class="hljs-string">&#x27;read&#x27;</span>).<span class="hljs-title function_">mockReturnValue</span>(<span class="hljs-string">&#x27;模拟结果&#x27;</span>);

  <span class="hljs-title function_">expect</span>(service.<span class="hljs-title function_">read</span>()).<span class="hljs-title function_">toBe</span>(<span class="hljs-string">&#x27;模拟结果&#x27;</span>);
  spy.<span class="hljs-title function_">mockClear</span>();
  <span class="hljs-title function_">expect</span>(spy).<span class="hljs-property">not</span>.<span class="hljs-title function_">toHaveBeenCalled</span>();
  <span class="hljs-title function_">expect</span>(service.<span class="hljs-title function_">read</span>()).<span class="hljs-title function_">toBe</span>(<span class="hljs-string">&#x27;模拟结果&#x27;</span>);

  spy.<span class="hljs-title function_">mockReset</span>();
  <span class="hljs-title function_">expect</span>(service.<span class="hljs-property">read</span>).<span class="hljs-title function_">toBe</span>(spy);
  <span class="hljs-title function_">expect</span>(service.<span class="hljs-title function_">read</span>()).<span class="hljs-title function_">toBe</span>(<span class="hljs-string">&#x27;真实结果&#x27;</span>);

  spy.<span class="hljs-title function_">mockRestore</span>();
  <span class="hljs-title function_">expect</span>(service.<span class="hljs-property">read</span>).<span class="hljs-title function_">toBe</span>(original);
});
</code></pre></div>
<p>mockClear 清除调用记录，保留当前实现；mockReset 还重置实现和一次性返回队列，但 spy 仍在对象上；mockRestore 对 spy 恢复原始属性。</p>
<p>对于 vi.fn()，重置后通常回到返回 undefined 的空实现；对于 vi.fn(impl)，当前 Vitest 会回到初始 impl。不能把其他测试工具或旧版本的 reset 规则直接套过来。独立 vi.fn 没有被 spy 替换的对象属性，因此 restore 也不是凭空找回某个真实业务方法。</p>
<h2>时间和全局替身更需要清理</h2>
<p>假定时器适合测试防抖、超时和重试，但推进计时器不一定等于相关 Promise、网络和组件更新都已经完成。应使用所选工具支持的异步推进方式，并等待可观察结果。</p>
<p>测试结束后恢复真实计时器、全局对象和 spy，避免后面的测试继承冻结时间或错误实现。清理应放在可靠的生命周期钩子或 finally 中，而不是只写在最后一条成功断言后面。</p>
<p>模块级 Mock 还可能有导入提升、模块缓存和 Browser Mode 限制。比如同一模块内部函数之间的直接调用，不一定会经过你替换的导出属性；不要为了绕过这一点就把所有私有函数都暴露成公共 API。</p>
<h2>模拟数据必须维护契约</h2>
<p>真实接口返回分页对象，Mock 却返回裸数组，可能让测试覆盖了一条根本不存在的成功路径。状态码、错误结构、空结果和字段类型都要与实际契约一致。</p>
<p>但模拟整个真实服务也不是目标。保留完成场景所需的语义，并用少量集成或契约测试确认接口没有分叉。依赖升级时，也要检查替身是否仍符合新版本行为。</p>
<p>判断是否 Mock 过度，可以问：真实依赖改错了，这个测试有机会失败吗？被替换的是不确定边界，还是正要验证的核心逻辑？前者有助于聚焦，后者常让测试产生虚假的安全感。</p>`};export{e as default};