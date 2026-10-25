var e={answerHtml:`<p>MutationObserver 观察 DOM 发生了什么修改：新增或删除节点、属性变化、文本节点数据变化。ResizeObserver 则观察元素盒尺寸变化。它们关注的不是同一类事实。</p>
<p>例如给节点加一个无视觉作用的 data 属性，会产生 DOM mutation，但尺寸不一定变化；父容器宽度改变、字体加载或图片尺寸确定，可能让子元素变宽，却没有修改该子元素的 DOM 属性。</p>
<h3>明确自己需要哪一种记录</h3>
<p>childList 关注子节点增删，attributes 关注属性，characterData 关注文本节点等字符数据；subtree 把观察范围扩展到后代。至少需要启用一种有效变化类型，不能只传 subtree: true 却不选择观察内容。</p>
<p>下面只观察外部控件的状态属性：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">watchWidgetState</span>(<span class="hljs-params">element, onState</span>) {
  <span class="hljs-keyword">const</span> observer = <span class="hljs-keyword">new</span> <span class="hljs-title class_">MutationObserver</span>(<span class="hljs-function">(<span class="hljs-params">records</span>) =&gt;</span> {
    <span class="hljs-keyword">if</span> (records.<span class="hljs-title function_">some</span>(<span class="hljs-function">(<span class="hljs-params">record</span>) =&gt;</span> record.<span class="hljs-property">attributeName</span> === <span class="hljs-string">&#x27;data-state&#x27;</span>)) {
      <span class="hljs-title function_">onState</span>(element.<span class="hljs-title function_">getAttribute</span>(<span class="hljs-string">&#x27;data-state&#x27;</span>));
    }
  });
  observer.<span class="hljs-title function_">observe</span>(element, {
    <span class="hljs-attr">attributes</span>: <span class="hljs-literal">true</span>,
    <span class="hljs-attr">attributeFilter</span>: [<span class="hljs-string">&#x27;data-state&#x27;</span>],
  });
  <span class="hljs-title function_">onState</span>(element.<span class="hljs-title function_">getAttribute</span>(<span class="hljs-string">&#x27;data-state&#x27;</span>));
  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> observer.<span class="hljs-title function_">disconnect</span>();
}
</code></pre></div>
<p>显式报告初始值，因为 observe 不会自动补发之前的修改。attributeFilter 缩小范围，避免控件大量无关 class 或样式更新都触发业务处理。</p>
<p>如果自己就拥有这个控件的状态，优先通过正常状态流通知，不必先写 DOM 再反向观察。观察器更适合第三方控件、外部脚本或不受当前框架直接管理的 DOM 边界。</p>
<h3>回调不是每次赋值时同步执行</h3>
<p>MutationObserver 通知在相应微任务检查过程中交付，多次修改可能在一次回调中形成多个记录。它既不是同步事件监听，也不是保证等到下一帧才调用。</p>
<p>如果同一属性从 a 变成 b 再变成 c，回调里读取 getAttribute 通常看到当前最终值。需要旧值时可配置 attributeOldValue，但 MutationRecord 不提供一个通用的 newValue 字段；要分清记录描述的变化与当前 DOM 状态。</p>
<p>示例只关心最终状态，因此用 records.some 后读取一次。如果业务真的需要逐步审计，应另行设计记录方式，而不是假设每个 mutation 回调都对应一笔独立业务操作。</p>
<h3>文本更新不一定产生 characterData</h3>
<p>修改已有文本节点的 data 可以产生 characterData 记录；给元素设置 textContent 可能替换它的子节点，表现为 childList。观察“文字变化”时，应根据实际修改方式选择配置。</p>
<p>subtree 会扩大通知范围。若只是监控一个局部容器，不应直接观察整个 document 并在每次回调里重新扫描全页。大页面上的高频变更容易把观察成本变成新的性能问题。</p>
<h3>回调中的写操作可能触发下一轮通知</h3>
<p>若回调总是修改自己观察的属性，可能不断产生新的记录。应该先比较目标值，只有需要时才写入，或者将输出与观察区域分离。</p>
<p>临时 disconnect 再修改也需要谨慎，因为期间的真实外部变化可能被漏掉。单纯加一个布尔标记，并不自动解决异步交付与多轮更新的全部问题；最好让更新逻辑本身幂等、能够收敛。</p>
<p>清理时 disconnect 停止观察并丢弃相应待处理通知；若最后一批记录有必须处理的意义，可先 takeRecords 取出并按业务处理，再断开。不要为了“完整记录”在销毁后继续操作已经无效的组件。</p>
<p>最后，MutationObserver 不负责属性对象的任意 JavaScript 赋值。比如输入框 value 属性变化不一定修改 HTML attribute，应使用输入事件或组件状态。选 API 时先确定要观察的是 DOM 结构、用户输入还是布局尺寸，再选择对应机制。</p>`};export{e as default};