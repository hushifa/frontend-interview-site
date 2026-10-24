var e={answerHtml:`<p><code>useEffect</code> 用于在提交之后与网络、事件监听等外部系统同步。依赖应包含 Effect 使用的所有响应式值。依赖变化时，React 先运行旧清理，再执行新设置；卸载时也会清理。</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-title function_">useEffect</span>(<span class="hljs-function">() =&gt;</span> {
  <span class="hljs-keyword">const</span> controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
  <span class="hljs-title function_">fetch</span>(url, { <span class="hljs-attr">signal</span>: controller.<span class="hljs-property">signal</span> })
    .<span class="hljs-title function_">catch</span>(<span class="hljs-function"><span class="hljs-params">error</span> =&gt;</span> {
      <span class="hljs-keyword">if</span> (error.<span class="hljs-property">name</span> !== <span class="hljs-string">&quot;AbortError&quot;</span>) <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">error</span>(error);
    });
  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> controller.<span class="hljs-title function_">abort</span>();
}, [url]);
</code></pre></div>
<p>开发环境的 Strict Mode 可能额外执行一次设置与清理，以暴露遗漏。不要用删除依赖的方式绕开检查。仅根据已有状态计算的值，通常可以在渲染中直接计算。</p>
<h3>复习提示</h3>
<p>回答时先说明渲染、状态和副作用分别由谁负责，再谈 Hook 或并发机制。具体行为要锁定 React 版本，并说明组件卸载、重复渲染和错误处理等边界。建议用一个最小示例验证“useEffect、副作用、清理”，再比较正常路径、失败路径和目标运行环境的差异。</p>`};export{e as default};