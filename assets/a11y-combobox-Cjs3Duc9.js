var e={answerHtml:`<p>Combobox 是“可编辑输入框 + 可选结果列表”的组合控件。它的无障碍信息不能只靠一个 <code>role</code> 表达，而要让辅助技术知道输入框的名称、列表是否打开、列表在哪里以及当前键盘光标对应哪一个选项。一个最小的结构大致如下：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">label</span> <span class="hljs-attr">for</span>=<span class="hljs-string">&quot;city&quot;</span>&gt;</span>城市<span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">input</span>
  <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;city&quot;</span>
  <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;combobox&quot;</span>
  <span class="hljs-attr">aria-autocomplete</span>=<span class="hljs-string">&quot;list&quot;</span>
  <span class="hljs-attr">aria-expanded</span>=<span class="hljs-string">&quot;true&quot;</span>
  <span class="hljs-attr">aria-controls</span>=<span class="hljs-string">&quot;city-options&quot;</span>
  <span class="hljs-attr">aria-activedescendant</span>=<span class="hljs-string">&quot;city-option-0&quot;</span>
  <span class="hljs-attr">value</span>=<span class="hljs-string">&quot;北京&quot;</span>
&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">ul</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;city-options&quot;</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;listbox&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">li</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;city-option-0&quot;</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;option&quot;</span> <span class="hljs-attr">aria-selected</span>=<span class="hljs-string">&quot;true&quot;</span>&gt;</span>北京<span class="hljs-tag">&lt;/<span class="hljs-name">li</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">li</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;city-option-1&quot;</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;option&quot;</span> <span class="hljs-attr">aria-selected</span>=<span class="hljs-string">&quot;false&quot;</span>&gt;</span>北海<span class="hljs-tag">&lt;/<span class="hljs-name">li</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">ul</span>&gt;</span>
</code></pre></div>
<p><code>aria-expanded</code> 要随着弹层真实状态变化，<code>aria-controls</code> 要指向当前存在的列表，<code>aria-activedescendant</code> 则必须指向列表中可见且稳定的选项 ID。使用这种方式时，DOM 焦点仍然留在输入框，键盘移动的是“活动选项”；如果实现选择把焦点直接移到列表项，就必须另外处理焦点返回、Tab 离开和 Escape 关闭，不能两套方案混用。</p>
<p>键盘行为要形成完整闭环。输入框获得焦点后，用户应能用 ArrowDown 打开或移动到结果，用 ArrowUp 反向移动，用 Enter 确认当前选项，用 Escape 关闭列表并保留合理的输入值，Tab 则应按预期离开控件。具体按键细节要根据使用的 ARIA 模式和产品需求核对，但每个状态都要有可到达、可取消和可恢复的路径。</p>
<p>过滤结果是异步变化时，活动选项不能因为结果刷新而指向已经删除的节点。没有结果、正在加载、加载失败和结果过期都应该有明确的界面状态；如果列表内容会动态改变，还要避免在用户按下 Enter 的瞬间提交了旧结果。选中值、输入文本和当前活动项是三个不同概念，不应只用一个字符串状态代替它们。</p>
<p>如果需求只是从一组固定选项中选择，原生 <code>select</code> 通常更可靠，浏览器和辅助技术会替你处理大量键盘与焦点细节。只有确实需要搜索、异步结果或自定义交互时才值得实现 Combobox，并且要用键盘、触摸、鼠标和屏幕阅读器分别走完整流程；自动化检查通过，只能说明部分属性存在，不能证明控件真的可用。</p>`};export{e as default};