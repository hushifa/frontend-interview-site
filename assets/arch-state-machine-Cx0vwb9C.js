var e={answerHtml:`<p>多个独立布尔值可以表达“加载中”“成功”“失败”，却也允许出现 <code>loading=true</code>、<code>success=true</code>、<code>error=true</code> 这种业务上不存在的组合。状态机的第一步不是安装库，而是先列出真实状态和能触发变化的事件：例如 <code>idle → loading → success</code>，失败时进入 <code>error</code>，重试时再回到 <code>loading</code>。</p>
<p>简单流程用可辨识联合或枚举就够了：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">RequestState</span>&lt;T&gt; =
  | { <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;idle&#x27;</span> }
  | { <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;loading&#x27;</span> }
  | { <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;success&#x27;</span>; <span class="hljs-attr">data</span>: T }
  | { <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;error&#x27;</span>; <span class="hljs-attr">message</span>: <span class="hljs-built_in">string</span> };
</code></pre></div>
<p>渲染代码可以根据 <code>status</code> 选择界面，而不是同时猜测多个布尔值。复杂流程还要考虑并行任务、超时、取消和重复事件；这时应画出每个事件在每个状态下的合法转换，并明确旧请求的结果是否仍有资格更新当前状态。</p>
<p>派生信息尽量从当前状态计算，避免把“是否显示重试按钮”“是否禁用提交”再复制成独立状态。状态机只能帮助表达转换，不能替代服务端权限、提交幂等、网络恢复和错误记录；这些边界仍应由相应层负责。</p>`};export{e as default};