var e={answerHtml:`<h2>简答</h2>
<ul>
<li>Custom Elements 定义自定义元素及其生命周期。</li>
<li>Shadow DOM 提供内部 DOM 和样式的封装边界，但不是绝对隔离。</li>
<li>template 保存不直接渲染的片段，slot 分发 light DOM 内容而不是复制一份。</li>
<li>生命周期回调可能重复触发；attribute 和 property 是两种不同的接口。</li>
</ul>
<p>Web Components 是一组可组合的浏览器能力，不是一个强制配套使用的框架。Custom Elements 解决自定义元素身份与生命周期，Shadow DOM 解决内部树和样式封装，template 保存可复用的惰性片段，slot 则让外部内容参与组件展示。</p>
<p>可以定义自定义元素而不使用 Shadow DOM，也可以给合适的普通元素附加 shadow root，不必先创建自定义类。</p>
<h2>用一个小组件看各部分职责</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> template = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">createElement</span>(<span class="hljs-string">&#x27;template&#x27;</span>);
template.<span class="hljs-property">innerHTML</span> = <span class="hljs-string">\`
  &lt;style&gt;
    :host { display: inline-block; padding: 4px 8px; border: 1px solid currentColor; }
    strong { margin-inline-end: 4px; }
  &lt;/style&gt;
  &lt;strong&gt;&lt;/strong&gt;&lt;slot&gt;未提供内容&lt;/slot&gt;
\`</span>;

<span class="hljs-keyword">class</span> <span class="hljs-title class_">InfoBadge</span> <span class="hljs-keyword">extends</span> <span class="hljs-title class_ inherited__">HTMLElement</span> {
  <span class="hljs-keyword">static</span> observedAttributes = [<span class="hljs-string">&#x27;label&#x27;</span>];

  <span class="hljs-title function_">constructor</span>(<span class="hljs-params"></span>) {
    <span class="hljs-variable language_">super</span>();
    <span class="hljs-keyword">const</span> root = <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">attachShadow</span>({ <span class="hljs-attr">mode</span>: <span class="hljs-string">&#x27;open&#x27;</span> });
    root.<span class="hljs-title function_">append</span>(template.<span class="hljs-property">content</span>.<span class="hljs-title function_">cloneNode</span>(<span class="hljs-literal">true</span>));
  }

  <span class="hljs-title function_">connectedCallback</span>(<span class="hljs-params"></span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">updateLabel</span>();
  }

  <span class="hljs-title function_">attributeChangedCallback</span>(<span class="hljs-params"></span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">updateLabel</span>();
  }

  <span class="hljs-title function_">updateLabel</span>(<span class="hljs-params"></span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">shadowRoot</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;strong&#x27;</span>).<span class="hljs-property">textContent</span> = <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">getAttribute</span>(<span class="hljs-string">&#x27;label&#x27;</span>) ?? <span class="hljs-string">&#x27;&#x27;</span>;
  }
}

customElements.<span class="hljs-title function_">define</span>(<span class="hljs-string">&#x27;info-badge&#x27;</span>, <span class="hljs-title class_">InfoBadge</span>);
</code></pre></div>
<p>页面可以使用 <code>&lt;info-badge label=&quot;状态&quot;&gt;已完成&lt;/info-badge&gt;</code>。自定义名称包含连字符，注册后浏览器按类定义管理元素；template 的内容不会自己出现在页面上，clone 后才放入组件内部。</p>
<p>模板字符串在这里是开发者固定内容，动态 label 使用 textContent 写入。不能把任意外部文本拼入 innerHTML，再以“组件封装”为理由忽略注入风险。</p>
<h2>slot 分发内容，不是复制一份 DOM</h2>
<p>例子中的“已完成”仍是宿主元素的 light DOM 子节点，通过 slot 参与显示。没有分配内容时才显示 slot 的后备文字。</p>
<p>命名 slot 可以提供标题、操作区等插槽。slotchange 关注分配节点变化，不是所有已分配节点内部文字和后代变化的通用通知；需要更细变化时仍应使用对应状态或观察方式。</p>
<h2>封装不是绝对隔离</h2>
<p>普通外部选择器不会随意穿透到 shadow tree，内部样式也通常不会直接污染外部。但继承属性、CSS 自定义属性、宿主样式和显式开放的 part 仍可形成主题接口。</p>
<p>closed 模式主要限制通过 element.shadowRoot 获取根，并不是安全沙箱，也不适合藏密钥。组件脚本仍在页面执行环境中，不能把它当作隔离不可信代码的边界。</p>
<p>跨 shadow 边界的事件还涉及 bubbles、composed 和事件目标重定向。设计公共自定义事件时，应明确是否允许穿越边界及 detail 的结构；使用者看到的 target 不一定是内部最深层节点。</p>
<h2>生命周期可能重复发生</h2>
<p>connectedCallback 不表示“整个对象只初始化一次”。元素被移除再插入时可能再次连接，应避免重复安装全局监听或启动重复计时器。disconnectedCallback 中释放连接期资源，再次连接时按需恢复。</p>
<p>constructor 适合建立自身基础结构，不应假设外部子节点和属性已经全部准备完。异步工作也要处理断开后的迟到结果，不能只靠 DOM 移除自动取消网络或订阅。</p>
<h2>attribute 与 property 是两种接口</h2>
<p>HTML attribute 主要提供字符串或存在性信息，JavaScript property 可以承载对象和其他类型。二者不会自动双向同步，应明确转换、默认值和反射规则，避免属性更新互相递归。</p>
<p>复杂表单组件还要处理表单值、校验、禁用、焦点和无障碍语义，必要时使用 ElementInternals 等能力。自定义元素本身不会自动拥有 button、input 的全部行为。</p>
<p>跨框架复用的价值在于公开稳定的元素、属性、方法与事件契约；状态管理、SSR、版本与样式主题仍需工程设计，不能因为使用原生标签就认为这些问题自然消失。</p>`};export{e as default};