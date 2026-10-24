var e={answerHtml:`<p>点击“停止生成”至少可能涉及三层动作：前端停止追加文本，客户端中止当前 HTTP 请求，服务端再把断开信号传给上游模型调用。第一层一定可以做到，后两层取决于服务端是否感知断开、运行时是否传播 <code>AbortSignal</code>，以及模型 SDK 是否真的使用了这个信号。</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">const</span> controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();

<span class="hljs-keyword">try</span> {
  <span class="hljs-keyword">const</span> result = <span class="hljs-keyword">await</span> <span class="hljs-title function_">callModel</span>({ <span class="hljs-attr">signal</span>: controller.<span class="hljs-property">signal</span> });
  <span class="hljs-keyword">await</span> <span class="hljs-title function_">saveResult</span>(result);
} <span class="hljs-keyword">catch</span> (error) {
  <span class="hljs-keyword">if</span> (error <span class="hljs-keyword">instanceof</span> <span class="hljs-title class_">DOMException</span> &amp;&amp; error.<span class="hljs-property">name</span> === <span class="hljs-string">&#x27;AbortError&#x27;</span>) {
    <span class="hljs-keyword">await</span> <span class="hljs-title function_">savePartialResult</span>();
  } <span class="hljs-keyword">else</span> {
    <span class="hljs-keyword">throw</span> error;
  }
}

<span class="hljs-comment">// 用户点击停止按钮时调用</span>
controller.<span class="hljs-title function_">abort</span>();
</code></pre></div>
<p>这段代码只能表达应用自己的取消边界，不能保证模型供应商已经停止计算，也不能撤销已经发生的工具副作用。因此页面应区分“用户主动取消”“网络断开”和“服务端失败”，并说明已经显示的部分结果是否会保存。按钮重新可点击，不等于服务端已经停止计费或执行。</p>
<p>如果一次生成已经调用了写数据库、发邮件或删除文件等工具，取消后只能阻止后续步骤；已经完成的副作用需要通过业务补偿、状态查询或人工处理恢复。要支持关闭页面后继续生成并在之后恢复，还需要把任务、步骤和部分结果持久化，不能只依赖当前浏览器连接。</p>
<p>具体 SDK 的中止、恢复和流式重连能力会随版本和运行环境变化。使用前要核对它对断开信号的传播方式，并在真实的断网、刷新、重复点击和服务端超时场景下验证状态，而不是只测试一个停止按钮的视觉反馈。</p>`};export{e as default};